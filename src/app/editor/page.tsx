'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ToastManager'
import { Upload, Download, FileText, Settings, Palette, History, Edit3, Save, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import { Template, getAllTemplates } from '@/data/templates'

// 导入TinyMCE
import { Editor } from '@tinymce/tinymce-react'

// 动态导入PDF.js worker
let pdfjsWorkerLoaded = false
if (typeof window !== 'undefined' && !pdfjsWorkerLoaded) {
  pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
    'pdfjs-dist/build/pdf.worker.min.mjs',
    import.meta.url
  ).toString()
  pdfjsWorkerLoaded = true
}

// 使用共享的模板数据和接口

export default function EditorPage() {
  const searchParams = useSearchParams()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  
  // 状态变量
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [content, setContent] = useState('') // 左侧文本编辑区域的内容
  const [templateSearchQuery, setTemplateSearchQuery] = useState('')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  const [isEditMode, setIsEditMode] = useState(false)

  const templateScrollRef = useRef<HTMLDivElement>(null)

  // PDF编辑器独立状态 - 与左侧文本编辑区域完全分离
  const [pdfEditorContent, setPdfEditorContent] = useState('') // PDF编辑器的独立内容
  const [originalPdfContent, setOriginalPdfContent] = useState('') // 保存PDF的原始内容
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const editorRef = useRef<any>(null)

  // 获取所有模板
  const allTemplates = getAllTemplates()
  
  // 过滤模
  const filteredTemplates = useMemo(() => {
    if (!templateSearchQuery.trim()) {
      return allTemplates
    }
    return allTemplates.filter(template => 
      template.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(templateSearchQuery.toLowerCase())
    )
  }, [templateSearchQuery, allTemplates])

  // 初始化：从URL参数获取模板ID
  useEffect(() => {
    const templateId = searchParams.get('template')
    if (templateId) {
      const template = allTemplates.find(t => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
      }
    }
  }, [searchParams, allTemplates])

  // 监听pdfEditorContent变化，确保编辑器内容同步
  useEffect(() => {
    if (editorRef.current && pdfEditorContent) {
      // 只有当编辑器内容与状态不一致时才更新
      const currentContent = editorRef.current.getContent()
      if (currentContent !== pdfEditorContent) {
        editorRef.current.setContent(pdfEditorContent)
      }
    }
  }, [pdfEditorContent])

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    // 清除之前生成的PDF
    if (generatedPdfUrl) {
      URL.revokeObjectURL(generatedPdfUrl)
      setGeneratedPdfUrl(null)
    }
    setIsEditMode(false)
  }

  // 读取纯文本文件
  const readTextFile = async (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (event) => {
        const text = event.target?.result as string
        resolve(text)
      }
      reader.onerror = () => reject(new Error('文本文件读取失败'))
      reader.readAsText(file, 'UTF-8')
    })
  }

  // 读取PDF文件 - 增强版本，生成完整的HTML和CSS结构
  const readPdfFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      // 生成完整的HTML结构，包含CSS样式
       let htmlContent = `
          <style>
            .pdf-container {
              width: 100%;
              max-width: 100%;
              margin: 0;
              font-family: Arial, sans-serif;
              background: transparent;
              padding: 20px;
              box-sizing: border-box;
            }
            .pdf-page {
              width: 100%;
              min-height: 100%;
              margin: 0;
              background: white;
              position: relative;
              padding: 0;
              box-sizing: border-box;
              overflow: visible;
            }
          .pdf-text-item {
            display: inline;
            line-height: 1.4;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .pdf-paragraph {
            margin: 0 0 12px 0;
            line-height: 1.4;
          }
          .pdf-title {
            font-weight: bold;
            margin: 16px 0 12px 0;
          }
          .pdf-heading-1 {
            font-size: 24px;
            font-weight: bold;
            margin: 20px 0 16px 0;
            color: #333;
          }
          .pdf-heading-2 {
            font-size: 20px;
            font-weight: bold;
            margin: 18px 0 14px 0;
            color: #444;
          }
          .pdf-heading-3 {
            font-size: 16px;
            font-weight: bold;
            margin: 16px 0 12px 0;
            color: #555;
          }
        </style>
        <div class="pdf-container">`

      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const viewport = page.getViewport({ scale: 1.5 }) // 提高分辨率
        
        // 获取文本内容和操作指令
        const [textContent, operatorList] = await Promise.all([
          page.getTextContent(),
          page.getOperatorList()
        ])
        
        const textItems = textContent.items as Array<{
          str: string;
          transform: number[];
          fontName: string;
          [key: string]: unknown;
        }>
        
        // 构建颜色映射表
        const colorMap = new Map<number, string>()
        let currentColor = '#000000'
        
        // 解析操作指令以提取颜色信息
        for (let j = 0; j < operatorList.fnArray.length; j++) {
          const fn = operatorList.fnArray[j]
          const args = operatorList.argsArray[j]
          
          // 检测颜色设置指令
          if (fn === 25 || fn === 26) { // setFillRGBColor, setStrokeRGBColor
            if (args && args.length >= 3) {
              const r = Math.round(args[0] * 255)
              const g = Math.round(args[1] * 255)
              const b = Math.round(args[2] * 255)
              currentColor = `rgb(${r}, ${g}, ${b})`
            }
          } else if (fn === 23 || fn === 24) { // setFillGray, setStrokeGray
            if (args && args.length >= 1) {
              const gray = Math.round(args[0] * 255)
              currentColor = `rgb(${gray}, ${gray}, ${gray})`
            }
          } else if (fn === 27 || fn === 28) { // setFillCMYKColor, setStrokeCMYKColor
            if (args && args.length >= 4) {
              const c = args[0]
              const m = args[1]
              const y = args[2]
              const k = args[3]
              const r = Math.round(255 * (1 - c) * (1 - k))
              const g = Math.round(255 * (1 - m) * (1 - k))
              const b = Math.round(255 * (1 - y) * (1 - k))
              currentColor = `rgb(${r}, ${g}, ${b})`
            }
          }
          
          colorMap.set(j, currentColor)
        }

        // 开始页面容器和第一个段落
        htmlContent += `<div class="pdf-page" data-page="${pageNum}"><p class="pdf-paragraph">`
        
        // 按Y坐标排序文本项并分组为行
        const sortedItems = textItems.sort((a, b) => {
          const yDiff = Math.abs(a.transform[5] - b.transform[5])
          if (yDiff < 3) {
            return a.transform[4] - b.transform[4] // 同一行按x坐标排序
          }
          return b.transform[5] - a.transform[5] // 按y坐标排序（从上到下）
        })
        
        // 将文本项分组为行
        const textLines: typeof textItems[] = []
        let currentLine: typeof textItems = []
        let lastY = -1
        
        for (const item of sortedItems) {
          const currentY = item.transform[5]
          if (lastY !== -1 && Math.abs(currentY - lastY) > 3) {
            if (currentLine.length > 0) {
              textLines.push(currentLine)
              currentLine = []
            }
          }
          currentLine.push(item)
          lastY = currentY
        }
        if (currentLine.length > 0) {
          textLines.push(currentLine)
        }
        
        // 提取字体信息
        const fontMap = new Map()
        if (textContent.styles) {
          Object.entries(textContent.styles).forEach(([fontId, fontData]: [string, any]) => {
            fontMap.set(fontId, fontData)
          })
        }
        
        // 处理每个文本项，保持精确定位和样式
        for (let i = 0; i < textItems.length; i++) {
          const item = textItems[i]
          if (!item.str || item.str.trim() === '') continue
          
          // 获取变换矩阵信息
          const transform = item.transform
          const x = transform[4] // X坐标
          const y = viewport.height - transform[5] // Y坐标（PDF坐标系转换为HTML坐标系）
          const scaleX = transform[0] // X方向缩放
          const scaleY = transform[3] // Y方向缩放
          const skewX = transform[1] // X方向倾斜
          const skewY = transform[2] // Y方向倾斜
          
          // 计算字体大小
          const fontSize = Math.abs(scaleY) || 12
          
          // 获取字体信息
          let fontFamily = 'Arial'
          let fontWeight = 'normal'
          let fontStyle = 'normal'
          
          try {
            const fontObj = page.commonObjs.get(item.fontName)
            if (fontObj && fontObj.name) {
              // 更精确的字体名称处理
              let cleanFontName = fontObj.name
                .replace(/[+]/g, '')
                .replace(/,.*$/, '') // 移除逗号后的内容
                .replace(/[-_]/g, ' ') // 将连字符和下划线替换为空格
                .trim()
              
              // 提取基础字体族名称
              const baseFontName = cleanFontName.split(' ')[0]
              
              // 更全面的字体族映射
              const fontFamilyMap: { [key: string]: string } = {
                'Times': 'Times New Roman, Times, serif',
                'TimesNewRoman': 'Times New Roman, Times, serif',
                'Helvetica': 'Helvetica, Arial, sans-serif',
                'Arial': 'Arial, Helvetica, sans-serif',
                'Courier': 'Courier New, Courier, monospace',
                'CourierNew': 'Courier New, Courier, monospace',
                'Calibri': 'Calibri, Arial, sans-serif',
                'Verdana': 'Verdana, Arial, sans-serif',
                'Georgia': 'Georgia, Times, serif',
                'Tahoma': 'Tahoma, Arial, sans-serif',
                'SimSun': 'SimSun, "宋体", serif',
                'SimHei': 'SimHei, "黑体", sans-serif',
                'Microsoft': 'Microsoft YaHei, "微软雅黑", sans-serif',
                'PingFang': 'PingFang SC, "苹方", sans-serif'
              }
              
              // 查找匹配的字体族
              fontFamily = fontFamilyMap[baseFontName] || fontFamilyMap[cleanFontName] || `"${cleanFontName}", Arial, sans-serif`
              
              // 更精确的字体样式识别
              const fullFontName = fontObj.name.toLowerCase()
              if (fullFontName.includes('bold') || fullFontName.includes('black') || fullFontName.includes('heavy') || fullFontName.includes('extrabold')) {
                fontWeight = 'bold'
              } else if (fullFontName.includes('light') || fullFontName.includes('thin')) {
                fontWeight = '300'
              } else if (fullFontName.includes('medium')) {
                fontWeight = '500'
              } else if (fullFontName.includes('semibold')) {
                fontWeight = '600'
              }
              
              if (fullFontName.includes('italic') || fullFontName.includes('oblique')) {
                fontStyle = 'italic'
              }
            }
          } catch (e) {
            // 使用默认字体处理逻辑
            if (item.fontName) {
              const fontName = item.fontName.toLowerCase()
              
              // 更全面的字体族识别
              if (fontName.includes('times')) {
                fontFamily = 'Times New Roman, Times, serif'
              } else if (fontName.includes('helvetica')) {
                fontFamily = 'Helvetica, Arial, sans-serif'
              } else if (fontName.includes('arial')) {
                fontFamily = 'Arial, Helvetica, sans-serif'
              } else if (fontName.includes('courier')) {
                fontFamily = 'Courier New, Courier, monospace'
              } else if (fontName.includes('calibri')) {
                fontFamily = 'Calibri, Arial, sans-serif'
              } else if (fontName.includes('verdana')) {
                fontFamily = 'Verdana, Arial, sans-serif'
              } else if (fontName.includes('georgia')) {
                fontFamily = 'Georgia, Times, serif'
              } else if (fontName.includes('simsun') || fontName.includes('宋体')) {
                fontFamily = 'SimSun, "宋体", serif'
              } else if (fontName.includes('simhei') || fontName.includes('黑体')) {
                fontFamily = 'SimHei, "黑体", sans-serif'
              } else if (fontName.includes('microsoft') || fontName.includes('微软雅黑')) {
                fontFamily = 'Microsoft YaHei, "微软雅黑", sans-serif'
              }
              
              // 字体样式识别
              if (fontName.includes('bold') || fontName.includes('black') || fontName.includes('heavy')) {
                fontWeight = 'bold'
              } else if (fontName.includes('light') || fontName.includes('thin')) {
                fontWeight = '300'
              }
              
              if (fontName.includes('italic') || fontName.includes('oblique')) {
                fontStyle = 'italic'
              }
            }
          }

          // 获取文本颜色
          let color = '#000000'
          if (item.color) {
            if (Array.isArray(item.color)) {
              if (item.color.length === 1) {
                // 灰度
                const gray = Math.round(item.color[0] * 255)
                color = `rgb(${gray}, ${gray}, ${gray})`
              } else if (item.color.length === 3) {
                // RGB
                const r = Math.round(item.color[0] * 255)
                const g = Math.round(item.color[1] * 255)
                const b = Math.round(item.color[2] * 255)
                color = `rgb(${r}, ${g}, ${b})`
              } else if (item.color.length === 4) {
                // CMYK
                const c = item.color[0]
                const m = item.color[1]
                const y = item.color[2]
                const k = item.color[3]
                const r = Math.round(255 * (1 - c) * (1 - k))
                const g = Math.round(255 * (1 - m) * (1 - k))
                const b = Math.round(255 * (1 - y) * (1 - k))
                color = `rgb(${r}, ${g}, ${b})`
              }
            }
          } else {
            // 从操作指令中获取颜色
            for (const [pos, clr] of colorMap.entries()) {
              if (pos <= i) {
                color = clr
              }
            }
          }

          // 转义HTML特殊字符
          const escapedText = (item.str || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;')

          // 构建变换矩阵CSS
          let transformCSS = ''
          if (skewX !== 0 || skewY !== 0 || scaleX !== fontSize || Math.abs(scaleY) !== fontSize) {
            transformCSS = `transform: matrix(${scaleX/fontSize}, ${skewY/fontSize}, ${skewX/fontSize}, ${Math.abs(scaleY)/fontSize}, 0, 0);`
          }
          
          // 检查是否是行末（下一个文本项在新行）
          let isLineEnd = false
          let shouldAddParagraph = false
          
          if (i < textItems.length - 1) {
            const nextItem = textItems[i + 1]
            const currentY = item.transform[5]
            const nextY = nextItem.transform[5]
            
            // 如果下一个文本项的Y坐标不同，说明当前项是行末
            if (Math.abs(currentY - nextY) > 3) {
              isLineEnd = true
              
              // 如果Y坐标差距较大，可能是段落分隔
              if (Math.abs(currentY - nextY) > fontSize * 1.5) {
                shouldAddParagraph = true
              }
            }
          } else {
            // 最后一个文本项
            isLineEnd = true
          }
          
          // 生成文本项HTML，使用流式布局自适应容器宽度
          htmlContent += `<span class="pdf-text-item" style="
              font-size: ${Math.max(fontSize * 0.75, 12)}px;
              font-family: '${fontFamily}', Arial, sans-serif;
              font-weight: ${fontWeight};
              font-style: ${fontStyle};
              color: ${color};
            ">${escapedText}</span>`
          
          // 在行末添加适当的换行或段落分隔
          if (isLineEnd) {
            if (shouldAddParagraph) {
              htmlContent += '</p><p class="pdf-paragraph">'
            } else {
              htmlContent += '<br/>'
            }
          } else {
            htmlContent += ' '
          }
        }
        
        // 尝试提取图片
        try {
          for (let j = 0; j < operatorList.fnArray.length; j++) {
            const fn = operatorList.fnArray[j]
            if (fn === 92) { // paintImageXObject
              const args = operatorList.argsArray[j]
              if (args && args.length > 0) {
                const imageName = args[0]
                try {
                  const imageObj = page.objs.get(imageName)
                  if (imageObj && imageObj.width && imageObj.height) {
                    // 创建canvas来渲染图片
                    const canvas = document.createElement('canvas')
                    const ctx = canvas.getContext('2d')
                    if (ctx) {
                      canvas.width = imageObj.width
                      canvas.height = imageObj.height
                      
                      // 渲染图片数据
                      if (imageObj.data) {
                        const imageData = ctx.createImageData(imageObj.width, imageObj.height)
                        imageData.data.set(new Uint8ClampedArray(imageObj.data))
                        ctx.putImageData(imageData, 0, 0)
                        
                        // 转换为base64
                        const dataURL = canvas.toDataURL()
                        htmlContent += `<img src="${dataURL}" style="position: absolute; max-width: 100%; height: auto;" alt="PDF图片" />`
                      }
                    }
                  }
                } catch (imgError) {
                  console.warn('图片提取失败:', imgError)
                }
              }
            }
          }
        } catch (e) {
          console.warn('图片处理出错:', e)
        }
        
        // 结束段落和页面容器
         htmlContent += '</p></div>'
       }

       // 闭合容器标签
        htmlContent += '</div>'
 
        return htmlContent
    } catch (error) {
      console.error('PDF解析错误:', error)
      throw new Error('PDF文件解析失败')
    }
  }
          


  // 读取DOCX文件
  const readDocxFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const result = await mammoth.extractRawText({ arrayBuffer })
      return result.value
    } catch (error) {
      throw new Error('Word文档解析失败')
    }
  }

  // 解析文件内容的主函数
  const parseFileContent = async (file: File): Promise<string> => {
    try {
      let extractedContent = ''
      
      if (file.type === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
        extractedContent = await readPdfFile(file)
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.toLowerCase().endsWith('.docx')) {
        extractedContent = await readDocxFile(file)
      } else if (file.type === 'application/msword' || file.name.toLowerCase().endsWith('.doc')) {
        throw new Error('不支持.doc格式，请使用.docx格式')
      } else if (file.type === 'text/plain' || file.name.toLowerCase().endsWith('.txt')) {
        extractedContent = await readTextFile(file)
      } else if (file.type === 'application/json' || file.name.endsWith('.json')) {
        const jsonContent = await file.text()
        try {
          const parsed = JSON.parse(jsonContent)
          extractedContent = JSON.stringify(parsed, null, 2)
        } catch {
          extractedContent = jsonContent
        }
      } else if (file.type.startsWith('text/') || file.name.match(/\.(md|csv|xml|html|css|js|ts|jsx|tsx)$/i)) {
        extractedContent = await file.text()
      } else {
        try {
          extractedContent = await file.text()
        } catch {
          throw new Error(`不支持的文件格式：${file.type || '未知格式'}。请上传文本文件。`)
        }
      }
      
      return extractedContent
    } catch (error) {
      console.error('文件解析失败:', error)
      throw error
    }
  }

  // 处理文件上传
  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    try {
      showInfo(`正在解析文件 ${file.name}...`)
      const extractedContent = await parseFileContent(file)
      
      if (extractedContent.trim()) {
        // 只填充到左侧文本编辑区域，不影响PDF编辑器
        setContent(extractedContent)
        // 如果还没有选择模板，自动选择第一个模板
        if (!selectedTemplate && allTemplates.length > 0) {
          setSelectedTemplate(allTemplates[0])
        }
        showSuccess(`文件 ${file.name} 上传成功，内容已填充到左侧文本编辑区域`)
      } else {
        showWarning(`文件 ${file.name} 上传成功，但未检测到文本内容`)
      }
    } catch (error) {
      console.error('文件解析错误:', error)
      showError(`文件解析失败：${error instanceof Error ? error.message : '未知错误'}`)
    }
  }

  // 处理拖拽文件上传
  const handleFileDrop = async (files: File[]) => {
    if (files.length === 0) return
    
    const file = files[0]
    try {
      showInfo(`正在解析文件 ${file.name}...`)
      const extractedContent = await parseFileContent(file)
      
      if (extractedContent.trim()) {
        // 只填充到左侧文本编辑区域，不影响PDF编辑器
        setContent(extractedContent)
        // 如果还没有选择模板，自动选择第一个模板
        if (!selectedTemplate && allTemplates.length > 0) {
          setSelectedTemplate(allTemplates[0])
        }
        showSuccess(`文件 ${file.name} 解析成功，内容已填充到左侧文本编辑区域`)
      } else {
        showWarning(`文件 ${file.name} 解析成功，但未提取到文本内容`)
      }
    } catch (error) {
      showError(error instanceof Error ? error.message : '文件解析失败')
    }
  }

  // 进入编辑模式 - 保持PDF编辑器的原有内容
  // TinyMCE现在使用React组件，不需要手动初始化

  // 模板滑动控制函数
  const scrollTemplates = (direction: 'left' | 'right') => {
    if (templateScrollRef.current) {
      const scrollAmount = 256 // 滑动距离，约2个模板的宽度
      const currentScroll = templateScrollRef.current.scrollLeft
      const targetScroll = direction === 'left' 
        ? currentScroll - scrollAmount 
        : currentScroll + scrollAmount
      
      templateScrollRef.current.scrollTo({
        left: targetScroll,
        behavior: 'smooth'
      })
    }
  }

  // 生成PDF

  const handleGeneratePDF = async () => {
    if (!selectedTemplate || !content.trim()) {
      showError('请选择模板并输入内容')
      return
    }

    setIsGenerating(true)
    
    try {
      const response = await fetch('/api/generate-pdf-puppeteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: selectedTemplate.title,
          content: isEditMode ? pdfEditorContent.replace(/<[^>]*>/g, '') : content, // 编辑模式使用PDF编辑器内容，否则使用左侧文本内容
          template: 'business', // 使用默认模板类型
          template_content: selectedTemplate.template_content,
          language: 'zh-CN'
        }),
      })

      if (!response.ok) {
        throw new Error(`生成失败: ${response.status}`)
      }

      // 解析JSON响应
      const result = await response.json()
      
      if (!result.success || !result.pdfUrl) {
        throw new Error(result.error || 'PDF生成失败')
      }
      
      // 清除之前的URL
      if (generatedPdfUrl) {
        URL.revokeObjectURL(generatedPdfUrl)
      }
      
      // 直接使用API返回的data URL
      setGeneratedPdfUrl(result.pdfUrl)
      
      // 如果不是编辑模式，才需要解析PDF并进入编辑模式
      if (!isEditMode) {
        // 保存原始内容用于备份
        setOriginalPdfContent(content)
        
        // 获取生成的PDF内容并解析为HTML格式用于编辑
        try {
          // 将PDF URL转换为File对象并解析
          const pdfResponse = await fetch(result.pdfUrl)
          const pdfBlob = await pdfResponse.blob()
          const pdfFile = new File([pdfBlob], 'generated.pdf', { type: 'application/pdf' })
          const pdfHtmlContent = await readPdfFile(pdfFile)
          setPdfEditorContent(pdfHtmlContent)
        } catch (parseError) {
          console.warn('PDF解析失败，使用原始内容:', parseError)
          setPdfEditorContent(content)
        }
        
        // 生成完成后直接进入编辑模式
        setIsEditMode(true)
      }
      // 如果已经在编辑模式，保持当前编辑器内容不变，只更新PDF URL
      
      showSuccess('PDF生成完成，已进入编辑模式！')
      
    } catch (error) {
      console.error('PDF生成失败:', error)
      showError(`PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // 下载PDF
  const handleDownloadPDF = async () => {
    if (!generatedPdfUrl || !selectedTemplate) {
      showError('没有可下载的PDF文件')
      return
    }

    try {
      // 如果是data URL，需要转换为blob
      if (generatedPdfUrl.startsWith('data:')) {
        const response = await fetch(generatedPdfUrl)
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        const link = document.createElement('a')
        link.href = url
        link.download = `${selectedTemplate.title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理临时URL
        URL.revokeObjectURL(url)
      } else {
        // 如果是普通URL，直接下载
        const link = document.createElement('a')
        link.href = generatedPdfUrl
        link.download = `${selectedTemplate.title}_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
      }
      
      showSuccess('PDF下载成功！')
    } catch (error) {
      console.error('PDF下载失败:', error)
      showError('PDF下载失败')
    }
  }

  return (
    <div className="min-h-screen w-full max-w-full bg-gray-50 flex flex-col lg:flex-row overflow-x-hidden">
      {/* 左侧导航栏 */}
      <div className="w-full lg:w-16 bg-gray-800 flex lg:flex-col items-center py-2 lg:py-4 space-x-4 lg:space-x-0 lg:space-y-4 overflow-x-auto lg:overflow-x-visible">
        <Link href="/templates" className="p-2 text-gray-400 hover:text-white transition-colors">
          <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
        </Link>
        <div className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <History className="w-6 h-6" />
        </div>
        <div className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <Settings className="w-6 h-6" />
        </div>
        <div className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <Palette className="w-6 h-6" />
        </div>
        <div className="p-2 text-gray-400 hover:text-white transition-colors cursor-pointer">
          <Download className="w-6 h-6" />
        </div>
      </div>

      {/* 主内容区域 */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* 顶部导航 */}
        <nav className="bg-white border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold text-gray-900">PDF编辑器</h1>
            <div className="text-sm text-gray-600">
              {selectedTemplate ? `当前模板：${selectedTemplate.title}` : '未选择模板'}
            </div>
          </div>
        </nav>

        {/* 模板选择区域 */}
        <div className="bg-white border-b border-gray-200 px-4 xl:px-6 py-4 overflow-hidden">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between mb-4 space-y-2 sm:space-y-0">
            <h2 className="text-lg font-semibold text-gray-900">选择模板</h2>
            <div className="flex items-center space-x-4 w-full sm:w-auto">
              <input
                type="text"
                placeholder="搜索模板..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="flex-1 sm:flex-none px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>
          
          <div className="relative">
            {/* 左滑动按钮 */}
            <button
              onClick={() => scrollTemplates('left')}
              className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-1 sm:p-2 hover:bg-gray-50 transition-colors"
              style={{ marginTop: '-8px' }} // 调整位置以适应滚动条
            >
              <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            
            {/* 右滑动按钮 */}
            <button
              onClick={() => scrollTemplates('right')}
              className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-lg rounded-full p-1 sm:p-2 hover:bg-gray-50 transition-colors"
              style={{ marginTop: '-8px' }} // 调整位置以适应滚动条
            >
              <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600" />
            </button>
            
            <div 
              ref={templateScrollRef}
              className="flex space-x-4 overflow-x-auto overflow-y-hidden pb-2 mx-8 sm:mx-12"
              style={{
                scrollbarWidth: 'thin',
                scrollbarColor: '#CBD5E0 #F7FAFC',
                WebkitOverflowScrolling: 'touch',
                width: '100%',
                minWidth: 0 // 防止flex容器被内容撑开
              }}
            >
              {filteredTemplates.map((template) => (
                <div
                  key={template.id}
                  onClick={() => handleTemplateSelect(template)}
                  className={`flex-shrink-0 cursor-pointer p-3 rounded-lg border-2 transition-all ${
                    selectedTemplate?.id === template.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  style={{
                    width: '128px', // 固定宽度，相当于w-32
                    minWidth: '128px' // 确保不会被压缩
                  }}
                >
                  <div className="aspect-[3/4] bg-gray-100 rounded mb-2 flex items-center justify-center">
                    <span className="text-xs text-gray-500 text-center px-1 leading-tight">{template.title}</span>
                  </div>
                  <p className="text-xs text-center text-gray-600 truncate">{template.category}</p>
                </div>
              ))}
            </div>
            <style jsx>{`
              div::-webkit-scrollbar {
                height: 8px;
              }
              div::-webkit-scrollbar-track {
                background: #f1f5f9;
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb {
                background: #cbd5e0;
                border-radius: 4px;
              }
              div::-webkit-scrollbar-thumb:hover {
                background: #94a3b8;
              }
            `}</style>
          </div>
        </div>

        {/* 主工作区域 */}
        <div className="flex-1 flex flex-col xl:flex-row min-w-0 overflow-hidden">
          {/* 左侧内容输入区域 */}
          <div className="w-full xl:w-1/3 bg-white border-r-0 xl:border-r border-gray-200 border-b xl:border-b-0 p-4 xl:p-6 flex flex-col min-h-[50vh] xl:min-h-0">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-900" style={{ width: '500px', textAlign: 'left' }}>内容输入</h3>
            </div>
            
            {/* 文件上传区域 */}
            <div className="mb-4">
              <div style={{ width: '500px' }}>
              <div 
                className="border-2 border-dashed border-gray-300 rounded-lg p-3 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={(e) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files)
                  handleFileDrop(files)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="flex items-center justify-center space-x-2">
                  <Upload className="w-5 h-5 text-gray-400" />
                  <span className="text-sm text-gray-600">拖拽或点击上传文件</span>
                </div>
                <input
                  id="file-input"
                  type="file"
                  className="hidden"
                  onChange={handleFileUpload}
                  accept=".pdf,.doc,.docx,.txt,.json,.md,.csv,.xml,.html,.css,.js,.ts,.jsx,.tsx"
                />
              </div>
              </div>
            </div>

            {/* 文本输入区域 */}
             <div className="mb-6 flex-1 flex flex-col">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 文本内容
               </label>
               <textarea
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder={content ? "" : "拖拽文件到此处自动解析内容，或直接输入文本...\n\n示例内容：\n— 项目TO DO\n— 文档修改记录\n\n1.背景\n商家平台每周都会有Android设备问题约XXX万，由于商家设备数量众多的原因，只能通过远程/IM/短信联系到问题所属商家，效率低下，我们希望通过远程上手工具，提升体验，当前具体数据如下：\n\n• 问题平均解决周期：XXXh"}
                 className="w-full p-3 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                 style={{ height: '1123px', width: '502px' }}
                 onDrop={(e) => {
                   e.preventDefault()
                   const files = Array.from(e.dataTransfer.files)
                   handleFileDrop(files)
                 }}
                 onDragOver={(e) => e.preventDefault()}
                 onDragEnter={(e) => e.preventDefault()}
               />
             </div>

            {/* 操作按钮 */}
            <div className="space-y-3 flex flex-col items-center" style={{ width: '500px' }}>
              <button
                onClick={handleGeneratePDF}
                disabled={!selectedTemplate || !content.trim() || isGenerating}
                className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium"
              >
                {isGenerating ? '生成中...' : '生成PDF完成'}
              </button>
              
              {generatedPdfUrl && (
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-green-600 text-white py-3 rounded-lg hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-2"
                >
                  <Download className="w-5 h-5" />
                  <span>下载PDF</span>
                </button>
              )}
            </div>
          </div>

          {/* 右侧PDF编辑区域 */}
          <div className="w-full xl:w-2/3 bg-gray-50 p-4 xl:p-6 flex flex-col min-h-[50vh] xl:min-h-0">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold text-gray-900">PDF编辑器</h3>
              <div className="flex items-center space-x-2">
                {generatedPdfUrl && (
                  <div className="text-sm text-green-600 font-medium">
                    ✓ PDF已生成，正在编辑模式
                  </div>
                )}
              </div>
            </div>
            
            {generatedPdfUrl ? (
              <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
                <div className="h-full flex flex-col">
                  {/* 编辑模式头部 */}
                  <div className="bg-blue-600 text-white px-6 py-3 flex items-center justify-between">
                    <h2 className="text-lg font-semibold">编辑模式 - {selectedTemplate?.title}</h2>
                    <div className="flex items-center space-x-3">
                      <button
                        onClick={async () => {
                          if (pdfEditorContent && selectedTemplate) {
                            // 使用PDF编辑器的内容重新生成PDF，不影响左侧文本区域
                            await handleGeneratePDF()
                          }
                        }}
                        disabled={isGenerating || !pdfEditorContent.trim()}
                        className="bg-green-500 hover:bg-green-600 disabled:bg-gray-400 text-white px-4 py-2 rounded-lg flex items-center space-x-2 transition-colors"
                      >
                        <Save className="w-4 h-4" />
                        <span>{isGenerating ? '保存中...' : '保存并重新生成PDF'}</span>
                      </button>

                    </div>
                  </div>
                  
                  {/* PDF编辑区域 */}
                  <div className="flex-1 p-4">
                    <div className="tinymce-editor-container border border-gray-300 rounded-lg" style={{ height: '1123px', width: '100%', margin: '0 auto', overflow: 'auto' }}>
                      <Editor
                        apiKey={process.env.NEXT_PUBLIC_TINYMCE_API_KEY || 'no-api-key'}
                        onInit={(evt, editor) => {
                          editorRef.current = editor
                          // 确保编辑器初始化后设置内容
                          if (pdfEditorContent) {
                            editor.setContent(pdfEditorContent)
                          }
                        }}
                        value={pdfEditorContent}
                        onEditorChange={(content) => {
                          // 保持原有格式，不进行额外的格式化处理
                          setPdfEditorContent(content)
                          // 不再修改左侧文本区域的content，保持数据独立
                        }}
                        init={{
                          height: 1083,
                          menubar: true,
                          plugins: [
                            'advlist', 'autolink', 'lists', 'link', 'image', 'charmap', 'preview',
                            'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
                            'insertdatetime', 'media', 'table', 'code', 'help', 'wordcount',
                            'pagebreak', 'nonbreaking', 'emoticons'
                          ],
                          toolbar: 'undo redo | blocks | ' +
                            'bold italic forecolor | alignleft aligncenter ' +
                            'alignright alignjustify | bullist numlist outdent indent | ' +
                            'removeformat | help | pagebreak | emoticons',
                          content_style: 'body { font-family:Helvetica,Arial,sans-serif; font-size:14px; word-wrap: break-word; overflow-wrap: break-word; overflow-y: auto; width: 100%; max-width: 100%; padding: 20px; box-sizing: border-box; text-align: left; line-height: 1.6; margin: 0; white-space: pre-wrap; } .pdf-container { width: 100%; max-width: 100%; margin: 0; padding: 0; } .pdf-page { width: 100%; padding: 20px; margin: 0; background: white; } .pdf-text-item { display: inline; word-wrap: break-word; white-space: pre-wrap; } .pdf-paragraph { margin: 0 0 12px 0; white-space: pre-wrap; line-height: 1.6; } p { margin: 0 0 12px 0; white-space: pre-wrap; } br { display: block; margin: 0; line-height: 1.2; }',
                          branding: false,
                          resize: false,
                          statusbar: true,
                          elementpath: false,
                          paste_data_images: true,
                          automatic_uploads: true,
                          file_picker_types: 'image',
                          content_css: false,
                          skin: 'oxide',
                          theme: 'silver',
                          forced_root_block: 'p',
                          force_br_newlines: false,
                          force_p_newlines: true,
                          convert_newlines_to_brs: false,
                          remove_linebreaks: false,
                          keep_styles: true,
                          verify_html: false,
                          cleanup: false,
                          convert_urls: false,
                          relative_urls: false,
                          remove_script_host: false,
                          entity_encoding: 'raw',
                          setup: (editor) => {
                            editor.on('init', () => {
                              if (pdfEditorContent && pdfEditorContent.trim()) {
                                editor.setContent(pdfEditorContent)
                              }
                            })
                            
                            editor.on('BeforeSetContent', (e) => {
                              e.content = e.content
                            })
                          }
                        }}
                      />
                    </div>
                  </div>
                  
                  {/* 编辑模式底部 */}
                  <div className="bg-gray-50 px-6 py-3 border-t flex items-center justify-between">
                    <div className="text-sm text-gray-600">
                      字符数: {pdfEditorContent.replace(/<[^>]*>/g, '').length}
                    </div>
                    <div className="text-sm text-gray-500">
                      提示：保存后将自动重新生成PDF
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
                <div className="text-center">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-2">PDF编辑区域</p>
                  <p className="text-sm text-gray-400">
                    {!selectedTemplate ? '请先选择模板' : '请输入内容后点击"生成PDF完成"开始编辑'}
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
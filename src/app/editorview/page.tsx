'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ToastManager'
import { Upload, Download, FileText, Settings, Palette, History, Edit3, Save, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import dynamic from 'next/dynamic'
import { Template, getAllTemplates, getTemplateById } from '@/data/templates'

// 导入PDF预览组件
import PDFPreview from '@/components/PDFPreview'

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
  const templateScrollRef = useRef<HTMLDivElement>(null)

  // 获取所有模板
  const allTemplates = getAllTemplates()
  
  // 从URL参数获取分类信息
  const selectedCategory = searchParams.get('category')
  
  // 过滤模板 - 优先按分类过滤，然后按搜索词过滤
  const filteredTemplates = useMemo(() => {
    let templates = allTemplates
    
    // 如果有选中的分类，只显示该分类的模板
    if (selectedCategory) {
      templates = templates.filter(template => template.category === selectedCategory)
    }
    
    // 再按搜索词过滤
    if (templateSearchQuery.trim()) {
      templates = templates.filter(template => 
        template.title.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.category.toLowerCase().includes(templateSearchQuery.toLowerCase()) ||
        template.description.toLowerCase().includes(templateSearchQuery.toLowerCase())
      )
    }
    
    return templates
  }, [templateSearchQuery, allTemplates, selectedCategory])

  // 初始化：从URL参数获取模板ID
  useEffect(() => {
    const templateId = searchParams.get('templateId')
    if (templateId) {
      const template = allTemplates.find(t => t.id === templateId)
      if (template) {
        setSelectedTemplate(template)
      }
    }
  }, [searchParams, allTemplates])

  // ControlledSimpleEditor会自动处理内容同步，不需要手动useEffect

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    // 清除之前生成的PDF
    if (generatedPdfUrl) {
      URL.revokeObjectURL(generatedPdfUrl)
      setGeneratedPdfUrl(null)
    }
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
              padding: 0;
              box-sizing: border-box;
              overflow-wrap: break-word;
              word-wrap: break-word;
            }
            .pdf-page {
              width: 100%;
              margin: 0;
              background: transparent;
              position: relative;
              padding: 0;
              box-sizing: border-box;
              overflow: visible;
            }
          .pdf-text-item {
            display: inline;
            line-height: 1.6;
            word-wrap: break-word;
            overflow-wrap: break-word;
          }
          .pdf-paragraph {
            margin: 0 0 1em 0;
            line-height: 1.6;
            word-wrap: break-word;
          }
          .pdf-title {
            font-weight: bold;
            margin: 1.2em 0 0.8em 0;
            word-wrap: break-word;
          }
          .pdf-heading-1 {
            font-size: 1.5em;
            font-weight: bold;
            margin: 1.2em 0 0.8em 0;
            word-wrap: break-word;
            color: #333;
          }
          .pdf-heading-2 {
            font-size: 1.25em;
            font-weight: bold;
            margin: 1.1em 0 0.7em 0;
            color: #444;
            word-wrap: break-word;
          }
          .pdf-heading-3 {
            font-size: 1.1em;
            font-weight: bold;
            margin: 1em 0 0.6em 0;
            color: #555;
            word-wrap: break-word;
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
        
        const textItems = textContent.items as any[]
        
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
        const sortedItems = textItems.sort((a: any, b: any) => {
          const yDiff = Math.abs(a.transform[5] - b.transform[5])
          if (yDiff < 3) {
            return a.transform[4] - b.transform[4] // 同一行按x坐标排序
          }
          return b.transform[5] - a.transform[5] // 按y坐标排序（从上到下）
        })
        
        // 将文本项分组为行
        const textLines: any[][] = []
        let currentLine: any[] = []
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
          const relativeFontSize = Math.max(fontSize * 0.75, 12) / 16 // 转换为相对于基础字体大小的em单位
          htmlContent += `<span class="pdf-text-item" style="
              font-size: ${relativeFontSize}em;
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
          content: content,
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
      
      showSuccess('PDF生成完成！')
      
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
    <div className="min-h-screen w-full bg-gray-50 flex flex-col lg:flex-row">
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
      <div className="flex-1 flex min-w-0 overflow-hidden">
        {/* 左侧区域：模板选择 + 内容输入 */}
        <div className="w-1/3 bg-white border-r border-gray-200 flex flex-col">
          {/* 顶部导航 */}
          <nav className="bg-white border-b border-gray-200 px-4 py-3">
            <div className="flex items-center justify-between">
              <h1 className="text-lg font-semibold text-gray-900">PDF生成器</h1>
              <div className="text-xs text-gray-600">
                {selectedTemplate ? `模板：${selectedTemplate.title}` : '未选择模板'}
              </div>
            </div>
          </nav>

          {/* 模板选择区域 - 占左侧1/4高度 */}
          <div className="h-1/4 bg-white border-b border-gray-200 px-4 py-3 overflow-hidden">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-base font-semibold text-gray-900">选择模板</h2>
              <input
                type="text"
                placeholder="搜索..."
                value={templateSearchQuery}
                onChange={(e) => setTemplateSearchQuery(e.target.value)}
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-20"
              />
            </div>
            
            <div className="relative h-full">
              {/* 左滑动按钮 */}
              <button
                onClick={() => scrollTemplates('left')}
                className="absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 transition-colors"
              >
                <ChevronLeft className="w-3 h-3 text-gray-600" />
              </button>
              
              {/* 右滑动按钮 */}
              <button
                onClick={() => scrollTemplates('right')}
                className="absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white shadow-md rounded-full p-1 hover:bg-gray-50 transition-colors"
              >
                <ChevronRight className="w-3 h-3 text-gray-600" />
              </button>
              
              <div 
                ref={templateScrollRef}
                className="flex space-x-2 overflow-x-auto overflow-y-hidden pb-2 mx-6 h-full"
                style={{
                  scrollbarWidth: 'thin',
                  scrollbarColor: '#CBD5E0 #F7FAFC',
                  WebkitOverflowScrolling: 'touch'
                }}
              >
                {filteredTemplates.map((template) => (
                  <div
                    key={template.id}
                    onClick={() => handleTemplateSelect(template)}
                    className={`flex-shrink-0 cursor-pointer p-2 rounded border-2 transition-all ${
                      selectedTemplate?.id === template.id
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    style={{
                      width: '80px',
                      minWidth: '80px'
                    }}
                  >
                    <div className="aspect-[3/4] bg-gray-100 rounded mb-1 flex items-center justify-center">
                      <span className="text-xs text-gray-500 text-center px-1 leading-tight">{template.title}</span>
                    </div>
                    <p className="text-xs text-center text-gray-600 truncate">{template.category}</p>
                  </div>
                ))}
              </div>
              <style jsx>{`
                div::-webkit-scrollbar {
                  height: 6px;
                }
                div::-webkit-scrollbar-track {
                  background: #f1f5f9;
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb {
                  background: #cbd5e0;
                  border-radius: 3px;
                }
                div::-webkit-scrollbar-thumb:hover {
                  background: #94a3b8;
                }
              `}</style>
            </div>
          </div>

          {/* 内容输入区域 - 占左侧3/4高度 */}
          <div className="flex-1 p-4 flex flex-col overflow-hidden">
            <div className="mb-3">
              <h3 className="text-base font-semibold text-gray-900">内容输入</h3>
            </div>
            
            {/* 文件上传区域 */}
            <div className="mb-3">
              <div 
                className="border-2 border-dashed border-gray-300 rounded p-2 text-center hover:border-gray-400 transition-colors cursor-pointer"
                onDrop={(e) => {
                  e.preventDefault()
                  const files = Array.from(e.dataTransfer.files)
                  handleFileDrop(files)
                }}
                onDragOver={(e) => e.preventDefault()}
                onDragEnter={(e) => e.preventDefault()}
                onClick={() => document.getElementById('file-input')?.click()}
              >
                <div className="flex items-center justify-center space-x-1">
                  <Upload className="w-4 h-4 text-gray-400" />
                  <span className="text-xs text-gray-600">拖拽或点击上传文件</span>
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

            {/* 文本输入区域 */}
             <div className="mb-4 flex-1 flex flex-col">
               <label className="block text-sm font-medium text-gray-700 mb-2">
                 文本内容
               </label>
               <textarea
                 value={content}
                 onChange={(e) => setContent(e.target.value)}
                 placeholder={content ? "" : "拖拽文件到此处自动解析内容，或直接输入文本...\n\n示例内容：\n— 项目TO DO\n— 文档修改记录\n\n1.背景\n商家平台每周都会有Android设备问题约XXX万，由于商家设备数量众多的原因，只能通过远程/IM/短信联系到问题所属商家，效率低下，我们希望通过远程上手工具，提升体验，当前具体数据如下：\n\n• 问题平均解决周期：XXXh"}
                 className="w-full p-2 border border-gray-300 rounded text-sm resize-none focus:ring-1 focus:ring-blue-500 focus:border-transparent flex-1"
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
            <div className="space-y-2 flex flex-col">
              <button
                onClick={handleGeneratePDF}
                disabled={!selectedTemplate || !content.trim() || isGenerating}
                className="w-full bg-blue-600 text-white py-2 rounded hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-sm"
              >
                {isGenerating ? '生成中...' : '生成PDF'}
              </button>
              
              {generatedPdfUrl && (
                <button
                  onClick={handleDownloadPDF}
                  className="w-full bg-green-600 text-white py-2 rounded hover:bg-green-700 transition-colors font-medium flex items-center justify-center space-x-1 text-sm"
                >
                  <Download className="w-4 h-4" />
                  <span>下载PDF</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 右侧PDF预览区域 - 占整个右侧 */}
        <div className="w-2/3 bg-gray-50 p-4 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">PDF预览</h3>
            <div className="flex items-center space-x-2">
              {generatedPdfUrl && (
                <div className="text-sm text-green-600 font-medium">
                  ✓ PDF已生成
                </div>
              )}
            </div>
          </div>
          
          {generatedPdfUrl ? (
            <div className="flex-1 bg-white shadow-lg rounded-lg overflow-hidden">
              <PDFPreview 
                pdfUrl={generatedPdfUrl}
                className="h-full"
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center bg-white rounded-lg border-2 border-dashed border-gray-300">
              <div className="text-center">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-2">PDF预览区域</p>
                <p className="text-sm text-gray-400">
                  {!selectedTemplate ? '请先选择模板' : '请输入内容后点击"生成PDF"查看预览'}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
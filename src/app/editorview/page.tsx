'use client'

import { useState, useEffect, useMemo, useRef } from 'react'

import Link from 'next/link'
import { useSearchParams } from 'next/navigation'
import { useToast } from '@/components/ToastManager'
import { Upload, Download, FileText, Settings, Palette, History, Edit3, Save, RotateCcw, ChevronLeft, ChevronRight } from 'lucide-react'
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'
import { Template, getAllTemplates } from '@/data/templates'
import Sidebar from '@/components/Sidebar'

// 导入PDF预览组件
import PDFPreview from '@/components/PDFPreview'

// 动态导入PDF.js worker
let pdfjsWorkerLoaded = false

// 使用共享的模板数据和接口

export default function EditorPage() {
  const searchParams = useSearchParams()
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  
  // 初始化PDF.js worker
  useEffect(() => {
    if (!pdfjsWorkerLoaded) {
      pdfjsLib.GlobalWorkerOptions.workerSrc = new URL(
        'pdfjs-dist/build/pdf.worker.min.mjs',
        import.meta.url
      ).toString()
      pdfjsWorkerLoaded = true
    }
  }, [])
  
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

  // 读取PDF文件 - 提取纯文本内容
  const readPdfFile = async (file: File): Promise<string> => {
    try {
      const arrayBuffer = await file.arrayBuffer()
      const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
      
      let textContent = ''
      
      // 遍历每一页
      for (let pageNum = 1; pageNum <= pdf.numPages; pageNum++) {
        const page = await pdf.getPage(pageNum)
        const content = await page.getTextContent()
        
        // 提取文本项
        const textItems = content.items as Array<{
          str: string;
          transform: number[];
        }>
        
        // 按Y坐标排序文本项（从上到下）
        const sortedItems = textItems.sort((a, b) => {
          const yDiff = Math.abs(a.transform[5] - b.transform[5])
          if (yDiff < 3) {
            return a.transform[4] - b.transform[4] // 同一行按X坐标排序
          }
          return b.transform[5] - a.transform[5] // 按Y坐标排序（从上到下）
        })
        
        // 将文本项组合成行
        let currentLineY = -1
        let lineText = ''
        
        for (const item of sortedItems) {
          if (!item.str || item.str.trim() === '') continue
          
          const itemY = item.transform[5]
          
          // 如果是新行
          if (currentLineY !== -1 && Math.abs(itemY - currentLineY) > 3) {
            if (lineText.trim()) {
              textContent += lineText.trim() + '\n'
            }
            lineText = ''
          }
          
          lineText += item.str + ' '
          currentLineY = itemY
        }
        
        // 添加最后一行
        if (lineText.trim()) {
          textContent += lineText.trim() + '\n'
        }
        
        // 页面之间添加分隔
        if (pageNum < pdf.numPages) {
          textContent += '\n'
        }
      }
      
      return textContent.trim()
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
      console.log('failed to parsed the document: ', error)
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
        link.download = `${selectedTemplate.title}.pdf`
        document.body.appendChild(link)
        link.click()
        document.body.removeChild(link)
        
        // 清理临时URL
        URL.revokeObjectURL(url)
      } else {
        // 如果是普通URL，直接下载
        const link = document.createElement('a')
        link.href = generatedPdfUrl
        link.download = `${selectedTemplate.title}.pdf`
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
    <div className="min-h-screen w-full bg-gray-50 flex">
      {/* 左侧功能菜单 */}
      <Sidebar />

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
                className="px-2 py-1 border border-gray-300 rounded text-xs focus:outline-none focus:ring-1 focus:ring-blue-500 w-40"
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
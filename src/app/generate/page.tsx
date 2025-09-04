'use client'

import { useState } from 'react'
import Link from 'next/link'
import TemplateSelector from '@/components/TemplateSelector'
import FileUpload from '@/components/FileUpload'
import ContentEditor from '@/components/ContentEditor'
import PDFPreview from '@/components/PDFPreview'
import { useToast } from '@/components/ToastManager'
// 导入文档解析库
import * as pdfjsLib from 'pdfjs-dist'
import mammoth from 'mammoth'

// 配置PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

// 定义模板类型
export interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
}

// 定义文档数据类型
export interface DocumentData {
  title: string
  content: string
  template: Template | null
  language?: string
}

export default function GeneratePage() {
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  // 状态管理
  const [currentStep, setCurrentStep] = useState(1) // 当前步骤：1-选择模板，2-编辑内容，3-预览生成
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [documentData, setDocumentData] = useState<DocumentData>({
    title: '',
    content: '',
    template: null,
    language: 'zh-CN'
  })
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    setDocumentData(prev => ({ ...prev, template }))
    setCurrentStep(2)
    showSuccess(`已选择模板：${template.name}`)
  }

  // 处理文件选择
  const handleFileSelect = async (file: File) => {
    try {
      let content = ''
      const fileName = file.name.replace(/\.[^/.]+$/, '') // 移除文件扩展名
      showInfo(`正在处理文件：${file.name}`)
      
      if (file.type === 'text/plain') {
        // 处理纯文本文件
        content = await readTextFile(file)
      } else if (file.type === 'application/pdf') {
        // 处理PDF文件
        content = await readPDFFile(file)
      } else if (file.type === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document' || 
                 file.name.endsWith('.docx')) {
        // 处理DOCX文件
        content = await readDocxFile(file)
      } else if (file.type === 'application/msword' || file.name.endsWith('.doc')) {
        // 处理DOC文件（注意：mammoth主要支持docx，对doc支持有限）
        content = await readDocxFile(file)
      } else {
        showWarning(`暂不支持 ${file.type || file.name.split('.').pop()} 格式的文件`)
        return
      }
      
      if (content.trim()) {
         setDocumentData({
           title: fileName,
           content: content.replace(/\n/g, '<br>'),
           template: documentData.template
         })
         showSuccess('文件上传并解析成功！')
       } else {
         showWarning('文件内容为空或解析失败')
       }
    } catch (error) {
      console.error('文件处理错误:', error)
      showError('文件处理失败，请重试')
    }
  }
  
  // 读取纯文本文件
  const readTextFile = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader()
      reader.onload = (e) => resolve(e.target?.result as string || '')
      reader.onerror = () => reject(new Error('文本文件读取失败'))
      reader.readAsText(file)
    })
  }
  
  // 读取PDF文件
  const readPDFFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise
    let fullText = ''
    
    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i)
      const textContent = await page.getTextContent()
      const pageText = textContent.items
        .map((item: any) => item.str)
        .join(' ')
      fullText += pageText + '\n'
    }
    
    return fullText
  }
  
  // 读取DOCX文件
  const readDocxFile = async (file: File): Promise<string> => {
    const arrayBuffer = await file.arrayBuffer()
    const result = await mammoth.extractRawText({ arrayBuffer })
    return result.value
  }

  // 处理内容编辑
  const handleContentChange = (content: string, title: string) => {
    setDocumentData(prev => ({
      ...prev,
      content,
      title
    }))
  }

  // 处理语言选择
  const handleLanguageChange = (language: string) => {
    setDocumentData(prev => ({
      ...prev,
      language
    }))
  }

  // 生成PDF
  const handleGeneratePDF = async () => {
    if (!documentData.template || !documentData.content) {
      showWarning('请选择模板并输入内容')
      return
    }

    if (!documentData.title.trim()) {
      showWarning('请输入文档标题')
      return
    }

    setIsGenerating(true)
    showInfo('正在生成PDF，请稍候...')
    
    try {
      // 准备发送给Puppeteer API的数据
      const requestData = {
        title: documentData.title,
        content: documentData.content,
        template: documentData.template?.id || 'business',
        language: documentData.language || 'zh-CN'
      }

      // 调用新的Puppeteer PDF生成API
      const response = await fetch('/api/generate-pdf-puppeteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGeneratedPdfUrl(result.pdfUrl)
          setCurrentStep(3)
          showSuccess('PDF生成成功！您可以预览和下载文档。')
        } else {
          throw new Error(result.error || 'PDF生成失败')
        }
      } else {
        const errorData = await response.json().catch(() => ({ message: 'PDF生成失败' }))
        throw new Error(errorData.message || 'PDF生成失败')
      }
    } catch (error) {
      console.error('生成PDF时出错:', error)
      showError(error instanceof Error ? error.message : 'PDF生成失败，请检查网络连接后重试')
    } finally {
      setIsGenerating(false)
    }
  }

  // 步骤指示器
  const StepIndicator = () => (
    <div className="flex items-center justify-center mb-8">
      <div className="flex items-center space-x-4">
        {[1, 2, 3].map((step) => (
          <div key={step} className="flex items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                currentStep >= step
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-200 text-gray-600'
              }`}
            >
              {step}
            </div>
            {step < 3 && (
              <div
                className={`w-16 h-1 mx-2 ${
                  currentStep > step ? 'bg-blue-600' : 'bg-gray-200'
                }`}
              />
            )}
          </div>
        ))}
      </div>
    </div>
  )

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                PDF工具
              </Link>
              <span className="ml-4 text-gray-500">/ 生成PDF</span>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <StepIndicator />

        {/* 步骤1: 选择模板 */}
        {currentStep === 1 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">选择模板</h2>
              <p className="mt-2 text-gray-600">选择一个适合您需求的PDF模板</p>
            </div>
            <TemplateSelector onTemplateSelect={handleTemplateSelect} />
          </div>
        )}

        {/* 步骤2: 编辑内容 */}
        {currentStep === 2 && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">编辑内容</h2>
              <p className="mt-2 text-gray-600">上传文件或直接编辑您的内容</p>
            </div>
            
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              {/* 左侧：文件上传和内容编辑 */}
              <div className="space-y-6">
                <FileUpload onFileSelect={handleFileSelect} />
                
                {/* 语言选择器 */}
                <div className="bg-white rounded-lg shadow p-6">
                  <h3 className="text-lg font-medium text-gray-900 mb-4">选择语言</h3>
                  <select
                    value={documentData.language || 'zh-CN'}
                    onChange={(e) => handleLanguageChange(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  >
                    <option value="zh-CN">简体中文</option>
                    <option value="zh-TW">繁体中文</option>
                    <option value="en">English</option>
                    <option value="ja">日本語</option>
                    <option value="ko">한국어</option>
                    <option value="ar">العربية</option>
                    <option value="ru">Русский</option>
                  </select>
                  <p className="mt-2 text-sm text-gray-600">
                    选择PDF文档的主要语言，这将影响字体渲染和文本显示效果
                  </p>
                </div>
                
                <ContentEditor
                  title={documentData.title}
                  content={documentData.content}
                  onChange={handleContentChange}
                />
                
                <div className="flex space-x-4">
                  <button
                    onClick={() => setCurrentStep(1)}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    上一步
                  </button>
                  <button
                    onClick={handleGeneratePDF}
                    disabled={!documentData.content || isGenerating}
                    className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isGenerating ? '生成中...' : '生成PDF'}
                  </button>
                </div>
              </div>

              {/* 右侧：模板预览 */}
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">选中的模板</h3>
                {selectedTemplate && (
                  <div>
                    <img
                      src={selectedTemplate.thumbnail}
                      alt={selectedTemplate.name}
                      className="w-full h-48 object-cover rounded-lg mb-4"
                    />
                    <h4 className="font-medium text-gray-900">{selectedTemplate.name}</h4>
                    <p className="text-sm text-gray-600">{selectedTemplate.description}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* 步骤3: 预览和下载 */}
        {currentStep === 3 && generatedPdfUrl && (
          <div>
            <div className="text-center mb-8">
              <h2 className="text-3xl font-bold text-gray-900">PDF生成完成</h2>
              <p className="mt-2 text-gray-600">您的PDF已成功生成，可以预览和下载</p>
            </div>
            
            <PDFPreview pdfUrl={generatedPdfUrl} documentData={documentData} />
            
            <div className="flex justify-center space-x-4 mt-8">
              <button
                onClick={() => {
                  setCurrentStep(2)
                  setGeneratedPdfUrl(null)
                }}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                重新编辑
              </button>
              <Link
                href={`/edit?pdf=${encodeURIComponent(generatedPdfUrl)}`}
                className="px-6 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                编辑PDF
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
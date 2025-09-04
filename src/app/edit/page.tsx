'use client'

import { useState, useEffect, useCallback } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import ContentEditor from '@/components/ContentEditor'
import PDFPreview from '@/components/PDFPreview'
import TemplateSelector from '@/components/TemplateSelector'
import { useToast } from '@/components/ToastManager'
import { DocumentData, Template } from '../generate/page'

export default function EditPage() {
  const searchParams = useSearchParams()
  const pdfUrl = searchParams.get('pdf')
  const { showSuccess, showError, showWarning, showInfo } = useToast()
  
  // 状态管理
  const [documentData, setDocumentData] = useState<DocumentData>({
    title: '未命名文档',
    content: '',
    template: null
  })
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showTemplateSelector, setShowTemplateSelector] = useState(false)
  const [currentPdfUrl, setCurrentPdfUrl] = useState<string | null>(pdfUrl)
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false)
  const [versions, setVersions] = useState<Array<{ id: string; timestamp: Date; title: string }>>([]) 
  const [isGeneratingPreview, setIsGeneratingPreview] = useState(false)
  const [previewError, setPreviewError] = useState<string | null>(null)

  // 实时生成PDF预览
  const generatePreview = useCallback(async (data: DocumentData, silent = true) => {
    setIsGeneratingPreview(true)
    setPreviewError(null)
    
    try {
      const response = await fetch('/api/generate-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: data.title,
          content: data.content,
          template: data.template,
          preview: true // 标记为预览模式
        })
      })

      if (response.ok) {
        const blob = await response.blob()
        const url = URL.createObjectURL(blob)
        
        // 清理之前的URL
        if (currentPdfUrl && currentPdfUrl.startsWith('blob:')) {
          URL.revokeObjectURL(currentPdfUrl)
        }
        
        setCurrentPdfUrl(url)
      } else {
        throw new Error('生成预览失败')
      }
    } catch (error) {
      console.error('生成PDF预览失败:', error)
      setPreviewError('预览生成失败，请检查内容格式')
      if (!silent) {
        showError('预览生成失败，请检查内容格式')
      }
    } finally {
      setIsGeneratingPreview(false)
    }
  }, [currentPdfUrl])

  // 防抖函数，避免频繁生成预览
  const debouncedGeneratePreview = useCallback(
    debounce((data: DocumentData) => {
      generatePreview(data)
    }, 1000), // 1秒延迟
    [generatePreview]
  )

  // 防抖函数实现
  function debounce<T extends (...args: any[]) => any>(
    func: T,
    wait: number
  ): (...args: Parameters<T>) => void {
    let timeout: NodeJS.Timeout
    return (...args: Parameters<T>) => {
      clearTimeout(timeout)
      timeout = setTimeout(() => func(...args), wait)
    }
  }

  // 加载PDF内容（模拟从PDF提取文本）
  useEffect(() => {
    const loadPdfContent = async () => {
      if (pdfUrl) {
        try {
          // 这里应该调用API来提取PDF内容
          // 现在使用模拟数据
          const mockContent = `# 示例文档

这是一个示例PDF文档的内容。您可以在左侧编辑器中修改这些内容，右侧会实时显示PDF预览。

## 主要功能

1. **实时编辑** - 修改内容后立即看到效果
2. **模板切换** - 一键更换不同的PDF模板
3. **版本控制** - 保存多个版本，随时回退
4. **自动保存** - 防止意外丢失修改

## 使用说明

在左侧编辑器中输入或修改内容，右侧PDF预览会自动更新。您可以：

- 使用Markdown语法格式化文本
- 插入图片和链接
- 调整字体和样式
- 更换模板样式

编辑完成后，点击"保存"按钮保存您的修改。`
          
          const initialData = {
            title: '示例文档',
            content: mockContent,
            template: {
              id: 'template-1',
              name: '商务模板',
              description: '适合商务文档的专业模板',
              thumbnail: '/templates/business.jpg',
              category: 'business'
            }
          }
          
          setDocumentData(initialData)
          
          // 初始生成预览
          generatePreview(initialData)
        } catch (error) {
          console.error('加载PDF内容失败:', error)
        }
      }
      setIsLoading(false)
    }

    loadPdfContent()
  }, [pdfUrl, generatePreview])

  // 内容变化时实时更新预览
  useEffect(() => {
    if (documentData.title || documentData.content) {
      debouncedGeneratePreview(documentData)
    }
  }, [documentData.title, documentData.content, documentData.template, debouncedGeneratePreview])

  // 处理内容变化
  const handleContentChange = (content: string, title: string) => {
    setDocumentData(prev => ({ ...prev, content, title }))
    setHasUnsavedChanges(true)
  }

  // 保存文档
  const handleSave = async () => {
    setIsSaving(true)
    try {
      // 调用API保存文档并重新生成PDF
      const response = await fetch('/api/save-pdf', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...documentData,
          originalPdfUrl: currentPdfUrl
        }),
      })

      if (response.ok) {
        const result = await response.json()
        setCurrentPdfUrl(result.pdfUrl)
        setHasUnsavedChanges(false)
        
        // 添加到版本历史
        setVersions(prev => [
          {
            id: result.versionId,
            timestamp: new Date(),
            title: documentData.title
          },
          ...prev
        ])
        
        showSuccess('保存成功！')
      } else {
        throw new Error('保存失败')
      }
    } catch (error) {
      console.error('保存时出错:', error)
      showError('保存失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 处理模板更换
  const handleTemplateChange = async (template: Template) => {
    setIsSaving(true)
    try {
      const newDocumentData = { ...documentData, template }
      setDocumentData(newDocumentData)
      setShowTemplateSelector(false)
      
      // 立即生成新模板的预览
      await generatePreview(newDocumentData)
      
      // 添加到版本历史
      setVersions(prev => [
        {
          id: Date.now().toString(),
          timestamp: new Date(),
          title: `切换到模板: ${template.name}`
        },
        ...prev
      ])
      
      showSuccess(`模板已切换为：${template.name}`)
    } catch (error) {
      console.error('更换模板时出错:', error)
      showError('更换模板失败，请重试')
    } finally {
      setIsSaving(false)
    }
  }

  // 自动保存（每30秒）
  useEffect(() => {
    if (hasUnsavedChanges) {
      const autoSaveTimer = setTimeout(() => {
        handleSave()
      }, 30000) // 30秒后自动保存

      return () => clearTimeout(autoSaveTimer)
    }
  }, [hasUnsavedChanges, documentData])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载PDF内容...</p>
        </div>
      </div>
    )
  }

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
              <span className="ml-4 text-gray-500">/ 编辑PDF</span>
            </div>
            
            {/* 工具栏 */}
            <div className="flex items-center space-x-4">
              {hasUnsavedChanges && (
                <span className="text-sm text-orange-600">有未保存的更改</span>
              )}
              
              <button
                onClick={() => setShowTemplateSelector(true)}
                className="px-3 py-1 text-sm border border-gray-300 rounded-md hover:bg-gray-50"
              >
                更换模板
              </button>
              
              <button
                onClick={handleSave}
                disabled={isSaving || !hasUnsavedChanges}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSaving ? '保存中...' : '保存'}
              </button>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-[calc(100vh-200px)]">
          {/* 左侧：内容编辑器 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h3 className="text-lg font-medium text-gray-900">内容编辑</h3>
              <p className="text-sm text-gray-600">在这里编辑您的文档内容</p>
            </div>
            
            <div className="p-4 h-full">
              <ContentEditor
                title={documentData.title}
                content={documentData.content}
                onChange={handleContentChange}
                className="h-full"
              />
            </div>
          </div>

          {/* 右侧：PDF预览 */}
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-lg font-medium text-gray-900">PDF预览</h3>
                  <p className="text-sm text-gray-600">实时预览您的修改效果</p>
                </div>
                
                {currentPdfUrl && (
                  <a
                    href={currentPdfUrl}
                    download={`${documentData.title}.pdf`}
                    className="px-3 py-1 text-sm bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    下载PDF
                  </a>
                )}
              </div>
            </div>
            
            <div className="p-4 h-full">
              {isGeneratingPreview ? (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-2">正在生成预览...</p>
                  </div>
                </div>
              ) : previewError ? (
                <div className="flex items-center justify-center h-full text-red-500">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <p className="mt-2">{previewError}</p>
                    <button 
                      onClick={() => generatePreview(documentData)}
                      className="mt-2 px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
                    >
                      重新生成
                    </button>
                  </div>
                </div>
              ) : currentPdfUrl ? (
                <PDFPreview pdfUrl={currentPdfUrl} documentData={documentData} />
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  <div className="text-center">
                    <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2">PDF预览将在这里显示</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* 版本历史（可选显示） */}
        {versions.length > 0 && (
          <div className="mt-6 bg-white rounded-lg shadow p-4">
            <h3 className="text-lg font-medium text-gray-900 mb-4">版本历史</h3>
            <div className="space-y-2">
              {versions.slice(0, 5).map((version) => (
                <div key={version.id} className="flex justify-between items-center p-2 hover:bg-gray-50 rounded">
                  <div>
                    <span className="font-medium">{version.title}</span>
                    <span className="ml-2 text-sm text-gray-500">
                      {version.timestamp.toLocaleString()}
                    </span>
                  </div>
                  <button className="text-sm text-blue-600 hover:text-blue-800">
                    恢复
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 模板选择器模态框 */}
      {showTemplateSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">选择新模板</h3>
                <button
                  onClick={() => setShowTemplateSelector(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              <TemplateSelector onTemplateSelect={handleTemplateChange} />
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
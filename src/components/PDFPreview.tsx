'use client'

import { useState, useEffect, useRef } from 'react'
import { DocumentData } from '@/app/generate/page'
import * as pdfjsLib from 'pdfjs-dist'

// 配置PDF.js worker
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`
}

interface PDFPreviewProps {
  pdfUrl?: string | null
  documentData?: DocumentData
  className?: string
}

export default function PDFPreview({ pdfUrl, documentData, className = '' }: PDFPreviewProps) {
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [previewMode, setPreviewMode] = useState<'iframe' | 'canvas'>('canvas')
  const [scale, setScale] = useState(1)
  const [pdfDoc, setPdfDoc] = useState<any>(null)
  const [pageNum, setPageNum] = useState(1)
  const [numPages, setNumPages] = useState(0)
  const [isRendering, setIsRendering] = useState<boolean>(false)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const renderTaskRef = useRef<any>(null)

  // 将data URL转换为Uint8Array
  const dataURLToUint8Array = (dataURL: string): Uint8Array => {
    const base64 = dataURL.split(',')[1]
    const binaryString = atob(base64)
    const bytes = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i)
    }
    return bytes
  }

  // 处理PDF加载
  useEffect(() => {
    if (pdfUrl) {
      setIsLoading(true)
      setError(null)
      
      // 加载PDF文档
      const loadPDF = async () => {
        try {
          let pdfData
          
          // 检查是否是data URL
          if (pdfUrl.startsWith('data:application/pdf;base64,')) {
            // 转换data URL为Uint8Array
            pdfData = dataURLToUint8Array(pdfUrl)
          } else {
            // 普通URL
            pdfData = pdfUrl
          }
          
          const loadingTask = pdfjsLib.getDocument(pdfData)
          const pdf = await loadingTask.promise
          setPdfDoc(pdf)
          setNumPages(pdf.numPages)
          setPageNum(1)
          setIsLoading(false)
        } catch (err) {
          console.error('PDF加载失败:', err)
          setError('PDF加载失败，请重试')
          setIsLoading(false)
        }
      }
      
      loadPDF()
    }
  }, [pdfUrl])

  // 渲染PDF页面到Canvas
  const renderPage = async (pageNumber: number) => {
    if (!pdfDoc || !canvasRef.current || isRendering) return
    
    // 取消之前的渲染任务
    if (renderTaskRef.current) {
      renderTaskRef.current.cancel()
      renderTaskRef.current = null
    }
    
    setIsRendering(true)
    setError(null)
    
    try {
      const page = await pdfDoc.getPage(pageNumber)
      const canvas = canvasRef.current
      const context = canvas.getContext('2d')
      
      if (!context) {
        throw new Error('无法获取Canvas上下文')
      }
      
      // 清除之前的内容
      context.clearRect(0, 0, canvas.width, canvas.height)
      
      const viewport = page.getViewport({ scale: scale })
      canvas.height = viewport.height
      canvas.width = viewport.width
      
      const renderContext = {
        canvasContext: context,
        viewport: viewport
      }
      
      // 开始新的渲染任务
      renderTaskRef.current = page.render(renderContext)
      await renderTaskRef.current.promise
      renderTaskRef.current = null
    } catch (err: any) {
      if (err.name !== 'RenderingCancelledException') {
        console.error('页面渲染失败:', err)
        setError('页面渲染失败')
      }
    } finally {
      setIsRendering(false)
    }
  }
  
  // 监听页面和缩放变化，重新渲染
  useEffect(() => {
    if (pdfDoc && previewMode === 'canvas') {
      renderPage(pageNum)
    }
  }, [pdfDoc, pageNum, scale, previewMode])

  // 组件卸载时清理渲染任务
  useEffect(() => {
    return () => {
      if (renderTaskRef.current) {
        renderTaskRef.current.cancel()
        renderTaskRef.current = null
      }
    }
  }, [])

  // 处理缩放
  const handleZoomIn = () => {
    setScale(prev => Math.min(prev + 0.2, 3))
  }

  const handleZoomOut = () => {
    setScale(prev => Math.max(prev - 0.2, 0.5))
  }

  const handleResetZoom = () => {
    setScale(1)
  }
  
  // 处理页面导航
  const handlePrevPage = () => {
    setPageNum(prev => Math.max(prev - 1, 1))
  }
  
  const handleNextPage = () => {
    setPageNum(prev => Math.min(prev + 1, numPages))
  }

  // 如果没有PDF URL，显示实时预览
  if (!pdfUrl && documentData) {
    return (
      <div className={`h-full flex flex-col ${className}`}>
        {/* 预览工具栏 */}
        <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
          <div className="flex items-center space-x-2">
            <span className="text-sm text-gray-600">实时预览</span>
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
          </div>
          
          <div className="flex items-center space-x-2">
            <button
              onClick={handleZoomOut}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="缩小"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
              </svg>
            </button>
            
            <span className="text-sm text-gray-600 min-w-[60px] text-center">
              {Math.round(scale * 100)}%
            </span>
            
            <button
              onClick={handleZoomIn}
              className="p-1 text-gray-600 hover:text-gray-800"
              title="放大"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
            </button>
            
            <button
              onClick={handleResetZoom}
              className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
              title="重置缩放"
            >
              重置
            </button>
          </div>
        </div>

        {/* 实时预览内容 */}
        <div className="flex-1 overflow-auto bg-gray-100 p-4">
          <div 
            className="bg-white shadow-lg mx-auto" 
            style={{ 
              transform: `scale(${scale})`,
              transformOrigin: 'top center',
              width: '210mm', // A4宽度
              minHeight: '297mm', // A4高度
              padding: '20mm'
            }}
          >
            {/* 模拟PDF页面内容 */}
            <div className="prose max-w-none">
              <h1 className="text-2xl font-bold mb-4 text-gray-900">
                {documentData.title || '未命名文档'}
              </h1>
              
              {documentData.template && (
                <div className="mb-4 p-2 bg-blue-50 border-l-4 border-blue-400">
                  <p className="text-sm text-blue-700">
                    使用模板: {documentData.template.name}
                  </p>
                </div>
              )}
              
              <div 
                className="text-gray-800 leading-relaxed"
                dangerouslySetInnerHTML={{ 
                  __html: documentData.content || '<p class="text-gray-500">开始编辑内容...</p>' 
                }}
              />
              
              {/* 页脚 */}
              <div className="mt-8 pt-4 border-t border-gray-200 text-center text-sm text-gray-500">
                生成时间: {new Date().toLocaleString()}
              </div>
            </div>
          </div>
        </div>
      </div>
    )
  }

  // 显示加载状态
  if (isLoading) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载PDF预览...</p>
        </div>
      </div>
    )
  }

  // 显示错误状态
  if (error) {
    return (
      <div className={`h-full flex items-center justify-center ${className}`}>
        <div className="text-center">
          <svg className="mx-auto h-12 w-12 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="mt-4 text-red-600">加载PDF预览失败</p>
          <p className="text-sm text-gray-500">{error}</p>
          <button 
            onClick={() => window.location.reload()}
            className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
          >
            重新加载
          </button>
        </div>
      </div>
    )
  }

  // 显示PDF预览
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* PDF工具栏 */}
      <div className="flex justify-between items-center p-2 border-b border-gray-200 bg-gray-50">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setPreviewMode('iframe')}
            className={`px-3 py-1 text-sm rounded ${
              previewMode === 'iframe' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            标准预览
          </button>
          
          <button
            onClick={() => setPreviewMode('canvas')}
            className={`px-3 py-1 text-sm rounded ${
              previewMode === 'canvas' 
                ? 'bg-blue-600 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            高清预览
          </button>
          
          {/* 页面导航 */}
          {previewMode === 'canvas' && numPages > 0 && (
            <div className="flex items-center space-x-2 ml-4">
              <button
                onClick={handlePrevPage}
                disabled={pageNum <= 1}
                className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                title="上一页"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <span className="text-sm text-gray-600">
                {pageNum} / {numPages}
              </span>
              
              <button
                onClick={handleNextPage}
                disabled={pageNum >= numPages}
                className="p-1 text-gray-600 hover:text-gray-800 disabled:text-gray-400 disabled:cursor-not-allowed"
                title="下一页"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>
        
        <div className="flex items-center space-x-2">
          <button
            onClick={handleZoomOut}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="缩小"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
            </svg>
          </button>
          
          <span className="text-sm text-gray-600 min-w-[60px] text-center">
            {Math.round(scale * 100)}%
          </span>
          
          <button
            onClick={handleZoomIn}
            className="p-1 text-gray-600 hover:text-gray-800"
            title="放大"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
            </svg>
          </button>
          
          <button
            onClick={handleResetZoom}
            className="px-2 py-1 text-xs text-gray-600 hover:text-gray-800 border border-gray-300 rounded"
            title="重置缩放"
          >
            重置
          </button>
        </div>
      </div>

      {/* PDF内容 */}
      <div className="flex-1 overflow-auto bg-gray-100">
        {previewMode === 'iframe' ? (
          <iframe
            src={pdfUrl || ''}
            className="w-full h-full border-0"
            style={{ transform: `scale(${scale})`, transformOrigin: 'top left' }}
            title="PDF预览"
            onError={() => setError('PDF预览加载失败')}
          />
        ) : (
          <div className="p-4 flex justify-center">
            <div className="bg-white shadow-lg">
              <canvas 
                ref={canvasRef}
                className="border border-gray-300"
                style={{
                  maxWidth: '100%',
                  height: 'auto'
                }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
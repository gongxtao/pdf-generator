'use client'

import { useState, useEffect, useRef } from 'react'

interface PDFThumbnailProps {
  pdfData?: string // base64 PDF data
  fileName?: string
  className?: string
  onError?: (error: string) => void
}

export default function PDFThumbnail({
  pdfData,
  fileName = 'document.pdf',
  className = '',
  onError
}: PDFThumbnailProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 生成PDF缩略图
  const generateThumbnail = async (pdfBase64: string) => {
    setIsLoading(true)
    setError(null)

    try {
      // 这里应该使用 PDF.js 来渲染PDF缩略图
      // 目前使用模拟实现
      await new Promise(resolve => setTimeout(resolve, 500))

      // 创建模拟缩略图
      const canvas = canvasRef.current
      if (!canvas) throw new Error('Canvas not available')

      const ctx = canvas.getContext('2d')
      if (!ctx) throw new Error('Canvas context not available')

      // 设置canvas尺寸
      canvas.width = 200
      canvas.height = 280

      // 绘制模拟PDF页面
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      // 绘制边框
      ctx.strokeStyle = '#e5e7eb'
      ctx.lineWidth = 1
      ctx.strokeRect(0, 0, canvas.width, canvas.height)

      // 绘制文档图标
      ctx.fillStyle = '#6b7280'
      ctx.font = '16px Arial'
      ctx.textAlign = 'center'
      ctx.fillText('📄', canvas.width / 2, 50)

      // 绘制文档标题
      ctx.fillStyle = '#1f2937'
      ctx.font = 'bold 14px Arial'
      ctx.fillText('Word Document', canvas.width / 2, 80)

      // 绘制模拟文本行
      ctx.fillStyle = '#6b7280'
      ctx.font = '10px Arial'
      ctx.textAlign = 'left'
      
      const lines = [
        'Lorem ipsum dolor sit amet,',
        'consectetur adipiscing elit.',
        'Sed do eiusmod tempor',
        'incididunt ut labore et',
        'dolore magna aliqua.',
        '',
        'Ut enim ad minim veniam,',
        'quis nostrud exercitation',
        'ullamco laboris nisi ut',
        'aliquip ex ea commodo',
        'consequat.',
        '',
        'Duis aute irure dolor in',
        'reprehenderit in voluptate',
        'velit esse cillum dolore',
        'eu fugiat nulla pariatur.'
      ]

      lines.forEach((line, index) => {
        ctx.fillText(line, 20, 110 + index * 12)
      })

      // 转换为图片URL
      const dataUrl = canvas.toDataURL('image/png')
      setThumbnailUrl(dataUrl)

    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to generate thumbnail'
      setError(errorMessage)
      onError?.(errorMessage)
    } finally {
      setIsLoading(false)
    }
  }

  // 当pdfData变化时生成缩略图
  useEffect(() => {
    if (pdfData) {
      generateThumbnail(pdfData)
    } else {
      setThumbnailUrl(null)
      setError(null)
    }
  }, [pdfData])

  const baseClasses = `
    relative bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 
    rounded-lg overflow-hidden shadow-sm hover:shadow-md transition-shadow
  `

  return (
    <div className={`${baseClasses} ${className}`}>
      {/* 缩略图区域 */}
      <div className="aspect-[4/5] bg-gray-50 dark:bg-gray-900 flex items-center justify-center relative">
        {isLoading ? (
          // 加载状态
          <div className="flex flex-col items-center space-y-2">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <span className="text-xs text-gray-500 dark:text-gray-400">生成缩略图...</span>
          </div>
        ) : error ? (
          // 错误状态
          <div className="flex flex-col items-center space-y-2 text-center p-4">
            <div className="w-12 h-12 text-red-400">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <span className="text-xs text-red-500 dark:text-red-400">缩略图生成失败</span>
          </div>
        ) : thumbnailUrl ? (
          // 缩略图显示
          <img
            src={thumbnailUrl}
            alt="PDF Thumbnail"
            className="w-full h-full object-contain"
          />
        ) : (
          // 默认状态
          <div className="flex flex-col items-center space-y-2 text-gray-400 dark:text-gray-500">
            <div className="w-12 h-12">
              <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <span className="text-xs">暂无预览</span>
          </div>
        )}

        {/* 页面指示器 */}
        {thumbnailUrl && (
          <div className="absolute bottom-2 right-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            第 1 页
          </div>
        )}
      </div>

      {/* 文件信息 */}
      <div className="p-3 border-t border-gray-100 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
              {fileName}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              PDF 预览
            </p>
          </div>
          
          {/* 操作按钮 */}
          <div className="flex items-center space-x-1 ml-2">
            {pdfData && (
              <button
                onClick={() => {
                  // 下载PDF文件
                  try {
                    const link = document.createElement('a')
                    link.href = `data:application/pdf;base64,${pdfData}`
                    link.download = fileName
                    document.body.appendChild(link)
                    link.click()
                    document.body.removeChild(link)
                  } catch (err) {
                    onError?.('下载失败')
                  }
                }}
                className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                title="下载PDF"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </button>
            )}
            
            <button
              onClick={() => generateThumbnail(pdfData || '')}
              className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
              title="刷新缩略图"
              disabled={!pdfData || isLoading}
            >
              <svg className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>
        </div>
      </div>

      {/* 隐藏的canvas用于生成缩略图 */}
      <canvas
        ref={canvasRef}
        className="hidden"
        width={200}
        height={280}
      />
    </div>
  )
}
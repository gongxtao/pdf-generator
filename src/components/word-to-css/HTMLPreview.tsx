'use client'

import { useState, useRef, useEffect, useCallback } from 'react'

interface HTMLPreviewProps {
  html: string
  css: string
  className?: string
  showCode?: boolean
  onCopyHTML?: () => void
  onCopyCSS?: () => void
  onDownload?: () => void
}

type ViewMode = 'preview' | 'code' | 'split' | 'print'

export default function HTMLPreview({
  html,
  css,
  className = '',
  showCode = true,
  onCopyHTML,
  onCopyCSS,
  onDownload
}: HTMLPreviewProps) {
  const [viewMode, setViewMode] = useState<ViewMode>('preview')
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [scale, setScale] = useState(100)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)

  // 生成完整的HTML文档
  const generateFullHTML = useCallback(() => {
    return `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>预览文档</title>
  <style>
    /* Word文档标准样式重置 */
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    html {
      font-size: 12pt;
      -webkit-text-size-adjust: 100%;
      -ms-text-size-adjust: 100%;
    }
    
    body {
      /* Word标准字体栈 */
      font-family: 'Times New Roman', 'SimSun', '宋体', 'Calibri', 'Arial', serif;
      font-size: 12pt;
      line-height: 1.15;
      color: #000000;
      background-color: #ffffff;
      margin: 0;
      padding: 20pt;
      /* Word页面标准尺寸 A4 */
      max-width: 595pt; /* A4宽度 */
      min-height: 842pt; /* A4高度 */
      margin: 0 auto;
      box-shadow: 0 0 10px rgba(0,0,0,0.1);
      position: relative;
    }
    
    /* Word标准段落样式 */
    p {
      margin: 0 0 6pt 0;
      text-align: justify;
      text-justify: inter-ideograph;
    }
    
    /* Word标准标题样式 */
    h1, h2, h3, h4, h5, h6 {
      font-weight: bold;
      margin: 12pt 0 6pt 0;
      line-height: 1.2;
    }
    
    h1 { font-size: 18pt; }
    h2 { font-size: 16pt; }
    h3 { font-size: 14pt; }
    h4 { font-size: 13pt; }
    h5 { font-size: 12pt; }
    h6 { font-size: 11pt; }
    
    /* Word标准表格样式 */
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 6pt 0;
      font-size: inherit;
    }
    
    td, th {
      border: 0.5pt solid #000000;
      padding: 3pt 6pt;
      vertical-align: top;
      text-align: left;
    }
    
    th {
      font-weight: bold;
      background-color: #f2f2f2;
    }
    
    /* Word标准列表样式 */
    ul, ol {
      margin: 6pt 0 6pt 24pt;
      padding: 0;
    }
    
    li {
      margin: 0 0 3pt 0;
    }
    
    /* Word标准图片样式 */
    img {
      max-width: 100%;
      height: auto;
      display: block;
      margin: 6pt auto;
    }
    
    /* 打印样式优化 */
    @media print {
      body {
        box-shadow: none;
        margin: 0;
        padding: 20pt;
      }
      
      @page {
        size: A4;
        margin: 2cm;
      }
    }
    
    /* 用户自定义样式 */
    ${css}
  </style>
</head>
<body>
  ${html}
</body>
</html>`
  }, [html, css])

  // 更新iframe内容
  const updateIframeContent = useCallback(() => {
    const iframe = iframeRef.current
    if (!iframe) return

    const fullHTML = generateFullHTML()
    const blob = new Blob([fullHTML], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    
    iframe.src = url
    
    // 清理旧的URL
    return () => URL.revokeObjectURL(url)
  }, [generateFullHTML])

  // 当HTML或CSS变化时更新预览
  useEffect(() => {
    const cleanup = updateIframeContent()
    return cleanup
  }, [updateIframeContent])

  // 处理全屏切换
  const toggleFullscreen = useCallback(() => {
    if (!containerRef.current) return

    if (!isFullscreen) {
      if (containerRef.current.requestFullscreen) {
        containerRef.current.requestFullscreen()
      }
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
    }
  }, [isFullscreen])

  // 监听全屏状态变化
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange)
  }, [])

  // 处理缩放
  const handleZoom = useCallback((newScale: number) => {
    setScale(Math.max(25, Math.min(200, newScale)))
  }, [])

  const baseClasses = `
    ${isFullscreen ? 'fixed inset-0 z-50 bg-white dark:bg-gray-900' : 'relative'}
    flex flex-col border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden
    ${className}
  `

  return (
    <div ref={containerRef} className={baseClasses}>
      {/* 工具栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center space-x-2">
          {/* 视图模式切换 */}
          <div className="flex items-center bg-white dark:bg-gray-700 rounded-lg p-1 border border-gray-200 dark:border-gray-600">
            <button
              onClick={() => setViewMode('preview')}
              className={`px-3 py-1 text-xs rounded transition-colors ${
                viewMode === 'preview'
                  ? 'bg-blue-500 text-white'
                  : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
              }`}
            >
              预览
            </button>
            {showCode && (
              <>
                <button
                  onClick={() => setViewMode('code')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'code'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  代码
                </button>
                <button
                  onClick={() => setViewMode('split')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'split'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  分屏
                </button>
                <button
                  onClick={() => setViewMode('print')}
                  className={`px-3 py-1 text-xs rounded transition-colors ${
                    viewMode === 'print'
                      ? 'bg-blue-500 text-white'
                      : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-600'
                  }`}
                >
                  打印预览
                </button>
              </>
            )}
          </div>

          {/* 缩放控制 */}
          {(viewMode === 'preview' || viewMode === 'split' || viewMode === 'print') && (
            <div className="flex items-center space-x-1">
              <button
                onClick={() => handleZoom(scale - 25)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={scale <= 25}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="text-xs text-gray-600 dark:text-gray-400 min-w-[3rem] text-center">
                {scale}%
              </span>
              <button
                onClick={() => handleZoom(scale + 25)}
                className="p-1 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                disabled={scale >= 200}
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
              <button
                onClick={() => handleZoom(100)}
                className="px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              >
                重置
              </button>
            </div>
          )}
        </div>

        {/* 操作按钮 */}
        <div className="flex items-center space-x-2">
          {onCopyHTML && (
            <button
              onClick={onCopyHTML}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="复制HTML"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          
          {onCopyCSS && (
            <button
              onClick={onCopyCSS}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="复制CSS"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
              </svg>
            </button>
          )}
          
          {onDownload && (
            <button
              onClick={onDownload}
              className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
              title="下载文件"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </button>
          )}
          
          <button
            onClick={toggleFullscreen}
            className="p-2 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 9V4.5M9 9H4.5M9 9L3.5 3.5m11 5.5V4.5M15 9h4.5M15 9l5.5-5.5M9 15v4.5M9 15H4.5M9 15l-5.5 5.5m11-5.5v4.5m0-4.5h4.5m0 0l-5.5 5.5" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 flex overflow-hidden">
        {/* 预览模式 */}
        {viewMode === 'preview' && (
          <div className="flex-1 bg-gray-200 dark:bg-gray-800 p-6 overflow-auto">
            <div 
                className="bg-white shadow-xl mx-auto border border-gray-300 dark:border-gray-600"
                style={{ 
                  transform: `scale(${scale / 100})`,
                  transformOrigin: 'top center',
                  width: scale < 100 ? `${10000 / scale}%` : '100%',
                  maxWidth: '210mm', /* A4宽度 */
                  minHeight: '297mm', /* A4高度 */
                  aspectRatio: '210/297'
                }}
              >
              <iframe
                ref={iframeRef}
                className="w-full h-full min-h-[842pt] border-0 rounded-sm"
                title="Word文档预览"
                sandbox="allow-same-origin allow-scripts"
                style={{
                  backgroundColor: '#ffffff',
                  minHeight: '297mm'
                }}
              />
            </div>
          </div>
        )}

        {/* 代码模式 */}
        {viewMode === 'code' && showCode && (
          <div className="flex-1 flex flex-col">
            <div className="flex-1 flex">
              {/* HTML代码 */}
              <div className="flex-1 flex flex-col border-r border-gray-200 dark:border-gray-700">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">HTML</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
                    <code>{html}</code>
                  </pre>
                </div>
              </div>
              
              {/* CSS代码 */}
              <div className="flex-1 flex flex-col">
                <div className="px-4 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">CSS</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <pre className="p-4 text-sm text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
                    <code>{css}</code>
                  </pre>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 分屏模式 */}
        {viewMode === 'split' && showCode && (
          <>
            {/* 预览区域 */}
            <div className="flex-1 bg-gray-200 dark:bg-gray-800 p-3 overflow-auto border-r border-gray-200 dark:border-gray-700">
              <div 
                className="bg-white shadow-lg mx-auto border border-gray-300 dark:border-gray-600"
                style={{ 
                  transform: `scale(${scale / 100})`,
                  transformOrigin: 'top center',
                  width: scale < 100 ? `${10000 / scale}%` : '100%',
                  maxWidth: '180mm', /* 分屏模式下稍小的A4宽度 */
                  minHeight: '240mm', /* 分屏模式下稍小的A4高度 */
                  aspectRatio: '210/297'
                }}
              >
                <iframe
                  ref={iframeRef}
                  className="w-full h-full min-h-[600pt] border-0 rounded-sm"
                  title="Word文档预览"
                  sandbox="allow-same-origin allow-scripts"
                  style={{
                    backgroundColor: '#ffffff',
                    minHeight: '240mm'
                  }}
                />
              </div>
            </div>
            
            {/* 代码区域 */}
            <div className="flex-1 flex flex-col">
              {/* HTML代码 */}
              <div className="flex-1 flex flex-col border-b border-gray-200 dark:border-gray-700">
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">HTML</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <pre className="p-3 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
                    <code>{html}</code>
                  </pre>
                </div>
              </div>
              
              {/* CSS代码 */}
              <div className="flex-1 flex flex-col">
                <div className="px-3 py-2 bg-gray-100 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                  <span className="text-xs font-medium text-gray-700 dark:text-gray-300">CSS</span>
                </div>
                <div className="flex-1 overflow-auto">
                  <pre className="p-3 text-xs text-gray-800 dark:text-gray-200 bg-white dark:bg-gray-900">
                    <code>{css}</code>
                  </pre>
                </div>
              </div>
            </div>
          </>
        )}

        {/* 打印预览模式 */}
        {viewMode === 'print' && (
          <div className="flex-1 bg-gray-300 dark:bg-gray-700 p-8 overflow-auto">
            <div className="max-w-4xl mx-auto">
              {/* 页面指示器 */}
              <div className="text-center mb-4">
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  打印预览 - A4页面 (210mm × 297mm)
                </span>
              </div>
              
              {/* 打印页面容器 */}
              <div 
                className="bg-white shadow-2xl mx-auto border border-gray-400 dark:border-gray-500 relative"
                style={{ 
                  transform: `scale(${scale / 100})`,
                  transformOrigin: 'top center',
                  width: scale < 100 ? `${21000 / scale}%` : '210mm',
                  minHeight: '297mm',
                  maxWidth: '210mm',
                  aspectRatio: '210/297'
                }}
              >
                {/* 页面边距指示器 */}
                <div className="absolute inset-0 pointer-events-none">
                  {/* 上边距 */}
                  <div className="absolute top-0 left-0 right-0 h-[20mm] border-b border-dashed border-gray-300 opacity-30"></div>
                  {/* 下边距 */}
                  <div className="absolute bottom-0 left-0 right-0 h-[20mm] border-t border-dashed border-gray-300 opacity-30"></div>
                  {/* 左边距 */}
                  <div className="absolute top-0 bottom-0 left-0 w-[20mm] border-r border-dashed border-gray-300 opacity-30"></div>
                  {/* 右边距 */}
                  <div className="absolute top-0 bottom-0 right-0 w-[20mm] border-l border-dashed border-gray-300 opacity-30"></div>
                </div>
                
                <iframe
                  ref={iframeRef}
                  className="w-full h-full min-h-[297mm] border-0"
                  title="Word文档打印预览"
                  sandbox="allow-same-origin allow-scripts"
                  style={{
                    backgroundColor: '#ffffff',
                    minHeight: '297mm'
                  }}
                />
              </div>
              
              {/* 打印提示 */}
              <div className="text-center mt-4">
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  此预览显示文档在A4纸张上的打印效果，包括页面边距指示
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
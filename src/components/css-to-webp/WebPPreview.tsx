'use client'

import React, { useState, useRef, useEffect } from 'react'
import html2canvas from 'html2canvas'

interface WebPPreviewProps {
  generatedHtml?: string
  generationStep?: 'idle' | 'generating-html' | 'generating-webp' | 'completed'
  onWebPGenerated?: (webpUrl: string) => void
  onGenerationError?: (error: string) => void
}

interface WebPSettings {
  width: number
  height: number
  quality: number
  backgroundColor: string
  scale: number
}

const WebPPreview: React.FC<WebPPreviewProps> = ({
  generatedHtml,
  generationStep,
  onWebPGenerated,
  onGenerationError
}) => {
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedWebP, setGeneratedWebP] = useState<string | null>(null)
  const [previewHtml, setPreviewHtml] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [isPreviewLoading, setIsPreviewLoading] = useState(false)
  const [successMessage, setSuccessMessage] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null)
  const [webpSettings, setWebpSettings] = useState<WebPSettings>({
    width: 800,
    height: 1123,
    quality: 90,
    backgroundColor: '#ffffff',
    scale: 1
  })
  const [showSettings, setShowSettings] = useState(false)
  const iframeRef = useRef<HTMLIFrameElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)

  // 当接收到生成的HTML时，设置预览HTML
  useEffect(() => {
    if (generatedHtml) {
      setPreviewHtml(generatedHtml)
    } else {
      setPreviewHtml('')
    }
  }, [generatedHtml])

  // 自动清除消息
  useEffect(() => {
    if (successMessage) {
      const timer = setTimeout(() => {
        setSuccessMessage(null)
      }, 3000)
      return () => clearTimeout(timer)
    }
  }, [successMessage])

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => {
        setError(null)
      }, 5000)
      return () => clearTimeout(timer)
    }
  }, [error])

  // 生成WebP
  const generateWebP = async (): Promise<void> => {
    if (!iframeRef.current || !previewHtml) {
      setError('请先选择模板并编辑CSS')
      return Promise.resolve()
    }

    setIsGenerating(true)
    setError(null)
    setSuccessMessage(null)
    
    try {
      // 等待iframe加载完成
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // 获取iframe的document
      const iframeDoc = iframeRef.current.contentDocument || iframeRef.current.contentWindow?.document
      if (!iframeDoc) {
        throw new Error('无法访问iframe内容')
      }

      // 使用html2canvas捕获iframe内容
      const canvas = await html2canvas(iframeDoc.body, {
        width: webpSettings.width,
        height: webpSettings.height,
        useCORS: true,
        allowTaint: true,
        logging: false
      })

      // 如果需要调整尺寸，创建新的canvas
      let finalCanvas = canvas
      if (canvas.width !== webpSettings.width || canvas.height !== webpSettings.height) {
        finalCanvas = document.createElement('canvas')
        const ctx = finalCanvas.getContext('2d')
        if (!ctx) throw new Error('无法创建canvas上下文')

        finalCanvas.width = webpSettings.width
        finalCanvas.height = webpSettings.height

        // 设置背景色
        ctx.fillStyle = webpSettings.backgroundColor
        ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

        // 绘制缩放后的图像
        ctx.drawImage(canvas, 0, 0, webpSettings.width, webpSettings.height)
      }

      // 转换为WebP
      const webpDataUrl = finalCanvas.toDataURL('image/webp', webpSettings.quality / 100)
      setGeneratedWebP(webpDataUrl)
      onWebPGenerated?.(webpDataUrl)
      setSuccessMessage('WebP生成成功！')
      
      return Promise.resolve()
      
    } catch (error) {
      console.error('生成WebP失败:', error)
      setError('生成WebP失败，请检查模板和CSS内容')
      // 如果html2canvas失败，回退到简单的canvas方法
      try {
        const canvas = canvasRef.current
        if (!canvas) return Promise.resolve()

        const ctx = canvas.getContext('2d')
        if (!ctx) return Promise.resolve()

        // 设置canvas尺寸
        canvas.width = webpSettings.width * webpSettings.scale
        canvas.height = webpSettings.height * webpSettings.scale
        
        // 设置背景色
        ctx.fillStyle = webpSettings.backgroundColor
        ctx.fillRect(0, 0, canvas.width, canvas.height)
        
        // 添加示例内容
        ctx.fillStyle = '#333333'
        ctx.font = `${24 * webpSettings.scale}px Arial`
        ctx.textAlign = 'center'
        
        const titleText = '标题'
        const bodyText = '内容'
        
        ctx.fillText(titleText, canvas.width / 2, 60 * webpSettings.scale)
        
        ctx.font = `${16 * webpSettings.scale}px Arial`
        const lines = bodyText.split('\n')
        lines.forEach((line: string, index: number) => {
          ctx.fillText(line, canvas.width / 2, (120 + index * 30) * webpSettings.scale)
        })

        // 转换为WebP
        const webpDataUrl = canvas.toDataURL('image/webp', webpSettings.quality / 100)
        setGeneratedWebP(webpDataUrl)
        onWebPGenerated?.(webpDataUrl)
        setSuccessMessage('WebP生成成功！（使用回退方法）')
        setError(null)
        
        return Promise.resolve()
      } catch (fallbackError) {
        console.error('回退方法也失败:', fallbackError)
        setError('WebP生成失败，请尝试调整设置或重新选择模板')
        return Promise.reject(fallbackError)
      }
    } finally {
      setIsGenerating(false)
    }
  }

  // 下载WebP（直接下载生成的图片）
  const downloadWebP = async () => {
    if (!generatedWebP) {
      setError('请先生成WebP图片')
      return
    }
    
    try {
      // 将data URL转换为blob
      const response = await fetch(generatedWebP)
      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.download = 'preview.webp'
      link.href = url
      link.click()
      window.URL.revokeObjectURL(url)
      setSuccessMessage('文件下载成功')
    } catch (error) {
      console.error('下载失败:', error)
      setError('下载失败，请重试')
    }
  }

  // 复制上传链接到剪贴板
  const copyUploadedLink = async () => {
    if (!uploadedUrl) {
      setError('请先上传WebP图片')
      return
    }
    
    try {
      await navigator.clipboard.writeText(uploadedUrl)
      setSuccessMessage('链接已复制到剪贴板')
      setError(null)
    } catch (error) {
      console.error('复制失败:', error)
      setError('复制失败，请手动复制链接')
    }
  }

  // 上传WebP到云存储（如果没有生成则先生成）
  const uploadWebP = async () => {
    setIsUploading(true)
    setError(null)
    setSuccessMessage(null)

    try {
      let webpData = generatedWebP
      
      // 如果没有生成WebP，先生成
      if (!webpData) {
        if (!previewHtml) {
          setError('请先选择模板并编辑CSS')
          setIsUploading(false)
          return
        }
        
        setIsGenerating(true)
        
        try {
          // 等待iframe加载完成
          await new Promise(resolve => setTimeout(resolve, 500))
          
          // 获取iframe的document
          const iframeDoc = iframeRef.current?.contentDocument || iframeRef.current?.contentWindow?.document
          if (!iframeDoc) {
            throw new Error('无法访问iframe内容')
          }

          // 使用html2canvas捕获iframe内容
          const canvas = await html2canvas(iframeDoc.body, {
            width: webpSettings.width,
            height: webpSettings.height,
            useCORS: true,
            allowTaint: true,
            logging: false
          })

          // 如果需要调整尺寸，创建新的canvas
          let finalCanvas = canvas
          if (canvas.width !== webpSettings.width || canvas.height !== webpSettings.height) {
            finalCanvas = document.createElement('canvas')
            const ctx = finalCanvas.getContext('2d')
            if (!ctx) throw new Error('无法创建canvas上下文')

            finalCanvas.width = webpSettings.width
            finalCanvas.height = webpSettings.height

            // 设置背景色
            ctx.fillStyle = webpSettings.backgroundColor
            ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height)

            // 绘制缩放后的图像
            ctx.drawImage(canvas, 0, 0, webpSettings.width, webpSettings.height)
          }

          // 转换为WebP
          webpData = finalCanvas.toDataURL('image/webp', webpSettings.quality / 100)
          setGeneratedWebP(webpData)
          onWebPGenerated?.(webpData)
          
        } catch (error) {
          console.error('生成WebP失败:', error)
          setError('生成WebP失败，请检查模板和CSS内容')
          setIsGenerating(false)
          setIsUploading(false)
          return
        } finally {
          setIsGenerating(false)
        }
      }

      const response = await fetch('/api/upload-webp', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            webpData: webpData,
            filename: `webp_${Date.now()}.webp`
          })
        })

      const result = await response.json()

      if (result.success) {
        setUploadedUrl(result.url)
        setSuccessMessage(`上传成功！文件链接: ${result.url}`)
      } else {
        setError(result.error || '上传失败')
      }
    } catch (error) {
      console.error('上传失败:', error)
      setError('上传失败，请重试')
    } finally {
      setIsUploading(false)
    }
  }

  // 暴露generateWebP方法给父组件
   useEffect(() => {
     const element = document.querySelector('[data-webp-preview]') as any;
     if (element) {
       element.generateWebP = generateWebP;
     }
     
     // 清理函数
     return () => {
       if (element) {
         delete element.generateWebP;
       }
     };
   }, [generateWebP]);

  // 监听generatedHtml变化，自动生成WebP
  useEffect(() => {
    if (generatedHtml && generationStep === 'generating-webp') {
      const generateWebPFromHtml = async () => {
        try {
          setIsGenerating(true);
          
          // 创建临时iframe来渲染HTML
          const tempIframe = document.createElement('iframe');
          tempIframe.style.position = 'absolute';
          tempIframe.style.left = '-9999px';
          tempIframe.style.width = `${webpSettings.width}px`;
          tempIframe.style.height = `${webpSettings.height}px`;
          document.body.appendChild(tempIframe);
          
          // 写入HTML内容
          const iframeDoc = tempIframe.contentDocument || tempIframe.contentWindow?.document;
          if (!iframeDoc) {
            throw new Error('无法访问iframe内容');
          }
          
          iframeDoc.open();
          iframeDoc.write(generatedHtml);
          iframeDoc.close();
          
          // 等待内容加载
          await new Promise(resolve => setTimeout(resolve, 1000));
          
          // 获取实际内容高度
          const actualHeight = Math.max(
            iframeDoc.body.scrollHeight,
            iframeDoc.body.offsetHeight,
            iframeDoc.documentElement.clientHeight,
            iframeDoc.documentElement.scrollHeight,
            iframeDoc.documentElement.offsetHeight
          );
          
          // 使用html2canvas生成WebP，捕获完整内容
          const canvas = await html2canvas(iframeDoc.body, {
            width: webpSettings.width,
            height: actualHeight,
            useCORS: true,
            allowTaint: true,
            logging: false
          });
          
          // 创建最终canvas，等比例缩放到目标尺寸
          const finalCanvas = document.createElement('canvas');
          const ctx = finalCanvas.getContext('2d');
          if (!ctx) throw new Error('无法创建canvas上下文');
          
          finalCanvas.width = webpSettings.width;
          finalCanvas.height = webpSettings.height;
          
          // 设置背景色
          ctx.fillStyle = webpSettings.backgroundColor;
          ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);
          
          // 计算缩放比例，保持宽高比
          const scaleX = webpSettings.width / canvas.width;
          const scaleY = webpSettings.height / canvas.height;
          const scale = Math.min(scaleX, scaleY);
          
          // 计算居中位置
          const scaledWidth = canvas.width * scale;
          const scaledHeight = canvas.height * scale;
          const x = (webpSettings.width - scaledWidth) / 2;
          const y = (webpSettings.height - scaledHeight) / 2;
          
          // 绘制缩放后的图像
          ctx.drawImage(canvas, x, y, scaledWidth, scaledHeight);
          
          // 转换为WebP
          const webpDataUrl = finalCanvas.toDataURL('image/webp', webpSettings.quality / 100);
          setGeneratedWebP(webpDataUrl);
          onWebPGenerated?.(webpDataUrl);
          
          // 清理临时iframe
          document.body.removeChild(tempIframe);
          
        } catch (error) {
          console.error('WebP生成失败:', error);
          onGenerationError?.(error instanceof Error ? error.message : '未知错误');
        } finally {
          setIsGenerating(false);
        }
      };
      
      generateWebPFromHtml();
    }
  }, [generatedHtml, generationStep, webpSettings, onWebPGenerated, onGenerationError]);

  return (
    <div 
      className="h-full flex flex-col bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
      data-webp-preview
    >
      {/* 头部工具栏 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
          预览
        </h3>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSettings(!showSettings)}
            className="px-3 py-1 text-sm bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
          >
            设置
          </button>

          <button
            onClick={uploadWebP}
            disabled={!generatedWebP || isUploading || isGenerating}
            className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            {(isUploading || isGenerating) ? (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
              </svg>
            )}
            {isGenerating ? '生成中...' : isUploading ? '上传中...' : '上传'}
          </button>
          <button
            onClick={downloadWebP}
            disabled={!generatedWebP}
            className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            下载
          </button>
          <button
            onClick={copyUploadedLink}
            disabled={!uploadedUrl}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center gap-2"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
            </svg>
            复制链接
          </button>
        </div>
      </div>

      {/* 消息提示区域 */}
      {(error || successMessage || uploadedUrl) && (
        <div className="px-4 py-2 border-b border-gray-200 dark:border-gray-700">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mb-2">
              <svg className="h-5 w-5 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-red-700 dark:text-red-300">{error}</span>
              <button
                onClick={() => setError(null)}
                className="ml-auto text-red-500 hover:text-red-700 dark:hover:text-red-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {successMessage && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg mb-2">
              <svg className="h-5 w-5 text-green-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span className="text-sm text-green-700 dark:text-green-300">{successMessage}</span>
              <button
                onClick={() => setSuccessMessage(null)}
                className="ml-auto text-green-500 hover:text-green-700 dark:hover:text-green-300"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          )}
          {uploadedUrl && (
            <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-2">
                <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
                </svg>
                <span className="text-blue-700 dark:text-blue-300 font-medium">上传链接:</span>
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  value={uploadedUrl}
                  readOnly
                  className="flex-1 px-3 py-2 text-sm bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uploadedUrl)
                    setSuccessMessage('链接已复制到剪贴板')
                  }}
                  className="px-3 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 flex items-center gap-1"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                  </svg>
                  复制
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 设置面板 */}
      {showSettings && (
        <div className="p-4 bg-gray-50 dark:bg-gray-700 border-b border-gray-200 dark:border-gray-600">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                宽度 (px)
              </label>
              <input
                type="number"
                value={webpSettings.width}
                onChange={(e) => setWebpSettings(prev => ({ ...prev, width: parseInt(e.target.value) || 800 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                高度 (px)
              </label>
              <input
                type="number"
                value={webpSettings.height}
                onChange={(e) => setWebpSettings(prev => ({ ...prev, height: parseInt(e.target.value) || 600 }))}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                质量 (%)
              </label>
              <input
                type="range"
                min="10"
                max="100"
                value={webpSettings.quality}
                onChange={(e) => setWebpSettings(prev => ({ ...prev, quality: parseInt(e.target.value) }))}
                className="w-full"
              />
              <span className="text-sm text-gray-500 dark:text-gray-400">{webpSettings.quality}%</span>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                背景色
              </label>
              <input
                type="color"
                value={webpSettings.backgroundColor}
                onChange={(e) => setWebpSettings(prev => ({ ...prev, backgroundColor: e.target.value }))}
                className="w-full h-10 border border-gray-300 dark:border-gray-600 rounded-md"
              />
            </div>
          </div>
        </div>
      )}

      {/* 预览区域 */}
      <div className="flex-1 p-4">
        {generatedWebP ? (
          <div className="h-full flex flex-col">
            <h4 className="font-medium text-gray-900 dark:text-white mb-4 text-center">生成的WebP图片</h4>
            <div className="flex-1 flex items-center justify-center border border-gray-200 dark:border-gray-600 rounded-lg p-4 bg-gray-50 dark:bg-gray-700">
              <img
                src={generatedWebP}
                alt="Generated WebP"
                className="max-w-full max-h-full object-contain rounded shadow-lg"
              />
            </div>
          </div>
        ) : (
          <div className="h-full flex flex-col items-center justify-center text-gray-500 dark:text-gray-400">
            <svg className="w-16 h-16 mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <p className="text-lg font-medium mb-2">暂无预览内容</p>
            <p className="text-sm text-center max-w-md">
              点击左侧的 <span className="font-medium text-blue-600 dark:text-blue-400">🎨 生成图片</span> 按钮，生成WebP图片后将在此处显示
            </p>
          </div>
        )}
        
        {/* 隐藏的iframe用于生成WebP */}
        {previewHtml && (
          <iframe
            ref={iframeRef}
            srcDoc={previewHtml}
            className="absolute opacity-0 pointer-events-none"
            style={{ left: '-9999px', width: '800px', height: '600px' }}
            title="隐藏预览用于生成WebP"
          />
        )}
      </div>

      {/* 隐藏的canvas用于生成图片 */}
      <canvas
        ref={canvasRef}
        style={{ display: 'none' }}
      />
    </div>
  )
}

export default WebPPreview
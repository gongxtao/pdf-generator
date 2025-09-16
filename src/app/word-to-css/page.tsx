'use client'

import { useState, useCallback } from 'react'
import JSZip from 'jszip'
import Toast from '@/components/Toast'
import LoadingSpinner from '@/components/LoadingSpinner'
import DropZone from '@/components/word-to-css/DropZone'
import HTMLPreview from '@/components/word-to-css/HTMLPreview'

// 定义接口类型
interface ParseResult {
  html: string
  css: string
  images: Array<{ name: string; data: string }>
}

interface ParseError {
  error: string
}

interface ParsedDocument {
  html: string
  css: string
  images: Array<{ name: string; data: string }>
  metadata?: {
    title: string
    wordCount: number
    pageCount: number
  }
}

export default function WordToCSSPage() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [parseTime, setParseTime] = useState<number>(0)
  const [nodeCount, setNodeCount] = useState<number>(0)
  const [uploadProgress, setUploadProgress] = useState(0)

  // 文件上传处理
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    // 重置状态
    setFile(uploadedFile)
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)
    setParsedDocument(null)
    
    const startTime = Date.now()

    try {
      // 客户端基础验证（快速反馈）
      if (uploadedFile.size > 10 * 1024 * 1024) {
        throw new Error(`文件大小不能超过10MB，当前文件大小: ${Math.round(uploadedFile.size / 1024 / 1024 * 100) / 100}MB`)
      }
      
      if (uploadedFile.size === 0) {
        throw new Error('文件内容为空，请检查文件是否损坏')
      }

      // 文件类型检查
      const allowedTypes = ['.docx', '.doc']
      const isValidType = allowedTypes.some(type => 
        uploadedFile.name.toLowerCase().endsWith(type)
      )
      
      if (!isValidType) {
        throw new Error('不支持的文件格式，请上传 Word 文档 (.doc 或 .docx)')
      }
      
      // 检查文件名
      if (uploadedFile.name.length > 255) {
        throw new Error('文件名过长，请重命名后重试')
      }
      
      const invalidChars = /[<>:"/\\|?*]/
      if (invalidChars.test(uploadedFile.name)) {
        throw new Error('文件名包含无效字符，请重命名后重试')
      }

      setUploadProgress(25)
      setToast({ message: '正在上传文件...', type: 'success' })

      const formData = new FormData()
      formData.append('file', uploadedFile)

      setUploadProgress(50)
      setToast({ message: '正在解析文档结构...', type: 'success' })

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(75)
      setToast({ message: '正在生成预览...', type: 'success' })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '服务器响应错误' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        // 处理服务器返回的详细错误信息
        let errorMessage = result.error || result.message || '解析失败'
        
        // 根据错误代码提供更友好的错误信息
        switch (result.code) {
          case 'NO_FILE':
            errorMessage = '没有检测到上传的文件，请重新选择文件'
            break
          case 'INVALID_FILE_TYPE':
            errorMessage = '不支持的文件格式，请上传 Word 文档 (.doc 或 .docx)'
            break
          case 'FILE_TOO_LARGE':
            errorMessage = result.error || '文件过大，请压缩后重试'
            break
          case 'EMPTY_FILE':
            errorMessage = '文件内容为空，请检查文件是否损坏'
            break
          case 'CORRUPTED_FILE':
            errorMessage = '文档文件已损坏，请尝试重新保存文档后上传'
            break
          case 'ENCRYPTED_FILE':
            errorMessage = '不支持加密或受密码保护的文档，请移除密码保护后重试'
            break
          case 'INVALID_FORMAT':
            errorMessage = '文档格式不正确，请确保是有效的Word文档'
            break
          case 'PARSE_RESULT_INVALID':
            errorMessage = '文档解析失败，可能是文档格式不正确或文档已损坏'
            break
          case 'INSUFFICIENT_CONTENT':
            errorMessage = '文档内容过少或无法识别，请检查文档是否包含有效内容'
            break
          case 'INTERNAL_ERROR':
            errorMessage = '服务器内部错误，请稍后重试'
            break
        }
        
        throw new Error(errorMessage)
      }

      // 验证解析结果的完整性
      if (!result.data.html) {
        throw new Error('解析结果不完整，请重试')
      }
      
      if (result.data.html.trim().length < 50) {
        throw new Error('文档内容过少或无法识别，请检查文档是否包含有效内容')
      }

      setUploadProgress(100)

      // 设置解析结果
      const parsedResult: ParsedDocument = {
        html: result.data.html,
        css: result.data.css,
        images: result.data.images || [],
        metadata: result.data.metadata || {
          title: uploadedFile.name,
          wordCount: 0,
          pageCount: 1
        }
      }
      
      setParsedDocument(parsedResult)
      setParseTime((Date.now() - startTime) / 1000)
      
      // 计算HTML节点数量（简单估算）
      const nodeCount = (result.data.html.match(/<[^>]+>/g) || []).length
      setNodeCount(nodeCount)
      
      setToast({ message: `文档解析成功！HTML: ${result.data.html.length} 字符，CSS: ${result.data.css.length} 字符`, type: 'success' })
      
      // 3秒后清除成功消息
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      console.error('文件处理失败:', err)
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      setToast({ message: `解析失败: ${errorMessage}`, type: 'error' })
      setUploadProgress(0)
      
      // 如果是网络错误，提供额外提示
      if (err instanceof TypeError && err.message.includes('fetch')) {
        setError('网络连接失败，请检查网络连接后重试')
        setToast({ message: '网络连接失败，请检查网络连接后重试', type: 'error' })
      }
    } finally {
      setIsUploading(false)
    }
  }, [])

  // 复制到剪贴板
  const handleCopyToClipboard = useCallback(async (content: string, type: string) => {
    try {
      if (!content || content.trim() === '') {
        throw new Error('没有内容可复制')
      }
      
      await navigator.clipboard.writeText(content)
      setToast({ message: `${type} 已复制到剪贴板`, type: 'success' })
      setError(null)
    } catch (err) {
      console.error('复制失败:', err)
      const errorMessage = err instanceof Error ? err.message : '复制失败'
      setError(`复制 ${type} 失败: ${errorMessage}`)
      setToast({ message: `复制 ${type} 失败: ${errorMessage}`, type: 'error' })
    }
  }, [])

  // CSS模板提取功能
  const extractCSSTemplate = (css: string): string => {
    // 移除具体的颜色值、字体大小等，保留结构
    let template = css
      // 移除具体颜色值，替换为变量
      .replace(/#[0-9a-fA-F]{3,6}/g, 'var(--primary-color)')
      .replace(/rgb\([^)]+\)/g, 'var(--text-color)')
      .replace(/rgba\([^)]+\)/g, 'var(--background-color)')
      // 移除具体字体大小，替换为相对单位
      .replace(/\d+px/g, '1rem')
      .replace(/\d+pt/g, '1rem')
      // 移除具体边距值
      .replace(/margin:\s*\d+[px|pt|em|rem]/g, 'margin: var(--spacing)')
      .replace(/padding:\s*\d+[px|pt|em|rem]/g, 'padding: var(--spacing)')
      // 添加CSS变量定义
    
    const cssVariables = `
/* CSS变量定义 - 可根据需要自定义 */
:root {
  --primary-color: #3b82f6;
  --text-color: #1f2937;
  --background-color: #ffffff;
  --spacing: 1rem;
  --border-radius: 0.5rem;
  --font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
}

`
    
    return cssVariables + template
  }

  // 生成CSS模板
  const generateCSSTemplate = () => {
    if (!parsedDocument) {
      setError('请先上传并解析Word文档')
      setToast({ message: '请先上传并解析Word文档', type: 'error' })
      return
    }
    
    try {
      const template = extractCSSTemplate(parsedDocument.css)
      handleCopyToClipboard(template, 'CSS模板')
    } catch (error) {
      console.error('生成CSS模板失败:', error)
      const errorMessage = error instanceof Error ? error.message : '生成CSS模板失败'
      setError(errorMessage)
      setToast({ message: errorMessage, type: 'error' })
    }
  }

  // 下载文件包
  const handleDownload = useCallback(async (parsedDoc: ParsedDocument) => {
    if (!parsedDoc) {
      setError('没有可下载的内容')
      setToast({ message: '没有可下载的内容', type: 'error' })
      return
    }

    try {
      setToast({ message: '正在准备下载...', type: 'success' })
      
      // 创建ZIP包
       const zip = new JSZip()
       
       // 处理HTML内容，添加CSS引用和修正图片路径
       let htmlContent = parsedDoc.html || ''
       if (htmlContent.trim()) {
         // 检查是否已有CSS链接，如果没有则添加
         if (!htmlContent.includes('<link') && !htmlContent.includes('styles.css')) {
           // 在head标签中添加CSS引用
           if (htmlContent.includes('<head>')) {
             htmlContent = htmlContent.replace(
               '<head>',
               '<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Word转CSS文档</title>\n    <link rel="stylesheet" href="styles.css">'
             )
           } else if (htmlContent.includes('<html>')) {
             // 如果没有head标签，创建一个
             htmlContent = htmlContent.replace(
               '<html>',
               '<html>\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Word转CSS文档</title>\n    <link rel="stylesheet" href="styles.css">\n</head>'
             )
           } else {
             // 如果没有html标签，创建完整的HTML结构
             htmlContent = `<!DOCTYPE html>\n<html lang="zh-CN">\n<head>\n    <meta charset="UTF-8">\n    <meta name="viewport" content="width=device-width, initial-scale=1.0">\n    <title>Word转CSS文档</title>\n    <link rel="stylesheet" href="styles.css">\n</head>\n<body>\n${htmlContent}\n</body>\n</html>`
           }
         }
         
         // 修正图片路径
         if (parsedDoc.images && parsedDoc.images.length > 0) {
           parsedDoc.images.forEach((image, index) => {
             if (image.name) {
               // 将base64图片引用替换为相对路径
               const base64Pattern = new RegExp(`data:image/[^;]+;base64,[^"'\\s>]+`, 'g')
               htmlContent = htmlContent.replace(base64Pattern, `images/${image.name}`)
             }
           })
         }
         
         zip.file('index.html', htmlContent)
       }
       
       // 添加CSS文件
       if (parsedDoc.css && parsedDoc.css.trim()) {
         zip.file('styles.css', parsedDoc.css)
       }
      
      // 添加图片文件
      if (parsedDoc.images && parsedDoc.images.length > 0) {
        const imagesFolder = zip.folder('images')
        parsedDoc.images.forEach((image, index) => {
          if (image.data && image.name) {
            // 移除data URL前缀
            const base64Data = image.data.replace(/^data:image\/[a-z]+;base64,/, '')
            imagesFolder?.file(image.name || `image_${index}.png`, base64Data, { base64: true })
          }
        })
      }
      
      // 添加README文件
      const readme = `# Word转CSS项目\n\n## 文件说明\n- index.html: 转换后的HTML文件\n- styles.css: 转换后的CSS样式文件\n- images/: 文档中的图片文件\n\n## 使用方法\n1. 在浏览器中打开 index.html\n2. 根据需要修改 styles.css 中的样式\n\n生成时间: ${new Date().toLocaleString()}`
      zip.file('README.md', readme)
      
      // 生成ZIP文件
      const content = await zip.generateAsync({ type: 'blob' })
      
      // 下载ZIP文件
      const url = URL.createObjectURL(content)
      const a = document.createElement('a')
      a.href = url
      a.download = `word-to-css-${Date.now()}.zip`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
      
      setToast({ message: 'ZIP文件包下载成功', type: 'success' })
      setError(null)
    } catch (err) {
      console.error('下载失败:', err)
      const errorMessage = err instanceof Error ? err.message : '下载失败'
      setError(`下载失败: ${errorMessage}`)
      setToast({ message: `下载失败: ${errorMessage}`, type: 'error' })
    }
  }, [])

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 主工作区 */}
      <div className="h-[calc(100vh-4rem)] flex">
        {/* 左侧面板 - 上传和PDF预览 */}
        <div className="w-1/3 bg-gray-50 dark:bg-gray-800 p-6 flex flex-col">
          {/* 上传区域 */}
          <div className="mb-6">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Word 文档上传
            </h2>
            
            {/* 文件上传组件 */}
            <DropZone
              onFileUpload={handleFileUpload}
              isUploading={isUploading}
              accept=".docx"
              maxSize={1024 * 1024} // 1MB
            />
            
            {/* 错误提示 */}
            {error && (
              <div className="mt-4 p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
                <div className="flex items-start space-x-3">
                  <svg className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  <div className="flex-1">
                    <p className="text-red-800 dark:text-red-200 font-medium">处理失败</p>
                    <p className="text-red-700 dark:text-red-300 text-sm mt-1">{error}</p>
                  </div>
                  <button
                    onClick={() => setError(null)}
                    className="text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-200"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                {file && (
                  <button
                    onClick={() => {
                      const url = URL.createObjectURL(file)
                      const a = document.createElement('a')
                      a.href = url
                      a.download = file.name
                      a.click()
                      URL.revokeObjectURL(url)
                    }}
                    className="mt-3 text-sm text-red-600 dark:text-red-400 underline hover:no-underline"
                  >
                    下载原文件
                  </button>
                )}
              </div>
            )}

            {/* 上传进度条 */}
            {isUploading && uploadProgress > 0 && (
              <div className="mt-4 p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">处理进度</span>
                  <span className="text-sm text-gray-500 dark:text-gray-400">{uploadProgress}%</span>
                </div>
                <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                  <div 
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300 ease-out"
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
              </div>
            )}
          </div>

          {/* 文档信息显示区域 */}
          {parsedDocument && (
            <div className="flex-1 min-h-0">
              <h3 className="text-md font-medium text-gray-900 dark:text-white mb-3">
                文档信息
              </h3>
              <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">文档名称:</span>
                    <span className="text-gray-900 dark:text-white font-medium">{parsedDocument.metadata?.title || '未知'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">字数统计:</span>
                    <span className="text-gray-900 dark:text-white">{parsedDocument.metadata?.wordCount || 0}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">页面数量:</span>
                    <span className="text-gray-900 dark:text-white">{parsedDocument.metadata?.pageCount || 1}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">图片数量:</span>
                    <span className="text-gray-900 dark:text-white">{parsedDocument.images?.length || 0}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* 右侧面板 - HTML预览和工具 */}
        <div className="w-2/3 bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700 flex flex-col">
          {/* 工具栏 */}
          {parsedDocument && (
            <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-b border-gray-200 dark:border-gray-700 p-4">
              <div className="flex items-center justify-between">
                <h3 className="text-md font-medium text-gray-900 dark:text-white">
                  HTML 预览
                </h3>
                <div className="flex items-center space-x-3">
                  <button
                    onClick={() => handleCopyToClipboard(parsedDocument.css, 'CSS')}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                  >
                    复制 CSS
                  </button>
                  <button
                    onClick={generateCSSTemplate}
                    className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700 transition-colors"
                  >
                    生成CSS模板
                  </button>
                  <button
                    onClick={() => handleDownload(parsedDocument)}
                    className="px-4 py-2 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center space-x-2 font-medium shadow-md"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <span>下载完整包</span>
                  </button>
                  <button className="px-3 py-1.5 text-sm bg-gray-600 text-white rounded hover:bg-gray-700 transition-colors">
                    帮助(?)
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* HTML预览区域 */}
          <div className="flex-1 p-4 overflow-auto">
            {parsedDocument ? (
              <HTMLPreview
                html={parsedDocument.html}
                css={parsedDocument.css}
                className="h-full"
                onCopyHTML={() => handleCopyToClipboard(parsedDocument.html, 'HTML')}
                onCopyCSS={() => handleCopyToClipboard(parsedDocument.css, 'CSS')}
                onDownload={() => handleDownload(parsedDocument)}
              />
            ) : (
              <div className="flex items-center justify-center h-full text-gray-500 dark:text-gray-400">
                <div className="text-center">
                  <div className="mx-auto w-16 h-16 text-gray-300 dark:text-gray-600 mb-4">
                    <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <p className="text-lg font-medium mb-2">上传 Word 文档开始</p>
                  <p className="text-sm">支持 .docx 格式，文件大小 ≤ 1MB</p>
                </div>
              </div>
            )}
          </div>

          {/* 底部状态栏 */}
          {parsedDocument && (
            <div className="sticky bottom-0 z-10 bg-white/90 dark:bg-gray-900/90 backdrop-blur border-t border-gray-200 dark:border-gray-700 p-3">
              <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400">
                <span>解析耗时: {parseTime.toFixed(1)}s</span>
                <span>节点数: {nodeCount}</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
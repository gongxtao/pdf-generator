'use client'

import { useCallback, useState, DragEvent } from 'react'

interface DropZoneProps {
  onFileUpload: (file: File) => void
  isUploading?: boolean
  accept?: string
  maxSize?: number // in bytes
  className?: string
}

export default function DropZone({
  onFileUpload,
  isUploading = false,
  accept = '.docx',
  maxSize = 1024 * 1024, // 1MB
  className = ''
}: DropZoneProps) {
  const [isDragOver, setIsDragOver] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 验证文件
  const validateFile = useCallback((file: File): string | null => {
    // 检查文件类型
    if (!file.name.toLowerCase().endsWith('.docx')) {
      return '只支持 .docx 格式文件'
    }

    // 检查文件大小
    if (file.size > maxSize) {
      const maxSizeMB = (maxSize / (1024 * 1024)).toFixed(1)
      return `文件大小不能超过 ${maxSizeMB}MB`
    }

    return null
  }, [maxSize])

  // 处理文件选择
  const handleFile = useCallback((file: File) => {
    const validationError = validateFile(file)
    if (validationError) {
      setError(validationError)
      return
    }

    setError(null)
    onFileUpload(file)
  }, [validateFile, onFileUpload])

  // 拖拽事件处理
  const handleDragEnter = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(true)
  }, [])

  const handleDragLeave = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    
    // 只有当鼠标真正离开整个区域时才设置为false
    const rect = e.currentTarget.getBoundingClientRect()
    const x = e.clientX
    const y = e.clientY
    
    if (x < rect.left || x > rect.right || y < rect.top || y > rect.bottom) {
      setIsDragOver(false)
    }
  }, [])

  const handleDragOver = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
  }, [])

  const handleDrop = useCallback((e: DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragOver(false)

    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFile(files[0])
    }
  }, [handleFile])

  // 文件输入处理
  const handleFileInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) {
      handleFile(files[0])
    }
    // 清空input值，允许重复选择同一文件
    e.target.value = ''
  }, [handleFile])

  const baseClasses = `
    relative border-2 border-dashed rounded-xl p-8 text-center transition-all duration-200 ease-in-out
    ${isDragOver 
      ? 'border-blue-400 bg-blue-50 dark:bg-blue-900/20 scale-[1.02]' 
      : 'border-gray-300 dark:border-gray-600 hover:border-blue-400 hover:bg-gray-50 dark:hover:bg-gray-800'
    }
    ${isUploading ? 'pointer-events-none opacity-75' : 'cursor-pointer'}
    ${error ? 'border-red-300 bg-red-50 dark:bg-red-900/20' : ''}
  `

  return (
    <div className={`${baseClasses} ${className}`}>
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        className="w-full h-full"
      >
        {/* 文件输入 */}
        <input
          type="file"
          accept={accept}
          onChange={handleFileInputChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
          disabled={isUploading}
          id="dropzone-file-input"
        />

        {/* 上传图标 */}
        <div className={`mx-auto w-12 h-12 mb-4 transition-colors ${
          isDragOver ? 'text-blue-500' : error ? 'text-red-400' : 'text-gray-400'
        }`}>
          {isUploading ? (
            // 加载动画
            <svg className="animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          ) : (
            // 上传图标
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          )}
        </div>

        {/* 文本内容 */}
        <div className="space-y-2">
          {isUploading ? (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                正在上传和解析...
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                请稍候，这可能需要几秒钟
              </p>
            </div>
          ) : error ? (
            <div>
              <p className="text-sm font-medium text-red-600 dark:text-red-400">
                {error}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                请选择正确的文件格式和大小
              </p>
            </div>
          ) : isDragOver ? (
            <div>
              <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
                松开鼠标上传文件
              </p>
              <p className="text-xs text-blue-500 dark:text-blue-300">
                支持 .docx 格式
              </p>
            </div>
          ) : (
            <div>
              <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                拖拽 .docx 文件到此处，或点击选择
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                文件大小限制：≤ {(maxSize / (1024 * 1024)).toFixed(1)}MB
              </p>
            </div>
          )}
        </div>

        {/* 选择文件按钮 */}
        {!isUploading && !isDragOver && (
          <label
            htmlFor="dropzone-file-input"
            className="mt-4 inline-block px-4 py-2 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 transition-colors cursor-pointer"
          >
            选择文件
          </label>
        )}
      </div>

      {/* 支持的格式提示 */}
      <div className="mt-3 text-xs text-gray-400 dark:text-gray-500">
        <span className="inline-flex items-center space-x-1">
          <svg className="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
          <span>仅支持 Microsoft Word (.docx) 格式</span>
        </span>
      </div>
    </div>
  )
}
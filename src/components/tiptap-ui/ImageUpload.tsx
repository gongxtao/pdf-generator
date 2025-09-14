'use client'

import { useState, useRef, useEffect } from 'react'
import { Editor } from '@tiptap/react'
import { Upload, Image as ImageIcon, X } from 'lucide-react'

interface ImageUploadProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position?: { top: number; left: number }
}

export function ImageUpload({ editor, isOpen, onClose, position }: ImageUploadProps) {
  const [dragActive, setDragActive] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [imageUrl, setImageUrl] = useState('')
  const [imageAlt, setImageAlt] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const popoverRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
      return () => {
        document.removeEventListener('mousedown', handleClickOutside)
      }
    }
  }, [isOpen, onClose])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFile(e.dataTransfer.files[0])
    }
  }

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFile(e.target.files[0])
    }
  }

  const handleFile = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('请选择图片文件')
      return
    }

    setUploading(true)
    
    try {
      // 将图片转换为base64 URL
      const reader = new FileReader()
      reader.onload = (e) => {
        const result = e.target?.result as string
        setImageUrl(result)
        setImageAlt(file.name.replace(/\.[^/.]+$/, '')) // 移除文件扩展名作为默认alt
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error('图片处理失败:', error)
      alert('图片处理失败，请重试')
    } finally {
      setUploading(false)
    }
  }

  const handleUrlSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (imageUrl.trim()) {
      insertImage(imageUrl, imageAlt)
    }
  }

  const insertImage = (src: string, alt: string = '') => {
    editor.chain().focus().setImage({ src, alt }).run()
    onClose()
    // 重置状态
    setImageUrl('')
    setImageAlt('')
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed z-50 bg-white rounded-lg shadow-xl border p-6 w-96"
      style={{
        top: position?.top ? `${position.top + 10}px` : '50%',
        left: position?.left ? `${position.left}px` : '50%',
        transform: position ? 'none' : 'translate(-50%, -50%)'
      }}
      ref={popoverRef}
    >
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">插入图片</h3>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {!imageUrl ? (
          <div className="space-y-4">
            {/* 文件上传区域 */}
            <div
              className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                dragActive
                  ? 'border-blue-500 bg-blue-50'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
              onDragEnter={handleDrag}
              onDragLeave={handleDrag}
              onDragOver={handleDrag}
              onDrop={handleDrop}
            >
              <div className="flex flex-col items-center space-y-3">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Upload className="w-6 h-6 text-gray-600" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-900">
                    拖拽图片到此处，或
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="text-blue-600 hover:text-blue-700 ml-1"
                      disabled={uploading}
                    >
                      点击选择
                    </button>
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    支持 JPG、PNG、GIF、WebP 格式
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleFileInput}
                className="hidden"
                disabled={uploading}
              />
            </div>

            {/* 或者输入URL */}
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300" />
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">或者</span>
              </div>
            </div>

            <form onSubmit={handleUrlSubmit} className="space-y-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图片链接
                </label>
                <input
                  type="url"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="https://example.com/image.jpg"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  图片描述 (可选)
                </label>
                <input
                  type="text"
                  value={imageAlt}
                  onChange={(e) => setImageAlt(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="图片描述"
                />
              </div>
              <button
                type="submit"
                disabled={!imageUrl.trim() || uploading}
                className="w-full px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {uploading ? '处理中...' : '插入图片'}
              </button>
            </form>
          </div>
        ) : (
          /* 图片预览和确认 */
          <div className="space-y-4">
            <div className="border rounded-lg p-4">
              <img
                src={imageUrl}
                alt={imageAlt}
                className="max-w-full max-h-48 mx-auto rounded"
                onError={() => {
                  alert('图片加载失败，请检查链接是否正确')
                  setImageUrl('')
                }}
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                图片描述
              </label>
              <input
                type="text"
                value={imageAlt}
                onChange={(e) => setImageAlt(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="图片描述"
              />
            </div>
            
            <div className="flex gap-3">
              <button
                onClick={() => {
                  setImageUrl('')
                  setImageAlt('')
                }}
                className="flex-1 px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 transition-colors"
              >
                重新选择
              </button>
              <button
                onClick={() => insertImage(imageUrl, imageAlt)}
                className="flex-1 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
              >
                插入图片
              </button>
            </div>
          </div>
        )}
    </div>
  )
}
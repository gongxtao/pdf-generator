'use client'

import { useState, useEffect, useRef } from 'react'
import { Editor } from '@tiptap/react'
import { Link as LinkIcon, ExternalLink, Unlink } from 'lucide-react'

interface LinkPopoverProps {
  editor: Editor
  isOpen: boolean
  onClose: () => void
  position?: { top: number; left: number }
}

export function LinkPopover({ editor, isOpen, onClose, position }: LinkPopoverProps) {
  const [url, setUrl] = useState('')
  const [text, setText] = useState('')
  const [isEditing, setIsEditing] = useState(false)
  const popoverRef = useRef<HTMLDivElement>(null)
  const urlInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    if (isOpen) {
      // 获取当前选中的文本和链接
      const { from, to } = editor.state.selection
      const selectedText = editor.state.doc.textBetween(from, to)
      const linkMark = editor.getAttributes('link')
      
      setText(selectedText || '')
      setUrl(linkMark.href || '')
      setIsEditing(!!linkMark.href)
      
      // 自动聚焦到URL输入框
      setTimeout(() => {
        urlInputRef.current?.focus()
      }, 100)
    }
  }, [isOpen, editor])

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target as Node)) {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [isOpen, onClose])

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!url.trim()) {
      // 如果URL为空，移除链接
      editor.chain().focus().unsetLink().run()
    } else {
      // 设置链接
      if (text.trim() && text !== editor.state.doc.textBetween(editor.state.selection.from, editor.state.selection.to)) {
        // 如果文本发生了变化，先替换文本再设置链接
        editor.chain().focus().insertContent(text).setLink({ href: url }).run()
      } else {
        // 只设置链接
        editor.chain().focus().setLink({ href: url }).run()
      }
    }
    
    onClose()
  }

  const handleRemoveLink = () => {
    editor.chain().focus().unsetLink().run()
    onClose()
  }

  const handleOpenLink = () => {
    if (url) {
      window.open(url, '_blank')
    }
  }

  if (!isOpen) return null

  return (
    <div
      ref={popoverRef}
      className="absolute z-50 bg-white border border-gray-200 rounded-lg shadow-lg p-4 min-w-80"
      style={{
        top: position?.top || 0,
        left: position?.left || 0,
        transform: 'translateY(-100%)'
      }}
    >
      <form onSubmit={handleSubmit} className="space-y-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            链接文本
          </label>
          <input
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="链接显示文本"
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            链接地址
          </label>
          <input
            ref={urlInputRef}
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="https://example.com"
            required
          />
        </div>
        
        <div className="flex justify-between items-center pt-2">
          <div className="flex gap-2">
            {isEditing && (
              <>
                <button
                  type="button"
                  onClick={handleOpenLink}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
                  title="打开链接"
                >
                  <ExternalLink className="w-4 h-4" />
                  打开
                </button>
                <button
                  type="button"
                  onClick={handleRemoveLink}
                  className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md transition-colors"
                  title="移除链接"
                >
                  <Unlink className="w-4 h-4" />
                  移除
                </button>
              </>
            )}
          </div>
          
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800 hover:bg-gray-100 rounded-md transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-3 py-1.5 text-sm bg-blue-600 text-white hover:bg-blue-700 rounded-md transition-colors"
            >
              {isEditing ? '更新' : '创建'}
            </button>
          </div>
        </div>
      </form>
    </div>
  )
}
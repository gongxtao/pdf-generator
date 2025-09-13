'use client'

import { useState, useEffect, useRef } from 'react'

interface ContentEditorProps {
  title: string
  content: string
  onChange: (content: string, title: string) => void
  className?: string
}

export default function ContentEditor({ title, content, onChange, className = '' }: ContentEditorProps) {
  const [localTitle, setLocalTitle] = useState(title)
  const [localContent, setLocalContent] = useState(content)
  const [isClient, setIsClient] = useState(false)
  const editorRef = useRef<HTMLTextAreaElement>(null)
  const editorInstanceRef = useRef<{
    getContent: () => string;
    setContent: (content: string) => void;
    [key: string]: unknown;
  } | null>(null)

  // 确保组件在客户端渲染
  useEffect(() => {
    setIsClient(true)
  }, [])

  // 同步外部状态变化
  useEffect(() => {
    setLocalTitle(title)
    setLocalContent(content)
    
    // 如果编辑器已初始化，更新编辑器内容
    if (editorInstanceRef.current && content !== editorInstanceRef.current.getContent()) {
      editorInstanceRef.current.setContent(content)
    }
  }, [title, content])

  // 初始化TinyMCE编辑器
  useEffect(() => {
    if (!isClient || !editorRef.current) return

    // 动态加载TinyMCE
    const loadTinyMCE = async () => {
      try {
        // 加载TinyMCE脚本
        if (!(window as any).tinymce) {
          const script = document.createElement('script')
          script.src = '/tinymce/tinymce.min.js'
          script.onload = () => {
            initializeEditor()
          }
          document.head.appendChild(script)
        } else {
          initializeEditor()
        }
      } catch (error) {
        console.error('加载TinyMCE失败:', error)
      }
    }

    const initializeEditor = () => {
      const tinymce = (window as any).tinymce
      if (!tinymce || !editorRef.current) return

      // 初始化TinyMCE编辑器
      tinymce.init({
        target: editorRef.current,
        height: 400,
        menubar: false,
        // 设置开源许可证密钥
        license_key: 'gpl',
        // 禁用商业功能
        promotion: false,
        branding: false,
        // 基础插件（开源版本）
        plugins: [
          'advlist', 'autolink', 'lists', 'link', 'charmap', 'preview',
          'anchor', 'searchreplace', 'visualblocks', 'code', 'fullscreen',
          'insertdatetime', 'table', 'help', 'wordcount'
        ],
        toolbar: [
          'undo redo | blocks | bold italic forecolor | alignleft aligncenter',
          'alignright alignjustify | bullist numlist outdent indent |',
          'removeformat | help'
        ].join(' | '),
        content_style: `
          body { 
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif; 
            font-size: 14px;
            line-height: 1.6;
            margin: 1rem;
          }
          h1 { font-size: 2em; margin: 0.67em 0; }
          h2 { font-size: 1.5em; margin: 0.75em 0; }
          h3 { font-size: 1.17em; margin: 0.83em 0; }
          p { margin: 1em 0; }
          ul, ol { margin: 1em 0; padding-left: 2em; }
          li { margin: 0.5em 0; }
        `,
        statusbar: false,
        resize: false,
        placeholder: '开始编写您的文档内容...',
        // 使用本地TinyMCE资源
        base_url: '/tinymce',
        suffix: '.min',
        // 编辑器初始化完成后的回调
        init_instance_callback: (editor: {
          getContent: () => string;
          setContent: (content: string) => void;
          [key: string]: unknown;
        }) => {
          editorInstanceRef.current = editor
          
          // 设置初始内容
          if (localContent) {
            editor.setContent(localContent)
          }
          
          // 监听内容变化 - 使用防抖避免频繁更新
          let timeoutId: NodeJS.Timeout
          editor.on('input change keyup', () => {
            clearTimeout(timeoutId)
            timeoutId = setTimeout(() => {
              const newContent = editor.getContent()
              if (newContent !== localContent) {
                setLocalContent(newContent)
                // 保持标题不变，只更新内容
                onChange(newContent, localTitle)
              }
            }, 300) // 300ms防抖延迟
          })
          
          console.log('TinyMCE编辑器已初始化（开源GPL版本）')
        }
      })
    }

    loadTinyMCE()

    // 清理函数
    return () => {
      if (editorInstanceRef.current) {
        const tinymce = (window as any).tinymce
        if (tinymce) {
          tinymce.remove(editorInstanceRef.current)
          editorInstanceRef.current = null
        }
      }
    }
  }, [isClient]) // 移除localContent和localTitle依赖，避免重新初始化

  // 处理标题变化
  const handleTitleChange = (newTitle: string) => {
    setLocalTitle(newTitle)
    // 标题变化时，参数顺序：内容在前，标题在后
    onChange(localContent, newTitle)
  }

  if (!isClient) {
    return (
      <div className={`flex flex-col h-full ${className}`}>
        <div className="mb-4">
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
            文档标题
          </label>
          <input
            type="text"
            id="title"
            value={localTitle}
            onChange={(e) => handleTitleChange(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="请输入文档标题"
          />
        </div>
        
        <div className="flex-1 border border-gray-300 rounded-md p-4">
          <div className="text-gray-500">编辑器加载中...</div>
        </div>
      </div>
    )
  }

  return (
    <div className={`flex flex-col h-full ${className}`}>
      {/* 标题输入框 */}
      <div className="mb-4">
        <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-2">
          文档标题
        </label>
        <input
          type="text"
          id="title"
          value={localTitle}
          onChange={(e) => handleTitleChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          placeholder="请输入文档标题"
        />
      </div>

      {/* 内容编辑器 */}
      <div className="flex-1 flex flex-col">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          文档内容
        </label>
        
        <div className="flex-1 border border-gray-300 rounded-md overflow-hidden">
          <textarea
            ref={editorRef}
            defaultValue={localContent}
            className="w-full h-full p-4 border-none outline-none resize-none"
            placeholder="开始编写您的文档内容..."
          />
        </div>
      </div>

      {/* 编辑提示 */}
      <div className="mt-4 p-3 bg-blue-50 rounded-md">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="h-5 w-5 text-blue-400" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-blue-700">
              <strong>编辑提示：</strong> 使用富文本编辑器来格式化文档内容。支持标题、粗体、斜体、列表、链接等多种格式。您可以直接在编辑器中看到格式效果，修改后的内容会实时在右侧PDF预览中显示。
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
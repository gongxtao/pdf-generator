'use client'

import { useEditor, EditorContent } from '@tiptap/react'
import StarterKit from '@tiptap/starter-kit'
import { TextStyle } from '@tiptap/extension-text-style'
import { Color } from '@tiptap/extension-color'
import { FontFamily } from '@tiptap/extension-font-family'
import { TextAlign } from '@tiptap/extension-text-align'
import { Underline } from '@tiptap/extension-underline'
import { Link } from '@tiptap/extension-link'
import { Image } from '@tiptap/extension-image'
import { Table } from '@tiptap/extension-table'
import { TableRow } from '@tiptap/extension-table-row'
import { TableCell } from '@tiptap/extension-table-cell'
import { TableHeader } from '@tiptap/extension-table-header'
import { Highlight } from '@tiptap/extension-highlight'
import { Typography } from '@tiptap/extension-typography'
import { Gapcursor } from '@tiptap/extension-gapcursor'
import { HardBreak } from '@tiptap/extension-hard-break'
import { HorizontalRule } from '@tiptap/extension-horizontal-rule'
import { TaskList } from '@tiptap/extension-task-list'
import { TaskItem } from '@tiptap/extension-task-item'
import { Subscript } from '@tiptap/extension-subscript'
import { Superscript } from '@tiptap/extension-superscript'
import { useCallback, useEffect, useState, useRef } from 'react'
import {
  Bold,
  Italic,
  Underline as UnderlineIcon,
  Strikethrough,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  List,
  ListOrdered,
  Quote,
  Undo,
  Redo,
  Type,
  Palette,
  Table as TableIcon,
  Highlighter,
  Minus,
  FileText,
  Scissors,
  CheckSquare,
  Subscript as SubscriptIcon,
  Superscript as SuperscriptIcon,
  Link as LinkIcon,
  Image as ImageIcon,
  Heading1,
  Heading2,
  Heading3,
  Plus,
  Trash2
} from 'lucide-react'
import { LinkPopover } from './tiptap-ui/LinkPopover'
import { ImageUpload } from './tiptap-ui/ImageUpload'
import { extractStylesFromHTML, generateTiptapCSS, injectDynamicCSS, clearDynamicCSS, processHTMLForTiptap } from '../lib/html-style-extractor'
import { PageBreak } from './tiptap-extensions/PageBreak'
import { AutoPagination } from './tiptap-extensions/AutoPagination'
import '../styles/a4-page.css'

interface TiptapEditorProps {
  content: string
  onContentChange: (content: string) => void
  enableDynamicStyles?: boolean // 是否启用动态样式提取
  className?: string
}

export default function TiptapEditor({ content, onContentChange, enableDynamicStyles = true, className = '' }: TiptapEditorProps) {
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [showLinkPopover, setShowLinkPopover] = useState(false)
  const [showImageUpload, setShowImageUpload] = useState(false)
  const [popoverPosition, setPopoverPosition] = useState({ top: 0, left: 0 })
  const isUpdatingContentRef = useRef(false)
  
  const editor = useEditor({
    extensions: [
      StarterKit,
      TextStyle,
      Color,
      FontFamily,
      TextAlign.configure({
        types: ['heading', 'paragraph'],
      }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Highlight.configure({
        multicolor: true,
      }),
      Typography,
      Gapcursor,
      HardBreak,
      HorizontalRule,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Subscript,
      Superscript,
      PageBreak,
      AutoPagination.configure({
        pageHeight: 1056, // A4纸张高度
        pageMargin: 40,
      }),
    ],
    content,
    immediatelyRender: false,
    onUpdate: ({ editor }) => {
      // 只有在不是程序更新内容时才触发回调
      if (!isUpdatingContentRef.current) {
        onContentChange(editor.getHTML())
      }
    },
    editorProps: {
      attributes: {
        class: 'tiptap-editor prose prose-sm sm:prose lg:prose-lg xl:prose-2xl mx-auto focus:outline-none min-h-[400px] p-4',
      },
    },
  })

  // 统一处理内容更新和动态样式
  useEffect(() => {
    if (!editor || !content) return;
    
    let finalContent = content;
    
    // 如果启用动态样式且内容包含样式信息
    if (enableDynamicStyles && (content.includes('<style>') || content.includes('<link'))) {
      try {
        // 提取样式信息
        const extractedStyles = extractStylesFromHTML(content);
        const tiptapCSS = generateTiptapCSS(extractedStyles);
        
        // 注入动态样式
        injectDynamicCSS(tiptapCSS, 'tiptap-dynamic-styles');
        
        // 处理HTML内容
        finalContent = processHTMLForTiptap(content);
      } catch (error) {
        console.warn('动态样式提取失败:', error);
      }
    }
    
    // 只有当内容真正不同时才更新编辑器
    if (finalContent !== editor.getHTML()) {
      isUpdatingContentRef.current = true;
      editor.commands.setContent(finalContent);
      // 使用 requestAnimationFrame 和 setTimeout 确保内容更新完成后再重置状态
      requestAnimationFrame(() => {
        setTimeout(() => {
          isUpdatingContentRef.current = false;
        }, 50);
      });
    }
    
    // 组件卸载时清理动态样式
    return () => {
      if (enableDynamicStyles) {
        clearDynamicCSS('tiptap-dynamic-styles');
      }
    };
  }, [content, enableDynamicStyles, editor]);

  const handleLinkClick = useCallback(() => {
    if (!editor) return

    const { from, to } = editor.state.selection
    const selectedText = editor.state.doc.textBetween(from, to)
    
    // 如果没有选中文本，提示用户先选择文本
    if (!selectedText.trim()) {
      alert('请先选择要添加链接的文本')
      return
    }

    // 获取选中文本的位置
    const { view } = editor
    const start = view.coordsAtPos(from)
    const end = view.coordsAtPos(to)
    
    setPopoverPosition({
      top: start.top - 10,
      left: (start.left + end.left) / 2
    })
    
    setShowLinkPopover(true)
  }, [editor])

  const handleImageClick = useCallback(() => {
    if (!editor) return
    setShowImageUpload(true)
  }, [editor])

  if (!editor) {
    return null
  }

  return (
    <div className="border border-gray-200 rounded-lg overflow-hidden shadow-sm bg-white">
      {/* 工具栏 */}
      <div className="border-b border-gray-200 bg-gray-50/50 p-3 flex flex-wrap gap-1">
        {/* 文本格式 */}
        <div className="flex gap-1 border-r border-gray-200 pr-3 mr-3">
          <button
            onClick={() => editor.chain().focus().toggleBold().run()}
            disabled={!editor.can().chain().focus().toggleBold().run()}
            className={`p-2 rounded-md text-sm font-medium transition-all duration-200 ${
              editor.isActive('bold')
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="粗体"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleItalic().run()}
            disabled={!editor.can().chain().focus().toggleItalic().run()}
            className={`p-2 rounded-md text-sm font-medium transition-all duration-200 ${
              editor.isActive('italic')
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="斜体"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleUnderline().run()}
            disabled={!editor.can().chain().focus().toggleUnderline().run()}
            className={`p-2 rounded-md text-sm font-medium transition-all duration-200 ${
              editor.isActive('underline')
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="下划线"
          >
            <UnderlineIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleStrike().run()}
            disabled={!editor.can().chain().focus().toggleStrike().run()}
            className={`p-2 rounded-md text-sm font-medium transition-all duration-200 ${
              editor.isActive('strike')
                ? 'bg-blue-500 text-white shadow-sm'
                : 'text-gray-600 hover:bg-gray-100 hover:text-gray-800'
            }`}
            title="删除线"
          >
            <Strikethrough className="w-4 h-4" />
          </button>
        </div>

        {/* 对齐方式 */}
        <div className="flex gap-1 border-r border-gray-200 pr-3 mr-3">
          <button
            onClick={() => editor.chain().focus().setTextAlign('left').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'left' }) ? 'bg-gray-300' : ''
            }`}
            title="左对齐"
          >
            <AlignLeft className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('center').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'center' }) ? 'bg-gray-300' : ''
            }`}
            title="居中对齐"
          >
            <AlignCenter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('right').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'right' }) ? 'bg-gray-300' : ''
            }`}
            title="右对齐"
          >
            <AlignRight className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setTextAlign('justify').run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive({ textAlign: 'justify' }) ? 'bg-gray-300' : ''
            }`}
            title="两端对齐"
          >
            <AlignJustify className="w-4 h-4" />
          </button>
        </div>

        {/* 列表 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleBulletList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('bulletList') ? 'bg-gray-300' : ''
            }`}
            title="无序列表"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleOrderedList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('orderedList') ? 'bg-gray-300' : ''
            }`}
            title="有序列表"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleTaskList().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('taskList') ? 'bg-gray-300' : ''
            }`}
            title="任务列表"
          >
            <CheckSquare className="w-4 h-4" />
          </button>
        </div>

        {/* 上标下标和引用 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleSubscript().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('subscript') ? 'bg-gray-300' : ''
            }`}
            title="下标"
          >
            <SubscriptIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleSuperscript().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('superscript') ? 'bg-gray-300' : ''
            }`}
            title="上标"
          >
            <SuperscriptIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleBlockquote().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('blockquote') ? 'bg-gray-300' : ''
            }`}
            title="引用"
          >
            <Quote className="w-4 h-4" />
          </button>
        </div>

        {/* 标题 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 1 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 1 }) ? 'bg-gray-300' : ''
            }`}
            title="标题1"
          >
            <Heading1 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 2 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 2 }) ? 'bg-gray-300' : ''
            }`}
            title="标题2"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHeading({ level: 3 }).run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('heading', { level: 3 }) ? 'bg-gray-300' : ''
            }`}
            title="标题3"
          >
            <Heading3 className="w-4 h-4" />
          </button>
          <select
            onChange={(e) => {
              const level = parseInt(e.target.value)
              if (level === 0) {
                editor.chain().focus().setParagraph().run()
              } else {
                editor.chain().focus().toggleHeading({ level: level as 1 | 2 | 3 | 4 | 5 | 6 }).run()
              }
            }}
            className="px-2 py-1 rounded border border-gray-300 text-sm"
            title="更多标题级别"
          >
            <option value="0">正文</option>
            <option value="1">H1</option>
            <option value="2">H2</option>
            <option value="3">H3</option>
            <option value="4">H4</option>
            <option value="5">H5</option>
            <option value="6">H6</option>
          </select>
        </div>

        {/* 字体颜色 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <input
            type="color"
            onChange={(e) => editor.chain().focus().setColor(e.target.value).run()}
            className="w-8 h-8 rounded border border-gray-300 cursor-pointer"
            title="字体颜色"
          />
          <button
            onClick={() => editor.chain().focus().unsetColor().run()}
            className="p-2 rounded hover:bg-gray-200"
            title="清除颜色"
          >
            <Palette className="w-4 h-4" />
          </button>
        </div>

        {/* 表格、高亮、分隔线 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={() => editor.chain().focus().insertTable({ rows: 3, cols: 3, withHeaderRow: true }).run()}
            className="p-2 rounded hover:bg-gray-200"
            title="插入表格"
          >
            <TableIcon className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().toggleHighlight().run()}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('highlight') ? 'bg-gray-300' : ''
            }`}
            title="高亮"
          >
            <Highlighter className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setHorizontalRule().run()}
            className="p-2 rounded hover:bg-gray-200"
            title="插入分隔线"
          >
            <Minus className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().setPageBreak().run()}
            className="p-2 rounded hover:bg-gray-200"
            title="插入分页符"
          >
            <Scissors className="w-4 h-4" />
          </button>
        </div>

        {/* 链接和图片 */}
        <div className="flex gap-1 border-r border-gray-300 pr-2 mr-2">
          <button
            onClick={handleLinkClick}
            className={`p-2 rounded hover:bg-gray-200 ${
              editor.isActive('link') ? 'bg-gray-300' : ''
            }`}
            title="链接"
          >
            🔗
          </button>
          <button
            onClick={handleImageClick}
            className="p-2 rounded hover:bg-gray-200"
            title="图片"
          >
            🖼️
          </button>
        </div>

        {/* 撤销重做 */}
        <div className="flex gap-1">
          <button
            onClick={() => editor.chain().focus().undo().run()}
            disabled={!editor.can().chain().focus().undo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="撤销"
          >
            <Undo className="w-4 h-4" />
          </button>
          <button
            onClick={() => editor.chain().focus().redo().run()}
            disabled={!editor.can().chain().focus().redo().run()}
            className="p-2 rounded hover:bg-gray-200 disabled:opacity-50"
            title="重做"
          >
            <Redo className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* 编辑器内容区域 - A4纸张样式 */}
      <div className="a4-page-container max-h-[600px] overflow-y-auto">
        <div className="a4-page">
          <EditorContent 
            editor={editor} 
            className="prose prose-sm max-w-none focus:outline-none text-gray-800 leading-relaxed"
          />
        </div>
      </div>
      
      {/* 链接弹窗 */}
      <LinkPopover
        editor={editor}
        isOpen={showLinkPopover}
        onClose={() => setShowLinkPopover(false)}
        position={popoverPosition}
      />
      
      {/* 图片上传弹窗 */}
      <ImageUpload
        editor={editor}
        isOpen={showImageUpload}
        onClose={() => setShowImageUpload(false)}
      />
    </div>
  )
}
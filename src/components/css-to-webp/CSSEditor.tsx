'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Template } from '@/data/templates'

interface CSSEditorProps {
  selectedTemplate: Template | null
  cssContent: string
  onCSSChange: (css: string) => void
  cssMode: 'template' | 'custom'
  onModeChange: (mode: 'template' | 'custom') => void
}

const CSSEditor: React.FC<CSSEditorProps> = ({
  selectedTemplate,
  cssContent,
  onCSSChange,
  cssMode,
  onModeChange
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null)
  const [lineNumbers, setLineNumbers] = useState<number[]>([])
  const [isFullscreen, setIsFullscreen] = useState(false)

  // 更新行号
  const updateLineNumbers = (content: string) => {
    const lines = content.split('\n').length
    setLineNumbers(Array.from({ length: lines }, (_, i) => i + 1))
  }

  // 当CSS内容改变时更新行号
  useEffect(() => {
    updateLineNumbers(cssContent)
  }, [cssContent])

  // 处理文本区域滚动同步
  const handleScroll = () => {
    const textarea = textareaRef.current
    const lineNumbersEl = document.getElementById('line-numbers')
    if (textarea && lineNumbersEl) {
      lineNumbersEl.scrollTop = textarea.scrollTop
    }
  }

  // 处理Tab键插入
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Tab') {
      e.preventDefault()
      const textarea = e.currentTarget
      const start = textarea.selectionStart
      const end = textarea.selectionEnd
      const newValue = cssContent.substring(0, start) + '  ' + cssContent.substring(end)
      onCSSChange(newValue)
      
      // 设置光标位置
      setTimeout(() => {
        textarea.selectionStart = textarea.selectionEnd = start + 2
      }, 0)
    }
  }

  // 重置为模板CSS
  const resetToTemplate = () => {
    if (selectedTemplate?.template_content) {
      onCSSChange(selectedTemplate.template_content)
    }
  }

  // 清空CSS
  const clearCSS = () => {
    onCSSChange('')
  }

  // 格式化CSS（简单的格式化）
  const formatCSS = () => {
    try {
      // 简单的CSS格式化
      let formatted = cssContent
        .replace(/\{/g, ' {\n  ')
        .replace(/\}/g, '\n}\n')
        .replace(/;/g, ';\n  ')
        .replace(/,/g, ',\n')
        .replace(/\n\s*\n/g, '\n')
        .replace(/^\s+/gm, (match) => {
          const depth = (match.match(/\{/g) || []).length - (match.match(/\}/g) || []).length
          return '  '.repeat(Math.max(0, depth))
        })
      
      onCSSChange(formatted.trim())
    } catch (error) {
      console.error('CSS格式化失败:', error)
    }
  }

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 flex flex-col ${
      isFullscreen ? 'fixed inset-4 z-50' : 'h-full'
    }`}>
      {/* 编辑器头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            CSS 编辑器
          </h3>
          
          {/* 模式切换 */}
          <div className="flex bg-gray-100 dark:bg-gray-700 rounded-lg p-1">
            <button
              onClick={() => onModeChange('template')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                cssMode === 'template'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              模板模式
            </button>
            <button
              onClick={() => onModeChange('custom')}
              className={`px-3 py-1 text-sm font-medium rounded-md transition-all duration-200 ${
                cssMode === 'custom'
                  ? 'bg-white dark:bg-gray-600 text-gray-900 dark:text-white shadow-sm'
                  : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
              }`}
            >
              自定义模式
            </button>
          </div>
        </div>

        {/* 工具按钮 */}
        <div className="flex items-center gap-2">
          {cssMode === 'template' && selectedTemplate && (
            <button
              onClick={resetToTemplate}
              className="px-3 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-md hover:bg-blue-200 dark:hover:bg-blue-800 transition-colors"
              title="重置为模板CSS"
            >
              重置
            </button>
          )}
          
          <button
            onClick={formatCSS}
            className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
            title="格式化CSS"
          >
            格式化
          </button>
          
          <button
            onClick={clearCSS}
            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
            title="清空CSS"
          >
            清空
          </button>
          
          <button
            onClick={() => setIsFullscreen(!isFullscreen)}
            className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
            title={isFullscreen ? '退出全屏' : '全屏编辑'}
          >
            {isFullscreen ? (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            ) : (
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* 模式说明 */}
      <div className="px-4 py-2 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          {cssMode === 'template' ? (
            selectedTemplate ? (
              <>当前使用模板: <span className="font-medium text-gray-900 dark:text-white">{selectedTemplate.title}</span> - 可以在模板基础上进行修改</>
            ) : (
              '请先选择一个模板'
            )
          ) : (
            '自定义模式 - 从零开始编写CSS样式'
          )}
        </p>
      </div>

      {/* 编辑器主体 */}
      <div className="flex-1 flex overflow-hidden min-h-0">
        {/* 行号 */}
        <div 
          id="line-numbers"
          className="bg-gray-50 dark:bg-gray-700 text-gray-500 dark:text-gray-400 text-sm font-mono p-4 pr-2 border-r border-gray-200 dark:border-gray-600 overflow-y-auto overflow-x-hidden select-none"
          style={{ minWidth: '60px' }}
        >
          {lineNumbers.map(num => (
            <div key={num} className="leading-6 text-right">
              {num}
            </div>
          ))}
        </div>

        {/* CSS编辑区域 */}
        <div className="flex-1 relative overflow-hidden">
          <textarea
            ref={textareaRef}
            value={cssContent}
            onChange={(e) => onCSSChange(e.target.value)}
            onScroll={handleScroll}
            onKeyDown={handleKeyDown}
            placeholder={cssMode === 'template' 
              ? (selectedTemplate ? '在模板CSS基础上进行修改...' : '请先选择一个模板')
              : '在这里编写你的CSS样式...\n\n例如:\n.container {\n  width: 100%;\n  max-width: 800px;\n  margin: 0 auto;\n  padding: 20px;\n}'
            }
            className="w-full h-full p-4 bg-transparent text-gray-900 dark:text-white font-mono text-sm leading-6 resize-none outline-none border-none overflow-auto css-editor-textarea"
            style={{
              tabSize: 2,
              fontFamily: 'Consolas, Monaco, "Courier New", monospace',
              scrollbarWidth: 'thin',
              scrollbarColor: '#94a3b8 #f1f5f9'
            }}
            disabled={cssMode === 'template' && !selectedTemplate}
          />
          
          {/* 语法高亮提示 */}
          {cssContent && (
            <div className="absolute bottom-4 right-4 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-800 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-600">
              {cssContent.split('\n').length} 行 | {cssContent.length} 字符
            </div>
          )}
        </div>
      </div>

      {/* 编辑器底部工具栏 */}
      <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 border-t border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
          <span>支持Tab缩进</span>
          <span>•</span>
          <span>Ctrl+A 全选</span>
          <span>•</span>
          <span>Ctrl+Z 撤销</span>
        </div>
        
        <div className="flex items-center gap-2">
          {cssContent && (
            <div className="text-sm text-gray-600 dark:text-gray-400">
              已输入 {cssContent.length} 字符
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default CSSEditor
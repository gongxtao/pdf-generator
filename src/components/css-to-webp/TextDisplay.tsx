'use client'

import React, { useState, useRef } from 'react'
import { Template } from '@/data/templates'

interface FixedText {
  id: string
  label: string
  content: string
  placeholder: string
}

interface TextDisplayProps {
  selectedTemplate: Template | null
  fixedTexts: FixedText[]
  onFixedTextChange: (id: string, content: string) => void
  onGenerateImage?: () => void
  generationStep?: 'idle' | 'generating-html' | 'generating-webp' | 'completed'
  isGenerating?: boolean
}

const TextDisplay: React.FC<TextDisplayProps> = ({
  selectedTemplate,
  fixedTexts,
  onFixedTextChange,
  onGenerateImage,
  generationStep = 'idle',
  isGenerating = false
}) => {
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['basic']))
  const [isCollapsed, setIsCollapsed] = useState(false)

  // 简化为只有标题和正文两个字段
  const simplifiedTexts = [
    {
      id: 'title',
      label: '标题',
      content: fixedTexts.find(ft => ft.id === 'title')?.content || '',
      placeholder: '请输入标题内容'
    },
    {
      id: 'content',
      label: '正文内容',
      content: fixedTexts.find(ft => ft.id === 'content')?.content || '',
      placeholder: '请输入正文内容'
    }
  ]

  const toggleSection = (section: string) => {
    const newExpanded = new Set(expandedSections)
    if (newExpanded.has(section)) {
      newExpanded.delete(section)
    } else {
      newExpanded.add(section)
    }
    setExpandedSections(newExpanded)
  }

  const clearAllTexts = () => {
    simplifiedTexts.forEach(text => {
      onFixedTextChange(text.id, '')
    })
  }

  const fillSampleData = () => {
    // 填充示例数据
    onFixedTextChange('title', '示例标题')
    onFixedTextChange('content', '这是示例正文内容。\n\n您可以在这里输入您的文本内容，支持多行文本。\n\n点击生成图片按钮可以将内容转换为WebP图片。')
  }

  if (!selectedTemplate) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-6">
        <div className="text-center py-8">
          <div className="text-gray-400 dark:text-gray-500 mb-4">
            <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
            请先选择模板
          </h3>
          <p className="text-gray-600 dark:text-gray-400">
            选择一个模板后，这里将显示相应的文本编辑字段
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      {/* 头部 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center gap-3">
          <button
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="p-1 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            <svg className={`w-4 h-4 transition-transform ${isCollapsed ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            文本内容编辑
          </h3>
          <span className="px-2 py-1 text-xs bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full">
            {selectedTemplate.title}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={fillSampleData}
            className="px-3 py-1 text-sm bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300 rounded-md hover:bg-green-200 dark:hover:bg-green-800 transition-colors"
          >
            填充示例
          </button>
          <button
            onClick={clearAllTexts}
            className="px-3 py-1 text-sm bg-red-100 dark:bg-red-900 text-red-700 dark:text-red-300 rounded-md hover:bg-red-200 dark:hover:bg-red-800 transition-colors"
          >
            清空全部
          </button>
          <button
            onClick={onGenerateImage}
            disabled={!onGenerateImage || isGenerating}
            className={`px-4 py-2 text-sm rounded-md transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 ${
              generationStep === 'idle' 
                ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                : generationStep === 'generating-html'
                ? 'bg-orange-600 text-white'
                : generationStep === 'generating-webp'
                ? 'bg-purple-600 text-white'
                : 'bg-green-600 text-white'
            }`}
          >
            {isGenerating && (
              <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            {generationStep === 'idle' && '🎨 生成图片'}
            {generationStep === 'generating-html' && '📝 生成HTML...'}
            {generationStep === 'generating-webp' && '🖼️ 生成WebP...'}
            {generationStep === 'completed' && '✅ 生成完成'}
          </button>
        </div>
      </div>

      {/* 内容区域 */}
      {!isCollapsed && (
        <div className="p-4 space-y-4">
          {simplifiedTexts.map(text => (
            <div key={text.id}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                {text.label}
              </label>
              {text.id === 'content' ? (
                <textarea
                  value={fixedTexts.find(ft => ft.id === text.id)?.content || ''}
                  onChange={(e) => onFixedTextChange(text.id, e.target.value)}
                  placeholder={text.placeholder}
                  rows={4}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors resize-vertical"
                />
              ) : (
                <input
                  type="text"
                  value={fixedTexts.find(ft => ft.id === text.id)?.content || ''}
                  onChange={(e) => onFixedTextChange(text.id, e.target.value)}
                  placeholder={text.placeholder}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
                />
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default TextDisplay
'use client'

import React, { useState, useRef, useEffect } from 'react'
import { Template } from '@/data/templates'

interface TemplateSelectorProps {
  templates: Template[]
  selectedTemplate: Template | null
  onTemplateSelect: (template: Template) => void
}

// 类别显示名称映射
const categoryNames: Record<string, string> = {
  'business': '商务文档',
  'resume': '简历模板',
  'report': '报告模板',
  'certificate': '证书模板',
  'invitation': '邀请函',
  'poster': '海报设计',
  'social-media': '社交媒体'
}

const TemplateSelector: React.FC<TemplateSelectorProps> = ({
  templates,
  selectedTemplate,
  onTemplateSelect
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('all')
  const scrollContainerRef = useRef<HTMLDivElement>(null)

  // 获取所有类别
  const categories = ['all', ...Array.from(new Set(templates.map(t => t.category)))]
  
  // 根据选中的类别过滤模板
  const filteredTemplates = selectedCategory === 'all' 
    ? templates 
    : templates.filter(t => t.category === selectedCategory)

  // 滚动到选中的模板
  const scrollToTemplate = (templateId: string) => {
    const element = document.getElementById(`template-${templateId}`)
    if (element && scrollContainerRef.current) {
      const container = scrollContainerRef.current
      const elementLeft = element.offsetLeft
      const elementWidth = element.offsetWidth
      const containerWidth = container.offsetWidth
      const scrollLeft = elementLeft - (containerWidth / 2) + (elementWidth / 2)
      
      container.scrollTo({
        left: scrollLeft,
        behavior: 'smooth'
      })
    }
  }

  // 当选中的模板改变时，滚动到该模板
  useEffect(() => {
    if (selectedTemplate) {
      setTimeout(() => scrollToTemplate(selectedTemplate.id), 100)
    }
  }, [selectedTemplate])

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      {/* 类别选择器 */}
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-3">
          选择模板类别
        </h3>
        <div className="flex flex-wrap gap-2">
          {categories.map(category => (
            <button
              key={category}
              onClick={() => setSelectedCategory(category)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                selectedCategory === category
                  ? 'bg-blue-600 text-white shadow-md'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {category === 'all' ? '全部模板' : (categoryNames[category] || category)}
              <span className="ml-2 text-xs opacity-75">
                ({category === 'all' ? templates.length : templates.filter(t => t.category === category).length})
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* 模板列表 */}
      <div className="mb-2">
        <h4 className="text-md font-medium text-gray-800 dark:text-gray-200 mb-3">
          {selectedCategory === 'all' 
            ? `全部模板 (${filteredTemplates.length})` 
            : `${categoryNames[selectedCategory] || selectedCategory} (${filteredTemplates.length})`
          }
        </h4>
      </div>

      {/* 横向滚动的模板卡片 */}
      <div 
        ref={scrollContainerRef}
        className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin scrollbar-thumb-gray-300 dark:scrollbar-thumb-gray-600 scrollbar-track-transparent"
        style={{ scrollbarWidth: 'thin' }}
      >
        {filteredTemplates.length > 0 ? (
          filteredTemplates.map(template => (
            <div
              key={template.id}
              id={`template-${template.id}`}
              className={`flex-shrink-0 w-64 cursor-pointer transition-all duration-200 ${
                selectedTemplate?.id === template.id
                  ? 'transform scale-105'
                  : 'hover:transform hover:scale-102'
              }`}
              onClick={() => onTemplateSelect(template)}
            >
              <div className={`bg-white dark:bg-gray-700 rounded-lg border-2 transition-all duration-200 overflow-hidden ${
                selectedTemplate?.id === template.id
                  ? 'border-blue-500 shadow-lg'
                  : 'border-gray-200 dark:border-gray-600 hover:border-gray-300 dark:hover:border-gray-500 shadow-sm hover:shadow-md'
              }`}>
                {/* 模板预览图 */}
                <div className="aspect-video bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-600 dark:to-gray-700 relative overflow-hidden">
                  {template.image_url ? (
                    <img
                      src={template.image_url}
                      alt={template.alt_text || template.title}
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        // 图片加载失败时显示占位符
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                      }}
                    />
                  ) : null}
                  
                  {/* 占位符内容 */}
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="text-center p-4">
                      <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center mb-2 mx-auto">
                        <svg className="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                        </svg>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                        {categoryNames[template.category] || template.category}
                      </div>
                    </div>
                  </div>
                  
                  {/* 选中状态指示器 */}
                  {selectedTemplate?.id === template.id && (
                    <div className="absolute top-2 right-2 w-6 h-6 bg-blue-600 rounded-full flex items-center justify-center">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                  )}
                </div>
                
                {/* 模板信息 */}
                <div className="p-3">
                  <h5 className="font-semibold text-gray-900 dark:text-white text-sm mb-1 truncate">
                    {template.title}
                  </h5>
                  <p className="text-xs text-gray-600 dark:text-gray-400 line-clamp-2 leading-relaxed">
                    {template.description}
                  </p>
                  
                  {/* 模板标签 */}
                  <div className="flex items-center justify-between mt-2">
                    <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-600 text-gray-800 dark:text-gray-200">
                      {categoryNames[template.category] || template.category}
                    </span>
                    
                    {template.display_order && (
                      <span className="text-xs text-gray-500 dark:text-gray-400">
                        #{template.display_order}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))
        ) : (
          <div className="flex-1 text-center py-12">
            <div className="text-gray-500 dark:text-gray-400">
              <svg className="w-12 h-12 mx-auto mb-4 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">该类别下暂无模板</p>
            </div>
          </div>
        )}
      </div>
      
      {/* 滚动提示 */}
      {filteredTemplates.length > 3 && (
        <div className="text-center mt-2">
          <p className="text-xs text-gray-500 dark:text-gray-400">
            ← 左右滑动查看更多模板 →
          </p>
        </div>
      )}
    </div>
  )
}

export default TemplateSelector
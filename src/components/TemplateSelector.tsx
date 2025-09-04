'use client'

import { useState, useEffect } from 'react'
import { Template } from '@/app/generate/page'

interface TemplateSelectorProps {
  onTemplateSelect: (template: Template) => void
  selectedTemplate?: Template | null
  className?: string
}

// 模拟模板数据
const mockTemplates: Template[] = [
  {
    id: 'template-1',
    name: '商务模板',
    description: '适合商务文档、报告和提案的专业模板',
    thumbnail: '/templates/business.jpg',
    category: 'business'
  },
  {
    id: 'template-2',
    name: '学术模板',
    description: '适合学术论文、研究报告的正式模板',
    thumbnail: '/templates/academic.jpg',
    category: 'academic'
  },
  {
    id: 'template-3',
    name: '简历模板',
    description: '现代简洁的个人简历模板',
    thumbnail: '/templates/resume.jpg',
    category: 'resume'
  },
  {
    id: 'template-4',
    name: '创意模板',
    description: '色彩丰富的创意设计模板',
    thumbnail: '/templates/creative.jpg',
    category: 'creative'
  },
  {
    id: 'template-5',
    name: '技术文档模板',
    description: '适合技术文档和API文档的模板',
    thumbnail: '/templates/technical.jpg',
    category: 'technical'
  },
  {
    id: 'template-6',
    name: '营销模板',
    description: '适合营销材料和宣传册的模板',
    thumbnail: '/templates/marketing.jpg',
    category: 'marketing'
  }
]

const categories = [
  { id: 'all', name: '全部模板', count: mockTemplates.length },
  { id: 'business', name: '商务', count: mockTemplates.filter(t => t.category === 'business').length },
  { id: 'academic', name: '学术', count: mockTemplates.filter(t => t.category === 'academic').length },
  { id: 'resume', name: '简历', count: mockTemplates.filter(t => t.category === 'resume').length },
  { id: 'creative', name: '创意', count: mockTemplates.filter(t => t.category === 'creative').length },
  { id: 'technical', name: '技术', count: mockTemplates.filter(t => t.category === 'technical').length },
  { id: 'marketing', name: '营销', count: mockTemplates.filter(t => t.category === 'marketing').length }
]

export default function TemplateSelector({ onTemplateSelect, selectedTemplate, className = '' }: TemplateSelectorProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [previewTemplate, setPreviewTemplate] = useState<Template | null>(null)

  // 加载模板数据
  useEffect(() => {
    const loadTemplates = async () => {
      setIsLoading(true)
      try {
        // 模拟API调用
        await new Promise(resolve => setTimeout(resolve, 500))
        setTemplates(mockTemplates)
        setFilteredTemplates(mockTemplates)
      } catch (error) {
        console.error('加载模板失败:', error)
      } finally {
        setIsLoading(false)
      }
    }

    loadTemplates()
  }, [])

  // 过滤模板
  useEffect(() => {
    let filtered = templates

    // 按分类过滤
    if (selectedCategory !== 'all') {
      filtered = filtered.filter(template => template.category === selectedCategory)
    }

    // 按搜索关键词过滤
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase()
      filtered = filtered.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query)
      )
    }

    setFilteredTemplates(filtered)
  }, [templates, selectedCategory, searchQuery])

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    onTemplateSelect(template)
  }

  // 处理模板预览
  const handleTemplatePreview = (template: Template) => {
    setPreviewTemplate(template)
  }

  if (isLoading) {
    return (
      <div className={`p-6 ${className}`}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">正在加载模板...</p>
        </div>
      </div>
    )
  }

  return (
    <div className={`${className}`}>
      {/* 搜索和过滤 */}
      <div className="mb-6">
        {/* 搜索框 */}
        <div className="mb-4">
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <svg className="h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input
              type="text"
              placeholder="搜索模板..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>

        {/* 分类标签 */}
        <div className="flex flex-wrap gap-2">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                selectedCategory === category.id
                  ? 'bg-blue-600 text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {category.name} ({category.count})
            </button>
          ))}
        </div>
      </div>

      {/* 模板网格 */}
      {filteredTemplates.length === 0 ? (
        <div className="text-center py-12">
          <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <p className="mt-4 text-gray-500">没有找到匹配的模板</p>
          <p className="text-sm text-gray-400">尝试调整搜索条件或选择其他分类</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTemplates.map((template) => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden transition-all duration-200 hover:shadow-lg cursor-pointer ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* 模板缩略图 */}
              <div className="aspect-w-16 aspect-h-9 bg-gray-200">
                <div className="w-full h-48 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                  {/* 模拟模板预览 */}
                  <div className="text-center">
                    <div className="w-16 h-20 bg-white rounded shadow-md mx-auto mb-2 flex items-center justify-center">
                      <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <p className="text-xs text-gray-500">{template.category}</p>
                  </div>
                </div>
              </div>

              {/* 模板信息 */}
              <div className="p-4">
                <h3 className="text-lg font-medium text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                
                <div className="flex justify-between items-center">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(c => c.id === template.category)?.name || template.category}
                  </span>
                  
                  <div className="flex space-x-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation()
                        handleTemplatePreview(template)
                      }}
                      className="text-sm text-gray-500 hover:text-gray-700"
                    >
                      预览
                    </button>
                    
                    {selectedTemplate?.id === template.id && (
                      <span className="text-sm text-blue-600 font-medium">已选择</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 模板预览模态框 */}
      {previewTemplate && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-medium text-gray-900">模板预览: {previewTemplate.name}</h3>
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* 预览内容 */}
              <div className="bg-gray-100 p-4 rounded-lg mb-4">
                <div className="bg-white p-6 rounded shadow-sm">
                  <h1 className="text-2xl font-bold mb-4">示例文档标题</h1>
                  <p className="text-gray-600 mb-4">{previewTemplate.description}</p>
                  <div className="space-y-2">
                    <h2 className="text-lg font-semibold">章节标题</h2>
                    <p>这是使用 {previewTemplate.name} 的示例内容。您可以看到这个模板的基本样式和布局。</p>
                    <ul className="list-disc list-inside space-y-1">
                      <li>列表项目 1</li>
                      <li>列表项目 2</li>
                      <li>列表项目 3</li>
                    </ul>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => setPreviewTemplate(null)}
                  className="px-4 py-2 text-gray-700 bg-gray-200 rounded-md hover:bg-gray-300"
                >
                  关闭
                </button>
                <button
                  onClick={() => {
                    handleTemplateSelect(previewTemplate)
                    setPreviewTemplate(null)
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
                >
                  选择此模板
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
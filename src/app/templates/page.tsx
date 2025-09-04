'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import TemplateSelector from '@/components/TemplateSelector'

interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  previewUrl?: string
}

const TemplatesPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 模拟模板数据
  const templates: Template[] = [
    {
      id: 'business-report',
      name: '商业报告',
      description: '专业的商业报告模板，适用于企业汇报和分析',
      category: 'business',
      thumbnail: '/templates/business-report.jpg',
      previewUrl: '/templates/preview/business-report.pdf'
    },
    {
      id: 'academic-paper',
      name: '学术论文',
      description: '标准的学术论文格式，符合期刊投稿要求',
      category: 'academic',
      thumbnail: '/templates/academic-paper.jpg',
      previewUrl: '/templates/preview/academic-paper.pdf'
    },
    {
      id: 'resume',
      name: '个人简历',
      description: '现代简洁的简历模板，突出个人技能和经验',
      category: 'personal',
      thumbnail: '/templates/resume.jpg',
      previewUrl: '/templates/preview/resume.pdf'
    },
    {
      id: 'invoice',
      name: '发票模板',
      description: '标准的商业发票格式，包含所有必要信息',
      category: 'business',
      thumbnail: '/templates/invoice.jpg',
      previewUrl: '/templates/preview/invoice.pdf'
    },
    {
      id: 'presentation',
      name: '演示文稿',
      description: '精美的演示文稿模板，适用于各种场合',
      category: 'presentation',
      thumbnail: '/templates/presentation.jpg',
      previewUrl: '/templates/preview/presentation.pdf'
    },
    {
      id: 'contract',
      name: '合同模板',
      description: '标准的合同格式，包含常用条款',
      category: 'legal',
      thumbnail: '/templates/contract.jpg',
      previewUrl: '/templates/preview/contract.pdf'
    }
  ]

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'business', name: '商业' },
    { id: 'academic', name: '学术' },
    { id: 'personal', name: '个人' },
    { id: 'presentation', name: '演示' },
    { id: 'legal', name: '法律' }
  ]

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      // 跳转到生成页面并传递模板ID
      window.location.href = `/generate?template=${selectedTemplate.id}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                PDF工具
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/generate"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                生成PDF
              </Link>
              <Link
                href="/edit"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                编辑PDF
              </Link>
              <Link
                href="/templates"
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                模板库
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF模板库</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            选择适合您需求的专业模板，快速创建精美的PDF文档
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 模板网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* 模板缩略图 */}
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              
              {/* 模板信息 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(cat => cat.id === template.category)?.name}
                  </span>
                  {selectedTemplate?.id === template.id && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 没有找到模板 */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的模板</h3>
            <p className="text-gray-600">请尝试调整搜索条件或选择不同的分类</p>
          </div>
        )}

        {/* 操作按钮 */}
        {selectedTemplate && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleUseTemplate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>使用此模板</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplatesPage
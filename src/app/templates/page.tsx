'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { Search, Filter, Grid, List, Star, Download, Eye } from 'lucide-react'
import { Template, getAllTemplates } from '@/data/templates'

const TemplatesPage: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    // 跳转到生成页面，并传递模板信息
    window.location.href = `/generate?template=${encodeURIComponent(JSON.stringify(template))}`
  }

  // 获取模板数据
  const templates: Template[] = getAllTemplates()

  // 功能区数据
  const sidebarFeatures = [
    { name: 'PDF制作', icon: '📄', href: '/generate' },
    { name: '历史记录', icon: '📋', href: '/history' }
  ]

  // 模板分类数据
  const categories = [
    'All', 'Design', 'Document', 'Business', 'Marketing', 'Education', 
    'Legal', 'Finance', 'HR', 'Personal', 'Forms', 'Presentations'
  ]

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.tags.some(tag => tag.toLowerCase().includes(searchQuery.toLowerCase()))
    const matchesCategory = selectedCategory === 'All' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })



  return (
    <div className="min-h-screen bg-white">
      {/* 顶部导航栏 */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
        <div className="max-w-full px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="flex items-center">
              <Link href="/" className="text-2xl font-bold text-blue-600 mr-8">
                TEMPLATE.NET
              </Link>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Search Templates"
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
            </div>

            {/* 右侧按钮 */}
            <div className="flex items-center space-x-4">
              <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors">
                Go Pro
              </button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* 左侧功能菜单 */}
        <aside className="w-20 bg-white border-r border-gray-200 min-h-screen">
          <div className="p-2">
            <nav className="space-y-4">
              {sidebarFeatures.map((feature) => (
                <Link
                  key={feature.name}
                  href={feature.href}
                  className="w-full flex flex-col items-center px-2 py-3 text-xs font-medium rounded-lg transition-colors text-gray-700 hover:bg-gray-50"
                >
                  <span className="text-xl mb-1">{feature.icon}</span>
                  <span className="text-center leading-tight">{feature.name}</span>
                </Link>
              ))}
            </nav>
          </div>
        </aside>

        {/* 主要内容区域 */}
        <main className="flex-1 p-6">
          {/* 模板分类选项卡 */}
          <div className="mb-6">
            <div className="flex flex-wrap gap-2">
              {categories.map((category) => (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={`px-4 py-2 text-sm font-medium rounded-full transition-colors ${
                    selectedCategory === category
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>
          </div>

          {/* 页面标题 */}
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900 mb-2">
              {selectedCategory === 'All' ? 'Free Templates' : `${selectedCategory} Templates`}
            </h1>
            <p className="text-gray-600">
              {filteredTemplates.length} templates found
            </p>
          </div>

          {/* 模板网格 */}
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-6">
            {filteredTemplates.map((template) => (
              <div
                key={template.id}
                className="group bg-white rounded-lg border border-gray-200 overflow-hidden hover:shadow-lg transition-all duration-200 cursor-pointer"
                onClick={() => handleTemplateSelect(template)}
              >
                {/* 模板缩略图 */}
                <div className="relative h-48 bg-gray-100 flex items-center justify-center">
                  <div className="absolute top-2 left-2">
                    <span className="bg-green-500 text-white px-2 py-1 rounded text-xs font-medium">
                      Free
                    </span>
                  </div>
                  <div className="absolute top-2 right-2">
                    <button 
                      className="p-1 rounded-full hover:bg-gray-200 transition-colors"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  {/* 模板预览图标 */}
                  <div className="w-16 h-20 bg-white border border-gray-300 rounded shadow-sm flex items-center justify-center">
                    <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>

                {/* 模板信息 */}
                <div className="p-3">
                  <h3 className="text-sm font-medium text-gray-900 mb-1 line-clamp-1">
                    {template.name}
                  </h3>
                  <p className="text-xs text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* 没有找到模板 */}
          {filteredTemplates.length === 0 && (
            <div className="text-center py-16">
              <div className="max-w-md mx-auto">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No templates found</h3>
                <p className="text-gray-600 mb-4">Try adjusting your search or filter criteria</p>
                <button
                  onClick={() => {
                    setSearchQuery('')
                    setSelectedCategory('All')
                  }}
                  className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  Reset filters
                </button>
              </div>
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default TemplatesPage
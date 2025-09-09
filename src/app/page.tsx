'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { Template, getAllTemplates } from '@/data/templates'

export default function Home() {
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('All')
  const router = useRouter()

  // 处理模板选择
  const handleTemplateSelect = (template: Template) => {
    // 跳转到editorview页面，并传递模板信息
    router.push(`/editorview?templateId=${template.id}&category=${template.category}`)
  }

  // 获取模板数据
  const templates: Template[] = getAllTemplates()

  // 从模板数据中动态获取分类
  const categories = ['All', ...Array.from(new Set(templates.map(template => template.category)))]

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.category.toLowerCase().includes(searchQuery.toLowerCase())
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
                PDF工具
              </Link>
            </div>

            {/* 搜索框 */}
            <div className="flex-1 max-w-2xl mx-8">
              <div className="relative">
                <input
                  type="text"
                  placeholder="搜索模板"
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
              <Link
                href="/editorview"
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                开始创建
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* 主要内容区域 */}
      <main className="max-w-7xl mx-auto p-6">
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
            {selectedCategory === 'All' ? '选择模板开始创建' : `${selectedCategory} 模板`}
          </h1>
          <p className="text-gray-600">
            找到 {filteredTemplates.length} 个模板
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
                    免费
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
                  {template.title}
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
              <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到模板</h3>
              <p className="text-gray-600 mb-4">尝试调整搜索条件或筛选条件</p>
              <button
                onClick={() => {
                  setSearchQuery('')
                  setSelectedCategory('All')
                }}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
              >
                重置筛选
              </button>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

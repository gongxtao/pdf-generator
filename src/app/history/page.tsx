'use client'

import React, { useState, useEffect } from 'react'
import Link from 'next/link'
import { Download, FileText, Trash2, Eye, Calendar } from 'lucide-react'
import Sidebar from '@/components/Sidebar'

// PDF历史记录的类型定义
interface PDFHistory {
  id: string
  title: string
  templateName: string
  createdAt: string
  fileSize: string
  downloadUrl?: string
}

/**
 * PDF历史记录页面
 * 显示用户生成的所有PDF文档历史
 */
const HistoryPage: React.FC = () => {
  const [historyList, setHistoryList] = useState<PDFHistory[]>([])
  const [loading, setLoading] = useState(true)

  // 模拟获取历史记录数据
  useEffect(() => {
    // 这里应该从API或本地存储获取真实的历史记录
    // 目前使用模拟数据
    const mockHistory: PDFHistory[] = [
      {
        id: '1',
        title: '项目需求文档',
        templateName: '商务报告',
        createdAt: '2024-01-15 14:30',
        fileSize: '2.3 MB'
      },
      {
        id: '2', 
        title: '会议纪要',
        templateName: '简洁报告',
        createdAt: '2024-01-14 09:15',
        fileSize: '1.8 MB'
      },
      {
        id: '3',
        title: '产品说明书',
        templateName: '技术文档',
        createdAt: '2024-01-13 16:45',
        fileSize: '3.1 MB'
      }
    ]
    
    // 模拟加载延迟
    setTimeout(() => {
      setHistoryList(mockHistory)
      setLoading(false)
    }, 1000)
  }, [])

  // 删除历史记录
  const handleDelete = (id: string) => {
    if (confirm('确定要删除这个PDF记录吗？')) {
      setHistoryList(prev => prev.filter(item => item.id !== id))
    }
  }

  // 下载PDF
  const handleDownload = (item: PDFHistory) => {
    // 这里应该实现真实的下载逻辑
    alert(`下载 ${item.title} - 功能开发中`)
  }

  // 预览PDF
  const handlePreview = (item: PDFHistory) => {
    // 这里应该实现PDF预览功能
    alert(`预览 ${item.title} - 功能开发中`)
  }

  return (
    <div className="min-h-screen bg-white flex">
      {/* 左侧功能菜单 */}
      <Sidebar />

      {/* 主要内容区域 */}
      <main className="flex-1 p-6">
        {/* 页面标题 */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">PDF历史记录</h1>
          <p className="text-gray-600">查看和管理您生成的所有PDF文档</p>
        </div>

        {/* 统计信息 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-blue-50 p-6 rounded-lg">
            <div className="flex items-center">
              <FileText className="w-8 h-8 text-blue-600 mr-3" />
              <div>
                <p className="text-sm text-blue-600 font-medium">总文档数</p>
                <p className="text-2xl font-bold text-blue-900">{historyList.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Download className="w-8 h-8 text-green-600 mr-3" />
              <div>
                <p className="text-sm text-green-600 font-medium">本月生成</p>
                <p className="text-2xl font-bold text-green-900">{historyList.length}</p>
              </div>
            </div>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <div className="flex items-center">
              <Calendar className="w-8 h-8 text-purple-600 mr-3" />
              <div>
                <p className="text-sm text-purple-600 font-medium">最近活动</p>
                <p className="text-2xl font-bold text-purple-900">今天</p>
              </div>
            </div>
          </div>
        </div>

        {/* 历史记录列表 */}
        <div className="bg-white rounded-lg shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900">文档列表</h2>
          </div>
          
          {loading ? (
            <div className="p-8 text-center">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <p className="mt-2 text-gray-600">加载中...</p>
            </div>
          ) : historyList.length === 0 ? (
            <div className="p-8 text-center">
              <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-500 mb-4">暂无PDF历史记录</p>
              <Link 
                href="/editorview" 
                className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                <FileText className="w-4 h-4 mr-2" />
                开始创建PDF
              </Link>
            </div>
          ) : (
            <div className="divide-y divide-gray-200">
              {historyList.map((item) => (
                <div key={item.id} className="p-6 hover:bg-gray-50 transition-colors">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="text-lg font-medium text-gray-900 mb-1">{item.title}</h3>
                      <div className="flex items-center space-x-4 text-sm text-gray-600">
                        <span className="flex items-center">
                          <FileText className="w-4 h-4 mr-1" />
                          {item.templateName}
                        </span>
                        <span className="flex items-center">
                          <Calendar className="w-4 h-4 mr-1" />
                          {item.createdAt}
                        </span>
                        <span>{item.fileSize}</span>
                      </div>
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={() => handlePreview(item)}
                        className="p-2 text-gray-600 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                        title="预览"
                      >
                        <Eye className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDownload(item)}
                        className="p-2 text-gray-600 hover:text-green-600 hover:bg-green-50 rounded-lg transition-colors"
                        title="下载"
                      >
                        <Download className="w-5 h-5" />
                      </button>
                      
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="p-2 text-gray-600 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                        title="删除"
                      >
                        <Trash2 className="w-5 h-5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* 底部操作区域 */}
        {historyList.length > 0 && (
          <div className="mt-8 flex justify-between items-center">
            <p className="text-sm text-gray-600">
              共 {historyList.length} 个文档
            </p>
            
            <Link 
              href="/editorview" 
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              <FileText className="w-4 h-4 mr-2" />
              创建新PDF
            </Link>
          </div>
        )}
      </main>
    </div>
  )
}

export default HistoryPage
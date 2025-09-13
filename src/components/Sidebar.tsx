'use client'

import React from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

// 侧边栏功能项的类型定义
interface SidebarFeature {
  name: string
  icon: string
  href: string
}

// 侧边栏组件的属性类型
interface SidebarProps {
  className?: string
}

/**
 * 通用侧边栏组件
 * 用于在多个页面中显示功能菜单
 * 包含PDF制作和历史记录功能
 */
const Sidebar: React.FC<SidebarProps> = ({ className = '' }) => {
  const pathname = usePathname()

  // 侧边栏功能菜单数据
  const sidebarFeatures: SidebarFeature[] = [
    { name: 'PDF制作', icon: '📄', href: '/editorview' },
    { name: '历史记录', icon: '📋', href: '/history' }
  ]

  return (
    <aside className={`w-20 bg-white border-r border-gray-200 min-h-screen ${className}`}>
      <div className="p-2">
        <nav className="space-y-4">
          {sidebarFeatures.map((feature) => {
            // 判断当前页面是否为活跃状态
            const isActive = pathname === feature.href
            
            return (
              <Link
                key={feature.name}
                href={feature.href}
                className={`w-full flex flex-col items-center px-2 py-3 text-xs font-medium rounded-lg transition-colors ${
                  isActive 
                    ? 'bg-blue-50 text-blue-600 border border-blue-200' 
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <span className="text-xl mb-1">{feature.icon}</span>
                <span className="text-center leading-tight">{feature.name}</span>
              </Link>
            )
          })}
        </nav>
      </div>
    </aside>
  )
}

export default Sidebar
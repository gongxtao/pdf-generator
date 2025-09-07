import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import EditorPage from './page'

// Mock Next.js hooks
jest.mock('next/navigation', () => ({
  useSearchParams: () => ({
    get: jest.fn(() => null)
  })
}))

// Mock Next.js Link component
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

// Mock ToastManager
jest.mock('@/components/ToastManager', () => ({
  useToast: () => ({
    showToast: jest.fn()
  })
}))

// Mock mammoth library
jest.mock('mammoth', () => ({
  extractRawText: jest.fn(() => Promise.resolve({ value: 'Mock document content' }))
}))

// Mock pdfjs-dist dynamic import
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(() => ({
    promise: Promise.resolve({
      numPages: 1,
      getPage: jest.fn(() => Promise.resolve({
        getTextContent: jest.fn(() => Promise.resolve({
          items: [{ str: 'Mock PDF content' }]
        }))
      }))
    })
  })),
  GlobalWorkerOptions: {
    workerSrc: ''
  },
  version: '3.11.174'
}))

// Mock fetch for API calls
global.fetch = jest.fn()

describe('EditorPage - 模板滑动功能测试', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    // Mock successful API response
    ;(global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      blob: () => Promise.resolve(new Blob(['mock pdf'], { type: 'application/pdf' }))
    })
  })

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('应该渲染模板选择区域', async () => {
    render(<EditorPage />)
    
    // 检查模板选择标题
    expect(screen.getByText('选择模板')).toBeInTheDocument()
    
    // 检查搜索框
    expect(screen.getByPlaceholderText('搜索模板...')).toBeInTheDocument()
    
    // 等待模板加载并检查是否有模板卡片
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
  })

  test('模板容器应该有正确的滚动样式', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 查找模板容器
    const templateContainer = document.querySelector('.overflow-x-auto.overflow-y-hidden')
    expect(templateContainer).toBeInTheDocument()
    expect(templateContainer).toHaveClass('flex', 'space-x-4', 'overflow-x-auto', 'overflow-y-hidden', 'pb-2', 'max-w-full')
  })

  test('应该显示多个模板卡片', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      // 检查是否有多个模板（至少5个以上才需要滚动）
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
      expect(screen.getByText('Classic Flyer')).toBeInTheDocument()
      expect(screen.getByText('Creative Flyer')).toBeInTheDocument()
      expect(screen.getByText('Event Poster')).toBeInTheDocument()
      expect(screen.getByText('Product Poster')).toBeInTheDocument()
      expect(screen.getByText('Professional Card')).toBeInTheDocument()
    })
  })

  test('模板卡片应该有正确的样式和结构', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 查找第一个模板卡片
    const templateCards = document.querySelectorAll('.flex-shrink-0.cursor-pointer')
    expect(templateCards.length).toBeGreaterThan(0)
    
    // 检查第一个卡片的样式
    const firstCard = templateCards[0]
    expect(firstCard).toHaveClass('flex-shrink-0', 'cursor-pointer', 'p-3', 'rounded-lg', 'border-2', 'transition-all', 'w-32')
  })

  test('点击模板卡片应该选中模板', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 点击第一个模板
    const modernFlyerCard = screen.getByText('Modern Flyer').closest('.cursor-pointer')
    expect(modernFlyerCard).toBeInTheDocument()
    
    fireEvent.click(modernFlyerCard!)
    
    // 检查是否显示当前选中的模板
    await waitFor(() => {
      expect(screen.getByText('当前模板：Modern Flyer')).toBeInTheDocument()
    })
  })

  test('选中的模板应该有不同的样式', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 点击模板选中它
    const modernFlyerCard = screen.getByText('Modern Flyer').closest('.cursor-pointer')
    fireEvent.click(modernFlyerCard!)
    
    await waitFor(() => {
      // 检查选中的模板是否有蓝色边框样式
      expect(modernFlyerCard).toHaveClass('border-blue-500', 'bg-blue-50')
    })
  })

  test('搜索功能应该过滤模板', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 在搜索框中输入"Modern"
    const searchInput = screen.getByPlaceholderText('搜索模板...')
    fireEvent.change(searchInput, { target: { value: 'Modern' } })
    
    await waitFor(() => {
      // 应该只显示包含"Modern"的模板
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
      // 其他不匹配的模板应该不显示
      expect(screen.queryByText('Classic Flyer')).not.toBeInTheDocument()
    })
  })

  test('清空搜索应该显示所有模板', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    const searchInput = screen.getByPlaceholderText('搜索模板...')
    
    // 先搜索
    fireEvent.change(searchInput, { target: { value: 'Modern' } })
    
    await waitFor(() => {
      expect(screen.queryByText('Classic Flyer')).not.toBeInTheDocument()
    })
    
    // 清空搜索
    fireEvent.change(searchInput, { target: { value: '' } })
    
    await waitFor(() => {
      // 所有模板应该重新显示
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
      expect(screen.getByText('Classic Flyer')).toBeInTheDocument()
      expect(screen.getByText('Creative Flyer')).toBeInTheDocument()
    })
  })

  test('模板容器应该支持水平滚动', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    const templateContainer = document.querySelector('.overflow-x-auto.overflow-y-hidden')
    expect(templateContainer).toBeInTheDocument()
    
    // 模拟滚动事件
    fireEvent.scroll(templateContainer!, { target: { scrollLeft: 100 } })
    
    // 容器应该仍然存在且可滚动
    expect(templateContainer).toBeInTheDocument()
    expect(templateContainer).toHaveClass('overflow-x-auto')
  })

  test('模板卡片应该有固定宽度以支持滚动', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 检查模板卡片是否有固定宽度和flex-shrink-0类
    const templateCards = document.querySelectorAll('.flex-shrink-0.w-32')
    expect(templateCards.length).toBeGreaterThan(0)
    
    templateCards.forEach(card => {
      expect(card).toHaveClass('flex-shrink-0', 'w-32')
    })
  })

  test('应该有自定义滚动条样式', async () => {
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Modern Flyer')).toBeInTheDocument()
    })
    
    // 检查是否有style标签包含滚动条样式
    const styleElements = document.querySelectorAll('style')
    let hasScrollbarStyles = false
    
    styleElements.forEach(style => {
      if (style.textContent?.includes('webkit-scrollbar')) {
        hasScrollbarStyles = true
      }
    })
    
    expect(hasScrollbarStyles).toBe(true)
  })
})

describe('EditorPage - 模板滑动功能边界测试', () => {
  test('当没有模板时应该正确处理', async () => {
    // Mock空的模板数组
    const originalGetAllTemplates = require('./page').getAllTemplates
    jest.doMock('./page', () => ({
      ...jest.requireActual('./page'),
      getAllTemplates: () => []
    }))
    
    render(<EditorPage />)
    
    // 应该显示模板选择区域但没有模板卡片
    expect(screen.getByText('选择模板')).toBeInTheDocument()
    
    const templateContainer = document.querySelector('.overflow-x-auto.overflow-y-hidden')
    expect(templateContainer).toBeInTheDocument()
    expect(templateContainer?.children.length).toBe(0)
  })

  test('当只有一个模板时不需要滚动', async () => {
    // Mock只有一个模板
    jest.doMock('./page', () => ({
      ...jest.requireActual('./page'),
      getAllTemplates: () => [{
        id: 'single-template',
        name: 'Single Template',
        description: '唯一模板',
        thumbnail: '/api/placeholder/120/80',
        category: 'test',
        template_content: 'single template content'
      }]
    }))
    
    render(<EditorPage />)
    
    await waitFor(() => {
      expect(screen.getByText('Single Template')).toBeInTheDocument()
    })
    
    const templateContainer = document.querySelector('.overflow-x-auto.overflow-y-hidden')
    expect(templateContainer).toBeInTheDocument()
    expect(templateContainer?.children.length).toBe(1)
  })
})
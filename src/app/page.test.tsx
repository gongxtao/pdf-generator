import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'
import Home from './page'

// 模拟 Next.js Link 组件
jest.mock('next/link', () => {
  return ({ children, href }: { children: React.ReactNode; href: string }) => {
    return <a href={href}>{children}</a>
  }
})

describe('首页', () => {
  it('应该渲染页面标题', () => {
    render(<Home />)
    
    // 检查主标题是否存在
    const mainTitle = screen.getByText('专业的PDF生成工具')
    expect(mainTitle).toBeInTheDocument()
  })

  it('应该渲染页面描述', () => {
    render(<Home />)
    
    // 检查描述文本是否存在
    const description = screen.getByText(/选择模板，编辑内容，一键生成精美的PDF文档/)
    expect(description).toBeInTheDocument()
  })

  it('应该渲染导航栏', () => {
    render(<Home />)
    
    // 检查导航栏标题
    const navTitle = screen.getByText('PDF工具')
    expect(navTitle).toBeInTheDocument()
  })

  it('应该渲染三个功能卡片', () => {
    render(<Home />)
    
    // 检查三个功能卡片的标题
    expect(screen.getByText('生成PDF')).toBeInTheDocument()
    expect(screen.getByText('编辑PDF')).toBeInTheDocument()
    expect(screen.getByText('模板库')).toBeInTheDocument()
  })

  it('应该包含正确的链接', () => {
    render(<Home />)
    
    // 检查链接是否存在
    const generateLink = screen.getByRole('link', { name: /开始生成/ })
    const editLink = screen.getByRole('link', { name: /编辑文档/ })
    const templatesLink = screen.getByRole('link', { name: /浏览模板/ })
    
    expect(generateLink).toHaveAttribute('href', '/generate')
    expect(editLink).toHaveAttribute('href', '/edit')
    expect(templatesLink).toHaveAttribute('href', '/templates')
  })

  it('应该有正确的样式类', () => {
    render(<Home />)
    
    // 检查主容器是否有正确的背景样式
    const mainContainer = screen.getByText('专业的PDF生成工具').closest('div')
    expect(mainContainer?.parentElement?.parentElement).toHaveClass('min-h-screen', 'bg-gradient-to-br', 'from-blue-50', 'to-indigo-100')
  })
})
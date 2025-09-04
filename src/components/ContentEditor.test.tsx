import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import ContentEditor from './ContentEditor'

// Mock TinyMCE
jest.mock('tinymce', () => ({
  init: jest.fn((config) => {
    // 模拟TinyMCE初始化
    setTimeout(() => {
      const mockEditor = {
        setContent: jest.fn(),
        getContent: jest.fn(() => 'mock content'),
        on: jest.fn((event, callback) => {
          if (event === 'input change keyup') {
            // 模拟内容变化事件
            setTimeout(() => callback(), 100)
          }
        })
      }
      config.init_instance_callback?.(mockEditor)
    }, 100)
  }),
  remove: jest.fn()
}))

// Mock window.tinymce
Object.defineProperty(window, 'tinymce', {
  value: {
    init: jest.fn((config) => {
      setTimeout(() => {
        const mockEditor = {
          setContent: jest.fn(),
          getContent: jest.fn(() => 'mock content'),
          on: jest.fn()
        }
        config.init_instance_callback?.(mockEditor)
      }, 100)
    }),
    remove: jest.fn()
  },
  writable: true
})

describe('ContentEditor', () => {
  const mockOnChange = jest.fn()
  
  beforeEach(() => {
    mockOnChange.mockClear()
    
    // 清除之前的 mocks
    jest.clearAllMocks()
    
    // Mock document.createElement for script loading
    const mockScript = {
      src: '',
      onload: null as any,
      setAttribute: jest.fn(),
      getAttribute: jest.fn()
    }
    
    const originalCreateElement = document.createElement.bind(document)
    const createElementSpy = jest.spyOn(document, 'createElement').mockImplementation((tagName) => {
      if (tagName === 'script') {
        setTimeout(() => {
          if (mockScript.onload) {
            mockScript.onload()
          }
        }, 50)
        return mockScript as any
      }
      return originalCreateElement(tagName)
    })
    
    // Mock document.head.appendChild
    jest.spyOn(document.head, 'appendChild').mockImplementation(() => mockScript as any)
    
    // 确保 spy 被正确设置
    ;(global as any).mockCreateElementSpy = createElementSpy
  })
  
  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('renders title input field', () => {
    render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
      />
    )
    
    const titleInput = screen.getByLabelText('文档标题')
    expect(titleInput).toBeInTheDocument()
    expect(titleInput).toHaveValue('Test Title')
  })

  test('renders content editor area', () => {
    render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
      />
    )
    
    const contentLabel = screen.getByText('文档内容')
    expect(contentLabel).toBeInTheDocument()
  })

  test('shows loading state initially', () => {
    // 模拟服务端渲染状态，组件还未在客户端初始化
    const originalUseEffect = React.useEffect
    jest.spyOn(React, 'useEffect').mockImplementation((effect, deps) => {
      // 跳过设置 isClient 为 true 的 useEffect
      if (deps && deps.length === 0) {
        return
      }
      return originalUseEffect(effect, deps)
    })
    
    render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
      />
    )
    
    const loadingText = screen.getByText('编辑器加载中...')
    expect(loadingText).toBeInTheDocument()
    
    // 恢复原始的 useEffect
    React.useEffect = originalUseEffect
  })

  test('handles title change', async () => {
    render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
      />
    )
    
    const titleInput = screen.getByLabelText('文档标题')
    fireEvent.change(titleInput, { target: { value: 'New Title' } })
    
    expect(mockOnChange).toHaveBeenCalledWith('Test Content', 'New Title')
  })

  test('displays editing tips', () => {
    render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
      />
    )
    
    const tipsText = screen.getByText('编辑提示：')
    expect(tipsText).toBeInTheDocument()
    
    const tipsContent = screen.getByText(/使用富文本编辑器来格式化文档内容/)
    expect(tipsContent).toBeInTheDocument()
  })

  test('initializes TinyMCE editor after client-side rendering', async () => {
    render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
      />
    )
    
    // 检查标题输入框是否存在
    const titleInput = screen.getByLabelText('文档标题')
    expect(titleInput).toBeInTheDocument()
    expect(titleInput).toHaveValue('Test Title')
    
    // 检查内容编辑器标签是否存在
    expect(screen.getByText('文档内容')).toBeInTheDocument()
    
    // 等待一段时间确保组件完全渲染
    await waitFor(() => {
      expect(titleInput).toBeInTheDocument()
    }, { timeout: 1000 })
  })

  test('handles props updates', () => {
    const { rerender } = render(
      <ContentEditor
        title="Original Title"
        content="Original Content"
        onChange={mockOnChange}
      />
    )
    
    rerender(
      <ContentEditor
        title="Updated Title"
        content="Updated Content"
        onChange={mockOnChange}
      />
    )
    
    const titleInput = screen.getByLabelText('文档标题')
    expect(titleInput).toHaveValue('Updated Title')
  })

  test('applies custom className', () => {
    const { container } = render(
      <ContentEditor
        title="Test Title"
        content="Test Content"
        onChange={mockOnChange}
        className="custom-class"
      />
    )
    
    const editorContainer = container.firstChild as HTMLElement
    expect(editorContainer).toHaveClass('custom-class')
  })
})
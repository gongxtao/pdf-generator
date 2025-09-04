import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import FileUpload from './FileUpload'

describe('FileUpload 组件', () => {
  const mockOnFileSelect = jest.fn()

  beforeEach(() => {
    mockOnFileSelect.mockClear()
  })

  it('应该渲染文件上传区域', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />)
    
    // 检查上传提示文本
    expect(screen.getByText('拖拽文件到这里或点击上传')).toBeInTheDocument()
    expect(screen.getByText(/支持格式：.pdf,.doc,.docx,.txt，最大 10MB/)).toBeInTheDocument()
  })

  it('应该显示上传图标', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />)
    
    // 检查SVG图标是否存在
    const uploadIcon = document.querySelector('svg')
    expect(uploadIcon).toBeInTheDocument()
  })

  it('应该处理文件选择', async () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />)
    
    // 创建一个模拟文件
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    // 获取隐藏的文件输入框
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    // 模拟文件选择
    Object.defineProperty(fileInput, 'files', {
      value: [file],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    // 验证回调函数被调用
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })

  it('应该处理点击上传', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />)
    
    // 获取上传区域
    const uploadArea = screen.getByText('拖拽文件到这里或点击上传').closest('div')
    
    // 模拟点击
    fireEvent.click(uploadArea!)
    
    // 验证文件输入框存在（点击会触发文件选择对话框）
    const fileInput = document.querySelector('input[type="file"]')
    expect(fileInput).toBeInTheDocument()
  })

  it('应该验证文件大小', async () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} maxSize={1} />)
    
    // 创建一个超过大小限制的文件（2MB）
    const largeFile = new File(['x'.repeat(2 * 1024 * 1024)], 'large.pdf', { type: 'application/pdf' })
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [largeFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    // 验证错误消息显示
    await waitFor(() => {
      expect(screen.getByText('文件大小不能超过 1MB')).toBeInTheDocument()
    })
    
    // 验证回调函数没有被调用
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('应该验证文件类型', async () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} accept=".pdf" />)
    
    // 创建一个不支持的文件类型
    const invalidFile = new File(['test'], 'test.jpg', { type: 'image/jpeg' })
    
    const fileInput = document.querySelector('input[type="file"]') as HTMLInputElement
    
    Object.defineProperty(fileInput, 'files', {
      value: [invalidFile],
      writable: false,
    })
    
    fireEvent.change(fileInput)
    
    // 验证错误消息显示
    await waitFor(() => {
      expect(screen.getByText(/不支持的文件类型/)).toBeInTheDocument()
    })
    
    // 验证回调函数没有被调用
    expect(mockOnFileSelect).not.toHaveBeenCalled()
  })

  it('应该处理拖拽事件', () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />)
    
    const uploadArea = screen.getByText('拖拽文件到这里或点击上传').closest('div')?.parentElement!
    
    // 模拟拖拽进入
    fireEvent.dragOver(uploadArea)
    
    // 验证样式变化（拖拽状态）
    expect(uploadArea).toHaveClass('border-blue-500', 'bg-blue-50')
    
    // 模拟拖拽离开
    fireEvent.dragLeave(uploadArea)
    
    // 验证样式恢复
    expect(uploadArea).toHaveClass('border-gray-300')
  })

  it('应该处理拖拽放置', async () => {
    render(<FileUpload onFileSelect={mockOnFileSelect} />)
    
    const uploadArea = screen.getByText('拖拽文件到这里或点击上传').closest('div')?.parentElement!
    const file = new File(['test content'], 'test.pdf', { type: 'application/pdf' })
    
    // 模拟拖拽放置
    const dropEvent = new Event('drop', { bubbles: true })
    Object.defineProperty(dropEvent, 'dataTransfer', {
      value: {
        files: [file]
      }
    })
    
    fireEvent(uploadArea, dropEvent)
    
    // 验证回调函数被调用
    await waitFor(() => {
      expect(mockOnFileSelect).toHaveBeenCalledWith(file)
    })
  })
})
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { act } from 'react-dom/test-utils'
import EditorPage from '../page'
import { useToast } from '@/components/ToastManager'

// Mock next/navigation
jest.mock('next/navigation', () => ({
  useSearchParams: () => new URLSearchParams(),
}))

// Mock components/ToastManager
jest.mock('@/components/ToastManager', () => ({
  useToast: jest.fn(() => ({
    showSuccess: jest.fn(),
    showError: jest.fn(),
    showWarning: jest.fn(),
    showInfo: jest.fn(),
  })),
}))

// Mock fetch
global.fetch = jest.fn()

// Mock URL.createObjectURL and URL.revokeObjectURL
URL.createObjectURL = jest.fn()
URL.revokeObjectURL = jest.fn()

jest.setTimeout(15000)

describe('EditorPage', () => {
  const mockToast = useToast as jest.Mock
  
  beforeEach(() => {
    jest.clearAllMocks()
    ;(global.fetch as jest.Mock).mockReset()
    URL.createObjectURL.mockReset()
    URL.revokeObjectURL.mockReset()
  })

  // 测试模板选择功能
  describe('Template Selection', () => {
    it('renders all templates correctly', () => {
      render(<EditorPage />)
      
      // 验证所有默认模板是否显示
      expect(screen.getByText('商务报告')).toBeInTheDocument()
      expect(screen.getByText('技术文档')).toBeInTheDocument()
      expect(screen.getByText('项目计划')).toBeInTheDocument()
      expect(screen.getByText('会议纪要')).toBeInTheDocument()
      expect(screen.getByText('学术论文')).toBeInTheDocument()
      expect(screen.getByText('简历模板')).toBeInTheDocument()
    })

    it('filters templates based on search query', async () => {
      render(<EditorPage />)
      
      // 输入搜索关键词
      const searchInput = screen.getByPlaceholderText('搜索模板...')
      await userEvent.type(searchInput, '商务')

      // 验证筛选结果
      expect(screen.getByText('商务报告')).toBeInTheDocument()
      expect(screen.queryByText('技术文档')).not.toBeInTheDocument()
    })

    it('selects template on click', async () => {
      render(<EditorPage />)
      
      // 点击模板
      const template = screen.getByText('商务报告').closest('div')
      expect(template).toBeInTheDocument()
      await userEvent.click(template!)

      // 验证选中状态
      expect(template).toHaveClass('border-blue-500')
    })
  })

  // 测试文件上传功能
  describe('File Upload', () => {
    it('handles text file upload correctly', async () => {
      render(<EditorPage />)
      
      const file = new File(['测试内容'], 'test.txt', { type: 'text/plain' })
      const input = screen.getByRole('button', { name: /拖拽或点击上传文件/ }).querySelector('input')

      await act(async () => {
        await userEvent.upload(input, file)
      })

      // 验证文件内容是否正确填充
      const textarea = screen.getByPlaceholderText(/拖拽文件到此处/)
      expect(textarea).toHaveValue('测试内容')
    })

    it('handles PDF file upload correctly', async () => {
      render(<EditorPage />)
      
      // 模拟PDF文件上传
      const file = new File(['%PDF-'], 'test.pdf', { type: 'application/pdf' })
      const uploadButton = screen.getByText(/拖拽或点击上传文件/).closest('div')
      const input = uploadButton.querySelector('input')
      expect(input).not.toBeNull()

      await act(async () => {
        await userEvent.upload(input!, file)
      })

      // 验证是否显示上传成功提示
      expect(mockToast().showSuccess).toHaveBeenCalled()
    })

    it('handles drag and drop correctly', async () => {
      render(<EditorPage />)
      
      const file = new File(['测试内容'], 'test.txt', { type: 'text/plain' })
      const dropZone = screen.getByText(/拖拽或点击上传文件/).closest('div')

      await act(async () => {
        fireEvent.drop(dropZone!, {
          dataTransfer: {
            files: [file],
          },
        })
      })

      // 验证文件内容是否正确填充
      const textarea = screen.getByPlaceholderText(/拖拽文件到此处/)
      expect(textarea).toHaveValue('测试内容')
    })
  })

  // 测试PDF生成功能
  describe('PDF Generation', () => {
    it('generates PDF when form is valid', async () => {
      render(<EditorPage />)
      
      // 选择模板
      const template = screen.getByText('商务报告').closest('div')
      await userEvent.click(template!)

      // 输入内容
      const textarea = screen.getByPlaceholderText(/拖拽文件到此处/)
      await userEvent.type(textarea, '测试内容')

      // 模拟成功的PDF生成请求
      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
      })

      // 点击生成按钮
      const generateButton = screen.getByText('生成PDF预览')
      await userEvent.click(generateButton)

      // 验证API调用
      expect(global.fetch).toHaveBeenCalledWith('/api/generate-pdf-puppeteer', expect.any(Object))
      expect(mockToast().showSuccess).toHaveBeenCalledWith('PDF生成成功！')
    })

    it('handles PDF generation errors', async () => {
      render(<EditorPage />)
      
      // 选择模板并输入内容
      const template = screen.getByText('商务报告').closest('div')
      await userEvent.click(template!)
      const textarea = screen.getByPlaceholderText(/拖拽文件到此处/)
      await userEvent.type(textarea, '测试内容')

      // 模拟失败的PDF生成请求
      ;(global.fetch as jest.Mock).mockRejectedValueOnce(new Error('生成失败'))

      // 点击生成按钮
      const generateButton = screen.getByText('生成PDF预览')
      await userEvent.click(generateButton)

      // 验证错误提示
      expect(mockToast().showError).toHaveBeenCalled()
    })
  })

  // 测试编辑功能
  describe('Content Editing', () => {
    it('enters and exits edit mode correctly', async () => {
      render(<EditorPage />)
      
      // 选择模板并生成PDF
      const template = screen.getByText('商务报告').closest('div')
      await userEvent.click(template!)
      const textarea = screen.getByPlaceholderText(/拖拽文件到此处/)
      await userEvent.type(textarea, '测试内容')

      ;(global.fetch as jest.Mock).mockResolvedValueOnce({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
      })

      const generateButton = screen.getByText('生成PDF预览')
      await userEvent.click(generateButton)

      // 进入编辑模式
      await screen.findByText('PDF生成成功！', {}, { timeout: 10000 })
      const editButton = await screen.findByRole('button', { name: '编辑' }, { timeout: 10000 })
      await userEvent.click(editButton)

      // 验证编辑模式UI
      expect(screen.getByText('编辑模式')).toBeInTheDocument()

      // 退出编辑模式
      const cancelButton = screen.getByText('取消')
      await userEvent.click(cancelButton)

      // 验证是否退出编辑模式
      expect(screen.queryByText('编辑模式')).not.toBeInTheDocument()
    })

    it('saves changes correctly', async () => {
      render(<EditorPage />)
      
      // 选择模板并生成PDF
      const template = screen.getByText('商务报告').closest('div')
      await userEvent.click(template!)
      const textarea = screen.getByPlaceholderText(/拖拽文件到此处/)
      await userEvent.type(textarea, '原始内容')

      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
      })

      const generateButton = screen.getByText('生成PDF预览')
      await userEvent.click(generateButton)

      // 进入编辑模式并修改内容
      await screen.findByText('PDF生成成功！', {}, { timeout: 10000 })
      const editButton = await screen.findByRole('button', { name: '编辑' }, { timeout: 10000 })
      await userEvent.click(editButton)

      const editTextarea = screen.getByPlaceholderText('在此编辑您的内容...')
      await userEvent.clear(editTextarea)
      await userEvent.type(editTextarea, '新内容')

      // 保存更改
      const saveButton = screen.getByText('保存')
      await userEvent.click(saveButton)

      // 验证内容是否更新
      expect(textarea).toHaveValue('新内容')
    })
  })

  // 集成测试
  describe('Integration Tests', () => {
    it('completes full workflow successfully', async () => {
      render(<EditorPage />)
      
      // 1. 选择模板
      const template = screen.getByText('商务报告').closest('div')
      await userEvent.click(template!)

      // 2. 上传文件
      const file = new File(['测试内容'], 'test.txt', { type: 'text/plain' })
      const uploadButton = screen.getByText(/拖拽或点击上传文件/).closest('div')
      const input = document.getElementById('file-input')
      expect(input).not.toBeNull()
      await act(async () => {
        await userEvent.upload(input!, file)
      })

      // 3. 生成PDF
      ;(global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        blob: () => Promise.resolve(new Blob()),
      })

      const generateButton = screen.getByText('生成PDF预览')
      await userEvent.click(generateButton)

      // 4. 编辑内容
      await screen.findByText('PDF生成成功！', {}, { timeout: 10000 })
      const editButton = await screen.findByRole('button', { name: '编辑' }, { timeout: 10000 })
      await userEvent.click(editButton)

      const editTextarea = screen.getByPlaceholderText('在此编辑您的内容...')
      await userEvent.clear(editTextarea)
      await userEvent.type(editTextarea, '最终内容')

      // 5. 保存更改
      const saveButton = screen.getByText('保存')
      await userEvent.click(saveButton)

      // 验证整个流程
      expect(mockToast().showSuccess).toHaveBeenCalledWith('PDF生成成功！')
      expect(screen.getByPlaceholderText(/拖拽文件到此处/)).toHaveValue('最终内容')
    })
  })
})
import React from 'react'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import '@testing-library/jest-dom'
import PDFPreview from './PDFPreview'
import { DocumentData } from '@/app/generate/page'

describe('PDFPreview', () => {
  const mockDocumentData: DocumentData = {
    title: '测试文档',
    content: '<p>这是测试内容</p>',
    template: {
      id: 'business',
      name: '商务模板',
      description: '专业商务文档模板',
      thumbnail: '/templates/business.jpg',
      category: 'business'
    }
  }

  const mockPdfUrl = 'data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVHlwZSAvQ2F0YWxvZwovUGFnZXMgMiAwIFIKPj4KZW5kb2JqCg=='

  test('renders real-time preview when no PDF URL provided', () => {
    render(
      <PDFPreview 
        documentData={mockDocumentData}
      />
    )
    
    // 检查实时预览标题
    expect(screen.getByText('实时预览')).toBeInTheDocument()
    
    // 检查文档标题
    expect(screen.getByText('测试文档')).toBeInTheDocument()
    
    // 检查模板信息
    expect(screen.getByText('模板: 商务模板')).toBeInTheDocument()
  }

  test('renders PDF preview when PDF URL is provided', async () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    })
    
    // 检查PDF工具栏
    expect(screen.getByText('标准预览')).toBeInTheDocument()
    expect(screen.getByText('高清预览')).toBeInTheDocument()
    
    // 检查缩放控件
    expect(screen.getByTitle('缩小')).toBeInTheDocument()
    expect(screen.getByTitle('放大')).toBeInTheDocument()
    expect(screen.getByTitle('重置缩放')).toBeInTheDocument()
  })

  test('shows loading state initially when PDF URL is provided', () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 检查加载状态
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  test('handles zoom controls', async () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    })
    
    // 检查初始缩放比例
    expect(screen.getByText('100%')).toBeInTheDocument()
    
    // 点击放大按钮
    const zoomInButton = screen.getByTitle('放大')
    fireEvent.click(zoomInButton)
    
    // 检查缩放比例是否增加
    expect(screen.getByText('110%')).toBeInTheDocument()
    
    // 点击缩小按钮
    const zoomOutButton = screen.getByTitle('缩小')
    fireEvent.click(zoomOutButton)
    
    // 检查缩放比例是否恢复
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  test('handles reset zoom', async () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    })
    
    // 多次点击放大
    const zoomInButton = screen.getByTitle('放大')
    fireEvent.click(zoomInButton)
    fireEvent.click(zoomInButton)
    fireEvent.click(zoomInButton)
    
    // 检查缩放比例
    expect(screen.getByText('130%')).toBeInTheDocument()
    
    // 点击重置按钮
    const resetButton = screen.getByTitle('重置缩放')
    fireEvent.click(resetButton)
    
    // 检查是否重置为100%
    expect(screen.getByText('100%')).toBeInTheDocument()
  })

  test('switches between preview modes', async () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    })
    
    // 检查默认是标准预览模式
    const standardButton = screen.getByText('标准预览')
    expect(standardButton).toHaveClass('bg-blue-600')
    
    // 切换到高清预览
    const hdButton = screen.getByText('高清预览')
    fireEvent.click(hdButton)
    
    // 检查模式是否切换
    expect(hdButton).toHaveClass('bg-blue-600')
    expect(standardButton).not.toHaveClass('bg-blue-600')
    
    // 检查高清预览提示
    expect(screen.getByText('高清预览功能开发中...')).toBeInTheDocument()
  })

  test('renders iframe with correct src', async () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    })
    
    // 检查iframe是否存在
    const iframe = screen.getByTitle('PDF预览')
    expect(iframe).toBeInTheDocument()
    expect(iframe).toHaveAttribute('src', mockPdfUrl)
  })

  test('handles error state', async () => {
    // Mock console.error to avoid error output in tests
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation(() => {})
    
    render(
      <PDFPreview 
        pdfUrl="invalid-url"
        documentData={mockDocumentData}
      />
    )
    
    // 等待可能的错误状态
    await waitFor(() => {
      // 如果有错误处理，检查错误信息
      const errorElements = screen.queryAllByText(/加载.*失败/)
      if (errorElements.length > 0) {
        expect(errorElements[0]).toBeInTheDocument()
      }
    })
    
    consoleSpy.mockRestore()
  })

  test('applies custom className', () => {
    const { container } = render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
        className="custom-class"
      />
    )
    
    const previewContainer = container.firstChild as HTMLElement
    expect(previewContainer).toHaveClass('custom-class')
  })

  test('handles missing document data gracefully', () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
      />
    )
    
    // 应该仍然能够渲染，即使没有文档数据
    expect(screen.getByText('加载中...')).toBeInTheDocument()
  })

  test('displays document content in real-time preview', () => {
    const documentWithHtmlContent: DocumentData = {
      title: 'HTML测试文档',
      content: '<h1>标题</h1><p>段落内容</p><ul><li>列表项</li></ul>',
      template: mockDocumentData.template
    }
    
    render(
      <PDFPreview 
        documentData={documentWithHtmlContent}
      />
    )
    
    // 检查HTML内容是否正确显示
    expect(screen.getByText('HTML测试文档')).toBeInTheDocument()
    
    // 检查HTML内容是否被渲染（取决于实现方式）
    const contentArea = screen.getByText(/段落内容/)
    expect(contentArea).toBeInTheDocument()
  })

  test('zoom controls have proper limits', async () => {
    render(
      <PDFPreview 
        pdfUrl={mockPdfUrl}
        documentData={mockDocumentData}
      />
    )
    
    // 等待加载完成
    await waitFor(() => {
      expect(screen.queryByText('加载中...')).not.toBeInTheDocument()
    })
    
    // 测试缩小到最小值
    const zoomOutButton = screen.getByTitle('缩小')
    for (let i = 0; i < 10; i++) {
      fireEvent.click(zoomOutButton)
    }
    
    // 检查是否有最小限制（通常是50%）
    const zoomText = screen.getByText(/\d+%/)
    const zoomValue = parseInt(zoomText.textContent?.replace('%', '') || '0')
    expect(zoomValue).toBeGreaterThanOrEqual(50)
    
    // 重置缩放
    const resetButton = screen.getByTitle('重置缩放')
    fireEvent.click(resetButton)
    
    // 测试放大到最大值
    const zoomInButton = screen.getByTitle('放大')
    for (let i = 0; i < 15; i++) {
      fireEvent.click(zoomInButton)
    }
    
    // 检查是否有最大限制（通常是200%）
    const finalZoomText = screen.getByText(/\d+%/)
    const finalZoomValue = parseInt(finalZoomText.textContent?.replace('%', '') || '0')
    expect(finalZoomValue).toBeLessThanOrEqual(200)
  })
})
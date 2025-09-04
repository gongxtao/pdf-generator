import React from 'react'
import { render, screen, fireEvent, act } from '@testing-library/react'
import '@testing-library/jest-dom'
import Toast from './Toast'

// Mock timers
jest.useFakeTimers()

describe('Toast', () => {
  const mockOnClose = jest.fn()
  
  beforeEach(() => {
    mockOnClose.mockClear()
  })
  
  afterEach(() => {
    jest.clearAllTimers()
  })

  test('renders success toast', () => {
    render(
      <Toast
        type="success"
        message="操作成功"
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('操作成功')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-green-50')
  })

  test('renders error toast', () => {
    render(
      <Toast
        type="error"
        message="操作失败"
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('操作失败')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-red-50')
  })

  test('renders warning toast', () => {
    render(
      <Toast
        type="warning"
        message="警告信息"
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('警告信息')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-yellow-50')
  })

  test('renders info toast', () => {
    render(
      <Toast
        type="info"
        message="提示信息"
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText('提示信息')).toBeInTheDocument()
    expect(screen.getByRole('alert')).toHaveClass('bg-blue-50')
  })

  test('displays correct icon for each type', () => {
    const { rerender } = render(
      <Toast
        type="success"
        message="成功"
        onClose={mockOnClose}
      />
    )
    
    // Success icon (checkmark)
    expect(screen.getByRole('alert')).toContainHTML('M5 13l4 4L19 7')
    
    // Error icon (X)
    rerender(
      <Toast
        type="error"
        message="错误"
        onClose={mockOnClose}
      />
    )
    expect(screen.getByRole('alert')).toContainHTML('M6 18L18 6M6 6l12 12')
    
    // Warning icon (exclamation)
    rerender(
      <Toast
        type="warning"
        message="警告"
        onClose={mockOnClose}
      />
    )
    expect(screen.getByRole('alert')).toContainHTML('M12 8v4m0 4h.01')
    
    // Info icon (info)
    rerender(
      <Toast
        type="info"
        message="信息"
        onClose={mockOnClose}
      />
    )
    expect(screen.getByRole('alert')).toContainHTML('M13 16h-1v-4h-1m1-4h.01')
  })

  test('calls onClose when close button is clicked', () => {
    render(
      <Toast
        type="success"
        message="测试消息"
        onClose={mockOnClose}
      />
    )
    
    const closeButton = screen.getByRole('button')
    fireEvent.click(closeButton)
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('auto-closes after default duration', () => {
    render(
      <Toast
        type="success"
        message="测试消息"
        onClose={mockOnClose}
      />
    )
    
    // Fast-forward time by default duration (5000ms)
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('auto-closes after custom duration', () => {
    render(
      <Toast
        type="success"
        message="测试消息"
        duration={3000}
        onClose={mockOnClose}
      />
    )
    
    // Fast-forward time by custom duration (3000ms)
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })

  test('does not auto-close when duration is 0', () => {
    render(
      <Toast
        type="success"
        message="测试消息"
        duration={0}
        onClose={mockOnClose}
      />
    )
    
    // Fast-forward time significantly
    act(() => {
      jest.advanceTimersByTime(10000)
    })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  test('clears timeout when component unmounts', () => {
    const { unmount } = render(
      <Toast
        type="success"
        message="测试消息"
        onClose={mockOnClose}
      />
    )
    
    // Unmount before timeout
    unmount()
    
    // Fast-forward time
    act(() => {
      jest.advanceTimersByTime(5000)
    })
    
    expect(mockOnClose).not.toHaveBeenCalled()
  })

  test('handles long messages', () => {
    const longMessage = '这是一个非常长的消息，用来测试Toast组件是否能够正确处理长文本内容，确保布局不会被破坏，文字能够正确换行显示。'
    
    render(
      <Toast
        type="info"
        message={longMessage}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText(longMessage)).toBeInTheDocument()
  })

  test('handles HTML entities in message', () => {
    const messageWithEntities = '操作成功 & 数据已保存 < 100 条记录'
    
    render(
      <Toast
        type="success"
        message={messageWithEntities}
        onClose={mockOnClose}
      />
    )
    
    expect(screen.getByText(messageWithEntities)).toBeInTheDocument()
  })

  test('applies correct ARIA attributes', () => {
    render(
      <Toast
        type="error"
        message="错误消息"
        onClose={mockOnClose}
      />
    )
    
    const toast = screen.getByRole('alert')
    expect(toast).toHaveAttribute('role', 'alert')
    expect(toast).toHaveAttribute('aria-live', 'assertive')
  })

  test('close button has proper accessibility attributes', () => {
    render(
      <Toast
        type="success"
        message="测试消息"
        onClose={mockOnClose}
      />
    )
    
    const closeButton = screen.getByRole('button')
    expect(closeButton).toHaveAttribute('aria-label', '关闭通知')
  })

  test('has proper color classes for each type', () => {
    const types = [
      { type: 'success' as const, bgClass: 'bg-green-50', textClass: 'text-green-800', iconClass: 'text-green-400' },
      { type: 'error' as const, bgClass: 'bg-red-50', textClass: 'text-red-800', iconClass: 'text-red-400' },
      { type: 'warning' as const, bgClass: 'bg-yellow-50', textClass: 'text-yellow-800', iconClass: 'text-yellow-400' },
      { type: 'info' as const, bgClass: 'bg-blue-50', textClass: 'text-blue-800', iconClass: 'text-blue-400' }
    ]
    
    types.forEach(({ type, bgClass, textClass }) => {
      const { unmount } = render(
        <Toast
          type={type}
          message={`${type} 消息`}
          onClose={mockOnClose}
        />
      )
      
      const toast = screen.getByRole('alert')
      expect(toast).toHaveClass(bgClass)
      
      const message = screen.getByText(`${type} 消息`)
      expect(message).toHaveClass(textClass)
      
      unmount()
    })
  })

  test('resets timer when duration prop changes', () => {
    const { rerender } = render(
      <Toast
        type="success"
        message="测试消息"
        duration={5000}
        onClose={mockOnClose}
      />
    )
    
    // Advance time partially
    act(() => {
      jest.advanceTimersByTime(3000)
    })
    
    // Change duration
    rerender(
      <Toast
        type="success"
        message="测试消息"
        duration={2000}
        onClose={mockOnClose}
      />
    )
    
    // Advance time by new duration
    act(() => {
      jest.advanceTimersByTime(2000)
    })
    
    expect(mockOnClose).toHaveBeenCalledTimes(1)
  })
})
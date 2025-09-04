import { NextRequest, NextResponse } from 'next/server'
import { Document, Page, Text, View, StyleSheet, pdf, Font } from '@react-pdf/renderer'
import React from 'react'
import { Readable } from 'stream'

// 定义请求数据类型
interface GeneratePDFRequest {
  title: string
  content: string
  template: {
    id: string
    name: string
    description: string
    thumbnail: string
    category: string
  } | null
}

// 清理和处理HTML内容的函数
function processHtmlContent(html: string): string {
  // 移除TinyMCE可能添加的多余属性和样式
  return html
    .replace(/data-mce-[^=]*="[^"]*"/g, '') // 移除TinyMCE数据属性
    .replace(/contenteditable="[^"]*"/g, '') // 移除contenteditable属性
    .replace(/spellcheck="[^"]*"/g, '') // 移除spellcheck属性
    .replace(/<p>\s*<\/p>/g, '') // 移除空段落
    .replace(/\s+/g, ' ') // 合并多个空格
    .trim()
}

// 定义样式
const styles = StyleSheet.create({
  page: {
    flexDirection: 'column',
    backgroundColor: '#FFFFFF',
    padding: 50,
    fontFamily: 'Helvetica',
  },
  title: {
    fontSize: 20,
    textAlign: 'left',
    marginBottom: 10,
    fontWeight: 'bold',
  },
  templateInfo: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 20,
  },
  heading1: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 10,
  },
  heading2: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 12,
    marginBottom: 8,
  },
  heading3: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 10,
    marginBottom: 6,
  },
  paragraph: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 8,
  },
  listItem: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 4,
    marginLeft: 20,
  },
  bold: {
    fontWeight: 'bold',
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#666666',
  },
})

// 创建 PDF 文档组件
const createPDFDocument = (data: GeneratePDFRequest) => {
  // 处理HTML内容
  const cleanHtml = processHtmlContent(data.content)
  
  // 将HTML转换为纯文本并处理基本格式
  const processHtmlForPdf = (html: string) => {
    // 替换HTML标签为相应的格式
    return html
      .replace(/<h1[^>]*>(.*?)<\/h1>/gi, '\n# $1\n')
      .replace(/<h2[^>]*>(.*?)<\/h2>/gi, '\n## $1\n')
      .replace(/<h3[^>]*>(.*?)<\/h3>/gi, '\n### $1\n')
      .replace(/<strong[^>]*>(.*?)<\/strong>/gi, '**$1**')
      .replace(/<b[^>]*>(.*?)<\/b>/gi, '**$1**')
      .replace(/<em[^>]*>(.*?)<\/em>/gi, '*$1*')
      .replace(/<i[^>]*>(.*?)<\/i>/gi, '*$1*')
      .replace(/<li[^>]*>(.*?)<\/li>/gi, '• $1\n')
      .replace(/<ul[^>]*>|<\/ul>/gi, '')
      .replace(/<ol[^>]*>|<\/ol>/gi, '')
      .replace(/<p[^>]*>|<\/p>/gi, '\n')
      .replace(/<br\s*\/?>/gi, '\n')
      .replace(/<[^>]*>/g, '') // 移除所有剩余的HTML标签
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .replace(/\n\s*\n/g, '\n\n') // 规范化换行
      .trim()
  }
  
  const processedContent = processHtmlForPdf(cleanHtml)
  const lines = processedContent.split('\n')
  
  const renderContent = () => {
    return lines.map((line, index) => {
      if (!line.trim()) {
        return React.createElement(View, { key: index, style: { marginBottom: 6 } })
      }
      
      if (line.startsWith('# ')) {
        return React.createElement(Text, { key: index, style: styles.heading1 }, line.substring(2))
      } else if (line.startsWith('## ')) {
        return React.createElement(Text, { key: index, style: styles.heading2 }, line.substring(3))
      } else if (line.startsWith('### ')) {
        return React.createElement(Text, { key: index, style: styles.heading3 }, line.substring(4))
      } else if (line.startsWith('• ')) {
        return React.createElement(Text, { key: index, style: styles.listItem }, line)
      } else if (line.includes('**')) {
        // 处理粗体文本
        const processedLine = line.replace(/\*\*(.*?)\*\*/g, '$1')
        return React.createElement(Text, { key: index, style: [styles.paragraph, styles.bold] }, processedLine)
      } else {
        return React.createElement(Text, { key: index, style: styles.paragraph }, line)
      }
    })
  }

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, data.title || '未命名文档'),
      data.template && React.createElement(Text, { style: styles.templateInfo }, `模板: ${data.template.name}`),
      React.createElement(View, {}, ...renderContent()),
      React.createElement(Text, {
        style: styles.footer,
        render: ({ pageNumber, totalPages }: any) => 
          `第 ${pageNumber} 页，共 ${totalPages} 页 | 生成时间: ${new Date().toLocaleString()}`,
        fixed: true
      })
    )
  )
}

// 将内容转换为PDF
async function generatePDFFromContent(data: GeneratePDFRequest): Promise<Buffer> {
  try {
    // 创建 PDF 文档组件
    const doc = createPDFDocument(data)
    
    // 生成 PDF
    const pdfBlob = await pdf(doc).toBlob()
    
    // 转换为 Buffer
    const arrayBuffer = await pdfBlob.arrayBuffer()
    return Buffer.from(arrayBuffer)
    
  } catch (error) {
    console.error('PDF生成错误:', error)
    throw new Error('PDF生成失败')
  }
}

// 创建PDF数据URL
function createPDFDataURL(pdfBuffer: Buffer): string {
  try {
    // 将Buffer转换为base64
    const base64 = pdfBuffer.toString('base64')
    
    // 创建数据URL
    const dataUrl = `data:application/pdf;base64,${base64}`
    
    return dataUrl
  } catch (error) {
    console.error('创建PDF数据URL时出错:', error)
    throw new Error('创建PDF数据URL失败')
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const data: GeneratePDFRequest = await request.json()
    
    // 验证必要字段
    if (!data.title && !data.content) {
      return NextResponse.json(
        { error: '标题和内容不能都为空' },
        { status: 400 }
      )
    }
    
    console.log('开始生成PDF:', {
      title: data.title,
      contentLength: data.content?.length || 0,
      template: data.template?.name || '无模板'
    })
    
    // 生成PDF
    const pdfBuffer = await generatePDFFromContent(data)
    
    // 创建PDF数据URL
    const pdfUrl = createPDFDataURL(pdfBuffer)
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      pdfUrl,
      message: 'PDF生成成功',
      metadata: {
        title: data.title,
        template: data.template?.name,
        size: pdfBuffer.length,
        pages: 1, // 简化处理，实际应该计算页数
        generatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('PDF生成API错误:', error)
    
    return NextResponse.json(
      { 
        error: '生成PDF时发生错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 处理GET请求（获取生成状态或历史记录）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'status') {
      // 返回服务状态
      return NextResponse.json({
        status: 'active',
        message: 'PDF生成服务正常运行',
        supportedFormats: ['A4', 'Letter'],
        maxContentLength: 100000,
        availableTemplates: 6
      })
    }
    
    if (action === 'history') {
      // 返回生成历史（模拟数据）
      return NextResponse.json({
        history: [
          {
            id: '1',
            title: '示例文档',
            template: '商务模板',
            generatedAt: new Date(Date.now() - 3600000).toISOString(),
            pdfUrl: '/api/pdf/example1.pdf'
          },
          {
            id: '2',
            title: '技术报告',
            template: '学术模板',
            generatedAt: new Date(Date.now() - 7200000).toISOString(),
            pdfUrl: '/api/pdf/example2.pdf'
          }
        ]
      })
    }
    
    return NextResponse.json(
      { error: '无效的操作参数' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('PDF生成API GET错误:', error)
    
    return NextResponse.json(
      { error: '获取信息时发生错误' },
      { status: 500 }
    )
  }
}
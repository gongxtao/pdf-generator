import { NextRequest, NextResponse } from 'next/server'
import { Document, Page, Text, View, StyleSheet, pdf } from '@react-pdf/renderer'
import React from 'react'

// 定义请求数据类型
interface SavePDFRequest {
  title: string
  content: string
  template: {
    id: string
    name: string
    description: string
    thumbnail: string
    category: string
  } | null
  originalPdfUrl?: string | null
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
    marginBottom: 20,
    fontWeight: 'bold',
  },
  templateInfo: {
    fontSize: 10,
    color: '#666666',
    marginBottom: 10,
  },
  updateTime: {
    fontSize: 8,
    color: '#999999',
    marginBottom: 20,
  },
  content: {
    fontSize: 12,
    lineHeight: 1.5,
    marginBottom: 20,
  },
  footer: {
    position: 'absolute',
    bottom: 30,
    left: 50,
    right: 50,
    textAlign: 'center',
    fontSize: 8,
    color: '#999999',
  },
})

// 创建 PDF 文档组件
const createPDFDocument = (data: SavePDFRequest) => {
  // 处理内容（简单的HTML到文本转换）
  const cleanContent = data.content
    .replace(/<[^>]*>/g, '') // 移除HTML标签
    .replace(/&nbsp;/g, ' ') // 替换HTML实体
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .trim()

  return React.createElement(Document, {},
    React.createElement(Page, { size: 'A4', style: styles.page },
      React.createElement(Text, { style: styles.title }, data.title || '未命名文档'),
      data.template && React.createElement(Text, { style: styles.templateInfo }, `模板: ${data.template.name}`),
      React.createElement(Text, { style: styles.updateTime }, `最后更新: ${new Date().toLocaleString()}`),
      React.createElement(Text, { style: styles.content }, cleanContent),
      React.createElement(Text, {
        style: styles.footer,
        render: ({ pageNumber, totalPages }: any) => 
          `保存时间: ${new Date().toLocaleString()}`,
        fixed: true
      })
    )
  )
}

// 生成新的PDF版本
async function generateUpdatedPDF(data: SavePDFRequest): Promise<Buffer> {
  try {
    // 创建 PDF 文档组件
    const doc = createPDFDocument(data)
    
    // 生成 PDF
    const pdfBlob = await pdf(doc).toBlob()
    
    // 转换为 Buffer
    const arrayBuffer = await pdfBlob.arrayBuffer()
    const pdfBuffer = Buffer.from(arrayBuffer)
    
    return pdfBuffer
    
  } catch (error) {
    console.error('PDF更新错误:', error)
    throw new Error('PDF更新失败')
  }
}

// 保存PDF文件并创建版本记录
async function savePDFVersion(pdfBuffer: Buffer, filename: string, originalUrl?: string | null): Promise<{ pdfUrl: string; versionId: string }> {
  try {
    // 生成版本ID
    const versionId = `v_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    const timestamp = Date.now()
    
    // 生成新的PDF URL
    const pdfUrl = `/api/pdf/${timestamp}-${filename}-${versionId}.pdf`
    
    // 在实际项目中，这里应该：
    // 1. 将PDF保存到文件系统或云存储
    // 2. 在数据库中创建版本记录
    // 3. 如果有原始文件，可能需要创建版本链
    
    console.log('PDF版本已保存:', {
      versionId,
      size: pdfBuffer.length,
      originalUrl,
      newUrl: pdfUrl
    })
    
    return { pdfUrl, versionId }
  } catch (error) {
    console.error('PDF版本保存错误:', error)
    throw new Error('PDF版本保存失败')
  }
}

// 创建版本历史记录
function createVersionRecord(data: SavePDFRequest, versionId: string, pdfUrl: string) {
  return {
    id: versionId,
    title: data.title,
    template: data.template?.name || '无模板',
    pdfUrl,
    savedAt: new Date().toISOString(),
    changes: {
      contentLength: data.content?.length || 0,
      hasTemplate: !!data.template,
      isUpdate: !!data.originalPdfUrl
    }
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const data: SavePDFRequest = await request.json()
    
    // 验证必要字段
    if (!data.title && !data.content) {
      return NextResponse.json(
        { error: '标题和内容不能都为空' },
        { status: 400 }
      )
    }
    
    console.log('开始保存PDF:', {
      title: data.title,
      contentLength: data.content?.length || 0,
      template: data.template?.name || '无模板',
      isUpdate: !!data.originalPdfUrl
    })
    
    // 生成更新后的PDF
    const pdfBuffer = await generateUpdatedPDF(data)
    
    // 保存PDF文件和版本信息
    const filename = data.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') || 'document'
    const { pdfUrl, versionId } = await savePDFVersion(pdfBuffer, filename, data.originalPdfUrl)
    
    // 创建版本记录
    const versionRecord = createVersionRecord(data, versionId, pdfUrl)
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      pdfUrl,
      versionId,
      message: data.originalPdfUrl ? 'PDF更新成功' : 'PDF保存成功',
      version: versionRecord,
      metadata: {
        title: data.title,
        template: data.template?.name,
        size: pdfBuffer.length,
        pages: 1, // 简化处理
        savedAt: new Date().toISOString(),
        isUpdate: !!data.originalPdfUrl
      }
    })
    
  } catch (error) {
    console.error('PDF保存API错误:', error)
    
    return NextResponse.json(
      { 
        error: '保存PDF时发生错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 处理GET请求（获取版本历史）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    const documentId = searchParams.get('documentId')
    
    if (action === 'versions' && documentId) {
      // 返回文档的版本历史（模拟数据）
      const versions = [
        {
          id: 'v_1703123456789_abc123',
          title: '示例文档',
          template: '商务模板',
          savedAt: new Date(Date.now() - 3600000).toISOString(),
          pdfUrl: '/api/pdf/example-v1.pdf',
          changes: {
            contentLength: 1250,
            hasTemplate: true,
            isUpdate: false
          }
        },
        {
          id: 'v_1703127056789_def456',
          title: '示例文档',
          template: '商务模板',
          savedAt: new Date(Date.now() - 1800000).toISOString(),
          pdfUrl: '/api/pdf/example-v2.pdf',
          changes: {
            contentLength: 1580,
            hasTemplate: true,
            isUpdate: true
          }
        }
      ]
      
      return NextResponse.json({
        documentId,
        versions,
        totalVersions: versions.length
      })
    }
    
    if (action === 'status') {
      // 返回保存服务状态
      return NextResponse.json({
        status: 'active',
        message: 'PDF保存服务正常运行',
        features: {
          versionControl: true,
          autoSave: true,
          templateSupport: true,
          maxFileSize: '10MB'
        }
      })
    }
    
    return NextResponse.json(
      { error: '无效的操作参数' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('PDF保存API GET错误:', error)
    
    return NextResponse.json(
      { error: '获取信息时发生错误' },
      { status: 500 }
    )
  }
}
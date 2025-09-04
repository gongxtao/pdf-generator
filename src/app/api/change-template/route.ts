import { NextRequest, NextResponse } from 'next/server'
import jsPDF from 'jspdf'

// 定义请求数据类型
interface ChangeTemplateRequest {
  title: string
  content: string
  newTemplate: {
    id: string
    name: string
    description: string
    thumbnail: string
    category: string
  }
  originalPdfUrl?: string | null
}

// 根据模板类型应用不同的样式
function applyTemplateStyles(pdf: jsPDF, template: ChangeTemplateRequest['newTemplate']) {
  switch (template.category) {
    case 'business':
      // 商务模板：正式、简洁
      return {
        titleColor: [0, 51, 102], // 深蓝色
        titleSize: 22,
        headerColor: [51, 51, 51], // 深灰色
        headerSize: 16,
        bodyColor: [0, 0, 0], // 黑色
        bodySize: 12,
        accentColor: [0, 102, 204] // 蓝色
      }
    
    case 'academic':
      // 学术模板：传统、严谨
      return {
        titleColor: [0, 0, 0], // 黑色
        titleSize: 20,
        headerColor: [51, 51, 51], // 深灰色
        headerSize: 14,
        bodyColor: [0, 0, 0], // 黑色
        bodySize: 11,
        accentColor: [102, 102, 102] // 灰色
      }
    
    case 'creative':
      // 创意模板：活泼、多彩
      return {
        titleColor: [255, 102, 0], // 橙色
        titleSize: 24,
        headerColor: [204, 51, 153], // 紫红色
        headerSize: 18,
        bodyColor: [51, 51, 51], // 深灰色
        bodySize: 12,
        accentColor: [0, 204, 102] // 绿色
      }
    
    case 'technical':
      // 技术模板：现代、清晰
      return {
        titleColor: [0, 153, 76], // 绿色
        titleSize: 20,
        headerColor: [0, 102, 51], // 深绿色
        headerSize: 15,
        bodyColor: [51, 51, 51], // 深灰色
        bodySize: 11,
        accentColor: [0, 204, 102] // 亮绿色
      }
    
    case 'marketing':
      // 营销模板：醒目、吸引人
      return {
        titleColor: [255, 51, 51], // 红色
        titleSize: 26,
        headerColor: [255, 102, 0], // 橙色
        headerSize: 18,
        bodyColor: [51, 51, 51], // 深灰色
        bodySize: 12,
        accentColor: [255, 204, 0] // 黄色
      }
    
    case 'resume':
      // 简历模板：专业、简洁
      return {
        titleColor: [51, 102, 153], // 蓝灰色
        titleSize: 18,
        headerColor: [102, 102, 102], // 灰色
        headerSize: 14,
        bodyColor: [0, 0, 0], // 黑色
        bodySize: 11,
        accentColor: [51, 102, 153] // 蓝灰色
      }
    
    default:
      // 默认样式
      return {
        titleColor: [0, 0, 0], // 黑色
        titleSize: 20,
        headerColor: [51, 51, 51], // 深灰色
        headerSize: 16,
        bodyColor: [0, 0, 0], // 黑色
        bodySize: 12,
        accentColor: [0, 102, 204] // 蓝色
      }
  }
}

// 使用新模板生成PDF
async function generatePDFWithNewTemplate(data: ChangeTemplateRequest): Promise<Buffer> {
  try {
    // 创建一个新的PDF文档
    const pdf = new jsPDF({
      orientation: 'portrait',
      unit: 'mm',
      format: 'a4'
    })

    // 获取模板样式
    const styles = applyTemplateStyles(pdf, data.newTemplate)
    
    // 设置字体
    pdf.setFont('helvetica')
    
    // 添加模板装饰（根据模板类型）
    if (data.newTemplate.category === 'business') {
      // 商务模板：添加顶部蓝色条
      pdf.setFillColor(0, 51, 102)
      pdf.rect(0, 0, 210, 10, 'F')
    } else if (data.newTemplate.category === 'creative') {
      // 创意模板：添加彩色边框
      pdf.setDrawColor(255, 102, 0)
      pdf.setLineWidth(2)
      pdf.rect(10, 10, 190, 277)
    } else if (data.newTemplate.category === 'technical') {
      // 技术模板：添加左侧绿色条
      pdf.setFillColor(0, 153, 76)
      pdf.rect(0, 0, 5, 297, 'F')
    }
    
    // 添加标题
    pdf.setFontSize(styles.titleSize)
    pdf.setTextColor(styles.titleColor[0], styles.titleColor[1], styles.titleColor[2])
    pdf.text(data.title || '未命名文档', 20, 30)
    
    // 添加模板信息
    pdf.setFontSize(10)
    pdf.setTextColor(styles.accentColor[0], styles.accentColor[1], styles.accentColor[2])
    pdf.text(`模板: ${data.newTemplate.name} (${data.newTemplate.category})`, 20, 40)
    
    // 添加更换时间标记
    pdf.setFontSize(8)
    pdf.setTextColor(150, 150, 150)
    pdf.text(`模板更换时间: ${new Date().toLocaleString()}`, 20, 50)
    
    // 处理内容（简单的HTML到文本转换）
    const cleanContent = data.content
      .replace(/<[^>]*>/g, '') // 移除HTML标签
      .replace(/&nbsp;/g, ' ') // 替换HTML实体
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
    
    // 添加内容（分行处理）
    pdf.setFontSize(styles.bodySize)
    pdf.setTextColor(styles.bodyColor[0], styles.bodyColor[1], styles.bodyColor[2])
    
    const lines = pdf.splitTextToSize(cleanContent, 170) // 170mm是页面宽度减去边距
    
    let yPosition = 65
    const lineHeight = styles.bodySize * 0.6 + 2 // 根据字体大小调整行高
    const pageHeight = 280 // A4页面高度减去边距
    
    for (let i = 0; i < lines.length; i++) {
      if (yPosition > pageHeight) {
        pdf.addPage()
        
        // 在新页面上重复模板装饰
        if (data.newTemplate.category === 'business') {
          pdf.setFillColor(0, 51, 102)
          pdf.rect(0, 0, 210, 10, 'F')
        } else if (data.newTemplate.category === 'creative') {
          pdf.setDrawColor(255, 102, 0)
          pdf.setLineWidth(2)
          pdf.rect(10, 10, 190, 277)
        } else if (data.newTemplate.category === 'technical') {
          pdf.setFillColor(0, 153, 76)
          pdf.rect(0, 0, 5, 297, 'F')
        }
        
        yPosition = 30
        pdf.setFontSize(styles.bodySize)
        pdf.setTextColor(styles.bodyColor[0], styles.bodyColor[1], styles.bodyColor[2])
      }
      
      pdf.text(lines[i], 20, yPosition)
      yPosition += lineHeight
    }
    
    // 添加页脚
    const pageCount = pdf.getNumberOfPages()
    for (let i = 1; i <= pageCount; i++) {
      pdf.setPage(i)
      pdf.setFontSize(8)
      pdf.setTextColor(150, 150, 150)
      pdf.text(`第 ${i} 页，共 ${pageCount} 页`, 20, 290)
      pdf.text(`${data.newTemplate.name} 模板`, 100, 290)
      pdf.text(`更换时间: ${new Date().toLocaleString()}`, 150, 290)
    }
    
    // 返回PDF缓冲区
    const pdfBuffer = Buffer.from(pdf.output('arraybuffer'))
    return pdfBuffer
    
  } catch (error) {
    console.error('模板更换PDF生成错误:', error)
    throw new Error('模板更换PDF生成失败')
  }
}

// 保存更换模板后的PDF
async function saveTemplateChangedPDF(pdfBuffer: Buffer, filename: string, template: ChangeTemplateRequest['newTemplate']): Promise<string> {
  try {
    const timestamp = Date.now()
    const templateId = template.id.replace('template-', '')
    
    // 生成新的PDF URL（包含模板信息）
    const pdfUrl = `/api/pdf/${timestamp}-${filename}-template-${templateId}.pdf`
    
    // 在实际项目中，这里应该：
    // 1. 将PDF保存到文件系统或云存储
    // 2. 在数据库中记录模板更换历史
    // 3. 可能需要删除或归档旧版本
    
    console.log('模板更换PDF已保存:', {
      template: template.name,
      category: template.category,
      size: pdfBuffer.length,
      url: pdfUrl
    })
    
    return pdfUrl
  } catch (error) {
    console.error('模板更换PDF保存错误:', error)
    throw new Error('模板更换PDF保存失败')
  }
}

export async function POST(request: NextRequest) {
  try {
    // 解析请求数据
    const data: ChangeTemplateRequest = await request.json()
    
    // 验证必要字段
    if (!data.title && !data.content) {
      return NextResponse.json(
        { error: '标题和内容不能都为空' },
        { status: 400 }
      )
    }
    
    if (!data.newTemplate || !data.newTemplate.id) {
      return NextResponse.json(
        { error: '必须指定新模板' },
        { status: 400 }
      )
    }
    
    console.log('开始更换模板:', {
      title: data.title,
      contentLength: data.content?.length || 0,
      oldPdf: data.originalPdfUrl,
      newTemplate: data.newTemplate.name,
      category: data.newTemplate.category
    })
    
    // 使用新模板生成PDF
    const pdfBuffer = await generatePDFWithNewTemplate(data)
    
    // 保存更换模板后的PDF
    const filename = data.title.replace(/[^a-zA-Z0-9\u4e00-\u9fa5]/g, '_') || 'document'
    const pdfUrl = await saveTemplateChangedPDF(pdfBuffer, filename, data.newTemplate)
    
    // 返回成功响应
    return NextResponse.json({
      success: true,
      pdfUrl,
      message: `模板已更换为 ${data.newTemplate.name}`,
      templateChange: {
        from: data.originalPdfUrl ? '原模板' : '无模板',
        to: data.newTemplate.name,
        category: data.newTemplate.category,
        changedAt: new Date().toISOString()
      },
      metadata: {
        title: data.title,
        template: data.newTemplate.name,
        templateCategory: data.newTemplate.category,
        size: pdfBuffer.length,
        pages: 1, // 简化处理
        generatedAt: new Date().toISOString()
      }
    })
    
  } catch (error) {
    console.error('模板更换API错误:', error)
    
    return NextResponse.json(
      { 
        error: '更换模板时发生错误',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    )
  }
}

// 处理GET请求（获取可用模板或模板更换历史）
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const action = searchParams.get('action')
    
    if (action === 'templates') {
      // 返回可用模板列表
      const templates = [
        {
          id: 'template-1',
          name: '商务模板',
          description: '适合商务文档、报告和提案的专业模板',
          category: 'business',
          features: ['正式风格', '深蓝色主题', '简洁布局'],
          preview: '/templates/business-preview.jpg'
        },
        {
          id: 'template-2',
          name: '学术模板',
          description: '适合学术论文、研究报告的正式模板',
          category: 'academic',
          features: ['传统风格', '黑白主题', '严谨布局'],
          preview: '/templates/academic-preview.jpg'
        },
        {
          id: 'template-3',
          name: '简历模板',
          description: '现代简洁的个人简历模板',
          category: 'resume',
          features: ['专业风格', '蓝灰色主题', '紧凑布局'],
          preview: '/templates/resume-preview.jpg'
        },
        {
          id: 'template-4',
          name: '创意模板',
          description: '色彩丰富的创意设计模板',
          category: 'creative',
          features: ['活泼风格', '多彩主题', '创新布局'],
          preview: '/templates/creative-preview.jpg'
        },
        {
          id: 'template-5',
          name: '技术文档模板',
          description: '适合技术文档和API文档的模板',
          category: 'technical',
          features: ['现代风格', '绿色主题', '清晰布局'],
          preview: '/templates/technical-preview.jpg'
        },
        {
          id: 'template-6',
          name: '营销模板',
          description: '适合营销材料和宣传册的模板',
          category: 'marketing',
          features: ['醒目风格', '红橙色主题', '吸引布局'],
          preview: '/templates/marketing-preview.jpg'
        }
      ]
      
      return NextResponse.json({
        templates,
        totalCount: templates.length,
        categories: ['business', 'academic', 'resume', 'creative', 'technical', 'marketing']
      })
    }
    
    if (action === 'history') {
      // 返回模板更换历史（模拟数据）
      const history = [
        {
          id: '1',
          documentTitle: '项目报告',
          fromTemplate: '学术模板',
          toTemplate: '商务模板',
          changedAt: new Date(Date.now() - 3600000).toISOString(),
          pdfUrl: '/api/pdf/project-report-business.pdf'
        },
        {
          id: '2',
          documentTitle: '产品介绍',
          fromTemplate: '商务模板',
          toTemplate: '营销模板',
          changedAt: new Date(Date.now() - 7200000).toISOString(),
          pdfUrl: '/api/pdf/product-intro-marketing.pdf'
        }
      ]
      
      return NextResponse.json({
        history,
        totalChanges: history.length
      })
    }
    
    return NextResponse.json(
      { error: '无效的操作参数' },
      { status: 400 }
    )
    
  } catch (error) {
    console.error('模板更换API GET错误:', error)
    
    return NextResponse.json(
      { error: '获取信息时发生错误' },
      { status: 500 }
    )
  }
}
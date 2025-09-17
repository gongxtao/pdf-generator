import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import mammoth from 'mammoth'
import { z } from 'zod'
import { CSSExtractor } from '@/lib/css-extractor'
import { DocxParser, DocumentStructure } from '@/lib/docx-parser'
import { HtmlGenerator } from '@/lib/html-generator'

// 定义响应接口
interface ParseResponse {
  success: boolean
  data?: {
    html: string
    css: string
    images?: Array<{
      name: string
      data: string // base64
      type: string
    }>
    metadata?: {
      title?: string
      author?: string
      wordCount?: number
      pageCount?: number
    }
  }
  message?: string
  error?: string
  code?: string
  details?: any
  meta?: {
    fileName: string
    fileSize: number
    processedAt: string
    htmlLength: number
    cssLength: number
  }
}

// Word文档解析函数 - 使用新的深度解析器
async function parseWordDocumentAdvanced(buffer: Buffer): Promise<ParseResponse['data']> {
  try {
    // 使用新的docx解析器
    const parser = new DocxParser();
    await parser.loadFromBuffer(buffer);
    
    // 获取解析结果
    const wordState = await parser.parseDocx();
    
    // 构建 DocumentStructure
    const documentStructure: DocumentStructure = {
      elements: wordState.elements,
      pageSettings: wordState.page,
      styles: wordState.styles,
      headers: wordState.headers || [],
      footers: wordState.footers || [],
      backgrounds: wordState.backgrounds || [],
      images: wordState.images,
      metadata: {
        title: wordState.metadata?.title,
        author: wordState.metadata?.author,
        created: wordState.metadata?.created,
        modified: wordState.metadata?.modified,
        pageCount: wordState.metadata?.pageCount,
        wordCount: wordState.metadata?.wordCount
      }
    };
    
    // 使用HTML生成器
    const htmlGenerator = new HtmlGenerator(documentStructure);
    const html = htmlGenerator.generateHtml();
    
    // 提取元数据
    const wordCount = documentStructure.elements
      .filter(el => el.type === 'paragraph')
      .reduce((count, el) => count + el.content.split(/\s+/).length, 0);
    
    const hasImages = documentStructure.elements.some(el => el.type === 'image');
    const hasTables = documentStructure.elements.some(el => el.type === 'table');
    const hasHeaders = documentStructure.headers.length > 0;
    const hasFooters = documentStructure.footers.length > 0;
    const hasBackgrounds = documentStructure.backgrounds.length > 0;
    
    // 估算页数
    const pageCount = Math.max(1, Math.ceil(wordCount / 500));

    return {
      html: html.trim(),
      css: '', // CSS已包含在HTML中
      images: [],
      metadata: {
        title: '解析的Word文档',
        author: '未知作者',
        wordCount: wordCount,
        pageCount: pageCount
      }
    };
  } catch (error) {
    console.error('高级Word文档解析失败:', error);
    // 回退到基础解析
    return parseWordDocument(buffer);
  }
}

// Word文档解析函数 - 基础版本（作为回退）
async function parseWordDocument(buffer: Buffer): Promise<ParseResponse['data']> {
  try {
    // 配置 mammoth.js 增强样式还原
    const options = {
      // 增强样式映射，保持更多Word原始格式
      styleMap: [
        // 段落样式映射
        "p[style-name='Heading 1'] => h1:fresh",
        "p[style-name='Heading 2'] => h2:fresh", 
        "p[style-name='Heading 3'] => h3:fresh",
        "p[style-name='Heading 4'] => h4:fresh",
        "p[style-name='Heading 5'] => h5:fresh",
        "p[style-name='Heading 6'] => h6:fresh",
        "p[style-name='Title'] => h1.title:fresh",
        "p[style-name='Subtitle'] => h2.subtitle:fresh",
        "p[style-name='Quote'] => blockquote:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense:fresh",
        "p[style-name='List Paragraph'] => p.list-paragraph:fresh",
        "p[style-name='Caption'] => p.caption:fresh",
        
        // 字符样式映射
        "r[style-name='Strong'] => strong:fresh",
        "r[style-name='Emphasis'] => em:fresh",
        "r[style-name='Intense Emphasis'] => strong.intense:fresh",
        "r[style-name='Subtle Emphasis'] => em.subtle:fresh",
        "r[style-name='Book Title'] => cite:fresh",
        "r[style-name='Hyperlink'] => a.hyperlink:fresh",
        
        // 表格样式映射
        "table[style-name='Table Grid'] => table.grid:fresh",
        "table[style-name='Light Shading'] => table.light-shading:fresh",
        "table[style-name='Medium Shading 1'] => table.medium-shading:fresh",
        "table[style-name='Dark List'] => table.dark-list:fresh"
      ],
      // 包含默认样式映射以获得更好的格式支持
      includeDefaultStyleMap: true,
      // 转换图片为base64，并保持原始尺寸
      convertImage: mammoth.images.imgElement(function(image) {
        return image.readAsBase64String().then(function(imageBuffer) {
          return {
            src: "data:" + image.contentType + ";base64," + imageBuffer,
            // 保持图片原始属性
            style: "max-width: 100%; height: auto; display: block; margin: 10px auto;"
          };
        });
      }),
      // 保留更多文档结构信息
      transformDocument: mammoth.transforms.paragraph(function(element) {
        // 保留段落的对齐方式
        if (element.alignment) {
          return {
            ...element,
            styleName: element.styleName || 'Normal',
            alignment: element.alignment
          };
        }
        return element;
      })
    };
    
    // 使用配置的选项解析 Word 文档
    const result = await mammoth.convertToHtml({ buffer }, options)
    
    // 提取HTML内容
    const htmlContent = result.value
    
    // 输出转换消息以便调试
    if (result.messages && result.messages.length > 0) {
      console.log('Mammoth conversion messages:', result.messages);
    }
    
    // 使用CSS提取器生成完整的HTML文档
    const cssExtractor = new CSSExtractor(htmlContent)
    const fullHtml = cssExtractor.generateFullHTML('解析的Word文档')
    const extractedCss = cssExtractor.generateCSS()
    
    // PDF生成功能已移除
    
    // 统计文档信息
    const wordCount = htmlContent.replace(/<[^>]*>/g, '').split(/\s+/).filter(word => word.length > 0).length
    const pageCount = Math.ceil(wordCount / 250) // 假设每页250字
    
    return {
      html: fullHtml.trim(),
      css: extractedCss.trim(),
      images: [],
      metadata: {
        title: '解析的Word文档',
        author: '未知作者',
        wordCount: wordCount,
        pageCount: pageCount
      }
    }
    
  } catch (error) {
    console.error('Word文档解析失败:', error)
    throw new Error('Word文档解析失败: ' + (error instanceof Error ? error.message : '未知错误'))
  }
}

// 增强的文件验证函数
function validateFileEnhanced(file: File): {
  isValid: boolean
  error?: string
  code?: string
  details?: any
} {
  // 检查文件类型
  const allowedTypes = ['.docx', '.doc']
  const isValidType = allowedTypes.some(type => 
    file.name.toLowerCase().endsWith(type)
  )
  
  if (!isValidType) {
    return {
      isValid: false,
      error: '不支持的文件格式，请上传 Word 文档 (.doc 或 .docx)',
      code: 'INVALID_FILE_TYPE',
      details: { supportedTypes: allowedTypes }
    }
  }
  
  // 检查文件大小 (最大 10MB)
  const maxSize = 10 * 1024 * 1024
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `文件大小不能超过 ${Math.round(maxSize / 1024 / 1024)}MB，当前文件大小: ${Math.round(file.size / 1024 / 1024 * 100) / 100}MB`,
      code: 'FILE_TOO_LARGE',
      details: { maxSize, currentSize: file.size }
    }
  }
  
  // 检查文件是否为空
  if (file.size === 0) {
    return {
      isValid: false,
      error: '文件内容为空，请检查文件是否损坏',
      code: 'EMPTY_FILE'
    }
  }
  
  // 验证文件名长度
  if (file.name.length > 255) {
    return {
      isValid: false,
      error: '文件名过长，请重命名后重试',
      code: 'FILENAME_TOO_LONG'
    }
  }
  
  // 检查文件名是否包含特殊字符
  const invalidChars = /[<>:"/\|?*]/
  if (invalidChars.test(file.name)) {
    return {
      isValid: false,
      error: '文件名包含无效字符，请重命名后重试',
      code: 'INVALID_FILENAME'
    }
  }
  
  return { isValid: true }
}

// 验证文件类型
function validateFile(file: File): string | null {
  // 检查文件扩展名
  if (!file.name.toLowerCase().endsWith('.docx')) {
    return '只支持 .docx 格式文件'
  }
  
  // 检查文件大小 (1MB)
  const maxSize = 1024 * 1024
  if (file.size > maxSize) {
    return '文件大小不能超过 1MB'
  }
  
  // 检查MIME类型
  const validMimeTypes = [
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/octet-stream' // 某些浏览器可能返回这个
  ]
  
  if (!validMimeTypes.includes(file.type) && file.type !== '') {
    return '文件类型不正确，请选择 .docx 文件'
  }
  
  return null
}

// POST 请求处理器
export async function POST(request: NextRequest): Promise<NextResponse<ParseResponse>> {
  try {
    const contentType = request.headers.get('content-type') || ''
    
    // 处理JSON格式的HTML内容
    if (contentType.includes('application/json')) {
      const body = await request.json()
      const { content } = body
      
      if (!content || typeof content !== 'string') {
        return NextResponse.json({
          success: false,
          error: 'HTML内容不能为空',
          code: 'NO_CONTENT'
        }, { status: 400 })
      }
      
      try {
        // 直接处理HTML内容
        const cssExtractor = new CSSExtractor(content)
        const css = cssExtractor.generateCSS()
        const stats = cssExtractor.getDocumentStats()
        
        return NextResponse.json({
          success: true,
          data: {
            html: content,
            css: css,
            metadata: {
              wordCount: stats.wordCount,
              pageCount: Math.ceil(stats.wordCount / 250) // 估算页数
            }
          },
          meta: {
            fileName: 'html-content',
            fileSize: content.length,
            processedAt: new Date().toISOString(),
            htmlLength: content.length,
            cssLength: css.length
          }
        })
      } catch (error) {
        console.error('HTML处理错误:', error)
        return NextResponse.json({
          success: false,
          error: 'HTML内容处理失败',
          code: 'HTML_PROCESSING_ERROR',
          details: error instanceof Error ? error.message : String(error)
        }, { status: 500 })
      }
    }
    
    // 处理FormData格式的文件上传
    const formData = await request.formData()
    const file = formData.get('file') as File
    
    // 验证文件是否存在
    if (!file) {
      return NextResponse.json({
        success: false,
        error: '没有上传文件',
        code: 'NO_FILE'
      }, { status: 400 })
    }
    
    // 增强的文件验证
    const validationResult = validateFileEnhanced(file)
    if (!validationResult.isValid) {
      return NextResponse.json({
        success: false,
        error: validationResult.error,
        code: validationResult.code,
        details: validationResult.details
      }, { status: 400 })
    }
    
    try {
      // 读取文件内容
      const buffer = Buffer.from(await file.arrayBuffer())
      
      // 验证文件内容不为空
      if (buffer.length === 0) {
        return NextResponse.json({
          success: false,
          error: '文件内容为空，请检查文件是否损坏',
          code: 'EMPTY_FILE'
        }, { status: 400 })
      }
      
      // 解析Word文档
      const parseResult = await parseWordDocumentAdvanced(buffer)
      
      // 验证解析结果
      if (!parseResult || !parseResult.html) {
        return NextResponse.json({
          success: false,
          error: '文档解析失败，可能是文档格式不正确或文档已损坏',
          code: 'PARSE_RESULT_INVALID'
        }, { status: 422 })
      }
      
      // 检查解析结果是否有意义的内容
      if (parseResult.html.trim().length < 50) {
        return NextResponse.json({
          success: false,
          error: '文档内容过少或无法识别，请检查文档是否包含有效内容',
          code: 'INSUFFICIENT_CONTENT'
        }, { status: 422 })
      }
      
      return NextResponse.json({
        success: true,
        data: parseResult,
        meta: {
          fileName: file.name,
          fileSize: file.size,
          processedAt: new Date().toISOString(),
          htmlLength: parseResult.html.length,
          cssLength: parseResult.css ? parseResult.css.length : 0
        }
      })
      
    } catch (parseError) {
      console.error('文档解析错误:', parseError)
      
      // 根据错误类型返回不同的错误信息
      let errorMessage = '文档解析失败'
      let errorCode = 'PARSE_ERROR'
      
      if (parseError instanceof Error) {
        if (parseError.message.includes('corrupt') || parseError.message.includes('damaged')) {
          errorMessage = '文档文件已损坏，请尝试重新保存文档后上传'
          errorCode = 'CORRUPTED_FILE'
        } else if (parseError.message.includes('password') || parseError.message.includes('encrypted')) {
          errorMessage = '不支持加密或受密码保护的文档'
          errorCode = 'ENCRYPTED_FILE'
        } else if (parseError.message.includes('format')) {
          errorMessage = '文档格式不正确，请确保是有效的Word文档'
          errorCode = 'INVALID_FORMAT'
        }
      }
      
      return NextResponse.json({
        success: false,
        error: errorMessage,
        code: errorCode,
        details: parseError instanceof Error ? parseError.message : '未知解析错误'
      }, { status: 422 })
    }
    
  } catch (error) {
    console.error('服务器错误:', error)
    
    return NextResponse.json({
      success: false,
      error: '服务器内部错误，请稍后重试',
      code: 'INTERNAL_ERROR',
      details: error instanceof Error ? error.message : '未知服务器错误'
    }, { status: 500 })
  }
}

// GET 请求处理器（用于健康检查）
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Word文档解析API正常运行',
    version: '1.0.0',
    supportedFormats: ['.docx'],
    maxFileSize: '1MB'
  })
}
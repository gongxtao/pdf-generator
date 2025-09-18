import { NextRequest, NextResponse } from 'next/server'
import { promises as fs } from 'fs'
import path from 'path'
import os from 'os'
import mammoth from 'mammoth'
import { z } from 'zod'
import { CSSExtractor } from '@/lib/css-extractor'
// import { DocxParser, DocumentStructure } from '@/lib/docx-parser'
import { HtmlGenerator } from '@/lib/html-generator'
import { DocxParserModular, DocumentStructure } from '@/lib/docx-parser-modular'
import { DocxParser } from '@/lib/docx-parser'

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
    
    // 获取解析结果
    const wordState = await parser.parseDocx(buffer);
    
    // 将WordState转换为DocumentStructure格式
    const elements: DocumentStructure['elements'] = [];
    
    // 转换段落为DocumentElement - 保留完整格式信息
    wordState.paragraphs.forEach((paragraph, index) => {
      // 构建富文本内容，保留所有格式
      let richContent = '';
      paragraph.runs.forEach(run => {
        if (run.text.trim()) {
          let runHtml = run.text;
          
          // 应用字体样式
          const styles: string[] = [];
          if (run.bold) styles.push('font-weight: bold');
          if (run.italic) styles.push('font-style: italic');
          if (run.underline) styles.push('text-decoration: underline');
          if (run.strike) styles.push('text-decoration: line-through');
          if (run.color) styles.push(`color: ${run.color}`);
          if (run.font) styles.push(`font-family: "${run.font}"`);
          if (run.sz) styles.push(`font-size: ${run.sz}pt`);
          
          if (styles.length > 0) {
            runHtml = `<span style="${styles.join('; ')}">${runHtml}</span>`;
          }
          
          richContent += runHtml;
        }
      });
      
      if (richContent.trim()) {
        elements.push({
          type: 'paragraph',
          id: `p-${index}`,
          content: richContent,
          styles: {
            alignment: paragraph.alignment,
            indent: paragraph.indent,
            spacing: paragraph.spacing,
            runs: paragraph.runs,
            styleId: paragraph.styleId
          },
          position: { order: index }
        });
      }
    });
    
    // 转换表格为DocumentElement - 处理完整表格结构
    wordState.tables.forEach((table, index) => {
      let tableContent = '<table style="border-collapse: collapse; width: 100%;">';
      
      table.rows.forEach((row, rowIndex) => {
        tableContent += '<tr>';
        row.cells.forEach((cell, cellIndex) => {
          const cellStyles: string[] = [];
          
          // 处理单元格边框
          if (cell.borders) {
            if (cell.borders.top) cellStyles.push(`border-top: ${cell.borders.top.size || 1}pt solid ${cell.borders.top.color || '#000'}`);
            if (cell.borders.left) cellStyles.push(`border-left: ${cell.borders.left.size || 1}pt solid ${cell.borders.left.color || '#000'}`);
            if (cell.borders.bottom) cellStyles.push(`border-bottom: ${cell.borders.bottom.size || 1}pt solid ${cell.borders.bottom.color || '#000'}`);
            if (cell.borders.right) cellStyles.push(`border-right: ${cell.borders.right.size || 1}pt solid ${cell.borders.right.color || '#000'}`);
          } else {
            // 默认边框
            cellStyles.push('border: 1pt solid #000');
          }
          
          // 处理单元格背景色
          if (cell.background) {
            cellStyles.push(`background-color: ${cell.background}`);
          }
          
          // 处理单元格宽度
          if (cell.width) {
            cellStyles.push(`width: ${cell.width}pt`);
          }
          
          // 处理合并单元格
          const colSpan = cell.colSpan ? ` colspan="${cell.colSpan}"` : '';
          const rowSpan = cell.rowSpan ? ` rowspan="${cell.rowSpan}"` : '';
          
          // 处理单元格内容
          let cellContent = '';
          if (Array.isArray(cell.content)) {
            cell.content.forEach(contentItem => {
              if (typeof contentItem === 'string') {
                cellContent += contentItem;
              } else if (contentItem && typeof contentItem === 'object') {
                // 处理段落内容
                if (contentItem.runs) {
                  contentItem.runs.forEach((run: any) => {
                    if (run.text) {
                      let runText = run.text;
                      const runStyles: string[] = [];
                      if (run.bold) runStyles.push('font-weight: bold');
                      if (run.italic) runStyles.push('font-style: italic');
                      if (run.color) runStyles.push(`color: ${run.color}`);
                      if (run.font) runStyles.push(`font-family: "${run.font}"`);
                      if (run.sz) runStyles.push(`font-size: ${run.sz}pt`);
                      
                      if (runStyles.length > 0) {
                        runText = `<span style="${runStyles.join('; ')}">${runText}</span>`;
                      }
                      cellContent += runText;
                    }
                  });
                }
              }
            });
          }
          
          cellContent = cellContent || '&nbsp;';
          const styleAttr = cellStyles.length > 0 ? ` style="${cellStyles.join('; ')}"` : '';
          
          tableContent += `<td${colSpan}${rowSpan}${styleAttr} style="padding: 3pt 5pt; vertical-align: top; ${cellStyles.join('; ')}">${cellContent}</td>`;
        });
        tableContent += '</tr>';
      });
      
      tableContent += '</table>';
      
      elements.push({
        type: 'table',
        id: `t-${index}`,
        content: tableContent,
        styles: {
          borders: table.borders,
          rows: table.rows,
          styleId: table.styleId
        },
        position: { order: elements.length }
      });
    });
    
    // 处理浮动图片
    wordState.floatingImages?.forEach((floatingImg, index) => {
      elements.push({
        type: 'image',
        id: `fi-${index}`,
        content: `<img src="${floatingImg.src}" style="position: absolute; left: ${floatingImg.left}; top: ${floatingImg.top}; z-index: ${floatingImg.zIndex}; max-width: 100%; height: auto;" alt="浮动图片">`,
        styles: {
          position: 'absolute',
          left: floatingImg.left,
          top: floatingImg.top,
          zIndex: floatingImg.zIndex,
          behindDoc: floatingImg.behindDoc
        },
        position: { order: elements.length }
      });
    });
    
    // 构建 DocumentStructure - 应用完整的WordState信息
    const documentStructure: DocumentStructure = {
      elements,
      pageSettings: {
        width: wordState.page.width,
        height: wordState.page.height,
        margins: {
          top: wordState.page.margin[0],
          right: wordState.page.margin[1],
          bottom: wordState.page.margin[2],
          left: wordState.page.margin[3],
          header: 0,
          footer: 0
        },
        orientation: wordState.page.width > wordState.page.height ? 'landscape' : 'portrait'
      },
      styles: wordState.styles,
      headers: wordState.headers ? wordState.headers.map((header, index) => ({
        type: 'header' as const,
        id: `h-${index}`,
        content: header,
        styles: {},
        position: { order: index }
      })) : [],
      footers: wordState.footers ? wordState.footers.map((footer, index) => ({
        type: 'footer' as const,
        id: `f-${index}`,
        content: footer,
        styles: {},
        position: { order: index }
      })) : [],
      backgrounds: wordState.backgroundImage ? [{
        type: 'background' as const,
        id: 'bg-0',
        content: `<img src="${wordState.backgroundImage.src}" style="position: absolute; top: 0; left: 0; width: 100%; height: 100%; z-index: -1;" alt="背景图片">`,
        styles: {
          type: wordState.backgroundImage.type,
          position: 'absolute',
          zIndex: -1
        },
        position: { order: 0 }
      }] : [],
      images: wordState.images || {},
      metadata: {
        title: wordState.metadata?.title,
        author: wordState.metadata?.author,
        created: wordState.metadata?.created,
        modified: wordState.metadata?.modified,
        pageCount: wordState.metadata?.pageCount,
        wordCount: wordState.metadata?.wordCount
      }
    };
    
    // 使用HTML生成器 - 传递完整的主题色彩和样式信息
    const htmlGenerator = new HtmlGenerator(wordState);
    
    // 注入主题色彩和语言信息
    if (wordState.themeColors) {
      (htmlGenerator as any).themeColors = wordState.themeColors;
    }
    if (wordState.lang) {
      (htmlGenerator as any).language = wordState.lang;
    }
    if (wordState.rtl) {
      (htmlGenerator as any).rightToLeft = wordState.rtl;
    }
    
    const html = htmlGenerator.generateHtml();
    
    // 提取元数据 - 使用WordState的准确信息
    const wordCount = wordState.metadata?.wordCount || 
      documentStructure.elements
        .filter(el => el.type === 'paragraph')
        .reduce((count, el) => {
          // 从HTML中提取纯文本计算字数
          const textContent = el.content.replace(/<[^>]*>/g, '');
          return count + textContent.split(/\s+/).filter(word => word.length > 0).length;
        }, 0);
    
    const hasImages = documentStructure.elements.some(el => el.type === 'image') || 
                     Object.keys(documentStructure.images).length > 0 ||
                     wordState.floatingImages?.length > 0;
    const hasTables = documentStructure.elements.some(el => el.type === 'table');
    const hasHeaders = documentStructure.headers.length > 0;
    const hasFooters = documentStructure.footers.length > 0;
    const hasBackgrounds = documentStructure.backgrounds.length > 0;
    
    // 估算页数 - 使用WordState的页面信息
    const pageCount = wordState.metadata?.pageCount || Math.max(1, Math.ceil(wordCount / 500));

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
    // 配置 mammoth.js 增强样式还原 - 100%还原Word格式
    const options = {
      // 全面的样式映射，保持更多Word原始格式
      styleMap: [
        // 标题样式映射 - 保持层级和格式
        "p[style-name='Heading 1'] => h1.heading-1:fresh",
        "p[style-name='Heading 2'] => h2.heading-2:fresh", 
        "p[style-name='Heading 3'] => h3.heading-3:fresh",
        "p[style-name='Heading 4'] => h4.heading-4:fresh",
        "p[style-name='Heading 5'] => h5.heading-5:fresh",
        "p[style-name='Heading 6'] => h6.heading-6:fresh",
        "p[style-name='Title'] => h1.document-title:fresh",
        "p[style-name='Subtitle'] => h2.document-subtitle:fresh",
        
        // 段落样式映射 - 保持对齐和间距
        "p[style-name='Normal'] => p.normal:fresh",
        "p[style-name='Body Text'] => p.body-text:fresh",
        "p[style-name='Body Text Indent'] => p.body-text-indent:fresh",
        "p[style-name='Body Text 2'] => p.body-text-2:fresh",
        "p[style-name='Body Text 3'] => p.body-text-3:fresh",
        "p[style-name='Quote'] => blockquote.quote:fresh",
        "p[style-name='Intense Quote'] => blockquote.intense-quote:fresh",
        "p[style-name='List Paragraph'] => p.list-paragraph:fresh",
        "p[style-name='Caption'] => p.caption:fresh",
        "p[style-name='Footer'] => p.footer:fresh",
        "p[style-name='Header'] => p.header:fresh",
        
        // 字符样式映射 - 保持文本格式
        "r[style-name='Strong'] => strong.strong:fresh",
        "r[style-name='Emphasis'] => em.emphasis:fresh",
        "r[style-name='Intense Emphasis'] => strong.intense-emphasis:fresh",
        "r[style-name='Subtle Emphasis'] => em.subtle-emphasis:fresh",
        "r[style-name='Book Title'] => cite.book-title:fresh",
        "r[style-name='Hyperlink'] => a.hyperlink:fresh",
        "r[style-name='FollowedHyperlink'] => a.followed-hyperlink:fresh",
        "r[style-name='Intense Reference'] => span.intense-reference:fresh",
        "r[style-name='Subtle Reference'] => span.subtle-reference:fresh",
        
        // 列表样式映射
        "p[style-name='List'] => li.list-item:fresh",
        "p[style-name='List 2'] => li.list-item-2:fresh",
        "p[style-name='List 3'] => li.list-item-3:fresh",
        "p[style-name='List Bullet'] => li.bullet-item:fresh",
        "p[style-name='List Number'] => li.number-item:fresh",
        
        // 表格样式映射 - 保持表格格式
        "table[style-name='Table Grid'] => table.table-grid:fresh",
        "table[style-name='Light Shading'] => table.light-shading:fresh",
        "table[style-name='Light Shading Accent 1'] => table.light-shading-accent1:fresh",
        "table[style-name='Medium Shading 1'] => table.medium-shading:fresh",
        "table[style-name='Medium Shading 2'] => table.medium-shading-2:fresh",
        "table[style-name='Dark List'] => table.dark-list:fresh",
        "table[style-name='Colorful Grid'] => table.colorful-grid:fresh",
        "table[style-name='Table Professional'] => table.professional:fresh",
        
        // 特殊格式映射
        "p[style-name='No Spacing'] => p.no-spacing:fresh",
        "p[style-name='Compact'] => p.compact:fresh",
        "p[style-name='Tight'] => p.tight:fresh",
        "p[style-name='Open'] => p.open:fresh"
      ],
      // 包含默认样式映射以获得更好的格式支持
      includeDefaultStyleMap: true,
      // 保留原始样式信息
      preserveEmptyParagraphs: true,
      // 增强图片处理 - 完全保持Word中的图片格式和位置
       convertImage: mammoth.images.imgElement(function(image) {
         return image.readAsBase64String().then(function(imageBuffer) {
           // 获取图片的原始尺寸信息
           const imageElement = {
             src: "data:" + image.contentType + ";base64," + imageBuffer,
             // Word标准图片样式 - 保持原始布局
             style: [
               "max-width: 100%",
               "height: auto", 
               "display: block",
               "margin: 0pt auto 8pt auto",
               "border: none",
               "vertical-align: baseline"
             ].join("; "),
             // 添加图片属性以便后续处理
             "data-image-type": image.contentType,
             "data-original-size": "preserve",
             alt: "Word文档图片",
             title: "来自Word文档的图片"
           };
           
           // 注意：mammoth库的Image类型不直接提供尺寸信息
            // 图片尺寸将通过CSS自动调整以保持比例
           
           return imageElement;
         });
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
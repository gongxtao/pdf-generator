import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// PDF生成请求的数据结构
interface PDFGenerationRequest {
  title: string;
  content: string;
  template?: 'business' | 'academic' | 'creative';
  template_content?: string; // 模板的CSS样式代码
  language?: string;
}

// PDF生成响应的数据结构
interface PDFGenerationResponse {
  success: boolean;
  pdfUrl?: string;
  error?: string;
  metadata?: {
    title: string;
    size: string;
    pages: number;
    generatedAt: string;
    language: string;
  };
}

/**
 * 根据模板和语言生成HTML内容
 * @param data PDF生成请求数据
 * @returns 格式化的HTML字符串
 */
function generateHTML(data: PDFGenerationRequest): string {
  const { title, content, template = 'business', template_content, language = 'zh-CN' } = data;
  
  // 根据语言设置字体
  const getFontFamily = (lang: string) => {
    switch (lang) {
      case 'zh-CN':
      case 'zh-TW':
        return 'PingFang SC, Microsoft YaHei, SimHei, sans-serif';
      case 'ja':
        return 'Hiragino Sans, Yu Gothic, Meiryo, sans-serif';
      case 'ko':
        return 'Malgun Gothic, Dotum, sans-serif';
      case 'ar':
        return 'Tahoma, Arial Unicode MS, sans-serif';
      case 'ru':
        return 'Times New Roman, Arial, sans-serif';
      default:
        return 'Arial, Helvetica, sans-serif';
    }
  };

  // 根据模板设置样式
  const getTemplateStyles = (template: string, customTemplateContent?: string) => {
    // 如果提供了自定义模板CSS，优先使用
    if (customTemplateContent) {
      return customTemplateContent;
    }

    // 否则使用默认样式
    const baseStyles = `
      body {
        font-family: ${getFontFamily(language)};
        line-height: 1.6;
        margin: 40px;
        color: #333;
        font-size: 14px;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      .content {
        max-width: 800px;
        margin: 0 auto;
      }
      h1 {
        color: #2c3e50;
        border-bottom: 3px solid #3498db;
        padding-bottom: 10px;
        margin-bottom: 30px;
      }
      h2 {
        color: #34495e;
        margin-top: 25px;
        margin-bottom: 15px;
      }
      p {
        margin-bottom: 15px;
        text-align: justify;
        white-space: pre-wrap;
        word-wrap: break-word;
      }
      br {
        display: block;
        margin: 0;
        line-height: 1.2;
      }
      ul, ol {
        margin-bottom: 15px;
        padding-left: 30px;
      }
      li {
        margin-bottom: 8px;
      }
      /* 保持TinyMCE编辑器的样式 */
      .pdf-container {
        width: 100%;
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
      .pdf-page {
        width: 100%;
        padding: 20px;
        margin: 0;
        background: white;
      }
      .pdf-text-item {
        display: inline;
        word-wrap: break-word;
        white-space: pre-wrap;
      }
    `;

    switch (template) {
      case 'academic':
        return baseStyles + `
          body { font-size: 12px; }
          h1 { font-size: 18px; text-align: center; }
          h2 { font-size: 16px; }
          p { text-indent: 2em; }
        `;
      case 'creative':
        return baseStyles + `
          body { 
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            font-size: 15px;
          }
          h1 { 
            color: #8e44ad;
            border-bottom: 3px solid #9b59b6;
            text-align: center;
          }
          h2 { color: #2980b9; }
        `;
      default: // business
        return baseStyles;
    }
  };

  return `
    <!DOCTYPE html>
    <html lang="${language}">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>${title}</title>
      <style>
        ${getTemplateStyles(template, template_content)}
      </style>
    </head>
    <body>
      <h1>${title}</h1>
      <div class="content">
         ${content.includes('<') && content.includes('>') ? content : content.split('\n').map(paragraph => {
           if (paragraph.trim().startsWith('# ')) {
             return `<h2>${paragraph.replace('# ', '')}</h2>`;
           } else if (paragraph.trim().startsWith('- ')) {
             return `<li>${paragraph.replace('- ', '')}</li>`;
           } else if (paragraph.trim()) {
             return `<p>${paragraph}</p>`;
           }
           return '';
         }).join('')}
        </div>
    </body>
    </html>
  `;
}

/**
 * 使用Puppeteer生成PDF
 * @param html HTML内容
 * @returns PDF Buffer
 */
async function generatePDFWithPuppeteer(html: string): Promise<Buffer> {
  let browser;
  
  try {
    // 启动浏览器
    browser = await puppeteer.launch({
      headless: true,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-gpu'
      ]
    });

    // 创建新页面
    const page = await browser.newPage();
    
    // 设置页面内容
    await page.setContent(html, {
      waitUntil: 'networkidle0' // 等待网络空闲，确保字体加载完成
    });

    // 生成PDF
    const pdfUint8Array = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });

    // 将Uint8Array转换为Buffer
    const pdfBuffer = Buffer.from(pdfUint8Array);

    return pdfBuffer;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

/**
 * 计算文件大小的可读格式
 * @param bytes 字节数
 * @returns 格式化的文件大小字符串
 */
function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * POST请求处理器 - 生成PDF
 */
export async function POST(request: NextRequest): Promise<NextResponse<PDFGenerationResponse>> {
  try {
    // 解析请求数据
    const data: PDFGenerationRequest = await request.json();
    
    // 验证必需字段
    if (!data.title || !data.content) {
      return NextResponse.json({
        success: false,
        error: '标题和内容是必需的字段'
      }, { status: 400 });
    }

    // 生成HTML内容
    const html = generateHTML(data);
    
    // 使用Puppeteer生成PDF
    const pdfBuffer = await generatePDFWithPuppeteer(html);
    
    // 将PDF转换为base64
    const base64PDF = pdfBuffer.toString('base64');
    const pdfUrl = `data:application/pdf;base64,${base64PDF}`;
    
    // 创建响应数据
    const response: PDFGenerationResponse = {
      success: true,
      pdfUrl,
      metadata: {
        title: data.title,
        size: formatFileSize(pdfBuffer.length),
        pages: 1, // Puppeteer生成的PDF页数需要额外计算，这里简化为1
        generatedAt: new Date().toISOString(),
        language: data.language || 'zh-CN'
      }
    };

    return NextResponse.json(response);
    
  } catch (error) {
    console.error('PDF生成错误:', error);
    
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : '生成PDF时发生未知错误'
    }, { status: 500 });
  }
}

/**
 * GET请求处理器 - 返回API信息
 */
export async function GET(): Promise<NextResponse> {
  return NextResponse.json({
    message: 'Puppeteer PDF生成API',
    version: '1.0.0',
    supportedLanguages: ['zh-CN', 'zh-TW', 'ja', 'ko', 'ar', 'ru', 'en'],
    supportedTemplates: ['business', 'academic', 'creative'],
    usage: {
      method: 'POST',
      contentType: 'application/json',
      requiredFields: ['title', 'content'],
      optionalFields: ['template', 'language']
    }
  });
}
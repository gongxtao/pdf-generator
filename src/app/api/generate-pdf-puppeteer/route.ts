import { generateHtmlAction } from '@/lib/generate-html';
import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

// PDF生成请求的数据结构
interface PDFGenerationRequest {
  title: string;
  content: string;
  template: string;
  template_content: string; // 模板的CSS样式代码
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
    // const html = generateHTML(data);
    const htmlOutput = await generateHtmlAction({
      css: data.template_content,
      input: data.content,
      extra: []
    })
    if (!htmlOutput.success) {
      return NextResponse.json({
        success: false,
        error: htmlOutput.error
      }, { status: 400 });
    }
    
    // 使用Puppeteer生成PDF
    const pdfBuffer = await generatePDFWithPuppeteer(htmlOutput.content || '');
    
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
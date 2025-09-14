import { NextRequest, NextResponse } from 'next/server';
import puppeteer from 'puppeteer';

/**
 * HTML转PDF的API接口
 * 接收HTML内容，返回PDF文件
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { html, options } = body;

    // 验证必需的参数
    if (!html) {
      return NextResponse.json(
        { error: 'HTML内容不能为空' },
        { status: 400 }
      );
    }

    // 启动浏览器
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });

    try {
      const page = await browser.newPage();
      
      // 设置HTML内容
      await page.setContent(html, {
        waitUntil: 'networkidle0'
      });

      // PDF生成选项
      const pdfOptions = {
        format: 'A4' as const,
        printBackground: true,
        margin: {
          top: '20mm',
          right: '20mm',
          bottom: '20mm',
          left: '20mm'
        },
        ...options // 允许覆盖默认选项
      };

      // 生成PDF
      const pdfBuffer = await page.pdf(pdfOptions);

      // 关闭浏览器
      await browser.close();

      // 返回PDF文件
      return new NextResponse(pdfBuffer, {
        status: 200,
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="document.pdf"',
          'Content-Length': pdfBuffer.length.toString()
        }
      });

    } catch (error) {
      await browser.close();
      throw error;
    }

  } catch (error) {
    console.error('HTML转PDF时出错:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'HTML转PDF失败',
        details: error instanceof Error ? error.message : '未知错误'
      },
      { status: 500 }
    );
  }
}

/**
 * 获取PDF生成选项说明
 */
export async function GET() {
  try {
    const options = {
      format: {
        description: '页面格式',
        options: ['A4', 'A3', 'A5', 'Letter', 'Legal', 'Tabloid'],
        default: 'A4'
      },
      margin: {
        description: '页边距设置',
        example: {
          top: '20mm',
          right: '20mm', 
          bottom: '20mm',
          left: '20mm'
        }
      },
      printBackground: {
        description: '是否打印背景',
        default: true
      },
      landscape: {
        description: '是否横向打印',
        default: false
      }
    };

    return NextResponse.json({
      success: true,
      options,
      message: 'PDF选项说明获取成功'
    });

  } catch (error) {
    console.error('获取PDF选项时出错:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取PDF选项失败'
      },
      { status: 500 }
    );
  }
}
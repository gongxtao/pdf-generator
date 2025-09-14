import { NextRequest, NextResponse } from 'next/server';
import { generateHtmlAction } from '@/lib/generate-html';

interface HtmlGenerateRequest {
  title: string;
  content: string;
  css: string; // 模板的CSS样式代码
  language?: string;
  extra?: string[];
}

interface HtmlGenerateResponse {
  success: boolean;
  html?: string;
  error?: string;
}

/**
 * 生成HTML的API接口
 * 接收内容数据，返回格式化的HTML
 */
export async function POST(request: NextRequest): Promise<NextResponse<HtmlGenerateResponse>> {
  try {
    const data: HtmlGenerateRequest = await request.json();

    // 验证必需的参数
    if (!data.content) {
      return NextResponse.json(
        { success: false, error: '内容不能为空' },
        { status: 400 }
      );
    }

    // 生成HTML
    const result = await generateHtmlAction({
      css: data.css,
      input: data.content,
      extra: data.extra || []
    });

    if (!result.success) {
      return NextResponse.json(
        { 
          success: false,
          error: result.error,
        },
        { status: 500 }
      );
    }

    const html = result.content;

    const response: HtmlGenerateResponse = {
      success: true,
      html,
    };
    return NextResponse.json(response);

  } catch (error) {
    console.error('生成HTML时出错:', error);
    return NextResponse.json(
      { 
        success: false,
        error: error instanceof Error ? error.message : '未知错误',
      },
      { status: 500 }
    );
  }
}

/**
 * 获取可用的模板列表
 */
export async function GET() {
  try {
    // 返回可用的模板列表
    const templates = [
      { id: 'default', name: '默认模板', description: '标准文档模板' },
      { id: 'report', name: '报告模板', description: '适用于报告和分析文档' },
      { id: 'letter', name: '信件模板', description: '适用于正式信件' },
      { id: 'invoice', name: '发票模板', description: '适用于发票和账单' }
    ];

    return NextResponse.json({
      success: true,
      templates,
      message: '模板列表获取成功'
    });

  } catch (error) {
    console.error('获取模板列表时出错:', error);
    return NextResponse.json(
      { 
        success: false,
        error: '获取模板列表失败'
      },
      { status: 500 }
    );
  }
}
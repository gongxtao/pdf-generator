import { NextRequest, NextResponse } from 'next/server';

interface UploadWebPRequest {
  webpData: string; // base64 encoded WebP data
  filename?: string;
}

interface UploadWebPResponse {
  success: boolean;
  url?: string;
  filename?: string;
  error?: string;
}

/**
 * 上传WebP图片的API接口
 * 接收base64编码的WebP数据，调用通用文件上传接口上传到Cloudflare R2存储
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadWebPResponse>> {
  try {
    const data: UploadWebPRequest = await request.json();
    const { webpData, filename } = data;

    // 验证必需的参数
    if (!webpData) {
      return NextResponse.json(
        { success: false, error: '缺少WebP数据' },
        { status: 400 }
      );
    }

    // 验证是否为有效的base64 WebP数据
    if (!webpData.startsWith('data:image/webp;base64,')) {
      return NextResponse.json(
        { success: false, error: '无效的WebP数据格式' },
        { status: 400 }
      );
    }

    // 生成文件名
    const timestamp = Date.now();
    const finalFilename = filename || `style_${timestamp}.webp`;

    // 调用通用文件上传接口
    const uploadResponse = await fetch(`${request.nextUrl.origin}/api/upload-file`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        file: webpData,
        path: 'test-webps', // 上传到webp目录
        filename: finalFilename
      })
    });

    const uploadResult = await uploadResponse.json();

    if (!uploadResult.success) {
      return NextResponse.json(
        { success: false, error: uploadResult.error || '上传失败' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      filename: uploadResult.filename
    });

  } catch (error) {
    console.error('上传WebP失败:', error);
    return NextResponse.json(
      { success: false, error: '上传WebP失败' },
      { status: 500 }
    );
  }
}

// 支持GET请求获取API信息
export async function GET() {
  return NextResponse.json({
    message: 'Upload WebP API',
    description: '上传WebP图片到Cloudflare R2存储',
    methods: ['POST'],
    parameters: {
      webpData: 'string - base64编码的WebP数据（包含data:image/webp;base64,前缀）',
      filename: 'string - 文件名（可选，默认为style_{timestamp}.webp）'
    },
    note: '当前为模拟模式，需要配置Cloudflare R2才能实际上传'
  });
}

// Cloudflare R2上传函数（需要配置）
// async function uploadToR2(buffer: Buffer, filename: string) {
//   // 需要安装 @aws-sdk/client-s3 并配置R2凭据
//   // const { S3Client, PutObjectCommand } = require('@aws-sdk/client-s3');
//   
//   // const client = new S3Client({
//   //   region: 'auto',
//   //   endpoint: process.env.R2_ENDPOINT,
//   //   credentials: {
//   //     accessKeyId: process.env.R2_ACCESS_KEY_ID!,
//   //     secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
//   //   },
//   // });
//   
//   // const command = new PutObjectCommand({
//   //   Bucket: process.env.R2_BUCKET_NAME,
//   //   Key: filename,
//   //   Body: buffer,
//   //   ContentType: 'image/webp',
//   // });
//   
//   // await client.send(command);
//   // return `${process.env.R2_PUBLIC_URL}/${filename}`;
// }
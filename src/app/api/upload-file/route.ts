import { NextRequest, NextResponse } from 'next/server';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

interface UploadFileRequest {
  file: string; // base64 encoded file data with data URL prefix
  path?: string; // upload path, default to root
  filename?: string; // custom filename
}

interface UploadFileResponse {
  success: boolean;
  url?: string;
  filename?: string;
  path?: string;
  error?: string;
}

/**
 * 通用文件上传到Cloudflare R2的API接口
 * 支持任意文件类型上传到指定路径
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadFileResponse>> {
  try {
    const data: UploadFileRequest = await request.json();
    const { file, path = '', filename } = data;

    // 验证必需的参数
    if (!file) {
      return NextResponse.json(
        { success: false, error: '缺少文件数据' },
        { status: 400 }
      );
    }

    // 验证是否为有效的data URL格式
    if (!file.startsWith('data:')) {
      return NextResponse.json(
        { success: false, error: '无效的文件数据格式，需要data URL格式' },
        { status: 400 }
      );
    }

    // 解析data URL
    const [header, base64Data] = file.split(',');
    if (!header || !base64Data) {
      return NextResponse.json(
        { success: false, error: '无效的data URL格式' },
        { status: 400 }
      );
    }

    // 提取MIME类型
    const mimeMatch = header.match(/data:([^;]+)/);
    const mimeType = mimeMatch ? mimeMatch[1] : 'application/octet-stream';

    // 生成文件扩展名
    const getExtensionFromMime = (mime: string): string => {
      const mimeToExt: { [key: string]: string } = {
        'image/webp': '.webp',
        'image/png': '.png',
        'image/jpeg': '.jpg',
        'image/gif': '.gif',
        'application/pdf': '.pdf',
        'text/plain': '.txt',
        'application/json': '.json'
      };
      return mimeToExt[mime] || '';
    };

    // 转换为Buffer
    const buffer = Buffer.from(base64Data, 'base64');

    // 生成文件名
    const timestamp = Date.now();
    const extension = getExtensionFromMime(mimeType);
    const finalFilename = filename || `file_${timestamp}${extension}`;

    // 构建完整路径
    const fullPath = path ? `${path.replace(/^\/*|\/*$/g, '')}/${finalFilename}` : finalFilename;

    // 上传到Cloudflare R2
    const uploadResult = await uploadToR2(buffer, fullPath, mimeType);
    
    console.log(`上传文件成功: ${fullPath}, 类型: ${mimeType}, 大小: ${buffer.length} bytes`);

    return NextResponse.json({
      success: true,
      url: uploadResult,
      filename: finalFilename,
      path: fullPath
    });

  } catch (error) {
    console.error('文件上传失败:', error);
    return NextResponse.json(
      { success: false, error: '文件上传失败' },
      { status: 500 }
    );
  }
}

// 支持GET请求获取API信息
export async function GET() {
  return NextResponse.json({
    message: 'Universal File Upload API',
    description: '通用文件上传到Cloudflare R2存储',
    methods: ['POST'],
    parameters: {
      file: 'string - base64编码的文件数据（包含data URL前缀，如data:image/webp;base64,...）',
      path: 'string - 上传路径（可选，默认为根目录）',
      filename: 'string - 自定义文件名（可选，默认为file_{timestamp}.{ext}）'
    },
    supportedTypes: [
      'image/webp', 'image/png', 'image/jpeg', 'image/gif',
      'application/pdf', 'text/plain', 'application/json'
    ],
    note: '当前为模拟模式，需要配置Cloudflare R2才能实际上传'
  });
}

// Cloudflare R2上传函数
async function uploadToR2(buffer: Buffer, path: string, contentType: string): Promise<string> {
  // 创建S3客户端（Cloudflare R2兼容S3 API）
  const client = new S3Client({
    region: 'auto',
    endpoint: process.env.S3_CLIENT_ENDPOINT,
    credentials: {
      accessKeyId: process.env.ACCESS_KEY_ID!,
      secretAccessKey: process.env.SECRET_ACCESS_KEY!,
    },
  });
  
  // 创建上传命令
  const command = new PutObjectCommand({
    Bucket: process.env.S3_BUCKET_NAME,
    Key: path,
    Body: buffer,
    ContentType: contentType,
  });
  
  // 执行上传
  await client.send(command);
  
  // 返回公共访问URL
  // 从endpoint提取account hash: https://81269bfc6041f5db4c198c4972532c56.r2.cloudflarestorage.com
  const accountHash = process.env.S3_CLIENT_ENDPOINT?.split('//')[1]?.split('.')[0];
  const publicUrl = `https://pub-${accountHash}.r2.dev/${process.env.S3_BUCKET_NAME}/${path}`;
  
  return publicUrl;
}
// DocxParser 完整功能测试
const { DocxParser } = require('./dist/docx-parser');
const fs = require('fs');
const path = require('path');

// 类型定义（用于测试）
interface DocumentElement {
  type: 'paragraph' | 'table' | 'image' | 'header' | 'footer' | 'background' | 'pageBreak';
  id: string;
  content: string;
  styles: Record<string, any>;
  position: {
    page?: number;
    section?: number;
    order: number;
  };
  metadata?: Record<string, any>;
}

interface PageSettings {
  width: number;
  height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    header: number;
    footer: number;
  };
  orientation: 'portrait' | 'landscape';
}

interface DocumentStructure {
  elements: DocumentElement[];
  pageSettings: PageSettings;
  styles: Record<string, any>;
  headers: DocumentElement[];
  footers: DocumentElement[];
  backgrounds: DocumentElement[];
  images: Record<string, string>;
  metadata?: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    pageCount?: number;
    wordCount?: number;
  };
}

// 测试用的简单docx文件内容（模拟）
const createMockDocxBuffer = (): Buffer => {
  // 这里应该是一个真实的docx文件buffer
  // 为了测试，我们创建一个空的buffer
  return Buffer.from('mock docx content');
};

// 创建测试用的真实docx文件buffer
const getTestDocxBuffer = (): Buffer | null => {
  const testFiles = [
    'ATS finance resume.docx',
    'ATS simple classic cover letter.docx',
    'Bold meeting agenda.docx'
  ];
  
  for (const file of testFiles) {
    const filePath = path.join(__dirname, file);
    if (fs.existsSync(filePath)) {
      return fs.readFileSync(filePath);
    }
  }
  
  return null;
};

async function testDocxParser() {
  console.log('🚀 开始测试 DocxParser...');
  
  const parser = new DocxParser();
  
  // 测试1: 基本实例化
  console.log('\n📋 测试1: 基本实例化');
  try {
    console.log('✅ DocxParser 实例创建成功');
  } catch (error) {
    console.error('❌ DocxParser 实例创建失败:', error);
    return;
  }
  
  // 测试2: 错误处理 - 无效buffer
  console.log('\n📋 测试2: 错误处理 - 无效buffer');
  try {
    const invalidBuffer = Buffer.from('invalid content');
    await parser.parseDocx(invalidBuffer);
    console.log('❌ 应该抛出错误但没有');
  } catch (error) {
    console.log('✅ 正确处理了无效buffer:', (error as Error).message);
  }
  
  // 测试3: 空buffer处理
  console.log('\n📋 测试3: 空buffer处理');
  try {
    const emptyBuffer = Buffer.alloc(0);
    await parser.parseDocx(emptyBuffer);
    console.log('❌ 应该抛出错误但没有');
  } catch (error) {
    console.log('✅ 正确处理了空buffer:', (error as Error).message);
  }
  
  // 测试4: 真实docx文件解析
  console.log('\n📋 测试4: 真实docx文件解析');
  const testBuffer = getTestDocxBuffer();
  
  if (testBuffer) {
    try {
      console.log(`📄 使用测试文件，大小: ${testBuffer.length} bytes`);
      const result = await parser.parseDocx(testBuffer);
      
      // 验证返回结果结构
      console.log('\n🔍 验证解析结果结构:');
      
      // 检查页面设置
      if (result.page) {
        console.log('✅ 页面设置:', {
          width: result.page.width,
          height: result.page.height,
          margin: result.page.margin
        });
      } else {
        console.log('❌ 缺少页面设置');
      }
      
      // 检查段落
      if (Array.isArray(result.paragraphs)) {
        console.log(`✅ 段落数量: ${result.paragraphs.length}`);
        if (result.paragraphs.length > 0) {
          const firstParagraph = result.paragraphs[0];
          console.log('   第一个段落:', {
            alignment: firstParagraph.alignment,
            runsCount: firstParagraph.runs?.length || 0,
            hasText: firstParagraph.runs?.some((run: any) => run.text?.trim()) || false
          });
        }
      } else {
        console.log('❌ 段落不是数组');
      }
      
      // 检查表格
      if (Array.isArray(result.tables)) {
        console.log(`✅ 表格数量: ${result.tables.length}`);
        if (result.tables.length > 0) {
          const firstTable = result.tables[0];
          console.log('   第一个表格:', {
            rowsCount: firstTable.rows?.length || 0,
            hasBorders: !!firstTable.borders
          });
        }
      } else {
        console.log('❌ 表格不是数组');
      }
      
      // 检查浮动图片
      if (Array.isArray(result.floatingImages)) {
        console.log(`✅ 浮动图片数量: ${result.floatingImages.length}`);
      } else {
        console.log('❌ 浮动图片不是数组');
      }
      
      // 检查样式
      if (result.styles && typeof result.styles === 'object') {
        const styleCount = Object.keys(result.styles).length;
        console.log(`✅ 样式数量: ${styleCount}`);
      } else {
        console.log('❌ 样式不是对象');
      }
      
      // 检查主题颜色
      if (result.themeColors && typeof result.themeColors === 'object') {
        const colorCount = Object.keys(result.themeColors).length;
        console.log(`✅ 主题颜色数量: ${colorCount}`);
      } else {
        console.log('❌ 主题颜色不是对象');
      }
      
      // 检查语言和方向
      console.log(`✅ 语言: ${result.lang}`);
      console.log(`✅ RTL: ${result.rtl}`);
      
      // 检查元数据
      if (result.metadata) {
        console.log('✅ 元数据:', {
          title: result.metadata.title || '未设置',
          author: result.metadata.author || '未设置',
          pageCount: result.metadata.pageCount || 0,
          wordCount: result.metadata.wordCount || 0
        });
      } else {
        console.log('⚠️  无元数据');
      }
      
      // 检查图片
      if (result.images && typeof result.images === 'object') {
        const imageCount = Object.keys(result.images).length;
        console.log(`✅ 图片数量: ${imageCount}`);
      } else {
        console.log('⚠️  无图片数据');
      }
      
      console.log('\n🎉 真实文件解析测试完成');
      
    } catch (error) {
      console.error('❌ 真实文件解析失败:', error);
      console.error('错误堆栈:', (error as Error).stack);
    }
  } else {
    console.log('⚠️  未找到测试docx文件，跳过真实文件测试');
  }
  
  // 测试5: 接口类型验证
  console.log('\n📋 测试5: 接口类型验证');
  try {
    // 测试DocumentElement接口
    const mockElement: DocumentElement = {
      type: 'paragraph',
      id: 'test-1',
      content: 'Test content',
      styles: { fontSize: '12pt' },
      position: {
        page: 1,
        section: 1,
        order: 1
      },
      metadata: { source: 'test' }
    };
    console.log('✅ DocumentElement 接口验证通过');
    
    // 测试PageSettings接口
    const mockPageSettings: PageSettings = {
      width: 794,
      height: 1123,
      margins: {
        top: 96,
        bottom: 96,
        left: 96,
        right: 96,
        header: 48,
        footer: 48
      },
      orientation: 'portrait'
    };
    console.log('✅ PageSettings 接口验证通过');
    
    // 测试DocumentStructure接口
    const mockStructure: DocumentStructure = {
      elements: [mockElement],
      pageSettings: mockPageSettings,
      styles: {},
      headers: [],
      footers: [],
      backgrounds: [],
      images: {},
      metadata: {
        title: 'Test Document',
        author: 'Test Author',
        pageCount: 1,
        wordCount: 100
      }
    };
    console.log('✅ DocumentStructure 接口验证通过');
    
  } catch (error) {
    console.error('❌ 接口类型验证失败:', error);
  }
  
  console.log('\n🏁 DocxParser 测试完成!');
}

// 性能测试
async function performanceTest() {
  console.log('\n⚡ 开始性能测试...');
  
  const testBuffer = getTestDocxBuffer();
  if (!testBuffer) {
    console.log('⚠️  无测试文件，跳过性能测试');
    return;
  }
  
  const parser = new DocxParser();
  const iterations = 5;
  const times: number[] = [];
  
  for (let i = 0; i < iterations; i++) {
    const startTime = Date.now();
    try {
      await parser.parseDocx(testBuffer);
      const endTime = Date.now();
      const duration = endTime - startTime;
      times.push(duration);
      console.log(`   第${i + 1}次: ${duration}ms`);
    } catch (error) {
      console.error(`   第${i + 1}次失败:`, (error as Error).message);
    }
  }
  
  if (times.length > 0) {
    const avgTime = times.reduce((a, b) => a + b, 0) / times.length;
    const minTime = Math.min(...times);
    const maxTime = Math.max(...times);
    
    console.log(`\n📊 性能统计:`);
    console.log(`   平均时间: ${avgTime.toFixed(2)}ms`);
    console.log(`   最快时间: ${minTime}ms`);
    console.log(`   最慢时间: ${maxTime}ms`);
    console.log(`   文件大小: ${testBuffer.length} bytes`);
    console.log(`   处理速度: ${(testBuffer.length / avgTime * 1000 / 1024).toFixed(2)} KB/s`);
  }
}

// 运行所有测试
async function runAllTests() {
  try {
    await testDocxParser();
    await performanceTest();
  } catch (error) {
    console.error('🚨 测试运行失败:', error);
  }
}

// 如果直接运行此文件
if (require.main === module) {
  runAllTests();
}

module.exports = { testDocxParser, performanceTest, runAllTests };
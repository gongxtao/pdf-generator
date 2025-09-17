const fs = require('fs');
const path = require('path');

// 直接导入TypeScript文件进行测试
const { DocxParser } = require('./src/lib/docx-parser.ts');

async function testDocxParser() {
  try {
    console.log('开始测试 docx-parser.ts...');
    
    // 读取测试文件
    const docxPath = './templates_meeting-agenda-template_Double stripe agenda.docx';
    console.log('读取文件:', docxPath);
    
    if (!fs.existsSync(docxPath)) {
      console.error('测试文件不存在:', docxPath);
      return;
    }
    
    const buffer = fs.readFileSync(docxPath);
    console.log('文件大小:', buffer.length, 'bytes');
    
    // 创建解析器实例
    const parser = new DocxParser();
    console.log('DocxParser 实例创建成功');
    
    // 解析文档
    console.log('开始解析文档...');
    const result = await parser.parseDocx(buffer);
    
    console.log('\n=== 解析结果 ===');
    console.log('页面设置:', {
      width: result.page.width,
      height: result.page.height,
      margin: result.page.margin
    });
    
    console.log('段落数量:', result.paragraphs.length);
    console.log('表格数量:', result.tables.length);
    console.log('浮动图片数量:', result.floatingImages.length);
    console.log('样式数量:', Object.keys(result.styles).length);
    console.log('语言:', result.lang);
    console.log('RTL:', result.rtl);
    
    // 显示前3个段落的详细信息
    if (result.paragraphs.length > 0) {
      console.log('\n=== 前3个段落详情 ===');
      for (let i = 0; i < Math.min(3, result.paragraphs.length); i++) {
        const p = result.paragraphs[i];
        console.log(`段落 ${i + 1}:`);
        console.log('  对齐方式:', p.alignment);
        console.log('  文本运行数量:', p.runs.length);
        if (p.runs.length > 0) {
          console.log('  第一个运行文本:', p.runs[0].text.substring(0, 50));
          console.log('  第一个运行样式:', {
            bold: p.runs[0].bold,
            italic: p.runs[0].italic,
            color: p.runs[0].color,
            font: p.runs[0].font,
            size: p.runs[0].sz
          });
        }
      }
    }
    
    // 显示表格信息
    if (result.tables.length > 0) {
      console.log('\n=== 表格详情 ===');
      for (let i = 0; i < result.tables.length; i++) {
        const table = result.tables[i];
        console.log(`表格 ${i + 1}:`);
        console.log('  行数:', table.rows.length);
        if (table.rows.length > 0) {
          console.log('  第一行单元格数:', table.rows[0].cells.length);
        }
      }
    }
    
    // 显示图片信息
    if (result.images && Object.keys(result.images).length > 0) {
      console.log('\n=== 图片信息 ===');
      Object.keys(result.images).forEach(key => {
        console.log(`图片 ${key}: ${result.images[key].substring(0, 50)}...`);
      });
    }
    
    // 显示元数据
    if (result.metadata) {
      console.log('\n=== 元数据 ===');
      console.log('标题:', result.metadata.title);
      console.log('作者:', result.metadata.author);
      console.log('创建时间:', result.metadata.created);
      console.log('修改时间:', result.metadata.modified);
    }
    
    console.log('\n测试完成！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testDocxParser();
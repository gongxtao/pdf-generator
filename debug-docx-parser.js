const { DocxParser } = require('./src/lib/docx-parser.ts');
const fs = require('fs');
const { JSDOM } = require('jsdom');

// 设置DOM环境
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;

async function debugDocxParser() {
  console.log('=== DocxParser 调试测试 ===\n');
  
  try {
    // 读取测试文档
    const buffer = fs.readFileSync('Bold meeting agenda.docx');
    console.log('✅ 文档读取成功，文件大小:', buffer.length, '字节');
    
    // 创建解析器实例
    const parser = new DocxParser();
    console.log('✅ 解析器实例创建成功');
    
    // 解析文档
    const result = await parser.parseDocx(buffer);
    console.log('✅ 文档解析完成');
    
    // 详细检查结果
    console.log('\n=== 解析结果详情 ===');
    console.log('段落数量:', result.paragraphs.length);
    console.log('表格数量:', result.tables.length);
    console.log('语言设置:', result.lang);
    console.log('RTL方向:', result.rtl);
    
    // 检查样式
    console.log('\n=== 样式信息 ===');
    console.log('样式数量:', Object.keys(result.styles).length);
    if (Object.keys(result.styles).length > 0) {
      console.log('可用样式ID:', Object.keys(result.styles).slice(0, 5).join(', '));
    }
    
    // 检查段落详情
    console.log('\n=== 段落详情 ===');
    if (result.paragraphs.length === 0) {
      console.log('⚠️  警告：没有找到任何段落！');
    } else {
      result.paragraphs.forEach((paragraph, index) => {
        console.log(`段落 ${index + 1}:`);
        console.log(`  - 样式ID: ${paragraph.styleId || '无'}`);
        console.log(`  - 对齐方式: ${paragraph.alignment}`);
        console.log(`  - 文本运行数量: ${paragraph.runs.length}`);
        
        if (paragraph.runs.length > 0) {
          paragraph.runs.forEach((run, runIndex) => {
            console.log(`    文本运行 ${runIndex + 1}: "${run.text}" (长度: ${run.text.length})`);
          });
        }
        console.log('');
      });
    }
    
    // 检查表格详情
    console.log('\n=== 表格详情 ===');
    if (result.tables.length > 0) {
      result.tables.forEach((table, index) => {
        console.log(`表格 ${index + 1}: ${table.rows.length} 行`);
      });
    }
    
    // 检查元数据
    console.log('\n=== 元数据 ===');
    if (result.metadata) {
      console.log('标题:', result.metadata.title || '无');
      console.log('作者:', result.metadata.author || '无');
      console.log('创建时间:', result.metadata.created || '无');
      console.log('修改时间:', result.metadata.modified || '无');
      console.log('页数:', result.metadata.pageCount || '未知');
      console.log('字数:', result.metadata.wordCount || '未知');
    }
    
    // 检查图片
    console.log('\n=== 图片信息 ===');
    if (result.images && Object.keys(result.images).length > 0) {
      console.log('找到图片数量:', Object.keys(result.images).length);
    } else {
      console.log('没有找到图片');
    }
    
    console.log('\n=== 调试测试完成 ===');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行调试测试
debugDocxParser();
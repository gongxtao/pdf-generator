const fs = require('fs');
const path = require('path');
const { DocxParser } = require('./dist/docx-parser.js');

// 简单的DOM模拟
global.DOMParser = require('xmldom').DOMParser;
global.Document = global.DOMParser;

async function testFixedParser() {
  console.log('=== 测试修复后的DocxParser ===\n');
  
  const testFile = 'templates_meeting-agenda-template_Double stripe agenda.docx';
  const filePath = path.join(__dirname, testFile);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }
  
  try {
    const buffer = fs.readFileSync(filePath);
    console.log(`📁 文件: ${testFile}`);
    console.log(`📊 文件大小: ${buffer.length} bytes\n`);
    
    const parser = new DocxParser();
    console.log('🔍 开始解析DOCX文件...');
    
    const result = await parser.parseDocx(buffer);
    
    console.log('\n📋 解析结果:');
    console.log(`- 段落数量: ${result.paragraphs ? result.paragraphs.length : 0}`);
    console.log(`- 表格数量: ${result.tables ? result.tables.length : 0}`);
    console.log(`- 图片数量: ${result.floatingImages ? result.floatingImages.length : 0}`);
    console.log(`- 样式数量: ${result.styles ? Object.keys(result.styles).length : 0}`);
    
    if (result.paragraphs && result.paragraphs.length > 0) {
      console.log('\n📝 段落内容示例:');
      for (let i = 0; i < Math.min(5, result.paragraphs.length); i++) {
        const paragraph = result.paragraphs[i];
        const text = paragraph.runs ? paragraph.runs.map(run => run.text).join('') : '';
        console.log(`  ${i + 1}. "${text}" (${paragraph.runs ? paragraph.runs.length : 0} runs)`);
      }
    } else {
      console.log('\n⚠️  未找到段落内容');
    }
    
    if (result.tables && result.tables.length > 0) {
      console.log('\n📊 表格内容示例:');
      for (let i = 0; i < Math.min(2, result.tables.length); i++) {
        const table = result.tables[i];
        console.log(`  表格 ${i + 1}: ${table.rows ? table.rows.length : 0} 行`);
      }
    }
    
    console.log('\n✅ 解析完成!');
    
  } catch (error) {
    console.error('❌ 解析失败:', error.message);
    console.error('错误详情:', error.stack);
  }
}

testFixedParser().catch(console.error);
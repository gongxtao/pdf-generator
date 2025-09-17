// 简单DOM模拟
global.document = {
  createElement: () => ({}),
  getElementsByTagName: () => []
};

global.DOMParser = class {
  parseFromString(xmlString, mimeType) {
    // 简单的XML解析模拟
    return {
      getElementsByTagName: (tagName) => {
        const matches = [];
        const regex = new RegExp(`<${tagName}[^>]*>([\s\S]*?)</${tagName}>`, 'gi');
        let match;
        while ((match = regex.exec(xmlString)) !== null) {
          matches.push({
            tagName: tagName,
            textContent: match[1],
            childNodes: [],
            nodeType: 1
          });
        }
        return matches;
      }
    };
  }
};

const fs = require('fs');
const path = require('path');
const { DocxParser } = require('./dist/docx-parser.js');

// 测试文件列表
const testFiles = [
  'templates_meeting-agenda-template_Double stripe agenda.docx'
];

const testFile = testFiles[0];

async function debugTemplateFile() {
  console.log('=== 模板文件调试分析 ===\n');
  
  const filePath = path.join(__dirname, testFiles[0]);
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }
  
  try {
    const buffer = fs.readFileSync(filePath);
    console.log(`📁 文件: ${testFiles[0]}`);
    console.log(`📊 文件大小: ${buffer.length} bytes\n`);
    
    const parser = new DocxParser();
    
    // 直接访问内部方法进行调试
    console.log('🔍 开始解析DOCX文件...');
    const result = await parser.parseDocx(buffer);
    
    console.log('\n📋 解析结果概览:');
    console.log(`- 段落数量: ${result.paragraphs ? result.paragraphs.length : 0}`);
    console.log(`- 表格数量: ${result.tables ? result.tables.length : 0}`);
    console.log(`- 图片数量: ${result.floatingImages ? result.floatingImages.length : 0}`);
    console.log(`- 样式数量: ${result.styles ? Object.keys(result.styles).length : 0}`);
    
    // 检查内部XML内容
    console.log('\n🔍 内部XML检查:');
    
    // 通过反射访问私有属性（仅用于调试）
    const documentXml = parser.documentXml || '';
    const stylesXml = parser.stylesXml || '';
    
    console.log(`- documentXml长度: ${documentXml.length}`);
    console.log(`- stylesXml长度: ${stylesXml.length}`);
    
    if (documentXml.length > 0) {
      console.log('\n📄 documentXml前500字符:');
      console.log(documentXml.substring(0, 500));
      
      // 检查是否包含段落标签
      const paragraphMatches = documentXml.match(/<w:p[^>]*>/g) || [];
      const bodyMatches = documentXml.match(/<w:body[^>]*>/g) || [];
      
      console.log(`\n🏷️  XML标签统计:`);
      console.log(`- <w:body> 标签: ${bodyMatches.length}`);
      console.log(`- <w:p> 段落标签: ${paragraphMatches.length}`);
      
      if (paragraphMatches.length > 0) {
        console.log('\n📝 找到的段落标签示例:');
        paragraphMatches.slice(0, 3).forEach((match, index) => {
          console.log(`  ${index + 1}. ${match}`);
        });
      }
    } else {
      console.log('⚠️  documentXml为空，可能解析失败');
    }
    
    // 检查段落内容
    if (result.paragraphs && result.paragraphs.length > 0) {
      console.log('\n📝 段落内容详情:');
      result.paragraphs.slice(0, 3).forEach((para, index) => {
        console.log(`\n段落 ${index + 1}:`);
        console.log(`- 样式ID: ${para.styleId || '无'}`);
        console.log(`- 对齐方式: ${para.alignment}`);
        console.log(`- 文本运行数: ${para.runs.length}`);
        
        if (para.runs.length > 0) {
          const allText = para.runs.map(run => run.text).join('');
          console.log(`- 内容: "${allText.substring(0, 100)}${allText.length > 100 ? '...' : ''}"}`);
        }
      });
    } else {
      console.log('\n⚠️  未找到段落内容');
    }
    
  } catch (error) {
    console.error('❌ 解析失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行调试
debugTemplateFile().catch(console.error);
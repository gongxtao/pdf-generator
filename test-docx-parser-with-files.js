// 使用目录中的docx文件测试docx-parser.ts
const fs = require('fs');
const path = require('path');

// 模拟DOMParser环境
class MockDOMParser {
  parseFromString(xmlString, mimeType) {
    // 简单的XML解析模拟
    return {
      getElementsByTagName: (tagName) => {
        const matches = xmlString.match(new RegExp(`<${tagName}[^>]*>`, 'g')) || [];
        return matches.map(() => ({
          getAttribute: () => null,
          getElementsByTagName: () => [],
          textContent: ''
        }));
      }
    };
  }
}

global.DOMParser = MockDOMParser;

async function testDocxParser() {
  try {
    console.log('开始测试docx-parser.ts...');
    
    // 动态导入编译后的模块
    const { DocxParser } = await import('./dist/docx-parser.js');
    
    // 测试文档列表
    const testDocuments = [
      'ATS finance resume.docx',
      'ATS simple classic cover letter.docx', 
      'Bold meeting agenda.docx'
    ];
    
    for (const docName of testDocuments) {
      console.log(`\n=== 测试文档: ${docName} ===`);
      
      // 检查文件是否存在
      if (!fs.existsSync(docName)) {
        console.log(`❌ 文件不存在: ${docName}`);
        continue;
      }
      
      try {
        // 读取文档
        const buffer = fs.readFileSync(docName);
        console.log(`✅ 文档读取成功，大小: ${buffer.length} bytes`);
        
        // 创建解析器实例
        const parser = new DocxParser();
        
        // 解析文档
        console.log('🔄 开始解析文档...');
        const result = await parser.parseDocx(buffer);
        
        // 验证解析结果
        console.log('📊 解析结果统计:');
        console.log(`  - 页面设置: ${result.page.width}x${result.page.height}`);
        console.log(`  - 页边距: [${result.page.margin.join(', ')}]`);
        console.log(`  - 段落数量: ${result.paragraphs.length}`);
        console.log(`  - 表格数量: ${result.tables.length}`);
        console.log(`  - 浮动图片: ${result.floatingImages.length}`);
        console.log(`  - 语言: ${result.lang}`);
        console.log(`  - RTL: ${result.rtl}`);
        
        // 显示元数据
        if (result.metadata) {
          console.log('📋 文档元数据:');
          console.log(`  - 标题: ${result.metadata.title || 'N/A'}`);
          console.log(`  - 作者: ${result.metadata.author || 'N/A'}`);
          console.log(`  - 创建时间: ${result.metadata.created || 'N/A'}`);
          console.log(`  - 修改时间: ${result.metadata.modified || 'N/A'}`);
        }
        
        // 显示段落内容预览
        if (result.paragraphs.length > 0) {
          console.log('📝 段落内容预览:');
          for (let i = 0; i < Math.min(3, result.paragraphs.length); i++) {
            const paragraph = result.paragraphs[i];
            const text = paragraph.runs.map(run => run.text).join('').trim();
            if (text) {
              console.log(`  ${i + 1}. ${text.substring(0, 50)}${text.length > 50 ? '...' : ''}`);
            }
          }
        }
        
        // 显示表格信息
        if (result.tables.length > 0) {
          console.log('📊 表格信息:');
          result.tables.forEach((table, index) => {
            console.log(`  表格 ${index + 1}: ${table.rows.length} 行`);
            if (table.rows.length > 0) {
              console.log(`    第一行有 ${table.rows[0].cells.length} 列`);
              // 显示第一行内容预览
              const firstRowText = table.rows[0].cells.map(cell => {
                if (cell.content && Array.isArray(cell.content)) {
                  return cell.content.map(p => 
                    p.runs ? p.runs.map(r => r.text).join('') : ''
                  ).join(' ').trim();
                }
                return '';
              }).filter(text => text).join(' | ');
              if (firstRowText) {
                console.log(`    内容预览: ${firstRowText.substring(0, 80)}${firstRowText.length > 80 ? '...' : ''}`);
              }
            }
          });
        }
        
        // 显示样式信息
        if (result.styles && Object.keys(result.styles).length > 0) {
          console.log(`🎨 样式定义: ${Object.keys(result.styles).length} 个`);
          const styleNames = Object.keys(result.styles).slice(0, 5);
          console.log(`  样式示例: ${styleNames.join(', ')}${Object.keys(result.styles).length > 5 ? '...' : ''}`);
        }
        
        // 显示图片信息
        if (result.images && Object.keys(result.images).length > 0) {
          console.log(`🖼️  图片资源: ${Object.keys(result.images).length} 个`);
        }
        
        console.log(`✅ ${docName} 解析成功`);
        
      } catch (parseError) {
        console.error(`❌ 解析 ${docName} 失败:`, parseError.message);
      }
    }
    
    console.log('\n🎉 所有测试完成!');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDocxParser();
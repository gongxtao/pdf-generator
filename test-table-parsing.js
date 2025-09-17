// 测试表格解析功能
const fs = require('fs');
const path = require('path');

// 模拟DOMParser环境
class MockDOMParser {
  parseFromString(xmlString, mimeType) {
    return {
      getElementsByTagName: (tagName) => {
        const matches = [];
        const regex = new RegExp(`<${tagName}[^>]*>([\s\S]*?)<\/${tagName}>`, 'g');
        let match;
        while ((match = regex.exec(xmlString)) !== null) {
          matches.push({
            getAttribute: (attr) => {
              const attrRegex = new RegExp(`${attr}="([^"]*)"`);  
              const attrMatch = match[0].match(attrRegex);
              return attrMatch ? attrMatch[1] : null;
            },
            textContent: match[1] || '',
            getElementsByTagName: (childTag) => {
              const childMatches = [];
              const childRegex = new RegExp(`<${childTag}[^>]*>([\s\S]*?)<\/${childTag}>`, 'g');
              let childMatch;
              while ((childMatch = childRegex.exec(match[1] || '')) !== null) {
                childMatches.push({
                  getAttribute: (attr) => {
                    const attrRegex = new RegExp(`${attr}="([^"]*)"`);  
                    const attrMatch = childMatch[0].match(attrRegex);
                    return attrMatch ? attrMatch[1] : null;
                  },
                  textContent: childMatch[1] || ''
                });
              }
              return childMatches;
            }
          });
        }
        return matches;
      }
    };
  }
}

global.DOMParser = MockDOMParser;

async function testTableParsing() {
  try {
    console.log('🔍 测试表格解析功能...');
    
    const { DocxParser } = require('./dist/docx-parser.js');
    
    // 测试包含表格的文档
    const testDocs = [
      'ATS finance resume.docx',
      'ATS simple classic cover letter.docx',
      'Bold meeting agenda.docx'
    ];
    
    for (const docName of testDocs) {
      const testPath = path.join(__dirname, docName);
      if (fs.existsSync(testPath)) {
        console.log(`\n📄 测试文档: ${docName}`);
        
        const buffer = fs.readFileSync(testPath);
        const parser = new DocxParser();
        const result = await parser.parseDocx(buffer);
        
        console.log(`✓ 段落数量: ${result.paragraphs?.length || 0}`);
        console.log(`✓ 表格数量: ${result.tables?.length || 0}`);
        
        if (result.tables && result.tables.length > 0) {
          console.log('📊 表格详细信息:');
          result.tables.forEach((table, tableIndex) => {
            console.log(`\n📋 表格 ${tableIndex + 1}:`);
            console.log(`  - 行数: ${table.rows?.length || 0}`);
            console.log(`  - 列数: ${table.rows?.[0]?.cells?.length || 0}`);
            
            // 显示表格内容预览
            if (table.rows && table.rows.length > 0) {
              console.log('  - 内容预览:');
              table.rows.slice(0, 3).forEach((row, rowIndex) => {
                if (row.cells) {
                  const rowText = row.cells.map(cell => {
                    if (cell.content && cell.content.length > 0) {
                      return cell.content.map(content => content.text || '').join('').trim();
                    }
                    return '';
                  }).join(' | ');
                  console.log(`    行 ${rowIndex + 1}: "${rowText.substring(0, 100)}${rowText.length > 100 ? '...' : ''}"`); 
                }
              });
            }
          });
        } else {
          console.log('📊 该文档不包含表格');
        }
        
        // 显示段落内容预览
        if (result.paragraphs && result.paragraphs.length > 0) {
          console.log('\n📝 段落内容预览:');
          result.paragraphs.slice(0, 3).forEach((para, index) => {
            if (para.runs && para.runs.length > 0) {
              const fullText = para.runs.map(run => run.text || '').join('').trim();
              if (fullText) {
                console.log(`  段落 ${index + 1}: "${fullText.substring(0, 80)}${fullText.length > 80 ? '...' : ''}"`); 
              }
            }
          });
        }
        
        console.log('\n' + '='.repeat(50));
      } else {
        console.log(`❌ 未找到文档: ${docName}`);
      }
    }
    
    console.log('\n🎉 表格解析功能测试完成！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testTableParsing();
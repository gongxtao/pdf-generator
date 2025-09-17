// 测试DOM解析问题
const fs = require('fs');
const path = require('path');
const { DOMParser } = require('xmldom');

// 测试真实的DOMParser
async function testDOMParsing() {
  console.log('=== DOM解析调试测试 ===\n');
  
  const filePath = path.join(__dirname, 'templates_meeting-agenda-template_Double stripe agenda.docx');
  
  if (!fs.existsSync(filePath)) {
    console.log(`❌ 文件不存在: ${filePath}`);
    return;
  }
  
  try {
    // 使用真实的DocxParser来获取documentXml
    const { DocxParser } = require('./dist/docx-parser.js');
    const buffer = fs.readFileSync(filePath);
    const parser = new DocxParser();
    
    // 解析文件以获取内部XML
    await parser.parseDocx(buffer);
    
    // 通过反射获取documentXml（仅用于调试）
    const documentXml = parser.documentXml || '';
    
    if (!documentXml) {
      console.log('❌ 无法获取documentXml');
      return;
    }
    
    console.log(`📄 documentXml长度: ${documentXml.length}`);
    
    // 使用真实的DOMParser解析
    console.log('\n🔍 使用xmldom DOMParser解析...');
    const domParser = new DOMParser();
    const doc = domParser.parseFromString(documentXml, 'text/xml');
    
    console.log('✅ DOM解析成功');
    
    // 查找body元素
    const bodies = doc.getElementsByTagName('w:body');
    console.log(`\n🏷️  找到 <w:body> 元素: ${bodies.length} 个`);
    
    if (bodies.length > 0) {
      const body = bodies[0];
      console.log(`📋 body子节点数量: ${body.childNodes.length}`);
      
      // 分析子节点类型
      let elementCount = 0;
      let paragraphCount = 0;
      let tableCount = 0;
      
      for (let i = 0; i < body.childNodes.length; i++) {
        const child = body.childNodes[i];
        if (child.nodeType === 1) { // 元素节点
          elementCount++;
          const tagName = child.tagName.toLowerCase();
          
          if (tagName === 'w:p' || tagName === 'p') {
            paragraphCount++;
            
            // 显示前几个段落的详细信息
            if (paragraphCount <= 3) {
              console.log(`\n📝 段落 ${paragraphCount}:`);
              console.log(`   - 标签名: ${child.tagName}`);
              console.log(`   - 子节点数: ${child.childNodes.length}`);
              
              // 尝试提取文本内容
              const textNodes = [];
              function extractText(node) {
                if (node.nodeType === 3) { // 文本节点
                  textNodes.push(node.nodeValue);
                } else if (node.childNodes) {
                  for (let j = 0; j < node.childNodes.length; j++) {
                    extractText(node.childNodes[j]);
                  }
                }
              }
              extractText(child);
              
              const text = textNodes.join('').trim();
              console.log(`   - 文本内容: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"}`);
            }
          } else if (tagName === 'w:tbl' || tagName === 'tbl') {
            tableCount++;
          }
        }
      }
      
      console.log(`\n📊 统计结果:`);
      console.log(`- 总元素节点: ${elementCount}`);
      console.log(`- 段落元素: ${paragraphCount}`);
      console.log(`- 表格元素: ${tableCount}`);
      
    } else {
      console.log('❌ 未找到body元素');
    }
    
    // 直接搜索所有段落
    const allParagraphs = doc.getElementsByTagName('w:p');
    console.log(`\n🔍 直接搜索所有 <w:p> 元素: ${allParagraphs.length} 个`);
    
    if (allParagraphs.length > 0) {
      console.log('\n📝 前3个段落的文本内容:');
      for (let i = 0; i < Math.min(3, allParagraphs.length); i++) {
        const para = allParagraphs[i];
        
        // 提取文本内容
        const textNodes = [];
        function extractText(node) {
          if (node.nodeType === 3) { // 文本节点
            textNodes.push(node.nodeValue);
          } else if (node.childNodes) {
            for (let j = 0; j < node.childNodes.length; j++) {
              extractText(node.childNodes[j]);
            }
          }
        }
        extractText(para);
        
        const text = textNodes.join('').trim();
        console.log(`  段落 ${i + 1}: "${text.substring(0, 150)}${text.length > 150 ? '...' : ''}"}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testDOMParsing().catch(console.error);
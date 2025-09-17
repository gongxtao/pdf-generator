const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

async function debugActualParser() {
  console.log('🔍 调试实际的解析器逻辑...');
  
  try {
    // 读取测试文件
    const buffer = fs.readFileSync('test-full-docx-parser.ts.docx');
    const zip = await JSZip.loadAsync(buffer);
    
    // 读取document.xml
    const documentXml = await zip.file('word/document.xml').async('text');
    console.log('📄 成功读取document.xml');
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    // 查找body元素 - 使用实际解析器的方法
    const body = doc.getElementsByTagName('w:body')[0] || doc.getElementsByTagName('body')[0];
    console.log('📊 body元素:', body ? '找到' : '未找到');
    
    if (!body) {
      console.log('❌ 未找到body元素');
      return;
    }
    
    console.log('📊 body子元素数量:', body.childNodes.length);
    
    let paragraphCount = 0;
    let tableCount = 0;
    
    // 模拟实际的extractParagraphsAndTables方法
    for (const child of Array.from(body.childNodes)) {
      if (child.nodeType === 1) { // 元素节点
        const tagName = child.tagName.toLowerCase();
        console.log(`📝 处理元素: ${tagName}`);
        
        if (tagName === 'w:p' || tagName === 'p') {
          paragraphCount++;
          console.log(`  ✅ 找到段落 ${paragraphCount}`);
          
          // 模拟parseParagraph方法
          const pPrElements = child.getElementsByTagName('pPr');
          const pPr = pPrElements.length > 0 ? pPrElements[0] : null;
          
          const wRElements = child.getElementsByTagName('w:r');
          const rElements = child.getElementsByTagName('r');
          const allRElements = [...Array.from(wRElements), ...Array.from(rElements)];
          
          console.log(`  📊 文本运行数量: ${allRElements.length}`);
          
          if (allRElements.length === 0) {
            console.log(`  ⚠️  段落无文本运行，将返回null`);
          } else {
            console.log(`  ✅ 段落有文本运行，将返回段落对象`);
          }
          
        } else if (tagName === 'w:tbl' || tagName === 'tbl') {
          tableCount++;
          console.log(`  ✅ 找到表格 ${tableCount}`);
        }
      }
    }
    
    console.log('\n📊 最终结果:');
    console.log(`段落总数: ${paragraphCount}`);
    console.log(`表格总数: ${tableCount}`);
    
  } catch (error) {
    console.log('❌ 调试失败:', error.message);
  }
}

debugActualParser();
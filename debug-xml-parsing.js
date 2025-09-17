const fs = require('fs');
const { JSDOM } = require('jsdom');

// 设置DOM环境
const dom = new JSDOM();
global.DOMParser = dom.window.DOMParser;

async function debugXMLParsing() {
  console.log('=== XML解析调试 ===\n');
  
  try {
    const JSZip = require('jszip');
    const buffer = fs.readFileSync('Bold meeting agenda.docx');
    const zip = await JSZip.loadAsync(buffer);
    
    // 读取文档主内容
    const documentXml = await zip.file('word/document.xml')?.async('text');
    if (!documentXml) {
      console.log('❌ 无法找到word/document.xml');
      return;
    }
    
    console.log('✅ 成功读取document.xml，长度:', documentXml.length);
    
    // 使用DOMParser解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    console.log('✅ XML解析成功');
    
    // 检查body元素
    const body = doc.querySelector('w\:body, body');
    console.log('body元素存在:', !!body);
    
    if (body) {
      console.log('body子元素数量:', body.children.length);
      
      // 遍历所有子元素
      let paragraphCount = 0;
      let tableCount = 0;
      
      for (let i = 0; i < body.children.length; i++) {
        const child = body.children[i];
        console.log(`子元素 ${i}: 标签名="${child.tagName}"`);
        
        if (child.tagName.includes('p') || child.tagName.includes('P')) {
          paragraphCount++;
          
          // 检查段落内容
          const rElements = child.querySelectorAll('w\:r, r');
          console.log(`  - 文本运行数量: ${rElements.length}`);
          
          let totalText = '';
          rElements.forEach((r, rIndex) => {
            const tElements = r.querySelectorAll('w\:t, t');
            tElements.forEach((t, tIndex) => {
              const text = t.textContent || '';
              console.log(`    - 文本运行 ${rIndex}.${tIndex}: "${text}"`);
              totalText += text;
            });
          });
          
          console.log(`  - 总文本内容: "${totalText}"`);
          
        } else if (child.tagName.includes('tbl') || child.tagName.includes('TBL')) {
          tableCount++;
          console.log(`  - 这是一个表格`);
        }
      }
      
      console.log(`\n总结: 找到 ${paragraphCount} 个段落, ${tableCount} 个表格`);
    }
    
    // 检查命名空间问题
    console.log('\n=== 命名空间检查 ===');
    const allElements = doc.querySelectorAll('*');
    console.log('文档中总元素数量:', allElements.length);
    
    // 查找段落的不同表示方式
    const p1 = doc.querySelectorAll('w\:p');
    const p2 = doc.querySelectorAll('p');
    console.log(`w\\:p 选择器找到: ${p1.length} 个`);
    console.log(`p 选择器找到: ${p2.length} 个`);
    
    // 查找文本的不同表示方式
    const t1 = doc.querySelectorAll('w\:t');
    const t2 = doc.querySelectorAll('t');
    console.log(`w\\:t 选择器找到: ${t1.length} 个`);
    console.log(`t 选择器找到: ${t2.length} 个`);
    
  } catch (error) {
    console.error('❌ 调试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

debugXMLParsing();
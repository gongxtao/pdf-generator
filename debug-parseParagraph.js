const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

async function debugParseParagraph() {
  console.log('🚀 开始调试parseParagraph方法...');
  
  try {
    // 读取DOCX文件
    const docxBuffer = fs.readFileSync('Bold meeting agenda.docx');
    
    // 解压DOCX文件
    const zip = await JSZip.loadAsync(docxBuffer);
    
    // 读取document.xml
    const documentXml = await zip.file('word/document.xml').async('text');
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    // 查找body元素
    const body = doc.getElementsByTagName('w:body')[0] || doc.getElementsByTagName('body')[0];
    
    if (body) {
      console.log('📊 body子元素数量:', body.childNodes.length);
      
      let paragraphCount = 0;
      let nonEmptyParagraphCount = 0;
      
      // 遍历所有子元素
      for (let i = 0; i < body.childNodes.length; i++) {
        const child = body.childNodes[i];
        if (child.nodeType === 1) { // 元素节点
          const tagName = child.tagName.toLowerCase();
          
          if (tagName === 'w:p' || tagName === 'p') {
            paragraphCount++;
            console.log(`\n📝 段落 ${paragraphCount}:`);
            console.log(`  标签名: ${child.tagName}`);
            
            // 查找文本运行
            const wRuns = child.getElementsByTagName('w:r');
            const runs = child.getElementsByTagName('r');
            console.log(`  w:r元素数量: ${wRuns.length}`);
            console.log(`  r元素数量: ${runs.length}`);
            
            // 查找所有文本内容
            let totalText = '';
            const allRuns = [...Array.from(wRuns), ...Array.from(runs)];
            
            for (const run of allRuns) {
              const wTexts = run.getElementsByTagName('w:t');
              const texts = run.getElementsByTagName('t');
              const allTexts = [...Array.from(wTexts), ...Array.from(texts)];
              
              for (const text of allTexts) {
                const textContent = text.textContent || '';
                totalText += textContent;
                console.log(`    文本内容: "${textContent}"`);
              }
            }
            
            console.log(`  总文本内容: "${totalText}"`);
            
            if (totalText.trim()) {
              nonEmptyParagraphCount++;
            } else {
              console.log(`  ⚠️  警告：此段落为空！`);
            }
          }
        }
      }
      
      console.log(`\n📊 总结:`);
      console.log(`总段落数量: ${paragraphCount}`);
      console.log(`非空段落数量: ${nonEmptyParagraphCount}`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugParseParagraph();
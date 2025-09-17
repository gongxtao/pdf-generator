const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

async function debugParseParagraphDetailed() {
  console.log('🚀 开始详细parseParagraph方法调试...');
  
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
      
      // 模拟extractParagraphsAndTables方法
      for (const child of Array.from(body.childNodes)) {
        if (child.nodeType === 1) { // 元素节点
          const tagName = child.tagName.toLowerCase();
          
          if (tagName === 'w:p' || tagName === 'p') {
            paragraphCount++;
            console.log(`\n📝 段落 ${paragraphCount}:`);
            console.log(`  标签名: ${child.tagName}`);
            
            // 模拟parseParagraph方法
            console.log('  🔍 开始parseParagraph...');
            
            // 查找段落属性
            const pPr = child.querySelector('pPr');
            const wPPr = child.querySelector('w\:pPr');
            console.log(`  pPr: ${pPr ? '找到' : '未找到'}`);
            console.log(`  w:pPr: ${wPPr ? '找到' : '未找到'}`);
            
            // 查找段落样式
            const pStyle = pPr?.querySelector('pStyle');
            const wPStyle = pPr?.querySelector('w\:pStyle');
            const wPStyle2 = wPPr?.querySelector('pStyle');
            const wPStyle3 = wPPr?.querySelector('w\:pStyle');
            
            const styleId = pStyle?.getAttribute('w:val') || pStyle?.getAttribute('val') || 
                           wPStyle?.getAttribute('w:val') || wPStyle?.getAttribute('val') ||
                           wPStyle2?.getAttribute('w:val') || wPStyle2?.getAttribute('val') ||
                           wPStyle3?.getAttribute('w:val') || wPStyle3?.getAttribute('val') ||
                           undefined;
            
            console.log(`  样式ID: ${styleId || '无'}`);
            
            // 提取文本内容
            const runs = getTextRuns(child);
            console.log(`  文本运行数量: ${runs.length}`);
            
            if (runs.length === 0) {
              console.log(`  ⚠️  警告：此段落没有文本运行，将返回null！`);
            } else {
              console.log(`  ✅ 此段落有内容，将返回段落对象`);
              runs.forEach((run, index) => {
                console.log(`    运行 ${index + 1}: "${run.text}"`);
              });
            }
          }
        }
      }
      
      console.log(`\n📊 总段落数量: ${paragraphCount}`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

// 模拟getTextRuns方法
function getTextRuns(element) {
  const runs = [];
  
  // 查找w:r和r元素（带和不带命名空间）
  const wRElements = element.getElementsByTagName('w:r');
  const rElements = element.getElementsByTagName('r');
  const allRElements = [...Array.from(wRElements), ...Array.from(rElements)];
  
  console.log(`    调试 - w:r元素数量: ${wRElements.length}, r元素数量: ${rElements.length}`);
  
  for (const r of allRElements) {
    // 查找w:t和t元素（带和不带命名空间）
    const wTElements = r.getElementsByTagName('w:t');
    const tElements = r.getElementsByTagName('t');
    const allTElements = [...Array.from(wTElements), ...Array.from(tElements)];
    
    console.log(`    调试 - 在r元素中找到w:t: ${wTElements.length}, t: ${tElements.length}`);
    
    for (const t of allTElements) {
      const text = t.textContent || '';
      if (text) {
        runs.push({
          text: text,
          bold: false, // 简化处理
          italic: false,
          underline: false
        });
      }
    }
  }
  
  return runs;
}

debugParseParagraphDetailed();
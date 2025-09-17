const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

async function debugEntireParser() {
  console.log('🚀 开始整个解析器流程调试...');
  
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
    
    // 查找body元素 - 模拟extractParagraphsAndTables方法
    const body = doc.getElementsByTagName('w:body')[0] || doc.getElementsByTagName('body')[0];
    console.log('📊 body元素:', body ? '找到' : '未找到');
    
    if (body) {
      console.log('📊 body子元素数量:', body.childNodes.length);
      
      const paragraphs = [];
      let paragraphCount = 0;
      
      // 模拟extractParagraphsAndTables方法
      for (const child of Array.from(body.childNodes)) {
        if (child.nodeType === 1) { // 元素节点
          const tagName = child.tagName.toLowerCase();
          
          if (tagName === 'w:p' || tagName === 'p') {
            paragraphCount++;
            console.log(`\n📝 处理段落 ${paragraphCount}:`);
            console.log(`  标签名: ${child.tagName}`);
            
            // 模拟parseParagraph方法
            const paragraph = parseParagraph(child);
            console.log(`  parseParagraph结果: ${paragraph ? '成功' : '返回null'}`);
            
            if (paragraph) {
              paragraphs.push(paragraph);
            }
          }
        }
      }
      
      console.log(`\n📊 最终结果:`);
      console.log(`处理的段落总数: ${paragraphCount}`);
      console.log(`成功解析的段落数: ${paragraphs.length}`);
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

// 模拟parseParagraph方法
function parseParagraph(element) {
  console.log('    🔍 开始parseParagraph...');
  
  try {
    // 查找段落属性 - 使用getElementsByTagName代替querySelector
    const pPrElements = element.getElementsByTagName('pPr');
    const pPr = pPrElements.length > 0 ? pPrElements[0] : null;
    console.log(`    pPr: ${pPr ? '找到' : '未找到'}`);
    
    const pStyleElements = pPr ? pPr.getElementsByTagName('pStyle') : [];
    const pStyle = pStyleElements.length > 0 ? pStyleElements[0] : null;
    console.log(`    pStyle: ${pStyle ? '找到' : '未找到'}`);
    
    const styleId = pStyle?.getAttribute('w:val') || pStyle?.getAttribute('val') || undefined;
    console.log(`    样式ID: ${styleId || '无'}`);
    
    // 提取文本内容
    const runs = getTextRuns(element);
    console.log(`    文本运行数量: ${runs.length}`);
    
    // 如果段落为空，返回null
    if (runs.length === 0) {
      console.log('    ⚠️  段落为空，返回null');
      return null;
    }
    
    console.log('    ✅ 段落有内容，返回段落对象');
    return {
      styleId,
      runs
    };
  } catch (error) {
    console.log(`    ❌ parseParagraph出错: ${error.message}`);
    return null;
  }
}

// 模拟getTextRuns方法
function getTextRuns(element) {
  const runs = [];
  
  try {
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
            bold: false,
            italic: false,
            underline: false
          });
        }
      }
    }
  } catch (error) {
    console.log(`    getTextRuns出错: ${error.message}`);
  }
  
  return runs;
}

debugEntireParser();
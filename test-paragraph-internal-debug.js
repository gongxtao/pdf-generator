const fs = require('fs');
const { DOMParser } = require('xmldom');
const JSZip = require('jszip');

// 模拟DOM环境
if (typeof global !== 'undefined') {
  global.DOMParser = DOMParser;
}

async function testParagraphParsing() {
  console.log('=== 段落解析内部调试测试 ===\n');
  
  const testFile = 'templates_meeting-agenda-template_Double stripe agenda.docx';
  console.log(`📁 测试文件: ${testFile}`);
  
  try {
    // 读取文件
    const buffer = fs.readFileSync(testFile);
    console.log(`📊 文件大小: ${buffer.length} bytes\n`);
    
    // 解压ZIP文件
    const zip = await JSZip.loadAsync(buffer);
    
    // 提取document.xml
    const documentFile = zip.file('word/document.xml');
    if (!documentFile) {
      console.log('❌ 未找到document.xml文件');
      return;
    }
    
    const documentXml = await documentFile.async('string');
    console.log(`📄 document.xml长度: ${documentXml.length}`);
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    // 查找段落元素
    const paragraphElements = doc.getElementsByTagName('w:p');
    console.log(`🔍 找到 ${paragraphElements.length} 个 w:p 元素\n`);
    
    if (paragraphElements.length > 0) {
      // 测试前3个段落的解析
      for (let i = 0; i < Math.min(3, paragraphElements.length); i++) {
        const element = paragraphElements[i];
        console.log(`--- 段落 ${i + 1} 调试 ---`);
        
        // 检查段落属性
        const pPr = element.getElementsByTagName('w:pPr')[0] || null;
        console.log(`段落属性元素: ${pPr ? '存在' : '不存在'}`);
        
        // 检查文本运行
        const wRElements = element.getElementsByTagName('w:r');
        console.log(`文本运行数量: ${wRElements.length}`);
        
        let totalText = '';
        for (let j = 0; j < wRElements.length; j++) {
          const r = wRElements[j];
          const wTElements = r.getElementsByTagName('w:t');
          console.log(`  运行 ${j + 1}: ${wTElements.length} 个文本元素`);
          
          for (let k = 0; k < wTElements.length; k++) {
            const t = wTElements[k];
            const text = t.textContent || '';
            totalText += text;
            console.log(`    文本 ${k + 1}: "${text}" (长度: ${text.length})`);
          }
        }
        
        console.log(`段落总文本: "${totalText}"`);
        console.log(`段落总文本长度: ${totalText.length}`);
        console.log('');
      }
    } else {
      console.log('❌ 未找到任何段落元素');
    }
    
  } catch (error) {
    console.error('❌ 解析过程中出错:', error.message);
  }
}

testParagraphParsing();
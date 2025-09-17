const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

async function debugParser() {
  console.log('🚀 开始调试DOCX解析器...');
  
  try {
    // 读取DOCX文件
    const docxBuffer = fs.readFileSync('Bold meeting agenda.docx');
    console.log('📄 成功读取文档，大小:', docxBuffer.length, '字节');
    
    // 解压DOCX文件
    const zip = await JSZip.loadAsync(docxBuffer);
    console.log('📦 成功解压文档');
    
    // 读取document.xml
    const documentXml = await zip.file('word/document.xml').async('text');
    console.log('📋 成功读取document.xml，大小:', documentXml.length, '字符');
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    // 查找根元素
    console.log('📋 文档根元素:', doc.documentElement.tagName);
    
    // 查找body元素
    const body = doc.getElementsByTagName('w:body')[0] || doc.getElementsByTagName('body')[0];
    console.log('🔍 body元素:', body ? '找到' : '未找到');
    
    if (body) {
      console.log('📊 body子元素数量:', body.childNodes.length);
      
      // 遍历所有子元素
      for (let i = 0; i < body.childNodes.length; i++) {
        const child = body.childNodes[i];
        if (child.nodeType === 1) { // 元素节点
          console.log(`子元素 ${i}: 标签名="${child.tagName}"`);
          
          // 检查是否是段落
          if (child.tagName.toLowerCase() === 'w:p' || child.tagName.toLowerCase() === 'p') {
            console.log(`  - 这是一个段落`);
            
            // 查找文本运行
            const runs = child.getElementsByTagName('r');
            console.log(`  - 找到 ${runs.length} 个文本运行`);
            
            // 查找w:r元素（带命名空间）
            const wRuns = child.getElementsByTagName('w:r');
            console.log(`  - 找到 ${wRuns.length} 个w:r文本运行`);
            
            if (runs.length === 0 && wRuns.length === 0) {
              console.log(`  - ⚠️  警告：段落中没有找到文本运行！`);
            }
          }
        }
      }
    } else {
      // 如果没找到body，查看文档结构
      console.log('📋 文档结构:');
      const allElements = doc.getElementsByTagName('*');
      console.log('总元素数量:', allElements.length);
      
      // 显示前10个元素
      for (let i = 0; i < Math.min(10, allElements.length); i++) {
        console.log(`元素 ${i}: ${allElements[i].tagName}`);
      }
    }
    
  } catch (error) {
    console.error('❌ 调试失败:', error.message);
  }
}

debugParser();
const fs = require('fs');
const JSZip = require('jszip');

async function analyzeDocx() {
  const buffer = fs.readFileSync('Bold meeting agenda.docx');
  const zip = await JSZip.loadAsync(buffer);
  
  // 读取文档主内容
  const documentXml = await zip.file('word/document.xml')?.async('text');
  if (documentXml) {
    console.log('文档XML内容长度:', documentXml.length);
    
    // 简单检查段落
    const paragraphMatches = documentXml.match(/<w:p[\s>]/g);
    console.log('找到的段落标签数量:', paragraphMatches?.length || 0);
    
    // 检查文本内容
    const textMatches = documentXml.match(/<w:t[\s>]/g);
    console.log('找到的文本标签数量:', textMatches?.length || 0);
    
    // 显示前1000个字符
    console.log('文档XML前1000字符:');
    console.log(documentXml.substring(0, 1000));
  }
}

analyzeDocx().catch(console.error);
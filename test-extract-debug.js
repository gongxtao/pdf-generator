const { DocxParser } = require('./dist/lib/docx-parser.js');
const fs = require('fs');
const path = require('path');
const JSZip = require('jszip');
const { DOMParser } = require('xmldom');

async function testExtractParagraphsAndTables() {
  console.log('=== 测试extractParagraphsAndTables方法 ===\n');
  
  const filePath = path.join(__dirname, 'templates_meeting-agenda-template_Double stripe agenda.docx');
  
  if (!fs.existsSync(filePath)) {
    console.error('❌ 文件不存在:', filePath);
    return;
  }
  
  console.log('📁 文件:', path.basename(filePath));
  console.log('📊 文件大小:', fs.statSync(filePath).size, 'bytes\n');
  
  try {
    // 读取并解压DOCX文件
    const buffer = fs.readFileSync(filePath);
    const zip = await JSZip.loadAsync(buffer);
    
    // 提取document.xml
    const documentXmlFile = zip.file('word/document.xml');
    if (!documentXmlFile) {
      console.error('❌ 未找到document.xml');
      return;
    }
    
    const documentXml = await documentXmlFile.async('string');
    console.log('📄 document.xml长度:', documentXml.length);
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    console.log('🔍 XML解析完成');
    console.log('📋 根元素:', doc.documentElement.tagName);
    
    // 手动实现extractParagraphsAndTables的逻辑并添加调试
    console.log('\n=== 开始查找段落和表格元素 ===');
    
    // 查找w:body元素
    const bodyElements = doc.getElementsByTagName('w:body');
    console.log('🔍 w:body元素数量:', bodyElements.length);
    
    if (bodyElements.length === 0) {
      const bodyElementsNoNs = doc.getElementsByTagName('body');
      console.log('🔍 body元素数量(无命名空间):', bodyElementsNoNs.length);
    }
    
    const body = bodyElements.length > 0 ? bodyElements[0] : 
                 (doc.getElementsByTagName('body').length > 0 ? doc.getElementsByTagName('body')[0] : null);
    
    if (!body) {
      console.error('❌ 未找到body元素');
      return;
    }
    
    console.log('✅ 找到body元素');
    console.log('📋 body子元素数量:', body.childNodes.length);
    
    // 查找段落元素
    const paragraphElements = body.getElementsByTagName('w:p');
    console.log('🔍 w:p元素数量:', paragraphElements.length);
    
    if (paragraphElements.length === 0) {
      const paragraphElementsNoNs = body.getElementsByTagName('p');
      console.log('🔍 p元素数量(无命名空间):', paragraphElementsNoNs.length);
    }
    
    // 查找表格元素
    const tableElements = body.getElementsByTagName('w:tbl');
    console.log('🔍 w:tbl元素数量:', tableElements.length);
    
    if (tableElements.length === 0) {
      const tableElementsNoNs = body.getElementsByTagName('tbl');
      console.log('🔍 tbl元素数量(无命名空间):', tableElementsNoNs.length);
    }
    
    // 测试直接从document查找
    console.log('\n=== 从整个文档查找 ===');
    const allParagraphs = doc.getElementsByTagName('w:p');
    console.log('🔍 整个文档中w:p元素数量:', allParagraphs.length);
    
    const allTables = doc.getElementsByTagName('w:tbl');
    console.log('🔍 整个文档中w:tbl元素数量:', allTables.length);
    
    // 检查前几个段落的内容
    if (allParagraphs.length > 0) {
      console.log('\n=== 段落内容预览 ===');
      for (let i = 0; i < Math.min(3, allParagraphs.length); i++) {
        const p = allParagraphs[i];
        const textElements = p.getElementsByTagName('w:t');
        let text = '';
        for (let j = 0; j < textElements.length; j++) {
          if (textElements[j].firstChild) {
            text += textElements[j].firstChild.nodeValue || '';
          }
        }
        console.log(`📝 段落${i + 1}:`, JSON.stringify(text));
      }
    }
    
    console.log('\n✅ 调试完成!');
    
  } catch (error) {
    console.error('❌ 解析错误:', error.message);
    console.error('📍 错误堆栈:', error.stack);
  }
}

testExtractParagraphsAndTables();
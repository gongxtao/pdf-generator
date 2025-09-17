const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('xmldom');

async function debugDOMParsing() {
  console.log('=== DOM解析调试 ===\n');
  
  const filePath = 'templates_meeting-agenda-template_Double stripe agenda.docx';
  const buffer = fs.readFileSync(filePath);
  
  console.log(`📁 文件: ${filePath}`);
  console.log(`📊 文件大小: ${buffer.length} bytes\n`);
  
  // 解压文件
  const zip = await JSZip.loadAsync(buffer);
  const documentXmlFile = zip.file('word/document.xml');
  
  if (!documentXmlFile) {
    console.log('❌ 未找到document.xml文件');
    return;
  }
  
  const documentXml = await documentXmlFile.async('string');
  console.log(`📄 document.xml长度: ${documentXml.length} 字符\n`);
  
  // 显示XML的前500个字符
  console.log('📝 XML内容预览:');
  console.log(documentXml.substring(0, 500));
  console.log('...\n');
  
  // 解析XML
  const parser = new DOMParser();
  const doc = parser.parseFromString(documentXml, 'text/xml');
  
  console.log('🔍 DOM解析结果:');
  console.log(`- 根元素: ${doc.documentElement ? doc.documentElement.tagName : '无'}`);
  console.log(`- 子元素数量: ${doc.documentElement ? doc.documentElement.childNodes.length : 0}`);
  
  // 检查各种可能的段落元素
  const wpElements = doc.getElementsByTagName('w:p');
  const pElements = doc.getElementsByTagName('p');
  const bodyElements = doc.getElementsByTagName('w:body');
  const documentElements = doc.getElementsByTagName('w:document');
  
  console.log(`\n📊 元素统计:`);
  console.log(`- w:p 元素: ${wpElements.length}`);
  console.log(`- p 元素: ${pElements.length}`);
  console.log(`- w:body 元素: ${bodyElements.length}`);
  console.log(`- w:document 元素: ${documentElements.length}`);
  
  // 如果有body元素，检查其子元素
  if (bodyElements.length > 0) {
    const body = bodyElements[0];
    console.log(`\n🏗️  w:body 子元素:`);
    for (let i = 0; i < body.childNodes.length; i++) {
      const child = body.childNodes[i];
      if (child.nodeType === 1) { // Element node
        console.log(`  - ${child.tagName} (${child.childNodes.length} 子节点)`);
      }
    }
  }
  
  // 检查是否有解析错误
  const parseErrors = doc.getElementsByTagName('parsererror');
  if (parseErrors.length > 0) {
    console.log('\n❌ XML解析错误:');
    for (let i = 0; i < parseErrors.length; i++) {
      console.log(`  ${parseErrors[i].textContent}`);
    }
  }
  
  console.log('\n✅ 调试完成!');
}

debugDOMParsing().catch(console.error);
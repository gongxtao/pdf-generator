const fs = require('fs');
const JSZip = require('jszip');

// 创建一个简单的docx文件
async function createTestDocx() {
  const zip = new JSZip();
  
  // 添加必要的docx文件结构
  zip.file('[Content_Types].xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
  <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
  <Default Extension="xml" ContentType="application/xml"/>
  <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
</Types>`);
  
  zip.folder('_rels').file('.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
  <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
</Relationships>`);
  
  zip.folder('word').file('document.xml', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:r>
        <w:t>这是一个测试Word文档</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:t>包含多个段落的内容。</w:t>
      </w:r>
    </w:p>
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>这是粗体文本</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`);
  
  // 生成zip文件
  const content = await zip.generateAsync({type: 'nodebuffer'});
  fs.writeFileSync('test-document.docx', content);
  console.log('测试docx文件已创建');
}

createTestDocx().catch(console.error);
const JSZip = require('jszip');
const fs = require('fs');

// 创建一个包含更多内容的测试docx文件
async function createLargeTestDocx() {
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

  zip.folder('word').folder('_rels').file('document.xml.rels', `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
</Relationships>`);

  // 创建包含丰富内容的document.xml
  const documentXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
  <w:body>
    <w:p>
      <w:pPr>
        <w:jc w:val="center"/>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="28"/>
        </w:rPr>
        <w:t>Word文档解析测试</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>1. 项目概述</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>本项目旨在开发一个高效的Word文档解析系统，能够将.docx文件转换为HTML、CSS和PDF格式。系统采用现代化的技术栈，包括Next.js、TypeScript和多个专业的文档处理库。</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>主要功能包括：</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="0"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>• 文档上传和验证</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="0"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>• HTML内容提取和样式分析</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="0"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>• CSS样式自动生成</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:numPr>
          <w:ilvl w:val="0"/>
        </w:numPr>
      </w:pPr>
      <w:r>
        <w:t>• PDF文档生成和预览</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>2. 技术架构</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>系统采用分层架构设计，包含以下核心组件：</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>前端层：</w:t>
      </w:r>
      <w:r>
        <w:t>基于React和Next.js构建的现代化用户界面，提供直观的文件上传和预览功能。</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>API层：</w:t>
      </w:r>
      <w:r>
        <w:t>RESTful API接口，处理文件上传、解析和格式转换请求。</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>解析层：</w:t>
      </w:r>
      <w:r>
        <w:t>使用Mammoth.js进行Word文档解析，Cheerio进行HTML处理，Puppeteer进行PDF生成。</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:pPr>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
      </w:pPr>
      <w:r>
        <w:rPr>
          <w:b/>
          <w:sz w:val="20"/>
        </w:rPr>
        <w:t>3. 实现细节</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>文档解析过程包含多个步骤：首先验证上传的文件格式和大小，然后使用Mammoth.js提取HTML内容，接着通过CSS提取器分析样式信息，最后使用Puppeteer将HTML转换为PDF格式。整个过程确保了文档格式的完整性和视觉效果的一致性。</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:rPr>
          <w:i/>
        </w:rPr>
        <w:t>注意：本系统支持标准的.docx格式文档，对于复杂的表格、图片和特殊格式可能需要额外的处理。</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:rPr>
          <w:b/>
        </w:rPr>
        <w:t>测试数据统计：</w:t>
      </w:r>
    </w:p>
    
    <w:p>
      <w:r>
        <w:t>本文档包含约300个单词，5个段落，3个主要章节，用于测试系统的解析能力和性能表现。通过这个测试文档，我们可以验证CSS提取、HTML生成和PDF转换功能是否正常工作。</w:t>
      </w:r>
    </w:p>
  </w:body>
</w:document>`;

  zip.folder('word').file('document.xml', documentXml);

  // 生成zip文件
  const content = await zip.generateAsync({ type: 'nodebuffer' });
  
  // 写入文件
  fs.writeFileSync('test-document.docx', content);
  console.log('大型测试docx文件已创建：test-document.docx');
}

createLargeTestDocx().catch(console.error);
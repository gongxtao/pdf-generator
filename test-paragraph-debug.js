const fs = require('fs');
const { DOMParser } = require('xmldom');

// 直接使用源文件进行调试
const JSZip = require('jszip');

// 简化的DocxParser类用于调试
class DocxParser {
  constructor() {
    this.zip = null;
    this.documentXml = '';
  }
  
  async parseDocx(buffer) {
    this.zip = await JSZip.loadAsync(buffer);
    await this.extractXmlFiles();
    
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.documentXml, 'text/xml');
    
    const { paragraphs, tables } = this.extractParagraphsAndTables(doc, {});
    
    return {
      paragraphs,
      tables,
      floatingImages: []
    };
  }
  
  async extractXmlFiles() {
    const documentFile = this.zip.file('word/document.xml');
    if (documentFile) {
      this.documentXml = await documentFile.async('string');
    }
  }
  
  extractParagraphsAndTables(doc, styles) {
    const paragraphs = [];
    const tables = [];

    // 搜索所有段落元素
    const paragraphElements = doc.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphElements.length; i++) {
      const element = paragraphElements[i];
      const paragraph = this.parseParagraph(element, styles);
      if (paragraph) paragraphs.push(paragraph);
    }

    // 如果没有找到带命名空间的段落，尝试不带命名空间的
    if (paragraphElements.length === 0) {
      const paragraphElementsNoNs = doc.getElementsByTagName('p');
      for (let i = 0; i < paragraphElementsNoNs.length; i++) {
        const element = paragraphElementsNoNs[i];
        const paragraph = this.parseParagraph(element, styles);
        if (paragraph) paragraphs.push(paragraph);
      }
    }

    return { paragraphs, tables };
  }
  
  parseParagraph(element, styles) {
    const runs = this.getTextRuns(element);
    
    // 如果段落为空，返回null
    if (runs.length === 0) return null;
    
    return {
      styleId: undefined,
      indent: {},
      spacing: {},
      alignment: 'left',
      runs
    };
  }
  
  getTextRuns(element) {
    const runs = [];
    
    // 查找w:r和r元素（带和不带命名空间）
    const wRElements = element.getElementsByTagName('w:r');
    const rElements = element.getElementsByTagName('r');
    const allRElements = [...Array.from(wRElements), ...Array.from(rElements)];
    
    for (const r of allRElements) {
      // 查找w:t和t元素（带和不带命名空间）
      const wTElements = r.getElementsByTagName('w:t');
      const tElements = r.getElementsByTagName('t');
      const allTElements = [...Array.from(wTElements), ...Array.from(tElements)];
      
      for (const t of allTElements) {
        const text = t.textContent || '';
        if (text) {
          runs.push({
            text,
            bold: false,
            italic: false,
            underline: false,
            strike: false,
            font: 'Arial',
            color: '#000000',
            sz: 12
          });
        }
      }
    }
    
    return runs;
  }
}

// 模拟DOM环境
if (typeof global !== 'undefined') {
  global.DOMParser = DOMParser;
}

async function testParagraphParsing() {
  console.log('=== 段落解析调试测试 ===\n');
  
  const testFile = 'templates_meeting-agenda-template_Double stripe agenda.docx';
  console.log(`📁 测试文件: ${testFile}`);
  
  try {
    const buffer = fs.readFileSync(testFile);
    const parser = new DocxParser();
    
    // 解析文档
    const result = await parser.parseDocx(buffer);
    
    console.log(`\n📊 解析结果概览:`);
    console.log(`- 段落数量: ${result.paragraphs.length}`);
    console.log(`- 表格数量: ${result.tables.length}`);
    console.log(`- 图片数量: ${result.floatingImages.length}`);
    
    // 如果没有段落，进行详细调试
    if (result.paragraphs.length === 0) {
      console.log('\n🔍 进行详细调试...');
      
      // 直接访问内部XML进行调试
      const documentXml = parser.documentXml;
      if (documentXml) {
        console.log(`\n📄 Document XML 长度: ${documentXml.length}`);
        
        const domParser = new DOMParser();
        const doc = domParser.parseFromString(documentXml, 'text/xml');
        
        // 检查段落元素
        const wPElements = doc.getElementsByTagName('w:p');
        const pElements = doc.getElementsByTagName('p');
        
        console.log(`\n🔍 段落元素统计:`);
        console.log(`- w:p 元素数量: ${wPElements.length}`);
        console.log(`- p 元素数量: ${pElements.length}`);
        
        if (wPElements.length > 0) {
          console.log('\n📝 检查前3个w:p元素:');
          for (let i = 0; i < Math.min(3, wPElements.length); i++) {
            const p = wPElements[i];
            console.log(`\n段落 ${i + 1}:`);
            console.log(`- 标签名: ${p.tagName}`);
            console.log(`- 子元素数量: ${p.childNodes.length}`);
            
            // 检查w:r元素
            const wRElements = p.getElementsByTagName('w:r');
            const rElements = p.getElementsByTagName('r');
            console.log(`- w:r 元素数量: ${wRElements.length}`);
            console.log(`- r 元素数量: ${rElements.length}`);
            
            // 检查文本内容
            if (wRElements.length > 0) {
              console.log('- w:r 元素内容:');
              for (let j = 0; j < Math.min(2, wRElements.length); j++) {
                const r = wRElements[j];
                const wTElements = r.getElementsByTagName('w:t');
                const tElements = r.getElementsByTagName('t');
                console.log(`  Run ${j + 1}: w:t=${wTElements.length}, t=${tElements.length}`);
                
                if (wTElements.length > 0) {
                  console.log(`    文本: "${wTElements[0].textContent || ''}"`);  
                }
                if (tElements.length > 0) {
                  console.log(`    文本(t): "${tElements[0].textContent || ''}"`);  
                }
              }
            }
            
            // 直接获取文本内容
            const textContent = p.textContent || '';
            console.log(`- 直接文本内容: "${textContent.substring(0, 100)}${textContent.length > 100 ? '...' : ''}"`);  
          }
        }
      }
    } else {
      console.log('\n✅ 找到段落内容!');
      console.log('前3个段落:');
      for (let i = 0; i < Math.min(3, result.paragraphs.length); i++) {
        const p = result.paragraphs[i];
        const text = p.runs.map(r => r.text).join('');
        console.log(`${i + 1}. "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`);  
      }
    }
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error(error.stack);
  }
}

testParagraphParsing();
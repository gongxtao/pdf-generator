const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('xmldom');

// 简化的DocxParser类，添加详细调试输出
class DebugDocxParser {
  constructor() {
    this.documentXml = '';
  }
  
  async parseDocx(buffer) {
    console.log('🔍 开始解析DOCX文件...');
    
    // 解压文件
    const zip = await JSZip.loadAsync(buffer);
    const documentXmlFile = zip.file('word/document.xml');
    
    if (!documentXmlFile) {
      console.log('❌ 未找到document.xml文件');
      return { paragraphs: [], tables: [] };
    }
    
    this.documentXml = await documentXmlFile.async('string');
    console.log(`📄 document.xml长度: ${this.documentXml.length} 字符`);
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.documentXml, 'text/xml');
    
    console.log('🔍 DOM解析完成');
    console.log(`- 根元素: ${doc.documentElement ? doc.documentElement.tagName : '无'}`);
    
    // 调用extractParagraphsAndTables
    console.log('\n📋 调用extractParagraphsAndTables...');
    const result = this.extractParagraphsAndTables(doc, {});
    
    console.log(`✅ extractParagraphsAndTables返回:`);
    console.log(`- 段落数量: ${result.paragraphs.length}`);
    console.log(`- 表格数量: ${result.tables.length}`);
    
    return result;
  }
  
  extractParagraphsAndTables(doc, styles) {
    console.log('\n🔍 extractParagraphsAndTables开始执行...');
    
    const paragraphs = [];
    const tables = [];

    // 搜索所有段落元素
    console.log('🔍 搜索w:p元素...');
    const paragraphElements = doc.getElementsByTagName('w:p');
    console.log(`找到 ${paragraphElements.length} 个w:p元素`);
    
    for (let i = 0; i < paragraphElements.length; i++) {
      const element = paragraphElements[i];
      console.log(`\n📝 处理第${i+1}个段落元素...`);
      
      const paragraph = this.parseParagraph(element, styles);
      console.log(`parseParagraph返回: ${paragraph ? '有效对象' : 'null'}`);
      
      if (paragraph !== null) {
        paragraphs.push(paragraph);
        console.log(`✅ 段落已添加，当前段落总数: ${paragraphs.length}`);
      } else {
        console.log(`❌ 段落为null，未添加`);
      }
    }

    // 如果没有找到带命名空间的段落，尝试不带命名空间的
    if (paragraphElements.length === 0) {
      console.log('🔍 未找到w:p元素，尝试搜索p元素...');
      const paragraphElementsNoNs = doc.getElementsByTagName('p');
      console.log(`找到 ${paragraphElementsNoNs.length} 个p元素`);
      
      for (let i = 0; i < paragraphElementsNoNs.length; i++) {
        const element = paragraphElementsNoNs[i];
        const paragraph = this.parseParagraph(element, styles);
        if (paragraph !== null) paragraphs.push(paragraph);
      }
    }

    console.log(`\n📊 最终结果:`);
    console.log(`- 处理的段落元素: ${paragraphElements.length}`);
    console.log(`- 有效段落数量: ${paragraphs.length}`);
    
    return { paragraphs, tables };
  }
  
  parseParagraph(element, styles) {
    console.log('    🔍 parseParagraph开始...');
    
    // 获取文本运行
    const runs = this.getTextRuns(element);
    console.log(`    📝 getTextRuns返回 ${runs.length} 个runs`);
    
    if (runs.length > 0) {
      console.log(`    📝 第一个run的文本: "${runs[0].text}"`);
    }
    
    // 创建段落对象
    const paragraph = {
      styleId: undefined,
      indent: {},
      spacing: {},
      alignment: 'left',
      runs: runs
    };
    
    console.log(`    ✅ parseParagraph返回段落对象`);
    return paragraph;
  }
  
  getTextRuns(element) {
    console.log('      🔍 getTextRuns开始...');
    const runs = [];
    
    // 查找所有文本运行元素
    let runElements = element.getElementsByTagName('w:r');
    if (runElements.length === 0) {
      runElements = element.getElementsByTagName('r');
    }
    
    console.log(`      📝 找到 ${runElements.length} 个run元素`);
    
    for (let i = 0; i < runElements.length; i++) {
      const runElement = runElements[i];
      
      // 查找文本元素
      let textElements = runElement.getElementsByTagName('w:t');
      if (textElements.length === 0) {
        textElements = runElement.getElementsByTagName('t');
      }
      
      console.log(`      📝 run ${i+1} 有 ${textElements.length} 个文本元素`);
      
      for (let j = 0; j < textElements.length; j++) {
        const textElement = textElements[j];
        const text = textElement.textContent || textElement.nodeValue || '';
        
        console.log(`      📝 文本内容: "${text}"`);
        
        if (text !== null && text !== undefined) {
          runs.push({
            text: text,
            bold: false,
            italic: false,
            color: '#000000',
            font: 'Arial',
            sz: 12
          });
        }
      }
    }
    
    console.log(`      ✅ getTextRuns返回 ${runs.length} 个runs`);
    return runs;
  }
}

async function testParser() {
  console.log('=== 测试DocxParser调试版本 ===\n');
  
  const filePath = 'templates_meeting-agenda-template_Double stripe agenda.docx';
  const buffer = fs.readFileSync(filePath);
  
  console.log(`📁 文件: ${filePath}`);
  console.log(`📊 文件大小: ${buffer.length} bytes\n`);
  
  const parser = new DebugDocxParser();
  const result = await parser.parseDocx(buffer);
  
  console.log('\n📋 最终解析结果:');
  console.log(`- 段落数量: ${result.paragraphs.length}`);
  console.log(`- 表格数量: ${result.tables.length}`);
  
  if (result.paragraphs.length > 0) {
    console.log('\n📝 前3个段落的内容:');
    for (let i = 0; i < Math.min(3, result.paragraphs.length); i++) {
      const paragraph = result.paragraphs[i];
      const text = paragraph.runs.map(run => run.text).join('');
      console.log(`  ${i+1}. "${text}"`);
    }
  }
  
  console.log('\n✅ 测试完成!');
}

testParser().catch(console.error);
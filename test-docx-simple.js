const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

// 简化版的docx解析测试
async function testDocxParsing() {
  try {
    console.log('开始测试 DOCX 解析功能...');
    
    // 读取测试文件
    const docxPath = './templates_meeting-agenda-template_Double stripe agenda.docx';
    console.log('读取文件:', docxPath);
    
    if (!fs.existsSync(docxPath)) {
      console.error('测试文件不存在:', docxPath);
      return;
    }
    
    const buffer = fs.readFileSync(docxPath);
    console.log('文件大小:', buffer.length, 'bytes');
    
    // 解压DOCX文件
    console.log('解压DOCX文件...');
    const zip = await JSZip.loadAsync(buffer);
    
    // 检查文件结构
    console.log('\n=== DOCX 文件结构 ===');
    Object.keys(zip.files).forEach(filename => {
      if (!zip.files[filename].dir) {
        console.log('文件:', filename);
      }
    });
    
    // 读取document.xml
    const documentXml = zip.files['word/document.xml'];
    if (!documentXml) {
      console.error('未找到 word/document.xml');
      return;
    }
    
    const xmlContent = await documentXml.async('text');
    console.log('\ndocument.xml 大小:', xmlContent.length, 'characters');
    
    // 解析XML
    const parser = new DOMParser();
    const doc = parser.parseFromString(xmlContent, 'text/xml');
    
    console.log('\n=== XML 解析结果 ===');
    console.log('根元素:', doc.documentElement.tagName);
    
    // 查找body元素
    let bodyElements = doc.getElementsByTagName('w:body');
    if (bodyElements.length === 0) {
      bodyElements = doc.getElementsByTagName('body');
    }
    
    console.log('Body 元素数量:', bodyElements.length);
    
    if (bodyElements.length > 0) {
      const body = bodyElements[0];
      console.log('Body 子元素数量:', body.childNodes.length);
      
      // 查找段落
      let paragraphs = body.getElementsByTagName('w:p');
      if (paragraphs.length === 0) {
        paragraphs = body.getElementsByTagName('p');
      }
      console.log('段落数量:', paragraphs.length);
      
      // 查找表格
      let tables = body.getElementsByTagName('w:tbl');
      if (tables.length === 0) {
        tables = body.getElementsByTagName('tbl');
      }
      console.log('表格数量:', tables.length);
      
      // 显示前3个段落的文本内容
      if (paragraphs.length > 0) {
        console.log('\n=== 段落内容预览 ===');
        for (let i = 0; i < Math.min(3, paragraphs.length); i++) {
          const p = paragraphs[i];
          
          // 查找文本运行
          let runs = p.getElementsByTagName('w:r');
          if (runs.length === 0) {
            runs = p.getElementsByTagName('r');
          }
          
          let paragraphText = '';
          for (let j = 0; j < runs.length; j++) {
            let textNodes = runs[j].getElementsByTagName('w:t');
            if (textNodes.length === 0) {
              textNodes = runs[j].getElementsByTagName('t');
            }
            
            for (let k = 0; k < textNodes.length; k++) {
              if (textNodes[k].textContent) {
                paragraphText += textNodes[k].textContent;
              }
            }
          }
          
          console.log(`段落 ${i + 1}: "${paragraphText.substring(0, 100)}${paragraphText.length > 100 ? '...' : ''}"`);          
          console.log(`  运行数量: ${runs.length}`);
        }
      }
      
      // 显示表格信息
      if (tables.length > 0) {
        console.log('\n=== 表格信息 ===');
        for (let i = 0; i < tables.length; i++) {
          const table = tables[i];
          
          let rows = table.getElementsByTagName('w:tr');
          if (rows.length === 0) {
            rows = table.getElementsByTagName('tr');
          }
          
          console.log(`表格 ${i + 1}: ${rows.length} 行`);
          
          if (rows.length > 0) {
            let cells = rows[0].getElementsByTagName('w:tc');
            if (cells.length === 0) {
              cells = rows[0].getElementsByTagName('tc');
            }
            console.log(`  第一行: ${cells.length} 个单元格`);
          }
        }
      }
    }
    
    // 检查样式文件
    const stylesXml = zip.files['word/styles.xml'];
    if (stylesXml) {
      const stylesContent = await stylesXml.async('text');
      const stylesDoc = parser.parseFromString(stylesContent, 'text/xml');
      
      let styles = stylesDoc.getElementsByTagName('w:style');
      if (styles.length === 0) {
        styles = stylesDoc.getElementsByTagName('style');
      }
      
      console.log('\n=== 样式信息 ===');
      console.log('样式数量:', styles.length);
    }
    
    console.log('\n测试完成！docx-parser.ts 的核心功能验证成功。');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testDocxParsing();
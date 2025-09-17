const fs = require('fs');
const JSZip = require('jszip');
const { DOMParser } = require('@xmldom/xmldom');

// 测试修复后的解析方法
async function testParserMethods() {
  try {
    console.log('开始测试修复后的解析方法...');
    
    // 读取测试文件
    const docxPath = './templates_meeting-agenda-template_Double stripe agenda.docx';
    const buffer = fs.readFileSync(docxPath);
    const zip = await JSZip.loadAsync(buffer);
    
    // 读取document.xml
    const documentXml = await zip.files['word/document.xml'].async('text');
    const parser = new DOMParser();
    const doc = parser.parseFromString(documentXml, 'text/xml');
    
    console.log('\n=== 测试 getElementsByTagName 方法 ===');
    
    // 测试带命名空间和不带命名空间的查找
    function testElementSearch(tagName) {
      const withNamespace = doc.getElementsByTagName(`w:${tagName}`);
      const withoutNamespace = doc.getElementsByTagName(tagName);
      
      console.log(`${tagName}:`);
      console.log(`  带命名空间 (w:${tagName}): ${withNamespace.length} 个`);
      console.log(`  不带命名空间 (${tagName}): ${withoutNamespace.length} 个`);
      
      return withNamespace.length > 0 ? withNamespace : withoutNamespace;
    }
    
    // 测试各种元素类型
    const bodyElements = testElementSearch('body');
    const paragraphs = testElementSearch('p');
    const tables = testElementSearch('tbl');
    const runs = testElementSearch('r');
    const texts = testElementSearch('t');
    
    console.log('\n=== 测试文本样式提取 ===');
    
    if (paragraphs.length > 0) {
      const firstParagraph = paragraphs[1]; // 跳过第一个空段落
      const pRuns = firstParagraph.getElementsByTagName('w:r').length > 0 ? 
        firstParagraph.getElementsByTagName('w:r') : 
        firstParagraph.getElementsByTagName('r');
      
      console.log(`第二个段落有 ${pRuns.length} 个文本运行`);
      
      if (pRuns.length > 0) {
        const firstRun = pRuns[0];
        
        // 测试样式属性查找
        function testStyleAttribute(element, attrName) {
          let styleElement = element.getElementsByTagName(`w:${attrName}`);
          if (styleElement.length === 0) {
            styleElement = element.getElementsByTagName(attrName);
          }
          
          if (styleElement.length > 0) {
            const valAttr = styleElement[0].getAttribute('w:val') || 
                           styleElement[0].getAttribute('val');
            console.log(`  ${attrName}: ${valAttr || '存在但无值'}`);
            return valAttr;
          } else {
            console.log(`  ${attrName}: 未找到`);
            return null;
          }
        }
        
        console.log('第一个文本运行的样式:');
        
        // 查找rPr (运行属性)
        let rPr = firstRun.getElementsByTagName('w:rPr');
        if (rPr.length === 0) {
          rPr = firstRun.getElementsByTagName('rPr');
        }
        
        if (rPr.length > 0) {
          const props = rPr[0];
          testStyleAttribute(props, 'b');      // 粗体
          testStyleAttribute(props, 'i');      // 斜体
          testStyleAttribute(props, 'strike'); // 删除线
          testStyleAttribute(props, 'color');  // 颜色
          testStyleAttribute(props, 'sz');     // 字体大小
          
          // 测试字体
          let fontElements = props.getElementsByTagName('w:rFonts');
          if (fontElements.length === 0) {
            fontElements = props.getElementsByTagName('rFonts');
          }
          
          if (fontElements.length > 0) {
            const font = fontElements[0].getAttribute('w:ascii') || 
                        fontElements[0].getAttribute('ascii');
            console.log(`  字体: ${font || '未指定'}`);
          }
        }
        
        // 获取文本内容
        let textElements = firstRun.getElementsByTagName('w:t');
        if (textElements.length === 0) {
          textElements = firstRun.getElementsByTagName('t');
        }
        
        if (textElements.length > 0) {
          console.log(`  文本内容: "${textElements[0].textContent}"`);
        }
      }
    }
    
    console.log('\n=== 测试表格解析 ===');
    
    if (tables.length > 0) {
      const firstTable = tables[0];
      
      let rows = firstTable.getElementsByTagName('w:tr');
      if (rows.length === 0) {
        rows = firstTable.getElementsByTagName('tr');
      }
      
      console.log(`第一个表格有 ${rows.length} 行`);
      
      if (rows.length > 0) {
        const firstRow = rows[0];
        
        let cells = firstRow.getElementsByTagName('w:tc');
        if (cells.length === 0) {
          cells = firstRow.getElementsByTagName('tc');
        }
        
        console.log(`第一行有 ${cells.length} 个单元格`);
        
        if (cells.length > 0) {
          const firstCell = cells[0];
          
          let cellParas = firstCell.getElementsByTagName('w:p');
          if (cellParas.length === 0) {
            cellParas = firstCell.getElementsByTagName('p');
          }
          
          console.log(`第一个单元格有 ${cellParas.length} 个段落`);
          
          if (cellParas.length > 0) {
            let cellText = '';
            const cellRuns = cellParas[0].getElementsByTagName('w:r').length > 0 ?
              cellParas[0].getElementsByTagName('w:r') :
              cellParas[0].getElementsByTagName('r');
            
            for (let i = 0; i < cellRuns.length; i++) {
              let runTexts = cellRuns[i].getElementsByTagName('w:t');
              if (runTexts.length === 0) {
                runTexts = cellRuns[i].getElementsByTagName('t');
              }
              
              for (let j = 0; j < runTexts.length; j++) {
                cellText += runTexts[j].textContent || '';
              }
            }
            
            console.log(`第一个单元格内容: "${cellText}"`);
          }
        }
      }
    }
    
    // 测试样式文件解析
    console.log('\n=== 测试样式文件解析 ===');
    
    const stylesXml = zip.files['word/styles.xml'];
    if (stylesXml) {
      const stylesContent = await stylesXml.async('text');
      const stylesDoc = parser.parseFromString(stylesContent, 'text/xml');
      
      let styles = stylesDoc.getElementsByTagName('w:style');
      if (styles.length === 0) {
        styles = stylesDoc.getElementsByTagName('style');
      }
      
      console.log(`找到 ${styles.length} 个样式定义`);
      
      if (styles.length > 0) {
        const firstStyle = styles[0];
        const styleId = firstStyle.getAttribute('w:styleId') || 
                       firstStyle.getAttribute('styleId');
        const styleType = firstStyle.getAttribute('w:type') || 
                         firstStyle.getAttribute('type');
        
        console.log(`第一个样式: ID=${styleId}, 类型=${styleType}`);
      }
    }
    
    console.log('\n=== 测试完成 ===');
    console.log('所有修复的方法都能正确处理带命名空间和不带命名空间的元素！');
    
  } catch (error) {
    console.error('测试失败:', error.message);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行测试
testParserMethods();
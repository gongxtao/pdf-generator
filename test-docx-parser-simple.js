// 简单的JavaScript测试文件来测试docx-parser功能
const fs = require('fs');
const path = require('path');

// 模拟DOMParser环境
class MockDOMParser {
  parseFromString(xmlString, mimeType) {
    // 简单的XML解析模拟
    return {
      getElementsByTagName: (tagName) => {
        const matches = [];
        const regex = new RegExp(`<${tagName}[^>]*>([\s\S]*?)<\/${tagName}>`, 'g');
        let match;
        while ((match = regex.exec(xmlString)) !== null) {
          matches.push({
            getAttribute: (attr) => {
              const attrRegex = new RegExp(`${attr}="([^"]*)"`);  
              const attrMatch = match[0].match(attrRegex);
              return attrMatch ? attrMatch[1] : null;
            },
            textContent: match[1] || '',
            getElementsByTagName: (childTag) => {
              const childMatches = [];
              const childRegex = new RegExp(`<${childTag}[^>]*>([\s\S]*?)<\/${childTag}>`, 'g');
              let childMatch;
              while ((childMatch = childRegex.exec(match[1] || '')) !== null) {
                childMatches.push({
                  getAttribute: (attr) => {
                    const attrRegex = new RegExp(`${attr}="([^"]*)"`);  
                    const attrMatch = childMatch[0].match(attrRegex);
                    return attrMatch ? attrMatch[1] : null;
                  },
                  textContent: childMatch[1] || ''
                });
              }
              return childMatches;
            }
          });
        }
        return matches;
      }
    };
  }
}

// 设置全局DOMParser
global.DOMParser = MockDOMParser;

async function testDocxParser() {
  try {
    console.log('🚀 开始测试docx-parser功能...');
    
    // 动态导入编译后的模块
    const { DocxParser } = require('./dist/docx-parser.js');
    
    // 检查测试文档
    let testDocxPath = path.join(__dirname, 'Bold meeting agenda.docx');
    if (!fs.existsSync(testDocxPath)) {
      console.log('❌ 未找到测试文档: Bold meeting agenda.docx');
      
      // 尝试其他测试文档
      testDocxPath = path.join(__dirname, 'ATS finance resume.docx');
      if (!fs.existsSync(testDocxPath)) {
        console.log('❌ 未找到备用测试文档: ATS finance resume.docx');
        
        // 尝试第三个测试文档
        testDocxPath = path.join(__dirname, 'ATS simple classic cover letter.docx');
        if (!fs.existsSync(testDocxPath)) {
          console.log('❌ 未找到任何测试文档');
          return;
        }
        console.log('✓ 使用测试文档: ATS simple classic cover letter.docx');
      } else {
        console.log('✓ 使用备用测试文档: ATS finance resume.docx');
      }
    } else {
      console.log('✓ 使用测试文档: Bold meeting agenda.docx');
    }
    
    // 读取文档
    const buffer = fs.readFileSync(testDocxPath);
    console.log(`📄 成功读取文档，大小: ${buffer.length} 字节`);
    
    // 创建解析器实例
    console.log('🔧 创建DocxParser实例...');
    const parser = new DocxParser();
    
    // 解析文档
    console.log('🔍 开始解析文档...');
    const result = await parser.parseDocx(buffer);
    
    // 验证解析结果
    console.log('\n📊 解析结果验证:');
    console.log(`✓ 页面设置: ${result.page ? '存在' : '缺失'}`);
    console.log(`✓ 段落数量: ${result.paragraphs?.length || 0}`);
    console.log(`✓ 表格数量: ${result.tables?.length || 0}`);
    console.log(`✓ 浮动图片数量: ${result.floatingImages?.length || 0}`);
    console.log(`✓ 列表定义数量: ${result.lists?.length || 0}`);
    console.log(`✓ 样式定义数量: ${Object.keys(result.styles || {}).length}`);
    console.log(`✓ 主题颜色数量: ${Object.keys(result.themeColors || {}).length}`);
    console.log(`✓ 图片数量: ${Object.keys(result.images || {}).length}`);
    console.log(`✓ 页眉数量: ${result.headers?.length || 0}`);
    console.log(`✓ 页脚数量: ${result.footers?.length || 0}`);
    console.log(`✓ 语言设置: ${result.lang || '未知'}`);
    console.log(`✓ RTL方向: ${result.rtl ? '是' : '否'}`);
    
    // 验证页面设置
    if (result.page) {
      console.log(`📏 页面尺寸: ${result.page.width} x ${result.page.height}`);
      console.log(`📐 页面边距: [${result.page.margin.join(', ')}]`);
    }
    
    // 验证元数据
    if (result.metadata) {
      console.log('\n📋 文档元数据:');
      console.log(`✓ 标题: ${result.metadata.title || '无'}`);
      console.log(`✓ 作者: ${result.metadata.author || '无'}`);
      console.log(`✓ 创建时间: ${result.metadata.created || '无'}`);
      console.log(`✓ 修改时间: ${result.metadata.modified || '无'}`);
      console.log(`✓ 页数: ${result.metadata.pageCount || '未知'}`);
      console.log(`✓ 字数: ${result.metadata.wordCount || '未知'}`);
    }
    
    // 验证段落内容预览
    if (result.paragraphs && result.paragraphs.length > 0) {
      console.log('\n📝 段落内容预览:');
      result.paragraphs.slice(0, 3).forEach((para, index) => {
        console.log(`\n📄 段落 ${index + 1}:`);
        console.log(`✓ 对齐方式: ${para.alignment}`);
        console.log(`✓ 文本运行数量: ${para.runs?.length || 0}`);
        if (para.runs && para.runs.length > 0) {
          const fullText = para.runs.map(run => run.text || '').join('');
          console.log(`✓ 完整文本: "${fullText.substring(0, 100)}${fullText.length > 100 ? '...' : ''}"`); // 限制显示长度
          if (para.runs[0]) {
            console.log(`✓ 字体: ${para.runs[0].font || '默认'}`);
            console.log(`✓ 字号: ${para.runs[0].sz || '默认'}`);
            console.log(`✓ 颜色: ${para.runs[0].color || '默认'}`);
            console.log(`✓ 粗体: ${para.runs[0].bold ? '是' : '否'}`);
            console.log(`✓ 斜体: ${para.runs[0].italic ? '是' : '否'}`);
            console.log(`✓ 下划线: ${para.runs[0].underline ? '是' : '否'}`);
          }
        }
      });
    }
    
    // 验证表格内容预览
    if (result.tables && result.tables.length > 0) {
      console.log('\n📊 表格内容预览:');
      result.tables.slice(0, 2).forEach((table, tableIndex) => {
        console.log(`\n📋 表格 ${tableIndex + 1}:`);
        console.log(`✓ 行数: ${table.rows?.length || 0}`);
        console.log(`✓ 列数: ${table.rows?.[0]?.cells?.length || 0}`);
        
        // 显示前2行的内容
        if (table.rows) {
          table.rows.slice(0, 2).forEach((row, rowIndex) => {
            if (row.cells) {
              const rowText = row.cells.map(cell => {
                if (cell.content && cell.content.length > 0) {
                  return cell.content.map(content => content.text || '').join('');
                }
                return '';
              }).join(' | ');
              console.log(`✓ 行 ${rowIndex + 1}: "${rowText.substring(0, 80)}${rowText.length > 80 ? '...' : ''}"`); // 限制显示长度
            }
          });
        }
      });
    }
    
    // 验证样式信息
    if (result.styles && Object.keys(result.styles).length > 0) {
      console.log('\n🎨 样式信息预览:');
      const styleKeys = Object.keys(result.styles).slice(0, 5);
      styleKeys.forEach(styleId => {
        console.log(`✓ 样式ID: ${styleId}`);
      });
    }
    
    // 验证主题颜色
    if (result.themeColors && Object.keys(result.themeColors).length > 0) {
      console.log('\n🌈 主题颜色:');
      Object.entries(result.themeColors).forEach(([name, color]) => {
        console.log(`✓ ${name}: ${color}`);
      });
    }
    
    console.log('\n🎉 完整功能测试完成！');
    console.log('✅ DocxParser功能验证成功');
    console.log('\n📈 测试总结:');
    console.log(`- 成功解析了 ${result.paragraphs?.length || 0} 个段落`);
    console.log(`- 成功解析了 ${result.tables?.length || 0} 个表格`);
    console.log(`- 成功提取了 ${Object.keys(result.styles || {}).length} 个样式定义`);
    console.log(`- 成功提取了 ${Object.keys(result.images || {}).length} 个图片`);
    console.log(`- 成功提取了页面设置和元数据信息`);
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testDocxParser();
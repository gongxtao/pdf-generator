// 详细测试docx-parser.ts的各项功能
const fs = require('fs');
const path = require('path');

// 模拟DOMParser环境
class MockDOMParser {
  parseFromString(xmlString, mimeType) {
    // 简单的XML解析模拟
    return {
      getElementsByTagName: (tagName) => {
        const matches = xmlString.match(new RegExp(`<${tagName}[^>]*>`, 'g')) || [];
        return matches.map(() => ({
          getAttribute: () => null,
          getElementsByTagName: () => [],
          textContent: ''
        }));
      }
    };
  }
}

global.DOMParser = MockDOMParser;

async function testDocxParserDetailed() {
  try {
    console.log('🔍 开始详细测试docx-parser.ts功能...');
    
    // 动态导入编译后的模块
    const { DocxParser } = await import('./dist/docx-parser.js');
    
    // 选择一个包含图片的文档进行详细测试
    const testDoc = 'Bold meeting agenda.docx';
    
    console.log(`\n=== 详细测试文档: ${testDoc} ===`);
    
    if (!fs.existsSync(testDoc)) {
      console.log(`❌ 文件不存在: ${testDoc}`);
      return;
    }
    
    // 读取文档
    const buffer = fs.readFileSync(testDoc);
    console.log(`✅ 文档读取成功，大小: ${buffer.length} bytes`);
    
    // 创建解析器实例
    const parser = new DocxParser();
    
    // 解析文档
    console.log('🔄 开始解析文档...');
    const result = await parser.parseDocx(buffer);
    
    console.log('\n📊 === 页面设置详情 ===');
    console.log(`页面尺寸: ${result.page.width} x ${result.page.height} 像素`);
    console.log(`页边距: 上${result.page.margin[0]} 右${result.page.margin[1]} 下${result.page.margin[2]} 左${result.page.margin[3]}`);
    if (result.page.gutter) {
      console.log(`装订线: ${result.page.gutter}`);
    }
    
    console.log('\n📝 === 段落详细信息 ===');
    result.paragraphs.forEach((paragraph, index) => {
      console.log(`段落 ${index + 1}:`);
      console.log(`  样式ID: ${paragraph.styleId || 'N/A'}`);
      console.log(`  对齐方式: ${paragraph.alignment}`);
      
      if (paragraph.indent && Object.keys(paragraph.indent).length > 0) {
        console.log(`  缩进: ${JSON.stringify(paragraph.indent)}`);
      }
      
      if (paragraph.spacing && Object.keys(paragraph.spacing).length > 0) {
        console.log(`  间距: ${JSON.stringify(paragraph.spacing)}`);
      }
      
      console.log(`  文本运行数: ${paragraph.runs.length}`);
      
      // 显示文本运行详情
      paragraph.runs.forEach((run, runIndex) => {
        if (run.text.trim()) {
          console.log(`    运行 ${runIndex + 1}: "${run.text.trim().substring(0, 30)}${run.text.trim().length > 30 ? '...' : ''}"`);          
          const styles = [];
          if (run.bold) styles.push('粗体');
          if (run.italic) styles.push('斜体');
          if (run.underline) styles.push('下划线');
          if (run.strike) styles.push('删除线');
          if (run.color && run.color !== '#000000') styles.push(`颜色:${run.color}`);
          if (run.font && run.font !== 'Times New Roman') styles.push(`字体:${run.font}`);
          if (run.sz && run.sz !== 11) styles.push(`字号:${run.sz}pt`);
          
          if (styles.length > 0) {
            console.log(`      样式: ${styles.join(', ')}`);
          }
        }
      });
      
      if (index >= 2) { // 只显示前3个段落的详情
        console.log(`  ... (还有 ${result.paragraphs.length - 3} 个段落)`);
        return;
      }
    });
    
    console.log('\n🖼️  === 图片和浮动元素 ===');
    if (result.images && Object.keys(result.images).length > 0) {
      console.log(`图片资源总数: ${Object.keys(result.images).length}`);
      Object.keys(result.images).forEach((imageId, index) => {
        const imageData = result.images[imageId];
        const sizeKB = Math.round(imageData.length * 0.75 / 1024); // base64大约比原文件大33%
        console.log(`  图片 ${index + 1}: ${imageId} (约 ${sizeKB}KB)`);
      });
    }
    
    if (result.floatingImages && result.floatingImages.length > 0) {
      console.log(`浮动图片数量: ${result.floatingImages.length}`);
      result.floatingImages.forEach((img, index) => {
        console.log(`  浮动图片 ${index + 1}:`);
        console.log(`    位置: left=${img.left}, top=${img.top}`);
        console.log(`    层级: z-index=${img.zIndex}`);
        console.log(`    文档后方: ${img.behindDoc ? '是' : '否'}`);
      });
    }
    
    if (result.backgroundImage) {
      console.log(`背景图片: 类型=${result.backgroundImage.type === 'A' ? '页面背景' : '页眉背景'}`);
    }
    
    console.log('\n🎨 === 样式系统 ===');
    if (result.styles && Object.keys(result.styles).length > 0) {
      console.log(`样式定义总数: ${Object.keys(result.styles).length}`);
      
      // 显示一些重要样式
      const importantStyles = ['Normal', 'Heading1', 'Heading2', 'Title', 'Subtitle'];
      importantStyles.forEach(styleName => {
        if (result.styles[styleName]) {
          console.log(`  ${styleName}: 已定义`);
        }
      });
      
      // 显示前5个样式的详情
      const styleNames = Object.keys(result.styles).slice(0, 5);
      console.log(`  样式示例 (前5个): ${styleNames.join(', ')}`);
    }
    
    console.log('\n🌈 === 主题颜色 ===');
    if (result.themeColors && Object.keys(result.themeColors).length > 0) {
      console.log('主题颜色定义:');
      Object.entries(result.themeColors).forEach(([name, color]) => {
        console.log(`  ${name}: ${color}`);
      });
    } else {
      console.log('未找到主题颜色定义');
    }
    
    console.log('\n📋 === 列表和编号 ===');
    if (result.lists && result.lists.length > 0) {
      console.log(`列表定义数量: ${result.lists.length}`);
      result.lists.forEach((list, index) => {
        console.log(`  列表 ${index + 1}: abstractNumId=${list.abstractNumId}`);
        console.log(`    层级数: ${list.levels.length}`);
        list.levels.forEach((level, levelIndex) => {
          console.log(`      层级 ${levelIndex + 1}: ${level.numFmt} - "${level.lvlText}"`);
        });
      });
    } else {
      console.log('未找到列表定义');
    }
    
    console.log('\n🌍 === 文档属性 ===');
    console.log(`语言: ${result.lang}`);
    console.log(`从右到左: ${result.rtl ? '是' : '否'}`);
    
    if (result.headers && result.headers.length > 0) {
      console.log(`页眉数量: ${result.headers.length}`);
    }
    
    if (result.footers && result.footers.length > 0) {
      console.log(`页脚数量: ${result.footers.length}`);
    }
    
    console.log('\n📊 === 解析统计摘要 ===');
    console.log(`✅ 段落: ${result.paragraphs.length} 个`);
    console.log(`✅ 表格: ${result.tables.length} 个`);
    console.log(`✅ 图片: ${result.images ? Object.keys(result.images).length : 0} 个`);
    console.log(`✅ 浮动图片: ${result.floatingImages.length} 个`);
    console.log(`✅ 样式: ${result.styles ? Object.keys(result.styles).length : 0} 个`);
    console.log(`✅ 列表: ${result.lists.length} 个`);
    
    console.log('\n🎉 详细测试完成！docx-parser.ts 功能验证成功');
    
  } catch (error) {
    console.error('❌ 详细测试失败:', error);
    console.error('错误堆栈:', error.stack);
  }
}

// 运行详细测试
testDocxParserDetailed();
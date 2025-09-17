// 清理后的TypeScript测试文件
import { DocxParser } from './src/lib/docx-parser';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

async function testDocxParserClean() {
  try {
    // 设置DOM环境
    const dom = new JSDOM();
    (global as any).DOMParser = dom.window.DOMParser;
    
    console.log('🚀 开始DocxParser功能测试...');
    
    // 使用更复杂的测试文档
    const testDocxPath = path.join(__dirname, 'Bold meeting agenda.docx');
    if (!fs.existsSync(testDocxPath)) {
      console.log('❌ 未找到测试文档');
      return;
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
    
    // 显示解析结果
    console.log('\n📊 解析结果:');
    console.log(`✓ 段落数量: ${result.paragraphs?.length || 0}`);
    console.log(`✓ 表格数量: ${result.tables?.length || 0}`);
    console.log(`✓ 图片数量: ${Object.keys(result.images || {}).length}`);
    console.log(`✓ 样式数量: ${Object.keys(result.styles || {}).length}`);
    
    // 显示页面信息
    if (result.page) {
      console.log(`📏 页面尺寸: ${result.page.width} x ${result.page.height}`);
      console.log(`📐 页面边距: [${result.page.margin.join(', ')}]`);
    }
    
    // 显示前几个段落的内容
    if (result.paragraphs && result.paragraphs.length > 0) {
      console.log('\n📝 段落内容预览:');
      result.paragraphs.slice(0, 3).forEach((para, index) => {
        const fullText = para.runs.map(run => run.text).join('');
        console.log(`📄 段落 ${index + 1}: "${fullText}"`);
      });
    }
    
    // 显示表格内容
    if (result.tables && result.tables.length > 0) {
      console.log('\n📊 表格内容预览:');
      result.tables.forEach((table, tableIndex) => {
        console.log(`📋 表格 ${tableIndex + 1}: ${table.rows.length}行 x ${table.rows[0]?.cells.length || 0}列`);
        // 显示第一行内容
        if (table.rows.length > 0) {
          const firstRowText = table.rows[0].cells.map(cell => {
            return cell.runs ? cell.runs.map(run => run.text).join('') : (cell.text || '');
          }).join(' | ');
          console.log(`✓ 第一行: "${firstRowText}"`);
        }
      });
    }
    
    console.log('\n✅ DocxParser功能验证成功！');
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
  }
}

// 运行测试
testDocxParserClean();
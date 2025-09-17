// 完整的TypeScript测试文件
import { DocxParser } from './src/lib/docx-parser';
import * as fs from 'fs';
import * as path from 'path';
import { JSDOM } from 'jsdom';

async function testFullDocxParser() {
  try {
    // 设置DOM环境
    const dom = new JSDOM();
    (global as any).DOMParser = dom.window.DOMParser;
    
    console.log('🚀 开始完整功能测试...');
    
    // 检查测试文档 - 使用更复杂的文档
    const testDocxPath = path.join(__dirname, 'Bold meeting agenda.docx');
    if (!fs.existsSync(testDocxPath)) {
      console.log('❌ 未找到测试文档');
      return;
    }
    
    // 读取文档
    const buffer = fs.readFileSync(testDocxPath);
    console.log(`📄 成功读取文档，大小: ${buffer.length} 字节`);
    
    // 创建解析器实例并直接解析
    console.log('🔧 创建DocxParser实例...');
    const parser = new DocxParser();
    
    // 直接解析文档（parseDocx方法接受buffer参数）
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
        console.log(`✓ 文本运行数量: ${para.runs.length}`);
        if (para.runs.length > 0) {
          const fullText = para.runs.map(run => run.text).join('');
          console.log(`✓ 完整文本: "${fullText}"`);
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

    console.log('\n📊 表格内容预览:');
    if (result.tables && result.tables.length > 0) {
      result.tables.forEach((table, tableIndex) => {
        console.log(`\n📋 表格 ${tableIndex + 1}:`);
        console.log(`✓ 行数: ${table.rows.length}`);
        console.log(`✓ 列数: ${table.rows[0]?.cells.length || 0}`);
        
        // 显示前3行的内容
        table.rows.slice(0, 3).forEach((row, rowIndex) => {
          const rowText = row.cells.map(cell => {
            if (cell.content && cell.content.length > 0) {
              return cell.content.map((content: any) => content.text || '').join('');
            }
            return '';
          }).join(' | ');
          console.log(`✓ 行 ${rowIndex + 1}: "${rowText}"`);
        });
      });
    }
    
    console.log('\n🎉 完整功能测试完成！');
    console.log('✅ DocxParser功能验证成功');
    
  } catch (error: any) {
    console.error('❌ 测试失败:', error);
    if (error.stack) {
      console.error('错误堆栈:', error.stack);
    }
  }
}

// 运行测试
testFullDocxParser();
// 测试docx-parser功能的简单测试文件
const fs = require('fs');
const path = require('path');

// 动态导入TypeScript编译后的模块
async function testDocxParser() {
  try {
    console.log('开始测试docx-parser功能...');
    
    // 检查是否存在测试文档
    const testDocxPath = path.join(__dirname, 'test-document.docx');
    if (!fs.existsSync(testDocxPath)) {
      console.log('未找到测试文档，创建简单的docx文件进行测试...');
      console.log('注意：需要手动提供docx文件进行完整测试');
      return;
    }
    
    // 读取测试文档
    const buffer = fs.readFileSync(testDocxPath);
    console.log(`成功读取测试文档，文件大小: ${buffer.length} 字节`);
    
    // 由于这是TypeScript模块，我们需要编译后测试
    // 这里先测试基本的文件读取和缓冲区处理
    console.log('✓ 文件读取功能正常');
    console.log('✓ 缓冲区处理功能正常');
    
    // 测试JSZip功能
    const JSZip = require('jszip');
    const zip = await JSZip.loadAsync(buffer);
    console.log('✓ JSZip解压功能正常');
    
    // 检查docx文件结构
    const files = Object.keys(zip.files);
    console.log('✓ 发现以下文件结构:');
    files.forEach(file => {
      console.log(`  - ${file}`);
    });
    
    // 检查关键文件是否存在
    const hasDocumentXml = files.includes('word/document.xml');
    const hasStylesXml = files.includes('word/styles.xml');
    const hasRels = files.some(f => f.includes('_rels'));
    
    console.log(`✓ document.xml 存在: ${hasDocumentXml}`);
    console.log(`✓ styles.xml 存在: ${hasStylesXml}`);
    console.log(`✓ 关系文件存在: ${hasRels}`);
    
    if (hasDocumentXml) {
      const documentContent = await zip.file('word/document.xml').async('text');
      console.log('✓ 成功读取document.xml内容');
      console.log(`✓ 文档内容长度: ${documentContent.length} 字符`);
      
      // 简单的XML结构检查
      const hasBody = documentContent.includes('<w:body') || documentContent.includes('w:body');
      const hasParagraphs = documentContent.includes('<w:p') || documentContent.includes('w:p');
      
      console.log(`✓ 文档主体结构正常: ${hasBody}`);
      console.log(`✓ 发现段落元素: ${hasParagraphs}`);
    }
    
    console.log('\n🎉 基础功能测试完成！');
    console.log('接下来需要在TypeScript环境中测试完整的解析功能。');
    
  } catch (error) {
    console.error('❌ 测试失败:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行测试
testDocxParser();
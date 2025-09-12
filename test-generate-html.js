// 测试generateHtmlAction接口的简单脚本
// 注意：这个测试需要配置REPLICATE_API_TOKEN环境变量

const { generateHtmlAction } = require('./src/lib/generate-html.ts');

async function testGenerateHtml() {
  console.log('开始测试generateHtmlAction接口...');
  
  // 测试输入数据
  const testInput = {
    input: '这是一个测试文档，包含标题和段落内容。请生成一个美观的HTML页面。',
    extra: []
  };
  
  try {
    // 调用接口
    const result = await generateHtmlAction(testInput, 'chatgpt-4o');
    
    console.log('测试结果:');
    console.log('成功:', result.success);
    console.log('内容长度:', result.content.length);
    console.log('内容预览:', result.content.substring(0, 200) + '...');
    
    if (result.success) {
      console.log('✅ 接口测试成功！');
    } else {
      console.log('❌ 接口测试失败:', result.content);
    }
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error.message);
  }
}

// 运行测试
testGenerateHtml();
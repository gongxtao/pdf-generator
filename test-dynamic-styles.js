// 动态样式系统测试脚本
// 在浏览器控制台中运行此脚本来测试功能

// 模拟导入HTML样式提取器函数（在实际环境中这些函数会从模块中导入）
const testDynamicStyles = async () => {
  console.log('🧪 开始测试动态样式系统...');
  
  try {
    // 读取测试HTML文件
    const response = await fetch('/test-styles.html');
    const htmlContent = await response.text();
    
    console.log('📄 HTML文件读取成功，长度:', htmlContent.length);
    
    // 测试样式提取
    const parser = new DOMParser();
    const doc = parser.parseFromString(htmlContent, 'text/html');
    
    // 检查样式标签
    const styleTags = doc.querySelectorAll('style');
    console.log('🎨 找到样式标签数量:', styleTags.length);
    
    // 检查外部样式表
    const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
    console.log('🔗 找到外部样式表数量:', linkTags.length);
    
    // 检查内联样式
    const elementsWithStyle = doc.querySelectorAll('[style]');
    console.log('✨ 找到内联样式元素数量:', elementsWithStyle.length);
    
    // 提取CSS内容
    let totalCSSLength = 0;
    styleTags.forEach((tag, index) => {
      const cssText = tag.textContent || '';
      totalCSSLength += cssText.length;
      console.log(`📝 样式标签 ${index + 1} CSS长度:`, cssText.length);
    });
    
    console.log('📊 总CSS内容长度:', totalCSSLength);
    
    // 检查CSS变量
    const cssText = Array.from(styleTags).map(tag => tag.textContent || '').join('\n');
    const cssVariables = cssText.match(/--[\w-]+:/g) || [];
    console.log('🔧 找到CSS变量数量:', cssVariables.length);
    console.log('🔧 CSS变量列表:', cssVariables);
    
    // 检查特殊选择器
    const pseudoSelectors = cssText.match(/::[\w-]+|:[\w-]+/g) || [];
    console.log('🎯 找到伪选择器数量:', pseudoSelectors.length);
    
    console.log('✅ 动态样式系统测试完成！');
    
    return {
      htmlLength: htmlContent.length,
      styleTags: styleTags.length,
      linkTags: linkTags.length,
      inlineStyles: elementsWithStyle.length,
      cssLength: totalCSSLength,
      cssVariables: cssVariables.length,
      pseudoSelectors: pseudoSelectors.length
    };
    
  } catch (error) {
    console.error('❌ 测试失败:', error);
    throw error;
  }
};

// 测试样式注入功能
const testStyleInjection = () => {
  console.log('💉 测试样式注入功能...');
  
  const testCSS = `
    .test-dynamic-style {
      background: linear-gradient(45deg, #ff6b6b, #4ecdc4);
      color: white;
      padding: 20px;
      border-radius: 10px;
      margin: 10px 0;
      text-align: center;
      font-weight: bold;
    }
  `;
  
  // 创建测试元素
  const testElement = document.createElement('div');
  testElement.className = 'test-dynamic-style';
  testElement.textContent = '这是动态注入样式的测试元素';
  
  // 注入样式
  const styleElement = document.createElement('style');
  styleElement.id = 'test-dynamic-styles';
  styleElement.textContent = testCSS;
  document.head.appendChild(styleElement);
  
  // 添加测试元素到页面
  document.body.appendChild(testElement);
  
  console.log('✅ 样式注入测试完成！检查页面底部的测试元素。');
  
  // 5秒后清理
  setTimeout(() => {
    testElement.remove();
    styleElement.remove();
    console.log('🧹 测试元素和样式已清理');
  }, 5000);
};

// 导出测试函数
if (typeof window !== 'undefined') {
  window.testDynamicStyles = testDynamicStyles;
  window.testStyleInjection = testStyleInjection;
  
  console.log('🚀 动态样式测试脚本已加载！');
  console.log('📋 可用的测试函数:');
  console.log('   - testDynamicStyles(): 测试样式提取功能');
  console.log('   - testStyleInjection(): 测试样式注入功能');
  console.log('💡 在控制台中运行 testDynamicStyles() 开始测试');
}

// Node.js环境导出
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    testDynamicStyles,
    testStyleInjection
  };
}
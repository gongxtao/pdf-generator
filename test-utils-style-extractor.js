// 测试utils版本的样式提取器
const fs = require('fs');
const path = require('path');
const { JSDOM } = require('jsdom');

// 模拟浏览器环境
const dom = new JSDOM('<!DOCTYPE html><html><body></body></html>');
global.window = dom.window;
global.document = dom.window.document;
global.DOMParser = dom.window.DOMParser;

// 导入样式提取器函数
const { extractStylesFromHTML, generateTiptapCSS, processHTMLForTiptap } = require('./src/utils/html-style-extractor.ts');

// 读取测试HTML文件
const testHtmlPath = path.join(__dirname, 'test-styles.html');
const testHtmlContent = fs.readFileSync(testHtmlPath, 'utf8');

console.log('=== 测试utils版本的样式提取器 ===\n');

// 测试1: 直接提取样式
console.log('1. 测试extractStylesFromHTML:');
const extractedStyles = extractStylesFromHTML(testHtmlContent);
console.log('- CSS规则数量:', extractedStyles.cssRules.length);
console.log('- 外部样式表数量:', extractedStyles.externalStylesheets.length);
console.log('- 内联样式数量:', extractedStyles.inlineStyles.size);

// 检查是否包含CSS变量
const cssContent = extractedStyles.cssRules.join('\n');
const hasVariables = cssContent.includes('--primary-color') && cssContent.includes('--secondary-color');
console.log('- 包含CSS变量:', hasVariables);

// 测试2: 生成Tiptap CSS
console.log('\n2. 测试generateTiptapCSS:');
const tiptapCSS = generateTiptapCSS(extractedStyles);
console.log('- 生成的CSS长度:', tiptapCSS.length);
console.log('- 包含.tiptap-editor作用域:', tiptapCSS.includes('.tiptap-editor'));
console.log('- 保留CSS变量定义:', tiptapCSS.includes('--primary-color'));
console.log('- 保留CSS变量使用:', tiptapCSS.includes('var(--primary-color)'));

// 测试3: 处理HTML内容
console.log('\n3. 测试processHTMLForTiptap:');
const { processedHTML, extractedStyles: processedStyles } = processHTMLForTiptap(testHtmlContent);
console.log('- 处理后HTML长度:', processedHTML.length);
console.log('- 移除了style标签:', !processedHTML.includes('<style>'));
console.log('- 移除了link标签:', !processedHTML.includes('<link'));
console.log('- 保留了内容结构:', processedHTML.includes('动态样式系统测试文档'));

// 测试4: 检查关键样式特性
console.log('\n4. 检查关键样式特性:');
const finalCSS = generateTiptapCSS(processedStyles);
console.log('- 字体导入:', finalCSS.includes('@import url'));
console.log('- 渐变背景:', finalCSS.includes('linear-gradient'));
console.log('- 伪元素:', finalCSS.includes('::after') || finalCSS.includes('::before'));
console.log('- 悬停效果:', finalCSS.includes(':hover'));
console.log('- 表格样式:', finalCSS.includes('table') || finalCSS.includes('th') || finalCSS.includes('td'));

// 输出部分生成的CSS用于检查
console.log('\n5. 生成的CSS示例（前500字符）:');
console.log(finalCSS.substring(0, 500) + '...');

console.log('\n=== 测试完成 ===');
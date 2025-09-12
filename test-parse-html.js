// 测试parseHtmlContent函数的简单脚本
// 这个脚本用来验证HTML内容提取功能是否正常工作

// 模拟parseHtmlContent函数（因为原函数在TypeScript文件中且不是导出的）
function parseHtmlContent(rawOutput) {
  // 使用正则表达式匹配```html和```之间的内容
  const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
  const match = rawOutput.match(htmlBlockRegex);
  
  if (match && match[1]) {
    // 返回提取的HTML内容，去除首尾空白字符
    return match[1].trim();
  }
  
  // 如果没有找到```html代码块，返回原始内容
  console.warn('未找到HTML代码块，返回原始内容');
  return rawOutput;
}

// 测试用例1：包含```html代码块的内容
const testInput1 = `这是一些文本内容
\`\`\`html                                                                                                                   
<!DOCTYPE html>                                                                                                                                
<html lang="zh">                                                                                                                               
<head>                                                                                                                                         
    <meta charset="UTF-8">                                                                                                                     
    <meta name="viewport" content="width=device-width, initial-scale=1.0">                                                                     
    <title>被死神吻过的差生</title>                                                                                                            
</head>                                                                                                                                        
<body>                                                                                                                                         
    <h1>测试内容</h1>                                                                                                              
</body>                                                                                                                                        
</html>                                                                                                                                        
\`\`\`
更多文本内容`;

// 测试用例2：不包含```html代码块的内容
const testInput2 = '这是普通的文本内容，没有HTML代码块';

console.log('=== 测试parseHtmlContent函数 ===\n');

console.log('测试用例1 - 包含HTML代码块:');
const result1 = parseHtmlContent(testInput1);
console.log('提取结果:');
console.log(result1);
console.log('\n' + '='.repeat(50) + '\n');

console.log('测试用例2 - 不包含HTML代码块:');
const result2 = parseHtmlContent(testInput2);
console.log('提取结果:');
console.log(result2);
console.log('\n' + '='.repeat(50) + '\n');

console.log('测试完成！');
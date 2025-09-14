/**
 * HTML样式提取和动态注入工具
 * 用于解析HTML文件中的CSS样式并在Tiptap编辑器中动态应用
 */

export interface ExtractedStyles {
  inlineStyles: string; // 内联样式
  cssRules: string[];   // CSS规则数组
  fontImports: string[]; // 字体导入
  variables: Record<string, string>; // CSS变量
}

/**
 * 从HTML字符串中提取所有样式信息
 */
export function extractStylesFromHTML(htmlContent: string): ExtractedStyles {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  const result: ExtractedStyles = {
    inlineStyles: '',
    cssRules: [],
    fontImports: [],
    variables: {}
  };

  // 1. 提取<style>标签中的CSS
  const styleTags = doc.querySelectorAll('style');
  styleTags.forEach(styleTag => {
    const cssText = styleTag.textContent || '';
    
    // 提取@import规则（字体导入）
    const importMatches = cssText.match(/@import\s+url\([^)]+\);/g);
    if (importMatches) {
      result.fontImports.push(...importMatches);
    }
    
    // 提取CSS变量（但不从CSS中移除）
    const variableMatches = cssText.match(/--[\w-]+:\s*[^;]+;/g);
    if (variableMatches) {
      variableMatches.forEach(match => {
        const [property, value] = match.split(':');
        if (property && value) {
          result.variables[property.trim()] = value.replace(';', '').trim();
        }
      });
    }
    
    // 提取CSS规则（保留变量定义）
    let cleanedCSS = cssText
      .replace(/@import\s+url\([^)]+\);/g, '') // 只移除@import
      .trim();
    
    if (cleanedCSS) {
      result.cssRules.push(cleanedCSS);
    }
  });

  // 2. 提取<link>标签中的外部样式表
  const linkTags = doc.querySelectorAll('link[rel="stylesheet"]');
  linkTags.forEach(linkTag => {
    const href = linkTag.getAttribute('href');
    if (href && href.includes('fonts.googleapis.com')) {
      result.fontImports.push(`@import url('${href}');`);
    }
  });

  // 3. 收集所有元素的内联样式
  const elementsWithStyle = doc.querySelectorAll('[style]');
  const inlineStylesMap = new Map<string, Set<string>>();
  
  elementsWithStyle.forEach(element => {
    const tagName = element.tagName.toLowerCase();
    const style = element.getAttribute('style') || '';
    
    if (!inlineStylesMap.has(tagName)) {
      inlineStylesMap.set(tagName, new Set());
    }
    inlineStylesMap.get(tagName)!.add(style);
  });

  // 将内联样式转换为CSS规则
  const inlineRules: string[] = [];
  inlineStylesMap.forEach((styles, tagName) => {
    styles.forEach(style => {
      if (style.trim()) {
        inlineRules.push(`.tiptap-editor ${tagName}[data-inline-style] { ${style} }`);
      }
    });
  });
  
  result.inlineStyles = inlineRules.join('\n');

  return result;
}

/**
 * 生成适用于Tiptap编辑器的完整CSS
 */
export function generateTiptapCSS(extractedStyles: ExtractedStyles): string {
  const cssParts: string[] = [];

  // 1. 添加字体导入（必须在最前面）
  if (extractedStyles.fontImports.length > 0) {
    cssParts.push(extractedStyles.fontImports.join('\n'));
    cssParts.push(''); // 空行分隔
  }

  // 2. 添加CSS变量定义
  if (Object.keys(extractedStyles.variables).length > 0) {
    cssParts.push('.tiptap-editor {');
    Object.entries(extractedStyles.variables).forEach(([property, value]) => {
      cssParts.push(`  ${property}: ${value};`);
    });
    cssParts.push('}');
    cssParts.push(''); // 空行分隔
  }

  // 3. 处理CSS规则，确保都应用到.tiptap-editor范围内
  extractedStyles.cssRules.forEach(rule => {
    const scopedRule = scopeCSSToTiptap(rule);
    cssParts.push(scopedRule);
  });

  // 4. 添加内联样式规则
  if (extractedStyles.inlineStyles) {
    cssParts.push(extractedStyles.inlineStyles);
  }

  return cssParts.join('\n');
}

/**
 * 将CSS规则限定在.tiptap-editor范围内
 */
function scopeCSSToTiptap(cssRule: string): string {
  // 简单的CSS规则范围限定
  // 这里可以根据需要实现更复杂的CSS解析逻辑
  
  // 处理选择器，确保都在.tiptap-editor范围内
  const lines = cssRule.split('\n');
  const processedLines = lines.map(line => {
    const trimmedLine = line.trim();
    
    // 如果是选择器行（包含{但不在字符串中）
    if (trimmedLine.includes('{') && !trimmedLine.startsWith('/*')) {
      const [selector, rest] = trimmedLine.split('{');
      const cleanSelector = selector.trim();
      
      // 如果选择器不是以.tiptap-editor开头，则添加范围限定
      if (!cleanSelector.startsWith('.tiptap-editor')) {
        // 处理多个选择器（逗号分隔）
        const selectors = cleanSelector.split(',').map(s => {
          const trimmed = s.trim();
          if (trimmed.startsWith(':') || trimmed.startsWith('::')) {
            // 伪类和伪元素
            return `.tiptap-editor${trimmed}`;
          } else if (trimmed.includes(' ')) {
            // 后代选择器
            return `.tiptap-editor ${trimmed}`;
          } else {
            // 简单选择器
            return `.tiptap-editor ${trimmed}`;
          }
        });
        return `${selectors.join(', ')} {${rest || ''}`;
      }
    }
    
    return line;
  });
  
  return processedLines.join('\n');
}

/**
 * 动态注入CSS到页面
 */
export function injectDynamicCSS(css: string, id: string = 'tiptap-dynamic-styles'): void {
  // 移除之前的动态样式
  const existingStyle = document.getElementById(id);
  if (existingStyle) {
    existingStyle.remove();
  }

  // 创建新的样式标签
  const styleElement = document.createElement('style');
  styleElement.id = id;
  styleElement.textContent = css;
  
  // 插入到head中
  document.head.appendChild(styleElement);
}

/**
 * 清理动态注入的CSS
 */
export function clearDynamicCSS(id: string = 'tiptap-dynamic-styles'): void {
  const styleElement = document.getElementById(id);
  if (styleElement) {
    styleElement.remove();
  }
}

/**
 * 处理HTML内容，为需要保持样式的元素添加标记
 */
export function processHTMLForTiptap(htmlContent: string): string {
  const parser = new DOMParser();
  const doc = parser.parseFromString(htmlContent, 'text/html');
  
  // 为有内联样式的元素添加data属性
  const elementsWithStyle = doc.querySelectorAll('[style]');
  elementsWithStyle.forEach(element => {
    element.setAttribute('data-inline-style', 'true');
  });
  
  // 返回处理后的HTML内容
  return doc.body.innerHTML;
}
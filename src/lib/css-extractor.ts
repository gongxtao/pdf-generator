/**
 * CSS样式提取器
 * 从HTML内容中提取和生成CSS样式
 */
export class CSSExtractor {
  private htmlContent: string;
  private extractedStyles: Map<string, Set<string>> = new Map();

  constructor(html: string) {
    this.htmlContent = this.cleanAndFormatHTML(html);
    this.analyzeElements();
  }

  /**
   * 分析HTML元素并提取样式信息
   */
  private analyzeElements(): void {
    // 只添加最基础的样式，完全保留Word原始格式
    this.addMinimalStyles();
  }

  /**
   * 添加最小化样式，保持Word原始外观
   */
  private addMinimalStyles(): void {
    // 完全不添加任何样式，保持Word 100%原始格式
  }

  /**
   * 添加样式到集合中
   */
  private addStyle(selector: string, styles: string[]): void {
    if (!this.extractedStyles.has(selector)) {
      this.extractedStyles.set(selector, new Set());
    }
    
    const styleSet = this.extractedStyles.get(selector)!;
    styles.forEach((style: string) => {
      styleSet.add(style);
    });
  }

  /**
   * 生成CSS字符串
   */
  public generateCSS(): string {
    // 不生成任何CSS，完全保持Word原始样式
    return '';
  }

  /**
   * 获取文档统计信息
   */
  public getDocumentStats(): {
    wordCount: number;
    paragraphCount: number;
    headingCount: number;
    tableCount: number;
    imageCount: number;
  } {
    // 移除HTML标签，计算文本内容
    const textContent = this.htmlContent.replace(/<[^>]*>/g, ' ');
    const wordCount = textContent.split(/\s+/).filter((word: string) => word.length > 0).length;
    
    // 计算各种元素数量
    const paragraphCount = (this.htmlContent.match(/<p[^>]*>/gi) || []).length;
    const headingCount = (this.htmlContent.match(/<h[1-6][^>]*>/gi) || []).length;
    const tableCount = (this.htmlContent.match(/<table[^>]*>/gi) || []).length;
    const imageCount = (this.htmlContent.match(/<img[^>]*>/gi) || []).length;
    
    return {
      wordCount,
      paragraphCount,
      headingCount,
      tableCount,
      imageCount
    };
  }

  /**
   * 清理和格式化HTML内容
   */
  private cleanAndFormatHTML(html: string): string {
    let cleanedHtml = html;
    
    // 保留原始格式，只做最小化清理
    // 移除多余的空白字符，但保持段落间距
    cleanedHtml = cleanedHtml.replace(/\n\s*\n/g, '\n');
    
    // 只清理完全空的元素（没有任何属性和内容的）
    cleanedHtml = cleanedHtml.replace(/<p>\s*<\/p>/g, '');
    cleanedHtml = cleanedHtml.replace(/<div>\s*<\/div>/g, '');
    // 保留所有带有style属性的span元素
    cleanedHtml = cleanedHtml.replace(/<span(?![^>]*style[^>]*)>\s*<\/span>/g, '');
    
    // 最小化处理，保持Word原始结构
    // 只处理图片以确保响应式显示
    cleanedHtml = this.processImages(cleanedHtml);
    
    return cleanedHtml.trim();
  }
  
  /**
   * 规范化标题结构
   */
  private normalizeHeadings(html: string): string {
    let normalized = html;
    
    // 确保标题层级正确
    const headingPattern = /<h([1-6])[^>]*>([^<]*)<\/h[1-6]>/g;
    const headings: Array<{level: number, text: string, match: string}> = [];
    
    let match;
    while ((match = headingPattern.exec(html)) !== null) {
      headings.push({
        level: parseInt(match[1]),
        text: match[2].trim(),
        match: match[0]
      });
    }
    
    // 修复标题层级跳跃
    let currentLevel = 0;
    headings.forEach((heading, index) => {
      if (heading.level > currentLevel + 1) {
        // 标题层级跳跃，调整为合适的层级
        const adjustedLevel = Math.min(heading.level, currentLevel + 1);
        const newHeading = `<h${adjustedLevel}>${heading.text}</h${adjustedLevel}>`;
        normalized = normalized.replace(heading.match, newHeading);
        currentLevel = adjustedLevel;
      } else {
        currentLevel = heading.level;
      }
    });
    
    return normalized;
  }
  
  /**
   * 改进列表结构
   */
  private improveLists(html: string): string {
    let improved = html;
    
    // 合并连续的列表项
    improved = improved.replace(/<\/ul>\s*<ul>/g, '');
    improved = improved.replace(/<\/ol>\s*<ol>/g, '');
    
    // 为嵌套列表添加适当的类
    improved = improved.replace(/<li>([^<]*)<ul>/g, '<li class="has-nested-list">$1<ul>');
    improved = improved.replace(/<li>([^<]*)<ol>/g, '<li class="has-nested-list">$1<ol>');
    
    // 为不同层级的列表项添加类
    const listItemPattern = /<li[^>]*>/g;
    let nestingLevel = 0;
    improved = improved.replace(/<ul[^>]*>|<ol[^>]*>|<\/ul>|<\/ol>|<li[^>]*>/g, (match) => {
      if (match.startsWith('<ul') || match.startsWith('<ol')) {
        nestingLevel++;
        return match;
      } else if (match === '</ul>' || match === '</ol>') {
        nestingLevel--;
        return match;
      } else if (match.startsWith('<li')) {
        if (nestingLevel > 1) {
          return `<li class="level-${nestingLevel}">`;
        }
        return match;
      }
      return match;
    });
    
    return improved;
  }
  
  /**
   * 优化表格结构
   */
  private optimizeTables(html: string): string {
    let optimized = html;
    
    // 为表格添加响应式包装器
    optimized = optimized.replace(/<table[^>]*>/g, '<div class="table-responsive"><table class="word-table">');
    optimized = optimized.replace(/<\/table>/g, '</table></div>');
    
    // 确保表格有正确的结构
    optimized = optimized.replace(/<table class="word-table">([^<]*)<tr>/g, '<table class="word-table"><tbody><tr>');
    optimized = optimized.replace(/<\/tr>([^<]*)<\/table>/g, '</tr></tbody></table>');
    
    // 智能识别表头行（多种模式）
    // 模式1：包含strong标签的行
    optimized = optimized.replace(/<tr>(<td[^>]*><strong>[^<]*<\/strong><\/td>)+<\/tr>/g, (match) => {
      const headerRow = match.replace(/<td([^>]*)>/g, '<th$1>').replace(/<\/td>/g, '</th>');
      return headerRow.replace(/<tbody><tr>/, '<thead><tr>').replace(/<\/tr>/, '</tr></thead><tbody>');
    });
    
    // 模式2：第一行且内容较短（可能是标题）
    optimized = optimized.replace(/<tbody><tr>(<td[^>]*>[^<]{1,20}<\/td>)+<\/tr>/g, (match, p1, offset) => {
      // 检查是否是第一行
      const beforeMatch = optimized.substring(0, offset);
      if (!beforeMatch.includes('<tr>')) {
        const headerRow = match.replace(/<td([^>]*)>/g, '<th$1>').replace(/<\/td>/g, '</th>');
        return headerRow.replace(/<tbody><tr>/, '<thead><tr>').replace(/<\/tr>/, '</tr></thead><tbody>');
      }
      return match;
    });
    
    // 为表格单元格添加数据属性（便于响应式处理）
    optimized = optimized.replace(/<th[^>]*>([^<]*)<\/th>/g, (match, content, offset) => {
      const columnIndex = (optimized.substring(0, offset).match(/<th/g) || []).length;
      return match.replace('<th', `<th data-column="${columnIndex}"`);
    });
    
    // 为数据单元格添加对应的标题属性
     let columnHeaders: string[] = [];
     optimized = optimized.replace(/<thead>[\s\S]*?<\/thead>/g, (headerMatch) => {
       const headers = headerMatch.match(/<th[^>]*>([^<]*)<\/th>/g) || [];
       columnHeaders = headers.map(h => h.replace(/<th[^>]*>([^<]*)<\/th>/, '$1').trim());
       return headerMatch;
     });
    
    if (columnHeaders.length > 0) {
      optimized = optimized.replace(/<tbody>([\s\S]*?)<\/tbody>/g, (tbodyMatch) => {
        return tbodyMatch.replace(/<tr>([\s\S]*?)<\/tr>/g, (rowMatch) => {
          let cellIndex = 0;
          return rowMatch.replace(/<td([^>]*)>([^<]*)<\/td>/g, (cellMatch, attrs, content) => {
            const header = columnHeaders[cellIndex] || '';
            cellIndex++;
            return `<td${attrs} data-label="${header}">${content}</td>`;
          });
        });
      });
    }
    
    return optimized;
  }
  
  /**
   * 处理图片和媒体
   */
  private processImages(html: string): string {
    let processed = html;
    
    // 最小化图片处理，保持Word原始格式
    processed = processed.replace(/<img([^>]*)>/g, (match, attrs) => {
      let newAttrs = attrs;
      
      // 只添加基本的响应式支持，不改变原始样式
      if (!attrs.includes('style=')) {
        newAttrs += ' style="max-width: 100%; height: auto;"';
      } else {
        // 如果已有style属性，在其中添加响应式属性
         newAttrs = newAttrs.replace(/style=["']([^"']*)["']/g, (styleMatch: string, styleContent: string) => {
           if (!styleContent.includes('max-width')) {
             return `style="${styleContent}; max-width: 100%; height: auto;"`;
           }
           return styleMatch;
         });
      }
      
      // 确保有alt属性
      if (!attrs.includes('alt=')) {
        newAttrs += ' alt="图片"';
      }
      
      return `<img${newAttrs}>`;
    });
    
    // 保持原始图片结构，不做额外处理
    
    return processed;
  }
  
  /**
   * 添加语义化结构
   */
  private addSemanticStructure(html: string): string {
    let structured = html;
    
    // 将内容包装在main标签中
    if (!structured.includes('<main>')) {
      structured = `<main class="document-content">${structured}</main>`;
    }
    
    // 识别文档标题并添加header
    const titleMatch = structured.match(/<h1[^>]*>([^<]*)<\/h1>/);
    if (titleMatch) {
      const titleElement = titleMatch[0];
      structured = structured.replace(titleElement, 
        `<header class="document-header">${titleElement}</header>`);
    }
    
    // 为段落添加适当的类
    structured = structured.replace(/<p>([^<]*)<\/p>/g, (match, content) => {
      // 检查是否是首段
      const isFirstParagraph = structured.indexOf(match) === structured.indexOf('<p>');
      if (isFirstParagraph) {
        return `<p class="first-paragraph">${content}</p>`;
      }
      
      // 检查是否需要缩进
      if (content.length > 50) {
        return `<p class="body-text">${content}</p>`;
      }
      
      return match;
    });
    
    return structured;
  }
  
  /**
   * 生成完整的HTML文档
   */
  public generateFullHTML(title: string = '解析的Word文档'): string {
    return `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${title}</title>
</head>
<body>
${this.htmlContent}
</body>
</html>`;
  }
}
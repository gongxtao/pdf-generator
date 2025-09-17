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
   * 添加全面的样式支持，100%还原Word格式
   */
  private addMinimalStyles(): void {
    // 添加全面的样式以完全还原Word文档格式
    
    // 页面基础样式 - 模拟Word页面
    this.addStyle('body', [
      'font-family: "Calibri", "Times New Roman", "宋体", sans-serif',
      'font-size: 11pt',
      'line-height: 1.08',
      'margin: 0',
      'padding: 72pt 90pt', // Word默认页边距
      'background-color: #ffffff',
      'color: #000000',
      'max-width: 816pt', // A4纸宽度
      'margin: 0 auto'
    ]);
    
    // 标题样式 - 完全匹配Word标题格式
    this.addStyle('h1.heading-1, h1.document-title', [
      'font-family: "Calibri Light", "Calibri", sans-serif',
      'font-size: 16pt',
      'font-weight: 300',
      'color: #2F5496',
      'margin: 12pt 0',
      'page-break-after: avoid',
      'line-height: 1.08'
    ]);
    
    this.addStyle('h2.heading-2, h2.document-subtitle', [
      'font-family: "Calibri Light", "Calibri", sans-serif',
      'font-size: 13pt',
      'font-weight: 300', 
      'color: #2F5496',
      'margin: 2pt 0 0 0',
      'page-break-after: avoid',
      'line-height: 1.08'
    ]);
    
    this.addStyle('h3.heading-3', [
      'font-family: "Calibri", sans-serif',
      'font-size: 12pt',
      'font-weight: bold',
      'color: #1F3763',
      'margin: 2pt 0 0 0',
      'page-break-after: avoid',
      'line-height: 1.08'
    ]);
    
    this.addStyle('h4.heading-4, h5.heading-5, h6.heading-6', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'font-weight: bold',
      'color: #2F5496',
      'font-style: italic',
      'margin: 2pt 0 0 0',
      'page-break-after: avoid',
      'line-height: 1.08'
    ]);
    
    // 段落样式 - 匹配Word段落格式
    this.addStyle('p.normal, p', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 8pt 0',
      'text-align: justify',
      'text-indent: 0',
      'line-height: 1.08'
    ]);
    
    this.addStyle('p.body-text', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 6pt 0',
      'line-height: 1.15'
    ]);
    
    this.addStyle('p.body-text-indent', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 6pt 0',
      'text-indent: 21pt',
      'line-height: 1.15'
    ]);
    
    this.addStyle('p.body-text-2', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 6pt 0',
      'line-height: 1.15',
      'color: #44546A'
    ]);
    
    this.addStyle('p.body-text-3', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 6pt 0',
      'line-height: 1.15',
      'color: #595959'
    ]);
    
    this.addStyle('p.list-paragraph', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 8pt 36pt',
      'line-height: 1.08'
    ]);
    
    this.addStyle('p.caption', [
      'font-family: "Calibri", sans-serif',
      'font-size: 9pt',
      'text-align: center',
      'font-style: italic',
      'color: #44546A',
      'margin: 0 0 10pt 0',
      'line-height: 1.08'
    ]);
    
    this.addStyle('p.footer, p.header', [
      'font-family: "Calibri", sans-serif',
      'font-size: 9pt',
      'margin: 0',
      'line-height: 1.08'
    ]);
    
    // 特殊段落格式
    this.addStyle('p.no-spacing', [
      'margin: 0',
      'line-height: 1.0'
    ]);
    
    this.addStyle('p.compact', [
      'margin: 0 0 3pt 0',
      'line-height: 1.0'
    ]);
    
    this.addStyle('p.tight', [
      'margin: 0 0 6pt 0',
      'line-height: 1.0'
    ]);
    
    this.addStyle('p.open', [
      'margin: 0 0 12pt 0',
      'line-height: 1.5'
    ]);
    
    // 引用样式 - Word样式
    this.addStyle('blockquote.quote', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 8pt 0',
      'padding: 0 0 0 22pt',
      'font-style: italic',
      'border-left: none',
      'line-height: 1.08'
    ]);
    
    this.addStyle('blockquote.intense-quote', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'background-color: #F2F2F2',
      'border: 1pt solid #CCCCCC',
      'padding: 3pt 4pt',
      'margin: 0 0 8pt 0',
      'font-style: italic',
      'color: #404040',
      'line-height: 1.08'
    ]);
    
    // 文本格式样式
    this.addStyle('strong.strong, strong.intense-emphasis', [
      'font-weight: bold'
    ]);
    
    this.addStyle('em.emphasis, em.subtle-emphasis', [
      'font-style: italic'
    ]);
    
    this.addStyle('cite.book-title', [
      'font-style: italic',
      'text-decoration: underline'
    ]);
    
    this.addStyle('a.hyperlink', [
      'color: #0563C1',
      'text-decoration: underline'
    ]);
    
    this.addStyle('a.followed-hyperlink', [
      'color: #954F72',
      'text-decoration: underline'
    ]);
    
    this.addStyle('span.intense-reference', [
      'font-weight: bold',
      'color: #2F5496'
    ]);
    
    this.addStyle('span.subtle-reference', [
      'color: #595959',
      'font-style: italic'
    ]);
    
    // 列表样式
    this.addStyle('li.list-item, li.list-item-2, li.list-item-3', [
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'margin: 0 0 0 0',
      'line-height: 1.08'
    ]);
    
    this.addStyle('li.bullet-item', [
      'list-style-type: disc',
      'margin-left: 18pt'
    ]);
    
    this.addStyle('li.number-item', [
      'list-style-type: decimal',
      'margin-left: 18pt'
    ]);
    
    // 表格样式 - Word表格格式
    this.addStyle('table.table-grid', [
      'border-collapse: collapse',
      'border: 0.5pt solid #000000',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0'
    ]);
    
    this.addStyle('table.table-grid td, table.table-grid th', [
      'border: 0.5pt solid #000000',
      'padding: 0 5.4pt',
      'vertical-align: top',
      'line-height: 1.08'
    ]);
    
    this.addStyle('table.light-shading', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0'
    ]);
    
    this.addStyle('table.light-shading th', [
      'background-color: #D9E2F3',
      'border: 0.5pt solid #8EAADB',
      'padding: 0 5.4pt',
      'font-weight: bold',
      'text-align: left'
    ]);
    
    this.addStyle('table.light-shading td', [
      'border: 0.5pt solid #8EAADB',
      'padding: 0 5.4pt',
      'vertical-align: top'
    ]);
    
    this.addStyle('table.light-shading-accent1', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0'
    ]);
    
    this.addStyle('table.light-shading-accent1 th', [
      'background-color: #FCE4D6',
      'border: 0.5pt solid #F4B183',
      'padding: 0 5.4pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.medium-shading, table.medium-shading-2', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0'
    ]);
    
    this.addStyle('table.medium-shading th, table.medium-shading-2 th', [
      'background-color: #4472C4',
      'color: #FFFFFF',
      'border: 0.5pt solid #2F5597',
      'padding: 0 5.4pt',
      'font-weight: bold',
      'text-align: left'
    ]);
    
    this.addStyle('table.medium-shading td, table.medium-shading-2 td', [
      'border: 0.5pt solid #8EAADB',
      'padding: 0 5.4pt',
      'vertical-align: top'
    ]);
    
    this.addStyle('table.dark-list', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0',
      'background-color: #44546A'
    ]);
    
    this.addStyle('table.dark-list th', [
      'background-color: #44546A',
      'color: #FFFFFF',
      'border: 0.5pt solid #2F3F56',
      'padding: 0 5.4pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.dark-list td', [
      'background-color: #D9E2F3',
      'border: 0.5pt solid #8EAADB',
      'padding: 0 5.4pt',
      'vertical-align: top'
    ]);
    
    this.addStyle('table.colorful-grid', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0'
    ]);
    
    this.addStyle('table.colorful-grid th', [
      'background-color: #70AD47',
      'color: #FFFFFF',
      'border: 1pt solid #548235',
      'padding: 0 5.4pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.colorful-grid td', [
      'border: 1pt solid #70AD47',
      'padding: 0 5.4pt',
      'vertical-align: top'
    ]);
    
    this.addStyle('table.professional', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0',
      'border-top: 2pt solid #4472C4',
      'border-bottom: 1pt solid #4472C4'
    ]);
    
    this.addStyle('table.professional th', [
      'background-color: #FFFFFF',
      'color: #4472C4',
      'border-bottom: 1pt solid #4472C4',
      'padding: 0 5.4pt',
      'font-weight: bold',
      'text-align: left'
    ]);
    
    this.addStyle('table.professional td', [
      'border: none',
      'border-bottom: 0.5pt solid #D9E2F3',
      'padding: 0 5.4pt',
      'vertical-align: top'
    ]);
    
    // 通用表格样式增强
    this.addStyle('table', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0'
    ]);
    
    this.addStyle('table td, table th', [
      'border: 1pt solid #000000',
      'padding: 0pt 5.4pt 0pt 5.4pt',
      'vertical-align: top',
      'line-height: 1.08'
    ]);
    
    this.addStyle('table th', [
      'background-color: #F2F2F2',
      'font-weight: bold',
      'text-align: left'
    ]);
    
    this.addStyle('table.medium-shading th', [
      'background-color: #5B9BD5',
      'color: #FFFFFF',
      'border: 0.5pt solid #FFFFFF',
      'padding: 0 5.4pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.dark-list', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0',
      'background-color: #44546A',
      'color: #FFFFFF'
    ]);
    
    this.addStyle('table.colorful-grid', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0',
      'border: 2pt solid #5B9BD5'
    ]);
    
    this.addStyle('table.professional', [
      'border-collapse: collapse',
      'font-family: "Calibri", sans-serif',
      'font-size: 11pt',
      'width: 100%',
      'margin: 0 0 8pt 0',
      'border-top: 2pt solid #5B9BD5',
      'border-bottom: 1pt solid #5B9BD5'
    ]);
    
    // 图片样式
    this.addStyle('img', [
      'max-width: 100%',
      'height: auto',
      'display: block',
      'margin: 6pt auto'
    ]);
    
    // 表格响应式样式
    this.addStyle('.table-responsive', [
      'width: 100%',
      'overflow-x: auto',
      'margin: 0 0 8pt 0',
      '-webkit-overflow-scrolling: touch'
    ]);
    
    this.addStyle('.table-responsive table', [
      'min-width: 100%',
      'white-space: nowrap'
    ]);
    
    // 响应式表格媒体查询样式
    this.addStyle('@media (max-width: 768px)', [
      '.table-responsive table, .table-responsive thead, .table-responsive tbody, .table-responsive th, .table-responsive td, .table-responsive tr {',
      '  display: block;',
      '}',
      '',
      '.table-responsive thead tr {',
      '  position: absolute;',
      '  top: -9999px;',
      '  left: -9999px;',
      '}',
      '',
      '.table-responsive tr {',
      '  border: 1pt solid #ccc;',
      '  margin-bottom: 8pt;',
      '  padding: 4pt;',
      '}',
      '',
      '.table-responsive td {',
      '  border: none !important;',
      '  border-bottom: 1pt solid #eee;',
      '  position: relative;',
      '  padding-left: 50% !important;',
      '  white-space: normal;',
      '  text-align: left;',
      '}',
      '',
      '.table-responsive td:before {',
      '  content: attr(data-label) ":";',
      '  position: absolute;',
      '  left: 6pt;',
      '  width: 45%;',
      '  padding-right: 10pt;',
      '  white-space: nowrap;',
      '  font-weight: bold;',
      '  color: #4472C4;',
      '}'
     ]);
    
    // 表格样式增强
    this.addStyle('table', [
      'border-collapse: collapse',
      'width: 100%',
      'margin: 12pt 0',
      'font-size: 11pt'
    ]);
    
    this.addStyle('table.grid', [
      'border: 1pt solid #000000'
    ]);
    
    this.addStyle('table.grid th, table.grid td', [
      'border: 1pt solid #000000',
      'padding: 4pt 6pt',
      'text-align: left',
      'vertical-align: top'
    ]);
    
    this.addStyle('table.light-shading', [
      'border: 1pt solid #bfbfbf'
    ]);
    
    this.addStyle('table.light-shading th', [
      'background-color: #f2f2f2',
      'border: 1pt solid #bfbfbf',
      'padding: 4pt 6pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.light-shading td', [
      'border: 1pt solid #bfbfbf',
      'padding: 4pt 6pt'
    ]);
    
    this.addStyle('table.medium-shading th', [
      'background-color: #d9d9d9',
      'border: 1pt solid #8c8c8c',
      'padding: 4pt 6pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.medium-shading td', [
      'border: 1pt solid #8c8c8c',
      'padding: 4pt 6pt'
    ]);
    
    this.addStyle('table.dark-list th', [
      'background-color: #4f81bd',
      'color: white',
      'border: 1pt solid #4f81bd',
      'padding: 4pt 6pt',
      'font-weight: bold'
    ]);
    
    this.addStyle('table.dark-list td', [
      'border: 1pt solid #4f81bd',
      'padding: 4pt 6pt'
    ]);
    
    // 字符格式样式
    this.addStyle('strong, strong.intense', [
      'font-weight: bold'
    ]);
    
    this.addStyle('em, em.subtle', [
      'font-style: italic'
    ]);
    
    this.addStyle('cite', [
      'font-style: italic',
      'text-decoration: underline'
    ]);
    
    this.addStyle('a.hyperlink', [
      'color: #0066cc',
      'text-decoration: underline'
    ]);
    
    // 图片样式
    this.addStyle('img', [
      'max-width: 100%',
      'height: auto',
      'display: block',
      'margin: 10px auto',
      'page-break-inside: avoid'
    ]);
    
    // 列表样式
    this.addStyle('ul, ol', [
      'margin: 6pt 0',
      'padding-left: 24pt'
    ]);
    
    this.addStyle('li', [
      'margin: 3pt 0',
      'line-height: 1.15'
    ]);
    
    // 分页控制
    this.addStyle('@media print', [
      'body { margin: 0; }',
      'h1, h2, h3, h4, h5, h6 { page-break-after: avoid; }',
      'table, img { page-break-inside: avoid; }',
      'p { orphans: 3; widows: 3; }'
    ]);
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
    let css = '';
    
    // 遍历所有样式规则
    for (const [selector, styles] of this.extractedStyles) {
      if (styles.size > 0) {
        css += `${selector} {\n`;
        for (const style of styles) {
          css += `  ${style};\n`;
        }
        css += '}\n\n';
      }
    }
    
    return css.trim();
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
    
    // 智能识别Word表格样式类型
    optimized = this.identifyTableStyles(optimized);
    
    // 为表格添加响应式包装器
    optimized = optimized.replace(/<table[^>]*>/g, (match) => {
      // 检查是否已有class属性
      if (match.includes('class=')) {
        return match.replace('class="', 'class="word-table ').replace('<table', '<div class="table-responsive"><table');
      } else {
        return '<div class="table-responsive"><table class="word-table">';
      }
    });
    optimized = optimized.replace(/<\/table>/g, '</table></div>');
    
    // 确保表格有正确的结构
    optimized = optimized.replace(/<table[^>]*>([^<]*)<tr>/g, (match, content) => {
      return match.replace('><tr>', '><tbody><tr>');
    });
    optimized = optimized.replace(/<\/tr>([^<]*)<\/table>/g, '</tr></tbody></table>');
    
    // 智能识别表头行（多种模式）
    // 模式1：包含strong或b标签的行
    optimized = optimized.replace(/<tr>(<td[^>]*>(<strong>|<b>)[^<]*(<\/strong>|<\/b>)<\/td>)+<\/tr>/g, (match) => {
      const headerRow = match.replace(/<td([^>]*)>/g, '<th$1>').replace(/<\/td>/g, '</th>');
      return headerRow.replace(/<tbody><tr>/, '<thead><tr>').replace(/<\/tr>/, '</tr></thead><tbody>');
    });
    
    // 模式2：背景色不同的第一行
    optimized = optimized.replace(/<tbody><tr[^>]*style="[^"]*background[^"]*"[^>]*>([\s\S]*?)<\/tr>/g, (match, content, offset) => {
      const beforeMatch = optimized.substring(0, offset);
      if (!beforeMatch.includes('<tr>')) {
        const headerRow = match.replace(/<td([^>]*)>/g, '<th$1>').replace(/<\/td>/g, '</th>');
        return headerRow.replace(/<tbody><tr/, '<thead><tr').replace(/<\/tr>/, '</tr></thead><tbody>');
      }
      return match;
    });
    
    // 模式3：第一行且内容较短（可能是标题）
    optimized = optimized.replace(/<tbody><tr>(<td[^>]*>[^<]{1,30}<\/td>)+<\/tr>/g, (match, p1, offset) => {
      const beforeMatch = optimized.substring(0, offset);
      if (!beforeMatch.includes('<tr>')) {
        const headerRow = match.replace(/<td([^>]*)>/g, '<th$1>').replace(/<\/td>/g, '</th>');
        return headerRow.replace(/<tbody><tr>/, '<thead><tr>').replace(/<\/tr>/, '</tr></thead><tbody>');
      }
      return match;
    });
    
    // 处理合并单元格
    optimized = this.handleMergedCells(optimized);
    
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
          return rowMatch.replace(/<td([^>]*)>([\s\S]*?)<\/td>/g, (cellMatch, attrs, content) => {
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
   * 识别Word表格样式类型
   */
  private identifyTableStyles(html: string): string {
    let styled = html;
    
    // 检测表格边框样式
    styled = styled.replace(/<table[^>]*>/g, (match) => {
      if (match.includes('border') || match.includes('grid')) {
        return match.replace('<table', '<table class="table-grid"');
      }
      return match;
    });
    
    // 检测浅色阴影样式
    styled = styled.replace(/<table[^>]*>/g, (match) => {
      const tableContent = html.substring(html.indexOf(match));
      const tableEnd = tableContent.indexOf('</table>');
      const tableHtml = tableContent.substring(0, tableEnd);
      
      if (tableHtml.includes('background-color: #D9E2F3') || tableHtml.includes('background-color: #FCE4D6')) {
        if (match.includes('class=')) {
          return match.replace('class="', 'class="light-shading ');
        } else {
          return match.replace('<table', '<table class="light-shading"');
        }
      }
      
      return match;
    });
    
    return styled;
  }
  
  /**
   * 处理合并单元格
   */
  private handleMergedCells(html: string): string {
    let processed = html;
    
    // 处理colspan属性
    processed = processed.replace(/colspan="(\d+)"/g, (match, span) => {
      return `colspan="${span}" data-colspan="${span}"`;
    });
    
    // 处理rowspan属性
    processed = processed.replace(/rowspan="(\d+)"/g, (match, span) => {
      return `rowspan="${span}" data-rowspan="${span}"`;
    });
    
    return processed;
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
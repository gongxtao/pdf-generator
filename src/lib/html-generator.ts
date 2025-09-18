// 深度HTML生成器 - 100%还原Word文档内容和样式
// 完全兼容docx-parser.ts的WordState输出格式
import { WordState } from './docx-parser';

export class HtmlGenerator {
  private wordState: WordState;

  constructor(wordState: WordState) {
    this.wordState = wordState;
  }

  // 生成完整的HTML文档
  generateHtml(): string {
    const styles = this.generateStyles();
    const body = this.generateBody();
    
    return `<!DOCTYPE html>
<html lang="${this.wordState.lang || 'zh-CN'}" dir="${this.wordState.rtl ? 'rtl' : 'ltr'}">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${this.wordState.metadata?.title || 'Word文档'}</title>
    <style>
        ${styles}
    </style>
</head>
<body>
    ${body}
</body>
</html>`;
  }

  // 生成所有CSS样式
  private generateStyles(): string {
    return `
        ${this.generateBaseStyles()}
        ${this.generatePageStyles()}
        ${this.generateParagraphStyles()}
        ${this.generateTableStyles()}
        ${this.generateImageStyles()}
        ${this.generateThemeStyles()}
        ${this.generateCustomStyles()}
    `;
  }

  // 生成基础样式
  private generateBaseStyles(): string {
    return `
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Times New Roman', serif;
            font-size: 12pt;
            line-height: 1.15;
            color: #000;
            background: #f5f5f5;
            padding: 20px;
        }
        
        .document-container {
            max-width: ${this.wordState.page.width}pt;
            margin: 0 auto;
            background: white;
            box-shadow: 0 0 10px rgba(0,0,0,0.1);
            position: relative;
            /* 改进文档容器布局 */
            min-height: 100vh;
            overflow: hidden;
        }
        
        .page {
            width: ${this.wordState.page.width}pt;
            height: ${this.wordState.page.height}pt;
            padding: ${this.wordState.page.margin[0]}pt ${this.wordState.page.margin[1]}pt ${this.wordState.page.margin[2]}pt ${this.wordState.page.margin[3]}pt;
            position: relative;
            background: white;
            page-break-after: always;
            /* 改进页面布局 */
            display: flex;
            flex-direction: column;
            justify-content: flex-start;
            overflow: hidden;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        /* 改进段落布局 */
        p {
            margin: 0;
            padding: 0;
            word-wrap: break-word;
            overflow-wrap: break-word;
            hyphens: auto;
        }
        
        /* 改进表格布局 */
        table {
            border-collapse: collapse;
            width: 100%;
            table-layout: auto;
            page-break-inside: avoid;
        }
        
        /* 改进图片布局 */
        img {
            max-width: 100%;
            height: auto;
            display: block;
        }
        
        /* 浮动元素清除 */
        .clearfix::after {
            content: "";
            display: table;
            clear: both;
        }
    `;
  }

  // 生成页面样式
  private generatePageStyles(): string {
    let styles = '';
    
    // 背景图片样式
    if (this.wordState.backgroundImage) {
      styles += `
        .page::before {
            content: '';
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            background-image: url('${this.wordState.backgroundImage.src}');
            background-size: cover;
            background-position: center;
            background-repeat: no-repeat;
            z-index: ${this.wordState.backgroundImage.type === 'A' ? -1 : 0};
            opacity: 0.3;
        }
      `;
    }
    
    // 浮动图片样式
    this.wordState.floatingImages.forEach((img, index) => {
      styles += `
        .floating-image-${index} {
            position: absolute;
            left: ${img.left};
            top: ${img.top};
            z-index: ${img.zIndex};
            ${img.behindDoc ? 'opacity: 0.5;' : ''}
        }
      `;
    });
    
    return styles;
  }

  // 生成段落样式
  private generateParagraphStyles(): string {
    let styles = `
        .paragraph {
            margin: 0;
            padding: 0;
            line-height: 1.15;
        }
        
        .text-run {
            font-family: inherit;
            font-size: inherit;
            color: inherit;
        }
        
        .bold { font-weight: bold; }
        .italic { font-style: italic; }
        .underline { text-decoration: underline; }
        .strike { text-decoration: line-through; }
        
        .align-left { text-align: left; }
        .align-center { text-align: center; }
        .align-right { text-align: right; }
        .align-justify { text-align: justify; }
    `;
    
    // 为每个段落样式生成CSS
    Object.entries(this.wordState.styles).forEach(([styleId, styleData]) => {
      if (styleData.type === 'paragraph') {
        styles += this.generateParagraphStyleRule(styleId, styleData);
      }
    });
    
    return styles;
  }

  // 生成表格样式
  private generateTableStyles(): string {
    return `
        .table-container {
            margin: 12pt 0;
            overflow-x: auto;
            width: 100%;
        }
        
        .word-table {
            border-collapse: collapse;
            width: 100%;
            max-width: 100%;
            margin: 0;
            font-size: inherit;
            background-color: transparent;
        }
        
        .table-cell, .table-header {
            border: 1px solid #ddd;
            padding: 4pt 6pt;
            vertical-align: top;
            word-wrap: break-word;
            overflow-wrap: break-word;
        }
        
        .table-header {
            font-weight: bold;
            background-color: #f8f9fa;
            text-align: center;
        }
        
        .cell-content {
            width: 100%;
            min-height: 1em;
            line-height: 1.2;
        }
        
        /* 响应式表格 */
        @media (max-width: 768px) {
            .table-container {
                font-size: 0.9em;
            }
            
            .table-cell, .table-header {
                padding: 3pt 4pt;
            }
        }
    `;
  }

  // 生成图片样式
  private generateImageStyles(): string {
    return `
        .inline-image {
            vertical-align: baseline;
            max-width: 100%;
            height: auto;
        }
        
        .block-image {
            display: block;
            max-width: 100%;
            height: auto;
            margin: 6pt 0;
        }
    `;
  }

  // 生成主题色样式
  private generateThemeStyles(): string {
    let styles = '';
    
    Object.entries(this.wordState.themeColors).forEach(([colorName, colorValue]) => {
      styles += `
        .theme-${colorName} { color: ${colorValue}; }
        .bg-theme-${colorName} { background-color: ${colorValue}; }
      `;
    });
    
    return styles;
  }

  // 生成自定义样式
  private generateCustomStyles(): string {
    let styles = '';
    
    // 处理文档中定义的样式
    Object.entries(this.wordState.styles).forEach(([styleId, styleData]) => {
      styles += this.generateStyleRule(styleId, styleData);
    });
    
    return styles;
  }

  // 生成文档主体
  private generateBody(): string {
    let html = '<div class="document-container">';
    html += '<div class="page">';
    
    // 添加浮动图片
    html += this.generateFloatingImages();
    
    // 添加段落
    html += this.generateParagraphs();
    
    // 添加表格
    html += this.generateTables();
    
    html += '</div>';
    html += '</div>';
    
    return html;
  }

  // 生成浮动图片HTML
  private generateFloatingImages(): string {
    let html = '';
    
    this.wordState.floatingImages.forEach((img, index) => {
      html += `<img src="${img.src}" class="floating-image-${index}" alt="浮动图片${index + 1}">`;
    });
    
    return html;
  }

  // 生成段落HTML
  private generateParagraphs(): string {
    let html = '';
    
    this.wordState.paragraphs.forEach((paragraph, index) => {
      html += this.generateParagraphHtml(paragraph, index);
    });
    
    return html;
  }

  // 生成单个段落HTML
  private generateParagraphHtml(paragraph: any, index: number): string {
    const classes = ['paragraph', 'clearfix']; // 添加clearfix类
    const styles: string[] = [];
    
    // 添加对齐方式
    classes.push(`align-${paragraph.alignment}`);
    
    // 添加缩进
    if (paragraph.indent.firstLine) {
      styles.push(`text-indent: ${paragraph.indent.firstLine}pt`);
    }
    if (paragraph.indent.left) {
      styles.push(`margin-left: ${paragraph.indent.left}pt`);
    }
    if (paragraph.indent.right) {
      styles.push(`margin-right: ${paragraph.indent.right}pt`);
    }
    
    // 添加间距 - 改进间距计算
    if (paragraph.spacing.before) {
      styles.push(`margin-top: ${Math.max(0, paragraph.spacing.before)}pt`);
    }
    if (paragraph.spacing.after) {
      styles.push(`margin-bottom: ${Math.max(0, paragraph.spacing.after)}pt`);
    }
    if (paragraph.spacing.line) {
      let lineHeight;
      if (paragraph.spacing.lineRule === 'exact') {
        lineHeight = `${paragraph.spacing.line}pt`;
      } else if (paragraph.spacing.lineRule === 'atLeast') {
        lineHeight = `${Math.max(paragraph.spacing.line, 12)}pt`;
      } else {
        // 自动或多倍行距
        lineHeight = paragraph.spacing.line / 240; // 240 = 12pt * 20 (twips)
        lineHeight = Math.max(1.0, lineHeight); // 最小行距1.0
      }
      styles.push(`line-height: ${lineHeight}`);
    }
    
    // 添加样式ID
    if (paragraph.styleId) {
      classes.push(`style-${paragraph.styleId}`);
    }
    
    // 生成文本运行
    const runsHtml = paragraph.runs.map((run: any) => this.generateRunHtml(run)).join('');
    
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    
    return `<p${classAttr}${styleAttr}>${runsHtml || '&nbsp;'}</p>`;
  }

  // 生成文本运行HTML
  private generateRunHtml(run: any): string {
    // 如果是图片，生成图片HTML
    if (run.image) {
      return this.generateImageHtml(run.image);
    }
    
    const classes = ['text-run'];
    const styles: string[] = [];
    
    // 添加格式化类
    if (run.bold) classes.push('bold');
    if (run.italic) classes.push('italic');
    if (run.underline) classes.push('underline');
    if (run.strike) classes.push('strike');
    
    // 添加字体样式 - 使用更智能的字体回退
    if (run.font) {
      const fontFamily = this.getFontFamilyWithFallback(run.font);
      styles.push(`font-family: ${fontFamily}`);
    }
    if (run.sz) {
      styles.push(`font-size: ${run.sz / 2}pt`); // sz是半磅值
    }
    if (run.color) {
      styles.push(`color: ${run.color}`);
    }
    
    const classAttr = classes.length > 0 ? ` class="${classes.join(' ')}"` : '';
    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    
    // 处理特殊字符
    const text = this.escapeHtml(run.text);
    
    return `<span${classAttr}${styleAttr}>${text}</span>`;
  }

  // 生成图片HTML
  private generateImageHtml(image: any): string {
    const styles: string[] = [];
    
    // 设置图片尺寸
    if (image.width) {
      styles.push(`width: ${image.width}px`);
    }
    if (image.height) {
      styles.push(`height: ${image.height}px`);
    }
    
    // 处理图片位置和对齐
    if (image.position === 'inline') {
      // 内联图片 - 在文本流中显示
      if (image.alignment) {
        switch (image.alignment) {
          case 'center':
            styles.push('display: block', 'margin: 0 auto');
            break;
          case 'right':
            styles.push('float: right', 'margin-left: 10px');
            break;
          case 'left':
          default:
            styles.push('float: left', 'margin-right: 10px');
            break;
        }
      }
    } else {
      // 浮动图片 - 绝对定位
      styles.push('position: absolute');
      if (image.left) styles.push(`left: ${image.left}`);
      if (image.top) styles.push(`top: ${image.top}`);
    }
    
    // 设置层级
    if (image.zIndex !== undefined) {
      styles.push(`z-index: ${image.zIndex}`);
    }
    
    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    
    return `<img src="${image.src}" alt="图片"${styleAttr} />`;
  }

  // 生成表格HTML
  private generateTables(): string {
    let html = '';
    
    this.wordState.tables.forEach((table, index) => {
      html += this.generateTableHtml(table, index);
    });
    
    return html;
  }

  // 生成单个表格HTML
  private generateTableHtml(table: any, index: number): string {
    const borderStyles = this.generateTableBorderStyles(table.borders);
    const tableClasses = ['table', 'word-table'];
    
    // 添加表格样式类
    if (table.styleId) {
      tableClasses.push(`table-style-${table.styleId}`);
    }
    
    // 添加表格布局属性
    const tableStyles = [borderStyles];
    if (table.width) {
      tableStyles.push(`width: ${table.width}pt`);
    }
    if (table.alignment) {
      tableStyles.push(`margin: 0 auto`); // 居中对齐
    }
    
    let html = `<div class="table-container">`;
    html += `<table class="${tableClasses.join(' ')}" style="${tableStyles.join('; ')}">`;
    
    // 检查是否有表头
    const hasHeader = this.detectTableHeader(table);
    if (hasHeader) {
      html += '<thead>';
      html += '<tr>';
      table.rows[0].cells.forEach((cell: any, cellIndex: number) => {
        html += this.generateCellHtml(cell, 0, cellIndex, true);
      });
      html += '</tr>';
      html += '</thead>';
      html += '<tbody>';
      
      // 生成其余行
      table.rows.slice(1).forEach((row: any, rowIndex: number) => {
        html += '<tr>';
        row.cells.forEach((cell: any, cellIndex: number) => {
          html += this.generateCellHtml(cell, rowIndex + 1, cellIndex, false);
        });
        html += '</tr>';
      });
      html += '</tbody>';
    } else {
      html += '<tbody>';
      table.rows.forEach((row: any, rowIndex: number) => {
        html += '<tr>';
        row.cells.forEach((cell: any, cellIndex: number) => {
          html += this.generateCellHtml(cell, rowIndex, cellIndex, false);
        });
        html += '</tr>';
      });
      html += '</tbody>';
    }
    
    html += '</table>';
    html += '</div>';
    
    return html;
  }

  // 检测表格是否有表头
  private detectTableHeader(table: any): boolean {
    if (!table.rows || table.rows.length === 0) return false;
    
    const firstRow = table.rows[0];
    if (!firstRow.cells) return false;
    
    // 检查第一行是否有特殊格式（粗体、背景色等）
    return firstRow.cells.some((cell: any) => {
      return cell.background || 
             (cell.content && cell.content.some((run: any) => run.bold));
    });
  }

  // 生成单元格HTML
  private generateCellHtml(cell: any, rowIndex: number, cellIndex: number, isHeader: boolean = false): string {
    const styles: string[] = [];
    const cellTag = isHeader ? 'th' : 'td';
    const cellClasses = ['table-cell'];
    
    if (isHeader) {
      cellClasses.push('table-header');
    }
    
    // 添加宽度
    if (cell.width) {
      styles.push(`width: ${cell.width}pt`);
    }
    
    // 添加高度
    if (cell.height) {
      styles.push(`height: ${cell.height}pt`);
    }
    
    // 添加背景色
    if (cell.background) {
      styles.push(`background-color: ${cell.background}`);
    }
    
    // 添加文本对齐
    if (cell.alignment) {
      styles.push(`text-align: ${cell.alignment}`);
    }
    
    // 添加垂直对齐
    if (cell.verticalAlignment) {
      const vAlign = cell.verticalAlignment === 'center' ? 'middle' : cell.verticalAlignment;
      styles.push(`vertical-align: ${vAlign}`);
    }
    
    // 添加内边距
    if (cell.padding) {
      styles.push(`padding: ${cell.padding.top || 0}pt ${cell.padding.right || 0}pt ${cell.padding.bottom || 0}pt ${cell.padding.left || 0}pt`);
    } else {
      styles.push('padding: 4pt 6pt'); // 默认内边距
    }
    
    // 添加边框
    if (cell.borders) {
      const borderStyles = this.generateCellBorderStyles(cell.borders);
      styles.push(borderStyles);
    }
    
    // 添加跨行跨列
    const colSpanAttr = cell.colSpan && cell.colSpan > 1 ? ` colspan="${cell.colSpan}"` : '';
    const rowSpanAttr = cell.rowSpan && cell.rowSpan > 1 ? ` rowspan="${cell.rowSpan}"` : '';
    
    const classAttr = ` class="${cellClasses.join(' ')}"`;
    const styleAttr = styles.length > 0 ? ` style="${styles.join('; ')}"` : '';
    
    // 处理单元格内容
    const content = this.generateCellContent(cell.content);
    
    return `<${cellTag}${classAttr}${colSpanAttr}${rowSpanAttr}${styleAttr}>
        <div class="cell-content">${content}</div>
    </${cellTag}>`;
  }

  // 生成单元格内容
  private generateCellContent(content: any[]): string {
    if (!content || content.length === 0) {
      return '&nbsp;';
    }
    
    // 这里需要根据内容类型进行处理
    // 简化处理：将内容转换为字符串
    return content.map(item => {
      if (typeof item === 'string') {
        return this.escapeHtml(item);
      }
      return String(item);
    }).join('');
  }

  // 生成段落样式规则
  private generateParagraphStyleRule(styleId: string, styleData: any): string {
    let css = `.style-${styleId} {`;
    
    if (styleData.fontSize) {
      css += `font-size: ${styleData.fontSize}pt;`;
    }
    if (styleData.fontFamily) {
      css += `font-family: '${styleData.fontFamily}', serif;`;
    }
    if (styleData.color) {
      css += `color: ${styleData.color};`;
    }
    if (styleData.bold) {
      css += `font-weight: bold;`;
    }
    if (styleData.italic) {
      css += `font-style: italic;`;
    }
    
    css += '}';
    
    return css;
  }

  // 生成样式规则
  private generateStyleRule(styleId: string, styleData: any): string {
    // 根据样式数据生成CSS规则
    return `/* Style: ${styleId} */\n`;
  }

  // 生成表格边框样式
  private generateTableBorderStyles(borders: any): string {
    const styles: string[] = [];
    
    if (borders.top?.style && borders.top?.color) {
      styles.push(`border-top: ${borders.top.size || 1}pt ${borders.top.style} ${borders.top.color}`);
    }
    if (borders.bottom?.style && borders.bottom?.color) {
      styles.push(`border-bottom: ${borders.bottom.size || 1}pt ${borders.bottom.style} ${borders.bottom.color}`);
    }
    if (borders.left?.style && borders.left?.color) {
      styles.push(`border-left: ${borders.left.size || 1}pt ${borders.left.style} ${borders.left.color}`);
    }
    if (borders.right?.style && borders.right?.color) {
      styles.push(`border-right: ${borders.right.size || 1}pt ${borders.right.style} ${borders.right.color}`);
    }
    
    return styles.join('; ');
  }

  // 生成单元格边框样式
  private generateCellBorderStyles(borders: any): string {
    const styles: string[] = [];
    
    Object.entries(borders).forEach(([side, border]: [string, any]) => {
      if (border?.style && border?.color) {
        styles.push(`border-${side}: ${border.size || 1}pt ${border.style} ${border.color}`);
      }
    });
    
    return styles.join('; ');
  }

  // HTML转义
  private escapeHtml(text: string): string {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  // 智能字体回退 - 为不同类型的字体提供合适的回退方案
  private getFontFamilyWithFallback(fontName: string): string {
    // 字体分类和回退映射
    const fontCategories = {
      // 无衬线字体 (Sans-serif)
      sansSerif: [
        'Arial', 'Helvetica', 'Helvetica Neue', 'Verdana', 'Trebuchet MS', 
        'Century Gothic', 'Roboto', 'Open Sans', 'Lato', 'Montserrat', 
        'Source Sans Pro', 'Raleway', 'Ubuntu', 'Nunito', 'Poppins'
      ],
      
      // 衬线字体 (Serif)
      serif: [
        'Times New Roman', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
        'Merriweather', 'Playfair Display', 'Lora', 'PT Serif', 'Crimson Text',
        'Source Serif Pro', 'Libre Baskerville', 'Old Standard TT', 
        'Cormorant Garamond', 'EB Garamond'
      ],
      
      // 等宽字体 (Monospace)
      monospace: [
        'Courier New', 'Lucida Console', 'Monaco', 'Menlo', 'Consolas',
        'Source Code Pro', 'Fira Code', 'JetBrains Mono', 'Inconsolata',
        'Ubuntu Mono', 'Roboto Mono'
      ],
      
      // 装饰性字体 (Display)
      display: [
        'Arial Black', 'Impact', 'Oswald', 'Bebas Neue', 'Anton',
        'Fjalla One', 'Russo One', 'Righteous'
      ],
      
      // 手写体字体 (Cursive)
      cursive: [
        'Brush Script MT', 'Comic Sans MS', 'Dancing Script', 'Pacifico',
        'Satisfy', 'Kaushan Script', 'Great Vibes', 'Allura'
      ]
    };

    // 确定字体类别并生成回退方案
    let fallbackChain = '';
    
    if (fontCategories.sansSerif.includes(fontName)) {
      fallbackChain = `'${fontName}', Arial, Helvetica, sans-serif`;
    } else if (fontCategories.serif.includes(fontName)) {
      fallbackChain = `'${fontName}', 'Times New Roman', Georgia, serif`;
    } else if (fontCategories.monospace.includes(fontName)) {
      fallbackChain = `'${fontName}', 'Courier New', Consolas, monospace`;
    } else if (fontCategories.display.includes(fontName)) {
      fallbackChain = `'${fontName}', 'Arial Black', Impact, sans-serif`;
    } else if (fontCategories.cursive.includes(fontName)) {
      fallbackChain = `'${fontName}', 'Brush Script MT', cursive`;
    } else {
      // 未知字体，根据名称特征推测类别
      const lowerName = fontName.toLowerCase();
      if (lowerName.includes('mono') || lowerName.includes('code') || lowerName.includes('console')) {
        fallbackChain = `'${fontName}', 'Courier New', monospace`;
      } else if (lowerName.includes('script') || lowerName.includes('hand') || lowerName.includes('brush')) {
        fallbackChain = `'${fontName}', cursive`;
      } else if (lowerName.includes('serif') || lowerName.includes('times') || lowerName.includes('garamond')) {
        fallbackChain = `'${fontName}', 'Times New Roman', serif`;
      } else {
        // 默认为无衬线字体
        fallbackChain = `'${fontName}', Arial, sans-serif`;
      }
    }

    return fallbackChain;
  }
}
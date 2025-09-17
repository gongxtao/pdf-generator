// HTML生成器
// 基于完整的文档结构生成准确的HTML代码
import { DocumentStructure, DocumentElement, PageSettings } from './docx-parser';

interface HeaderFooter {
  type: 'header' | 'footer';
  content: DocumentElement[];
  id: string;
}

interface BackgroundImage {
  id: string;
  src: string;
  positioning: 'background' | 'watermark';
}

export class HtmlGenerator {
  private structure: DocumentStructure;
  private pageSettings: PageSettings;

  constructor(structure: DocumentStructure) {
    this.structure = structure;
    this.pageSettings = structure.pageSettings;
  }

  // 生成完整的HTML文档
  generateHtml(): string {
    const html = `
<!DOCTYPE html>
<html lang="zh-CN">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Word文档预览</title>
    <style>
        ${this.generatePageStyles()}
        ${this.generateElementStyles()}
        ${this.generateLayoutStyles()}
    </style>
</head>
<body>
    <div class="document-container">
        ${this.generatePageStructure()}
    </div>
</body>
</html>`;

    return html;
  }

  // 生成页面样式 - 100%还原Word文档格式
  private generatePageStyles(): string {
    const { width, height, margins } = this.pageSettings;
    
    return `
        /* 页面基础样式 - 完全匹配Word文档 */
        * {
            margin: 0;
            padding: 0;
            box-sizing: border-box;
        }
        
        body {
            font-family: 'Calibri', 'Times New Roman', '宋体', sans-serif;
            font-size: 11pt;
            line-height: 1.08;
            color: #000000;
            background: #F3F3F3;
            margin: 0;
            padding: 20px;
        }
        
        .document-container {
            max-width: ${width || 816}pt;
            margin: 0 auto;
            background: #FFFFFF;
            box-shadow: 0 0 8pt rgba(0,0,0,0.15);
            position: relative;
            border: 1pt solid #D4D4D4;
        }
        
        .page {
            width: ${width || 816}pt;
            min-height: ${height || 1056}pt;
            padding: ${margins?.top || 72}pt ${margins?.right || 90}pt ${margins?.bottom || 72}pt ${margins?.left || 90}pt;
            position: relative;
            page-break-after: always;
            background: #FFFFFF;
            overflow: hidden;
        }
        
        .page:last-child {
            page-break-after: auto;
        }
        
        /* 页眉样式 - Word格式 */
        .header {
            position: absolute;
            top: 36pt;
            left: ${margins?.left || 90}pt;
            right: ${margins?.right || 90}pt;
            height: ${margins?.header || 36}pt;
            padding: 0;
            font-size: 9pt;
            color: #595959;
            border-bottom: none;
            font-size: 10pt;
            text-align: center;
        }
        
        /* 页脚样式 */
        .footer {
            position: absolute;
            bottom: 0;
            left: ${margins.left}px;
            right: ${margins.right}px;
            height: ${margins.footer}px;
            padding: 10px 0;
            border-top: 1px solid #ddd;
            font-size: 10pt;
            text-align: center;
        }
        
        /* 内容区域 */
        .content {
            min-height: ${height - margins.top - margins.bottom - margins.header - margins.footer}px;
            position: relative;
            z-index: 1;
        }
    `;
  }

  // 生成元素样式
  private generateElementStyles(): string {
    let styles = '';
    
    // 生成段落样式
    styles += `
        /* 段落样式 */
        .paragraph {
            margin-bottom: 0;
            text-indent: 0;
        }
        
        .paragraph.first-line-indent {
            text-indent: 2em;
        }
        
        /* 表格样式 */
        .table {
            width: 100%;
            border-collapse: collapse;
            margin: 10px 0;
        }
        
        .table td, .table th {
            border: 1px solid #000;
            padding: 5px;
            vertical-align: top;
        }
        
        /* 图片样式 */
        .image {
            max-width: 100%;
            height: auto;
            display: block;
        }
        
        .image.inline {
            display: inline-block;
            vertical-align: middle;
        }
        
        /* 背景样式 */
        .background {
            position: absolute;
            top: 0;
            left: 0;
            width: 100%;
            height: 100%;
            z-index: -1;
        }
    `;

    // 根据文档样式生成CSS
    for (const [styleId, styleData] of Object.entries(this.structure.styles)) {
      styles += this.generateStyleRule(styleId, styleData);
    }

    // 生成背景图片样式
    styles += this.generateBackgroundImageStyles();

    return styles;
  }

  // 生成布局样式
  private generateLayoutStyles(): string {
    return `
        /* 布局辅助样式 */
        .text-left { text-align: left; }
        .text-center { text-align: center; }
        .text-right { text-align: right; }
        .text-justify { text-align: justify; }
        
        .font-bold { font-weight: bold; }
        .font-italic { font-style: italic; }
        .font-underline { text-decoration: underline; }
        
        .break-page {
            page-break-before: always;
        }
        
        /* 打印样式 */
        @media print {
            body { background: white; }
            .document-container { 
                box-shadow: none; 
                margin: 0;
            }
            .page {
                page-break-after: always;
            }
            .page:last-child {
                page-break-after: auto;
            }
        }
    `;
  }

  // 生成页面结构
  private generatePageStructure(): string {
    let html = '';
    let currentPage = 1;
    let pageContent = '';
    
    // 开始第一页
    html += this.startPage(currentPage);
    
    // 处理文档元素
    for (const element of this.structure.elements) {
      const elementHtml = this.generateElementHtml(element);
      
      // 检查是否需要分页
      if (element.type === 'pageBreak') {
        html += this.endPage();
        currentPage++;
        html += this.startPage(currentPage);
      } else {
        pageContent += elementHtml;
      }
    }
    
    // 添加最后一页的内容
    html = html.replace('{{CONTENT}}', pageContent);
    html += this.endPage();
    
    return html;
  }

  // 开始新页面
  private startPage(pageNumber: number): string {
    const headerHtml = this.generateHeadersHtml();
    const footerHtml = this.generateFootersHtml();
    const backgroundHtml = this.generateBackgroundsHtml();
    
    return `
        <div class="page" data-page="${pageNumber}">
            ${backgroundHtml}
            ${headerHtml}
            <div class="content">
                {{CONTENT}}
            </div>
            ${footerHtml}
        </div>
    `;
  }

  // 结束页面
  private endPage(): string {
    return '';
  }

  // 生成元素HTML
  private generateElementHtml(element: DocumentElement): string {
    switch (element.type) {
      case 'paragraph':
        return this.generateParagraphHtml(element);
      case 'table':
        return this.generateTableHtml(element);
      case 'image':
        return this.generateImageHtml(element);
      default:
        return `<div class="${element.type}" data-id="${element.id}">${element.content}</div>`;
    }
  }

  // 生成段落HTML - 完全还原Word格式
  private generateParagraphHtml(element: DocumentElement): string {
    const styleClass = this.getElementStyleClass(element);
    const inlineStyles = this.getElementInlineStyles(element);
    
    // 处理空段落
    const content = element.content || '&nbsp;';
    
    // 根据样式确定标签类型
    let tag = 'p';
    if (element.styles?.heading) {
      const level = element.styles.heading;
      tag = `h${Math.min(level, 6)}`;
    }
    
    // 添加Word标准段落样式
    const wordStyles = [
      'margin: 0pt 0pt 8pt 0pt',
      'line-height: 1.08',
      'font-family: Calibri, sans-serif',
      'font-size: 11pt',
      inlineStyles
    ].filter(Boolean).join('; ');
    
    return `<${tag} class="paragraph ${styleClass}" style="${wordStyles}" data-id="${element.id}">${content}</${tag}>`;
  }

  // 生成表格HTML - Word标准格式
  private generateTableHtml(element: DocumentElement): string {
    const styleClass = this.getElementStyleClass(element);
    const inlineStyles = this.getElementInlineStyles(element);
    
    // Word标准表格样式
    const tableStyles = [
      'border-collapse: collapse',
      'border-spacing: 0',
      'width: 100%',
      'margin: 0pt 0pt 8pt 0pt',
      'font-family: Calibri, sans-serif',
      'font-size: 11pt',
      inlineStyles
    ].filter(Boolean).join('; ');
    
    // 处理表格数据
    const rows = element.content ? element.content.split('\n') : [];
    let tableHtml = `<table class="table ${styleClass}" style="${tableStyles}" data-id="${element.id}">`;
    
    rows.forEach((row, index) => {
      const cells = row.split('\t');
      const tag = index === 0 ? 'th' : 'td';
      const cellStyle = tag === 'th' ? 
        'border: 1pt solid #000000; padding: 0pt 5.4pt 0pt 5.4pt; background-color: #F2F2F2; font-weight: bold;' :
        'border: 1pt solid #000000; padding: 0pt 5.4pt 0pt 5.4pt; vertical-align: top;';
      
      tableHtml += '<tr>';
      cells.forEach(cell => {
        tableHtml += `<${tag} style="${cellStyle}">${cell || '&nbsp;'}</${tag}>`;
      });
      tableHtml += '</tr>';
    });
    
    tableHtml += '</table>';
    return tableHtml;
  }

  // 生成图片HTML - Word标准格式
  private generateImageHtml(element: DocumentElement): string {
    const styleClass = this.getElementStyleClass(element);
    const inlineStyles = this.getElementInlineStyles(element);
    
    // 从图片集合中查找对应的base64数据
    const imageData = this.findImageData(element);
    const src = imageData ? `data:image/png;base64,${imageData}` : '';
    
    // Word标准图片样式
    const imageStyles = [
      'display: block',
      'margin: 0pt auto 8pt auto',
      'max-width: 100%',
      'height: auto',
      'border: none',
      inlineStyles
    ].filter(Boolean).join('; ');
    
    // 如果有尺寸信息，使用原始尺寸
    if (element.styles?.width || element.styles?.height) {
      const width = element.styles.width ? `width: ${element.styles.width}pt;` : '';
      const height = element.styles.height ? `height: ${element.styles.height}pt;` : '';
      const sizeStyles = [width, height].filter(Boolean).join(' ');
      return `<img class="image ${styleClass}" style="${imageStyles} ${sizeStyles}" src="${src}" alt="文档图片" data-id="${element.id}">`;
    }
    
    return `<img class="image ${styleClass}" style="${imageStyles}" src="${src}" alt="文档图片" data-id="${element.id}">`;
  }

  // 生成页眉HTML
  private generateHeadersHtml(): string {
    if (this.structure.headers.length === 0) return '';
    
    let headerHtml = '<div class="header">';
    this.structure.headers.forEach((header) => {
      headerHtml += `<div class="header-content" data-id="${header.id}">${header.content}</div>`;
    });
    headerHtml += '</div>';
    
    return headerHtml;
  }

  // 生成页脚HTML
  private generateFootersHtml(): string {
    if (this.structure.footers.length === 0) return '';
    
    let footerHtml = '<div class="footer">';
    this.structure.footers.forEach((footer) => {
      footerHtml += `<div class="footer-content" data-id="${footer.id}">${footer.content}</div>`;
    });
    footerHtml += '</div>';
    
    return footerHtml;
  }

  // 生成背景图片样式
  private generateBackgroundImageStyles(): string {
    let styles = '';
    
    this.structure.backgrounds.forEach((bg) => {
      const positioning = bg.metadata?.positioning || 'background';
      const src = bg.metadata?.src || '';
      
      styles += `
        .background-${bg.id} {
          position: ${positioning === 'watermark' ? 'fixed' : 'absolute'};
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background-image: url(${src});
          background-repeat: no-repeat;
          background-size: contain;
          opacity: 1;
          z-index: ${positioning === 'watermark' ? '1000' : '-1'};
        }
      `;
    });
    
    return styles;
  }

  // 生成背景HTML
  private generateBackgroundsHtml(): string {
    if (this.structure.backgrounds.length === 0) return '';
    
    let backgroundHtml = '';
    this.structure.backgrounds.forEach(bg => {
      backgroundHtml += `<div class="background background-${bg.id}" data-id="${bg.id}"></div>`;
    });
    
    return backgroundHtml;
  }

  // 获取元素样式类名
  private getElementStyleClass(element: DocumentElement): string {
    const classes: string[] = [];
    
    // 根据样式添加类名
    if (element.styles.textAlign) {
      classes.push(`text-${element.styles.textAlign}`);
    }
    
    if (element.styles.fontWeight === 'bold') {
      classes.push('font-bold');
    }
    
    if (element.styles.fontStyle === 'italic') {
      classes.push('font-italic');
    }
    
    return classes.join(' ');
  }

  // 获取元素内联样式 - 完整Word样式支持
  private getElementInlineStyles(element: DocumentElement): string {
    if (!element.styles) return '';
    
    const styles: string[] = [];
    
    // 字体样式 - Word标准
    if (element.styles.fontFamily) {
      styles.push(`font-family: '${element.styles.fontFamily}', Calibri, sans-serif`);
    }
    if (element.styles.fontSize) {
      const size = typeof element.styles.fontSize === 'number' ? 
        `${element.styles.fontSize}pt` : element.styles.fontSize;
      styles.push(`font-size: ${size}`);
    }
    if (element.styles.fontWeight) {
      styles.push(`font-weight: ${element.styles.fontWeight}`);
    }
    if (element.styles.fontStyle) {
      styles.push(`font-style: ${element.styles.fontStyle}`);
    }
    if (element.styles.textDecoration) {
      styles.push(`text-decoration: ${element.styles.textDecoration}`);
    }
    
    // 颜色 - Word标准格式
    if (element.styles.color) {
      styles.push(`color: ${element.styles.color}`);
    }
    if (element.styles.backgroundColor) {
      styles.push(`background-color: ${element.styles.backgroundColor}`);
    }
    if (element.styles.highlight) {
      styles.push(`background-color: ${element.styles.highlight}`);
    }
    
    // 对齐和布局
    if (element.styles.textAlign) {
      styles.push(`text-align: ${element.styles.textAlign}`);
    }
    if (element.styles.verticalAlign) {
      styles.push(`vertical-align: ${element.styles.verticalAlign}`);
    }
    
    // 间距 - Word标准单位
    if (element.styles.marginTop) {
      const margin = typeof element.styles.marginTop === 'number' ? 
        `${element.styles.marginTop}pt` : element.styles.marginTop;
      styles.push(`margin-top: ${margin}`);
    }
    if (element.styles.marginBottom) {
      const margin = typeof element.styles.marginBottom === 'number' ? 
        `${element.styles.marginBottom}pt` : element.styles.marginBottom;
      styles.push(`margin-bottom: ${margin}`);
    }
    if (element.styles.marginLeft) {
      const margin = typeof element.styles.marginLeft === 'number' ? 
        `${element.styles.marginLeft}pt` : element.styles.marginLeft;
      styles.push(`margin-left: ${margin}`);
    }
    if (element.styles.marginRight) {
      const margin = typeof element.styles.marginRight === 'number' ? 
        `${element.styles.marginRight}pt` : element.styles.marginRight;
      styles.push(`margin-right: ${margin}`);
    }
    
    // 内边距
    if (element.styles.paddingLeft) {
      const padding = typeof element.styles.paddingLeft === 'number' ? 
        `${element.styles.paddingLeft}pt` : element.styles.paddingLeft;
      styles.push(`padding-left: ${padding}`);
    }
    if (element.styles.paddingRight) {
      const padding = typeof element.styles.paddingRight === 'number' ? 
        `${element.styles.paddingRight}pt` : element.styles.paddingRight;
      styles.push(`padding-right: ${padding}`);
    }
    
    // 行高和字符间距
    if (element.styles.lineHeight) {
      const lineHeight = this.convertLineHeight(element.styles.lineHeight);
      styles.push(`line-height: ${lineHeight}`);
    }
    if (element.styles.letterSpacing) {
      const spacing = typeof element.styles.letterSpacing === 'number' ? 
        `${element.styles.letterSpacing}pt` : element.styles.letterSpacing;
      styles.push(`letter-spacing: ${spacing}`);
    }
    
    // 边框
    if (element.styles.border) {
      styles.push(`border: ${element.styles.border}`);
    }
    if (element.styles.borderTop) {
      styles.push(`border-top: ${element.styles.borderTop}`);
    }
    if (element.styles.borderBottom) {
      styles.push(`border-bottom: ${element.styles.borderBottom}`);
    }
    if (element.styles.borderLeft) {
      styles.push(`border-left: ${element.styles.borderLeft}`);
    }
    if (element.styles.borderRight) {
      styles.push(`border-right: ${element.styles.borderRight}`);
    }
    
    // 尺寸
    if (element.styles.width) {
      const width = typeof element.styles.width === 'number' ? 
        `${element.styles.width}pt` : element.styles.width;
      styles.push(`width: ${width}`);
    }
    if (element.styles.height) {
      const height = typeof element.styles.height === 'number' ? 
        `${element.styles.height}pt` : element.styles.height;
      styles.push(`height: ${height}`);
    }
    
    return styles.join('; ');
  }

  // 生成样式规则
  private generateStyleRule(styleId: string, styleData: any): string {
    if (!styleData) return '';
    
    let css = `\n        .style-${styleId} {\n`;
    
    // 处理段落样式
    if (styleData.paragraph) {
      css += this.convertStylesToCSS(styleData.paragraph);
    }
    
    // 处理字符样式
    if (styleData.character) {
      css += this.convertStylesToCSS(styleData.character);
    }
    
    css += '        }\n';
    
    return css;
  }

  // 将样式对象转换为CSS
  private convertStylesToCSS(styles: Record<string, any>): string {
    let css = '';
    
    for (const [key, value] of Object.entries(styles)) {
      const cssProperty = this.convertPropertyName(key);
      const cssValue = this.convertPropertyValue(key, value);
      
      if (cssProperty && cssValue) {
        css += `            ${cssProperty}: ${cssValue};\n`;
      }
    }
    
    return css;
  }

  // 转换属性名
  private convertPropertyName(property: string): string {
    const propertyMap: Record<string, string> = {
      'textAlign': 'text-align',
      'fontFamily': 'font-family',
      'fontSize': 'font-size',
      'fontWeight': 'font-weight',
      'fontStyle': 'font-style',
      'lineHeight': 'line-height',
      'marginTop': 'margin-top',
      'marginBottom': 'margin-bottom',
      'backgroundColor': 'background-color'
    };
    
    return propertyMap[property] || property;
  }

  // 转换属性值
  private convertPropertyValue(property: string, value: any): string {
    switch (property) {
      case 'fontSize':
        return this.convertFontSize(value);
      case 'marginTop':
      case 'marginBottom':
        return this.convertSpacing(value);
      case 'lineHeight':
        return this.convertLineHeight(value);
      default:
        return String(value);
    }
  }

  // 转换字体大小
  private convertFontSize(size: string | number): string {
    if (typeof size === 'number') {
      return `${size / 2}pt`; // Word中的字号是半点制
    }
    return `${parseInt(String(size)) / 2}pt`;
  }

  // 转换间距
  private convertSpacing(spacing: string | number): string {
    if (typeof spacing === 'number') {
      return `${spacing / 20}pt`; // twips转点
    }
    return `${parseInt(String(spacing)) / 20}pt`;
  }

  // 转换行高
  private convertLineHeight(lineHeight: string | number): string {
    if (typeof lineHeight === 'number') {
      return `${lineHeight / 240}`; // Word行高单位转换
    }
    return `${parseInt(String(lineHeight)) / 240}`;
  }

  // 查找图片数据
  private findImageData(element: DocumentElement): string | null {
    // 从元素元数据中查找图片ID
    const imageId = element.metadata?.imageId || element.id.replace('image_', '');
    return this.structure.images[imageId] || null;
  }
}
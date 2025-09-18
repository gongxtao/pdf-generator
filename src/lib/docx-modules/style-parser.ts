// 样式解析模块
// 这个模块专门负责解析Word文档中的样式信息，包括段落样式、字符样式等
// 就像一个专业的造型师，负责理解和应用各种样式规则

import { DOMParser } from 'xmldom';
import { WordState, ParserState } from './types';

export class StyleParser {
  private state: ParserState;

  constructor() {
    this.state = { styles: {}, defaults: {} };
  }

  /**
   * 解析默认样式
   * @param stylesXml 样式XML内容
   * @returns 默认样式对象
   */
  parseDefaults(stylesXml: string): { paragraph?: Record<string, any>; character?: Record<string, any> } {
    if (!stylesXml) {
      return {};
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(stylesXml, 'text/xml');
      
      // 提取默认样式
      this.extractDefaultProperties(doc);
      
      return this.state.defaults;
    } catch (error) {
      console.error('解析默认样式时出错:', error);
      return {};
    }
  }

  /**
   * 解析样式XML文件
   * @param stylesXml 样式XML内容
   * @returns 解析后的样式对象
   */
  parseStyles(stylesXml: string): Record<string, any> {
    if (!stylesXml) {
      console.warn('样式XML为空，使用默认样式');
      return {};
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(stylesXml, 'text/xml');
      
      // 提取默认样式
      this.extractDefaultProperties(doc);
      
      // 提取具体样式
      this.extractStyles(doc);
      
      return this.state.styles;
    } catch (error) {
      console.error('解析样式时出错:', error);
      return {};
    }
  }

  /**
   * 提取默认样式属性
   * 这些是文档的基础样式，就像房子的地基
   */
  private extractDefaultProperties(doc: Document): void {
    const docDefaults = doc.getElementsByTagName('w:docDefaults')[0];
    if (!docDefaults) return;

    // 提取默认段落属性
    const pPrDefault = docDefaults.getElementsByTagName('w:pPrDefault')[0];
    if (pPrDefault) {
      const pPr = pPrDefault.getElementsByTagName('w:pPr')[0];
      if (pPr) {
        this.state.defaults.paragraph = this.extractParagraphProperties(pPr);
      }
    }

    // 提取默认字符属性
    const rPrDefault = docDefaults.getElementsByTagName('w:rPrDefault')[0];
    if (rPrDefault) {
      const rPr = rPrDefault.getElementsByTagName('w:rPr')[0];
      if (rPr) {
        this.state.defaults.character = this.extractCharacterProperties(rPr);
      }
    }
  }

  /**
   * 提取所有样式定义
   * 这里处理文档中定义的各种样式，比如标题样式、正文样式等
   */
  private extractStyles(doc: Document): void {
    const styles = doc.getElementsByTagName('w:style');
    
    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      const styleId = style.getAttribute('w:styleId');
      const type = style.getAttribute('w:type');
      
      if (!styleId) continue;

      const styleObj: any = {
        type: type,
        name: this.getStyleName(style),
        basedOn: this.getBasedOnStyle(style),
        next: this.getNextStyle(style),
        default: style.getAttribute('w:default') === '1'
      };

      // 根据样式类型提取不同的属性
      if (type === 'paragraph') {
        const pPr = style.getElementsByTagName('w:pPr')[0];
        if (pPr) {
          styleObj.paragraph = this.extractParagraphProperties(pPr);
        }
        
        const rPr = style.getElementsByTagName('w:rPr')[0];
        if (rPr) {
          styleObj.character = this.extractCharacterProperties(rPr);
        }
      } else if (type === 'character') {
        const rPr = style.getElementsByTagName('w:rPr')[0];
        if (rPr) {
          styleObj.character = this.extractCharacterProperties(rPr);
        }
      } else if (type === 'table') {
        const tblPr = style.getElementsByTagName('w:tblPr')[0];
        if (tblPr) {
          styleObj.table = this.extractTableProperties(tblPr);
        }
      }

      this.state.styles[styleId] = styleObj;
    }
  }

  /**
   * 提取段落属性
   * 包括对齐方式、缩进、间距等
   */
  private extractParagraphProperties(pPr: Element): any {
    const props: any = {};

    // 对齐方式
    const jc = pPr.getElementsByTagName('w:jc')[0];
    if (jc) {
      props.alignment = jc.getAttribute('w:val') || 'left';
    }

    // 缩进
    const ind = pPr.getElementsByTagName('w:ind')[0];
    if (ind) {
      props.indent = {
        left: this.parseLength(ind.getAttribute('w:left')),
        right: this.parseLength(ind.getAttribute('w:right')),
        firstLine: this.parseLength(ind.getAttribute('w:firstLine')),
        hanging: this.parseLength(ind.getAttribute('w:hanging'))
      };
    }

    // 间距
    const spacing = pPr.getElementsByTagName('w:spacing')[0];
    if (spacing) {
      props.spacing = {
        before: this.parseLength(spacing.getAttribute('w:before')),
        after: this.parseLength(spacing.getAttribute('w:after')),
        line: this.parseLength(spacing.getAttribute('w:line')),
        lineRule: spacing.getAttribute('w:lineRule')
      };
    }

    // 边框
    const pBdr = pPr.getElementsByTagName('w:pBdr')[0];
    if (pBdr) {
      props.borders = this.extractBorders(pBdr);
    }

    // 底纹
    const shd = pPr.getElementsByTagName('w:shd')[0];
    if (shd) {
      props.shading = {
        fill: shd.getAttribute('w:fill'),
        color: shd.getAttribute('w:color'),
        val: shd.getAttribute('w:val')
      };
    }

    return props;
  }

  /**
   * 提取字符属性
   * 包括字体、字号、颜色、粗体、斜体等
   */
  private extractCharacterProperties(rPr: Element): any {
    const props: any = {};

    // 字体
    const rFonts = rPr.getElementsByTagName('w:rFonts')[0];
    if (rFonts) {
      props.fonts = {
        ascii: rFonts.getAttribute('w:ascii'),
        hAnsi: rFonts.getAttribute('w:hAnsi'),
        eastAsia: rFonts.getAttribute('w:eastAsia'),
        cs: rFonts.getAttribute('w:cs'),
        theme: rFonts.getAttribute('w:asciiTheme') || rFonts.getAttribute('w:hAnsiTheme')
      };
    }

    // 字号
    const sz = rPr.getElementsByTagName('w:sz')[0];
    if (sz) {
      props.fontSize = parseInt(sz.getAttribute('w:val') || '0') / 2; // 半磅转磅
    }

    // 颜色
    const color = rPr.getElementsByTagName('w:color')[0];
    if (color) {
      const val = color.getAttribute('w:val');
      const theme = color.getAttribute('w:theme');
      if (val && val !== 'auto') {
        props.color = '#' + val;
      } else if (theme) {
        props.themeColor = theme;
      }
    }

    // 粗体
    const b = rPr.getElementsByTagName('w:b')[0];
    if (b) {
      const val = b.getAttribute('w:val');
      props.bold = val !== '0' && val !== 'false';
    }

    // 斜体
    const i = rPr.getElementsByTagName('w:i')[0];
    if (i) {
      const val = i.getAttribute('w:val');
      props.italic = val !== '0' && val !== 'false';
    }

    // 下划线
    const u = rPr.getElementsByTagName('w:u')[0];
    if (u) {
      const val = u.getAttribute('w:val');
      props.underline = val && val !== 'none';
      if (props.underline) {
        props.underlineType = val;
      }
    }

    // 删除线
    const strike = rPr.getElementsByTagName('w:strike')[0];
    if (strike) {
      const val = strike.getAttribute('w:val');
      props.strike = val !== '0' && val !== 'false';
    }

    // 高亮
    const highlight = rPr.getElementsByTagName('w:highlight')[0];
    if (highlight) {
      props.highlight = highlight.getAttribute('w:val');
    }

    // 底纹
    const shd = rPr.getElementsByTagName('w:shd')[0];
    if (shd) {
      props.shading = {
        fill: shd.getAttribute('w:fill'),
        color: shd.getAttribute('w:color'),
        val: shd.getAttribute('w:val')
      };
    }

    return props;
  }

  /**
   * 提取表格属性
   */
  private extractTableProperties(tblPr: Element): any {
    const props: any = {};

    // 表格宽度
    const tblW = tblPr.getElementsByTagName('w:tblW')[0];
    if (tblW) {
      props.width = {
        value: parseInt(tblW.getAttribute('w:w') || '0'),
        type: tblW.getAttribute('w:type')
      };
    }

    // 表格对齐
    const jc = tblPr.getElementsByTagName('w:jc')[0];
    if (jc) {
      props.alignment = jc.getAttribute('w:val');
    }

    // 表格边框
    const tblBorders = tblPr.getElementsByTagName('w:tblBorders')[0];
    if (tblBorders) {
      props.borders = this.extractBorders(tblBorders);
    }

    return props;
  }

  /**
   * 提取边框信息
   */
  private extractBorders(borderContainer: Element): any {
    const borders: any = {};
    
    const borderTypes = ['top', 'left', 'bottom', 'right', 'insideH', 'insideV'];
    
    for (const type of borderTypes) {
      const border = borderContainer.getElementsByTagName(`w:${type}`)[0];
      if (border) {
        borders[type] = {
          style: border.getAttribute('w:val'),
          color: border.getAttribute('w:color'),
          size: parseInt(border.getAttribute('w:sz') || '0'),
          space: parseInt(border.getAttribute('w:space') || '0')
        };
      }
    }

    return borders;
  }

  /**
   * 获取样式名称
   */
  private getStyleName(style: Element): string {
    const name = style.getElementsByTagName('w:name')[0];
    return name ? name.getAttribute('w:val') || '' : '';
  }

  /**
   * 获取基于的样式
   */
  private getBasedOnStyle(style: Element): string | undefined {
    const basedOn = style.getElementsByTagName('w:basedOn')[0];
    return basedOn ? basedOn.getAttribute('w:val') || undefined : undefined;
  }

  /**
   * 获取下一个样式
   */
  private getNextStyle(style: Element): string | undefined {
    const next = style.getElementsByTagName('w:next')[0];
    return next ? next.getAttribute('w:val') || undefined : undefined;
  }

  /**
   * 解析长度值（twips转换为像素）
   */
  private parseLength(value: string | null): number | undefined {
    if (!value) return undefined;
    const twips = parseInt(value);
    return isNaN(twips) ? undefined : this.twipsToPixels(twips);
  }

  /**
   * Twips转像素
   * Twips是Word中的长度单位，1英寸=1440twips，1英寸=96像素
   */
  private twipsToPixels(twips: number): number {
    return Math.round(twips * 96 / 1440);
  }

  /**
   * 获取解析状态
   */
  getState(): ParserState {
    return this.state;
  }

  /**
   * 应用样式继承
   * Word中的样式可以基于其他样式，需要处理这种继承关系
   */
  applyStyleInheritance(): void {
    for (const styleId in this.state.styles) {
      this.resolveStyleInheritance(styleId, new Set());
    }
  }

  /**
   * 递归解析样式继承
   */
  private resolveStyleInheritance(styleId: string, visited: Set<string>): any {
    if (visited.has(styleId)) {
      console.warn(`检测到样式循环引用: ${styleId}`);
      return {};
    }

    visited.add(styleId);
    const style = this.state.styles[styleId];
    
    if (!style) return {};

    let resolvedStyle = { ...style };

    // 如果有基于的样式，先解析基础样式
    if (style.basedOn && this.state.styles[style.basedOn]) {
      const baseStyle = this.resolveStyleInheritance(style.basedOn, visited);
      resolvedStyle = this.mergeStyles(baseStyle, resolvedStyle);
    }

    visited.delete(styleId);
    this.state.styles[styleId] = resolvedStyle;
    
    return resolvedStyle;
  }

  /**
   * 合并样式对象
   */
  private mergeStyles(baseStyle: any, currentStyle: any): any {
    const merged = { ...baseStyle };
    
    for (const key in currentStyle) {
      if (currentStyle[key] && typeof currentStyle[key] === 'object' && !Array.isArray(currentStyle[key])) {
        merged[key] = { ...merged[key], ...currentStyle[key] };
      } else {
        merged[key] = currentStyle[key];
      }
    }
    
    return merged;
  }
}
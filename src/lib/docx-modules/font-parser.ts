// 字体解析模块
// 这个模块专门负责解析Word文档中的字体信息
// 就像一个字体专家，负责理解和处理各种字体设置

import { DOMParser } from 'xmldom';
import { WordState } from './types';

export class FontParser {
  private fontTable: WordState['fontTable'] = {};

  /**
   * 解析字体表XML文件
   * @param fontTableXml 字体表XML内容
   * @returns 字体表对象
   */
  parseFontTable(fontTableXml: string): WordState['fontTable'] {
    if (!fontTableXml) {
      console.warn('字体表XML为空，使用默认字体');
      return this.getDefaultFontTable();
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(fontTableXml, 'text/xml');
      
      this.fontTable = {
        fonts: {}
      };

      // 解析字体定义
      this.extractFontDefinitions(doc);
      
      // 如果没有解析到任何字体，返回默认字体表
      if (!this.fontTable.fonts || Object.keys(this.fontTable.fonts).length === 0) {
        console.warn('未找到字体定义，使用默认字体表');
        return this.getDefaultFontTable();
      }

      return this.fontTable;
    } catch (error) {
      console.error('解析字体表时出错:', error);
      return this.getDefaultFontTable();
    }
  }

  /**
   * 解析主题字体XML文件
   * @param themeXml 主题XML内容
   * @returns 主题字体信息
   */
  parseThemeFonts(themeXml: string): { majorFont?: { latin?: string; eastAsia?: string; complexScript?: string }; minorFont?: { latin?: string; eastAsia?: string; complexScript?: string } } {
    const defaultThemeFonts = {
      majorFont: {
        latin: 'Calibri Light',
        eastAsia: '等线 Light',
        complexScript: 'Times New Roman'
      },
      minorFont: {
        latin: 'Calibri',
        eastAsia: '等线',
        complexScript: 'Times New Roman'
      }
    };

    if (!themeXml) {
      console.warn('主题XML为空，使用默认主题字体');
      return defaultThemeFonts;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(themeXml, 'text/xml');
      
      const themeFonts = this.extractThemeFontsFromXml(doc);
      
      return {
        majorFont: { ...defaultThemeFonts.majorFont, ...themeFonts.majorFont },
        minorFont: { ...defaultThemeFonts.minorFont, ...themeFonts.minorFont }
      };
    } catch (error) {
      console.error('解析主题字体时出错:', error);
      return defaultThemeFonts;
    }
  }

  /**
   * 从XML中提取字体定义
   */
  private extractFontDefinitions(doc: Document): void {
    const fonts = doc.getElementsByTagName('w:font');
    
    for (let i = 0; i < fonts.length; i++) {
      const font = fonts[i];
      const name = font.getAttribute('w:name');
      
      if (!name) continue;

      const fontInfo: any = {
        name: name
      };

      // 提取字体属性
      const altName = this.getFontAttribute(font, 'w:altName');
      if (altName) fontInfo.altName = altName;

      const family = this.getFontAttribute(font, 'w:family');
      if (family) fontInfo.family = family;

      const charset = this.getFontAttribute(font, 'w:charset');
      if (charset) fontInfo.charset = charset;

      const pitch = this.getFontAttribute(font, 'w:pitch');
      if (pitch) fontInfo.pitch = pitch;

      // 提取字体签名信息
      const sig = font.getElementsByTagName('w:sig')[0];
      if (sig) {
        fontInfo.signature = {
          usb0: sig.getAttribute('w:usb0'),
          usb1: sig.getAttribute('w:usb1'),
          usb2: sig.getAttribute('w:usb2'),
          usb3: sig.getAttribute('w:usb3'),
          csb0: sig.getAttribute('w:csb0'),
          csb1: sig.getAttribute('w:csb1')
        };
      }

      // 提取Panose信息（字体分类信息）
      const panose1 = font.getElementsByTagName('w:panose1')[0];
      if (panose1) {
        fontInfo.panose = panose1.getAttribute('w:val');
      }

      if (!this.fontTable?.fonts) {
        if (this.fontTable) {
          this.fontTable.fonts = {};
        }
      }
      
      if (this.fontTable?.fonts) {
        this.fontTable.fonts[name] = fontInfo;
      }
    }
  }

  /**
   * 从主题XML中提取主题字体
   */
  private extractThemeFontsFromXml(doc: Document): { majorFont?: { latin?: string; eastAsia?: string; complexScript?: string }; minorFont?: { latin?: string; eastAsia?: string; complexScript?: string } } {
    const themeFonts: { majorFont?: { latin?: string; eastAsia?: string; complexScript?: string }; minorFont?: { latin?: string; eastAsia?: string; complexScript?: string } } = {};

    try {
      // 查找字体方案 (a:fontScheme)
      const fontSchemes = doc.getElementsByTagName('a:fontScheme');
      if (fontSchemes.length === 0) {
        console.warn('未找到字体方案 (a:fontScheme)');
        return themeFonts;
      }

      const fontScheme = fontSchemes[0];

      // 提取主要字体 (a:majorFont)
      const majorFontElement = fontScheme.getElementsByTagName('a:majorFont')[0];
      if (majorFontElement) {
        themeFonts.majorFont = this.extractFontFromElement(majorFontElement);
      }

      // 提取次要字体 (a:minorFont)
      const minorFontElement = fontScheme.getElementsByTagName('a:minorFont')[0];
      if (minorFontElement) {
        themeFonts.minorFont = this.extractFontFromElement(minorFontElement);
      }

    } catch (error) {
      console.error('提取主题字体时出错:', error);
    }

    return themeFonts;
  }

  /**
   * 从字体元素中提取字体信息
   */
  private extractFontFromElement(fontElement: Element): { latin?: string; eastAsia?: string; complexScript?: string } {
    const fontInfo: { latin?: string; eastAsia?: string; complexScript?: string } = {};

    // 拉丁字体
    const latin = fontElement.getElementsByTagName('a:latin')[0];
    if (latin) {
      fontInfo.latin = latin.getAttribute('typeface') || undefined;
    }

    // 东亚字体
    const eastAsia = fontElement.getElementsByTagName('a:ea')[0];
    if (eastAsia) {
      fontInfo.eastAsia = eastAsia.getAttribute('typeface') || undefined;
    }

    // 复杂脚本字体
    const cs = fontElement.getElementsByTagName('a:cs')[0];
    if (cs) {
      fontInfo.complexScript = cs.getAttribute('typeface') || undefined;
    }

    return fontInfo;
  }

  /**
   * 获取字体属性
   */
  private getFontAttribute(fontElement: Element, attributeName: string): string | undefined {
    const value = fontElement.getAttribute(attributeName);
    return value || undefined;
  }

  /**
   * 获取默认字体表
   */
  private getDefaultFontTable(): WordState['fontTable'] {
    return {
      majorFont: {
        latin: 'Calibri Light',
        eastAsia: '等线 Light',
        complexScript: 'Times New Roman'
      },
      minorFont: {
        latin: 'Calibri',
        eastAsia: '等线',
        complexScript: 'Times New Roman'
      },
      fonts: {
        'Calibri': {
          name: 'Calibri',
          family: 'swiss',
          charset: '0'
        },
        'Calibri Light': {
          name: 'Calibri Light',
          family: 'swiss',
          charset: '0'
        },
        '等线': {
          name: '等线',
          family: 'auto',
          charset: '134'
        },
        '等线 Light': {
          name: '等线 Light',
          family: 'auto',
          charset: '134'
        },
        'Times New Roman': {
          name: 'Times New Roman',
          family: 'roman',
          charset: '0'
        },
        'Arial': {
          name: 'Arial',
          family: 'swiss',
          charset: '0'
        }
      }
    };
  }

  /**
   * 解析字体引用并返回实际字体名称
   * @param rPr 运行属性元素
   * @param styleId 样式ID
   * @param themeColors 主题颜色
   * @returns 字体名称
   */
  resolveFontFamily(rPr: Element | null, styleId?: string, themeFonts?: { majorFont?: { latin?: string; eastAsia?: string; complexScript?: string }; minorFont?: { latin?: string; eastAsia?: string; complexScript?: string } }): string {
    // 1. 首先尝试从运行属性中直接获取字体
    const directFont = this.extractDirectFont(rPr);
    if (directFont) {
      return directFont;
    }

    // 2. 尝试从主题字体引用中获取
    const themeFont = this.resolveThemeFont(rPr, themeFonts);
    if (themeFont) {
      return themeFont;
    }

    // 3. 尝试从样式中获取字体
    if (styleId) {
      const styleFont = this.getStyleFont(styleId);
      if (styleFont) {
        return styleFont;
      }
    }

    // 4. 返回文档默认字体
    return this.getDocumentDefaultFont();
  }

  /**
   * 从运行属性中直接提取字体
   */
  private extractDirectFont(rPr: Element | null): string | null {
    if (!rPr) return null;

    const rFonts = rPr.getElementsByTagName('w:rFonts')[0];
    if (!rFonts) return null;

    // 按优先级尝试不同的字体属性
    const fontAttributes = ['w:ascii', 'w:hAnsi', 'w:eastAsia', 'w:cs'];
    
    for (const attr of fontAttributes) {
      const fontName = rFonts.getAttribute(attr);
      if (fontName && fontName !== '') {
        return fontName;
      }
    }

    return null;
  }

  /**
   * 解析主题字体引用
   */
  private resolveThemeFont(rPr: Element | null, themeFonts?: { majorFont?: { latin?: string; eastAsia?: string; complexScript?: string }; minorFont?: { latin?: string; eastAsia?: string; complexScript?: string } }): string | null {
    if (!rPr || !themeFonts) return null;

    const rFonts = rPr.getElementsByTagName('w:rFonts')[0];
    if (!rFonts) return null;

    // 检查主题字体引用
    const themeAttributes = [
      { attr: 'w:asciiTheme', type: 'ascii' },
      { attr: 'w:hAnsiTheme', type: 'hAnsi' },
      { attr: 'w:eastAsiaTheme', type: 'eastAsia' },
      { attr: 'w:csTheme', type: 'cs' }
    ];

    for (const { attr, type } of themeAttributes) {
      const themeRef = rFonts.getAttribute(attr);
      if (themeRef) {
        const themeFont = this.getThemeFont(themeRef, type, themeFonts);
        if (themeFont) {
          return themeFont;
        }
      }
    }

    return null;
  }

  /**
   * 根据主题引用获取字体
   */
  private getThemeFont(themeRef: string, fontType: string, themeFonts: { majorFont?: { latin?: string; eastAsia?: string; complexScript?: string }; minorFont?: { latin?: string; eastAsia?: string; complexScript?: string } }): string | null {
    let fontGroup: any = null;

    // 确定字体组
    if (themeRef === 'majorEastAsia' || themeRef === 'majorBidi' || themeRef === 'majorAscii' || themeRef === 'majorHAnsi') {
      fontGroup = themeFonts.majorFont;
    } else if (themeRef === 'minorEastAsia' || themeRef === 'minorBidi' || themeRef === 'minorAscii' || themeRef === 'minorHAnsi') {
      fontGroup = themeFonts.minorFont;
    }

    if (!fontGroup) return null;

    // 根据字体类型返回相应字体
    if (fontType === 'eastAsia' && fontGroup.eastAsia) {
      return fontGroup.eastAsia;
    } else if ((fontType === 'ascii' || fontType === 'hAnsi') && fontGroup.latin) {
      return fontGroup.latin;
    } else if (fontType === 'cs' && fontGroup.complexScript) {
      return fontGroup.complexScript;
    }

    // 如果找不到对应类型，返回拉丁字体作为后备
    return fontGroup.latin || null;
  }

  /**
   * 从样式中获取字体（需要样式解析器支持）
   */
  private getStyleFont(styleId: string): string | null {
    // 这里需要与样式解析器集成
    // 暂时返回null，在主解析器中会处理
    return null;
  }

  /**
   * 获取文档默认字体
   */
  private getDocumentDefaultFont(): string {
    // 尝试从字体表中获取默认字体
    if (this.fontTable?.minorFont?.latin) {
      return this.fontTable.minorFont.latin;
    }

    // 返回系统默认字体
    return 'Calibri';
  }

  /**
   * 字体回退处理
   * 当指定字体不可用时，提供合适的替代字体
   */
  getFontFallback(fontName: string): string {
    // 字体回退映射表
    const fallbackMap: Record<string, string> = {
      // 中文字体回退
      '宋体': 'SimSun, "Times New Roman", serif',
      '黑体': 'SimHei, Arial, sans-serif',
      '楷体': 'KaiTi, "Times New Roman", serif',
      '仿宋': 'FangSong, "Times New Roman", serif',
      '微软雅黑': 'Microsoft YaHei, Arial, sans-serif',
      '等线': 'DengXian, Arial, sans-serif',
      '等线 Light': 'DengXian Light, Arial, sans-serif',
      
      // 英文字体回退
      'Times New Roman': 'Times New Roman, Times, serif',
      'Arial': 'Arial, Helvetica, sans-serif',
      'Calibri': 'Calibri, Arial, sans-serif',
      'Calibri Light': 'Calibri Light, Calibri, Arial, sans-serif',
      'Cambria': 'Cambria, "Times New Roman", serif',
      'Consolas': 'Consolas, "Courier New", monospace',
      'Georgia': 'Georgia, "Times New Roman", serif',
      'Tahoma': 'Tahoma, Arial, sans-serif',
      'Verdana': 'Verdana, Arial, sans-serif',
      
      // 特殊字体回退
      'Symbol': 'Symbol, serif',
      'Wingdings': 'Wingdings, serif',
      'Webdings': 'Webdings, serif'
    };

    // 如果有直接映射，返回映射值
    if (fallbackMap[fontName]) {
      return fallbackMap[fontName];
    }

    // 根据字体特征进行智能回退
    const lowerFontName = fontName.toLowerCase();
    
    // 中文字体
    if (this.isCJKFont(fontName)) {
      return `${fontName}, "Microsoft YaHei", Arial, sans-serif`;
    }
    
    // 等宽字体
    if (lowerFontName.includes('mono') || lowerFontName.includes('consol') || lowerFontName.includes('courier')) {
      return `${fontName}, "Courier New", monospace`;
    }
    
    // 衬线字体
    if (lowerFontName.includes('times') || lowerFontName.includes('serif') || lowerFontName.includes('georgia')) {
      return `${fontName}, "Times New Roman", serif`;
    }
    
    // 默认无衬线字体回退
    return `${fontName}, Arial, sans-serif`;
  }

  /**
   * 检查是否为CJK字体（中日韩字体）
   */
  private isCJKFont(fontName: string): boolean {
    // 检查字体名称中是否包含中文字符
    const cjkRegex = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff]/;
    if (cjkRegex.test(fontName)) {
      return true;
    }

    // 检查常见的CJK字体名称
    const cjkFontNames = [
      '宋体', '黑体', '楷体', '仿宋', '微软雅黑', '等线', 'SimSun', 'SimHei', 
      'KaiTi', 'FangSong', 'Microsoft YaHei', 'DengXian',
      'MS Gothic', 'MS Mincho', 'Meiryo', 'Yu Gothic',
      'Malgun Gothic', 'Batang', 'Dotum'
    ];

    return cjkFontNames.some(name => fontName.includes(name));
  }

  /**
   * 获取字体信息
   */
  getFontInfo(fontName: string): any {
    if (this.fontTable?.fonts && this.fontTable.fonts[fontName]) {
      return this.fontTable.fonts[fontName];
    }
    return null;
  }

  /**
   * 获取当前字体表
   */
  getFontTable(): WordState['fontTable'] {
    return this.fontTable;
  }
}
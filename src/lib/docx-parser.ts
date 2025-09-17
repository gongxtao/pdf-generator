// 深度Word文档解析器
// 直接解析docx文件的XML结构，获取完整的文档元数据
import * as JSZip from 'jszip';
import { DOMParser } from 'xmldom';

// 文档元素类型定义
export interface DocumentElement {
  type: 'paragraph' | 'table' | 'image' | 'header' | 'footer' | 'background' | 'pageBreak';
  id: string;
  content: string;
  styles: Record<string, any>;
  position: {
    page?: number;
    section?: number;
    order: number;
  };
  metadata?: Record<string, any>;
}

// 页面设置信息
export interface PageSettings {
  width: number;
  height: number;
  margins: {
    top: number;
    bottom: number;
    left: number;
    right: number;
    header: number;
    footer: number;
  };
  orientation: 'portrait' | 'landscape';
}

// 文档结构信息
export interface DocumentStructure {
  elements: DocumentElement[];
  pageSettings: PageSettings;
  styles: Record<string, any>;
  headers: DocumentElement[];
  footers: DocumentElement[];
  backgrounds: DocumentElement[];
  images: Record<string, string>;
  metadata?: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    pageCount?: number;
    wordCount?: number;
  };
}

interface WordState {
  page: { 
    width: number; 
    height: number; 
    margin: [number, number, number, number]; // [top, right, bottom, left]
    gutter?: number; // 装订线
  };
  backgroundImage?: { 
    src: string; 
    type: 'A' | 'B'; // A: 页面背景, B: 页眉背景
  };
  floatingImages: { 
    src: string; 
    left: string; 
    top: string; 
    zIndex: number;
    behindDoc?: boolean;
  }[];
  paragraphs: {
    styleId?: string;
    indent: { 
      firstLine?: number; 
      hanging?: number; 
      left?: number; 
      right?: number;
    };
    spacing: { 
      before?: number; 
      after?: number; 
      line?: number; 
      lineRule?: string;
    };
    alignment: 'left' | 'center' | 'right' | 'justify';
    runs: {
      text: string;
      bold?: boolean; 
      italic?: boolean; 
      color?: string; 
      font?: string; 
      sz?: number; // 字号（磅值）
      underline?: boolean;
      strike?: boolean;
    }[];
  }[];
  tables: {
    styleId?: string;
    borders: { 
      top: Border; 
      left: Border; 
      bottom: Border; 
      right: Border; 
      insideH: Border; 
      insideV: Border;
    };
    rows: {
      height?: number;
      cells: { 
        width?: number; 
        colSpan?: number; 
        rowSpan?: number;
        background?: string; 
        content: any[];
        borders?: {
          top?: Border;
          left?: Border;
          bottom?: Border;
          right?: Border;
        };
      }[];
    }[];
  }[];
  lists: {
    abstractNumId: number;
    levels: { 
      numFmt: 'bullet' | 'decimal' | 'lowerLetter' | 'upperLetter' | 'lowerRoman' | 'upperRoman'; 
      lvlText: string; 
      indent: number;
      start?: number;
    }[];
  }[];
  themeColors: { 
    accent1: string; 
    accent2: string; 
    accent3: string; 
    accent4: string; 
    accent5: string; 
    accent6: string;
  };
  styles: Record<string, any>;
  lang: string;
  rtl: boolean;
  headers?: string[];
  footers?: string[];
  images?: Record<string, string>;
  metadata?: {
    title?: string;
    author?: string;
    created?: string;
    modified?: string;
    pageCount?: number;
    wordCount?: number;
  };
}

interface Border {
  style?: string;
  color?: string;
  size?: number;
  space?: number;
}

export class DocxParser {
  private zip: any = null;
  private documentXml: string = '';
  private stylesXml: string = '';
  private numberingXml: string = '';
  private themeXml: string = '';
  private relsXml: string = '';
  private settingsXml: string = '';
  private fontTableXml: string = '';
  private headerXmls: Map<string, string> = new Map();
  private footerXmls: Map<string, string> = new Map();
  private images: Map<string, string> = new Map();
  private state: {
    styles: Record<string, any>;
    defaults: {
      paragraph?: Record<string, any>;
      character?: Record<string, any>;
    };
  } = { styles: {}, defaults: {} };

  // 解析docx文件
  async parseDocx(buffer: Buffer): Promise<WordState> {
    try {
      // 1. 解压docx文件
      this.zip = await JSZip.loadAsync(buffer);
      
      // 2. 提取所有XML文件
      await this.extractXmlFiles();
      
      // 3. 提取图片资源
      await this.extractImages();
      
      // 4. 主题色 → 先读 theme1.xml 拿到 Accent1-6 RGB
      const themeColors = this.extractThemeColors(this.documentXml || '') as WordState['themeColors'];
      
      // 5. 背景图 → detectBackgroundRel(zip)
      const backgroundImage = await this.detectBackgroundImage();
      
      // 6. 样式表 → parseStyles(zip) → 产出 styleId → CSS 属性 映射
      const styles = this.parseStyles();
      
      // 7. 编号表 → parseNumbering(zip) → 产出 abstractNumId → 符号/编号
      const lists = this.parseNumbering() as WordState['lists'];
      
      // 8. 文档主体 → parseDocumentXml(zip, 映射表) → 产出 paragraphs[], tables[], floatingImages[]
      const documentData = await this.parseDocumentXml(styles, themeColors);
      
      // 9. 提取页眉页脚
      const { headers, footers } = await this.parseHeadersFooters();
      
      // 10. 提取元数据
      const metadata = await this.extractCoreProperties();
      
      return {
        page: documentData.page,
        backgroundImage,
        floatingImages: documentData.floatingImages,
        paragraphs: documentData.paragraphs,
        tables: documentData.tables,
        lists,
        themeColors,
        styles,
        lang: documentData.lang,
        rtl: documentData.rtl,
        headers,
        footers,
        images: Object.fromEntries(this.images),
        metadata
      };
    } catch (error) {
      console.error('DOCX解析失败:', error);
      throw new Error('Word文档解析失败');
    }
  }

  // 提取所有XML文件
  private async extractXmlFiles(): Promise<void> {
    if (!this.zip) throw new Error('ZIP文件未加载');

    try {
      // 提取主要的XML文件
      const documentFile = this.zip.file('word/document.xml');
      const stylesFile = this.zip.file('word/styles.xml');
      const settingsFile = this.zip.file('word/settings.xml');
      const fontTableFile = this.zip.file('word/fontTable.xml');
      const relsFile = this.zip.file('word/_rels/document.xml.rels');

      if (documentFile) {
        this.documentXml = await documentFile.async('text');
      }
      if (stylesFile) {
        this.stylesXml = await stylesFile.async('text');
      }
      if (settingsFile) {
        this.settingsXml = await settingsFile.async('text');
      }
      if (fontTableFile) {
        this.fontTableXml = await fontTableFile.async('text');
      }
      if (relsFile) {
        this.relsXml = await relsFile.async('text');
      }

      // 提取页眉页脚文件
      const headerFiles = this.zip.file(/word\/header\d+\.xml/);
      const footerFiles = this.zip.file(/word\/footer\d+\.xml/);

      for (const file of headerFiles) {
        const content = await file.async('text');
        const match = file.name.match(/header(\d+)\.xml/);
        if (match) {
          this.headerXmls.set(match[1], content);
        }
      }

      for (const file of footerFiles) {
        const content = await file.async('text');
        const match = file.name.match(/footer(\d+)\.xml/);
        if (match) {
          this.footerXmls.set(match[1], content);
        }
      }
    } catch (error) {
      console.error('提取XML文件失败:', error);
      throw new Error('无法提取文档结构');
    }
  }

  // 提取图片资源
  private async extractImages(): Promise<void> {
    if (!this.zip) return;

    const imageFiles = Object.keys(this.zip.files).filter(name => 
      name.startsWith('word/media/') && /\.(png|jpg|jpeg|gif|bmp)$/i.test(name)
    );

    for (const imageFile of imageFiles) {
      const file = this.zip.file(imageFile);
      if (file) {
        const buffer = await file.async('uint8array');
        const base64 = this.arrayBufferToBase64(buffer);
        const imageId = imageFile.split('/').pop() || imageFile;
        this.images.set(imageId, base64);
      }
    }
  }

  // 提取主题颜色
  private extractThemeColors(xml: string): Record<string, string> {
    const colors: Record<string, string> = {};
    const themeMatch = xml.match(/<a:theme[^>]*>[\s\S]*?<\/a:theme>/);
    
    if (themeMatch) {
      const theme1Match = themeMatch[0].match(/<a:clrScheme[^>]*>[\s\S]*?<\/a:clrScheme>/);
      if (theme1Match) {
        const colorMatches = theme1Match[0].match(/<a:([a-zA-Z]+)[^>]*>\s*<a:srgbClr\s+val="([A-Fa-f0-9]{6})"\s*\/\>\s*<\/a:[a-zA-Z]+>/g);
        if (colorMatches) {
          colorMatches.forEach(match => {
            const nameMatch = match.match(/<a:([a-zA-Z]+)[^>]*>/);
            const colorMatch = match.match(/<a:srgbClr\s+val="([A-Fa-f0-9]{6})"/);
            if (nameMatch && colorMatch) {
              colors[nameMatch[1]] = `#${colorMatch[1]}`;
            }
          });
        }
      }
    }
    
    return colors;
  }

  // 辅助方法：检查是否为粗体
  private isBold(rPr: Element | null): boolean {
    if (!rPr) return false;
    let b = rPr.getElementsByTagName('w:b')[0];
    if (!b) {
      b = rPr.getElementsByTagName('b')[0];
    }
    return b ? b.getAttribute('w:val') !== 'false' : false;
  }

  // 辅助方法：检查是否为斜体
  private isItalic(rPr: Element | null): boolean {
    if (!rPr) return false;
    let i = rPr.getElementsByTagName('w:i')[0];
    if (!i) {
      i = rPr.getElementsByTagName('i')[0];
    }
    return i ? i.getAttribute('w:val') !== 'false' : false;
  }

  // 辅助方法：检查是否下划线
  private isUnderline(rPr: Element | null): boolean {
    if (!rPr) return false;
    let u = rPr.getElementsByTagName('w:u')[0];
    if (!u) {
      u = rPr.getElementsByTagName('u')[0];
    }
    return u ? u.getAttribute('w:val') !== 'none' : false;
  }

  // 辅助方法：获取字体族
  private getFontFamily(rPr: Element | null): string {
    if (!rPr) return 'Times New Roman';
    let rFonts = rPr.getElementsByTagName('w:rFonts')[0];
    if (!rFonts) {
      rFonts = rPr.getElementsByTagName('rFonts')[0];
    }
    if (rFonts) {
      return rFonts.getAttribute('w:ascii') || 
             rFonts.getAttribute('ascii') ||
             rFonts.getAttribute('w:hAnsi') || 
             rFonts.getAttribute('hAnsi') ||
             rFonts.getAttribute('w:eastAsia') || 
             rFonts.getAttribute('eastAsia') ||
             'Times New Roman';
    }
    return 'Times New Roman';
  }

  // 辅助方法：获取颜色
  private getColor(rPr: Element | null): string {
    if (!rPr) return '#000000';
    let color = rPr.getElementsByTagName('w:color')[0];
    if (!color) {
      color = rPr.getElementsByTagName('color')[0];
    }
    if (color) {
      const val = color.getAttribute('w:val') || color.getAttribute('val');
      return val ? `#${val}` : '#000000';
    }
    return '#000000';
  }

  // 辅助方法：获取字体大小
  private getFontSize(rPr: Element | null): number {
    if (!rPr) return 11;
    let sz = rPr.getElementsByTagName('w:sz')[0];
    if (!sz) {
      sz = rPr.getElementsByTagName('sz')[0];
    }
    if (sz) {
      const val = sz.getAttribute('w:val') || sz.getAttribute('val');
      return val ? parseInt(val) / 2 : 11;
    }
    return 11;
  }

  private async detectBackgroundImage(): Promise<WordState['backgroundImage']> {
    if (!this.zip || !this.documentXml) return undefined;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.documentXml, 'text/xml');
      
      // 检查页面背景
      const backgrounds = doc.getElementsByTagName('w:background');
      if (backgrounds.length > 0) {
        const background = backgrounds[0];
        const id = background.getAttribute('r\\:id') || background.getAttribute('id');
        if (id && this.zip && this.zip.files && Object.keys(this.zip.files).length > 0) {
          const imageData = await this.getImageByRelId(id);
          if (imageData && imageData.length > 0) {
            return {
              src: imageData,
              type: 'A' // 页面背景
            };
          }
        }
      }

      // 检查页眉背景
      for (const [id, headerXml] of Array.from(this.headerXmls.entries())) {
        const headerDoc = parser.parseFromString(headerXml, 'text/xml');
        const backgrounds = headerDoc.getElementsByTagName('w:background');
        const pics = headerDoc.getElementsByTagName('pic:pic');
        const allElements = [...Array.from(backgrounds), ...Array.from(pics)];
        
        for (const headerBackground of allElements) {
          const imageData = await this.extractImageFromElement(headerBackground);
          if (imageData) {
            return {
              src: imageData,
              type: 'B' // 页眉背景
            };
          }
        }
      }

      return undefined;
    } catch (error) {
      console.error('检测背景图片失败:', error);
      return undefined;
    }
  }

  private async getImageByRelId(relId: string): Promise<string | undefined> {
    if (!this.zip) return undefined;

    try {
      // 查找关系文件
      const relsFile = this.zip.file('word/_rels/document.xml.rels');
      if (!relsFile) return undefined;

      const relsContent = await relsFile.async('text') as string;
      const parser = new DOMParser();
      const relsDoc = parser.parseFromString(relsContent, 'text/xml');
      
      // 查找对应的关系
      const relationships = relsDoc.getElementsByTagName('Relationship');
      let relationship: Element | null = null;
      for (let i = 0; i < relationships.length; i++) {
        if (relationships[i].getAttribute('Id') === relId) {
          relationship = relationships[i];
          break;
        }
      }
      if (!relationship) return undefined;

      const target = relationship.getAttribute('Target');
      if (!target) return undefined;

      // 构建图片路径
      const imagePath = 'word/' + target.replace(/^\.\//, '');
      const imageFile = this.zip.file(imagePath);
      if (!imageFile) return undefined;

      // 转换为base64
      const imageBuffer = await imageFile.async('arraybuffer');
      const imageBase64 = Buffer.from(imageBuffer).toString('base64');
      
      // 检测图片类型
      const extension = target.split('.').pop()?.toLowerCase();
      let mimeType = 'image/png';
      if (extension === 'jpg' || extension === 'jpeg') mimeType = 'image/jpeg';
      else if (extension === 'gif') mimeType = 'image/gif';
      else if (extension === 'bmp') mimeType = 'image/bmp';

      return `data:${mimeType};base64,${imageBase64}`;
    } catch (error) {
      console.error('通过关系ID获取图片失败:', error);
      return undefined;
    }
  }

  private async extractImageFromElement(element: Element): Promise<string | undefined> {
    // 从XML元素中提取图片数据
    const aBlips = element.getElementsByTagName('a:blip');
    const blips = element.getElementsByTagName('blip');
    const allBlips = [...Array.from(aBlips), ...Array.from(blips)];
    
    for (const blip of allBlips) {
      const embed = blip.getAttribute('r:embed') || blip.getAttribute('embed');
      if (embed) {
        return await this.getImageByRelId(embed);
      }
    }
    return undefined;
  }

  // 解析样式定义
  private parseStyles(): Record<string, any> {
    if (!this.stylesXml) return {};

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.stylesXml, 'text/xml');
    const styles: Record<string, any> = {};

    // 使用getElementsByTagName替代querySelectorAll
    const styleElements = doc.getElementsByTagName('w:style');
    for (let i = 0; i < styleElements.length; i++) {
      const style = styleElements[i];
      const styleId = style.getAttribute('w:styleId') || style.getAttribute('styleId');
      if (styleId) {
        styles[styleId] = this.parseStyleElement(style);
      }
    }

    return styles;
  }

  // 解析字体表
  private parseFonts(): Record<string, any> {
    if (!this.fontTableXml) return {};

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.fontTableXml, 'text/xml');
    const fonts: Record<string, any> = {};

    // 获取所有字体元素
    let fontElements = doc.getElementsByTagName('w:font');
    if (fontElements.length === 0) {
      fontElements = doc.getElementsByTagName('font');
    }
    
    for (let i = 0; i < fontElements.length; i++) {
      const font = fontElements[i];
      const name = font.getAttribute('w:name') || font.getAttribute('name');
      if (name) {
        // 查找family元素
        let familyElements = font.getElementsByTagName('w:family');
        if (familyElements.length === 0) {
          familyElements = font.getElementsByTagName('family');
        }
        const family = familyElements.length > 0 ? familyElements[0].getAttribute('w:val') : undefined;
        
        // 查找charset元素
        let charsetElements = font.getElementsByTagName('w:charset');
        if (charsetElements.length === 0) {
          charsetElements = font.getElementsByTagName('charset');
        }
        const charset = charsetElements.length > 0 ? charsetElements[0].getAttribute('w:val') : undefined;
        
        // 查找pitch元素
        let pitchElements = font.getElementsByTagName('w:pitch');
        if (pitchElements.length === 0) {
          pitchElements = font.getElementsByTagName('pitch');
        }
        const pitch = pitchElements.length > 0 ? pitchElements[0].getAttribute('w:val') : undefined;
        
        fonts[name] = {
          name,
          family,
          charset,
          pitch
        };
      }
    }

    return fonts;
  }

  private async parseDocumentXml(styles: any, themeColors: WordState['themeColors']): Promise<{
    page: WordState['page'];
    paragraphs: WordState['paragraphs'];
    tables: WordState['tables'];
    floatingImages: WordState['floatingImages'];
    images: Record<string, string>;
    lang: string;
    rtl: boolean;
  }> {
    if (!this.documentXml) {
      return {
        page: { width: 794, height: 1123, margin: [96, 96, 96, 96] },
        paragraphs: [],
        tables: [],
        floatingImages: [],
        images: {},
        lang: 'zh-CN',
        rtl: false
      };
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(this.documentXml, 'text/xml');
      
      // 提取页面几何
      const page = this.extractPageGeometry(doc);
      
      // 提取语言和方向
      const { lang, rtl } = this.extractLanguageAndDirection(doc);
      
      // 提取浮动图片
      const floatingImages = await this.extractFloatingImages(doc);
      
      // 提取段落和表格
      const { paragraphs, tables } = this.extractParagraphsAndTables(doc, styles);
      
      // 提取样式信息（包含缺省属性）
      this.extractStyles(doc);
      
      // 应用样式继承和缺省值
      this.applyStyleInheritance(paragraphs, tables);
      
      return {
        page,
        paragraphs,
        tables,
        floatingImages,
        images: Object.fromEntries(this.images),
        lang,
        rtl
      };
    } catch (error) {
      console.error('解析文档XML失败:', error);
      return {
        page: { width: 794, height: 1123, margin: [96, 96, 96, 96] },
        paragraphs: [],
        tables: [],
        floatingImages: [],
        images: {},
        lang: 'zh-CN',
        rtl: false
      };
    }
  }

  private applyStyleInheritance(paragraphs: WordState['paragraphs'], tables: WordState['tables']): void {
    // 为段落应用样式继承和缺省值
    for (const paragraph of paragraphs) {
      this.applyParagraphStyleInheritance(paragraph);
    }
    
    // 为表格应用样式继承和缺省值
    for (const table of tables) {
      this.applyTableStyleInheritance(table);
    }
  }

  private applyParagraphStyleInheritance(paragraph: WordState['paragraphs'][0]): void {
    // 如果段落有样式ID，应用样式属性
    if (paragraph.styleId && this.state.styles[paragraph.styleId]) {
      const style = this.state.styles[paragraph.styleId];
      if (style.paragraph) {
        paragraph.alignment = paragraph.alignment || style.paragraph.alignment;
        paragraph.indent = paragraph.indent || style.paragraph.indent;
        paragraph.spacing = paragraph.spacing || style.paragraph.spacing;
      }
    }
    
    // 应用缺省属性
    if (this.state.defaults.paragraph) {
      paragraph.alignment = paragraph.alignment || this.state.defaults.paragraph.alignment;
      paragraph.indent = paragraph.indent || this.state.defaults.paragraph.indent;
      paragraph.spacing = paragraph.spacing || this.state.defaults.paragraph.spacing;
    }
    
    // 为文本运行应用样式继承
    for (const run of paragraph.runs) {
      this.applyRunStyleInheritance(run, paragraph.styleId);
    }
  }

  private applyRunStyleInheritance(run: WordState['paragraphs'][0]['runs'][0], paragraphStyleId?: string): void {
    // 如果运行有样式ID，应用样式属性
    if ((run as any).styleId && this.state.styles[(run as any).styleId]) {
      const style = this.state.styles[(run as any).styleId];
      if (style.character) {
        run.bold = run.bold !== undefined ? run.bold : style.character.bold;
        run.italic = run.italic !== undefined ? run.italic : style.character.italic;
        run.underline = run.underline !== undefined ? run.underline : style.character.underline;
        run.strike = run.strike !== undefined ? run.strike : style.character.strike;
        run.font = run.font || style.character.font;
        run.color = run.color || style.character.color;
        run.sz = run.sz || style.character.sz;
      }
    }
    
    // 应用段落样式中的字符属性
    if (paragraphStyleId && this.state.styles[paragraphStyleId]) {
      const style = this.state.styles[paragraphStyleId];
      if (style.character) {
        run.bold = run.bold !== undefined ? run.bold : style.character.bold;
        run.italic = run.italic !== undefined ? run.italic : style.character.italic;
        run.underline = run.underline !== undefined ? run.underline : style.character.underline;
        run.strike = run.strike !== undefined ? run.strike : style.character.strike;
        run.font = run.font || style.character.font;
        run.color = run.color || style.character.color;
        run.sz = run.sz || style.character.sz;
      }
    }
    
    // 应用缺省属性
    if (this.state.defaults.character) {
      run.bold = run.bold !== undefined ? run.bold : this.state.defaults.character.bold;
      run.italic = run.italic !== undefined ? run.italic : this.state.defaults.character.italic;
      run.underline = run.underline !== undefined ? run.underline : this.state.defaults.character.underline;
      run.strike = run.strike !== undefined ? run.strike : this.state.defaults.character.strike;
      run.font = run.font || this.state.defaults.character.font;
      run.color = run.color || this.state.defaults.character.color;
      run.sz = run.sz || this.state.defaults.character.sz;
    }
  }

  private applyTableStyleInheritance(table: WordState['tables'][0]): void {
    // 如果表格有样式ID，应用样式属性
    if (table.styleId && this.state.styles[table.styleId]) {
      const style = this.state.styles[table.styleId];
      // 这里可以添加表格特定的样式属性应用
    }
    
    // 为表格中的段落应用样式继承
    for (const row of table.rows) {
      for (const cell of row.cells) {
        // 遍历单元格内容中的段落
        for (const contentItem of cell.content) {
          if (contentItem && typeof contentItem === 'object' && contentItem.runs) {
            // 这是一个段落对象
            this.applyParagraphStyleInheritance(contentItem);
          }
        }
      }
    }
  }

  private extractPageGeometry(doc: Document): WordState['page'] {
    // 查找页面设置
    const sectPrElements = doc.getElementsByTagName('w:sectPr');
    const sectPr = sectPrElements.length > 0 ? sectPrElements[0] : doc.getElementsByTagName('sectPr')[0];
    
    let pgSz: Element | null = null;
    let pgMar: Element | null = null;
    
    if (sectPr) {
      const pgSzElements = sectPr.getElementsByTagName('w:pgSz');
      pgSz = pgSzElements.length > 0 ? pgSzElements[0] : sectPr.getElementsByTagName('pgSz')[0];
      
      const pgMarElements = sectPr.getElementsByTagName('w:pgMar');
      pgMar = pgMarElements.length > 0 ? pgMarElements[0] : sectPr.getElementsByTagName('pgMar')[0];
    }
    
    // 默认A4尺寸 (twips单位)
    const width = pgSz ? this.twipsToPixels(parseInt(pgSz.getAttribute('w:w') || '11906')) : 794;
    const height = pgSz ? this.twipsToPixels(parseInt(pgSz.getAttribute('w:h') || '16838')) : 1123;
    
    const margin = [
      pgMar ? this.twipsToPixels(parseInt(pgMar.getAttribute('w:top') || '1440')) : 96, // top
      pgMar ? this.twipsToPixels(parseInt(pgMar.getAttribute('w:right') || '1440')) : 96, // right
      pgMar ? this.twipsToPixels(parseInt(pgMar.getAttribute('w:bottom') || '1440')) : 96, // bottom
      pgMar ? this.twipsToPixels(parseInt(pgMar.getAttribute('w:left') || '1440')) : 96 // left
    ] as [number, number, number, number];
    
    const gutter = pgMar ? this.twipsToPixels(parseInt(pgMar.getAttribute('w:gutter') || '0')) : 0;
    
    return { width, height, margin, gutter };
  }

  private extractLanguageAndDirection(doc: Document): { lang: string; rtl: boolean } {
    // 提取语言设置
    const langElements = doc.getElementsByTagName('w:lang');
    const lang = langElements.length > 0 ? langElements[0] : doc.getElementsByTagName('lang')[0];
    let langValue = lang?.getAttribute('w:val') || lang?.getAttribute('val') || 'zh-CN';
    
    // 检查RTL方向
    const bidiElements = doc.getElementsByTagName('w:bidi');
    const bidi = bidiElements.length > 0 ? bidiElements[0] : doc.getElementsByTagName('bidi')[0];
    let rtl = bidi ? bidi.getAttribute('w:val') === 'true' : false;
    
    // 从段落中提取语言信息
    const paragraphs = doc.getElementsByTagName('p');
    for (let i = 0; i < paragraphs.length; i++) {
      const p = paragraphs[i];
      const pPrElements = p.getElementsByTagName('pPr');
      const pPr = pPrElements.length > 0 ? pPrElements[0] : null;
      
      if (pPr) {
        const bidiElements = pPr.getElementsByTagName('bidi');
        if (bidiElements.length > 0) {
          rtl = true;
          break;
        }
      }
      
      // 检查文本运行中的语言
      const runs = p.getElementsByTagName('r');
      for (let j = 0; j < runs.length; j++) {
        const r = runs[j];
        const rPrElements = r.getElementsByTagName('rPr');
        const rPr = rPrElements.length > 0 ? rPrElements[0] : null;
        
        if (rPr) {
          const runLangElements = rPr.getElementsByTagName('lang');
          const runLang = runLangElements.length > 0 ? runLangElements[0] : null;
          if (runLang) {
            langValue = runLang.getAttribute('w:val') || runLang.getAttribute('val') || langValue;
            break;
          }
        }
      }
      
      if (rtl) break;
    }
    
    return { lang: langValue, rtl };
  }

  private async extractFloatingImages(doc: Document): Promise<WordState['floatingImages']> {
    const floatingImages: WordState['floatingImages'] = [];
    
    // 查找所有浮动图片 (wp:anchor)
    let anchors = doc.getElementsByTagName('wp:anchor');
    if (anchors.length === 0) {
      anchors = doc.getElementsByTagName('anchor');
    }
    
    for (let i = 0; i < anchors.length; i++) {
      const anchor = anchors[i];
      
      // 查找drawing元素
      let drawingElements = anchor.getElementsByTagName('a:graphic');
      if (drawingElements.length === 0) {
        drawingElements = anchor.getElementsByTagName('graphic');
      }
      const drawing = drawingElements.length > 0 ? drawingElements[0] : null;
      if (!drawing) continue;
      
      // 提取位置信息
      let positionHElements = anchor.getElementsByTagName('wp:positionH');
      if (positionHElements.length === 0) {
        positionHElements = anchor.getElementsByTagName('positionH');
      }
      const positionH = positionHElements.length > 0 ? positionHElements[0] : null;
      
      let positionVElements = anchor.getElementsByTagName('wp:positionV');
      if (positionVElements.length === 0) {
        positionVElements = anchor.getElementsByTagName('positionV');
      }
      const positionV = positionVElements.length > 0 ? positionVElements[0] : null;
      
      const left = this.extractPositionValue(positionH) || '0px';
      const top = this.extractPositionValue(positionV) || '0px';
      
      // 提取z-index
      const behindDoc = anchor.getAttribute('behindDoc') === '1';
      const zIndex = behindDoc ? -1 : 1;
      
      // 提取图片
      let blipElements = drawing.getElementsByTagName('a:blip');
      if (blipElements.length === 0) {
        blipElements = drawing.getElementsByTagName('blip');
      }
      const blip = blipElements.length > 0 ? blipElements[0] : null;
      
      if (blip) {
        const embed = blip.getAttribute('r:embed') || blip.getAttribute('embed');
        if (embed) {
          const imageData = await this.getImageByRelId(embed);
          if (imageData) {
            floatingImages.push({
              src: imageData,
              left,
              top,
              zIndex,
              behindDoc
            });
          }
        }
      }
    }
    
    return floatingImages;
  }

  private extractPositionValue(positionElement: Element | null): string {
    if (!positionElement) return '0px';
    
    // 尝试不同的位置类型
    let alignElements = positionElement.getElementsByTagName('wp:align');
    if (alignElements.length === 0) {
      alignElements = positionElement.getElementsByTagName('align');
    }
    const align = alignElements.length > 0 ? alignElements[0] : null;
    
    if (align) {
      const alignValue = align.textContent;
      switch (alignValue) {
        case 'left': return '0px';
        case 'center': return '50%';
        case 'right': return '100%';
        default: return '0px';
      }
    }
    
    let posOffsetElements = positionElement.getElementsByTagName('wp:posOffset');
    if (posOffsetElements.length === 0) {
      posOffsetElements = positionElement.getElementsByTagName('posOffset');
    }
    const posOffset = posOffsetElements.length > 0 ? posOffsetElements[0] : null;
    
    if (posOffset) {
      const offsetValue = parseInt(posOffset.textContent || '0', 10);
      return `${this.twipsToPixels(offsetValue)}px`;
    }
    
    return '0px';
  }

  private extractParagraphsAndTables(doc: Document, styles: any): { paragraphs: WordState['paragraphs']; tables: WordState['tables'] } {
    const paragraphs: WordState['paragraphs'] = [];
    const tables: WordState['tables'] = [];

    // 搜索所有段落元素
    const paragraphElements = doc.getElementsByTagName('w:p');
    for (let i = 0; i < paragraphElements.length; i++) {
      const element = paragraphElements[i];
      const paragraph = this.parseParagraph(element, styles);
      // 暂时移除null检查以便调试，但保持类型安全
      if (paragraph !== null) paragraphs.push(paragraph);
    }

    // 如果没有找到带命名空间的段落，尝试不带命名空间的
    if (paragraphElements.length === 0) {
      const paragraphElementsNoNs = doc.getElementsByTagName('p');
      for (let i = 0; i < paragraphElementsNoNs.length; i++) {
        const element = paragraphElementsNoNs[i];
        const paragraph = this.parseParagraph(element, styles);
        // 暂时移除null检查以便调试，但保持类型安全
        if (paragraph !== null) paragraphs.push(paragraph);
      }
    }

    // 搜索所有表格元素
    const tableElements = doc.getElementsByTagName('w:tbl');
    for (let i = 0; i < tableElements.length; i++) {
      const element = tableElements[i];
      const table = this.parseTable(element, styles);
      if (table) tables.push(table);
    }

    // 如果没有找到带命名空间的表格，尝试不带命名空间的
    if (tableElements.length === 0) {
      const tableElementsNoNs = doc.getElementsByTagName('tbl');
      for (let i = 0; i < tableElementsNoNs.length; i++) {
        const element = tableElementsNoNs[i];
        const table = this.parseTable(element, styles);
        if (table) tables.push(table);
      }
    }

    return { paragraphs, tables };
  }

  // 解析页眉
  private parseHeaders(): DocumentElement[] {
    const headers: DocumentElement[] = [];
    let order = 0;

    for (const [filename, xml] of Array.from(this.headerXmls.entries())) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      const paragraphs = doc.getElementsByTagName('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        headers.push({
          type: 'header',
          id: `header_${order++}`,
          content: this.extractTextContent(p),
          styles: this.extractElementStyles(p),
          position: { order },
          metadata: { filename }
        });
      }
    }

    return headers;
  }

  // 解析页脚
  private parseFooters(): DocumentElement[] {
    const footers: DocumentElement[] = [];
    let order = 0;

    for (const [filename, xml] of Array.from(this.footerXmls.entries())) {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      const paragraphs = doc.getElementsByTagName('p');
      for (let i = 0; i < paragraphs.length; i++) {
        const p = paragraphs[i];
        footers.push({
          type: 'footer',
          id: `footer_${order++}`,
          content: this.extractTextContent(p),
          styles: this.extractElementStyles(p),
          position: { order },
          metadata: { filename }
        });
      }
    }

    return footers;
  }

  // 解析背景信息
  private parseBackgrounds(): DocumentElement[] {
    const backgrounds: DocumentElement[] = [];
    
    // 从文档设置中查找背景信息
    const parser = new DOMParser();
    const doc = parser.parseFromString(this.documentXml, 'text/xml');
    
    const backgroundElements = doc.getElementsByTagName('background');
    for (let i = 0; i < backgroundElements.length; i++) {
      const bg = backgroundElements[i];
      backgrounds.push({
        type: 'background',
        id: `background_${i}`,
        content: '',
        styles: this.extractBackgroundStyles(bg),
        position: { order: i }
      });
    }

    return backgrounds;
  }

  private parseParagraph(element: Element, styles: any): WordState['paragraphs'][0] | null {
    // 查找段落属性 - 使用getElementsByTagName代替querySelector，支持带命名空间和不带命名空间
    let pPrElements = element.getElementsByTagName('w:pPr');
    if (pPrElements.length === 0) {
      pPrElements = element.getElementsByTagName('pPr');
    }
    const pPr = pPrElements.length > 0 ? pPrElements[0] : null;
    
    let pStyleElements = pPr ? pPr.getElementsByTagName('w:pStyle') : [];
    if (pStyleElements.length === 0 && pPr) {
      pStyleElements = pPr.getElementsByTagName('pStyle');
    }
    const pStyle = pStyleElements.length > 0 ? pStyleElements[0] : null;
    
    let numPrElements = pPr ? pPr.getElementsByTagName('w:numPr') : [];
    if (numPrElements.length === 0 && pPr) {
      numPrElements = pPr.getElementsByTagName('numPr');
    }
    const numPr = numPrElements.length > 0 ? numPrElements[0] : null;
    
    const styleId = pStyle?.getAttribute('w:val') || pStyle?.getAttribute('val') || undefined;
    
    // 提取段落属性
    const alignment = this.getAlignment(pPr);
    const indent = this.getIndent(pPr);
    const spacing = this.getSpacing(pPr);
    
    // 提取列表信息
    const listInfo = numPr ? this.extractListInfo(numPr) : null;
    
    // 提取文本内容
    const runs = this.getTextRuns(element);
    
    // 暂时注释掉空段落检查，以便调试
    // if (runs.length === 0) return null;
    
    return {
      styleId,
      indent,
      spacing,
      alignment,
      runs
    };
  }

  private getAlignment(pPr: Element | null): WordState['paragraphs'][0]['alignment'] {
    if (!pPr) return 'left';
    // 先尝试带命名空间的标签
    let jcElements = pPr.getElementsByTagName('w:jc');
    if (jcElements.length === 0) {
      // 如果没找到，尝试不带命名空间的标签
      jcElements = pPr.getElementsByTagName('jc');
    }
    const jc = jcElements.length > 0 ? jcElements[0] : null;
    const val = jc?.getAttribute('w:val') || jc?.getAttribute('val') || 'left';
    
    switch (val) {
      case 'center': return 'center';
      case 'right': return 'right';
      case 'both': return 'justify';
      default: return 'left';
    }
  }

  private getIndent(pPr: Element | null): WordState['paragraphs'][0]['indent'] {
    if (!pPr) return {};
    // 先尝试带命名空间的标签
    let indElements = pPr.getElementsByTagName('w:ind');
    if (indElements.length === 0) {
      // 如果没找到，尝试不带命名空间的标签
      indElements = pPr.getElementsByTagName('ind');
    }
    const ind = indElements.length > 0 ? indElements[0] : null;
    if (!ind) return {};
    
    return {
      left: this.twipsToPixels(parseInt(ind.getAttribute('w:left') || '0', 10)),
      right: this.twipsToPixels(parseInt(ind.getAttribute('w:right') || '0', 10)),
      firstLine: this.twipsToPixels(parseInt(ind.getAttribute('w:firstLine') || '0', 10)),
      hanging: this.twipsToPixels(parseInt(ind.getAttribute('w:hanging') || '0', 10))
    };
  }

  private getSpacing(pPr: Element | null): WordState['paragraphs'][0]['spacing'] {
    if (!pPr) return {};
    // 先尝试带命名空间的标签
    let spacingElements = pPr.getElementsByTagName('w:spacing');
    if (spacingElements.length === 0) {
      // 如果没找到，尝试不带命名空间的标签
      spacingElements = pPr.getElementsByTagName('spacing');
    }
    const spacing = spacingElements.length > 0 ? spacingElements[0] : null;
    if (!spacing) return {};
    
    return {
      before: this.twipsToPixels(parseInt(spacing.getAttribute('w:before') || '0', 10)),
      after: this.twipsToPixels(parseInt(spacing.getAttribute('w:after') || '0', 10)),
      line: this.twipsToPixels(parseInt(spacing.getAttribute('w:line') || '0', 10)),
      lineRule: spacing.getAttribute('w:lineRule') || spacing.getAttribute('lineRule') || 'auto'
    };
  }

  private getTextRuns(element: Element): WordState['paragraphs'][0]['runs'] {
    const runs: WordState['paragraphs'][0]['runs'] = [];
    
    // 查找w:r和r元素（带和不带命名空间）
    const wRElements = element.getElementsByTagName('w:r');
    const rElements = element.getElementsByTagName('r');
    const allRElements = [...Array.from(wRElements), ...Array.from(rElements)];
    
    for (const r of allRElements) {
      // 查找w:t和t元素（带和不带命名空间）
      const wTElements = r.getElementsByTagName('w:t');
      const tElements = r.getElementsByTagName('t');
      const allTElements = [...Array.from(wTElements), ...Array.from(tElements)];
      
      const rPrElements = r.getElementsByTagName('w:rPr');
      const rPrElements2 = r.getElementsByTagName('rPr');
      const rPr = rPrElements.length > 0 ? rPrElements[0] : (rPrElements2.length > 0 ? rPrElements2[0] : null);
      
      for (const t of allTElements) {
        const text = t.textContent || '';
        // 修改条件：即使是空白字符也要保留，因为它们可能是有意义的空格
        if (text !== null && text !== undefined) {
          runs.push({
            text,
            bold: this.isBold(rPr),
            italic: this.isItalic(rPr),
            underline: this.isUnderline(rPr),
            strike: this.isStrike(rPr),
            font: this.getFontFamily(rPr),
            color: this.getColor(rPr),
            sz: this.getFontSize(rPr)
          });
        }
      }
    }
    
    return runs;
  }

  private isStrike(rPr: Element | null): boolean {
    if (!rPr) return false;
    // 先尝试带命名空间的标签
    let strikeElements = rPr.getElementsByTagName('w:strike');
    if (strikeElements.length === 0) {
      // 如果没找到，尝试不带命名空间的标签
      strikeElements = rPr.getElementsByTagName('strike');
    }
    const strike = strikeElements.length > 0 ? strikeElements[0] : null;
    if (!strike) return false;
    const val = strike.getAttribute('w:val') || strike.getAttribute('val');
    return val !== 'false';
  }

  private parseTable(element: Element, styles: any): WordState['tables'][0] | null {
    const rows: WordState['tables'][0]['rows'] = [];
    const trElements = element.getElementsByTagName('tr');
    
    // 提取表格边框属性
    const tblPrElements = element.getElementsByTagName('tblPr');
    const tblPr = tblPrElements.length > 0 ? tblPrElements[0] : null;
    const tblBordersElements = tblPr ? tblPr.getElementsByTagName('tblBorders') : null;
    const tblBorders = tblBordersElements && tblBordersElements.length > 0 ? tblBordersElements[0] : null;
    const borders = this.extractTableBorders(tblBorders);
    
    for (let i = 0; i < trElements.length; i++) {
      const tr = trElements[i];
      const cells: WordState['tables'][0]['rows'][0]['cells'] = [];
      const tcElements = tr.getElementsByTagName('tc');
      
      for (let j = 0; j < tcElements.length; j++) {
        const tc = tcElements[j];
        const tcPrElements = tc.getElementsByTagName('tcPr');
        const tcPr = tcPrElements.length > 0 ? tcPrElements[0] : null;
        const gridSpanElements = tcPr ? tcPr.getElementsByTagName('gridSpan') : null;
        const gridSpan = gridSpanElements && gridSpanElements.length > 0 ? gridSpanElements[0] : null;
        const vMergeElements = tcPr ? tcPr.getElementsByTagName('vMerge') : null;
        const vMerge = vMergeElements && vMergeElements.length > 0 ? vMergeElements[0] : null;
        
        // 提取单元格边框
        const tcBordersElements = tcPr ? tcPr.getElementsByTagName('tcBorders') : null;
        const tcBorders = tcBordersElements && tcBordersElements.length > 0 ? tcBordersElements[0] : null;
        const cellBorders = this.extractTableBorders(tcBorders);
        
        // 提取单元格内容
        const content: any[] = [];
        const pElements = tc.getElementsByTagName('p');
        
        for (let k = 0; k < pElements.length; k++) {
          const p = pElements[k];
          const paragraph = this.parseParagraph(p, styles);
          if (paragraph) content.push(paragraph);
        }
        
        cells.push({
          content,
          colSpan: gridSpan ? parseInt(gridSpan.getAttribute('w:val') || '1', 10) : 1,
          rowSpan: vMerge ? (vMerge.getAttribute('w:val') === 'restart' ? 1 : 0) : 1,
          borders: cellBorders
        });
      }
      
      if (cells.length > 0) {
        rows.push({ cells });
      }
    }
    
    return rows.length > 0 ? { rows, borders } : null;
  }

  private extractTableBorders(bordersElement: Element | null): WordState['tables'][0]['borders'] {
    const borders: WordState['tables'][0]['borders'] = {
      top: { style: 'none', size: 0, color: '#000000' },
      left: { style: 'none', size: 0, color: '#000000' },
      bottom: { style: 'none', size: 0, color: '#000000' },
      right: { style: 'none', size: 0, color: '#000000' },
      insideH: { style: 'none', size: 0, color: '#000000' },
      insideV: { style: 'none', size: 0, color: '#000000' }
    };
    
    if (!bordersElement) return borders;
    
    const borderTypes = ['top', 'bottom', 'left', 'right', 'insideH', 'insideV'];
    
    for (const type of borderTypes) {
      const borderElements = bordersElement.getElementsByTagName(type);
      const border = borderElements.length > 0 ? borderElements[0] : null;
      if (border) {
        borders[type as keyof WordState['tables'][0]['borders']] = {
          size: parseInt(border.getAttribute('w:sz') || '4', 10) / 8, // 转换为像素
          color: border.getAttribute('w:color') || '000000',
          style: border.getAttribute('w:val') || 'single'
        };
      }
    }
    
    return borders;
  }

  private extractListInfo(numPr: Element): any {
    const numIdElements = numPr.getElementsByTagName('numId');
    const ilvlElements = numPr.getElementsByTagName('ilvl');
    
    const numId = numIdElements.length > 0 ? numIdElements[0].getAttribute('w:val') || '0' : '0';
    const ilvl = ilvlElements.length > 0 ? ilvlElements[0].getAttribute('w:val') || '0' : '0';
    
    return {
      numId: parseInt(numId, 10),
      level: parseInt(ilvl, 10)
    };
  }

  private extractStyles(doc: Document): void {
    const styles = doc.getElementsByTagName('style');
    
    for (let i = 0; i < styles.length; i++) {
      const style = styles[i];
      const styleId = style.getAttribute('w:styleId') || style.getAttribute('styleId');
      if (!styleId) continue;
      
      const styleType = style.getAttribute('w:type') || style.getAttribute('type');
      const nameElements = style.getElementsByTagName('name');
      const name = nameElements.length > 0 ? nameElements[0].getAttribute('w:val') : styleId;
      
      const basedOnElements = style.getElementsByTagName('basedOn');
      const basedOn = basedOnElements.length > 0 ? basedOnElements[0].getAttribute('w:val') : undefined;
      
      const nextElements = style.getElementsByTagName('next');
      const nextStyle = nextElements.length > 0 ? nextElements[0].getAttribute('w:val') : undefined;
      
      this.state.styles[styleId] = {
        name: name || styleId,
        type: styleType || 'paragraph',
        basedOn,
        nextStyle,
        paragraph: this.extractStyleParagraphProperties(style),
        character: this.extractStyleCharacterProperties(style)
      };
    }
    
    // 提取缺省属性
    this.extractDefaultProperties(doc);
  }

  private extractDefaultProperties(doc: Document): any {
    const docDefaultsElements = doc.getElementsByTagName('docDefaults');
    if (docDefaultsElements.length === 0) return;
    const docDefaults = docDefaultsElements[0];
    
    // 段落缺省属性
    const pPrDefaultElements = docDefaults.getElementsByTagName('pPrDefault');
    if (pPrDefaultElements.length > 0) {
      const pPrDefault = pPrDefaultElements[0];
      const pPrElements = pPrDefault.getElementsByTagName('pPr');
      if (pPrElements.length > 0) {
        const pPr = pPrElements[0];
        this.state.defaults.paragraph = {
          alignment: this.getAlignment(pPr),
          indent: this.getIndent(pPr),
          spacing: this.getSpacing(pPr)
        };
      }
    }
    
    // 字符缺省属性
    const rPrDefaultElements = docDefaults.getElementsByTagName('rPrDefault');
    if (rPrDefaultElements.length > 0) {
      const rPrDefault = rPrDefaultElements[0];
      const rPrElements = rPrDefault.getElementsByTagName('rPr');
      if (rPrElements.length > 0) {
        const rPr = rPrElements[0];
        this.state.defaults.character = {
          bold: this.isBold(rPr),
          italic: this.isItalic(rPr),
          underline: this.isUnderline(rPr),
          strike: this.isStrike(rPr),
          font: this.getFontFamily(rPr),
          color: this.getColor(rPr),
          sz: this.getFontSize(rPr)
        };
      }
    }
  }

  private extractStyleParagraphProperties(style: Element): any {
    const pPrElements = style.getElementsByTagName('pPr');
    const pPr = pPrElements.length > 0 ? pPrElements[0] : null;
    if (!pPr) return {};
    
    return {
      alignment: this.getAlignment(pPr),
      indent: this.getIndent(pPr),
      spacing: this.getSpacing(pPr)
    };
  }

  private extractStyleCharacterProperties(style: Element): any {
    const rPrElements = style.getElementsByTagName('rPr');
    const rPr = rPrElements.length > 0 ? rPrElements[0] : null;
    if (!rPr) return {};
    
    return {
      bold: this.isBold(rPr),
      italic: this.isItalic(rPr),
      underline: this.isUnderline(rPr),
      strike: this.isStrike(rPr),
      font: this.getFontFamily(rPr),
      color: this.getColor(rPr),
      sz: this.getFontSize(rPr)
    };
  }

  // 辅助方法：提取文本内容
  private extractTextContent(element: Element): string {
    const textNodes: Element[] = [];
    const wTextElements = element.getElementsByTagName('w:t');
    const tElements = element.getElementsByTagName('t');
    
    for (let i = 0; i < wTextElements.length; i++) {
      textNodes.push(wTextElements[i]);
    }
    for (let i = 0; i < tElements.length; i++) {
      textNodes.push(tElements[i]);
    }
    
    return textNodes.map(node => node.textContent || '').join('');
  }

  // 辅助方法：提取表格内容
  private extractTableContent(element: Element): string {
    // 简化的表格内容提取
    const rows: Element[] = [];
    const wTrElements = element.getElementsByTagName('w:tr');
    const trElements = element.getElementsByTagName('tr');
    
    for (let i = 0; i < wTrElements.length; i++) {
      rows.push(wTrElements[i]);
    }
    for (let i = 0; i < trElements.length; i++) {
      rows.push(trElements[i]);
    }
    
    return rows.map(row => {
      const cells: Element[] = [];
      const wTcElements = row.getElementsByTagName('w:tc');
      const tcElements = row.getElementsByTagName('tc');
      
      for (let i = 0; i < wTcElements.length; i++) {
        cells.push(wTcElements[i]);
      }
      for (let i = 0; i < tcElements.length; i++) {
        cells.push(tcElements[i]);
      }
      
      return cells.map(cell => this.extractTextContent(cell)).join('\t');
    }).join('\n');
  }

  // 辅助方法：提取元素样式
  private extractElementStyles(element: Element): Record<string, any> {
    const styles: Record<string, any> = {};
    
    // 提取段落属性
    let pPr: Element | null = null;
    const pPrElements = element.getElementsByTagName('w:pPr');
    if (pPrElements.length > 0) {
      pPr = pPrElements[0];
    } else {
      const pPrElements2 = element.getElementsByTagName('pPr');
      if (pPrElements2.length > 0) {
        pPr = pPrElements2[0];
      }
    }
    
    if (pPr) {
      // 对齐方式
      const jcElements = pPr.getElementsByTagName('w:jc');
      if (jcElements.length > 0) {
        styles.textAlign = jcElements[0].getAttribute('w:val') || jcElements[0].getAttribute('val');
      } else {
        const jcElements2 = pPr.getElementsByTagName('jc');
        if (jcElements2.length > 0) {
          styles.textAlign = jcElements2[0].getAttribute('w:val') || jcElements2[0].getAttribute('val');
        }
      }
      
      // 间距
      const spacingElements = pPr.getElementsByTagName('w:spacing');
      if (spacingElements.length > 0) {
        const spacing = spacingElements[0];
        styles.lineHeight = spacing.getAttribute('w:line') || spacing.getAttribute('line');
        styles.marginTop = spacing.getAttribute('w:before') || spacing.getAttribute('before');
        styles.marginBottom = spacing.getAttribute('w:after') || spacing.getAttribute('after');
      } else {
        const spacingElements2 = pPr.getElementsByTagName('spacing');
        if (spacingElements2.length > 0) {
          const spacing = spacingElements2[0];
          styles.lineHeight = spacing.getAttribute('w:line') || spacing.getAttribute('line');
          styles.marginTop = spacing.getAttribute('w:before') || spacing.getAttribute('before');
          styles.marginBottom = spacing.getAttribute('w:after') || spacing.getAttribute('after');
        }
      }
    }

    // 提取字符属性
    let rPr: Element | null = null;
    const rPrElements = element.getElementsByTagName('w:rPr');
    if (rPrElements.length > 0) {
      rPr = rPrElements[0];
    } else {
      const rPrElements2 = element.getElementsByTagName('rPr');
      if (rPrElements2.length > 0) {
        rPr = rPrElements2[0];
      }
    }
    
    if (rPr) {
      // 字体
      const fontsElements = rPr.getElementsByTagName('w:rFonts');
      if (fontsElements.length > 0) {
        styles.fontFamily = fontsElements[0].getAttribute('w:ascii') || fontsElements[0].getAttribute('ascii');
      } else {
        const fontsElements2 = rPr.getElementsByTagName('rFonts');
        if (fontsElements2.length > 0) {
          styles.fontFamily = fontsElements2[0].getAttribute('w:ascii') || fontsElements2[0].getAttribute('ascii');
        }
      }
      
      // 字号
      const szElements = rPr.getElementsByTagName('w:sz');
      if (szElements.length > 0) {
        styles.fontSize = szElements[0].getAttribute('w:val') || szElements[0].getAttribute('val');
      } else {
        const szElements2 = rPr.getElementsByTagName('sz');
        if (szElements2.length > 0) {
          styles.fontSize = szElements2[0].getAttribute('w:val') || szElements2[0].getAttribute('val');
        }
      }
      
      // 粗体
      const bElements = rPr.getElementsByTagName('w:b');
      if (bElements.length > 0) {
        styles.fontWeight = 'bold';
      } else {
        const bElements2 = rPr.getElementsByTagName('b');
        if (bElements2.length > 0) {
          styles.fontWeight = 'bold';
        }
      }
      
      // 斜体
      const iElements = rPr.getElementsByTagName('w:i');
      if (iElements.length > 0) {
        styles.fontStyle = 'italic';
      } else {
        const iElements2 = rPr.getElementsByTagName('i');
        if (iElements2.length > 0) {
          styles.fontStyle = 'italic';
        }
      }
    }

    return styles;
  }

  // 辅助方法：提取背景样式
  private extractBackgroundStyles(element: Element): Record<string, any> {
    const styles: Record<string, any> = {};
    
    const color = element.getAttribute('w:color') || element.getAttribute('color');
    if (color) {
      styles.backgroundColor = `#${color}`;
    }

    return styles;
  }

  // 辅助方法：解析样式元素
  private parseStyleElement(element: Element): any {
    // 获取样式名称
    let styleName = '';
    const nameElements = element.getElementsByTagName('w:name');
    if (nameElements.length > 0) {
      styleName = nameElements[0].getAttribute('w:val') || '';
    } else {
      const nameElements2 = element.getElementsByTagName('name');
      if (nameElements2.length > 0) {
        styleName = nameElements2[0].getAttribute('w:val') || '';
      }
    }

    const style: any = {
      type: element.getAttribute('w:type') || element.getAttribute('type'),
      name: styleName
    };

    // 解析段落属性
    const pPrElements = element.getElementsByTagName('w:pPr');
    if (pPrElements.length > 0) {
      style.paragraph = this.extractElementStyles(pPrElements[0]);
    } else {
      const pPrElements2 = element.getElementsByTagName('pPr');
      if (pPrElements2.length > 0) {
        style.paragraph = this.extractElementStyles(pPrElements2[0]);
      }
    }

    // 解析字符属性
    const rPrElements = element.getElementsByTagName('w:rPr');
    if (rPrElements.length > 0) {
      style.character = this.extractElementStyles(rPrElements[0]);
    } else {
      const rPrElements2 = element.getElementsByTagName('rPr');
      if (rPrElements2.length > 0) {
        style.character = this.extractElementStyles(rPrElements2[0]);
      }
    }

    return style;
  }

  // 单位转换：twips到像素
  private twipsToPixels(twips: number): number {
    // 1 twip = 1/20 point, 1 point = 4/3 pixels (at 96 DPI)
    return Math.round(twips / 20 * 4 / 3);
  }

  // 数组缓冲区转Base64
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    for (let i = 0; i < bytes.byteLength; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }

  // 解析编号定义
  private parseNumbering(): Record<string, any> {
    if (!this.numberingXml) return {};

    const parser = new DOMParser();
    const doc = parser.parseFromString(this.numberingXml, 'text/xml');
    const numbering: Record<string, any> = {};

    // 解析抽象编号定义
    const abstractNums = doc.getElementsByTagName('w:abstractNum');
    for (let i = 0; i < abstractNums.length; i++) {
      const abstractNum = abstractNums[i];
      const abstractNumId = abstractNum.getAttribute('w:abstractNumId') || abstractNum.getAttribute('abstractNumId');
      if (abstractNumId) {
        numbering[abstractNumId] = {
          type: 'abstract',
          levels: this.extractNumberingLevels(abstractNum)
        };
      }
    }

    // 如果没有找到带命名空间的元素，尝试不带命名空间的
    if (abstractNums.length === 0) {
      const abstractNumsNoNs = doc.getElementsByTagName('abstractNum');
      for (let i = 0; i < abstractNumsNoNs.length; i++) {
        const abstractNum = abstractNumsNoNs[i];
        const abstractNumId = abstractNum.getAttribute('w:abstractNumId') || abstractNum.getAttribute('abstractNumId');
        if (abstractNumId) {
          numbering[abstractNumId] = {
            type: 'abstract',
            levels: this.extractNumberingLevels(abstractNum)
          };
        }
      }
    }

    // 解析编号实例
    const nums = doc.getElementsByTagName('w:num');
    for (let i = 0; i < nums.length; i++) {
      const num = nums[i];
      const numId = num.getAttribute('w:numId') || num.getAttribute('numId');
      const abstractNumIdElements = num.getElementsByTagName('w:abstractNumId');
      let abstractNumId = '';
      if (abstractNumIdElements.length > 0) {
        abstractNumId = abstractNumIdElements[0].getAttribute('w:val') || abstractNumIdElements[0].getAttribute('val') || '';
      } else {
        const abstractNumIdElementsNoNs = num.getElementsByTagName('abstractNumId');
        if (abstractNumIdElementsNoNs.length > 0) {
          abstractNumId = abstractNumIdElementsNoNs[0].getAttribute('w:val') || abstractNumIdElementsNoNs[0].getAttribute('val') || '';
        }
      }
      
      if (numId && abstractNumId) {
        numbering[numId] = {
          type: 'instance',
          abstractNumId,
          levels: numbering[abstractNumId]?.levels || {}
        };
      }
    }

    // 如果没有找到带命名空间的元素，尝试不带命名空间的
    if (nums.length === 0) {
      const numsNoNs = doc.getElementsByTagName('num');
      for (let i = 0; i < numsNoNs.length; i++) {
        const num = numsNoNs[i];
        const numId = num.getAttribute('w:numId') || num.getAttribute('numId');
        const abstractNumIdElements = num.getElementsByTagName('w:abstractNumId');
        let abstractNumId = '';
        if (abstractNumIdElements.length > 0) {
          abstractNumId = abstractNumIdElements[0].getAttribute('w:val') || abstractNumIdElements[0].getAttribute('val') || '';
        } else {
          const abstractNumIdElementsNoNs = num.getElementsByTagName('abstractNumId');
          if (abstractNumIdElementsNoNs.length > 0) {
            abstractNumId = abstractNumIdElementsNoNs[0].getAttribute('w:val') || abstractNumIdElementsNoNs[0].getAttribute('val') || '';
          }
        }
        
        if (numId && abstractNumId) {
          numbering[numId] = {
            type: 'instance',
            abstractNumId,
            levels: numbering[abstractNumId]?.levels || {}
          };
        }
      }
    }

    return numbering;
  }

  // 提取编号层级定义
  private extractNumberingLevels(abstractNum: Element): Record<string, any> {
    const levels: Record<string, any> = {};
    const lvlElements = abstractNum.getElementsByTagName('w:lvl');
    
    for (let i = 0; i < lvlElements.length; i++) {
      const lvl = lvlElements[i];
      const ilvl = lvl.getAttribute('w:ilvl') || lvl.getAttribute('ilvl') || '0';
      
      // 获取格式
      let format = 'decimal';
      const numFmtElements = lvl.getElementsByTagName('w:numFmt');
      if (numFmtElements.length > 0) {
        format = numFmtElements[0].getAttribute('w:val') || 'decimal';
      } else {
        const numFmtElementsNoNs = lvl.getElementsByTagName('numFmt');
        if (numFmtElementsNoNs.length > 0) {
          format = numFmtElementsNoNs[0].getAttribute('w:val') || 'decimal';
        }
      }
      
      // 获取文本
      let text = '%1.';
      const lvlTextElements = lvl.getElementsByTagName('w:lvlText');
      if (lvlTextElements.length > 0) {
        text = lvlTextElements[0].getAttribute('w:val') || '%1.';
      } else {
        const lvlTextElementsNoNs = lvl.getElementsByTagName('lvlText');
        if (lvlTextElementsNoNs.length > 0) {
          text = lvlTextElementsNoNs[0].getAttribute('w:val') || '%1.';
        }
      }
      
      // 获取起始值
      let start = '1';
      const startElements = lvl.getElementsByTagName('w:start');
      if (startElements.length > 0) {
        start = startElements[0].getAttribute('w:val') || '1';
      } else {
        const startElementsNoNs = lvl.getElementsByTagName('start');
        if (startElementsNoNs.length > 0) {
          start = startElementsNoNs[0].getAttribute('w:val') || '1';
        }
      }
      
      // 检查是否为法律编号
      const isLglElements = lvl.getElementsByTagName('w:isLgl');
      const isLglElementsNoNs = lvl.getElementsByTagName('isLgl');
      const isLgl = isLglElements.length > 0 || isLglElementsNoNs.length > 0;
      
      levels[ilvl] = {
        format,
        text,
        start: parseInt(start),
        isLgl,
        legacy: this.extractLegacyNumbering(lvl)
      };
    }
    
    // 如果没有找到带命名空间的元素，尝试不带命名空间的
    if (lvlElements.length === 0) {
      const lvlElementsNoNs = abstractNum.getElementsByTagName('lvl');
      for (let i = 0; i < lvlElementsNoNs.length; i++) {
        const lvl = lvlElementsNoNs[i];
        const ilvl = lvl.getAttribute('w:ilvl') || lvl.getAttribute('ilvl') || '0';
        
        // 获取格式
        let format = 'decimal';
        const numFmtElements = lvl.getElementsByTagName('w:numFmt');
        if (numFmtElements.length > 0) {
          format = numFmtElements[0].getAttribute('w:val') || 'decimal';
        } else {
          const numFmtElementsNoNs = lvl.getElementsByTagName('numFmt');
          if (numFmtElementsNoNs.length > 0) {
            format = numFmtElementsNoNs[0].getAttribute('w:val') || 'decimal';
          }
        }
        
        // 获取文本
        let text = '%1.';
        const lvlTextElements = lvl.getElementsByTagName('w:lvlText');
        if (lvlTextElements.length > 0) {
          text = lvlTextElements[0].getAttribute('w:val') || '%1.';
        } else {
          const lvlTextElementsNoNs = lvl.getElementsByTagName('lvlText');
          if (lvlTextElementsNoNs.length > 0) {
            text = lvlTextElementsNoNs[0].getAttribute('w:val') || '%1.';
          }
        }
        
        // 获取起始值
        let start = '1';
        const startElements = lvl.getElementsByTagName('w:start');
        if (startElements.length > 0) {
          start = startElements[0].getAttribute('w:val') || '1';
        } else {
          const startElementsNoNs = lvl.getElementsByTagName('start');
          if (startElementsNoNs.length > 0) {
            start = startElementsNoNs[0].getAttribute('w:val') || '1';
          }
        }
        
        // 检查是否为法律编号
        const isLglElements = lvl.getElementsByTagName('w:isLgl');
        const isLglElementsNoNs = lvl.getElementsByTagName('isLgl');
        const isLgl = isLglElements.length > 0 || isLglElementsNoNs.length > 0;
        
        levels[ilvl] = {
          format,
          text,
          start: parseInt(start),
          isLgl,
          legacy: this.extractLegacyNumbering(lvl)
        };
      }
    }
    
    return levels;
  }

  // 提取传统编号信息
  private extractLegacyNumbering(lvl: Element): any {
    const legacyElements = lvl.getElementsByTagName('w:legacy');
    let legacy = legacyElements.length > 0 ? legacyElements[0] : null;
    
    if (!legacy) {
      const legacyElementsNoNs = lvl.getElementsByTagName('legacy');
      legacy = legacyElementsNoNs.length > 0 ? legacyElementsNoNs[0] : null;
    }
    
    if (!legacy) return null;
    
    return {
      legacy: legacy.getAttribute('w:legacy') === '1',
      legacySpace: parseInt(legacy.getAttribute('w:legacySpace') || '0'),
      legacyIndent: parseInt(legacy.getAttribute('w:legacyIndent') || '0')
    };
  }

  // 解析页眉页脚
  private async parseHeadersFooters(): Promise<{ headers: WordState['headers']; footers: WordState['footers'] }> {
    const headers: WordState['headers'] = [];
    const footers: WordState['footers'] = [];

    // 解析页眉
      for (const [id, headerXml] of Array.from(this.headerXmls.entries())) {
        const headerData = await this.parseHeaderFooterXml(headerXml, 'header');
        if (headerData) {
          headers.push(headerData);
        }
      }

    // 解析页脚
      for (const [id, footerXml] of Array.from(this.footerXmls.entries())) {
        const footerData = await this.parseHeaderFooterXml(footerXml, 'footer');
        if (footerData) {
          footers.push(footerData);
        }
      }

    return { headers, footers };
  }

  // 解析页眉页脚XML
  private async parseHeaderFooterXml(xml: string, type: 'header' | 'footer'): Promise<string | null> {
    if (!xml) return null;

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xml, 'text/xml');
      
      // 提取段落和表格
      const { paragraphs, tables } = this.extractParagraphsAndTables(doc, this.state.styles);
      
      // 应用样式继承
      this.applyStyleInheritance(paragraphs, tables);
      
      // 生成内容文本
      const content = paragraphs.map(p => p.runs.map(r => r.text).join('')).join('\n');
      
      return content;
    } catch (error) {
      console.error(`解析${type}失败:`, error);
      return null;
    }
  }

  // 获取页眉页脚类型
  private getHeaderFooterType(xml: string): string {
    if (xml.includes('w:type="first"') || xml.includes('type="first"')) return 'first';
    if (xml.includes('w:type="even"') || xml.includes('type="even"')) return 'even';
    return 'default';
  }

  // 提取核心属性（元数据）
  private async extractCoreProperties(): Promise<WordState['metadata']> {
    if (!this.zip) return {};

    try {
      // 查找核心属性文件
      const coreFile = this.zip.file('docProps/core.xml');
      if (!coreFile) return {};

      const coreXml = await coreFile.async('text') as string;
      const parser = new DOMParser();
      const doc = parser.parseFromString(coreXml, 'text/xml');

      const metadata: Record<string, any> = {};

      // 提取标准属性
      const properties = [
        'title', 'subject', 'creator', 'keywords', 'description',
        'lastModifiedBy', 'revision', 'created', 'modified'
      ];

      properties.forEach(prop => {
        // 尝试查找标准属性名
        let elements = doc.getElementsByTagName(prop);
        let element = elements.length > 0 ? elements[0] : null;
        
        // 如果没找到，尝试查找 dc: 前缀的属性
        if (!element) {
          elements = doc.getElementsByTagName(`dc:${prop}`);
          element = elements.length > 0 ? elements[0] : null;
        }
        
        // 如果还没找到，尝试查找 dcterms: 前缀的属性
        if (!element) {
          elements = doc.getElementsByTagName(`dcterms:${prop}`);
          element = elements.length > 0 ? elements[0] : null;
        }
        
        if (element && element.textContent) {
          metadata[prop] = element.textContent.trim();
        }
      });

      return metadata;
    } catch (error) {
      console.error('提取核心属性失败:', error);
      return {};
    }
  }
}
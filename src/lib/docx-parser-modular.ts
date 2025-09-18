// 模块化的DOCX解析器主文件
// 这个文件就像一个总指挥，协调各个专门的解析模块来完成文档解析工作
// 相比原来的大文件，现在代码更清晰、更容易维护

import * as JSZip from 'jszip';
import { DOMParser } from 'xmldom';

// 导入我们创建的各个专门模块
import { DocumentElement, PageSettings, DocumentStructure, WordState } from './docx-modules/types';
import { StyleParser } from './docx-modules/style-parser';
import { ThemeParser } from './docx-modules/theme-parser';
import { FontParser } from './docx-modules/font-parser';
import { XmlUtils, ColorUtils, NumberUtils, StringUtils, ObjectUtils, DebugUtils } from './docx-modules/utils';

export class DocxParserModular {
  // 核心属性
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

  // 专门的解析器实例
  private styleParser: StyleParser;
  private themeParser: ThemeParser;
  private fontParser: FontParser;

  // 解析状态
  private state: {
    styles: Record<string, any>;
    defaults: {
      paragraph?: Record<string, any>;
      character?: Record<string, any>;
    };
    fontTable?: WordState['fontTable'];
    themeColors?: WordState['themeColors'];
  } = { styles: {}, defaults: {} };

  constructor() {
    // 初始化各个专门的解析器
    this.styleParser = new StyleParser();
    this.themeParser = new ThemeParser();
    this.fontParser = new FontParser();
    
    // 启用调试模式（可选）
    DebugUtils.setDebugMode(false);
  }

  /**
   * 主要的解析方法
   * 这是整个解析过程的入口点
   */
  async parseDocx(buffer: Buffer): Promise<WordState> {
    DebugUtils.timeStart('总解析时间');
    
    try {
      // 第一步：加载ZIP文件
      DebugUtils.log('开始加载DOCX文件');
      await this.loadZipFile(buffer);

      // 第二步：提取所有XML文件
      DebugUtils.log('开始提取XML文件');
      await this.extractXmlFiles();

      // 第三步：提取图片资源
      DebugUtils.log('开始提取图片资源');
      await this.extractImages();

      // 第四步：解析主题颜色
      DebugUtils.log('开始解析主题颜色');
      this.state.themeColors = this.themeParser.parseThemeColors(this.themeXml);

      // 第五步：解析样式信息
      DebugUtils.log('开始解析样式信息');
      this.state.styles = this.styleParser.parseStyles(this.stylesXml);
      this.state.defaults = this.styleParser.parseDefaults(this.stylesXml);

      // 第六步：解析字体信息
      DebugUtils.log('开始解析字体信息');
      this.state.fontTable = this.fontParser.parseFontTable(this.fontTableXml);
      
      // 如果有主题XML，也解析主题字体
      if (this.themeXml) {
        const themeFonts = this.fontParser.parseThemeFonts(this.themeXml);
        this.state.fontTable = ObjectUtils.deepMerge(this.state.fontTable || {}, themeFonts);
      }

      // 第七步：解析文档内容
      DebugUtils.log('开始解析文档内容');
      const documentContent = await this.parseDocumentContent();

      // 第八步：解析页眉页脚
      DebugUtils.log('开始解析页眉页脚');
      const headersFooters = await this.parseHeadersFooters();

      // 第九步：解析背景图片
      DebugUtils.log('开始解析背景图片');
      const backgroundImage = await this.detectBackgroundImage();

      // 第十步：解析元数据
      DebugUtils.log('开始解析元数据');
      const metadata = await this.extractCoreProperties();

      // 第十一步：解析列表信息
      DebugUtils.log('开始解析列表信息');
      const lists = this.parseNumbering();

      // 组装最终结果
      const result: WordState = {
        page: documentContent.page,
        backgroundImage: backgroundImage,
        floatingImages: documentContent.floatingImages,
        paragraphs: documentContent.paragraphs,
        tables: documentContent.tables,
        lists: lists,
        themeColors: this.state.themeColors || {
          accent1: '4F81BD', accent2: 'F79646', accent3: '9CBB58',
          accent4: '8064A2', accent5: '4BACC6', accent6: 'F24726'
        },
        styles: this.state.styles,
        fontTable: this.state.fontTable,
        lang: documentContent.lang,
        rtl: documentContent.rtl,
        defaults: this.state.defaults,
        headers: headersFooters.headers,
        footers: headersFooters.footers,
        images: Object.fromEntries(this.images),
        metadata: metadata
      };

      DebugUtils.timeEnd('总解析时间');
      DebugUtils.log('解析完成', { 
        paragraphs: result.paragraphs.length,
        tables: result.tables.length,
        images: Object.keys(result.images || {}).length
      });

      return result;

    } catch (error) {
      DebugUtils.error('解析过程中出错', error);
      throw error;
    }
  }

  /**
   * 加载ZIP文件
   */
  private async loadZipFile(buffer: Buffer): Promise<void> {
    try {
      this.zip = await JSZip.loadAsync(buffer);
      DebugUtils.log('ZIP文件加载成功');
    } catch (error) {
      DebugUtils.error('加载ZIP文件失败', error);
      throw new Error('无法加载DOCX文件，文件可能已损坏');
    }
  }

  /**
   * 提取所有需要的XML文件
   */
  private async extractXmlFiles(): Promise<void> {
    const xmlFiles = [
      { path: 'word/document.xml', property: 'documentXml' },
      { path: 'word/styles.xml', property: 'stylesXml' },
      { path: 'word/numbering.xml', property: 'numberingXml' },
      { path: 'word/theme/theme1.xml', property: 'themeXml' },
      { path: 'word/_rels/document.xml.rels', property: 'relsXml' },
      { path: 'word/settings.xml', property: 'settingsXml' },
      { path: 'word/fontTable.xml', property: 'fontTableXml' }
    ];

    for (const { path, property } of xmlFiles) {
      try {
        const file = this.zip.file(path);
        if (file) {
          (this as any)[property] = await file.async('string');
          DebugUtils.log(`提取 ${path} 成功`);
        } else {
          DebugUtils.warn(`文件 ${path} 不存在`);
        }
      } catch (error) {
        DebugUtils.warn(`提取 ${path} 失败`, error);
      }
    }

    // 提取页眉页脚文件
    await this.extractHeaderFooterFiles();
  }

  /**
   * 提取页眉页脚文件
   */
  private async extractHeaderFooterFiles(): Promise<void> {
    const files = Object.keys(this.zip.files);
    
    for (const fileName of files) {
      if (fileName.startsWith('word/header') && fileName.endsWith('.xml')) {
        try {
          const content = await this.zip.file(fileName).async('string');
          this.headerXmls.set(fileName, content);
          DebugUtils.log(`提取页眉文件 ${fileName} 成功`);
        } catch (error) {
          DebugUtils.warn(`提取页眉文件 ${fileName} 失败`, error);
        }
      } else if (fileName.startsWith('word/footer') && fileName.endsWith('.xml')) {
        try {
          const content = await this.zip.file(fileName).async('string');
          this.footerXmls.set(fileName, content);
          DebugUtils.log(`提取页脚文件 ${fileName} 成功`);
        } catch (error) {
          DebugUtils.warn(`提取页脚文件 ${fileName} 失败`, error);
        }
      }
    }
  }

  /**
   * 提取图片资源
   */
  private async extractImages(): Promise<void> {
    const files = Object.keys(this.zip.files);
    
    for (const fileName of files) {
      if (fileName.startsWith('word/media/') && this.isImageFile(fileName)) {
        try {
          const imageData = await this.zip.file(fileName).async('uint8array');
          const base64 = this.arrayBufferToBase64(imageData);
          const mimeType = this.getMimeType(fileName);
          this.images.set(fileName, `data:${mimeType};base64,${base64}`);
          DebugUtils.log(`提取图片 ${fileName} 成功`);
        } catch (error) {
          DebugUtils.warn(`提取图片 ${fileName} 失败`, error);
        }
      }
    }
  }

  /**
   * 检查是否为图片文件
   */
  private isImageFile(fileName: string): boolean {
    const imageExtensions = ['.png', '.jpg', '.jpeg', '.gif', '.bmp', '.svg', '.webp'];
    return imageExtensions.some(ext => fileName.toLowerCase().endsWith(ext));
  }

  /**
   * 获取MIME类型
   */
  private getMimeType(fileName: string): string {
    const ext = fileName.toLowerCase().split('.').pop();
    const mimeTypes: Record<string, string> = {
      'png': 'image/png',
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'gif': 'image/gif',
      'bmp': 'image/bmp',
      'svg': 'image/svg+xml',
      'webp': 'image/webp'
    };
    return mimeTypes[ext || ''] || 'image/png';
  }

  /**
   * 解析文档主要内容
   */
  private async parseDocumentContent(): Promise<{
    page: WordState['page'];
    paragraphs: WordState['paragraphs'];
    tables: WordState['tables'];
    floatingImages: WordState['floatingImages'];
    lang: string;
    rtl: boolean;
  }> {
    const doc = XmlUtils.safeParseXml(this.documentXml, '文档XML解析');
    if (!doc) {
      throw new Error('无法解析文档XML');
    }

    // 解析页面设置
    const page = this.extractPageGeometry(doc);
    
    // 解析语言和方向
    const { lang, rtl } = this.extractLanguageAndDirection(doc);
    
    // 解析浮动图片
    const floatingImages = await this.extractFloatingImages(doc);
    
    // 解析段落和表格
    const { paragraphs, tables } = await this.extractParagraphsAndTables(doc);
    
    // 应用样式继承
    this.applyStyleInheritance(paragraphs, tables);

    return {
      page,
      paragraphs,
      tables,
      floatingImages,
      lang,
      rtl
    };
  }

  /**
   * 提取页面几何信息
   */
  private extractPageGeometry(doc: Document): WordState['page'] {
    const sectPr = XmlUtils.getFirstChildElement(doc, 'w:sectPr');
    const pgSz = sectPr ? XmlUtils.getFirstChildElement(sectPr, 'w:pgSz') : null;
    const pgMar = sectPr ? XmlUtils.getFirstChildElement(sectPr, 'w:pgMar') : null;

    // 默认A4页面设置
    let width = 11906; // A4宽度（twips）
    let height = 16838; // A4高度（twips）
    let margins = [1440, 1440, 1440, 1440]; // 默认1英寸边距

    if (pgSz) {
      width = NumberUtils.parseInt(XmlUtils.getAttributeValue(pgSz, 'w:w'), width);
      height = NumberUtils.parseInt(XmlUtils.getAttributeValue(pgSz, 'w:h'), height);
    }

    if (pgMar) {
      margins = [
        NumberUtils.parseInt(XmlUtils.getAttributeValue(pgMar, 'w:top'), margins[0]),
        NumberUtils.parseInt(XmlUtils.getAttributeValue(pgMar, 'w:right'), margins[1]),
        NumberUtils.parseInt(XmlUtils.getAttributeValue(pgMar, 'w:bottom'), margins[2]),
        NumberUtils.parseInt(XmlUtils.getAttributeValue(pgMar, 'w:left'), margins[3])
      ];
    }

    return {
      width: NumberUtils.twipsToPixels(width),
      height: NumberUtils.twipsToPixels(height),
      margin: margins.map(m => NumberUtils.twipsToPixels(m)) as [number, number, number, number]
    };
  }

  /**
   * 提取语言和方向信息
   */
  private extractLanguageAndDirection(doc: Document): { lang: string; rtl: boolean } {
    let lang = 'zh-CN';
    let rtl = false;

    // 从文档设置中获取默认语言
    if (this.settingsXml) {
      const settingsDoc = XmlUtils.safeParseXml(this.settingsXml, '设置XML解析');
      if (settingsDoc) {
        const themeFontLang = XmlUtils.getFirstChildElement(settingsDoc, 'w:themeFontLang');
        if (themeFontLang) {
          lang = XmlUtils.getAttributeValue(themeFontLang, 'w:val', lang);
        }

        const bidi = XmlUtils.getFirstChildElement(settingsDoc, 'w:bidi');
        if (bidi) {
          rtl = XmlUtils.getAttributeValue(bidi, 'w:val') === '1';
        }
      }
    }

    return { lang, rtl };
  }

  /**
   * 提取浮动图片
   */
  private async extractFloatingImages(doc: Document): Promise<WordState['floatingImages']> {
    const floatingImages: WordState['floatingImages'] = [];
    
    const anchors = XmlUtils.getChildElements(doc, 'wp:anchor');
    
    for (const anchor of anchors) {
      try {
        const image = await this.parseFloatingImage(anchor);
        if (image) {
          floatingImages.push(image);
        }
      } catch (error) {
        DebugUtils.warn('解析浮动图片失败', error);
      }
    }

    return floatingImages;
  }

  /**
   * 解析浮动图片
   */
  private async parseFloatingImage(anchor: Element): Promise<WordState['floatingImages'][0] | null> {
    const graphic = XmlUtils.getFirstChildElement(anchor, 'a:graphic');
    if (!graphic) return null;

    const graphicData = XmlUtils.getFirstChildElement(graphic, 'a:graphicData');
    if (!graphicData) return null;

    const pic = XmlUtils.getFirstChildElement(graphicData, 'pic:pic');
    if (!pic) return null;

    const blipFill = XmlUtils.getFirstChildElement(pic, 'pic:blipFill');
    if (!blipFill) return null;

    const blip = XmlUtils.getFirstChildElement(blipFill, 'a:blip');
    if (!blip) return null;

    const embed = XmlUtils.getAttributeValue(blip, 'r:embed');
    if (!embed) return null;

    const imageSrc = await this.getImageByRelId(embed);
    if (!imageSrc) return null;

    // 提取位置信息
    const positionH = XmlUtils.getFirstChildElement(anchor, 'wp:positionH');
    const positionV = XmlUtils.getFirstChildElement(anchor, 'wp:positionV');

    const left = this.extractPositionValue(positionH);
    const top = this.extractPositionValue(positionV);

    // 提取层级信息
    const zIndex = NumberUtils.parseInt(XmlUtils.getAttributeValue(anchor, 'relativeHeight'), 0);

    // 检查是否在文档后面
    const behindDoc = XmlUtils.getAttributeValue(anchor, 'behindDoc') === '1';

    return {
      src: imageSrc,
      left,
      top,
      zIndex,
      behindDoc
    };
  }

  /**
   * 提取位置值
   */
  private extractPositionValue(positionElement: Element | null): string {
    if (!positionElement) return '0px';

    const posOffset = XmlUtils.getFirstChildElement(positionElement, 'wp:posOffset');
    if (posOffset) {
      const emu = NumberUtils.parseInt(XmlUtils.getElementText(posOffset), 0);
      return `${this.emuToPixels(emu)}px`;
    }

    const align = XmlUtils.getFirstChildElement(positionElement, 'wp:align');
    if (align) {
      return XmlUtils.getElementText(align, 'left');
    }

    return '0px';
  }

  /**
   * EMU转像素
   */
  private emuToPixels(emu: number): number {
    return Math.round(emu / 9525); // 1 inch = 914400 EMU, 1 inch = 96 pixels
  }

  /**
   * 通过关系ID获取图片
   */
  private async getImageByRelId(relId: string): Promise<string | undefined> {
    if (!this.relsXml) return undefined;

    const relsDoc = XmlUtils.safeParseXml(this.relsXml, '关系XML解析');
    if (!relsDoc) return undefined;

    const relationships = XmlUtils.getChildElements(relsDoc, 'Relationship');
    
    for (const rel of relationships) {
      if (XmlUtils.getAttributeValue(rel, 'Id') === relId) {
        const target = XmlUtils.getAttributeValue(rel, 'Target');
        if (target) {
          const imagePath = target.startsWith('/') ? target.substring(1) : `word/${target}`;
          return this.images.get(imagePath);
        }
      }
    }

    return undefined;
  }

  /**
   * 提取段落和表格
   */
  private async extractParagraphsAndTables(doc: Document): Promise<{
    paragraphs: WordState['paragraphs'];
    tables: WordState['tables'];
  }> {
    const paragraphs: WordState['paragraphs'] = [];
    const tables: WordState['tables'] = [];

    const body = XmlUtils.getFirstChildElement(doc, 'w:body');
    if (!body) {
      DebugUtils.warn('未找到文档主体');
      return { paragraphs, tables };
    }

    const children = Array.from(body.childNodes).filter(node => node.nodeType === 1) as Element[];

    for (const child of children) {
      try {
        if (child.tagName === 'w:p') {
          const paragraph = await this.parseParagraph(child);
          if (paragraph) {
            paragraphs.push(paragraph);
          }
        } else if (child.tagName === 'w:tbl') {
          const table = await this.parseTable(child);
          if (table) {
            tables.push(table);
          }
        }
      } catch (error) {
        DebugUtils.warn(`解析元素 ${child.tagName} 失败`, error);
      }
    }

    return { paragraphs, tables };
  }

  /**
   * 解析段落
   */
  private async parseParagraph(element: Element): Promise<WordState['paragraphs'][0] | null> {
    const pPr = XmlUtils.getFirstChildElement(element, 'w:pPr');
    const styleId = pPr ? XmlUtils.getAttributeValue(XmlUtils.getFirstChildElement(pPr, 'w:pStyle'), 'w:val') : undefined;

    const paragraph: WordState['paragraphs'][0] = {
      styleId,
      indent: this.getIndent(pPr),
      spacing: this.getSpacing(pPr),
      alignment: this.getAlignment(pPr),
      runs: await this.getTextRuns(element, styleId)
    };

    return paragraph;
  }

  /**
   * 获取对齐方式
   */
  private getAlignment(pPr: Element | null): WordState['paragraphs'][0]['alignment'] {
    if (!pPr) return 'left';

    const jc = XmlUtils.getFirstChildElement(pPr, 'w:jc');
    if (!jc) return 'left';

    const val = XmlUtils.getAttributeValue(jc, 'w:val');
    switch (val) {
      case 'center': return 'center';
      case 'right': return 'right';
      case 'both':
      case 'distribute': return 'justify';
      default: return 'left';
    }
  }

  /**
   * 获取缩进信息
   */
  private getIndent(pPr: Element | null): WordState['paragraphs'][0]['indent'] {
    const indent: WordState['paragraphs'][0]['indent'] = {};

    if (!pPr) return indent;

    const ind = XmlUtils.getFirstChildElement(pPr, 'w:ind');
    if (!ind) return indent;

    const firstLine = XmlUtils.getAttributeValue(ind, 'w:firstLine');
    if (firstLine) {
      indent.firstLine = NumberUtils.twipsToPixels(NumberUtils.parseInt(firstLine));
    }

    const hanging = XmlUtils.getAttributeValue(ind, 'w:hanging');
    if (hanging) {
      indent.hanging = NumberUtils.twipsToPixels(NumberUtils.parseInt(hanging));
    }

    const left = XmlUtils.getAttributeValue(ind, 'w:left');
    if (left) {
      indent.left = NumberUtils.twipsToPixels(NumberUtils.parseInt(left));
    }

    const right = XmlUtils.getAttributeValue(ind, 'w:right');
    if (right) {
      indent.right = NumberUtils.twipsToPixels(NumberUtils.parseInt(right));
    }

    return indent;
  }

  /**
   * 获取间距信息
   */
  private getSpacing(pPr: Element | null): WordState['paragraphs'][0]['spacing'] {
    const spacing: WordState['paragraphs'][0]['spacing'] = {};

    if (!pPr) return spacing;

    const spc = XmlUtils.getFirstChildElement(pPr, 'w:spacing');
    if (!spc) return spacing;

    const before = XmlUtils.getAttributeValue(spc, 'w:before');
    if (before) {
      spacing.before = NumberUtils.twipsToPixels(NumberUtils.parseInt(before));
    }

    const after = XmlUtils.getAttributeValue(spc, 'w:after');
    if (after) {
      spacing.after = NumberUtils.twipsToPixels(NumberUtils.parseInt(after));
    }

    const line = XmlUtils.getAttributeValue(spc, 'w:line');
    if (line) {
      spacing.line = NumberUtils.parseInt(line) / 240; // 转换为倍数
    }

    const lineRule = XmlUtils.getAttributeValue(spc, 'w:lineRule');
    if (lineRule) {
      spacing.lineRule = lineRule;
    }

    return spacing;
  }

  /**
   * 获取文本运行
   */
  private async getTextRuns(element: Element, paragraphStyleId?: string): Promise<WordState['paragraphs'][0]['runs']> {
    const runs: WordState['paragraphs'][0]['runs'] = [];
    const runElements = XmlUtils.getChildElements(element, 'w:r');

    for (const runElement of runElements) {
      try {
        const run = await this.parseTextRun(runElement, paragraphStyleId);
        if (run) {
          runs.push(run);
        }
      } catch (error) {
        DebugUtils.warn('解析文本运行失败', error);
      }
    }

    return runs;
  }

  /**
   * 解析文本运行
   */
  private async parseTextRun(runElement: Element, paragraphStyleId?: string): Promise<WordState['paragraphs'][0]['runs'][0] | null> {
    const rPr = XmlUtils.getFirstChildElement(runElement, 'w:rPr');
    
    // 检查是否包含图片
    const drawing = XmlUtils.getFirstChildElement(runElement, 'w:drawing');
    if (drawing) {
      const image = await this.parseInlineImage(drawing);
      if (image) {
        return {
          text: '',
          image: image
        };
      }
    }

    // 提取文本内容
    const textElements = XmlUtils.getChildElements(runElement, 'w:t');
    let text = '';
    for (const textElement of textElements) {
      text += XmlUtils.getElementText(textElement);
    }

    // 处理制表符和换行符
    const tabElements = XmlUtils.getChildElements(runElement, 'w:tab');
    text += '\t'.repeat(tabElements.length);

    const brElements = XmlUtils.getChildElements(runElement, 'w:br');
    text += '\n'.repeat(brElements.length);

    if (!text && !drawing) {
      return null;
    }

    // 提取格式信息
    const run: WordState['paragraphs'][0]['runs'][0] = {
      text: StringUtils.cleanText(text),
      bold: this.isBold(rPr),
      italic: this.isItalic(rPr),
      underline: this.isUnderline(rPr),
      strike: this.isStrike(rPr),
      color: this.getColor(rPr),
      font: this.fontParser.resolveFontFamily(rPr, paragraphStyleId, this.state.fontTable as any),
      sz: this.getFontSize(rPr)
    };

    return run;
  }

  /**
   * 解析内联图片
   */
  private async parseInlineImage(drawing: Element): Promise<any | null> {
    const inline = XmlUtils.getFirstChildElement(drawing, 'wp:inline');
    if (!inline) return null;

    const graphic = XmlUtils.getFirstChildElement(inline, 'a:graphic');
    if (!graphic) return null;

    const graphicData = XmlUtils.getFirstChildElement(graphic, 'a:graphicData');
    if (!graphicData) return null;

    const pic = XmlUtils.getFirstChildElement(graphicData, 'pic:pic');
    if (!pic) return null;

    const blipFill = XmlUtils.getFirstChildElement(pic, 'pic:blipFill');
    if (!blipFill) return null;

    const blip = XmlUtils.getFirstChildElement(blipFill, 'a:blip');
    if (!blip) return null;

    const embed = XmlUtils.getAttributeValue(blip, 'r:embed');
    if (!embed) return null;

    const imageSrc = await this.getImageByRelId(embed);
    if (!imageSrc) return null;

    // 提取尺寸信息
    const extent = XmlUtils.getFirstChildElement(inline, 'wp:extent');
    let width = 0;
    let height = 0;

    if (extent) {
      width = this.emuToPixels(NumberUtils.parseInt(XmlUtils.getAttributeValue(extent, 'cx')));
      height = this.emuToPixels(NumberUtils.parseInt(XmlUtils.getAttributeValue(extent, 'cy')));
    }

    return {
      type: 'inline' as const,
      src: imageSrc,
      width,
      height
    };
  }

  // 格式检测方法
  private isBold(rPr: Element | null): boolean {
    if (!rPr) return false;
    const bold = XmlUtils.getFirstChildElement(rPr, 'w:b');
    return bold !== null && XmlUtils.getAttributeValue(bold, 'w:val', '1') !== '0';
  }

  private isItalic(rPr: Element | null): boolean {
    if (!rPr) return false;
    const italic = XmlUtils.getFirstChildElement(rPr, 'w:i');
    return italic !== null && XmlUtils.getAttributeValue(italic, 'w:val', '1') !== '0';
  }

  private isUnderline(rPr: Element | null): boolean {
    if (!rPr) return false;
    const underline = XmlUtils.getFirstChildElement(rPr, 'w:u');
    return underline !== null && XmlUtils.getAttributeValue(underline, 'w:val') !== 'none';
  }

  private isStrike(rPr: Element | null): boolean {
    if (!rPr) return false;
    const strike = XmlUtils.getFirstChildElement(rPr, 'w:strike');
    return strike !== null && XmlUtils.getAttributeValue(strike, 'w:val', '1') !== '0';
  }

  private getColor(rPr: Element | null): string {
    if (!rPr) return '#000000';

    const color = XmlUtils.getFirstChildElement(rPr, 'w:color');
    if (!color) return '#000000';

    const val = XmlUtils.getAttributeValue(color, 'w:val');
    if (val && val !== 'auto') {
      return `#${val}`;
    }

    // 尝试解析主题颜色
    const themeColor = XmlUtils.getAttributeValue(color, 'w:themeColor');
    if (themeColor && this.state.themeColors) {
      return this.themeParser.resolveThemeColor(themeColor, this.state.themeColors);
    }

    return '#000000';
  }

  private getFontSize(rPr: Element | null): number {
    if (!rPr) return 12;

    const sz = XmlUtils.getFirstChildElement(rPr, 'w:sz');
    if (!sz) return 12;

    const val = XmlUtils.getAttributeValue(sz, 'w:val');
    return NumberUtils.parseInt(val) / 2; // Word中字号是半磅为单位
  }

  /**
   * 解析表格
   */
  private async parseTable(element: Element): Promise<WordState['tables'][0] | null> {
    const tblPr = XmlUtils.getFirstChildElement(element, 'w:tblPr');
    const styleId = tblPr ? XmlUtils.getAttributeValue(XmlUtils.getFirstChildElement(tblPr, 'w:tblStyle'), 'w:val') : undefined;

    const bordersElement = tblPr ? XmlUtils.getFirstChildElement(tblPr, 'w:tblBorders') : null;
    
    const table: WordState['tables'][0] = {
      styleId,
      borders: this.extractTableBorders(bordersElement),
      rows: []
    };

    const rows = XmlUtils.getChildElements(element, 'w:tr');
    for (const row of rows) {
      try {
        const tableRow = await this.parseTableRow(row);
        if (tableRow) {
          table.rows.push(tableRow);
        }
      } catch (error) {
        DebugUtils.warn('解析表格行失败', error);
      }
    }

    return table;
  }

  /**
   * 解析表格行
   */
  private async parseTableRow(rowElement: Element): Promise<WordState['tables'][0]['rows'][0] | null> {
    const trPr = XmlUtils.getFirstChildElement(rowElement, 'w:trPr');
    const height = trPr ? NumberUtils.parseInt(XmlUtils.getAttributeValue(XmlUtils.getFirstChildElement(trPr, 'w:trHeight'), 'w:val')) : undefined;

    const row: WordState['tables'][0]['rows'][0] = {
      height: height ? NumberUtils.twipsToPixels(height) : undefined,
      cells: []
    };

    const cells = XmlUtils.getChildElements(rowElement, 'w:tc');
    for (const cell of cells) {
      try {
        const tableCell = await this.parseTableCell(cell);
        if (tableCell) {
          row.cells.push(tableCell);
        }
      } catch (error) {
        DebugUtils.warn('解析表格单元格失败', error);
      }
    }

    return row;
  }

  /**
   * 解析表格单元格
   */
  private async parseTableCell(cellElement: Element): Promise<WordState['tables'][0]['rows'][0]['cells'][0] | null> {
    const tcPr = XmlUtils.getFirstChildElement(cellElement, 'w:tcPr');
    
    const cell: WordState['tables'][0]['rows'][0]['cells'][0] = {
      content: []
    };

    // 提取单元格属性
    if (tcPr) {
      const tcW = XmlUtils.getFirstChildElement(tcPr, 'w:tcW');
      if (tcW) {
        cell.width = NumberUtils.twipsToPixels(NumberUtils.parseInt(XmlUtils.getAttributeValue(tcW, 'w:w')));
      }

      const gridSpan = XmlUtils.getFirstChildElement(tcPr, 'w:gridSpan');
      if (gridSpan) {
        cell.colSpan = NumberUtils.parseInt(XmlUtils.getAttributeValue(gridSpan, 'w:val'));
      }

      const vMerge = XmlUtils.getFirstChildElement(tcPr, 'w:vMerge');
      if (vMerge) {
        cell.rowSpan = 1; // 简化处理
      }

      const shd = XmlUtils.getFirstChildElement(tcPr, 'w:shd');
      if (shd) {
        const fill = XmlUtils.getAttributeValue(shd, 'w:fill');
        if (fill && fill !== 'auto') {
          cell.background = `#${fill}`;
        }
      }
    }

    // 解析单元格内容
    const paragraphs = XmlUtils.getChildElements(cellElement, 'w:p');
    for (const p of paragraphs) {
      const paragraph = await this.parseParagraph(p);
      if (paragraph) {
        cell.content.push(paragraph);
      }
    }

    return cell;
  }

  /**
   * 提取表格边框
   */
  private extractTableBorders(bordersElement: Element | null): WordState['tables'][0]['borders'] {
    const defaultBorder = { style: 'none', color: '#000000', size: 0, space: 0 };
    
    if (!bordersElement) {
      return {
        top: defaultBorder,
        left: defaultBorder,
        bottom: defaultBorder,
        right: defaultBorder,
        insideH: defaultBorder,
        insideV: defaultBorder
      };
    }

    const extractBorder = (borderElement: Element | null) => {
      if (!borderElement) return defaultBorder;
      
      return {
        style: XmlUtils.getAttributeValue(borderElement, 'w:val', 'none'),
        color: `#${XmlUtils.getAttributeValue(borderElement, 'w:color', '000000')}`,
        size: NumberUtils.parseInt(XmlUtils.getAttributeValue(borderElement, 'w:sz')) / 8, // 转换为像素
        space: NumberUtils.parseInt(XmlUtils.getAttributeValue(borderElement, 'w:space'))
      };
    };

    return {
      top: extractBorder(XmlUtils.getFirstChildElement(bordersElement, 'w:top')),
      left: extractBorder(XmlUtils.getFirstChildElement(bordersElement, 'w:left')),
      bottom: extractBorder(XmlUtils.getFirstChildElement(bordersElement, 'w:bottom')),
      right: extractBorder(XmlUtils.getFirstChildElement(bordersElement, 'w:right')),
      insideH: extractBorder(XmlUtils.getFirstChildElement(bordersElement, 'w:insideH')),
      insideV: extractBorder(XmlUtils.getFirstChildElement(bordersElement, 'w:insideV'))
    };
  }

  /**
   * 应用样式继承
   */
  private applyStyleInheritance(paragraphs: WordState['paragraphs'], tables: WordState['tables']): void {
    // 应用段落样式继承
    for (const paragraph of paragraphs) {
      this.applyParagraphStyleInheritance(paragraph);
    }

    // 应用表格样式继承
    for (const table of tables) {
      this.applyTableStyleInheritance(table);
    }
  }

  /**
   * 应用段落样式继承
   */
  private applyParagraphStyleInheritance(paragraph: WordState['paragraphs'][0]): void {
    if (!paragraph.styleId || !this.state.styles[paragraph.styleId]) return;

    const style = this.state.styles[paragraph.styleId];
    
    // 应用段落级别的样式
    if (style.paragraph) {
      paragraph.indent = ObjectUtils.deepMerge(style.paragraph.indent || {}, paragraph.indent);
      paragraph.spacing = ObjectUtils.deepMerge(style.paragraph.spacing || {}, paragraph.spacing);
      if (!paragraph.alignment || paragraph.alignment === 'left') {
        paragraph.alignment = style.paragraph.alignment || paragraph.alignment;
      }
    }

    // 应用运行级别的样式
    for (const run of paragraph.runs) {
      this.applyRunStyleInheritance(run, paragraph.styleId);
    }
  }

  /**
   * 应用运行样式继承
   */
  private applyRunStyleInheritance(run: WordState['paragraphs'][0]['runs'][0], paragraphStyleId?: string): void {
    if (!paragraphStyleId || !this.state.styles[paragraphStyleId]) return;

    const style = this.state.styles[paragraphStyleId];
    
    if (style.character) {
      // 只在当前值为默认值时应用样式
      if (!run.bold && style.character.bold) run.bold = true;
      if (!run.italic && style.character.italic) run.italic = true;
      if (!run.underline && style.character.underline) run.underline = true;
      if (!run.strike && style.character.strike) run.strike = true;
      if (run.color === '#000000' && style.character.color) run.color = style.character.color;
      if (run.font === 'Calibri' && style.character.font) run.font = style.character.font;
      if (run.sz === 12 && style.character.sz) run.sz = style.character.sz;
    }
  }

  /**
   * 应用表格样式继承
   */
  private applyTableStyleInheritance(table: WordState['tables'][0]): void {
    if (!table.styleId || !this.state.styles[table.styleId]) return;

    const style = this.state.styles[table.styleId];
    
    // 应用表格边框样式
    if (style.borders) {
      table.borders = ObjectUtils.deepMerge(style.borders, table.borders);
    }

    // 应用单元格样式
    for (const row of table.rows) {
      for (const cell of row.cells) {
        for (const content of cell.content) {
          if (typeof content === 'object' && 'runs' in content) {
            this.applyParagraphStyleInheritance(content as WordState['paragraphs'][0]);
          }
        }
      }
    }
  }

  /**
   * 检测背景图片
   */
  private async detectBackgroundImage(): Promise<WordState['backgroundImage']> {
    // 这里可以实现背景图片检测逻辑
    // 暂时返回undefined
    return undefined;
  }

  /**
   * 解析页眉页脚
   */
  private async parseHeadersFooters(): Promise<{ headers: string[]; footers: string[] }> {
    const headers: string[] = [];
    const footers: string[] = [];

    // 解析页眉
    for (const [fileName, xml] of Array.from(this.headerXmls)) {
      try {
        const content = await this.parseHeaderFooterXml(xml, 'header');
        if (content) {
          headers.push(content);
        }
      } catch (error) {
        DebugUtils.warn(`解析页眉 ${fileName} 失败`, error);
      }
    }

    // 解析页脚
    for (const [fileName, xml] of Array.from(this.footerXmls)) {
      try {
        const content = await this.parseHeaderFooterXml(xml, 'footer');
        if (content) {
          footers.push(content);
        }
      } catch (error) {
        DebugUtils.warn(`解析页脚 ${fileName} 失败`, error);
      }
    }

    return { headers, footers };
  }

  /**
   * 解析页眉页脚XML
   */
  private async parseHeaderFooterXml(xml: string, type: 'header' | 'footer'): Promise<string | null> {
    const doc = XmlUtils.safeParseXml(xml, `${type}XML解析`);
    if (!doc) return null;

    const paragraphs = XmlUtils.getChildElements(doc, 'w:p');
    let content = '';

    for (const p of paragraphs) {
      const textRuns = await this.getTextRuns(p);
      for (const run of textRuns) {
        content += run.text;
      }
      content += '\n';
    }

    return StringUtils.cleanText(content);
  }

  /**
   * 提取核心属性（元数据）
   */
  private async extractCoreProperties(): Promise<WordState['metadata']> {
    try {
      const corePropsFile = this.zip.file('docProps/core.xml');
      if (!corePropsFile) return undefined;

      const corePropsXml = await corePropsFile.async('string');
      const doc = XmlUtils.safeParseXml(corePropsXml, '核心属性XML解析');
      if (!doc) return undefined;

      const metadata: WordState['metadata'] = {};

      const title = XmlUtils.getFirstChildElement(doc, 'dc:title');
      if (title) metadata.title = XmlUtils.getElementText(title);

      const creator = XmlUtils.getFirstChildElement(doc, 'dc:creator');
      if (creator) metadata.author = XmlUtils.getElementText(creator);

      const created = XmlUtils.getFirstChildElement(doc, 'dcterms:created');
      if (created) metadata.created = XmlUtils.getElementText(created);

      const modified = XmlUtils.getFirstChildElement(doc, 'dcterms:modified');
      if (modified) metadata.modified = XmlUtils.getElementText(modified);

      return metadata;
    } catch (error) {
      DebugUtils.warn('提取核心属性失败', error);
      return undefined;
    }
  }

  /**
   * 解析编号（列表）
   */
  private parseNumbering(): WordState['lists'] {
    if (!this.numberingXml) return [];

    const doc = XmlUtils.safeParseXml(this.numberingXml, '编号XML解析');
    if (!doc) return [];

    const lists: WordState['lists'] = [];
    const abstractNums = XmlUtils.getChildElements(doc, 'w:abstractNum');

    for (const abstractNum of abstractNums) {
      try {
        const abstractNumId = NumberUtils.parseInt(XmlUtils.getAttributeValue(abstractNum, 'w:abstractNumId'));
        const levels = this.extractNumberingLevels(abstractNum);
        
        lists.push({
          abstractNumId,
          levels
        });
      } catch (error) {
        DebugUtils.warn('解析编号定义失败', error);
      }
    }

    return lists;
  }

  /**
   * 提取编号级别
   */
  private extractNumberingLevels(abstractNum: Element): WordState['lists'][0]['levels'] {
    const levels: WordState['lists'][0]['levels'] = [];
    const lvls = XmlUtils.getChildElements(abstractNum, 'w:lvl');

    for (const lvl of lvls) {
      try {
        const numFmt = XmlUtils.getAttributeValue(XmlUtils.getFirstChildElement(lvl, 'w:numFmt'), 'w:val', 'bullet') as any;
        const lvlText = XmlUtils.getAttributeValue(XmlUtils.getFirstChildElement(lvl, 'w:lvlText'), 'w:val', '•');
        const start = NumberUtils.parseInt(XmlUtils.getAttributeValue(XmlUtils.getFirstChildElement(lvl, 'w:start'), 'w:val'), 1);
        
        const pPr = XmlUtils.getFirstChildElement(lvl, 'w:pPr');
        const ind = pPr ? XmlUtils.getFirstChildElement(pPr, 'w:ind') : null;
        const indent = ind ? NumberUtils.twipsToPixels(NumberUtils.parseInt(XmlUtils.getAttributeValue(ind, 'w:left'))) : 0;

        levels.push({
          numFmt,
          lvlText,
          indent,
          start
        });
      } catch (error) {
        DebugUtils.warn('解析编号级别失败', error);
      }
    }

    return levels;
  }

  /**
   * 工具方法：数组缓冲区转Base64
   */
  private arrayBufferToBase64(buffer: Uint8Array): string {
    let binary = '';
    const bytes = new Uint8Array(buffer);
    const len = bytes.byteLength;
    for (let i = 0; i < len; i++) {
      binary += String.fromCharCode(bytes[i]);
    }
    return btoa(binary);
  }
}

// 导出主要接口和类
export { DocumentElement, PageSettings, DocumentStructure, WordState };

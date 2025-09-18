// Word文档解析器的类型定义
// 这个文件定义了所有模块共用的数据结构，就像建筑图纸一样

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

export interface WordState {
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
      image?: {
        type: 'inline' | 'floating';
        src: string;
        width: number;
        height: number;
        embed?: string;
        left?: string;
        top?: string;
        zIndex?: number;
      };
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
  fontTable?: {
    majorFont?: {
      latin?: string;
      eastAsia?: string;
      complexScript?: string;
    };
    minorFont?: {
      latin?: string;
      eastAsia?: string;
      complexScript?: string;
    };
    fonts?: Record<string, {
      name: string;
      altName?: string;
      family?: string;
      charset?: string;
    }>;
  };
  lang: string;
  rtl: boolean;
  defaults: {
    paragraph?: any;
    character?: any;
  };
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

export interface Border {
  style?: string;
  color?: string;
  size?: number;
  space?: number;
}

// 解析器状态接口
export interface ParserState {
  styles: Record<string, any>;
  defaults: {
    paragraph?: Record<string, any>;
    character?: Record<string, any>;
  };
  fontTable?: {
    majorFont?: {
      latin?: string;
      eastAsia?: string;
      complexScript?: string;
    };
    minorFont?: {
      latin?: string;
      eastAsia?: string;
      complexScript?: string;
    };
    fonts?: Record<string, {
      name: string;
      altName?: string;
      family?: string;
      charset?: string;
    }>;
  };
}
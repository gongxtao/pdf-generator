// 工具模块
// 这个模块提供各种通用的辅助功能
// 就像一个工具箱，里面有各种小工具供其他模块使用

import { DOMParser } from 'xmldom';

/**
 * XML解析工具类
 */
export class XmlUtils {
  /**
   * 安全解析XML字符串
   * @param xmlString XML字符串
   * @param errorMessage 错误消息前缀
   * @returns 解析后的Document对象，失败时返回null
   */
  static safeParseXml(xmlString: string, errorMessage: string = 'XML解析'): Document | null {
    if (!xmlString || xmlString.trim() === '') {
      console.warn(`${errorMessage}: XML内容为空`);
      return null;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(xmlString, 'text/xml');
      
      // 检查解析错误
      const parseError = doc.getElementsByTagName('parsererror')[0];
      if (parseError) {
        console.error(`${errorMessage}失败:`, parseError.textContent);
        return null;
      }
      
      return doc;
    } catch (error) {
      console.error(`${errorMessage}时出错:`, error);
      return null;
    }
  }

  /**
   * 获取元素的文本内容
   * @param element 元素
   * @param defaultValue 默认值
   * @returns 文本内容
   */
  static getElementText(element: Element | null, defaultValue: string = ''): string {
    if (!element) return defaultValue;
    return element.textContent || defaultValue;
  }

  /**
   * 获取元素属性值
   * @param element 元素
   * @param attributeName 属性名
   * @param defaultValue 默认值
   * @returns 属性值
   */
  static getAttributeValue(element: Element | null, attributeName: string, defaultValue: string = ''): string {
    if (!element) return defaultValue;
    return element.getAttribute(attributeName) || defaultValue;
  }

  /**
   * 获取第一个匹配的子元素
   * @param parent 父元素
   * @param tagName 标签名
   * @returns 子元素或null
   */
  static getFirstChildElement(parent: Element | Document, tagName: string): Element | null {
    const elements = parent.getElementsByTagName(tagName);
    return elements.length > 0 ? elements[0] : null;
  }

  /**
   * 获取所有匹配的子元素
   * @param parent 父元素
   * @param tagName 标签名
   * @returns 元素数组
   */
  static getChildElements(parent: Element | Document, tagName: string): Element[] {
    const elements = parent.getElementsByTagName(tagName);
    return Array.from(elements);
  }
}

/**
 * 颜色处理工具类
 */
export class ColorUtils {
  /**
   * 将十六进制颜色转换为RGB
   * @param hex 十六进制颜色值（如 "FF0000"）
   * @returns RGB对象 {r, g, b}
   */
  static hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    // 移除可能的 # 前缀
    hex = hex.replace('#', '');
    
    // 确保是6位十六进制
    if (hex.length !== 6) {
      console.warn(`无效的十六进制颜色值: ${hex}`);
      return null;
    }

    const r = parseInt(hex.substring(0, 2), 16);
    const g = parseInt(hex.substring(2, 4), 16);
    const b = parseInt(hex.substring(4, 6), 16);

    if (isNaN(r) || isNaN(g) || isNaN(b)) {
      console.warn(`无法解析十六进制颜色值: ${hex}`);
      return null;
    }

    return { r, g, b };
  }

  /**
   * 将RGB转换为十六进制颜色
   * @param r 红色分量 (0-255)
   * @param g 绿色分量 (0-255)
   * @param b 蓝色分量 (0-255)
   * @returns 十六进制颜色值
   */
  static rgbToHex(r: number, g: number, b: number): string {
    const toHex = (n: number) => {
      const hex = Math.round(Math.max(0, Math.min(255, n))).toString(16);
      return hex.length === 1 ? '0' + hex : hex;
    };

    return `${toHex(r)}${toHex(g)}${toHex(b)}`.toUpperCase();
  }

  /**
   * 调整颜色亮度
   * @param hex 十六进制颜色值
   * @param percent 亮度调整百分比 (-100 到 100)
   * @returns 调整后的十六进制颜色值
   */
  static adjustBrightness(hex: string, percent: number): string {
    const rgb = this.hexToRgb(hex);
    if (!rgb) return hex;

    const factor = percent / 100;
    const adjust = (value: number) => {
      if (factor > 0) {
        // 变亮：向255靠近
        return value + (255 - value) * factor;
      } else {
        // 变暗：向0靠近
        return value * (1 + factor);
      }
    };

    const newR = adjust(rgb.r);
    const newG = adjust(rgb.g);
    const newB = adjust(rgb.b);

    return this.rgbToHex(newR, newG, newB);
  }

  /**
   * 验证颜色值是否有效
   * @param color 颜色值
   * @returns 是否有效
   */
  static isValidColor(color: string): boolean {
    if (!color) return false;
    
    // 检查十六进制颜色
    const hexPattern = /^#?[0-9A-Fa-f]{6}$/;
    if (hexPattern.test(color)) return true;

    // 检查RGB颜色
    const rgbPattern = /^rgb\(\s*\d+\s*,\s*\d+\s*,\s*\d+\s*\)$/;
    if (rgbPattern.test(color)) return true;

    // 检查颜色名称
    const colorNames = [
      'black', 'white', 'red', 'green', 'blue', 'yellow', 'cyan', 'magenta',
      'gray', 'grey', 'darkred', 'darkgreen', 'darkblue', 'darkyellow',
      'lightgray', 'lightgrey'
    ];
    
    return colorNames.includes(color.toLowerCase());
  }
}

/**
 * 数值处理工具类
 */
export class NumberUtils {
  /**
   * 将字符串转换为数字
   * @param value 字符串值
   * @param defaultValue 默认值
   * @returns 数字
   */
  static parseNumber(value: string | null | undefined, defaultValue: number = 0): number {
    if (!value) return defaultValue;
    
    const num = parseFloat(value);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 将字符串转换为整数
   * @param value 字符串值
   * @param defaultValue 默认值
   * @returns 整数
   */
  static parseInt(value: string | null | undefined, defaultValue: number = 0): number {
    if (!value) return defaultValue;
    
    const num = parseInt(value, 10);
    return isNaN(num) ? defaultValue : num;
  }

  /**
   * 将Twips转换为像素
   * Twips是Word中常用的单位，1 inch = 1440 twips
   * @param twips Twips值
   * @param dpi DPI值，默认96
   * @returns 像素值
   */
  static twipsToPixels(twips: number, dpi: number = 96): number {
    return (twips / 1440) * dpi;
  }

  /**
   * 将像素转换为Twips
   * @param pixels 像素值
   * @param dpi DPI值，默认96
   * @returns Twips值
   */
  static pixelsToTwips(pixels: number, dpi: number = 96): number {
    return (pixels / dpi) * 1440;
  }

  /**
   * 将点(pt)转换为像素
   * 1 point = 1/72 inch
   * @param points 点值
   * @param dpi DPI值，默认96
   * @returns 像素值
   */
  static pointsToPixels(points: number, dpi: number = 96): number {
    return (points / 72) * dpi;
  }

  /**
   * 将像素转换为点(pt)
   * @param pixels 像素值
   * @param dpi DPI值，默认96
   * @returns 点值
   */
  static pixelsToPoints(pixels: number, dpi: number = 96): number {
    return (pixels / dpi) * 72;
  }
}

/**
 * 字符串处理工具类
 */
export class StringUtils {
  /**
   * 检查字符串是否为空或只包含空白字符
   * @param str 字符串
   * @returns 是否为空
   */
  static isEmpty(str: string | null | undefined): boolean {
    return !str || str.trim().length === 0;
  }

  /**
   * 安全地获取字符串值
   * @param value 值
   * @param defaultValue 默认值
   * @returns 字符串
   */
  static safeString(value: any, defaultValue: string = ''): string {
    if (value === null || value === undefined) return defaultValue;
    return String(value);
  }

  /**
   * 首字母大写
   * @param str 字符串
   * @returns 首字母大写的字符串
   */
  static capitalize(str: string): string {
    if (!str) return str;
    return str.charAt(0).toUpperCase() + str.slice(1).toLowerCase();
  }

  /**
   * 驼峰命名转换
   * @param str 字符串
   * @returns 驼峰命名的字符串
   */
  static toCamelCase(str: string): string {
    return str.replace(/[-_\s]+(.)?/g, (_, char) => char ? char.toUpperCase() : '');
  }

  /**
   * 清理文本内容
   * 移除多余的空白字符，但保留必要的空格
   * @param text 文本
   * @returns 清理后的文本
   */
  static cleanText(text: string): string {
    if (!text) return '';
    
    return text
      .replace(/\r\n/g, '\n')  // 统一换行符
      .replace(/\r/g, '\n')    // 统一换行符
      .replace(/\t/g, ' ')     // 制表符转空格
      .replace(/\u00A0/g, ' ') // 不间断空格转普通空格
      .replace(/[ ]{2,}/g, ' ') // 多个空格合并为一个
      .trim();
  }

  /**
   * 转义HTML特殊字符
   * @param text 文本
   * @returns 转义后的文本
   */
  static escapeHtml(text: string): string {
    if (!text) return '';
    
    const htmlEscapes: Record<string, string> = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#x27;'
    };

    return text.replace(/[&<>"']/g, (match) => htmlEscapes[match]);
  }
}

/**
 * 对象处理工具类
 */
export class ObjectUtils {
  /**
   * 深度合并对象
   * @param target 目标对象
   * @param sources 源对象数组
   * @returns 合并后的对象
   */
  static deepMerge<T extends Record<string, any>>(target: T, ...sources: Partial<T>[]): T {
    if (!sources.length) return target;
    const source = sources.shift();

    if (this.isObject(target) && this.isObject(source)) {
      for (const key in source) {
        if (this.isObject(source[key])) {
          if (!target[key]) Object.assign(target, { [key]: {} });
          this.deepMerge(target[key] as any, source[key] as any);
        } else {
          Object.assign(target, { [key]: source[key] });
        }
      }
    }

    return this.deepMerge(target, ...sources);
  }

  /**
   * 检查是否为对象
   * @param item 项目
   * @returns 是否为对象
   */
  static isObject(item: any): boolean {
    return item && typeof item === 'object' && !Array.isArray(item);
  }

  /**
   * 深度克隆对象
   * @param obj 对象
   * @returns 克隆的对象
   */
  static deepClone<T>(obj: T): T {
    if (obj === null || typeof obj !== 'object') return obj;
    if (obj instanceof Date) return new Date(obj.getTime()) as any;
    if (obj instanceof Array) return obj.map(item => this.deepClone(item)) as any;
    if (typeof obj === 'object') {
      const clonedObj = {} as any;
      for (const key in obj) {
        if (obj.hasOwnProperty(key)) {
          clonedObj[key] = this.deepClone(obj[key]);
        }
      }
      return clonedObj;
    }
    return obj;
  }

  /**
   * 安全地获取嵌套属性值
   * @param obj 对象
   * @param path 属性路径，如 'a.b.c'
   * @param defaultValue 默认值
   * @returns 属性值
   */
  static safeGet(obj: any, path: string, defaultValue: any = undefined): any {
    const keys = path.split('.');
    let result = obj;

    for (const key of keys) {
      if (result === null || result === undefined || typeof result !== 'object') {
        return defaultValue;
      }
      result = result[key];
    }

    return result !== undefined ? result : defaultValue;
  }
}

/**
 * 调试工具类
 */
export class DebugUtils {
  private static debugMode = false;

  /**
   * 设置调试模式
   * @param enabled 是否启用
   */
  static setDebugMode(enabled: boolean): void {
    this.debugMode = enabled;
  }

  /**
   * 调试日志
   * @param message 消息
   * @param data 数据
   */
  static log(message: string, data?: any): void {
    if (this.debugMode) {
      if (data !== undefined) {
        console.log(`[DOCX Parser Debug] ${message}:`, data);
      } else {
        console.log(`[DOCX Parser Debug] ${message}`);
      }
    }
  }

  /**
   * 调试警告
   * @param message 消息
   * @param data 数据
   */
  static warn(message: string, data?: any): void {
    if (this.debugMode) {
      if (data !== undefined) {
        console.warn(`[DOCX Parser Warning] ${message}:`, data);
      } else {
        console.warn(`[DOCX Parser Warning] ${message}`);
      }
    }
  }

  /**
   * 调试错误
   * @param message 消息
   * @param error 错误对象
   */
  static error(message: string, error?: any): void {
    if (this.debugMode) {
      if (error !== undefined) {
        console.error(`[DOCX Parser Error] ${message}:`, error);
      } else {
        console.error(`[DOCX Parser Error] ${message}`);
      }
    }
  }

  /**
   * 性能计时开始
   * @param label 标签
   */
  static timeStart(label: string): void {
    if (this.debugMode) {
      console.time(`[DOCX Parser] ${label}`);
    }
  }

  /**
   * 性能计时结束
   * @param label 标签
   */
  static timeEnd(label: string): void {
    if (this.debugMode) {
      console.timeEnd(`[DOCX Parser] ${label}`);
    }
  }
}
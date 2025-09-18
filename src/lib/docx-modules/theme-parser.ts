// 主题色解析模块
// 这个模块专门负责解析Word文档中的主题颜色信息
// 就像一个调色师，负责理解和提取文档的色彩方案

import { DOMParser } from 'xmldom';
import { WordState } from './types';

export class ThemeParser {
  /**
   * 解析主题颜色名称并返回对应的颜色值
   * @param themeColorName 主题颜色名称
   * @param themeColors 主题颜色对象
   * @returns 颜色值
   */
  resolveThemeColor(themeColorName: string, themeColors: WordState['themeColors']): string {
    // 映射主题颜色名称到实际颜色
    const colorMap: Record<string, keyof WordState['themeColors']> = {
      'accent1': 'accent1',
      'accent2': 'accent2',
      'accent3': 'accent3',
      'accent4': 'accent4',
      'accent5': 'accent5',
      'accent6': 'accent6'
    };

    const colorKey = colorMap[themeColorName];
    if (colorKey && themeColors[colorKey]) {
      return themeColors[colorKey];
    }

    // 如果找不到对应的主题颜色，返回默认黑色
    return '#000000';
  }

  /**
   * 解析主题颜色XML文件
   * @param themeXml 主题XML内容
   * @returns 主题颜色对象
   */
  parseThemeColors(themeXml: string): WordState['themeColors'] {
    const defaultColors: WordState['themeColors'] = {
      accent1: '#4472C4',
      accent2: '#E7E6E6', 
      accent3: '#A5A5A5',
      accent4: '#FFC000',
      accent5: '#5B9BD5',
      accent6: '#70AD47'
    };

    if (!themeXml) {
      console.warn('主题XML为空，使用默认主题颜色');
      return defaultColors;
    }

    try {
      const parser = new DOMParser();
      const doc = parser.parseFromString(themeXml, 'text/xml');
      
      // 查找主题颜色定义
      const themeColors = this.extractThemeColorsFromXml(doc);
      
      // 如果提取失败，返回默认颜色
      if (Object.keys(themeColors).length === 0) {
        console.warn('未找到主题颜色定义，使用默认颜色');
        return defaultColors;
      }

      return { ...defaultColors, ...themeColors };
    } catch (error) {
      console.error('解析主题颜色时出错:', error);
      return defaultColors;
    }
  }

  /**
   * 从XML中提取主题颜色
   */
  private extractThemeColorsFromXml(doc: Document): Partial<WordState['themeColors']> {
    const colors: Partial<WordState['themeColors']> = {};

    try {
      // 查找颜色方案 (a:clrScheme)
      const colorSchemes = doc.getElementsByTagName('a:clrScheme');
      if (colorSchemes.length === 0) {
        console.warn('未找到颜色方案 (a:clrScheme)');
        return colors;
      }

      const colorScheme = colorSchemes[0];

      // 提取各种主题颜色
      const colorMappings = [
        { xmlName: 'a:accent1', propName: 'accent1' as keyof WordState['themeColors'] },
        { xmlName: 'a:accent2', propName: 'accent2' as keyof WordState['themeColors'] },
        { xmlName: 'a:accent3', propName: 'accent3' as keyof WordState['themeColors'] },
        { xmlName: 'a:accent4', propName: 'accent4' as keyof WordState['themeColors'] },
        { xmlName: 'a:accent5', propName: 'accent5' as keyof WordState['themeColors'] },
        { xmlName: 'a:accent6', propName: 'accent6' as keyof WordState['themeColors'] }
      ];

      for (const mapping of colorMappings) {
        const colorElement = colorScheme.getElementsByTagName(mapping.xmlName)[0];
        if (colorElement) {
          const hexColor = this.extractColorFromElement(colorElement);
          if (hexColor) {
            colors[mapping.propName] = hexColor;
          }
        }
      }

      // 也尝试提取主要颜色（深色1、浅色1等）
      this.extractPrimaryColors(colorScheme, colors);

    } catch (error) {
      console.error('提取主题颜色时出错:', error);
    }

    return colors;
  }

  /**
   * 从颜色元素中提取十六进制颜色值
   */
  private extractColorFromElement(colorElement: Element): string | null {
    try {
      // 查找 srgbClr (标准RGB颜色)
      const srgbClr = colorElement.getElementsByTagName('a:srgbClr')[0];
      if (srgbClr) {
        const val = srgbClr.getAttribute('val');
        if (val) {
          return '#' + val.toUpperCase();
        }
      }

      // 查找 sysClr (系统颜色)
      const sysClr = colorElement.getElementsByTagName('a:sysClr')[0];
      if (sysClr) {
        const lastClr = sysClr.getAttribute('lastClr');
        if (lastClr) {
          return '#' + lastClr.toUpperCase();
        }
        
        // 处理系统颜色名称
        const val = sysClr.getAttribute('val');
        if (val) {
          return this.convertSystemColorToHex(val);
        }
      }

      // 查找 schemeClr (方案颜色)
      const schemeClr = colorElement.getElementsByTagName('a:schemeClr')[0];
      if (schemeClr) {
        const val = schemeClr.getAttribute('val');
        if (val) {
          return this.convertSchemeColorToHex(val);
        }
      }

      // 查找 prstClr (预设颜色)
      const prstClr = colorElement.getElementsByTagName('a:prstClr')[0];
      if (prstClr) {
        const val = prstClr.getAttribute('val');
        if (val) {
          return this.convertPresetColorToHex(val);
        }
      }

    } catch (error) {
      console.error('提取颜色值时出错:', error);
    }

    return null;
  }

  /**
   * 提取主要颜色（深色1、浅色1等）
   */
  private extractPrimaryColors(colorScheme: Element, colors: Partial<WordState['themeColors']>): void {
    const primaryMappings = [
      { xmlName: 'a:dk1', fallbackAccent: 'accent1' as keyof WordState['themeColors'] },
      { xmlName: 'a:lt1', fallbackAccent: 'accent2' as keyof WordState['themeColors'] },
      { xmlName: 'a:dk2', fallbackAccent: 'accent3' as keyof WordState['themeColors'] },
      { xmlName: 'a:lt2', fallbackAccent: 'accent4' as keyof WordState['themeColors'] }
    ];

    for (const mapping of primaryMappings) {
      if (!colors[mapping.fallbackAccent]) {
        const colorElement = colorScheme.getElementsByTagName(mapping.xmlName)[0];
        if (colorElement) {
          const hexColor = this.extractColorFromElement(colorElement);
          if (hexColor) {
            colors[mapping.fallbackAccent] = hexColor;
          }
        }
      }
    }
  }

  /**
   * 将系统颜色名称转换为十六进制
   */
  private convertSystemColorToHex(systemColor: string): string {
    const systemColorMap: Record<string, string> = {
      'windowText': '#000000',
      'window': '#FFFFFF',
      'captionText': '#000000',
      'activeCaption': '#0078D4',
      'inactiveCaption': '#CCCCCC',
      'menu': '#F0F0F0',
      'menuText': '#000000',
      'highlight': '#0078D4',
      'highlightText': '#FFFFFF',
      'btnFace': '#F0F0F0',
      'btnText': '#000000',
      'btnHighlight': '#FFFFFF',
      'btnShadow': '#A0A0A0',
      'grayText': '#808080',
      'infoText': '#000000',
      'infoBk': '#FFFFE1'
    };

    return systemColorMap[systemColor] || '#000000';
  }

  /**
   * 将方案颜色名称转换为十六进制
   */
  private convertSchemeColorToHex(schemeColor: string): string {
    const schemeColorMap: Record<string, string> = {
      'dk1': '#000000',      // 深色1
      'lt1': '#FFFFFF',      // 浅色1
      'dk2': '#44546A',      // 深色2
      'lt2': '#E7E6E6',      // 浅色2
      'accent1': '#4472C4',  // 强调色1
      'accent2': '#E7E6E6',  // 强调色2
      'accent3': '#A5A5A5',  // 强调色3
      'accent4': '#FFC000',  // 强调色4
      'accent5': '#5B9BD5',  // 强调色5
      'accent6': '#70AD47',  // 强调色6
      'hlink': '#0563C1',    // 超链接
      'folHlink': '#954F72'  // 已访问的超链接
    };

    return schemeColorMap[schemeColor] || '#000000';
  }

  /**
   * 将预设颜色名称转换为十六进制
   */
  private convertPresetColorToHex(presetColor: string): string {
    const presetColorMap: Record<string, string> = {
      'aliceBlue': '#F0F8FF',
      'antiqueWhite': '#FAEBD7',
      'aqua': '#00FFFF',
      'aquamarine': '#7FFFD4',
      'azure': '#F0FFFF',
      'beige': '#F5F5DC',
      'bisque': '#FFE4C4',
      'black': '#000000',
      'blanchedAlmond': '#FFEBCD',
      'blue': '#0000FF',
      'blueViolet': '#8A2BE2',
      'brown': '#A52A2A',
      'burlyWood': '#DEB887',
      'cadetBlue': '#5F9EA0',
      'chartreuse': '#7FFF00',
      'chocolate': '#D2691E',
      'coral': '#FF7F50',
      'cornflowerBlue': '#6495ED',
      'cornsilk': '#FFF8DC',
      'crimson': '#DC143C',
      'cyan': '#00FFFF',
      'darkBlue': '#00008B',
      'darkCyan': '#008B8B',
      'darkGoldenrod': '#B8860B',
      'darkGray': '#A9A9A9',
      'darkGreen': '#006400',
      'darkKhaki': '#BDB76B',
      'darkMagenta': '#8B008B',
      'darkOliveGreen': '#556B2F',
      'darkOrange': '#FF8C00',
      'darkOrchid': '#9932CC',
      'darkRed': '#8B0000',
      'darkSalmon': '#E9967A',
      'darkSeaGreen': '#8FBC8F',
      'darkSlateBlue': '#483D8B',
      'darkSlateGray': '#2F4F4F',
      'darkTurquoise': '#00CED1',
      'darkViolet': '#9400D3',
      'deepPink': '#FF1493',
      'deepSkyBlue': '#00BFFF',
      'dimGray': '#696969',
      'dodgerBlue': '#1E90FF',
      'firebrick': '#B22222',
      'floralWhite': '#FFFAF0',
      'forestGreen': '#228B22',
      'fuchsia': '#FF00FF',
      'gainsboro': '#DCDCDC',
      'ghostWhite': '#F8F8FF',
      'gold': '#FFD700',
      'goldenrod': '#DAA520',
      'gray': '#808080',
      'green': '#008000',
      'greenYellow': '#ADFF2F',
      'honeydew': '#F0FFF0',
      'hotPink': '#FF69B4',
      'indianRed': '#CD5C5C',
      'indigo': '#4B0082',
      'ivory': '#FFFFF0',
      'khaki': '#F0E68C',
      'lavender': '#E6E6FA',
      'lavenderBlush': '#FFF0F5',
      'lawnGreen': '#7CFC00',
      'lemonChiffon': '#FFFACD',
      'lightBlue': '#ADD8E6',
      'lightCoral': '#F08080',
      'lightCyan': '#E0FFFF',
      'lightGoldenrodYellow': '#FAFAD2',
      'lightGray': '#D3D3D3',
      'lightGreen': '#90EE90',
      'lightPink': '#FFB6C1',
      'lightSalmon': '#FFA07A',
      'lightSeaGreen': '#20B2AA',
      'lightSkyBlue': '#87CEFA',
      'lightSlateGray': '#778899',
      'lightSteelBlue': '#B0C4DE',
      'lightYellow': '#FFFFE0',
      'lime': '#00FF00',
      'limeGreen': '#32CD32',
      'linen': '#FAF0E6',
      'magenta': '#FF00FF',
      'maroon': '#800000',
      'mediumAquamarine': '#66CDAA',
      'mediumBlue': '#0000CD',
      'mediumOrchid': '#BA55D3',
      'mediumPurple': '#9370DB',
      'mediumSeaGreen': '#3CB371',
      'mediumSlateBlue': '#7B68EE',
      'mediumSpringGreen': '#00FA9A',
      'mediumTurquoise': '#48D1CC',
      'mediumVioletRed': '#C71585',
      'midnightBlue': '#191970',
      'mintCream': '#F5FFFA',
      'mistyRose': '#FFE4E1',
      'moccasin': '#FFE4B5',
      'navajoWhite': '#FFDEAD',
      'navy': '#000080',
      'oldLace': '#FDF5E6',
      'olive': '#808000',
      'oliveDrab': '#6B8E23',
      'orange': '#FFA500',
      'orangeRed': '#FF4500',
      'orchid': '#DA70D6',
      'paleGoldenrod': '#EEE8AA',
      'paleGreen': '#98FB98',
      'paleTurquoise': '#AFEEEE',
      'paleVioletRed': '#DB7093',
      'papayaWhip': '#FFEFD5',
      'peachPuff': '#FFDAB9',
      'peru': '#CD853F',
      'pink': '#FFC0CB',
      'plum': '#DDA0DD',
      'powderBlue': '#B0E0E6',
      'purple': '#800080',
      'red': '#FF0000',
      'rosyBrown': '#BC8F8F',
      'royalBlue': '#4169E1',
      'saddleBrown': '#8B4513',
      'salmon': '#FA8072',
      'sandyBrown': '#F4A460',
      'seaGreen': '#2E8B57',
      'seaShell': '#FFF5EE',
      'sienna': '#A0522D',
      'silver': '#C0C0C0',
      'skyBlue': '#87CEEB',
      'slateBlue': '#6A5ACD',
      'slateGray': '#708090',
      'snow': '#FFFAFA',
      'springGreen': '#00FF7F',
      'steelBlue': '#4682B4',
      'tan': '#D2B48C',
      'teal': '#008080',
      'thistle': '#D8BFD8',
      'tomato': '#FF6347',
      'turquoise': '#40E0D0',
      'violet': '#EE82EE',
      'wheat': '#F5DEB3',
      'white': '#FFFFFF',
      'whiteSmoke': '#F5F5F5',
      'yellow': '#FFFF00',
      'yellowGreen': '#9ACD32'
    };

    return presetColorMap[presetColor] || '#000000';
  }

  /**
   * 根据主题颜色名称获取颜色值
   * @param themeName 主题颜色名称
   * @param themeColors 主题颜色对象
   * @returns 十六进制颜色值
   */
  getThemeColor(themeName: string, themeColors: WordState['themeColors']): string {
    const colorMap: Record<string, keyof WordState['themeColors']> = {
      'accent1': 'accent1',
      'accent2': 'accent2', 
      'accent3': 'accent3',
      'accent4': 'accent4',
      'accent5': 'accent5',
      'accent6': 'accent6'
    };

    const colorKey = colorMap[themeName];
    if (colorKey && themeColors[colorKey]) {
      return themeColors[colorKey];
    }

    // 如果找不到对应的主题颜色，返回默认黑色
    return '#000000';
  }

  /**
   * 应用颜色变换（如变亮、变暗等）
   * @param baseColor 基础颜色
   * @param transforms 变换参数
   * @returns 变换后的颜色
   */
  applyColorTransforms(baseColor: string, transforms: any[]): string {
    let color = baseColor;

    for (const transform of transforms) {
      if (transform.tagName === 'a:lumMod') {
        // 亮度调制
        const val = parseInt(transform.getAttribute('val') || '100000');
        color = this.adjustLuminance(color, val / 100000);
      } else if (transform.tagName === 'a:lumOff') {
        // 亮度偏移
        const val = parseInt(transform.getAttribute('val') || '0');
        color = this.adjustLuminanceOffset(color, val / 100000);
      } else if (transform.tagName === 'a:tint') {
        // 色调
        const val = parseInt(transform.getAttribute('val') || '0');
        color = this.applyTint(color, val / 100000);
      } else if (transform.tagName === 'a:shade') {
        // 阴影
        const val = parseInt(transform.getAttribute('val') || '0');
        color = this.applyShade(color, val / 100000);
      }
    }

    return color;
  }

  /**
   * 调整亮度
   */
  private adjustLuminance(color: string, factor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjustedRgb = {
      r: Math.round(rgb.r * factor),
      g: Math.round(rgb.g * factor),
      b: Math.round(rgb.b * factor)
    };

    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }

  /**
   * 调整亮度偏移
   */
  private adjustLuminanceOffset(color: string, offset: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjustedRgb = {
      r: Math.min(255, Math.max(0, Math.round(rgb.r + offset * 255))),
      g: Math.min(255, Math.max(0, Math.round(rgb.g + offset * 255))),
      b: Math.min(255, Math.max(0, Math.round(rgb.b + offset * 255)))
    };

    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }

  /**
   * 应用色调
   */
  private applyTint(color: string, tintFactor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjustedRgb = {
      r: Math.round(rgb.r + (255 - rgb.r) * tintFactor),
      g: Math.round(rgb.g + (255 - rgb.g) * tintFactor),
      b: Math.round(rgb.b + (255 - rgb.b) * tintFactor)
    };

    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }

  /**
   * 应用阴影
   */
  private applyShade(color: string, shadeFactor: number): string {
    const rgb = this.hexToRgb(color);
    if (!rgb) return color;

    const adjustedRgb = {
      r: Math.round(rgb.r * (1 - shadeFactor)),
      g: Math.round(rgb.g * (1 - shadeFactor)),
      b: Math.round(rgb.b * (1 - shadeFactor))
    };

    return this.rgbToHex(adjustedRgb.r, adjustedRgb.g, adjustedRgb.b);
  }

  /**
   * 十六进制转RGB
   */
  private hexToRgb(hex: string): { r: number; g: number; b: number } | null {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? {
      r: parseInt(result[1], 16),
      g: parseInt(result[2], 16),
      b: parseInt(result[3], 16)
    } : null;
  }

  /**
   * RGB转十六进制
   */
  private rgbToHex(r: number, g: number, b: number): string {
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1).toUpperCase();
  }
}
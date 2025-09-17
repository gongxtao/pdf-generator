'use client'

import { useState, useCallback, useRef } from 'react'
import JSZip from 'jszip'
import Toast from '@/components/Toast'
import LoadingSpinner from '@/components/LoadingSpinner'

// 定义接口类型
interface ParseResult {
  html: string
  css: string
  images: Array<{ name: string; data: string }>
  template?: {
    css: string
    parameters: Record<string, any>
    structure: any
    usage: string
  }
}

interface ParsedDocument {
  html: string
  css: string
  images: Array<{ name: string; data: string }>
  template?: {
    css: string
    parameters: Record<string, any>
    structure: any
    usage: string
  }
  metadata?: {
    title: string
    wordCount: number
    pageCount: number
  }
}

// CSS模板提取器类
class CSSTemplateExtractor {
  private extractedStyles = new Map()
  private stylePatterns = new Map()
  private templateParameters = new Map()

  // 主要方法：从HTML提取可复用的CSS模板
  async extractTemplate(htmlContent: string) {
    // 1. 解析HTML，分析所有元素的样式
    const styleAnalysis = this.analyzeElementStyles(htmlContent)
    
    // 2. 识别样式模式和重复规律
    const patterns = this.identifyStylePatterns(styleAnalysis)
    
    // 3. 提取可参数化的属性
    const parameters = this.extractParameterizable(patterns)
    
    // 4. 生成模板CSS
    const template = this.generateTemplate(patterns, parameters)
    
    return {
      template: template,
      parameters: parameters,
      metadata: {
        extractedAt: new Date(),
        sourceElements: styleAnalysis.length,
        patterns: patterns.size,
        parameters: parameters.size
      }
    }
  }

  // 分析HTML中所有元素的样式
  private analyzeElementStyles(htmlContent: string) {
    // 在浏览器环境中才能解析DOM
    if (typeof window === 'undefined' || typeof DOMParser === 'undefined') {
      return [] // 服务端渲染时返回空数组
    }
    
    const parser = new DOMParser()
    const doc = parser.parseFromString(htmlContent, 'text/html')
    const analysis: any[] = []

    // 遍历所有有意义的元素
    const elements = doc.querySelectorAll('h1, h2, h3, h4, h5, h6, p, span, div, table, th, td, blockquote, ul, ol, li')
    
    elements.forEach((element, index) => {
      const computedStyle = this.getElementComputedStyle(element)
      const semanticInfo = this.getSemanticInfo(element)
      
      analysis.push({
        id: `element_${index}`,
        tagName: element.tagName.toLowerCase(),
        className: element.className,
        textContent: element.textContent?.substring(0, 50) || '', // 前50字符用于模式识别
        styles: computedStyle,
        semantic: semanticInfo,
        hierarchy: this.getElementHierarchy(element)
      })
    })

    return analysis
  }

  // 获取元素的计算样式（关键样式属性）
  private getElementComputedStyle(element: Element) {
    // 在浏览器环境中才能获取计算样式
    if (typeof window === 'undefined') {
      return {} // 服务端渲染时返回空对象
    }
    
    const style = window.getComputedStyle ? window.getComputedStyle(element) : (element as any).currentStyle
    
    // 安全检查：确保style对象存在
    if (!style) {
      return {}
    }
    
    return {
      // 字体相关
      fontFamily: style.fontFamily || '',
      fontSize: style.fontSize || '',
      fontWeight: style.fontWeight || '',
      fontStyle: style.fontStyle || '',
      color: style.color || '',
      
      // 间距相关
      marginTop: style.marginTop || '',
      marginRight: style.marginRight || '', 
      marginBottom: style.marginBottom || '',
      marginLeft: style.marginLeft || '',
      paddingTop: style.paddingTop || '',
      paddingRight: style.paddingRight || '',
      paddingBottom: style.paddingBottom || '',
      paddingLeft: style.paddingLeft || '',
      
      // 布局相关
      textAlign: style.textAlign || '',
      lineHeight: style.lineHeight || '',
      textIndent: style.textIndent || '',
      
      // 背景和边框
      backgroundColor: style.backgroundColor || '',
      borderTop: style.borderTop || '',
      borderRight: style.borderRight || '',
      borderBottom: style.borderBottom || '',
      borderLeft: style.borderLeft || '',
      borderRadius: style.borderRadius || '',
      
      // 显示和定位
      display: style.display || '',
      position: style.position || '',
      width: style.width || '',
      height: style.height || ''
    }
  }

  // 获取语义信息
  private getSemanticInfo(element: Element) {
    return {
      isHeading: /^h[1-6]$/i.test(element.tagName),
      headingLevel: element.tagName.match(/^h([1-6])$/i)?.[1] || null,
      isParagraph: element.tagName.toLowerCase() === 'p',
      isTable: ['table', 'th', 'td'].includes(element.tagName.toLowerCase()),
      isList: ['ul', 'ol', 'li'].includes(element.tagName.toLowerCase()),
      isEmphasis: ['strong', 'em', 'b', 'i'].includes(element.tagName.toLowerCase()),
      hasContent: element.textContent?.trim().length || 0 > 0
    }
  }

  // 识别样式模式
  private identifyStylePatterns(styleAnalysis: any[]) {
    const patterns = new Map()

    // 按语义类型分组
    const groupedByType = this.groupBySemanticType(styleAnalysis)
    
    // 为每种类型识别模式
    for (const [type, elements] of groupedByType) {
      const typePatterns = this.identifyTypePatterns(type, elements)
      patterns.set(type, typePatterns)
    }

    return patterns
  }

  // 按语义类型分组
  private groupBySemanticType(analysis: any[]) {
    const groups = new Map()
    
    analysis.forEach(element => {
      let type = 'paragraph' // 默认类型
      
      if (element.semantic.isHeading) {
        type = `heading-${element.semantic.headingLevel}`
      } else if (element.semantic.isTable) {
        type = `table-${element.tagName}`
      } else if (element.semantic.isList) {
        type = `list-${element.tagName}`
      } else if (element.tagName === 'blockquote') {
        type = 'blockquote'
      }
      
      if (!groups.has(type)) {
        groups.set(type, [])
      }
      groups.get(type).push(element)
    })

    return groups
  }

  // 识别特定类型的样式模式
  private identifyTypePatterns(type: string, elements: any[]) {
    if (elements.length === 0) return {}

    // 统计各样式属性的分布
    const styleFrequency: Record<string, Record<string, number>> = {}
    const styleVariations: Record<string, Set<string>> = {}

    // 关键样式属性
    const keyProperties = [
      'fontFamily', 'fontSize', 'fontWeight', 'color',
      'marginTop', 'marginBottom', 'textAlign', 'lineHeight'
    ]

    keyProperties.forEach(prop => {
      styleFrequency[prop] = {}
      styleVariations[prop] = new Set()
      
      elements.forEach(element => {
        const value = element.styles[prop]
        if (value && value !== 'auto' && value !== 'normal') {
          styleFrequency[prop][value] = (styleFrequency[prop][value] || 0) + 1
          styleVariations[prop].add(value)
        }
      })
    })

    // 识别主导样式（出现频率最高的）
    const dominantStyles: Record<string, string> = {}
    const variableStyles: Record<string, any> = {}

    keyProperties.forEach(prop => {
      const frequencies = styleFrequency[prop]
      const variations = styleVariations[prop]
      
      // 安全检查：确保有数据才处理
      if (!variations || variations.size === 0) {
        return // 跳过没有数据的属性
      }
      
      if (variations.size === 1) {
        // 只有一种值，设为固定样式
        dominantStyles[prop] = Array.from(variations)[0]
      } else if (variations.size <= 3) {
        // 少量变化，可以参数化
        const sortedByFreq = Object.entries(frequencies)
          .sort(([,a], [,b]) => b - a)
        
        // 安全检查：确保排序后的数组不为空
        if (sortedByFreq.length > 0) {
          dominantStyles[prop] = sortedByFreq[0][0] // 最常见的作为默认值
          variableStyles[prop] = {
            default: sortedByFreq[0][0],
            variations: Array.from(variations),
            frequencies: frequencies
          }
        }
      }
      // 变化太多的属性暂时不处理
    })

    return {
      type: type,
      elementCount: elements.length,
      dominantStyles: dominantStyles,
      variableStyles: variableStyles,
      examples: elements.slice(0, 3) // 保留几个例子
    }
  }

  // 提取可参数化的属性
  private extractParameterizable(patterns: Map<string, any>) {
    const parameters = new Map()
    
    for (const [type, pattern] of patterns) {
      const typeParams: Record<string, any> = {}
      
      // 从可变样式中提取参数
      for (const [prop, variation] of Object.entries(pattern.variableStyles || {})) {
        const paramName = `${type}-${prop.replace(/([A-Z])/g, '-$1').toLowerCase()}`
        
        typeParams[paramName] = {
          property: prop,
          defaultValue: (variation as any).default,
          possibleValues: (variation as any).variations,
          description: this.generateParameterDescription(type, prop, variation as any)
        }
      }
      
      // 添加一些通用的可参数化属性
      typeParams[`${type}-primary-color`] = {
        property: 'color',
        defaultValue: pattern.dominantStyles.color || '#333333',
        cssVariable: `--${type}-color`,
        description: `${type}的主要文字颜色`
      }
      
      if (type.startsWith('heading')) {
        typeParams[`${type}-accent-color`] = {
          property: 'backgroundColor',
          defaultValue: 'transparent',
          cssVariable: `--${type}-bg-color`,
          description: `${type}的背景/强调色`
        }
      }
      
      parameters.set(type, typeParams)
    }
    
    return parameters
  }

  // 生成参数描述
  private generateParameterDescription(type: string, property: string, variation: any) {
    const propDescriptions: Record<string, string> = {
      fontFamily: '字体系列',
      fontSize: '字体大小',
      fontWeight: '字体粗细',
      color: '文字颜色',
      marginTop: '上边距',
      marginBottom: '下边距',
      textAlign: '文本对齐',
      lineHeight: '行高'
    }
    
    return `${type}的${propDescriptions[property] || property}（默认: ${variation.default}）`
  }

  // 生成CSS模板
  private generateTemplate(patterns: Map<string, any>, parameters: Map<string, any>) {
    let css = this.generateCSSVariables(parameters)
    css += this.generateBaseStyles()
    css += this.generatePatternStyles(patterns, parameters)
    
    return {
      css: css,
      structure: this.generateTemplateStructure(patterns),
      usage: this.generateUsageGuide(parameters)
    }
  }

  // 生成CSS变量定义
  private generateCSSVariables(parameters: Map<string, any>) {
    let variables = ':root {\n'
    
    for (const [type, typeParams] of parameters) {
      for (const [paramName, paramConfig] of Object.entries(typeParams)) {
        const cssVarName = (paramConfig as any).cssVariable || `--${paramName}`
        variables += `  ${cssVarName}: ${(paramConfig as any).defaultValue};\n`
      }
      variables += '\n'
    }
    
    variables += '}\n\n'
    return variables
  }

  // 生成基础样式
  private generateBaseStyles() {
    return `
/* 文档基础样式 */
.word-template-container {
  max-width: 210mm; /* A4宽度 */
  margin: 0 auto;
  padding: 25mm 20mm; /* A4边距 */
  background: white;
  font-family: var(--primary-font, 'Times New Roman', serif);
  font-size: var(--base-font-size, 12pt);
  line-height: var(--base-line-height, 1.5);
  color: var(--text-color, #333333);
}

/* 重置样式，确保一致性 */
.word-template-container * {
  margin: 0;
  padding: 0;
  box-sizing: border-box;
}

`
  }

  // 根据模式生成样式规则
  private generatePatternStyles(patterns: Map<string, any>, parameters: Map<string, any>) {
    let css = ''
    
    for (const [type, pattern] of patterns) {
      css += `/* ${type.toUpperCase()} 样式 */\n`
      css += this.generateTypeStyles(type, pattern, parameters.get(type) || {})
      css += '\n'
    }
    
    return css
  }

  // 为特定类型生成CSS规则
  private generateTypeStyles(type: string, pattern: any, typeParams: Record<string, any>) {
    const selector = this.generateSelector(type)
    let css = `${selector} {\n`
    
    // 添加主导样式
    for (const [prop, value] of Object.entries(pattern.dominantStyles)) {
      const cssProperty = this.camelToKebabCase(prop)
      
      // 检查是否有对应的参数变量
      const paramKey = Object.keys(typeParams).find(key => 
        typeParams[key].property === prop
      )
      
      if (paramKey && typeParams[paramKey].cssVariable) {
        css += `  ${cssProperty}: var(${typeParams[paramKey].cssVariable}, ${value});\n`
      } else {
        css += `  ${cssProperty}: ${value};\n`
      }
    }
    
    // 添加类型特定的样式规则
    css += this.addTypeSpecificRules(type, pattern)
    
    css += '}\n'
    
    return css
  }

  // 生成CSS选择器
  private generateSelector(type: string) {
    const selectorMap: Record<string, string> = {
      'heading-1': '.word-template-container h1, .template-h1',
      'heading-2': '.word-template-container h2, .template-h2',
      'heading-3': '.word-template-container h3, .template-h3',
      'heading-4': '.word-template-container h4, .template-h4',
      'heading-5': '.word-template-container h5, .template-h5',
      'heading-6': '.word-template-container h6, .template-h6',
      'paragraph': '.word-template-container p, .template-p',
      'table-table': '.word-template-container table, .template-table',
      'table-th': '.word-template-container th, .template-th',
      'table-td': '.word-template-container td, .template-td',
      'blockquote': '.word-template-container blockquote, .template-blockquote',
      'list-ul': '.word-template-container ul, .template-ul',
      'list-ol': '.word-template-container ol, .template-ol',
      'list-li': '.word-template-container li, .template-li'
    }
    
    return selectorMap[type] || `.template-${type}`
  }

  // 添加类型特定的规则
  private addTypeSpecificRules(type: string, pattern: any) {
    let rules = ''
    
    if (type.startsWith('heading')) {
      rules += `  font-weight: var(--${type}-font-weight, bold);\n`
      rules += `  margin-top: var(--${type}-margin-top, 1.2em);\n`
      rules += `  margin-bottom: var(--${type}-margin-bottom, 0.6em);\n`
      
      // 为标题添加装饰效果的钩子
      if (type === 'heading-1') {
        rules += `  position: relative;\n`
        rules += `  border-bottom: var(--h1-border-bottom, none);\n`
      }
    } else if (type === 'paragraph') {
      rules += `  margin-bottom: var(--paragraph-margin-bottom, 1em);\n`
      rules += `  text-indent: var(--paragraph-indent, 0);\n`
    } else if (type.startsWith('table')) {
      if (type === 'table-table') {
        rules += `  border-collapse: collapse;\n`
        rules += `  width: 100%;\n`
        rules += `  margin-bottom: var(--table-margin-bottom, 1em);\n`
      } else if (type === 'table-th' || type === 'table-td') {
        rules += `  border: var(--table-border, 1px solid #ccc);\n`
        rules += `  padding: var(--table-cell-padding, 8px);\n`
      }
    }
    
    return rules
  }

  // 生成模板结构说明
  private generateTemplateStructure(patterns: Map<string, any>) {
    const structure: Record<string, any> = {
      description: '此模板基于文档分析自动生成',
      elements: {},
      usage: '使用 .word-template-container 包装您的内容'
    }
    
    for (const [type, pattern] of patterns) {
      structure.elements[type] = {
        selector: this.generateSelector(type).split(',')[0].trim(),
        elementCount: pattern.elementCount,
        hasVariations: Object.keys(pattern.variableStyles || {}).length > 0,
        description: this.getTypeDescription(type)
      }
    }
    
    return structure
  }

  // 生成使用指南
  private generateUsageGuide(parameters: Map<string, any>) {
    let guide = '# CSS模板使用指南\n\n'
    guide += '## 参数说明\n\n'
    
    for (const [type, typeParams] of parameters) {
      guide += `### ${type.toUpperCase()}\n`
      for (const [paramName, paramConfig] of Object.entries(typeParams)) {
        guide += `- **${paramName}**: ${(paramConfig as any).description}\n`
        guide += `  - 默认值: \`${(paramConfig as any).defaultValue}\`\n`
        if ((paramConfig as any).possibleValues) {
          guide += `  - 可选值: ${(paramConfig as any).possibleValues.join(', ')}\n`
        }
      }
      guide += '\n'
    }
    
    return guide
  }

  // 工具方法
  private camelToKebabCase(str: string) {
    return str.replace(/([a-z0-9]|(?=[A-Z]))([A-Z])/g, '$1-$2').toLowerCase()
  }

  private getTypeDescription(type: string) {
    const descriptions: Record<string, string> = {
      'heading-1': '一级标题样式',
      'heading-2': '二级标题样式', 
      'heading-3': '三级标题样式',
      'heading-4': '四级标题样式',
      'heading-5': '五级标题样式',
      'heading-6': '六级标题样式',
      'paragraph': '段落文本样式',
      'table-table': '表格容器样式',
      'table-th': '表格标题单元格样式',
      'table-td': '表格数据单元格样式',
      'blockquote': '引用块样式',
      'list-ul': '无序列表样式',
      'list-ol': '有序列表样式',
      'list-li': '列表项样式'
    }
    return descriptions[type] || `${type}样式`
  }

  private getElementHierarchy(element: Element) {
    const path = []
    let current = element
    while (current && current.tagName) {
      path.unshift(current.tagName.toLowerCase())
      current = current.parentElement
    }
    return path.join(' > ')
  }
}

export default function WordToCSSV2Page() {
  const [file, setFile] = useState<File | null>(null)
  const [isUploading, setIsUploading] = useState(false)
  const [parsedDocument, setParsedDocument] = useState<ParsedDocument | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [parseTime, setParseTime] = useState<number>(0)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [activeTab, setActiveTab] = useState<'html' | 'css' | 'template' | 'preview'>('preview')
  const [templateParameters, setTemplateParameters] = useState<Record<string, string>>({})
  const fileInputRef = useRef<HTMLInputElement>(null)

  // 文件上传处理
  const handleFileUpload = useCallback(async (uploadedFile: File) => {
    // 重置状态
    setFile(uploadedFile)
    setError(null)
    setIsUploading(true)
    setUploadProgress(0)
    setParsedDocument(null)
    
    const startTime = Date.now()

    try {
      // 客户端基础验证
      if (uploadedFile.size > 10 * 1024 * 1024) {
        throw new Error(`文件大小不能超过10MB，当前文件大小: ${Math.round(uploadedFile.size / 1024 / 1024 * 100) / 100}MB`)
      }
      
      if (uploadedFile.size === 0) {
        throw new Error('文件内容为空，请检查文件是否损坏')
      }

      // 文件类型检查
      const allowedTypes = ['.docx', '.doc']
      const isValidType = allowedTypes.some(type => 
        uploadedFile.name.toLowerCase().endsWith(type)
      )
      
      if (!isValidType) {
        throw new Error('不支持的文件格式，请上传 Word 文档 (.doc 或 .docx)')
      }

      setUploadProgress(25)
      setToast({ message: '正在上传文件...', type: 'success' })

      const formData = new FormData()
      formData.append('file', uploadedFile)

      setUploadProgress(50)
      setToast({ message: '正在解析文档结构...', type: 'success' })

      const response = await fetch('/api/parse', {
        method: 'POST',
        body: formData,
      })

      setUploadProgress(75)
      setToast({ message: '正在生成预览和模板...', type: 'success' })

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ message: '服务器响应错误' }))
        throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`)
      }

      const result = await response.json()
      
      if (!result.success) {
        throw new Error(result.error || result.message || '解析失败')
      }

      // 验证解析结果的完整性
      if (!result.data.html) {
        throw new Error('解析结果不完整，请重试')
      }

      setUploadProgress(90)
      setToast({ message: '正在提取CSS模板...', type: 'success' })

      // 使用CSS模板提取器
      const extractor = new CSSTemplateExtractor()
      const templateResult = await extractor.extractTemplate(result.data.html)

      setUploadProgress(100)

      // 设置解析结果
      const parsedResult: ParsedDocument = {
        html: result.data.html,
        css: result.data.css,
        images: result.data.images || [],
        template: templateResult.template,
        metadata: result.data.metadata || {
          title: uploadedFile.name,
          wordCount: 0,
          pageCount: 1
        }
      }
      
      setParsedDocument(parsedResult)
      setParseTime((Date.now() - startTime) / 1000)
      
      setToast({ message: `文档解析成功！已提取CSS模板，包含 ${templateResult.parameters.size} 个参数组`, type: 'success' })
      
      // 3秒后清除成功消息
      setTimeout(() => setToast(null), 3000)
    } catch (err) {
      console.error('文件处理失败:', err)
      const errorMessage = err instanceof Error ? err.message : '未知错误'
      setError(errorMessage)
      setToast({ message: `解析失败: ${errorMessage}`, type: 'error' })
      setUploadProgress(0)
    } finally {
      setIsUploading(false)
    }
  }, [])

  // 处理文件拖拽
  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    const files = Array.from(e.dataTransfer.files)
    if (files.length > 0) {
      handleFileUpload(files[0])
    }
  }, [handleFileUpload])

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault()
  }, [])

  // 复制到剪贴板
  const handleCopyToClipboard = useCallback(async (content: string, type: string) => {
    try {
      await navigator.clipboard.writeText(content)
      setToast({ message: `${type} 已复制到剪贴板`, type: 'success' })
      setTimeout(() => setToast(null), 2000)
    } catch (err) {
      setToast({ message: '复制失败，请手动选择复制', type: 'error' })
      setTimeout(() => setToast(null), 2000)
    }
  }, [])

  // 下载文件
  const handleDownload = useCallback((content: string, filename: string, type: string) => {
    const blob = new Blob([content], { type })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    
    setToast({ message: `${filename} 下载成功`, type: 'success' })
    setTimeout(() => setToast(null), 2000)
  }, [])

  // 应用模板参数
  const applyTemplateParameters = useCallback(() => {
    if (!parsedDocument?.template) return parsedDocument?.css || ''
    
    let customCSS = parsedDocument.template.css
    
    // 替换自定义参数
    for (const [paramName, value] of Object.entries(templateParameters)) {
      const variable = `--${paramName}`
      const regex = new RegExp(`(${variable}\\s*:\\s*)[^;]+`, 'g')
      customCSS = customCSS.replace(regex, `$1${value}`)
    }
    
    return customCSS
  }, [parsedDocument, templateParameters])

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-4">
            Word → CSS 模板提取器 V2
          </h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            上传Word文档，不仅转换为HTML/CSS，还能自动提取可复用的CSS模板，支持参数化定制
          </p>
        </div>

        {/* 文件上传区域 */}
        {!parsedDocument && (
          <div className="max-w-2xl mx-auto mb-8">
            <div
              className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center hover:border-blue-400 transition-colors duration-200"
              onDrop={handleDrop}
              onDragOver={handleDragOver}
            >
              <div className="mb-4">
                <svg className="mx-auto h-12 w-12 text-gray-400" stroke="currentColor" fill="none" viewBox="0 0 48 48">
                  <path d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <p className="text-xl text-gray-600 mb-2">
                拖拽Word文档到此处，或点击选择文件
              </p>
              <p className="text-sm text-gray-500 mb-4">
                支持 .doc 和 .docx 格式，最大 10MB
              </p>
              <input
                ref={fileInputRef}
                type="file"
                accept=".doc,.docx"
                onChange={(e) => {
                  const file = e.target.files?.[0]
                  if (file) handleFileUpload(file)
                }}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                disabled={isUploading}
                className="bg-blue-500 hover:bg-blue-600 text-white px-6 py-2 rounded-lg transition-colors duration-200 disabled:opacity-50"
              >
                {isUploading ? '处理中...' : '选择文件'}
              </button>
            </div>

            {/* 上传进度 */}
            {isUploading && (
              <div className="mt-4">
                <div className="bg-gray-200 rounded-full h-2">
                  <div
                    className="bg-blue-500 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress}%` }}
                  />
                </div>
                <p className="text-sm text-gray-600 mt-2 text-center">
                  处理进度: {uploadProgress}%
                </p>
              </div>
            )}

            {/* 加载动画 */}
            {isUploading && (
              <div className="flex justify-center mt-4">
                <LoadingSpinner />
              </div>
            )}
          </div>
        )}

        {/* 错误信息 */}
        {error && (
          <div className="max-w-2xl mx-auto mb-8">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">处理失败</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={() => {
                        setError(null)
                        setFile(null)
                      }}
                      className="bg-red-100 hover:bg-red-200 text-red-800 px-3 py-1 rounded text-sm transition-colors duration-200"
                    >
                      重新上传
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* 解析结果展示 */}
        {parsedDocument && (
          <div className="max-w-7xl mx-auto">
            {/* 统计信息 */}
            <div className="bg-white rounded-lg shadow-md p-6 mb-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.round(parsedDocument.html.length / 1024)}KB
                  </div>
                  <div className="text-sm text-gray-600">HTML 大小</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-600">
                    {Math.round(parsedDocument.css.length / 1024)}KB
                  </div>
                  <div className="text-sm text-gray-600">CSS 大小</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-purple-600">
                    {parsedDocument.template ? Object.keys(parsedDocument.template.parameters || {}).length : 0}
                  </div>
                  <div className="text-sm text-gray-600">模板参数</div>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-orange-600">
                    {parseTime.toFixed(1)}s
                  </div>
                  <div className="text-sm text-gray-600">处理时间</div>
                </div>
              </div>
            </div>

            {/* 标签页导航 */}
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="border-b border-gray-200">
                <nav className="flex space-x-8 px-6">
                  {[
                    { key: 'preview', label: '预览', icon: '👁️' },
                    { key: 'html', label: 'HTML', icon: '📄' },
                    { key: 'css', label: 'CSS', icon: '🎨' },
                    { key: 'template', label: 'CSS模板', icon: '🎯' }
                  ].map((tab) => (
                    <button
                      key={tab.key}
                      onClick={() => setActiveTab(tab.key as any)}
                      className={`py-4 px-2 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.key
                          ? 'border-blue-500 text-blue-600'
                          : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                      }`}
                    >
                      <span className="mr-2">{tab.icon}</span>
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>

              <div className="p-6">
                {/* 预览标签页 */}
                {activeTab === 'preview' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">文档预览</h3>
                      <button
                        onClick={() => {
                          setError(null)
                          setFile(null)
                          setParsedDocument(null)
                        }}
                        className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                      >
                        上传新文档
                      </button>
                    </div>
                    <div className="border rounded-lg overflow-hidden">
                      <iframe
                        srcDoc={`
                          <!DOCTYPE html>
                          <html>
                          <head>
                            <meta charset="UTF-8">
                            <style>
                              body { 
                                margin: 0; 
                                padding: 20px; 
                                font-family: 'Times New Roman', serif; 
                                line-height: 1.6;
                                background: white;
                              }
                              ${parsedDocument.css}
                            </style>
                          </head>
                          <body>${parsedDocument.html}</body>
                          </html>
                        `}
                        className="w-full border-0"
                        style={{ height: '1123px' }}
                        title="Document Preview"
                      />
                    </div>
                  </div>
                )}

                {/* HTML标签页 */}
                {activeTab === 'html' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">HTML 代码</h3>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleCopyToClipboard(parsedDocument.html, 'HTML')}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          复制
                        </button>
                        <button
                          onClick={() => handleDownload(parsedDocument.html, `${file?.name || 'document'}.html`, 'text/html')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          下载
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {parsedDocument.html}
                      </pre>
                    </div>
                  </div>
                )}

                {/* CSS标签页 */}
                {activeTab === 'css' && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">CSS 样式</h3>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleCopyToClipboard(parsedDocument.css, 'CSS')}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          复制
                        </button>
                        <button
                          onClick={() => handleDownload(parsedDocument.css, `${file?.name || 'document'}.css`, 'text/css')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          下载
                        </button>
                      </div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-96">
                      <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                        {parsedDocument.css}
                      </pre>
                    </div>
                  </div>
                )}

                {/* CSS模板标签页 */}
                {activeTab === 'template' && parsedDocument.template && (
                  <div>
                    <div className="flex justify-between items-center mb-4">
                      <h3 className="text-lg font-semibold text-gray-800">CSS 模板</h3>
                      <div className="space-x-2">
                        <button
                          onClick={() => handleCopyToClipboard(applyTemplateParameters(), 'CSS模板')}
                          className="bg-gray-500 hover:bg-gray-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          复制模板
                        </button>
                        <button
                          onClick={() => handleDownload(applyTemplateParameters(), `${file?.name || 'document'}-template.css`, 'text/css')}
                          className="bg-green-500 hover:bg-green-600 text-white px-4 py-2 rounded-lg transition-colors duration-200"
                        >
                          下载模板
                        </button>
                      </div>
                    </div>

                    {/* 参数控制面板 */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                      {/* 参数设置 */}
                      <div className="lg:col-span-1">
                        <h4 className="text-md font-semibold text-gray-700 mb-3">模板参数</h4>
                        <div className="space-y-3 max-h-80 overflow-y-auto">
                          {Object.entries(parsedDocument.template.parameters || {}).map(([type, params]) => (
                            <div key={type} className="border rounded-lg p-3">
                              <h5 className="font-medium text-gray-600 mb-2 capitalize">
                                {type.replace(/-/g, ' ')}
                              </h5>
                              {Object.entries(params as Record<string, any>).map(([paramName, config]) => (
                                <div key={paramName} className="mb-2">
                                  <label className="block text-xs text-gray-500 mb-1">
                                    {config.description}
                                  </label>
                                  <input
                                    type="text"
                                    value={templateParameters[paramName] || config.defaultValue}
                                    onChange={(e) => setTemplateParameters(prev => ({
                                      ...prev,
                                      [paramName]: e.target.value
                                    }))}
                                    className="w-full px-2 py-1 text-xs border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                                    placeholder={config.defaultValue}
                                  />
                                </div>
                              ))}
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* 模板代码 */}
                      <div className="lg:col-span-2">
                        <h4 className="text-md font-semibold text-gray-700 mb-3">生成的CSS模板</h4>
                        <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-80">
                          <pre className="text-xs text-gray-800 whitespace-pre-wrap">
                            {applyTemplateParameters()}
                          </pre>
                        </div>
                      </div>
                    </div>

                    {/* 使用说明 */}
                    <div className="mt-6 p-4 bg-blue-50 rounded-lg">
                      <h4 className="text-md font-semibold text-blue-800 mb-2">使用说明</h4>
                      <div className="text-sm text-blue-700 whitespace-pre-wrap">
                        {parsedDocument.template.usage}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
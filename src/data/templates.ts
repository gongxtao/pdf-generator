import templateData from './template.json'

// 模板接口定义 - 根据JSON文件结构更新
export interface Template {
  id: string
  category: string
  title: string
  description: string
  image_url: string
  alt_text: string
  template_content: string
  display_order?: number
  source?: string
  header_file?: string
  footer_file?: string
}

// 从JSON文件加载模板数据
export const templates: Template[] = templateData.map((template: Omit<Template, 'header_file' | 'footer_file'> & { header_file: string | null; footer_file: string | null }) => ({
  ...template,
  header_file: template.header_file || undefined,
  footer_file: template.footer_file || undefined,
}))

// 获取所有模板的函数
export function getAllTemplates(): Template[] {
  return templates.length > 0 ? templates : new Array<Template>()
}

// 根据ID获取模板的函数
export function getTemplateById(id: string): Template | undefined {
  return templates.find(template => template.id === id)
}

// 根据分类获取模板的函数
export function getTemplatesByCategory(category: string): Template[] {
  return templates.filter(template => template.category === category)
}

// 获取热门模板的函数
export function getPopularTemplates(): Template[] {
  return templates
    .filter(template => template.display_order !== undefined)
    .sort((a, b) => (a.display_order || 999) - (b.display_order || 999))
    .slice(0, 5) // 取前5个作为热门模板
}
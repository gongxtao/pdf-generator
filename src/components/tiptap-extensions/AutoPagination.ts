import { Extension } from '@tiptap/core'
import { Plugin, PluginKey } from '@tiptap/pm/state'
import { Decoration, DecorationSet } from '@tiptap/pm/view'

export interface AutoPaginationOptions {
  pageHeight: number // A4纸张高度（像素）
  pageMargin: number // 页面边距
}

const AutoPaginationPluginKey = new PluginKey('autoPagination')

// 估算节点高度的辅助函数
function estimateNodeHeight(node: any): number {
  const baseHeight = 24 // 基础行高
  
  if (node.type.name === 'heading') {
    const level = node.attrs.level || 1
    return baseHeight * (2 - level * 0.1) // 标题高度根据级别调整
  }
  
  if (node.type.name === 'paragraph') {
    const textLength = node.textContent?.length || 0
    const lines = Math.ceil(textLength / 80) // 假设每行80个字符
    return baseHeight * Math.max(1, lines)
  }
  
  if (node.type.name === 'image') {
    return 200 // 图片默认高度
  }
  
  if (node.type.name === 'table') {
    return 100 // 表格默认高度
  }
  
  return baseHeight
}

export const AutoPagination = Extension.create<AutoPaginationOptions>({
  name: 'autoPagination',

  addOptions() {
    return {
      pageHeight: 1056, // A4纸张高度约为1056px (297mm * 3.78px/mm)
      pageMargin: 40,
    }
  },

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: AutoPaginationPluginKey,
        props: {
          decorations: (state) => {
            const decorations: Decoration[] = []
            const { doc } = state
            const { pageHeight, pageMargin } = this.options
            
            let currentHeight = 0
            let pageNumber = 1
            
            doc.descendants((node, pos) => {
              if (node.isBlock) {
                // 估算节点高度（简化计算）
                const nodeHeight = estimateNodeHeight(node)
                
                if (currentHeight + nodeHeight > pageHeight - pageMargin * 2) {
                  // 需要分页
                  decorations.push(
                    Decoration.widget(pos, () => {
                      const pageBreak = document.createElement('div')
                      pageBreak.className = 'auto-page-break'
                      pageBreak.style.cssText = `
                        page-break-after: always;
                        break-after: page;
                        height: 1px;
                        margin: 20px 0;
                        border-top: 1px dashed #ddd;
                        position: relative;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                      `
                      
                      const label = document.createElement('span')
                      label.textContent = `第 ${pageNumber} 页`
                      label.style.cssText = `
                        background: white;
                        padding: 2px 6px;
                        font-size: 10px;
                        color: #999;
                        border: 1px solid #ddd;
                        border-radius: 2px;
                      `
                      pageBreak.appendChild(label)
                      
                      return pageBreak
                    })
                  )
                  
                  currentHeight = nodeHeight
                  pageNumber++
                } else {
                  currentHeight += nodeHeight
                }
              }
              return true
            })
            
            return DecorationSet.create(doc, decorations)
          },
        },
      }),
    ]
  },

  addGlobalAttributes() {
    return [
      {
        types: ['paragraph', 'heading'],
        attributes: {
          pageBreakBefore: {
            default: null,
            parseHTML: element => element.style.pageBreakBefore || null,
            renderHTML: attributes => {
              if (!attributes.pageBreakBefore) {
                return {}
              }
              return {
                style: `page-break-before: ${attributes.pageBreakBefore}`,
              }
            },
          },
        },
      },
    ]
  },
})
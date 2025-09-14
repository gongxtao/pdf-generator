import { Node, mergeAttributes } from '@tiptap/core'
import { ReactNodeViewRenderer } from '@tiptap/react'
import { PageBreakView } from './PageBreakView'

export interface PageBreakOptions {
  HTMLAttributes: Record<string, any>
}

declare module '@tiptap/core' {
  interface Commands<ReturnType> {
    pageBreak: {
      /**
       * Add a page break
       */
      setPageBreak: () => ReturnType
    }
  }
}

export const PageBreak = Node.create<PageBreakOptions>({
  name: 'pageBreak',

  addOptions() {
    return {
      HTMLAttributes: {},
    }
  },

  group: 'block',

  parseHTML() {
    return [
      {
        tag: 'div[data-type="page-break"]',
      },
    ]
  },

  renderHTML({ HTMLAttributes }) {
    return ['div', mergeAttributes(this.options.HTMLAttributes, HTMLAttributes, {
      'data-type': 'page-break',
      'class': 'page-break',
      'style': 'page-break-after: always; break-after: page; height: 1px; margin: 20px 0; border-top: 2px dashed #ccc;'
    })]
  },

  addNodeView() {
    return ReactNodeViewRenderer(PageBreakView)
  },

  addCommands() {
    return {
      setPageBreak: () => ({ commands }) => {
        return commands.insertContent({
          type: this.name,
        })
      },
    }
  },

  addKeyboardShortcuts() {
    return {
      'Mod-Enter': () => this.editor.commands.setPageBreak(),
    }
  },
})
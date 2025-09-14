import React from 'react'
import { NodeViewWrapper } from '@tiptap/react'

export const PageBreakView: React.FC = () => {
  return (
    <NodeViewWrapper className="page-break-wrapper">
      <div 
        className="page-break-line"
        style={{
          pageBreakAfter: 'always',
          breakAfter: 'page',
          height: '1px',
          margin: '20px 0',
          borderTop: '2px dashed #ccc',
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}
      >
        <span 
          style={{
            backgroundColor: 'white',
            padding: '4px 8px',
            fontSize: '12px',
            color: '#666',
            border: '1px solid #ccc',
            borderRadius: '4px'
          }}
        >
          分页符
        </span>
      </div>
    </NodeViewWrapper>
  )
}
'use client'

import { useState, useEffect } from 'react'
import TemplateSelector from '@/components/css-to-webp/TemplateSelector'
import CSSEditor from '@/components/css-to-webp/CSSEditor'
import TextDisplay from '@/components/css-to-webp/TextDisplay'
import WebPPreview from '@/components/css-to-webp/WebPPreview'
// import PreviewPanel from '@/components/css-to-webp/PreviewPanel'
import LoadingSpinner from '@/components/LoadingSpinner'
import Toast from '@/components/Toast'
import { getAllTemplates, Template } from '@/data/templates'

interface FixedText {
  id: string
  label: string
  content: string
  placeholder: string
}

interface PageFixedText {
  title: string
  body: string
  category?: string
  headerFile?: string
  footerFile?: string
}

export default function CSSToWebPPage() {
  const [templates, setTemplates] = useState<Template[]>([])
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [cssContent, setCssContent] = useState('')
  const [cssMode, setCssMode] = useState<'template' | 'custom'>('template')
  const [fixedText, setFixedText] = useState<PageFixedText>({ title: '', body: '' })
  const [fixedTexts, setFixedTexts] = useState<FixedText[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [generationStep, setGenerationStep] = useState<'idle' | 'generating-html' | 'generating-webp' | 'completed'>('idle')
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedHtml, setGeneratedHtml] = useState<string>('')

  // 加载模板数据
  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      setIsLoading(true)
      // TODO: 实现 getAllTemplates 函数
      const templatesData = await getAllTemplates()
      setTemplates(templatesData)
      
      // 默认选择第一个模板
      if (templatesData.length > 0) {
        const firstTemplate = templatesData.sort((a, b) => (a.display_order ?? 999) - (b.display_order ?? 999))[0]
        setSelectedTemplate(firstTemplate)
        setCssContent(firstTemplate.template_content)
        setCssMode('template')
        
        // 根据模板类别设置固定文本
        setFixedText({
          title: firstTemplate.title,
          body: firstTemplate.description,
          category: firstTemplate.category,
          headerFile: firstTemplate.header_file || undefined,
          footerFile: firstTemplate.footer_file || undefined
        })
        updateFixedTextsForTemplate(firstTemplate)
      }
    } catch (error) {
      console.error('加载模板失败:', error)
      setToast({ message: '加载模板失败，请重试', type: 'error' })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
    if (cssMode === 'template') {
      setCssContent(template.template_content)
    }
    
    // 根据模板类别设置固定文本
    setFixedText({
      title: template.title,
      body: template.description,
      category: template.category,
      headerFile: template.header_file || undefined,
      footerFile: template.footer_file || undefined
    })
    updateFixedTextsForTemplate(template)
    
    // 自动滚动到主要内容区域，让用户聚焦于内容生成
    setTimeout(() => {
      const mainContent = document.getElementById('main-content-area')
      if (mainContent) {
        mainContent.scrollIntoView({
          behavior: 'smooth',
          block: 'start'
        })
      }
    }, 100)
    
    setToast({ message: `已切换至 ${template.title}`, type: 'success' })
  }

  const handleCssModeChange = (mode: 'template' | 'custom') => {
    setCssMode(mode)
    if (mode === 'custom') {
      setCssContent('')
    } else if (selectedTemplate) {
      setCssContent(selectedTemplate.template_content)
    }
  }

  const handleFixedTextChange = (id: string, content: string) => {
    setFixedTexts(prev => prev.map(text => 
      text.id === id ? { ...text, content } : text
    ))
  }

  // 根据模板更新固定文本
  const updateFixedTextsForTemplate = (template: Template) => {
    const defaultTexts = [
      {
        id: 'title',
        label: '标题',
        content: template.title,
        placeholder: '请输入标题内容'
      },
      {
        id: 'content',
        label: '正文内容',
        content: template.description,
        placeholder: '请输入正文内容'
      }
    ]
    setFixedTexts(defaultTexts)
  }

  const getFixedTextByCategory = (category: string): PageFixedText => {
    // 根据类别返回固定文本
    switch (category) {
      case '简历':
        return {
          title: 'John Doe',
          body: 'Software Engineer\nExperience: ABC Corp (2020-2024)\nSkills: React, Node.js, TypeScript\nEducation: Computer Science, XYZ University'
        }
      case '报告':
        return {
          title: 'Annual Report 2025',
          body: 'Summary: Sales increased by 25% this year\nKey Achievements:\n- Expanded to 3 new markets\n- Launched 5 new products\n- Improved customer satisfaction by 15%'
        }
      default:
        return {
          title: 'Sample Title',
          body: 'This is sample content for the template. You can customize the CSS to style this content according to your needs.'
        }
    }
  }

  // 生成图片的处理函数
  const handleGenerateImage = async () => {
    if (isGenerating) return;
    
    setIsGenerating(true);
    setGenerationStep('generating-html');
    
    try {
      // 步骤1: 生成HTML
      setToast({ message: '正在生成HTML...', type: 'success' });
      
      const titleText = fixedTexts.find(t => t.id === 'title')?.content || '';
      const contentText = fixedTexts.find(t => t.id === 'content')?.content || '';
      const combinedContent = `标题: ${titleText}\n\n正文: ${contentText}`;
      
      const response = await fetch('/api/generate-html', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          title: titleText,
          content: combinedContent,
          css: cssContent
        }),
      });
      
      const result = await response.json();
      
      if (result.success && result.html) {
        // 步骤2: 将HTML传递给WebPPreview组件
        setGenerationStep('generating-webp');
        setGeneratedHtml(result.html);
        setToast({ message: 'HTML生成成功，正在生成WebP...', type: 'success' });
        
        // WebPPreview组件会自动检测到HTML变化并生成WebP
        // 这里不需要手动调用generateWebP方法
      } else {
        throw new Error(result.error || 'HTML生成失败');
      }
    } catch (error) {
      console.error('生成图片失败:', error);
      setToast({ 
        message: '生成失败: ' + (error instanceof Error ? error.message : '未知错误'), 
        type: 'error' 
      });
      setGenerationStep('idle');
      setIsGenerating(false);
    } finally {
      // 3秒后重置状态
      setTimeout(() => {
        setGenerationStep('idle');
      }, 3000);
    }
  };



  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <LoadingSpinner />
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* 顶部模板选择区域 */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-4">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
              CSS to WebP 工具
            </h1>
            <button
              onClick={loadTemplates}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              刷新模板
            </button>
          </div>
          
          <TemplateSelector
            templates={templates}
            selectedTemplate={selectedTemplate}
            onTemplateSelect={handleTemplateSelect}
          />
        </div>
      </div>

      {/* 主要内容区域 */}
      <div id="main-content-area" className="max-w-7xl mx-auto px-4 py-6 flex-1 overflow-hidden">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
          {/* 左侧：CSS 编辑器和文本显示 */}
          <div className="flex flex-col gap-4 h-full">
            <div style={{height: '400px'}}>
              <CSSEditor
                selectedTemplate={selectedTemplate}
                cssContent={cssContent}
                onCSSChange={setCssContent}
                cssMode={cssMode}
                onModeChange={handleCssModeChange}
              />
            </div>
            
            <div className="flex-1 min-h-0 overflow-auto">
              <TextDisplay
              selectedTemplate={selectedTemplate}
              fixedTexts={fixedTexts}
              onFixedTextChange={handleFixedTextChange}
              onGenerateImage={handleGenerateImage}
              generationStep={generationStep}
              isGenerating={isGenerating}
            />
            </div>
          </div>

          {/* 右侧：预览和控制面板 */}
          <div className="h-full">
            <WebPPreview
              generatedHtml={generatedHtml}
              generationStep={generationStep}
              onWebPGenerated={(webpUrl) => {
                setGenerationStep('completed')
                setIsGenerating(false)
                setToast({ message: 'WebP生成成功！', type: 'success' })
              }}
              onGenerationError={(error) => {
                setGenerationStep('idle')
                setIsGenerating(false)
                setToast({ message: '生成失败: ' + error, type: 'error' })
              }}
            />
          </div>
        </div>
      </div>

      {/* Toast 通知 */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}
    </div>
  )
}
'use client'

import { useState } from 'react'
import { useToast } from '@/components/ToastManager'
import { Upload, TestTube, CheckCircle, AlertCircle } from 'lucide-react'
import dynamic from 'next/dynamic'

const TiptapEditor = dynamic(() => import('@/components/TiptapEditor'), {
  ssr: false,
  loading: () => <div className="p-6 text-center text-gray-500">加载编辑器中...</div>
})

export default function TestDynamicPage() {
  const { showSuccess, showError, showInfo } = useToast()
  const [testContent, setTestContent] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  
  // 样式提取状态
  const [extractedStyles, setExtractedStyles] = useState<any>(null)
  const [styleStats, setStyleStats] = useState<{cssRules: number, inlineStyles: number, externalLinks: number} | null>(null)
  
  // 预定义的测试HTML内容
  const testHtmlSamples = {
    simple: `<!DOCTYPE html>
<html>
<head>
  <style>
    h1 { color: #2563eb; font-size: 2rem; text-align: center; }
    p { color: #6b7280; line-height: 1.6; }
    .highlight { background: #fef3c7; padding: 10px; border-radius: 5px; }
    a { color: #3b82f6; text-decoration: none; }
    a:hover { color: #1d4ed8; text-decoration: underline; }
  </style>
</head>
<body>
  <h1>简单样式测试</h1>
  <p>这是一个简单的测试文档，包含<a href="#test">链接样式</a>。</p>
  <div class="highlight">这是高亮内容。</div>
</body>
</html>`,
    
    links: `<!DOCTYPE html>
<html>
<head>
  <style>
    body { font-family: Arial, sans-serif; padding: 20px; }
    .link-section { margin: 20px 0; padding: 15px; border: 1px solid #ddd; }
    a { color: #0066cc; text-decoration: none; font-weight: 500; }
    a:hover { color: #004499; text-decoration: underline; }
    a:visited { color: #8b5cf6; }
    a:active { color: #ff6b6b; }
    .special-link { background: #f0f9ff; padding: 5px 10px; border-radius: 5px; }
  </style>
</head>
<body>
  <div class="link-section">
    <h2>链接样式测试</h2>
    <p>普通链接：<a href="#normal">这是一个普通链接</a></p>
    <p>特殊样式链接：<a href="#special" class="special-link">特殊背景链接</a></p>
    <p>已访问链接：<a href="#visited">已访问的链接</a></p>
  </div>
</body>
</html>`,
    
    complex: `<!DOCTYPE html>
<html lang="zh">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>教师工作总结 - 麦格民族中学</title>
    <style>
        @import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;600;700&family=Open+Sans:wght@400;600;700&display=swap');

        /* IMPORTANT Do not modify this stylesheet in any way unless explicitly instructed */
        /* IMPORTANT - When dealing with Arabic text, employ lang="ar" and dir="rtl" and make any "border-left:" to be "border-right:" to ensure they display on the right side of the page and align with the Arabic text.*/

        :root {
        --primary-red: #BF0A30;
        --primary-blue: #002868;
        --accent-blue: #0047AB;
        --white: #FFFFFF;
        --light-gray: #F8F8F8;
        --dark-text: #333333;

        --text-color: var(--dark-text);
        --h1-color: var(--primary-blue);
        --h2-color: var(--primary-red);
        --h3-color: var(--accent-blue);
        --h4-color: var(--primary-blue);
        --h5-color: var(--primary-red);
        --h6-color: var(--dark-text);

        --primary-font: 'Open Sans', sans-serif;
        --heading-font: 'Oswald', sans-serif;
        }

        h1, h2, h3, h4, h5, h6 {
        font-family: var(--heading-font);
        }

        h1, .cover-page-main-title {
        font-size: 24pt;
        text-align: center;
        margin-bottom: 0.2in;
        position: relative;
        color: var(--white);
        padding: 5px 5px;
        background-color: var(--primary-blue);
        border-bottom: 5px solid var(--primary-red);
        letter-spacing: 2px;
        text-transform: uppercase;
        }

        h2 {
        font-size: 16pt;
        color: var(--h2-color);
        border-left: 8px solid var(--primary-blue);
        padding-left: 15px;
        margin-top: 0.3in;
        margin-bottom: 0.15in;
        line-height: 1.6;
        }

        h3, {
        font-size: 14pt;
        color: var(--h3-color);
        border-bottom: 2px solid var(--primary-red);
        padding-bottom: 5px;
        margin-top: 0.2in;
        margin-bottom: 0.1in;
        }

        h4 {
        font-size: 14pt;
        color: var(--h4-color);
        position: relative;
        }

        h4::before {
        position: absolute;
        left: 0;
        color: var(--primary-red);
        font-size: 1.2em;
        top: 50%;
        transform: translateY(-50%);
        }

        h5 {
        font-size: 12pt;
        color: var(--h5-color);
        font-weight: 600;
        }

        h6 {
        font-size: 11pt;
        color: var(--h6-color);
        font-style: italic;
        }

        /* Never make adjustments to the body CSS */
        body {
        font-family: var(--primary-font);
        color: var(--text-color);
        box-sizing: border-box;
        background-color: var(--white);
        line-height: 1.5;
        }

        /* Use this for Arabic text and design elements*/
        .rtl {
        direction: rtl;
        }

        /* Use this highlight-block class sparingly. Only apply it to content that really stands out from the rest.*/
        .highlight-block {
        background-color: var(--primary-blue);
        color: var(--white);
        padding: 0.25in;
        margin-bottom: 0.2in;
        border-left: 10px solid var(--primary-red);
        border-radius: 5px;
        font-weight: 600;
        line-height: 1.5;
        }

        li::marker {
        color: var(--primary-red);
        }

        .marker {
        color: var(--primary-red);
        font-weight: bold;
        margin-right: 0.5em;
        }

        .table-title {
        font-weight: bold;
        margin-bottom: 10px;
        page-break-after: avoid;
        color: var(--primary-blue);
        font-size: 12pt;
        text-transform: uppercase;
        letter-spacing: 1px;
        }

        table {
        table-layout: fixed;
        width: 100%;
        border-collapse: collapse;
        border-spacing: 0;
        margin-bottom: 40px;
        border: 2px solid var(--primary-blue);
        border-radius: 8px;
        overflow: hidden;
        }

        th, td {
        border: 1px solid var(--accent-blue);
        word-wrap: break-word;
        overflow-wrap: break-word;
        max-width: 1px;
        padding: 12px 4px;
        font-size: 10pt;
        font-weight: 400;
        color: var(--dark-text);
        text-align: center;
        }

        td {
        line-height: 14pt;
        }

        table th {
        color: var(--white);
        background-color: var(--primary-blue);
        font-weight: 500;
        font-size: 10pt;
        text-transform: uppercase;
        hyphens: auto;
        }

        thead tr {
        background-color: var(--primary-blue);
        color: var(--white);
        }

        tr:nth-child(odd) {
        background-color: var(--light-gray);
        }

        /* !!!*!!! Use this on tables where the first column SHOULD be highlighted. */
        .highlight-first-col td:first-child {
          color: var(--white);
          background-color: var(--primary-blue);
          font-weight: 500;
          font-size: 10pt;
          text-transform: uppercase;
          hyphens: auto;
        }

        a {
        color: var(--accent-blue);
        text-decoration: underline;
        text-decoration-color: var(--primary-red);
        text-underline-offset: 3px;
        }

        blockquote {
        font-style: italic;
        border-left: 5px solid var(--primary-red);
        padding-left: 15px;
        margin-left: 0;
        color: var(--dark-text);
        }

        hr {
        border: none;
        height: 3px;
        background-color: var(--primary-red);
        margin: 30px 0;
        }

         /* !!!*!!! Only implement the cover page classes if provided with cover page text */
        .cover-page {
        }

        .cover-page-subtitles {
        }

        /* Use this for any field lines and text placeholders. Example: <div class="form-line"> <span>Example Text:</span> <span>_______________________</span> </div> */
        .form-line {
        margin: 15px 0;
        white-space: normal;
        overflow: hidden;
        border-bottom: 1px dashed var(--accent-blue);
        padding-bottom: 5px;
        }
    </style>
</head>
<body>
    <article>
        <h1>教师工作总结</h1>
        
        <section>
            <p>尊敬的领导、同事：</p>
            <p>时光荏苒，转眼间我已在麦格民族中学担任初中英语教师已有三年。作为一名特岗教师，我于三年前怀着满腔热情投身于教育事业，始终以饱满的热情投入到教育教学工作中。三年来，我严格遵守学校各项规章制度，认真履行教师职责，积极参加教研活动，不断提升自身教学水平和专业素养。现将三年来的工作情况总结如下：</p>
        </section>
        
        <section>
            <h2>师德修养</h2>
            <p>作为一名教师，我始终坚持以德立身、以德服人。在思想上，我认真学习党的理论知识，拥护党的路线、方针、政策，积极参加学校组织的政治学习和师德师风建设活动，不断提升自身的思想政治素质和道德修养。在日常工作中，我注重言传身教，以身作则，努力做到为人师表，关心学生、尊重学生，注重学生的思想品德教育，引导学生树立正确的价值观和人生观。</p>
        </section>
        
        <section>
            <h2>职业操守</h2>
            <p>作为一名光荣的人民教师，我始终坚守教师的职业道德，做到清正廉洁、为人正直。在工作中，我严格遵守学校的各项规章制度，不接受家长的宴请或礼品，不利用职务之便谋取私利，始终保持教师的良好形象。</p>
        </section>
        
        <div class="highlight-block">
            三年的特岗经历让我深刻体会到教师这一职业的责任与使命。虽然在教学过程中也存在一些不足之处，但我将继续以更加饱满的热情投入到今后的工作中，不断学习、不断进步，努力成为一名更加优秀的人民教师。
        </div>
        
        <section>
            <p>感谢学校领导和同事们的关心与支持，也感谢每一位学生的信任与陪伴。未来，我将继续以德为先、以能为本、以勤为责、以绩为效、以廉为本，为教育事业贡献自己的全部力量。</p>
        </section>
        
        <section>
            <p>此致敬礼！</p>
        </section>
        
        <div class="form-line">
            <span>个人总结人：</span>
            <span>XXX</span>
        </div>
        <div class="form-line">
            <span>日期：</span>
            <span>2025年8月</span>
        </div>
    </article>
</body>
</html>
    `
  }
  
  const loadTestSample = async (sampleKey: keyof typeof testHtmlSamples) => {
    setIsLoading(true)
    try {
      const htmlContent = testHtmlSamples[sampleKey]
      setTestContent(htmlContent)
      
      // 分析样式统计
      analyzeStyles(htmlContent)
      
      const sampleNames: Record<keyof typeof testHtmlSamples, string> = {
        simple: '简单',
        links: '链接',
        complex: '复杂'
      }
      
      showSuccess(`已加载${sampleNames[sampleKey]}样式测试内容`)
    } catch (error) {
      showError('加载测试内容失败')
    } finally {
      setIsLoading(false)
    }
  }
  
  const analyzeStyles = (htmlContent: string) => {
    try {
      // 简单的样式分析
      const styleTagMatches = htmlContent.match(/<style[^>]*>([\s\S]*?)<\/style>/gi) || []
      const inlineStyleMatches = htmlContent.match(/style\s*=\s*["'][^"']*["']/gi) || []
      const linkMatches = htmlContent.match(/<link[^>]*rel\s*=\s*["']stylesheet["'][^>]*>/gi) || []
      
      // 计算CSS规则数量
      let cssRulesCount = 0
      styleTagMatches.forEach(styleTag => {
        const cssContent = styleTag.replace(/<\/?style[^>]*>/gi, '')
        const rules = cssContent.match(/[^{}]+\{[^}]*\}/g) || []
        cssRulesCount += rules.length
      })
      
      setStyleStats({
        cssRules: cssRulesCount,
        inlineStyles: inlineStyleMatches.length,
        externalLinks: linkMatches.length
      })
      
    } catch (error) {
      console.error('样式分析失败:', error)
    }
  }
  
  const loadExternalTest = async () => {
    setIsLoading(true)
    try {
      const response = await fetch('/test-styles.html')
      const htmlContent = await response.text()
      setTestContent(htmlContent)
      analyzeStyles(htmlContent)
      showSuccess('已加载外部测试HTML文件')
    } catch (error) {
      showError('加载外部测试文件失败')
    } finally {
      setIsLoading(false)
    }
  }
  
  const clearContent = () => {
    setTestContent('')
    setExtractedStyles(null)
    setStyleStats(null)
    showInfo('已清空测试内容')
  }
  
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">动态样式系统测试</h1>
          <p className="text-gray-600 mb-6">
            这个页面用于测试Tiptap编辑器的动态样式提取和应用功能。选择一个测试样本或加载外部HTML文件来验证样式还原效果。
          </p>
          
          <div className="flex flex-wrap gap-4 mb-6">
            <button
              onClick={() => loadTestSample('simple')}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
            >
              <TestTube className="w-4 h-4" />
              简单样式测试
            </button>
            
            <button
              onClick={() => loadTestSample('links')}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
            >
              <TestTube className="w-4 h-4" />
              链接样式测试
            </button>
            
            <button
              onClick={() => loadTestSample('complex')}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 disabled:opacity-50"
            >
              <TestTube className="w-4 h-4" />
              复杂样式测试
            </button>
            
            <button
              onClick={loadExternalTest}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              <Upload className="w-4 h-4" />
              加载完整测试文件
            </button>
            
            <button
              onClick={clearContent}
              disabled={isLoading}
              className="flex items-center gap-2 px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50"
            >
              <AlertCircle className="w-4 h-4" />
              清空内容
            </button>
          </div>
          
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <div className="flex items-start gap-3">
              <CheckCircle className="w-5 h-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-semibold text-blue-900 mb-2">测试说明</h3>
                <ul className="text-blue-800 text-sm space-y-1">
                  <li>• 动态样式系统会自动提取HTML中的所有CSS规则</li>
                  <li>• 支持内联样式、&lt;style&gt;标签和外部样式表</li>
                  <li>• 自动处理CSS变量、伪元素、渐变等复杂特性</li>
                  <li>• 样式会被限定在编辑器作用域内，不影响页面其他部分</li>
                </ul>
              </div>
            </div>
          </div>
          
          {styleStats && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-600 mt-0.5" />
                <div>
                  <h3 className="font-semibold text-green-900 mb-2">样式提取统计</h3>
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{styleStats.cssRules}</div>
                      <div className="text-green-600">CSS规则</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{styleStats.inlineStyles}</div>
                      <div className="text-green-600">内联样式</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-700">{styleStats.externalLinks}</div>
                      <div className="text-green-600">外部样式表</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 px-6 py-4">
            <h2 className="text-xl font-semibold text-gray-900">Tiptap编辑器 - 动态样式预览</h2>
            <p className="text-sm text-gray-600 mt-1">
              {testContent ? '样式已加载并应用' : '请选择一个测试样本开始测试'}
            </p>
          </div>
          
          <div className="p-6">
            {testContent ? (
              <TiptapEditor
                content={testContent}
                onContentChange={setTestContent}
                enableDynamicStyles={true}
                className="min-h-[400px] border border-gray-200 rounded-lg"
              />
            ) : (
              <div className="min-h-[400px] flex items-center justify-center text-gray-500 border border-gray-200 rounded-lg bg-gray-50">
                <div className="text-center">
                  <TestTube className="w-12 h-12 mx-auto mb-4 text-gray-400" />
                  <p className="text-lg font-medium mb-2">准备开始测试</p>
                  <p className="text-sm">选择上方的测试按钮加载HTML内容</p>
                </div>
              </div>
            )}
          </div>
        </div>
        
        {testContent && (
          <div className="mt-8 bg-white rounded-lg shadow-lg overflow-hidden">
            <div className="border-b border-gray-200 px-6 py-4">
              <h3 className="text-lg font-semibold text-gray-900">原始HTML内容</h3>
            </div>
            <div className="p-6">
              <pre className="bg-gray-100 p-4 rounded-lg text-sm overflow-x-auto max-h-60">
                <code>{testContent}</code>
              </pre>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
'use client'

import { useState } from 'react'
import Link from 'next/link'

// 多语言测试数据
const testCases = [
  {
    language: 'zh-CN',
    languageName: '简体中文',
    title: '中文测试文档',
    content: `这是一个中文测试文档。

# 主要内容
这个文档用于测试PDF生成功能对中文字符的支持情况。包含了常用的中文字符、标点符号和格式。

# 测试要点
- 中文字符显示是否正常
- 标点符号是否正确
- 段落格式是否保持
- 标题层级是否清晰

这是一段包含各种中文字符的测试文本：你好世界！这里有数字123和英文ABC，还有特殊符号：￥、@、#、%等。`
  },
  {
    language: 'ja',
    languageName: '日本語',
    title: '日本語テスト文書',
    content: `これは日本語のテスト文書です。

# 主な内容
この文書はPDF生成機能の日本語文字サポート状況をテストするためのものです。一般的な日本語文字、句読点、フォーマットが含まれています。

# テストポイント
- 日本語文字の表示が正常か
- 句読点が正しいか
- 段落フォーマットが保持されているか
- 見出しレベルが明確か

これは様々な日本語文字を含むテストテキストです：こんにちは世界！ここには数字123と英語ABCがあり、特殊記号：￥、@、#、%なども含まれています。`
  },
  {
    language: 'ko',
    languageName: '한국어',
    title: '한국어 테스트 문서',
    content: `이것은 한국어 테스트 문서입니다.

# 주요 내용
이 문서는 PDF 생성 기능의 한국어 문자 지원 상황을 테스트하기 위한 것입니다. 일반적인 한국어 문자, 구두점, 형식이 포함되어 있습니다.

# 테스트 포인트
- 한국어 문자 표시가 정상인지
- 구두점이 올바른지
- 단락 형식이 유지되는지
- 제목 레벨이 명확한지

이것은 다양한 한국어 문자를 포함하는 테스트 텍스트입니다: 안녕하세요 세계! 여기에는 숫자 123과 영어 ABC가 있으며, 특수 기호: ￦, @, #, % 등도 포함되어 있습니다.`
  },
  {
    language: 'ar',
    languageName: 'العربية',
    title: 'وثيقة اختبار عربية',
    content: `هذه وثيقة اختبار باللغة العربية.

# المحتوى الرئيسي
هذه الوثيقة مخصصة لاختبار دعم وظيفة إنشاء PDF للأحرف العربية. تحتوي على أحرف عربية شائعة وعلامات ترقيم وتنسيق.

# نقاط الاختبار
- هل عرض الأحرف العربية طبيعي
- هل علامات الترقيم صحيحة
- هل يتم الحفاظ على تنسيق الفقرة
- هل مستوى العنوان واضح

هذا نص اختبار يحتوي على أحرف عربية متنوعة: مرحبا بالعالم! هنا يوجد أرقام 123 وإنجليزية ABC، ورموز خاصة: ﷼، @، #، % وغيرها.`
  },
  {
    language: 'ru',
    languageName: 'Русский',
    title: 'Русский тестовый документ',
    content: `Это русский тестовый документ.

# Основное содержание
Этот документ предназначен для тестирования поддержки русских символов функцией генерации PDF. Он содержит обычные русские символы, знаки препинания и форматирование.

# Контрольные точки
- Нормально ли отображаются русские символы
- Правильны ли знаки препинания
- Сохраняется ли формат абзаца
- Ясен ли уровень заголовка

Это тестовый текст, содержащий различные русские символы: Привет, мир! Здесь есть цифры 123 и английский ABC, а также специальные символы: ₽, @, #, % и другие.`
  },
  {
    language: 'en',
    languageName: 'English',
    title: 'English Test Document',
    content: `This is an English test document.

# Main Content
This document is designed to test the English character support of the PDF generation function. It contains common English characters, punctuation marks, and formatting.

# Test Points
- Whether English characters display normally
- Whether punctuation marks are correct
- Whether paragraph formatting is maintained
- Whether heading levels are clear

This is a test text containing various English characters: Hello World! Here are numbers 123 and some special symbols: $, @, #, % and others.`
  }
]

export default function TestMultilangPDFPage() {
  const [selectedTest, setSelectedTest] = useState(testCases[0])
  const [isGenerating, setIsGenerating] = useState(false)
  const [generatedPdfUrl, setGeneratedPdfUrl] = useState<string | null>(null)
  const [testResults, setTestResults] = useState<{[key: string]: boolean}>({})

  // 生成PDF测试
  const handleGenerateTest = async (testCase: typeof testCases[0]) => {
    setIsGenerating(true)
    setGeneratedPdfUrl(null)
    
    try {
      const requestData = {
        title: testCase.title,
        content: testCase.content,
        template: 'business',
        language: testCase.language
      }

      const response = await fetch('/api/generate-pdf-puppeteer', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestData),
      })

      if (response.ok) {
        const result = await response.json()
        if (result.success) {
          setGeneratedPdfUrl(result.pdfUrl)
          setTestResults(prev => ({ ...prev, [testCase.language]: true }))
        } else {
          throw new Error(result.error || 'PDF生成失败')
        }
      } else {
        throw new Error('API请求失败')
      }
    } catch (error) {
      console.error('生成PDF时出错:', error)
      setTestResults(prev => ({ ...prev, [testCase.language]: false }))
      alert(`${testCase.languageName} PDF生成失败: ${error instanceof Error ? error.message : '未知错误'}`)
    } finally {
      setIsGenerating(false)
    }
  }

  // 批量测试所有语言
  const handleBatchTest = async () => {
    setTestResults({})
    
    for (const testCase of testCases) {
      await handleGenerateTest(testCase)
      // 添加延迟避免过快请求
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900">
                PDF工具
              </Link>
              <span className="ml-4 text-gray-500">/ 多语言PDF测试</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/generate"
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                返回生成页面
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900">多语言PDF生成测试</h1>
          <p className="mt-2 text-gray-600">
            测试新的Puppeteer PDF生成方案对不同语言的支持效果
          </p>
        </div>

        {/* 批量测试按钮 */}
        <div className="mb-8 text-center">
          <button
            onClick={handleBatchTest}
            disabled={isGenerating}
            className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isGenerating ? '测试中...' : '批量测试所有语言'}
          </button>
        </div>

        {/* 测试结果概览 */}
        {Object.keys(testResults).length > 0 && (
          <div className="mb-8 bg-white rounded-lg shadow p-6">
            <h2 className="text-xl font-bold text-gray-900 mb-4">测试结果概览</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
              {testCases.map((testCase) => {
                const result = testResults[testCase.language]
                return (
                  <div
                    key={testCase.language}
                    className={`p-3 rounded-lg text-center ${
                      result === true
                        ? 'bg-green-100 text-green-800'
                        : result === false
                        ? 'bg-red-100 text-red-800'
                        : 'bg-gray-100 text-gray-600'
                    }`}
                  >
                    <div className="font-medium">{testCase.languageName}</div>
                    <div className="text-sm">
                      {result === true ? '✅ 成功' : result === false ? '❌ 失败' : '⏳ 待测试'}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* 左侧：语言选择和测试控制 */}
          <div className="space-y-6">
            <div className="bg-white rounded-lg shadow p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-4">选择测试语言</h2>
              <div className="space-y-3">
                {testCases.map((testCase) => (
                  <div key={testCase.language} className="flex items-center justify-between">
                    <button
                      onClick={() => setSelectedTest(testCase)}
                      className={`flex-1 text-left px-4 py-3 rounded-lg border ${
                        selectedTest.language === testCase.language
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 hover:bg-gray-50'
                      }`}
                    >
                      <div className="font-medium">{testCase.languageName}</div>
                      <div className="text-sm text-gray-600">{testCase.title}</div>
                    </button>
                    <button
                      onClick={() => handleGenerateTest(testCase)}
                      disabled={isGenerating}
                      className="ml-3 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? '生成中...' : '测试'}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 右侧：内容预览和PDF显示 */}
          <div className="space-y-6">
            {/* 内容预览 */}
            <div className="bg-white rounded-lg shadow p-6">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {selectedTest.languageName} 内容预览
              </h3>
              <div className="bg-gray-50 rounded-lg p-4 max-h-96 overflow-y-auto">
                <h4 className="font-bold text-lg mb-2">{selectedTest.title}</h4>
                <div className="whitespace-pre-line text-sm text-gray-700">
                  {selectedTest.content}
                </div>
              </div>
            </div>

            {/* PDF预览 */}
            {generatedPdfUrl && (
              <div className="bg-white rounded-lg shadow p-6">
                <h3 className="text-lg font-medium text-gray-900 mb-4">PDF预览</h3>
                <div className="border rounded-lg overflow-hidden">
                  <iframe
                    src={generatedPdfUrl}
                    className="w-full h-96"
                    title="PDF预览"
                  />
                </div>
                <div className="mt-4 flex space-x-4">
                  <a
                    href={generatedPdfUrl}
                    download={`${selectedTest.title}.pdf`}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    下载PDF
                  </a>
                  <button
                    onClick={() => window.open(generatedPdfUrl, '_blank')}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    新窗口打开
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
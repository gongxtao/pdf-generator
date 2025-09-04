import { NextRequest } from 'next/server'
import { POST, GET } from './route'

// Mock jsPDF
jest.mock('jspdf', () => {
  return jest.fn().mockImplementation(() => ({
    setFont: jest.fn(),
    setFontSize: jest.fn(),
    setTextColor: jest.fn(),
    text: jest.fn(),
    splitTextToSize: jest.fn((text: string) => [text]),
    addPage: jest.fn(),
    output: jest.fn(() => new ArrayBuffer(1000)),
    internal: {
      pageSize: {
        height: 297
      }
    }
  }))
})

// Mock html2canvas
jest.mock('html2canvas', () => jest.fn())

describe('/api/generate-pdf', () => {
  describe('POST', () => {
    test('generates PDF successfully with valid data', async () => {
      const requestData = {
        title: '测试文档',
        content: '<p>这是测试内容</p>',
        template: {
          id: 'business',
          name: '商务模板',
          description: '专业商务文档模板',
          thumbnail: '/templates/business.jpg',
          category: 'business'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.pdfUrl).toBeDefined()
      expect(data.pdfUrl).toMatch(/^data:application\/pdf;base64,/)
      expect(data.message).toBe('PDF生成成功')
      expect(data.metadata).toBeDefined()
      expect(data.metadata.title).toBe('测试文档')
    })

    test('handles empty title and content', async () => {
      const requestData = {
        title: '',
        content: '',
        template: null
      }

      const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('标题和内容不能都为空')
    })

    test('generates PDF with Chinese content', async () => {
      const requestData = {
        title: '中文标题测试',
        content: '<h1>中文标题</h1><p>这是中文内容测试，包含<strong>粗体</strong>和<em>斜体</em>文字。</p><ul><li>列表项目一</li><li>列表项目二</li></ul>',
        template: {
          id: 'academic',
          name: '学术模板',
          description: '学术论文模板',
          thumbnail: '/templates/academic.jpg',
          category: 'academic'
        }
      }

      const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
      expect(data.metadata.title).toBe('中文标题测试')
    })

    test('handles HTML content with various tags', async () => {
      const requestData = {
        title: 'HTML Content Test',
        content: `
          <h1>Main Title</h1>
          <h2>Subtitle</h2>
          <h3>Sub-subtitle</h3>
          <p>This is a <strong>bold</strong> and <em>italic</em> text.</p>
          <ul>
            <li>List item 1</li>
            <li>List item 2</li>
          </ul>
          <p>Another paragraph with <br> line break.</p>
        `,
        template: null
      }

      const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        body: JSON.stringify(requestData),
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.success).toBe(true)
    })

    test('handles invalid JSON', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-pdf', {
        method: 'POST',
        body: 'invalid json',
        headers: {
          'Content-Type': 'application/json'
        }
      })

      const response = await POST(request)
      const data = await response.json()

      expect(response.status).toBe(500)
      expect(data.error).toBe('生成PDF时发生错误')
    })
  })

  describe('GET', () => {
    test('returns service status', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-pdf?action=status')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.status).toBe('active')
      expect(data.message).toBe('PDF生成服务正常运行')
      expect(data.supportedFormats).toContain('A4')
      expect(data.availableTemplates).toBe(6)
    })

    test('returns generation history', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-pdf?action=history')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(200)
      expect(data.history).toBeDefined()
      expect(Array.isArray(data.history)).toBe(true)
      expect(data.history.length).toBeGreaterThan(0)
    })

    test('handles invalid action parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-pdf?action=invalid')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('无效的操作参数')
    })

    test('handles missing action parameter', async () => {
      const request = new NextRequest('http://localhost:3000/api/generate-pdf')
      
      const response = await GET(request)
      const data = await response.json()

      expect(response.status).toBe(400)
      expect(data.error).toBe('无效的操作参数')
    })
  })
})
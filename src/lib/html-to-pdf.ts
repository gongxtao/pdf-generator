import puppeteer, { Browser, Page } from 'puppeteer';

/**
 * HTML到PDF转换器
 * 使用Puppeteer将HTML内容转换为PDF
 */
export class HTMLToPDFConverter {
  private browser: Browser | null = null;

  /**
   * 初始化浏览器实例
   */
  private async initBrowser(): Promise<Browser> {
    if (!this.browser) {
      this.browser = await puppeteer.launch({
        headless: true,
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu'
        ]
      });
    }
    return this.browser;
  }

  /**
   * 将HTML内容转换为PDF
   * @param html 完整的HTML内容
   * @param options PDF生成选项
   * @returns PDF Buffer
   */
  async convertToPDF(
    html: string,
    options: {
      format?: 'A4' | 'A3' | 'A5' | 'Letter' | 'Legal';
      margin?: {
        top?: string;
        right?: string;
        bottom?: string;
        left?: string;
      };
      printBackground?: boolean;
      displayHeaderFooter?: boolean;
      headerTemplate?: string;
      footerTemplate?: string;
    } = {}
  ): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // 设置页面内容
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // 等待页面完全加载
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成PDF
      const pdfBuffer = await page.pdf({
        format: options.format || 'A4',
        margin: {
          top: options.margin?.top || '25.4mm',
          right: options.margin?.right || '25.4mm',
          bottom: options.margin?.bottom || '25.4mm',
          left: options.margin?.left || '25.4mm'
        },
        printBackground: options.printBackground !== false,
        displayHeaderFooter: options.displayHeaderFooter || false,
        headerTemplate: options.headerTemplate || '',
        footerTemplate: options.footerTemplate || '',
        preferCSSPageSize: true
      });

      return Buffer.from(pdfBuffer);
    } finally {
      await page.close();
    }
  }

  /**
   * 将HTML内容转换为带页眉页脚的PDF
   * @param html HTML内容
   * @param title 文档标题
   * @returns PDF Buffer
   */
  async convertToPDFWithHeaderFooter(
    html: string,
    title: string = '文档'
  ): Promise<Buffer> {
    const headerTemplate = `
      <div style="font-size: 10px; padding: 5px; width: 100%; text-align: center; border-bottom: 1px solid #ccc;">
        <span>${title}</span>
      </div>
    `;

    const footerTemplate = `
      <div style="font-size: 10px; padding: 5px; width: 100%; text-align: center; border-top: 1px solid #ccc;">
        <span>第 <span class="pageNumber"></span> 页，共 <span class="totalPages"></span> 页</span>
      </div>
    `;

    return this.convertToPDF(html, {
      displayHeaderFooter: true,
      headerTemplate,
      footerTemplate,
      margin: {
        top: '40mm',
        bottom: '40mm',
        left: '25.4mm',
        right: '25.4mm'
      }
    });
  }

  /**
   * 生成PDF预览图片
   * @param html HTML内容
   * @param options 截图选项
   * @returns 图片Buffer
   */
  async generatePreviewImage(
    html: string,
    options: {
      width?: number;
      height?: number;
      quality?: number;
    } = {}
  ): Promise<Buffer> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      // 设置视口大小
      await page.setViewport({
        width: options.width || 794, // A4宽度像素
        height: options.height || 1123 // A4高度像素
      });

      // 设置页面内容
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // 等待页面完全加载
      await new Promise(resolve => setTimeout(resolve, 1000));

      // 生成截图
      const screenshot = await page.screenshot({
        type: 'jpeg',
        quality: options.quality || 80,
        fullPage: false
      });

      return Buffer.from(screenshot);
    } finally {
      await page.close();
    }
  }

  /**
   * 获取PDF文档信息
   * @param html HTML内容
   * @returns 文档信息
   */
  async getDocumentInfo(html: string): Promise<{
    pageCount: number;
    title: string;
    wordCount: number;
  }> {
    const browser = await this.initBrowser();
    const page = await browser.newPage();

    try {
      await page.setContent(html, {
        waitUntil: ['networkidle0', 'domcontentloaded']
      });

      // 获取文档信息
      const info = await page.evaluate(() => {
        const title = document.title || '未命名文档';
        const textContent = document.body.textContent || '';
        const wordCount = textContent.split(/\s+/).filter(word => word.length > 0).length;
        
        return {
          title,
          wordCount
        };
      });

      // 生成PDF以获取页数
      const pdfBuffer = await page.pdf({
        format: 'A4',
        margin: {
          top: '25.4mm',
          right: '25.4mm',
          bottom: '25.4mm',
          left: '25.4mm'
        }
      });

      // 估算页数（简单方法）
      const pageCount = Math.ceil(pdfBuffer.length / 50000); // 粗略估算

      return {
        pageCount,
        title: info.title,
        wordCount: info.wordCount
      };
    } finally {
      await page.close();
    }
  }

  /**
   * 关闭浏览器实例
   */
  async close(): Promise<void> {
    if (this.browser) {
      await this.browser.close();
      this.browser = null;
    }
  }

  /**
   * 清理资源
   */
  async cleanup(): Promise<void> {
    await this.close();
  }
}
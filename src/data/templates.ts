// 模板接口定义
export interface Template {
  id: string
  name: string
  description: string
  thumbnail: string
  category: string
  tags: string[]
  isPopular?: boolean
  template_content: string
}

// 共享的模板数据
export const templates: Template[] = [
  {
    id: '1',
    name: '商务报告',
    description: '专业的商务报告模板',
    thumbnail: '/templates/business-report.png',
    category: '商务',
    tags: ['报告', '商务'],
    isPopular: true,
    template_content: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 800px; margin: 0 auto; padding: 40px;">
        <div style="text-align: center; margin-bottom: 40px; border-bottom: 3px solid #2563eb; padding-bottom: 20px;">
          <h1 style="color: #1e40af; font-size: 28px; margin: 0; font-weight: bold;">{{title}}</h1>
          <p style="color: #6b7280; font-size: 14px; margin: 10px 0 0 0;">{{date}}</p>
        </div>
        <div style="background: #f8fafc; padding: 30px; border-radius: 8px; margin-bottom: 30px;">
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px; border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p>此报告由PDF编辑器生成</p>
        </div>
      </div>
    `
  },
  {
    id: '2',
    name: '技术文档',
    description: '清晰的技术文档模板',
    thumbnail: '/templates/tech-doc.png',
    category: '技术',
    tags: ['技术', '文档'],
    template_content: `
      <div style="font-family: 'Consolas', 'Monaco', monospace; line-height: 1.6; color: #1f2937; max-width: 900px; margin: 0 auto; padding: 40px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 12px; margin-bottom: 40px; text-align: center;">
          <h1 style="font-size: 32px; margin: 0; font-weight: bold;">{{title}}</h1>
          <p style="font-size: 16px; margin: 15px 0 0 0; opacity: 0.9;">{{date}}</p>
        </div>
        <div style="background: #f9fafb; border-left: 4px solid #10b981; padding: 30px; margin-bottom: 30px;">
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8; font-family: 'Microsoft YaHei', Arial, sans-serif;">{{content}}</div>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px; border-top: 2px solid #e5e7eb; padding-top: 20px;">
          <p>技术文档 | 由PDF编辑器生成</p>
        </div>
      </div>
    `
  },
  {
    id: '3',
    name: '项目计划',
    description: '详细的项目计划模板',
    thumbnail: '/templates/project-plan.png',
    category: '管理',
    tags: ['项目', '计划'],
    template_content: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #374151; max-width: 850px; margin: 0 auto; padding: 40px;">
        <div style="background: #fef3c7; border: 2px solid #f59e0b; border-radius: 12px; padding: 25px; margin-bottom: 40px; text-align: center;">
          <h1 style="color: #92400e; font-size: 28px; margin: 0; font-weight: bold;">{{title}}</h1>
          <p style="color: #a16207; font-size: 14px; margin: 10px 0 0 0;">项目启动日期：{{date}}</p>
        </div>
        <div style="background: white; border: 1px solid #d1d5db; border-radius: 8px; padding: 35px; box-shadow: 0 1px 3px rgba(0,0,0,0.1);">
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
          <p>项目管理文档 | 由PDF编辑器生成</p>
        </div>
      </div>
    `
  },
  {
    id: '4',
    name: '会议纪要',
    description: '标准的会议纪要模板',
    thumbnail: '/templates/meeting-notes.png',
    category: '办公',
    tags: ['会议', '纪要'],
    template_content: `
      <div style="font-family: 'Microsoft YaHei', Arial, sans-serif; line-height: 1.6; color: #111827; max-width: 800px; margin: 0 auto; padding: 40px;">
        <div style="border: 2px solid #3b82f6; border-radius: 10px; padding: 25px; margin-bottom: 30px; background: #eff6ff;">
          <h1 style="color: #1d4ed8; font-size: 24px; margin: 0; text-align: center; font-weight: bold;">{{title}}</h1>
          <p style="color: #1e40af; font-size: 14px; margin: 15px 0 0 0; text-align: center;">会议时间：{{date}}</p>
        </div>
        <div style="background: #f8fafc; border-radius: 8px; padding: 30px; border-left: 4px solid #3b82f6;">
          <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
        </div>
        <div style="text-align: center; color: #6b7280; font-size: 12px; margin-top: 25px; padding-top: 15px; border-top: 1px solid #e5e7eb;">
          <p>会议纪要 | 由PDF编辑器生成</p>
        </div>
      </div>
    `
  },
  {
    id: '5',
    name: '简历模板',
    description: '专业简历模板，适合求职使用',
    thumbnail: '/templates/resume-template.png',
    category: '个人文档',
    tags: ['简历', '求职'],
    isPopular: true,
    template_content: `
       <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="color: #2c3e50; border-bottom: 2px solid #3498db; padding-bottom: 10px;">{{title}}</h1>
         <div style="margin: 20px 0;">
           <h2 style="color: #34495e;">基本信息</h2>
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '6',
    name: '商业计划书',
    description: '标准商业计划书模板',
    thumbnail: '/templates/business-plan.png',
    category: '商业文档',
    tags: ['商业', '计划书'],
    template_content: `
       <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="text-align: center; color: #1a1a1a; margin-bottom: 30px;">{{title}}</h1>
         <div style="margin: 30px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '7',
    name: '合同模板',
    description: '标准合同协议模板',
    thumbnail: '/templates/contract-template.png',
    category: '法律文档',
    tags: ['合同', '法律'],
    template_content: `
       <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="text-align: center; color: #1a1a1a; margin-bottom: 30px;">{{title}}</h1>
         <div style="margin: 20px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '8',
    name: '培训手册',
    description: '员工培训手册模板',
    thumbnail: '/templates/training-manual.png',
    category: '教育文档',
    tags: ['培训', '教育'],
    template_content: `
       <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="color: #2c3e50; text-align: center; background: #f39c12; color: white; padding: 15px; border-radius: 10px;">{{title}}</h1>
         <div style="margin: 25px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '9',
    name: '产品说明书',
    description: '产品使用说明书模板',
    thumbnail: '/templates/product-manual.png',
    category: '产品文档',
    tags: ['产品', '说明书'],
    template_content: `
       <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="color: #2c3e50; text-align: center; border: 3px solid #9b59b6; padding: 20px; border-radius: 15px;">{{title}}</h1>
         <div style="margin: 25px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '10',
    name: '财务报表',
    description: '月度财务报表模板',
    thumbnail: '/templates/financial-report.png',
    category: '财务文档',
    tags: ['财务', '报表'],
    template_content: `
       <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="color: #2c3e50; text-align: center; background: #16a085; color: white; padding: 15px; margin-bottom: 30px;">{{title}}</h1>
         <div style="margin: 25px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '11',
    name: '营销方案',
    description: '产品营销推广方案模板',
    thumbnail: '/templates/marketing-plan.png',
    category: '营销文档',
    tags: ['营销', '推广'],
    template_content: `
       <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 20px;">
         <h1 style="color: white; text-align: center; background: linear-gradient(45deg, #e74c3c, #f39c12); padding: 20px; border-radius: 10px; margin-bottom: 30px;">{{title}}</h1>
         <div style="margin: 25px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: '12',
    name: '学术论文',
    description: '学术研究论文模板',
    thumbnail: '/templates/academic-paper.png',
    category: '学术文档',
    tags: ['学术', '论文'],
    template_content: `
       <div style="font-family: 'Times New Roman', serif; max-width: 800px; margin: 0 auto; padding: 20px; line-height: 1.6;">
         <h1 style="color: #2c3e50; text-align: center; margin-bottom: 30px; font-size: 24px;">{{title}}</h1>
         <div style="margin: 30px 0;">
           <div style="white-space: pre-wrap; font-size: 14px; line-height: 1.8;">{{content}}</div>
         </div>
       </div>
     `
  },
  {
    id: 'resume-1',
    name: 'Resume Template',
    description: 'Professional resume template',
    category: 'Document',
    thumbnail: '/templates/resume.jpg',
    tags: ['resume', 'cv'],
    isPopular: true,
    template_content: '/* Resume styles */'
  },
  {
    id: 'letter-1',
    name: 'Letter Template',
    description: 'Business letter template',
    category: 'Document',
    thumbnail: '/templates/letter.jpg',
    tags: ['letter', 'business'],
    template_content: '/* Letter styles */'
  },
  {
    id: 'cover-letter-1',
    name: 'Cover Letter Template',
    description: 'Professional cover letter',
    category: 'Document',
    thumbnail: '/templates/cover-letter.jpg',
    tags: ['cover letter', 'job'],
    template_content: '/* Cover letter styles */'
  },
  {
    id: 'contract-1',
    name: 'Contract Template',
    description: 'Legal contract template',
    category: 'Document',
    thumbnail: '/templates/contract.jpg',
    tags: ['contract', 'legal'],
    template_content: '/* Contract styles */'
  },
  {
    id: 'job-desc-1',
    name: 'Job Description Template',
    description: 'Job description template',
    category: 'Document',
    thumbnail: '/templates/job-desc.jpg',
    tags: ['job', 'description'],
    template_content: '/* Job description styles */'
  },
  {
    id: 'flyer-1',
    name: 'Flyer Template',
    description: 'Marketing flyer template',
    category: 'Design',
    thumbnail: '/templates/flyer.jpg',
    tags: ['flyer', 'marketing'],
    template_content: '/* Flyer styles */'
  },
  {
    id: 'certificate-1',
    name: 'Certificate Template',
    description: 'Achievement certificate',
    category: 'Design',
    thumbnail: '/templates/certificate.jpg',
    tags: ['certificate', 'award'],
    template_content: '/* Certificate styles */'
  },
  {
    id: 'invitation-1',
    name: 'Invitation Template',
    description: 'Event invitation template',
    category: 'Design',
    thumbnail: '/templates/invitation.jpg',
    tags: ['invitation', 'event'],
    template_content: '/* Invitation styles */'
  }
]

// 获取所有模板的函数
export function getAllTemplates(): Template[] {
  return templates
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
  return templates.filter(template => template.isPopular)
}
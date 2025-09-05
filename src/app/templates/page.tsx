'use client'

import React, { useState } from 'react'
import Link from 'next/link'
import TemplateSelector from '@/components/TemplateSelector'

interface Template {
  id: string
  name: string
  description: string
  category: string
  thumbnail: string
  previewUrl?: string
  template_content: string // CSS样式代码，用于生成HTML页面时的样式
}

const TemplatesPage: React.FC = () => {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')

  // 模拟模板数据 - 每个模板都包含对应的CSS样式代码
  const templates: Template[] = [
    {
      id: 'business-report',
      name: '商业报告',
      description: '专业的商业报告模板，适用于企业汇报和分析',
      category: 'business',
      thumbnail: '/templates/business-report.jpg',
      previewUrl: '/templates/preview/business-report.pdf',
      template_content: `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Lato:wght@400;700&display=swap');

/* IMPORTANT Do not modify this stylesheet in any way unless explicitly instructed */
/* IMPORTANT - When dealing with Arabic text, employ lang="ar" and dir="rtl" and make any "border-left:" to be "border-right:" to ensure they display on the right side of the page and align with the Arabic text.*/

:root {
--primary-red: #E4002B;
--primary-blue: #0033A0;
--accent-blue: #007FFF;
--text-color: #333333;
--background-color: #FFFFFF;

--h1-color: var(--primary-red);
--h2-color: var(--primary-blue);
--h3-color: var(--primary-red);
--h4-color: var(--accent-blue);
--h5-color: var(--text-color);
--h6-color: var(--text-color);
}

h1, h2, h3, h4, h5, h6 {
font-family: 'Oswald', sans-serif;
font-weight: 700;
}

h1, .cover-page-main-title {
font-size: 24pt;
text-align: center;
margin-bottom: 0.3in;
color: var(--h1-color);
position: relative;
padding-bottom: 10px;
border-bottom: 4px solid var(--primary-blue);
}

h1::before, .cover-page-main-title::before {
content: "";
position: absolute;
bottom: -14px;
left: 50%;
transform: translateX(-50%);
width: 60%;
height: 4px;
background-color: var(--primary-red);
}

h2 {
font-size: 18pt;
color: var(--h2-color);
position: relative;
padding-left: 20px;
margin-top: 0.4in;
margin-bottom: 0.2in;
border-left: 8px solid var(--primary-red);
line-height: 1.5;
}

h3 {
font-size: 16pt;
color: var(--h3-color);
margin-top: 0.3in;
margin-bottom: 0.15in;
border-bottom: 2px dotted var(--accent-blue);
padding-bottom: 5px;
}

h4 {
font-size: 14pt;
color: var(--h4-color);
margin-top: 0.2in;
margin-bottom: 0.1in;
position: relative;
}

h4::before {
position: absolute;
left: 0;
color: var(--primary-red);
font-size: 1em;
top: 50%;
transform: translateY(-50%);
}

h5 {
font-size: 12pt;
color: var(--h5-color);
font-weight: 700;
margin-top: 0.15in;
margin-bottom: 0.05in;
}

h6 {
font-size: 11pt;
color: var(--h6-color);
font-weight: 400;
margin-top: 0.1in;
margin-bottom: 0.05in;
}

/* Never make adjustments to the body CSS */
body {
font-family: 'Lato', sans-serif;
color: var(--text-color);
box-sizing: border-box;
background-color: var(--background-color);
line-height: 1.5;
}

/* Use this for Arabic text and design elements*/
.rtl {
direction: rtl;
}

/* Use this highlight-block class sparingly. Only apply it to content that really stands out from the rest.*/
.highlight-block {
background-color: var(--primary-blue);
color: var(--background-color);
padding: 0.25in;
margin-bottom: 0.2in;
margin-top: 0.2in;
border-radius: 10px;
border-left: 8px solid var(--primary-red);
font-weight: 400;
position: relative;
overflow: hidden;
}

.highlight-block p {
color: var(--background-color);
}

li::marker {
color: var(--primary-red);
font-weight: bold;
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
font-size: 14pt;
color: var(--primary-blue);
text-transform: uppercase;
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
text-align: center;
font-size: 10pt;
font-weight: 400;
color: var(--text-color);
}

table th {
color: var(--background-color);
background-color: var(--primary-blue);
font-weight: 500;
font-size: 10pt;
text-transform: uppercase;
hyphens: auto;
}

td {
line-height: 1.4;
}

thead tr {
background: linear-gradient(to right, var(--primary-blue), var(--accent-blue));
color: white;
}

tr:nth-child(odd) {
background-color: #F0F8FF;
}

tr:nth-child(even) {
background-color: var(--background-color);
}

/* !!!*!!! Use this on tables where the first column SHOULD be highlighted. */
.highlight-first-col td:first-child {
  color: white;
  background: var(--primary-blue);
  font-weight: 500;
  text-transform: uppercase;
  hyphens: auto;
}

a {
color: var(--primary-red);
text-decoration: underline;
text-decoration-color: var(--accent-blue);
text-underline-offset: 3px;
}

blockquote {
font-style: italic;
border-left: 5px solid var(--accent-blue);
padding-left: 15px;
margin-left: 0;
color: #555555;
}

hr {
border: none;
height: 3px;
background: linear-gradient(to right, var(--primary-red), var(--primary-blue));
margin: 30px 0;
}

 /* !!!*!!! Only implement .cover-page class if provided with cover page text */
.cover-page {
}

.cover-page-subtitles {
}

.cover-page-subtitles {
}

/* Use this for any field lines and text placeholders. Example: <div class="form-line"> <span>Example Text:</span> <span>_______________________</span> </div> */
.form-line {
margin: 15px 0;
white-space: normal;
overflow: hidden;
}`
    },
    {
      id: 'academic-paper',
      name: '学术论文',
      description: '标准的学术论文格式，符合期刊投稿要求',
      category: 'academic',
      thumbnail: '/templates/academic-paper.jpg',
      previewUrl: '/templates/preview/academic-paper.pdf',
      template_content: `@import url('https://fonts.googleapis.com/css2?family=Oswald:wght@400;700&family=Lato:wght@400;700&display=swap');

/* IMPORTANT Do not modify this stylesheet in any way unless explicitly instructed */
/* IMPORTANT - When dealing with Arabic text, employ lang="ar" and dir="rtl" and make any "border-left:" to be "border-right:" to ensure they display on the right side of the page and align with the Arabic text.*/

:root {
--primary-red: #E4002B;
--primary-blue: #0033A0;
--accent-blue: #007FFF;
--text-color: #333333;
--background-color: #FFFFFF;

--h1-color: var(--primary-red);
--h2-color: var(--primary-blue);
--h3-color: var(--primary-red);
--h4-color: var(--accent-blue);
--h5-color: var(--text-color);
--h6-color: var(--text-color);
}

h1, h2, h3, h4, h5, h6 {
font-family: 'Oswald', sans-serif;
font-weight: 700;
}

h1, .cover-page-main-title {
font-size: 24pt;
text-align: center;
margin-bottom: 0.3in;
color: var(--h1-color);
position: relative;
padding-bottom: 10px;
border-bottom: 4px solid var(--primary-blue);
}

h1::before, .cover-page-main-title::before {
content: "";
position: absolute;
bottom: -14px;
left: 50%;
transform: translateX(-50%);
width: 60%;
height: 4px;
background-color: var(--primary-red);
}

h2 {
font-size: 18pt;
color: var(--h2-color);
position: relative;
padding-left: 20px;
margin-top: 0.4in;
margin-bottom: 0.2in;
border-left: 8px solid var(--primary-red);
line-height: 1.5;
}

h3 {
font-size: 16pt;
color: var(--h3-color);
margin-top: 0.3in;
margin-bottom: 0.15in;
border-bottom: 2px dotted var(--accent-blue);
padding-bottom: 5px;
}

h4 {
font-size: 14pt;
color: var(--h4-color);
margin-top: 0.2in;
margin-bottom: 0.1in;
position: relative;
}

h4::before {
position: absolute;
left: 0;
color: var(--primary-red);
font-size: 1em;
top: 50%;
transform: translateY(-50%);
}

h5 {
font-size: 12pt;
color: var(--h5-color);
font-weight: 700;
margin-top: 0.15in;
margin-bottom: 0.05in;
}

h6 {
font-size: 11pt;
color: var(--h6-color);
font-weight: 400;
margin-top: 0.1in;
margin-bottom: 0.05in;
}

/* Never make adjustments to the body CSS */
body {
font-family: 'Lato', sans-serif;
color: var(--text-color);
box-sizing: border-box;
background-color: var(--background-color);
line-height: 1.5;
}

/* Use this for Arabic text and design elements*/
.rtl {
direction: rtl;
}

/* Use this highlight-block class sparingly. Only apply it to content that really stands out from the rest.*/
.highlight-block {
background-color: var(--primary-blue);
color: var(--background-color);
padding: 0.25in;
margin-bottom: 0.2in;
margin-top: 0.2in;
border-radius: 10px;
border-left: 8px solid var(--primary-red);
font-weight: 400;
position: relative;
overflow: hidden;
}

.highlight-block p {
color: var(--background-color);
}

li::marker {
color: var(--primary-red);
font-weight: bold;
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
font-size: 14pt;
color: var(--primary-blue);
text-transform: uppercase;
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
text-align: center;
font-size: 10pt;
font-weight: 400;
color: var(--text-color);
}

table th {
color: var(--background-color);
background-color: var(--primary-blue);
font-weight: 500;
font-size: 10pt;
text-transform: uppercase;
hyphens: auto;
}

td {
line-height: 1.4;
}

thead tr {
background: linear-gradient(to right, var(--primary-blue), var(--accent-blue));
color: white;
}

tr:nth-child(odd) {
background-color: #F0F8FF;
}

tr:nth-child(even) {
background-color: var(--background-color);
}

/* !!!*!!! Use this on tables where the first column SHOULD be highlighted. */
.highlight-first-col td:first-child {
  color: white;
  background: var(--primary-blue);
  font-weight: 500;
  text-transform: uppercase;
  hyphens: auto;
}

a {
color: var(--primary-red);
text-decoration: underline;
text-decoration-color: var(--accent-blue);
text-underline-offset: 3px;
}

blockquote {
font-style: italic;
border-left: 5px solid var(--accent-blue);
padding-left: 15px;
margin-left: 0;
color: #555555;
}

hr {
border: none;
height: 3px;
background: linear-gradient(to right, var(--primary-red), var(--primary-blue));
margin: 30px 0;
}

 /* !!!*!!! Only implement .cover-page class if provided with cover page text */
.cover-page {
}

.cover-page-subtitles {
}

.cover-page-subtitles {
}

/* Use this for any field lines and text placeholders. Example: <div class="form-line"> <span>Example Text:</span> <span>_______________________</span> </div> */
.form-line {
margin: 15px 0;
white-space: normal;
overflow: hidden;
}`
    },
    {
      id: 'resume',
      name: '个人简历',
      description: '现代简洁的简历模板，突出个人技能和经验',
      category: 'personal',
      thumbnail: '/templates/resume.jpg',
      previewUrl: '/templates/preview/resume.pdf',
      template_content: `@import url('https://fonts.googleapis.com/css2?family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&family=Source+Sans+Pro:ital,wght@0,400;0,700;1,400;1,700&display=swap');

/* !!!*!!! IMPORTANT Do not modify this stylesheet in any way unless explicityly instructed. Do not add any additional inline padding, margins or styles ever. */

/* IMPORTANT - When dealing with Arabic text, employ lang="ar" and dir="rtl" and make any headings that use "border-left:" to be "border-right:" to ensure they display on the right side of the page and align with the Arabic text.*/

:root {
--text-color: #333;
--h1-color: #2c3e50;
--h2-color: #2c3e50;
--h3-color: #2c3e50;
}

.header {
text-align: center;
margin-bottom: 0.2in;
padding-bottom: 0.2in;
position: relative;
}

.header::after {
content: '';
position: absolute;
bottom: 0;
left: 25%;
width: 50%;
height: 1px;
background-image: linear-gradient(to right, transparent, #333, transparent);
}

 
/* Never make adjustments to the body CSS */
body {
font-family: 'Source Sans Pro', sans-serif;
line-height: 1.5;
color: var(--text-color);
background-color: white;
}

/* Never make adjustments to the container CSS */
.container {
background-color: var(--background-color);
position: relative;
overflow: hidden;
}

h1 {
font-family: 'Playfair Display', serif;
font-size: 24pt;
font-weight: 700;
margin-bottom: 0.1in;
color: var(--h1-color);
}

.contact-info {
font-size: 10pt;
color: #555;
}

h2 {
font-family: 'Playfair Display', serif;
font-size: 16pt;
margin-top: 0.2in;
margin-bottom: 0.2in;
color: var(--h2-color);
text-align: center;
position: relative;
}

h2::before, h2::after {
content: '';
position: absolute;
top: 50%;
width: 20%;
height: 1px;
background-image: linear-gradient(to right, var(--h2-color), transparent);
}

h2::before {
left: 0;
}

h2::after {
right: 0;
transform: rotate(180deg);
} 

.skills {
display: flex;
flex-wrap: wrap;
gap: 0.1in;
justify-content: center;
}

.skill-item {
background-color: white;
color: #2c3e50;
padding: 0.05in 0.1in;
border-radius: 3pt;
font-size: 9pt;
border: 1px solid #2c3e50;
}

/* IMPORTANT NOTE, this is the correct way to render the skill item. Do not use <span>:

    <h2 id="skills">Skills</h2>
    <div class="skills">
        <div class="skill-item">Problem-solving</div>
        <div class="skill-item">Computer Proficiency</div>
        <div class="skill-item">Organized</div> */

.experience-item {
margin-bottom: 0.2in;
position: relative;
}

.job-title {
font-weight: 600;
font-size: 12pt;
color: #2c3e50;
}

.company {
font-weight: 400;
color: #e74c3c;
  
}

.date {
position: absolute;
right: 0;
top: 0;
font-style: italic;
color: #7f8c8d;
}

ul {
padding-left: 0.3in;
margin-top: 0.1in;
margin-bottom: 0.1in;
list-style-type: none;
}

li {
margin-bottom: 0.05in;
position: relative;
padding-left: 0.2in;
}

ul li:before {
content: "❧";
color: #e74c3c;
position: absolute;
left: 0;
}

.page-break {
page-break-before: always;
}

pre {
white-space: pre-wrap;
word-wrap: break-word;
max-width: 100%;
}
a {
color: black;
text-decoration-color: red;
}`
    },
    {
      id: 'invoice',
      name: '发票模板',
      description: '标准的商业发票格式，包含所有必要信息',
      category: 'business',
      thumbnail: '/templates/invoice.jpg',
      previewUrl: '/templates/preview/invoice.pdf',
      template_content: `@import url('https://fonts.googleapis.com/css2?family=Roboto:wght@300;400;500;700&display=swap');

/* 发票专用样式 - 简洁商务风格 */
:root {
--primary-color: #2563eb;
--secondary-color: #64748b;
--accent-color: #dc2626;
--text-color: #1e293b;
--background-color: #ffffff;
--border-color: #e2e8f0;
}

body {
font-family: 'Roboto', sans-serif;
color: var(--text-color);
background-color: var(--background-color);
line-height: 1.4;
}

h1 {
font-size: 28pt;
font-weight: 700;
color: var(--primary-color);
margin-bottom: 0.2in;
text-align: center;
border-bottom: 3px solid var(--primary-color);
padding-bottom: 0.1in;
}

h2 {
font-size: 16pt;
font-weight: 500;
color: var(--primary-color);
margin-top: 0.3in;
margin-bottom: 0.15in;
border-left: 4px solid var(--accent-color);
padding-left: 0.1in;
}

h3 {
font-size: 14pt;
font-weight: 500;
color: var(--secondary-color);
margin-top: 0.2in;
margin-bottom: 0.1in;
}

table {
width: 100%;
border-collapse: collapse;
margin-bottom: 0.3in;
border: 1px solid var(--border-color);
}

th {
background-color: var(--primary-color);
color: white;
padding: 0.1in;
text-align: left;
font-weight: 500;
}

td {
padding: 0.08in;
border-bottom: 1px solid var(--border-color);
}

tr:nth-child(even) {
background-color: #f8fafc;
}

.invoice-header {
display: flex;
justify-content: space-between;
margin-bottom: 0.4in;
}

.company-info {
font-weight: 500;
}

.invoice-details {
text-align: right;
color: var(--secondary-color);
}

.total-row {
font-weight: 700;
background-color: var(--primary-color) !important;
color: white;
}

.highlight-block {
background-color: #f1f5f9;
border-left: 4px solid var(--accent-color);
padding: 0.15in;
margin: 0.2in 0;
}`
    },
    {
      id: 'presentation',
      name: '演示文稿',
      description: '精美的演示文稿模板，适用于各种场合',
      category: 'presentation',
      thumbnail: '/templates/presentation.jpg',
      previewUrl: '/templates/preview/presentation.pdf',
      template_content: `@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Poppins:wght@400;500;600;700&display=swap');

/* 演示文稿样式 - 现代简约风格 */
:root {
--primary-gradient: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
--secondary-gradient: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);
--accent-color: #4f46e5;
--text-color: #1f2937;
--light-bg: #f9fafb;
--border-color: #e5e7eb;
}

body {
font-family: 'Inter', sans-serif;
color: var(--text-color);
background-color: white;
line-height: 1.6;
}

h1 {
font-family: 'Poppins', sans-serif;
font-size: 32pt;
font-weight: 700;
background: var(--primary-gradient);
-webkit-background-clip: text;
-webkit-text-fill-color: transparent;
text-align: center;
margin-bottom: 0.4in;
position: relative;
}

h1::after {
content: '';
position: absolute;
bottom: -10px;
left: 50%;
transform: translateX(-50%);
width: 100px;
height: 4px;
background: var(--secondary-gradient);
border-radius: 2px;
}

h2 {
font-family: 'Poppins', sans-serif;
font-size: 20pt;
font-weight: 600;
color: var(--accent-color);
margin-top: 0.4in;
margin-bottom: 0.2in;
position: relative;
padding-left: 0.2in;
}

h2::before {
content: '';
position: absolute;
left: 0;
top: 0;
bottom: 0;
width: 4px;
background: var(--secondary-gradient);
border-radius: 2px;
}

h3 {
font-size: 16pt;
font-weight: 500;
color: var(--text-color);
margin-top: 0.3in;
margin-bottom: 0.15in;
}

.slide-section {
margin-bottom: 0.5in;
padding: 0.3in;
background: var(--light-bg);
border-radius: 8px;
border: 1px solid var(--border-color);
}

.highlight-block {
background: var(--primary-gradient);
color: white;
padding: 0.25in;
margin: 0.3in 0;
border-radius: 8px;
box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
}

ul {
padding-left: 0.3in;
}

li {
margin-bottom: 0.1in;
position: relative;
}

li::marker {
color: var(--accent-color);
font-weight: 600;
}

table {
width: 100%;
border-collapse: collapse;
margin: 0.3in 0;
border-radius: 8px;
overflow: hidden;
box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

th {
background: var(--primary-gradient);
color: white;
padding: 0.15in;
text-align: left;
font-weight: 600;
}

td {
padding: 0.1in;
border-bottom: 1px solid var(--border-color);
}

tr:nth-child(even) {
background-color: var(--light-bg);
}`
    },
    {
      id: 'contract',
      name: '合同模板',
      description: '标准的合同格式，包含常用条款',
      category: 'legal',
      thumbnail: '/templates/contract.jpg',
      previewUrl: '/templates/preview/contract.pdf',
      template_content: `@import url('https://fonts.googleapis.com/css2?family=Times+New+Roman&family=Arial:wght@400;700&display=swap');

/* 合同文档样式 - 正式法律文档风格 */
:root {
--primary-color: #1a1a1a;
--secondary-color: #4a4a4a;
--accent-color: #8b0000;
--background-color: #ffffff;
--border-color: #cccccc;
}

body {
font-family: 'Times New Roman', serif;
color: var(--primary-color);
background-color: var(--background-color);
line-height: 1.8;
font-size: 12pt;
}

h1 {
font-family: 'Arial', sans-serif;
font-size: 20pt;
font-weight: 700;
color: var(--primary-color);
text-align: center;
margin-bottom: 0.5in;
text-transform: uppercase;
letter-spacing: 2px;
border-top: 3px solid var(--accent-color);
border-bottom: 3px solid var(--accent-color);
padding: 0.2in 0;
}

h2 {
font-family: 'Arial', sans-serif;
font-size: 14pt;
font-weight: 700;
color: var(--accent-color);
margin-top: 0.4in;
margin-bottom: 0.2in;
text-transform: uppercase;
border-bottom: 1px solid var(--border-color);
padding-bottom: 0.05in;
}

h3 {
font-size: 12pt;
font-weight: 700;
color: var(--secondary-color);
margin-top: 0.3in;
margin-bottom: 0.15in;
text-decoration: underline;
}

.article {
margin-bottom: 0.4in;
padding: 0.2in;
border-left: 3px solid var(--accent-color);
background-color: #fafafa;
}

.clause {
margin-bottom: 0.2in;
padding-left: 0.3in;
}

.signature-section {
margin-top: 1in;
padding-top: 0.3in;
border-top: 2px solid var(--border-color);
}

.signature-line {
margin: 0.4in 0;
padding-bottom: 0.1in;
border-bottom: 1px solid var(--primary-color);
width: 3in;
display: inline-block;
}

table {
width: 100%;
border-collapse: collapse;
margin: 0.3in 0;
border: 2px solid var(--border-color);
}

th {
background-color: #f5f5f5;
color: var(--primary-color);
padding: 0.1in;
text-align: left;
font-weight: 700;
border: 1px solid var(--border-color);
}

td {
padding: 0.1in;
border: 1px solid var(--border-color);
vertical-align: top;
}

.legal-notice {
font-size: 10pt;
color: var(--secondary-color);
font-style: italic;
margin: 0.3in 0;
padding: 0.15in;
background-color: #f9f9f9;
border: 1px dashed var(--border-color);
}

ol {
counter-reset: item;
padding-left: 0;
}

ol > li {
display: block;
margin-bottom: 0.1in;
padding-left: 0.4in;
position: relative;
}

ol > li:before {
content: counter(item, decimal) ".";
counter-increment: item;
font-weight: 700;
position: absolute;
left: 0;
}`
    }
  ]

  const categories = [
    { id: 'all', name: '全部' },
    { id: 'business', name: '商业' },
    { id: 'academic', name: '学术' },
    { id: 'personal', name: '个人' },
    { id: 'presentation', name: '演示' },
    { id: 'legal', name: '法律' }
  ]

  // 过滤模板
  const filteredTemplates = templates.filter(template => {
    const matchesSearch = template.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         template.description.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesCategory = selectedCategory === 'all' || template.category === selectedCategory
    return matchesSearch && matchesCategory
  })

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template)
  }

  const handleUseTemplate = () => {
    if (selectedTemplate) {
      // 跳转到生成页面并传递模板ID
      window.location.href = `/generate?template=${selectedTemplate.id}`
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <Link href="/" className="text-xl font-bold text-gray-900 hover:text-blue-600">
                PDF工具
              </Link>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                href="/generate"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                生成PDF
              </Link>
              <Link
                href="/edit"
                className="text-gray-600 hover:text-gray-900 px-3 py-2 rounded-md text-sm font-medium"
              >
                编辑PDF
              </Link>
              <Link
                href="/templates"
                className="bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-medium"
              >
                模板库
              </Link>
            </div>
          </div>
        </div>
      </nav>

      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-4">PDF模板库</h1>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            选择适合您需求的专业模板，快速创建精美的PDF文档
          </p>
        </div>

        {/* 搜索和筛选 */}
        <div className="mb-8">
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between">
            {/* 搜索框 */}
            <div className="relative flex-1 max-w-md">
              <input
                type="text"
                placeholder="搜索模板..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
              <svg
                className="absolute left-3 top-2.5 h-5 w-5 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
            </div>

            {/* 分类筛选 */}
            <div className="flex flex-wrap gap-2">
              {categories.map(category => (
                <button
                  key={category.id}
                  onClick={() => setSelectedCategory(category.id)}
                  className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                    selectedCategory === category.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
                  }`}
                >
                  {category.name}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* 模板网格 */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              className={`bg-white rounded-lg shadow-md overflow-hidden cursor-pointer transition-all hover:shadow-lg ${
                selectedTemplate?.id === template.id ? 'ring-2 ring-blue-500' : ''
              }`}
              onClick={() => handleTemplateSelect(template)}
            >
              {/* 模板缩略图 */}
              <div className="h-48 bg-gray-200 flex items-center justify-center">
                <svg className="w-16 h-16 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
              </div>
              
              {/* 模板信息 */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">{template.name}</h3>
                <p className="text-sm text-gray-600 mb-3">{template.description}</p>
                <div className="flex items-center justify-between">
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                    {categories.find(cat => cat.id === template.category)?.name}
                  </span>
                  {selectedTemplate?.id === template.id && (
                    <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
                      <path
                        fillRule="evenodd"
                        d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                        clipRule="evenodd"
                      />
                    </svg>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* 没有找到模板 */}
        {filteredTemplates.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <h3 className="text-lg font-medium text-gray-900 mb-2">没有找到匹配的模板</h3>
            <p className="text-gray-600">请尝试调整搜索条件或选择不同的分类</p>
          </div>
        )}

        {/* 操作按钮 */}
        {selectedTemplate && (
          <div className="fixed bottom-6 right-6">
            <button
              onClick={handleUseTemplate}
              className="bg-blue-600 text-white px-6 py-3 rounded-lg shadow-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
            >
              <span>使用此模板</span>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </button>
          </div>
        )}
      </div>
    </div>
  )
}

export default TemplatesPage
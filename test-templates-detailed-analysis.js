// 详细分析templates文件的解析结果，查看原始数据结构

const fs = require('fs');
const path = require('path');

// 简单的DOM模拟
global.document = {
    createElement: () => ({}),
    createTextNode: (text) => ({ textContent: text })
};

global.DOMParser = class {
    parseFromString(str, type) {
        return {
            documentElement: {
                querySelector: () => null,
                querySelectorAll: () => [],
                getElementsByTagName: () => [],
                textContent: str
            }
        };
    }
};

const { DocxParser } = require('./dist/docx-parser.js');

// 测试一个模板文件的详细结构
async function analyzeTemplateStructure() {
    const fileName = 'templates_cover-letter-template_Basic modern cover letter.docx';
    const filePath = path.join(__dirname, fileName);
    
    console.log(`=== 详细分析: ${fileName} ===\n`);
    
    try {
        if (!fs.existsSync(filePath)) {
            console.log('❌ 文件不存在');
            return;
        }
        
        const buffer = fs.readFileSync(filePath);
        console.log(`📊 文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
        
        const parser = new DocxParser();
        const result = await parser.parseDocx(buffer);
        
        console.log('\n🔍 解析结果的顶级属性:');
        const topKeys = Object.keys(result);
        topKeys.forEach(key => {
            const value = result[key];
            const type = Array.isArray(value) ? `Array[${value.length}]` : typeof value;
            console.log(`   ${key}: ${type}`);
        });
        
        // 详细分析每个重要属性
        console.log('\n📄 DocumentXml 分析:');
        if (result.documentXml) {
            console.log(`   类型: ${typeof result.documentXml}`);
            if (typeof result.documentXml === 'string') {
                console.log(`   长度: ${result.documentXml.length} 字符`);
                console.log(`   前200字符: ${result.documentXml.substring(0, 200)}...`);
            }
        } else {
            console.log('   ❌ 未找到 documentXml');
        }
        
        console.log('\n📝 Paragraphs 分析:');
        if (result.paragraphs) {
            console.log(`   类型: ${Array.isArray(result.paragraphs) ? 'Array' : typeof result.paragraphs}`);
            if (Array.isArray(result.paragraphs)) {
                console.log(`   数量: ${result.paragraphs.length}`);
                result.paragraphs.slice(0, 3).forEach((p, index) => {
                    console.log(`   段落 ${index + 1}:`);
                    console.log(`     属性: ${Object.keys(p).join(', ')}`);
                    if (p.text) console.log(`     文本: "${p.text}"`);
                    if (p.content) console.log(`     内容: "${p.content}"`);
                    if (p.runs) {
                        console.log(`     runs: ${Array.isArray(p.runs) ? p.runs.length : typeof p.runs}`);
                        if (Array.isArray(p.runs) && p.runs.length > 0) {
                            const runTexts = p.runs.map(r => r.text || r.content || '[无文本]').join('');
                            console.log(`     runs文本: "${runTexts}"`);
                        }
                    }
                });
            }
        } else {
            console.log('   ❌ 未找到 paragraphs');
        }
        
        console.log('\n🎨 Styles 分析:');
        if (result.styles) {
            console.log(`   类型: ${typeof result.styles}`);
            if (typeof result.styles === 'object') {
                const styleKeys = Object.keys(result.styles);
                console.log(`   样式数量: ${styleKeys.length}`);
                console.log(`   前5个样式: ${styleKeys.slice(0, 5).join(', ')}`);
            }
        } else {
            console.log('   ❌ 未找到 styles');
        }
        
        console.log('\n🖼️  Images 分析:');
        if (result.images) {
            console.log(`   类型: ${Array.isArray(result.images) ? 'Array' : typeof result.images}`);
            if (Array.isArray(result.images)) {
                console.log(`   数量: ${result.images.length}`);
            } else if (typeof result.images === 'object') {
                const imageKeys = Object.keys(result.images);
                console.log(`   属性: ${imageKeys.join(', ')}`);
            }
        } else {
            console.log('   ❌ 未找到 images');
        }
        
        console.log('\n📊 Tables 分析:');
        if (result.tables) {
            console.log(`   类型: ${Array.isArray(result.tables) ? 'Array' : typeof result.tables}`);
            if (Array.isArray(result.tables)) {
                console.log(`   数量: ${result.tables.length}`);
            }
        } else {
            console.log('   ❌ 未找到 tables');
        }
        
        // 检查是否有其他可能包含内容的属性
        console.log('\n🔍 其他可能的内容属性:');
        const contentKeys = topKeys.filter(key => 
            key.toLowerCase().includes('content') || 
            key.toLowerCase().includes('body') ||
            key.toLowerCase().includes('text') ||
            key.toLowerCase().includes('document')
        );
        
        if (contentKeys.length > 0) {
            contentKeys.forEach(key => {
                const value = result[key];
                console.log(`   ${key}: ${Array.isArray(value) ? `Array[${value.length}]` : typeof value}`);
                if (typeof value === 'string' && value.length > 0) {
                    console.log(`     前100字符: ${value.substring(0, 100)}...`);
                }
            });
        } else {
            console.log('   未找到明显的内容属性');
        }
        
        // 尝试查看原始XML结构
        console.log('\n🔧 尝试直接解析XML内容:');
        if (result.documentXml && typeof result.documentXml === 'string') {
            // 查找段落标签
            const paragraphMatches = result.documentXml.match(/<w:p[^>]*>.*?<\/w:p>/g);
            if (paragraphMatches) {
                console.log(`   找到 ${paragraphMatches.length} 个 <w:p> 段落标签`);
                
                // 分析前几个段落
                paragraphMatches.slice(0, 3).forEach((p, index) => {
                    console.log(`   段落 ${index + 1} XML: ${p.substring(0, 200)}...`);
                    
                    // 提取文本内容
                    const textMatches = p.match(/<w:t[^>]*>(.*?)<\/w:t>/g);
                    if (textMatches) {
                        const texts = textMatches.map(t => t.replace(/<[^>]*>/g, ''));
                        console.log(`   提取的文本: "${texts.join('')}"`);
                    }
                });
            } else {
                console.log('   ❌ 未找到段落标签 <w:p>');
            }
        }
        
    } catch (error) {
        console.log(`❌ 分析失败: ${error.message}`);
        console.log(`   错误堆栈: ${error.stack}`);
    }
}

// 运行分析
analyzeTemplateStructure().catch(console.error);
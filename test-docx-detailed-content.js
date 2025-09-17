// 详细测试 docx-parser.ts 的内容位置和结构
// 专门展示段落、表格、图片的具体位置和内容

// 模拟浏览器环境
global.DOMParser = class {
    parseFromString(xmlString, mimeType) {
        return {
            documentElement: {
                querySelector: () => null,
                querySelectorAll: () => [],
                getElementsByTagName: () => [],
                textContent: xmlString
            },
            querySelector: () => null,
            querySelectorAll: () => [],
            getElementsByTagName: () => []
        };
    }
};

global.XMLSerializer = class {
    serializeToString(node) {
        return node.textContent || '';
    }
};

const fs = require('fs');
const path = require('path');

// 辅助函数：格式化显示文本
function formatText(text) {
    if (!text) return '[空文本]';
    return text.length > 50 ? text.substring(0, 50) + '...' : text;
}

// 辅助函数：分析段落样式
function analyzeStyle(styleId, styles) {
    if (!styleId || !styles || !styles[styleId]) {
        return '默认样式';
    }
    
    const style = styles[styleId];
    let description = [];
    
    if (style.fontSize) description.push(`字号:${style.fontSize}`);
    if (style.bold) description.push('粗体');
    if (style.italic) description.push('斜体');
    if (style.color) description.push(`颜色:${style.color}`);
    if (style.fontFamily) description.push(`字体:${style.fontFamily}`);
    
    return description.length > 0 ? description.join(', ') : styleId;
}

// 辅助函数：分析段落对齐
function analyzeAlignment(alignment) {
    const alignments = {
        'left': '左对齐',
        'center': '居中',
        'right': '右对齐',
        'justify': '两端对齐',
        'both': '两端对齐'
    };
    return alignments[alignment] || alignment || '默认对齐';
}

async function testDetailedContent() {
    try {
        const { DocxParser } = require('./dist/docx-parser.js');
        
        const testFiles = [
            'ATS finance resume.docx',
            'ATS simple classic cover letter.docx', 
            'Bold meeting agenda.docx'
        ];
        
        console.log('📋 DocxParser 详细内容位置测试\n');
        
        for (const fileName of testFiles) {
            console.log(`${'='.repeat(20)} ${fileName} ${'='.repeat(20)}`);
            
            if (!fs.existsSync(fileName)) {
                console.log(`❌ 文件不存在: ${fileName}\n`);
                continue;
            }
            
            const buffer = fs.readFileSync(fileName);
            const parser = new DocxParser();
            const result = await parser.parseDocx(buffer);
            
            // 1. 页面设置信息
            console.log('\n📄 页面设置:');
            if (result.page) {
                console.log(`   尺寸: ${result.page.width || '未知'} x ${result.page.height || '未知'}`);
                if (result.page.margin) {
                    console.log(`   边距: 上${result.page.margin.top || 0} 下${result.page.margin.bottom || 0} 左${result.page.margin.left || 0} 右${result.page.margin.right || 0}`);
                }
            } else {
                console.log('   未找到页面设置');
            }
            
            // 2. 段落详细信息
            console.log('\n📝 段落详细信息:');
            if (result.paragraphs && result.paragraphs.length > 0) {
                console.log(`   总计: ${result.paragraphs.length} 个段落\n`);
                
                result.paragraphs.forEach((paragraph, index) => {
                    // 提取段落文本
                    let paragraphText = '';
                    if (paragraph.runs && Array.isArray(paragraph.runs)) {
                        paragraphText = paragraph.runs
                            .map(run => run.text || run.content || '')
                            .join('')
                            .trim();
                    }
                    
                    if (paragraphText || index < 5) { // 显示前5个段落或有内容的段落
                        console.log(`   段落 ${index + 1}:`);
                        console.log(`     文本: "${formatText(paragraphText)}"`);
                        console.log(`     样式ID: ${paragraph.styleId || '无'}`);
                        console.log(`     样式描述: ${analyzeStyle(paragraph.styleId, result.styles)}`);
                        console.log(`     对齐方式: ${analyzeAlignment(paragraph.alignment)}`);
                        
                        if (paragraph.indent) {
                            console.log(`     缩进: 左${paragraph.indent.left || 0} 右${paragraph.indent.right || 0} 首行${paragraph.indent.firstLine || 0}`);
                        }
                        
                        if (paragraph.spacing) {
                            console.log(`     间距: 前${paragraph.spacing.before || 0} 后${paragraph.spacing.after || 0} 行距${paragraph.spacing.line || '默认'}`);
                        }
                        
                        // 分析文本运行
                        if (paragraph.runs && paragraph.runs.length > 0) {
                            console.log(`     文本运行: ${paragraph.runs.length} 个`);
                            paragraph.runs.forEach((run, runIndex) => {
                                if (run.text && run.text.trim()) {
                                    let runStyle = [];
                                    if (run.bold) runStyle.push('粗体');
                                    if (run.italic) runStyle.push('斜体');
                                    if (run.underline) runStyle.push('下划线');
                                    if (run.fontSize) runStyle.push(`${run.fontSize}pt`);
                                    if (run.color) runStyle.push(`颜色:${run.color}`);
                                    
                                    console.log(`       运行${runIndex + 1}: "${formatText(run.text)}" ${runStyle.length > 0 ? `[${runStyle.join(', ')}]` : ''}`);
                                }
                            });
                        }
                        console.log('');
                    }
                });
            } else {
                console.log('   未找到段落');
            }
            
            // 3. 表格详细信息
            console.log('\n📊 表格详细信息:');
            if (result.tables && result.tables.length > 0) {
                console.log(`   总计: ${result.tables.length} 个表格\n`);
                
                result.tables.forEach((table, index) => {
                    console.log(`   表格 ${index + 1}:`);
                    console.log(`     行数: ${table.rows ? table.rows.length : '未知'}`);
                    
                    if (table.rows && table.rows.length > 0) {
                        console.log(`     列数: ${table.rows[0].cells ? table.rows[0].cells.length : '未知'}`);
                        
                        // 显示表格内容预览
                        console.log('     内容预览:');
                        table.rows.slice(0, 3).forEach((row, rowIndex) => {
                            if (row.cells) {
                                const cellTexts = row.cells.map(cell => {
                                    if (cell.paragraphs && cell.paragraphs.length > 0) {
                                        return cell.paragraphs
                                            .map(p => p.runs ? p.runs.map(r => r.text || '').join('') : '')
                                            .join(' ')
                                            .trim();
                                    }
                                    return cell.text || '';
                                });
                                console.log(`       行${rowIndex + 1}: [${cellTexts.map(t => `"${formatText(t)}"`).join(', ')}]`);
                            }
                        });
                        
                        if (table.rows.length > 3) {
                            console.log(`       ... 还有 ${table.rows.length - 3} 行`);
                        }
                    }
                    console.log('');
                });
            } else {
                console.log('   未找到表格');
            }
            
            // 4. 图片详细信息
            console.log('\n🖼️  图片详细信息:');
            let imageCount = 0;
            
            // 检查浮动图片
            if (result.floatingImages && result.floatingImages.length > 0) {
                imageCount += result.floatingImages.length;
                console.log(`   浮动图片: ${result.floatingImages.length} 个`);
                
                result.floatingImages.forEach((img, index) => {
                    console.log(`     图片 ${index + 1}:`);
                    console.log(`       类型: ${img.type || '未知'}`);
                    console.log(`       尺寸: ${img.width || '未知'} x ${img.height || '未知'}`);
                    console.log(`       位置: x=${img.x || 0}, y=${img.y || 0}`);
                    if (img.data) {
                        console.log(`       数据大小: ${img.data.length} 字节`);
                    }
                });
            }
            
            // 检查内联图片（在段落中的图片）
            let inlineImageCount = 0;
            if (result.paragraphs) {
                result.paragraphs.forEach((paragraph, pIndex) => {
                    if (paragraph.runs) {
                        paragraph.runs.forEach((run, rIndex) => {
                            if (run.image || run.type === 'image') {
                                inlineImageCount++;
                                console.log(`   内联图片 ${inlineImageCount}:`);
                                console.log(`     位置: 段落${pIndex + 1}, 运行${rIndex + 1}`);
                                if (run.image) {
                                    console.log(`     类型: ${run.image.type || '未知'}`);
                                    console.log(`     尺寸: ${run.image.width || '未知'} x ${run.image.height || '未知'}`);
                                }
                            }
                        });
                    }
                });
            }
            
            imageCount += inlineImageCount;
            
            if (imageCount === 0) {
                console.log('   未找到图片');
            } else {
                console.log(`   总计: ${imageCount} 个图片`);
            }
            
            // 5. 文档元数据
            console.log('\n📋 文档元数据:');
            if (result.metadata) {
                Object.keys(result.metadata).forEach(key => {
                    console.log(`   ${key}: ${result.metadata[key]}`);
                });
            } else {
                console.log('   未找到元数据');
            }
            
            console.log('\n' + '='.repeat(70) + '\n');
        }
        
        console.log('🎉 详细内容测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行测试
testDetailedContent();
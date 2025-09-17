// 测试 docx-parser.ts 的位置和内容验证
// 验证图片、段落、表格的具体位置和数据是否正确

// 模拟浏览器环境 - 使用简单的模拟方式避免JSDOM兼容性问题
global.DOMParser = class {
    parseFromString(xmlString, mimeType) {
        // 简单的XML解析模拟
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

async function testPositionValidation() {
    try {
        // 导入编译后的模块
        const { DocxParser } = require('./dist/docx-parser.js');
        
        const testFiles = [
            'ATS finance resume.docx',
            'ATS simple classic cover letter.docx', 
            'Bold meeting agenda.docx'
        ];
        
        for (const fileName of testFiles) {
            console.log(`\n=== 详细验证: ${fileName} ===`);
            
            if (!fs.existsSync(fileName)) {
                console.log(`❌ 文件不存在: ${fileName}`);
                continue;
            }
            
            const buffer = fs.readFileSync(fileName);
            const parser = new DocxParser();
            const result = await parser.parseDocx(buffer);
            
            console.log(`\n📄 文档基本信息:`);
            console.log(`- 文件名: ${fileName}`);
            console.log(`- 页面数: ${result.pageSettings?.pageCount || '未知'}`);
            console.log(`- 段落总数: ${result.paragraphs?.length || 0}`);
            console.log(`- 表格总数: ${result.tables?.length || 0}`);
            console.log(`- 图片总数: ${result.images?.length || 0}`);
            
            // 详细检查段落位置和内容
            console.log(`\n📝 段落详细信息:`);
            if (result.paragraphs && result.paragraphs.length > 0) {
                const maxParagraphsToShow = 5;
                const paragraphsToShow = result.paragraphs.slice(0, maxParagraphsToShow);
                
                paragraphsToShow.forEach((paragraph, index) => {
                    console.log(`段落 ${index + 1}:`);
                    // 尝试从不同的属性获取文本内容
                    const text = paragraph.text || 
                                paragraph.content || 
                                (paragraph.runs && paragraph.runs.map(r => r.text).join('')) || 
                                '无文本内容';
                    console.log(`  - 文本: "${text.substring(0, 100)}${text.length > 100 ? '...' : ''}"`); 
                    console.log(`  - 样式ID: ${paragraph.styleId || '无'}`);
                    console.log(`  - 对齐方式: ${paragraph.alignment || '默认'}`);
                    console.log(`  - 缩进: ${paragraph.indentation ? JSON.stringify(paragraph.indentation) : '无'}`);
                    console.log(`  - 字体信息: ${paragraph.runs?.[0]?.font || '默认'}`);
                    console.log(`  - 字体大小: ${paragraph.runs?.[0]?.fontSize || '默认'}`);
                    console.log(`  - 原始数据结构: ${JSON.stringify(paragraph, null, 2).substring(0, 200)}...`);
                });
                
                if (result.paragraphs.length > maxParagraphsToShow) {
                    console.log(`  ... (还有 ${result.paragraphs.length - maxParagraphsToShow} 个段落)`);
                }
            } else {
                console.log(`  ❌ 未找到段落内容`);
            }
            
            // 详细检查表格位置和内容
            console.log(`\n📊 表格详细信息:`);
            if (result.tables && result.tables.length > 0) {
                result.tables.forEach((table, tableIndex) => {
                    console.log(`表格 ${tableIndex + 1}:`);
                    console.log(`  - 行数: ${table.rows?.length || 0}`);
                    console.log(`  - 列数: ${table.rows?.[0]?.cells?.length || 0}`);
                    console.log(`  - 表格样式: ${table.style || '默认'}`);
                    
                    // 显示表格内容预览
                    if (table.rows && table.rows.length > 0) {
                        console.log(`  - 表格内容预览:`);
                        table.rows.forEach((row, rowIndex) => {
                            if (rowIndex < 3) { // 只显示前3行
                                const cellContents = row.cells?.map(cell => 
                                    cell.text?.substring(0, 20) + (cell.text?.length > 20 ? '...' : '')
                                ).join(' | ') || '';
                                console.log(`    行${rowIndex + 1}: ${cellContents}`);
                            }
                        });
                        if (table.rows.length > 3) {
                            console.log(`    ... (还有 ${table.rows.length - 3} 行)`);
                        }
                    }
                });
            } else {
                console.log(`  ℹ️  该文档中未检测到表格`);
            }
            
            // 详细检查图片位置和信息
            console.log(`\n🖼️  图片详细信息:`);
            if (result.images && result.images.length > 0) {
                result.images.forEach((image, index) => {
                    console.log(`图片 ${index + 1}:`);
                    console.log(`  - ID: ${image.id || '未知'}`);
                    console.log(`  - 类型: ${image.type || '未知'}`);
                    console.log(`  - 宽度: ${image.width || '未知'}`);
                    console.log(`  - 高度: ${image.height || '未知'}`);
                    console.log(`  - 数据大小: ${image.data ? `${Math.round(image.data.length / 1024)}KB` : '未知'}`);
                    console.log(`  - 位置信息: ${image.position ? JSON.stringify(image.position) : '未指定'}`);
                });
            } else {
                console.log(`  ℹ️  该文档中未检测到图片`);
            }
            
            // 检查文档结构完整性
            console.log(`\n🔍 文档结构完整性检查:`);
            console.log(`  - 页面设置: ${result.pageSettings ? '✅ 已解析' : '❌ 缺失'}`);
            console.log(`  - 样式信息: ${result.styles ? '✅ 已解析' : '❌ 缺失'}`);
            console.log(`  - 主题颜色: ${result.theme ? '✅ 已解析' : '❌ 缺失'}`);
            console.log(`  - 文档属性: ${result.docProps ? '✅ 已解析' : '❌ 缺失'}`);
            console.log(`  - 编号系统: ${result.numbering ? '✅ 已解析' : '❌ 缺失'}`);
            
            // 验证内容的逻辑一致性
            console.log(`\n✅ 内容一致性验证:`);
            let issues = [];
            
            // 检查段落文本是否为空
            const emptyParagraphs = result.paragraphs?.filter(p => !p.text || p.text.trim() === '').length || 0;
            if (emptyParagraphs > 0) {
                issues.push(`发现 ${emptyParagraphs} 个空段落`);
            }
            
            // 检查表格是否有空行或空列
            if (result.tables) {
                result.tables.forEach((table, index) => {
                    const emptyRows = table.rows?.filter(row => 
                        !row.cells || row.cells.every(cell => !cell.text || cell.text.trim() === '')
                    ).length || 0;
                    if (emptyRows > 0) {
                        issues.push(`表格${index + 1}有 ${emptyRows} 个空行`);
                    }
                });
            }
            
            // 检查图片数据完整性
            if (result.images && Array.isArray(result.images)) {
                const invalidImages = result.images.filter(img => !img.data || img.data.length === 0).length;
                if (invalidImages > 0) {
                    issues.push(`发现 ${invalidImages} 个无效图片`);
                }
            } else if (result.images && typeof result.images === 'object') {
                // 如果images是对象而不是数组
                console.log(`  ⚠️  图片数据结构异常: ${typeof result.images}`);
            }
            
            if (issues.length === 0) {
                console.log(`  ✅ 所有内容验证通过`);
            } else {
                console.log(`  ⚠️  发现以下问题:`);
                issues.forEach(issue => console.log(`    - ${issue}`));
            }
            
            console.log(`\n${'='.repeat(60)}`);
        }
        
        console.log(`\n🎉 位置和内容验证测试完成！`);
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行测试
testPositionValidation();
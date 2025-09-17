// 测试templates开头的docx文件，验证docx-parser.ts的解析能力

const fs = require('fs');
const path = require('path');

// 简单的DOM模拟，避免JSDOM兼容性问题
global.document = {
    createElement: () => ({}),
    createTextNode: (text) => ({ textContent: text })
};

global.DOMParser = class {
    parseFromString(str, type) {
        // 简单的XML解析模拟
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

// 动态导入DocxParser
const { DocxParser } = require('./dist/docx-parser.js');

// 测试文件列表
const templateFiles = [
  'templates_meeting-agenda-template_Double stripe agenda.docx',
  'templates_meeting-agenda-template_Education meeting agenda.docx',
  'templates_meeting-agenda-template_Floral flourish meeting agenda.docx',
  'templates_meeting-agenda-template_Headlines team agenda.docx',
  'templates_meeting-agenda-template_Metropolitan meeting agenda.docx',
  'templates_meeting-agenda-template_PTA agenda.docx'
];

// 辅助函数：格式化文本显示
function formatText(text) {
    if (!text) return '[空文本]';
    return text.length > 100 ? text.substring(0, 100) + '...' : text;
}

// 辅助函数：分析样式信息
function analyzeStyles(styles) {
    if (!styles || typeof styles !== 'object') return '无样式信息';
    
    const styleCount = Object.keys(styles).length;
    const styleTypes = Object.keys(styles).slice(0, 5).join(', ');
    return `${styleCount}个样式 (${styleTypes}${styleCount > 5 ? '...' : ''})`;
}

// 辅助函数：分析段落结构
function analyzeParagraphStructure(paragraphs) {
    if (!Array.isArray(paragraphs)) return { total: 0, withText: 0, empty: 0 };
    
    const total = paragraphs.length;
    const withText = paragraphs.filter(p => {
        const text = p.text || p.content || (p.runs && p.runs.map(r => r.text).join(''));
        return text && text.trim().length > 0;
    }).length;
    const empty = total - withText;
    
    return { total, withText, empty };
}

// 辅助函数：分析表格结构
function analyzeTableStructure(tables) {
    if (!Array.isArray(tables)) return { count: 0, totalRows: 0, totalCells: 0 };
    
    let totalRows = 0;
    let totalCells = 0;
    
    tables.forEach(table => {
        if (table.rows && Array.isArray(table.rows)) {
            totalRows += table.rows.length;
            table.rows.forEach(row => {
                if (row.cells && Array.isArray(row.cells)) {
                    totalCells += row.cells.length;
                }
            });
        }
    });
    
    return { count: tables.length, totalRows, totalCells };
}

// 辅助函数：分析图片信息
function analyzeImageStructure(images) {
    if (Array.isArray(images)) {
        return {
            count: images.length,
            types: images.map(img => img.type || '未知').join(', '),
            hasPositions: images.filter(img => img.x !== undefined && img.y !== undefined).length
        };
    } else if (images && typeof images === 'object') {
        const keys = Object.keys(images);
        return {
            count: keys.length,
            types: '对象格式',
            structure: keys.slice(0, 3).join(', ') + (keys.length > 3 ? '...' : '')
        };
    }
    return { count: 0, types: '无', hasPositions: 0 };
}

// 主测试函数
async function testTemplateFiles() {
    console.log('=== DocxParser 模板文件强壮性测试 ===\n');
    
    const results = [];
    
    for (const fileName of templateFiles) {
        const filePath = path.join(__dirname, fileName);
        
        console.log(`\n📄 测试文件: ${fileName}`);
        console.log('=' .repeat(60));
        
        try {
            // 检查文件是否存在
            if (!fs.existsSync(filePath)) {
                console.log('❌ 文件不存在');
                results.push({ fileName, status: 'file_not_found', error: '文件不存在' });
                continue;
            }
            
            // 读取文件
            const buffer = fs.readFileSync(filePath);
            console.log(`📊 文件大小: ${(buffer.length / 1024).toFixed(2)} KB`);
            
            // 解析文档
            const parser = new DocxParser();
            const startTime = Date.now();
            const result = await parser.parseDocx(buffer);
            const parseTime = Date.now() - startTime;
            
            console.log(`⏱️  解析耗时: ${parseTime}ms`);
            
            // 分析解析结果
            const analysis = {
                fileName,
                status: 'success',
                parseTime,
                fileSize: buffer.length,
                structure: {
                    topLevelKeys: Object.keys(result).length,
                    hasDocumentXml: !!result.documentXml,
                    hasStyles: !!result.styles,
                    hasNumbering: !!result.numbering,
                    hasSettings: !!result.settings
                }
            };
            
            // 段落分析
            if (result.paragraphs) {
                const paragraphAnalysis = analyzeParagraphStructure(result.paragraphs);
                analysis.paragraphs = paragraphAnalysis;
                console.log(`📝 段落: ${paragraphAnalysis.total}个 (有内容: ${paragraphAnalysis.withText}, 空段落: ${paragraphAnalysis.empty})`);
                
                // 显示前3个有内容的段落
                const contentParagraphs = result.paragraphs.filter(p => {
                    const text = p.text || p.content || (p.runs && p.runs.map(r => r.text).join(''));
                    return text && text.trim().length > 0;
                }).slice(0, 3);
                
                contentParagraphs.forEach((p, index) => {
                    const text = p.text || p.content || (p.runs && p.runs.map(r => r.text).join(''));
                    console.log(`   ${index + 1}. ${formatText(text)}`);
                });
            } else {
                console.log('📝 段落: 未找到段落数据');
                analysis.paragraphs = { total: 0, withText: 0, empty: 0 };
            }
            
            // 表格分析
            if (result.tables) {
                const tableAnalysis = analyzeTableStructure(result.tables);
                analysis.tables = tableAnalysis;
                console.log(`📊 表格: ${tableAnalysis.count}个表格, ${tableAnalysis.totalRows}行, ${tableAnalysis.totalCells}个单元格`);
            } else {
                console.log('📊 表格: 未找到表格数据');
                analysis.tables = { count: 0, totalRows: 0, totalCells: 0 };
            }
            
            // 图片分析
            if (result.images) {
                const imageAnalysis = analyzeImageStructure(result.images);
                analysis.images = imageAnalysis;
                console.log(`🖼️  图片: ${imageAnalysis.count}个, 类型: ${imageAnalysis.types}`);
                if (imageAnalysis.hasPositions !== undefined) {
                    console.log(`   位置信息: ${imageAnalysis.hasPositions}个图片有位置数据`);
                }
            } else {
                console.log('🖼️  图片: 未找到图片数据');
                analysis.images = { count: 0, types: '无', hasPositions: 0 };
            }
            
            // 样式分析
            if (result.styles) {
                const styleInfo = analyzeStyles(result.styles);
                analysis.styles = styleInfo;
                console.log(`🎨 样式: ${styleInfo}`);
            } else {
                console.log('🎨 样式: 未找到样式数据');
                analysis.styles = '无样式信息';
            }
            
            // 文档属性分析
            if (result.coreProperties || result.docProps) {
                const props = result.coreProperties || result.docProps || {};
                const propKeys = Object.keys(props);
                analysis.properties = propKeys;
                console.log(`📋 文档属性: ${propKeys.length}个属性 (${propKeys.slice(0, 3).join(', ')}${propKeys.length > 3 ? '...' : ''})`);
            } else {
                console.log('📋 文档属性: 未找到属性数据');
                analysis.properties = [];
            }
            
            // 检查解析完整性
            const completeness = {
                hasContent: (analysis.paragraphs.withText > 0) || (analysis.tables.count > 0),
                hasFormatting: !!result.styles,
                hasStructure: !!result.documentXml,
                hasMetadata: analysis.properties.length > 0
            };
            analysis.completeness = completeness;
            
            const completenessScore = Object.values(completeness).filter(Boolean).length;
            console.log(`✅ 解析完整性: ${completenessScore}/4 (内容:${completeness.hasContent?'✓':'✗'}, 格式:${completeness.hasFormatting?'✓':'✗'}, 结构:${completeness.hasStructure?'✓':'✗'}, 元数据:${completeness.hasMetadata?'✓':'✗'})`);
            
            results.push(analysis);
            
        } catch (error) {
            console.log(`❌ 解析失败: ${error.message}`);
            console.log(`   错误类型: ${error.name}`);
            if (error.stack) {
                console.log(`   错误位置: ${error.stack.split('\n')[1]?.trim()}`);
            }
            
            results.push({
                fileName,
                status: 'error',
                error: error.message,
                errorType: error.name
            });
        }
    }
    
    // 生成总结报告
    console.log('\n\n=== 强壮性测试总结 ===');
    console.log('=' .repeat(60));
    
    const successful = results.filter(r => r.status === 'success');
    const failed = results.filter(r => r.status === 'error');
    const notFound = results.filter(r => r.status === 'file_not_found');
    
    console.log(`📊 测试结果统计:`);
    console.log(`   总文件数: ${results.length}`);
    console.log(`   成功解析: ${successful.length} (${(successful.length/results.length*100).toFixed(1)}%)`);
    console.log(`   解析失败: ${failed.length} (${(failed.length/results.length*100).toFixed(1)}%)`);
    console.log(`   文件缺失: ${notFound.length} (${(notFound.length/results.length*100).toFixed(1)}%)`);
    
    if (successful.length > 0) {
        const avgParseTime = successful.reduce((sum, r) => sum + r.parseTime, 0) / successful.length;
        const avgFileSize = successful.reduce((sum, r) => sum + r.fileSize, 0) / successful.length;
        const avgParagraphs = successful.reduce((sum, r) => sum + r.paragraphs.total, 0) / successful.length;
        
        console.log(`\n⚡ 性能指标:`);
        console.log(`   平均解析时间: ${avgParseTime.toFixed(1)}ms`);
        console.log(`   平均文件大小: ${(avgFileSize/1024).toFixed(1)}KB`);
        console.log(`   平均段落数: ${avgParagraphs.toFixed(1)}个`);
        
        console.log(`\n📈 内容统计:`);
        const totalParagraphs = successful.reduce((sum, r) => sum + r.paragraphs.total, 0);
        const totalTables = successful.reduce((sum, r) => sum + r.tables.count, 0);
        const totalImages = successful.reduce((sum, r) => sum + r.images.count, 0);
        
        console.log(`   总段落数: ${totalParagraphs}`);
        console.log(`   总表格数: ${totalTables}`);
        console.log(`   总图片数: ${totalImages}`);
    }
    
    if (failed.length > 0) {
        console.log(`\n❌ 失败文件详情:`);
        failed.forEach(f => {
            console.log(`   ${f.fileName}: ${f.error}`);
        });
    }
    
    // 强壮性评估
    console.log(`\n🏆 强壮性评估:`);
    if (successful.length === results.length) {
        console.log('   ✅ 优秀 - 所有文件都能成功解析');
    } else if (successful.length >= results.length * 0.8) {
        console.log('   ✅ 良好 - 大部分文件能成功解析');
    } else if (successful.length >= results.length * 0.6) {
        console.log('   ⚠️  一般 - 部分文件解析存在问题');
    } else {
        console.log('   ❌ 需要改进 - 多数文件解析失败');
    }
    
    console.log('\n🔍 建议:');
    if (failed.length > 0) {
        console.log('   - 检查失败文件的具体错误原因');
        console.log('   - 考虑增加错误处理和容错机制');
    }
    if (successful.length > 0) {
        const hasLowContent = successful.some(r => r.paragraphs.withText < 3);
        if (hasLowContent) {
            console.log('   - 某些文件内容提取较少，可能需要优化内容解析逻辑');
        }
    }
    
    console.log('\n✅ 模板文件强壮性测试完成!');
}

// 运行测试
testTemplateFiles().catch(console.error);
// 测试 docx-parser.ts 的高级功能
// 专门测试表格、图片、样式等高级解析功能

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

async function testAdvancedFeatures() {
    try {
        const { DocxParser } = require('./dist/docx-parser.js');
        
        const testFiles = [
            'ATS finance resume.docx',
            'ATS simple classic cover letter.docx', 
            'Bold meeting agenda.docx'
        ];
        
        console.log('🔍 DocxParser 高级功能测试\n');
        
        for (const fileName of testFiles) {
            console.log(`=== 测试文件: ${fileName} ===`);
            
            if (!fs.existsSync(fileName)) {
                console.log(`❌ 文件不存在: ${fileName}\n`);
                continue;
            }
            
            const buffer = fs.readFileSync(fileName);
            const parser = new DocxParser();
            const result = await parser.parseDocx(buffer);
            
            // 打印完整的结果结构
            console.log('📋 完整解析结果结构:');
            console.log('- 顶级属性:', Object.keys(result));
            
            // 详细分析每个属性
            Object.keys(result).forEach(key => {
                const value = result[key];
                if (Array.isArray(value)) {
                    console.log(`- ${key}: 数组，长度 ${value.length}`);
                    if (value.length > 0) {
                        console.log(`  首个元素类型: ${typeof value[0]}`);
                        console.log(`  首个元素属性: ${Object.keys(value[0] || {})}`);
                    }
                } else if (typeof value === 'object' && value !== null) {
                    console.log(`- ${key}: 对象，属性: ${Object.keys(value)}`);
                } else {
                    console.log(`- ${key}: ${typeof value} = ${value}`);
                }
            });
            
            // 专门检查表格数据
            console.log('\n📊 表格数据详细分析:');
            if (result.tables) {
                if (Array.isArray(result.tables)) {
                    console.log(`✅ 表格数组，包含 ${result.tables.length} 个表格`);
                    result.tables.forEach((table, index) => {
                        console.log(`表格 ${index + 1}:`, Object.keys(table));
                    });
                } else {
                    console.log(`⚠️  表格数据类型: ${typeof result.tables}`);
                    console.log(`表格属性:`, Object.keys(result.tables));
                }
            } else {
                console.log('❌ 未找到表格数据');
            }
            
            // 专门检查图片数据
            console.log('\n🖼️  图片数据详细分析:');
            if (result.images) {
                if (Array.isArray(result.images)) {
                    console.log(`✅ 图片数组，包含 ${result.images.length} 个图片`);
                    result.images.forEach((image, index) => {
                        console.log(`图片 ${index + 1}:`, Object.keys(image));
                    });
                } else {
                    console.log(`⚠️  图片数据类型: ${typeof result.images}`);
                    console.log(`图片属性:`, Object.keys(result.images));
                    
                    // 如果是对象，尝试查看其内容
                    if (typeof result.images === 'object') {
                        console.log('图片对象内容预览:');
                        Object.keys(result.images).forEach(key => {
                            const img = result.images[key];
                            console.log(`  ${key}:`, typeof img, Array.isArray(img) ? `数组长度${img.length}` : '');
                        });
                    }
                }
            } else {
                console.log('❌ 未找到图片数据');
            }
            
            // 检查样式系统
            console.log('\n🎨 样式系统分析:');
            if (result.styles) {
                console.log(`✅ 样式数据类型: ${typeof result.styles}`);
                if (typeof result.styles === 'object') {
                    console.log(`样式属性:`, Object.keys(result.styles));
                    
                    // 查看样式的具体内容
                    Object.keys(result.styles).forEach(styleKey => {
                        const style = result.styles[styleKey];
                        if (typeof style === 'object' && style !== null) {
                            console.log(`  ${styleKey}: ${Object.keys(style).length} 个属性`);
                        }
                    });
                }
            } else {
                console.log('❌ 未找到样式数据');
            }
            
            // 检查页面设置
            console.log('\n📄 页面设置分析:');
            if (result.pageSettings) {
                console.log(`✅ 页面设置类型: ${typeof result.pageSettings}`);
                console.log(`页面设置属性:`, Object.keys(result.pageSettings));
            } else {
                console.log('❌ 未找到页面设置');
            }
            
            // 检查文档属性
            console.log('\n📋 文档属性分析:');
            if (result.docProps || result.metadata || result.properties) {
                const props = result.docProps || result.metadata || result.properties;
                console.log(`✅ 文档属性类型: ${typeof props}`);
                console.log(`文档属性:`, Object.keys(props));
            } else {
                console.log('❌ 未找到文档属性');
            }
            
            console.log('\n' + '='.repeat(60) + '\n');
        }
        
        console.log('🎉 高级功能测试完成！');
        
    } catch (error) {
        console.error('❌ 测试过程中发生错误:', error);
        console.error('错误堆栈:', error.stack);
    }
}

// 运行测试
testAdvancedFeatures();
import { ActionResult } from "@/common/structure";
import Replicate from "replicate";
import fs from 'fs';
import path from 'path';

/**
 * 解析HTML内容，提取```html代码块中的内容
 * @param rawOutput 原始输出内容
 * @returns 提取的HTML内容
 */
function parseHtmlContent(rawOutput: string): string {
  // 使用正则表达式匹配```html和```之间的内容
  const htmlBlockRegex = /```html\s*([\s\S]*?)\s*```/i;
  const match = rawOutput.match(htmlBlockRegex);
  
  if (match && match[1]) {
    // 返回提取的HTML内容，去除首尾空白字符
    return match[1].trim();
  }
  
  // 如果没有找到```html代码块，返回原始内容
  console.warn('未找到HTML代码块，返回原始内容');
  return rawOutput;
}

// Replicate客户端实例
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export interface GenerateHtmlInput {
  css: string; // css 代码
  input: string; // 输入的文本
  extra?: string[]; // 额外的参数
}

/**
 * 读取指定模型的提示词文件
 * @param modelName 模型名称，对应content/prompt目录下的文件名（不含扩展名）
 * @returns 提示词内容
 */
async function readPromptFile(modelName: string): Promise<string> {
  try {
    // 构建提示词文件路径
    const promptFilePath = path.join(process.cwd(), 'content', 'prompt', `${modelName}.md`);
    
    // 检查文件是否存在
    if (!fs.existsSync(promptFilePath)) {
      throw new Error(`提示词文件不存在: ${promptFilePath}`);
    }
    
    // 读取文件内容
    const promptContent = fs.readFileSync(promptFilePath, 'utf-8');
    return promptContent;
  } catch (error) {
    console.error('读取提示词文件失败:', error);
    throw new Error(`无法读取模型 ${modelName} 的提示词文件`);
  }
}

/**
 * 使用Replicate API生成HTML内容
 * @param input 用户输入数据
 * @param modelName 模型名称，默认为'chatgpt-4o'
 * @returns 生成结果
 */
export async function generateHtmlAction(
  actionInput: GenerateHtmlInput,
  modelName: string = 'chatgpt-4o'
): Promise<ActionResult> {
  try {
    // 检查API密钥是否配置
    if (!process.env.REPLICATE_API_TOKEN) {
      return {
        success: false,
        content: 'Error: REPLICATE_API_TOKEN is not set',
      };
    }

    // 读取对应模型的提示词
    const promptTemplate = await readPromptFile(modelName);
    
    // 构建完整的提示词（将用户输入与提示词模板结合）
    const systemPrompt = promptTemplate.replace('{{CSSCode}}', actionInput.css)
      .replace('{{Input}}', actionInput.input);
    const input = {
      top_p: 1,
      prompt: systemPrompt,
      messages: [],
      temperature: 0,
    //   system_prompt: systemPrompt,
      presence_penalty: 0,
      frequency_penalty: 0,
      max_tokens: 16384
    };

    console.log('Input: ', input);
    // 使用predictions.create方法调用Replicate API，避免超时问题
    const prediction = await replicate.predictions.create({
      version: "deepseek-ai/deepseek-v3.1",
      input: input
    });

    // 轮询预测结果直到完成
    let output;
    let currentPrediction = prediction;
    while (currentPrediction.status !== "succeeded" && currentPrediction.status !== "failed") {
      // 等待1秒后再次检查状态
      await new Promise(resolve => setTimeout(resolve, 1000));
      currentPrediction = await replicate.predictions.get(currentPrediction.id);
    }

    if (currentPrediction.status === "failed") {
      throw new Error(`预测失败: ${currentPrediction.error}`);
    }

    output = currentPrediction.output;

    // 解析返回结果
    let rawOutput = '';
    if (Array.isArray(output)) {
      rawOutput = output.join('');
    } else if (typeof output === 'string') {
      rawOutput = output;
    } else {
      console.error('Unexpected output format from Replicate:', output);
      return { success: false, error: 'Unexpected output format from Replicate' };
    }
    console.log('Returns the result: ', rawOutput);
    // 解析HTML内容
    const htmlContent = parseHtmlContent(rawOutput);
    return {
      success: true,
      content: htmlContent,
    };
  } catch (error) {
    console.error('生成HTML内容失败:', error);
    return {
      success: false,
      content: `生成失败: ${error instanceof Error ? error.message : '未知错误'}`,
    };
  }
}
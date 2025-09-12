export interface ActionResult {
    success: boolean;
    error?: string; // 包含错误信息（如果失败）
    content?: string; // 包含生成的 content（如果成功）
}
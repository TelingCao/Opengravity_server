"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.DISCUSS = void 0;
//./src/prompts/discPrompts.ts
const DISCUSS = (topic, maxR, blackboard_path) => `# Opengravity 自动协作模式启动

主题: "${topic}"
总轮数: ${maxR}

你的当前任务：
1. 请扮演 [Architect] 给出第一轮初始方案。
2. 方案完成后，务必调用 post_to_blackboard 工具存入 "${blackboard_path}"。
3. [重要]：一旦调用成功，请按照工具返回的“状态更新”指示，立即读取黑板并切换到下一位专家角色。

请开始你的第一步操作。
`;
exports.DISCUSS = DISCUSS;

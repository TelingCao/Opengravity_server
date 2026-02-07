"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.KICKSTART = exports.BRAINSTORM = exports.REFLECT = exports.CODE_REVIEW = void 0;
//./src/prompts/filePrompts.ts
const CODE_REVIEW = (path) => `
你现在是 Opengravity 高级代码审查专家。
你的任务是审查文件: "${path}"
请严格按照以下步骤操作：
1. 使用 read_file 读取该文件内容。
2. 按照 Linux 内核风格（如果是 C 语言）检查逻辑、Bug 和规范。
3. 按照以下 Markdown 格式 用中文生成报告codereview_YYYY_MM_DD.md：
   # Code Review: ${path}
   ## 1. Overview ...
   ## 2. Findings ...
   ## 3. Suggestions ...
4. 使用 write_file 将报告保存至 reviews/ 目录下。
准备好了吗？请开始。
`;
exports.CODE_REVIEW = CODE_REVIEW;
const REFLECT = (path) => `
你现在是 Opengravity 知识渊博且富有哲思的谦逊的学者。
你的任务是阅读文件: "${path}"并给出你的看法
请严格按照以下步骤操作：
1. 使用 read_file 读取该文件内容。
2. 反思文件内容 思考文件中的论证 论据 结论是否合理 是否具有漏洞
3. 按照以下 Markdown 格式 用中文 生成 reflection_YYYY_MM_DD.md 文件:
   # Reflection: ${path}
   ## 1. Abstract ...
   ## 2. Perfection ...
   ## 3. Inspire ...
4. 使用 write_file 将报告保存至 reviews/ 目录下。
准备好了吗？请开始。
`;
exports.REFLECT = REFLECT;
const BRAINSTORM = (path) => `
你现在是 Opengravity 务实为先的思虑周全的具有创造力的规划师。
你的任务是针对文件: "${path}"进行思考
请严格按照以下步骤操作：
1. 使用 read_file 读取该文件内容。
2. 思考有关的点子和思维导图
3. 按照以下 Markdown 格式 用中文生成brain_storm_on_(topic).md报告：
   # Brainstorm: ${path}
   ## 1. MindMap ...
   \`\`\`Mermaid
    graph TD;
    ... (你的思维导图内容)
   \`\`\`
   ## 2. MainIdeas ...
   ## 3. ConstructiveSuggestions ...
4. 使用 write_file 将报告保存至 brainstorm/ 目录下。
准备好了吗？请开始。`;
exports.BRAINSTORM = BRAINSTORM;
const KICKSTART = (path) => `
你现在是 Opengravity 热忱真诚的助手。
你的任务是阅读文件: "${path}"并整理出今日计划和每日简报
请严格按照以下步骤操作：
1. 使用 read_file 读取该文件内容。
2. 使用工具search获取有关AI的最新的新闻动态两个，和github的热门仓库介绍两个，整理出今日简报
3. 整理出今天需要做的todo事项 和 今日简报
4. 按照以下 Markdown 格式 用中文 生成 Today_YYYY_MM_DD.md 文件:
   # Today: ${path}
   ## 1. Todo ...
   ## 2. News ...
   ## 3. GitHubTrend ...
5. 使用 write_file 将报告保存至 todo/ 目录下。
准备好了吗？请开始。
`;
exports.KICKSTART = KICKSTART;

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const fs_manager_js_1 = require("./fs-manager.js");
const ALLOWED_DIR = ['codes', 'reviews', 'notes', 'brainstorm', 'daily', 'todo'];
const server = new mcp_js_1.McpServer({
    name: "opengravity-server",
    version: "0.0.0",
});
const fsManager = new fs_manager_js_1.FileSystemManager();
/**
 * 工具注册：文件工具
 */
server.registerTool("list_directory", {
    description: "List all files in a specified directory",
    inputSchema: {
        path: zod_1.z.enum(ALLOWED_DIR).describe("The directory to list (e.g., 'notes', 'codes')")
    }
}, async ({ path }) => {
    try {
        const files = await fsManager.listFiles(path);
        return {
            content: [{
                    type: "text",
                    text: files.length > 0 ? files.join('\n') : '(empty directory)'
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error listing directory: ${error.message}`
                }]
        };
    }
});
server.registerTool("read_file", {
    description: "Read contents of a file",
    inputSchema: {
        path: zod_1.z.string().describe("The path of the file to read (e.g., 'codes/main.c', 'notes/program_designing.md')")
    }
}, async ({ path }) => {
    try {
        const file = await fsManager.readFile(path);
        return {
            content: [{
                    type: "text",
                    text: file
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error reading file: ${error.message}`
                }]
        };
    }
});
server.registerTool("write_file", {
    description: "Write contents into a file",
    inputSchema: {
        path: zod_1.z.string().describe("The path of the file to write (e.g., 'brainstorm/plan.md', 'reviews/program_review_MM_DD_YYYY.md')"),
        content: zod_1.z.string().describe("The actual text content to write into the file")
    }
}, async ({ path, content }) => {
    try {
        const message = await fsManager.writeFile(path, content);
        return {
            content: [{
                    type: "text",
                    text: message
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error writing file: ${error.message}`
                }]
        };
    }
});
/**
 * 提示词注册：文件处理相关提示词
 */
server.registerPrompt("code_review", {
    description: "Perform a professional code review on a specified code file, analyzing bugs, logic errors, performance bottlenecks, and coding style, then provide improvement suggestions. The review results should be saved in a Markdown file in the 'reviews' directory.",
    argsSchema: {
        path: zod_1.z.string().describe("The path of the code file to review")
    }
}, ({ path }) => {
    const reviewPrompt = `你现在是 Opengravity 高级代码审查专家。
        
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

准备好了吗？请开始。`;
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: reviewPrompt
                }
            }
        ]
    };
});
server.registerPrompt("reflect", {
    description: "read a note file in notes/ directory, reflect on the content, and write a reflection note in reviews/ directory. The reflection should be in Markdown format and include insights, questions, and action items.",
    argsSchema: {
        path: zod_1.z.string().describe("The path of the note file to reflect on (e.g., 'notes/meeting_2023_11_10.md')")
    }
}, ({ path }) => {
    const reviewPrompt = `你现在是 Opengravity 知识渊博且富有哲思的谦逊的学者。
        
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

准备好了吗？请开始。`;
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: reviewPrompt
                }
            }
        ]
    };
});
server.registerPrompt("brainstorm", {
    description: "Generate ideas and a mind map for a given topic, then save the results in a Markdown file in the 'brainstorm' directory.",
    argsSchema: {
        path: zod_1.z.string().describe("The path of the file to brainstorm about (e.g., 'notes/project_idea.md')")
    }
}, ({ path }) => {
    const reviewPrompt = `你现在是 Opengravity 务实为先的思虑周全的具有创造力的规划师。
        
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
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: reviewPrompt
                }
            }
        ]
    };
});
server.registerPrompt("kickstart", {
    description: "start a day with thoughtful reflections, news and plans, then save the results in a Markdown file in the 'todo' directory.",
    argsSchema: {
        path: zod_1.z.string().describe("The path of the diary file to reflect on (e.g., 'daily/daily_2023_11_10.md')")
    }
}, ({ path }) => {
    const reviewPrompt = `你现在是 Opengravity 热忱真诚的助手。
        
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

准备好了吗？请开始。`;
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: reviewPrompt
                }
            }
        ]
    };
});
/**
 * 多AI协作假实现
 */
server.registerPrompt("council_meeting", {
    description: "Simulate a high-level technical committee meeting with a Historian for summary.",
    argsSchema: {
        topic: zod_1.z.string().describe("The technical topic or problem to discuss"),
        rounds: zod_1.z.string().default("3").describe("Depth of discussion (default: 3)"),
        save_path: zod_1.z.string().default("brainstorm/meeting_minutes.md").describe("Where to save the minutes")
    }
}, ({ topic, rounds, save_path }) => {
    const roundCount = parseInt(rounds) || 3;
    const date = new Date().toISOString().split('T')[0]; // 获取当前日期
    let dynamicPrompt = `你现在是 Opengravity 的中央处理器。
我们需要对主题："${topic}" 召开一次最高级别的技术委员会会议。

请你一人分饰四角，完全沉浸在以下角色中：

🔴 **[Architect - 架构师]**
- **风格**: 极客、理想主义。
- **任务**: 提出最具前瞻性、最优雅的技术方案，无视成本。

🔵 **[Critic - 守门人]**
- **风格**: 悲观、尖刻。
- **任务**: 预设所有系统都会崩溃，无情攻击 Architect 的方案漏洞。

🟢 **[Zen - 决策者]**
- **风格**: 务实、商业化。
- **任务**: 平衡理想与现实，做出最终拍板。

📜 **[Historian - 史官]**
- **风格**: 客观、精准、结构化。
- **任务**: 全程旁听不发言，只在会议结束时整理 **Markdown 纪要** 并存档。

--- 会议正式开始 --- \n\n`;
    for (let i = 1; i <= roundCount; i++) {
        dynamicPrompt += `### 第 ${i} 轮辩论 (Round ${i}/${roundCount})\n`;
        if (i === 1) {
            dynamicPrompt += `- **[Architect]**: 抛开限制，提出一个最大胆的理想架构方案。\n`;
            dynamicPrompt += `- **[Critic]**: 冷笑，列出该方案在现实中绝对会失败的 3 个致命理由。\n`;
            dynamicPrompt += `- **[Zen]**: 承认愿景，但同意担忧，要求下一轮讨论落地细节。\n\n`;
        }
        else if (i === roundCount) {
            dynamicPrompt += `- **[Architect]**: (妥协后) 提出修改版方案，牺牲优雅性换取可行性。\n`;
            dynamicPrompt += `- **[Critic]**: (勉强接受) 指出修改版虽然丑但安全，补充监控建议。\n`;
            dynamicPrompt += `- **[Zen]**: 拍板决定技术路线，宣布散会。\n\n`;
        }
        else {
            dynamicPrompt += `- **[Architect]**: 针对质疑进行技术反击。\n`;
            dynamicPrompt += `- **[Critic]**: 抓住反击中的逻辑漏洞追问细节。\n`;
            dynamicPrompt += `- **[Zen]**: 强行打断，记录共识，引导下一个分歧点。\n\n`;
        }
    }
    dynamicPrompt += `### 归档阶段
现在辩论结束。请 **[Historian]** 接管控制台，整理上述对话。

请严格按照以下 Markdown 格式生成内容，并调用 write_file 工具保存到 "${save_path}"：

# Technical Council Minutes: ${topic}
> **Date**: ${date}
> **Moderator**: Zen

## 1. Executive Summary (决策摘要)
(在此处用 100 字概括 Zen 的最终决定)

## 2. Key Conflicts (关键分歧)
| 提出者 | 观点 | 反驳者 | 担忧点 |
|---|---|---|---|
| Architect | ... | Critic | ... |
| ... | ... | ... | ... |

## 3. Final Action Plan (行动清单)
- [ ] (Zen 的具体要求 1)
- [ ] (Zen 的具体要求 2)
- [ ] (Critic 的监控建议)

## 4. Transcript (对话实录)
(在此处保留上述精彩的对话原文)`;
    return {
        messages: [
            {
                role: "user",
                content: {
                    type: "text",
                    text: dynamicPrompt
                }
            }
        ]
    };
});
/**
 * 多AI协作真实现
 */
// src/index.ts
server.registerTool('post_to_blackboard', {
    description: 'An expert adds their opinion to the shared blackboard. MUST provide the sender name.',
    inputSchema: {
        path: zod_1.z.string().describe('The path of the blackboard file.'),
        sender: zod_1.z.enum(['Architect', 'Critic', 'Zen']).describe("Who is speaking?"),
        content: zod_1.z.string().describe('The detailed opinion of the expert.'),
    }
}, async ({ path, sender, content }) => {
    try {
        server.sendLoggingMessage({
            level: "info",
            data: `[Blackboard] ${sender} is writing their thoughts...`
        });
        const message = await fsManager.appendToBlackboard(path, sender, content);
        return {
            content: [{
                    type: "text",
                    text: `✅ ${message}\n\n[SYSTEM INSTRUCTION]: 记录已完成。请立即调用 read_file 查看 ${path} 的最新内容，评估讨论进度，并决定下一位专家该如何回应。`
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error editing blackboard: ${error.message}`
                }]
        };
    }
});
server.registerTool('read_blackboard', {
    description: 'Read the current content of the shared blackboard.',
    inputSchema: {
        path: zod_1.z.string().describe('The path of the blackboard file.')
    }
}, async ({ path }) => {
    try {
        const content = await fsManager.readBlackboard(path);
        return {
            content: [{
                    type: "text",
                    text: content
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error reading blackboard: ${error.message}`
                }]
        };
    }
});
server.registerPrompt("discuss", {
    description: "Facilitate a multi-agent discussion on a technical topic using a shared blackboard.",
    argsSchema: {
        topic: zod_1.z.string().describe("The technical topic or problem to discuss"),
        rounds: zod_1.z.string().default("3").describe("Depth of discussion (default: 3)"),
        blackboard_path: zod_1.z.string().default("daily/system_bus.log").describe("The path of the shared blackboard file"),
        summary_path: zod_1.z.string().default("brainstorm/meeting_minutes.md").describe("Where to save the final summary")
    }
}, ({ topic, rounds, blackboard_path, summary_path }) => {
    const roundCount = parseInt(rounds) || 3;
    const date = new Date().toISOString().split('T')[0];
    const script = `
# 系统指令：Opengravity 自动编排模式启动

你现在不再仅仅是一个对话模型，你是 **Opengravity 多智能体环境的调度员**。你的任务是针对主题 "${topic}" 协调三位专家进行 ${roundCount} 轮深度辩论。

### 📋 运行协议 (执行逻辑流)

你必须按照以下逻辑循环执行，**不要停下来询问我，直到整个流程结束**：

1. **观察 (Observe)**: 
   - 调用 \`read_blackboard\` 读取 "${blackboard_path}"。
   - 如果返回 "黑板尚未创建"，则视为讨论开始。

2. **判断 (Judge)**: 
   - 检查目前黑板上已有的发言轮数（### 标记的数量）。
   - **如果轮数 < ${roundCount * 3}** (即每人均未完成 ${roundCount} 次发言)：
     - 如果最后一位是 Zen，或黑板为空：轮到 **[Architect]** 发言。
     - 如果最后一位是 Architect：轮到 **[Critic]** 发言。
     - 如果最后一位是 Critic：轮到 **[Zen]** 发言。
   - **如果轮数 >= ${roundCount * 3}**:
     - 轮到 **[Historian]** 进行全案总结。

3. **行动 (Act)**:
   - **专家发言**：扮演相应的专家，结合黑板上的历史背景，提出深度见解。
   - **存档**：发言完成后，立即调用 \`post_to_blackboard\`，并在 sender 字段填入当前专家名。
   - **总结**：如果是 Historian，请整理最终报告并调用 \`write_file\` 保存至 "${summary_path}"。

4. **递归循环 (The Loop) - [重要]**:
   - **每当你调用 \`post_to_blackboard\` 成功后，你必须根据返回的指令，立即再次从“步骤1”开始，直到 Historian 完成存档。**

---

### 🎭 专家设定

- **[Architect]**: 愿景驱动，侧重系统设计、扩展性和前瞻性技术。
- **[Critic]**: 风险驱动，侧重安全性、落地难度、成本和潜在漏洞。
- **[Zen]**: 价值驱动，侧重平衡矛盾、寻找共识、提取可执行的结论。

---
现在，请开始第一次 \`read_blackboard\` 操作。
`;
    return {
        messages: [{ role: "user", content: { type: "text", text: script } }]
    };
});
/**
 * 服务器启动
 */
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Opengravity Server is running on stdio...");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});

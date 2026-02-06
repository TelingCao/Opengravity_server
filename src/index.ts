// src/index.ts
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import { FileSystemManager } from "./fs-manager.js";

const ALLOWED_DIR = ['codes', 'reviews', 'notes', 'brainstorm', 'daily', 'todo'] as const;

const server = new McpServer({
    name: "opengravity-server",
    version: "0.0.0",
});

const fsManager = new FileSystemManager();

server.registerTool(
    "list_directory",
    { 
        description: "List all files in a specified directory",
        inputSchema: {
            path: z.enum(ALLOWED_DIR).describe("The directory to list (e.g., 'notes', 'codes')") 
        }
    },
    async ({ path }) => {
        try {
            const files: string[] = await fsManager.listFiles(path);
            return {
                content: [{
                    type: "text",
                    text: files.length > 0 ? files.join('\n') : '(empty directory)'
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: `Error listing directory: ${error.message}`
                }]
            };
        }
    }
);

server.registerTool(
    "read_file",
    {
        description: "Read contents of a file",
        inputSchema: {
            path: z.string().describe("The path of the file to read (e.g., 'codes/main.c', 'notes/program_designing.md')")
        }
    },
    async ({ path }) => {
        try {
            const file: string = await fsManager.readFile(path);
            return {
                content: [{
                    type: "text",
                    text: file
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: `Error reading file: ${error.message}`
                }]
            };
        }
    }
);

server.registerTool(
    "write_file",
    {
        description: "Write contents into a file",
        inputSchema: {
            path: z.string().describe("The path of the file to write (e.g., 'brainstorm/plan.md', 'reviews/program_review_MM_DD_YYYY.md')"),
            content: z.string().describe("The actual text content to write into the file")
        }
    },
    async ({ path, content }) => {
        try {
            const message: string = await fsManager.writeFile(path, content);
            return {
                content: [{
                    type: "text",
                    text: message
                }]
            };
        } catch (error: any) {
            return {
                content: [{
                    type: "text",
                    text: `Error writing file: ${error.message}`
                }]
            };
        }
    }
);

server.registerPrompt(
    "code_review",
    {
        description: "Perform a professional code review on a specified code file, analyzing bugs, logic errors, performance bottlenecks, and coding style, then provide improvement suggestions. The review results should be saved in a Markdown file in the 'reviews' directory.",
        argsSchema: {
            path: z.string().describe("The path of the code file to review")
        }
    },
    ({ path }) => {
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
    }
);

server.registerPrompt(
    "reflect",
    {
        description: "read a note file in notes/ directory, reflect on the content, and write a reflection note in reviews/ directory. The reflection should be in Markdown format and include insights, questions, and action items.",
        argsSchema: {
            path: z.string().describe("The path of the note file to reflect on (e.g., 'notes/meeting_2023_11_10.md')")
        }
    },
    ({ path }) => {
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
    }
);

server.registerPrompt(
    "brainstorm",
    {
        description: "Generate ideas and a mind map for a given topic, then save the results in a Markdown file in the 'brainstorm' directory.",
        argsSchema: {
            path: z.string().describe("The path of the file to brainstorm about (e.g., 'notes/project_idea.md')")
        }
    },
    ({ path }) => {
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
    }
);

server.registerPrompt(
    "kickstart",
    {
        description: "start a day with thoughtful reflections, news and plans, then save the results in a Markdown file in the 'todo' directory.",
        argsSchema: {
            path: z.string().describe("The path of the diary file to reflect on (e.g., 'daily/daily_2023_11_10.md')")
        }
    },
    ({ path }) => {
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
    }
);

async function main() {
    const transport = new StdioServerTransport();

    await server.connect(transport);
  
    console.error("Opengravity Server is running on stdio...");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
#!/usr/bin/env node
"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/index.ts
const mcp_js_1 = require("@modelcontextprotocol/sdk/server/mcp.js");
const stdio_js_1 = require("@modelcontextprotocol/sdk/server/stdio.js");
const zod_1 = require("zod");
const fs_manager_js_1 = require("./fs-manager.js");
const filePrompts_js_1 = require("./prompts/filePrompts.js");
const discPrompts_js_1 = require("./prompts/discPrompts.js");
const fileTools_js_1 = require("./tools/fileTools.js");
const discTools_js_1 = require("./tools/discTools.js");
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
        path: zod_1.z.enum(fs_manager_js_1.ALLOWED_DIRECTORIES).describe("The directory to list (e.g., 'notes', 'codes')")
    }
}, async ({ path }) => (0, fileTools_js_1.LIST_DIR)(fsManager, { path }));
server.registerTool("read_file", {
    description: "Read contents of a file",
    inputSchema: {
        path: zod_1.z.string().describe("The path of the file to read (e.g., 'codes/main.c', 'notes/program_designing.md')")
    }
}, async ({ path }) => (0, fileTools_js_1.READ_FILE)(fsManager, { path }));
server.registerTool("write_file", {
    description: "Write contents into a file",
    inputSchema: {
        path: zod_1.z.string().describe("The path of the file to write (e.g., 'brainstorm/plan.md', 'reviews/program_review_MM_DD_YYYY.md')"),
        content: zod_1.z.string().describe("The actual text content to write into the file")
    }
}, async ({ path, content }) => (0, fileTools_js_1.WRITE_FILE)(fsManager, { path, content }));
/**
 * 提示词注册：文件处理相关提示词
 */
server.registerPrompt("code_review", {
    description: "Perform a professional code review on a specified code file, analyzing bugs, logic errors, performance bottlenecks, and coding style, then provide improvement suggestions. The review results should be saved in a Markdown file in the 'reviews' directory.",
    argsSchema: {
        path: zod_1.z.string().describe("The path of the code file to review")
    }
}, ({ path }) => {
    const reviewPrompt = (0, filePrompts_js_1.CODE_REVIEW)(path);
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
    const reviewPrompt = (0, filePrompts_js_1.REFLECT)(path);
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
    const reviewPrompt = (0, filePrompts_js_1.BRAINSTORM)(path);
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
    const reviewPrompt = (0, filePrompts_js_1.KICKSTART)(path);
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
 *
 */
server.registerTool('post_to_blackboard', {
    description: 'An expert adds their opinion to the shared blackboard. MUST provide the sender name.',
    inputSchema: {
        path: zod_1.z.string().describe('The path of the blackboard file.write to .cooperation/blackboard_YYYY_MM_DD.md'),
        sender: zod_1.z.enum(fs_manager_js_1.SENDER_NAMES).describe("Who is speaking?"),
        content: zod_1.z.string().describe('The detailed opinion of the expert.'),
        //maxRounds: z.string().default('3').describe('The max round number of discussion')
    }
}, async ({ path, sender, content }) => (0, discTools_js_1.POST_TO_BLACKBOARD)(fsManager, { path, sender, content }));
server.registerTool('read_blackboard', {
    description: 'Read the current content of the shared blackboard.',
    inputSchema: {
        path: zod_1.z.string().describe('The path of the blackboard file in .cooperation/blackboard_YYYY_MM_DD.md'),
        readAll: zod_1.z.boolean().default(false).describe('Whether to read full content')
    }
}, async ({ path, readAll }) => (0, discTools_js_1.READ_BLACKBOARD)(fsManager, { path, readAll }));
server.registerPrompt("discuss", {
    description: "Facilitate a multi-agent discussion on a technical topic using a shared blackboard.",
    argsSchema: {
        topic: zod_1.z.string().describe("The technical topic or problem to discuss"),
        maxRounds: zod_1.z.string().default("3").describe("Depth of discussion (default: 3)"),
        blackboard_path: zod_1.z.string().default(".cooperation/blackboard_YYYY_MM_DD.md").describe("The path of the shared blackboard file"),
        summary_path: zod_1.z.string().default("brainstorm/meeting_minutes.md").describe("Where to save the final summary")
    }
}, async ({ topic, maxRounds, blackboard_path }) => {
    const maxR = parseInt(maxRounds) || 3;
    await fsManager.saveState({
        topic: topic,
        rounds: 1,
        maxRounds: maxR,
        lastSender: null,
        nextSender: 'Architect',
        isFinished: false
    });
    const script = (0, discPrompts_js_1.DISCUSS)(topic, maxR, blackboard_path);
    return {
        messages: [{ role: "user", content: { type: "text", text: script } }]
    };
});
/**
 * 服务器启动
 */
async function main() {
    await fsManager.initEnvironment();
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Opengravity Server is running on stdio...");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});

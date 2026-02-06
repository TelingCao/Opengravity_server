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
async function main() {
    const transport = new stdio_js_1.StdioServerTransport();
    await server.connect(transport);
    console.error("Opengravity Server is running on stdio...");
}
main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});

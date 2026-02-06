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

async function main() {
    const transport = new StdioServerTransport();

    await server.connect(transport);
  
    console.error("Opengravity Server is running on stdio...");
}

main().catch((error) => {
    console.error("Fatal error in main():", error);
    process.exit(1);
});
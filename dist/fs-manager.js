"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemManager = void 0;
// src/fs-manager.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const PROJECT_ROOT = path_1.default.resolve(__dirname, '..');
const PERMISSIONS = {
    'codes': 'read',
    'reviews': 'write',
    'notes': 'read',
    'brainstorm': 'write',
    'daily': 'read',
    'todo': 'write',
    '.coopration': 'write'
};
class FileSystemManager {
    validatePath(virtualPath, allowWrite) {
        const normalizedPath = path_1.default.normalize(virtualPath);
        const parts = normalizedPath.split(path_1.default.sep);
        const rootDir = parts[0];
        if (!(rootDir in PERMISSIONS)) {
            throw new Error(`Access denied: Directory '${rootDir}' is not managed.`);
        }
        if (allowWrite && PERMISSIONS[rootDir] === 'read') {
            throw new Error(`Permission denied: '${rootDir}' is READ-ONLY.`);
        }
        const absolutePath = path_1.default.resolve(PROJECT_ROOT, normalizedPath);
        if (!absolutePath.startsWith(PROJECT_ROOT)) {
            throw new Error(`Security violation: Path traversal detected.`);
        }
        return absolutePath;
    }
    async listFiles(virtualDir) {
        const fullPath = this.validatePath(virtualDir, false);
        try {
            const dirents = await promises_1.default.readdir(fullPath, { withFileTypes: true });
            return dirents.map(dirent => dirent.name);
        }
        catch (error) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }
    async readFile(virtualPath) {
        const fullPath = this.validatePath(virtualPath, false);
        return await promises_1.default.readFile(fullPath, 'utf-8');
    }
    async writeFile(virtualPath, content) {
        const fullPath = this.validatePath(virtualPath, true);
        await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
        await promises_1.default.writeFile(fullPath, content, 'utf-8');
        return `Successfully wrote to ${virtualPath}`;
    }
    /**
     * coopration
     * @param virtualPath
     * @param sender
     * @param content
     * @returns
     */
    async appendToBlackboard(virtualPath, sender, content) {
        const fullPath = this.validatePath(virtualPath, true);
        const timestamp = new Date().toLocaleTimeString();
        const formattedEntry = `\n---\n### [${timestamp}] ${sender}:\n${content}\n`;
        await promises_1.default.appendFile(fullPath, formattedEntry, 'utf-8');
        return `Successfully added to blackboard.`;
    }
    async readBlackboard(virtualPath) {
        try {
            const rawText = await this.readFile(virtualPath);
            const allBlocks = rawText.split('###').map(b => b.trim()).filter(b => b !== "");
            if (allBlocks.length === 0)
                return "The blackboard is now empty";
            const lastBlocks = allBlocks.slice(-3);
            return lastBlocks.map(block => `### ${block}`).join('\n\n');
        }
        catch (error) {
            return "the blackboard hasnt been established, waiting for the first expert.";
        }
    }
}
exports.FileSystemManager = FileSystemManager;

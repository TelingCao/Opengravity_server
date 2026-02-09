"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemManager = exports.SENDER_NAMES = exports.ALLOWED_DIRECTORIES = exports.PROJECT_ROOT = void 0;
// src/fs-manager.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const userProvidedPath = process.argv[2] || process.env.OPENGRAVITY_DIR;
exports.PROJECT_ROOT = userProvidedPath
    ? path_1.default.resolve(userProvidedPath)
    : path_1.default.resolve(__dirname, '..');
console.error(`🏠 Opengravity Workspace Root: ${exports.PROJECT_ROOT}`);
exports.ALLOWED_DIRECTORIES = [
    'codes', 'reviews', 'notes', 'brainstorm', 'daily', 'todo', '.cooperation', '.state'
];
exports.SENDER_NAMES = ['Architect', 'Critic', 'Zen', 'Historian'];
const PERMISSIONS = {
    'codes': 'read',
    'reviews': 'write',
    'notes': 'read',
    'brainstorm': 'write',
    'daily': 'read',
    'todo': 'write',
    '.cooperation': 'write',
    '.state': 'read'
};
class FileSystemManager {
    async initEnvironment() {
        console.error("🛠️  Initializing Opengravity environment...");
        try {
            for (const dir of exports.ALLOWED_DIRECTORIES) {
                const fullPath = path_1.default.resolve(exports.PROJECT_ROOT, dir);
                await promises_1.default.mkdir(fullPath, { recursive: true });
            }
            await promises_1.default.mkdir(path_1.default.dirname(this.stateFilePath), { recursive: true });
            console.error("✅ Environment ready.");
        }
        catch (error) {
            console.error(`❌ Initialization failed: ${error.message}`);
            process.exit(1);
        }
    }
    async ensureDirAndWrite(fullPath, content, append = false) {
        await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
        if (append) {
            await promises_1.default.appendFile(fullPath, content, 'utf-8');
        }
        else {
            await promises_1.default.writeFile(fullPath, content, 'utf-8');
        }
    }
    validatePath(virtualPath, allowWrite) {
        const absolutePath = path_1.default.resolve(exports.PROJECT_ROOT, virtualPath);
        const relative = path_1.default.relative(exports.PROJECT_ROOT, absolutePath);
        if (relative.startsWith('..') || path_1.default.isAbsolute(relative)) {
            throw new Error(`Security Violation: ${virtualPath}`);
        }
        const rootDir = relative.split(path_1.default.sep)[0];
        if (!(rootDir in PERMISSIONS)) {
            throw new Error(`Access Denied: Directory '${rootDir}' is not allowed`);
        }
        if (allowWrite && PERMISSIONS[rootDir] === 'read') {
            throw new Error(`Permission Denied: Directory '${rootDir}' is READ-ONLY`);
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
        await this.ensureDirAndWrite(fullPath, content);
        return `Successfully wrote to ${virtualPath}`;
    }
    /**
     * cooperation
     * @param virtualPath
     * @param sender
     * @param content
     * @returns
     */
    async appendToBlackboard(virtualPath, sender, content) {
        const fullPath = this.validatePath(virtualPath, true);
        const timestamp = new Date().toLocaleTimeString();
        const formattedEntry = `\n---\n### [${timestamp}] ${sender}:\n${content}\n`;
        await this.ensureDirAndWrite(fullPath, formattedEntry, true);
        return `Successfully added to blackboard.`;
    }
    async readBlackboard(virtualPath, readAll = false) {
        try {
            const rawText = await this.readFile(virtualPath);
            const allBlocks = rawText.split('###').map(b => b.trim()).filter(b => b !== "");
            if (allBlocks.length === 0)
                return "The blackboard is now empty";
            if (readAll) {
                return rawText;
            }
            else {
                const lastBlocks = allBlocks.slice(-3);
                return lastBlocks.map(block => `### ${block}`).join('\n\n');
            }
        }
        catch (error) {
            return "the blackboard hasnt been established, waiting for the first expert.";
        }
    }
    stateFilePath = path_1.default.join(exports.PROJECT_ROOT, '.state/.opengravity_state.json');
    async saveState(state) {
        const data = JSON.stringify(state, null, 2);
        await this.ensureDirAndWrite(this.stateFilePath, data);
    }
    async loadState() {
        try {
            const data = await promises_1.default.readFile(this.stateFilePath, 'utf-8');
            return JSON.parse(data);
        }
        catch (error) {
            return {
                topic: "未定义",
                rounds: 0,
                maxRounds: 3,
                lastSender: null,
                nextSender: 'Architect',
                isFinished: false
            };
        }
    }
}
exports.FileSystemManager = FileSystemManager;

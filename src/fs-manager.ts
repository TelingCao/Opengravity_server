// src/fs-manager.ts
import fs from 'fs/promises';
import path from 'path';

const userProvidedPath = process.argv[2] || process.env.OPENGRAVITY_DIR;

// 如果用户传了路径，解析为绝对路径；否则用 cwd
export const PROJECT_ROOT = userProvidedPath 
    ? path.resolve(userProvidedPath) 
    : path.resolve(__dirname, '..');

// 为了调试和录视频，强烈建议在加载时打印出来
console.error(`🏠 Opengravity Workspace Root: ${PROJECT_ROOT}`);

//const PROJECT_ROOT = path.resolve(__dirname, '..');
// const PROJECT_ROOT = process.cwd();

export const ALLOWED_DIRECTORIES = [
    'codes', 'reviews', 'notes', 'brainstorm', 'daily', 'todo', '.cooperation', '.state'
] as const;
export type AllowedDirectory = (typeof ALLOWED_DIRECTORIES)[number];

export const SENDER_NAMES = ['Architect', 'Critic', 'Zen', 'Historian'] as const;
export type Senders = (typeof SENDER_NAMES)[number];

const PERMISSIONS: Record<AllowedDirectory, 'read' | 'write'> = {
    'codes'       : 'read',
    'reviews'     : 'write',
    'notes'       : 'read',
    'brainstorm'  : 'write',
    'daily'       : 'read',
    'todo'        : 'write',
    '.cooperation': 'write',
    '.state'      : 'read'
};


interface DiscussionState {
    topic: string;
    rounds: number;
    maxRounds: number;
    lastSender: Senders | null;
    nextSender: Senders | null;
    isFinished: boolean;
}

export class FileSystemManager {

    async initEnvironment() {
        console.error("🛠️  Initializing Opengravity environment...");
        try {
            for (const dir of ALLOWED_DIRECTORIES) {
                const fullPath = path.resolve(PROJECT_ROOT, dir);
                await fs.mkdir(fullPath, { recursive: true });
            }
            await fs.mkdir(path.dirname(this.stateFilePath), { recursive: true });
            console.error("✅ Environment ready.");
        } catch (error: any) {
            console.error(`❌ Initialization failed: ${error.message}`);
            process.exit(1);
        }
    }

    private async ensureDirAndWrite(fullPath: string, content: string, append: boolean = false) {
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        if (append) {
            await fs.appendFile(fullPath, content, 'utf-8');
        } else {
            await fs.writeFile(fullPath, content, 'utf-8');
        }
    }

    private validatePath(virtualPath: string, allowWrite: boolean): string {
        const absolutePath = path.resolve(PROJECT_ROOT, virtualPath);
        const relative = path.relative(PROJECT_ROOT, absolutePath);
        if (relative.startsWith('..') || path.isAbsolute(relative)) {
            throw new Error(`Security Violation: ${virtualPath}`);
        }
        const rootDir = relative.split(path.sep)[0] as AllowedDirectory;
        if (!(rootDir in PERMISSIONS)) {
            throw new Error(`Access Denied: Directory '${rootDir}' is not allowed`);
        }
        if (allowWrite && PERMISSIONS[rootDir] === 'read') {
            throw new Error(`Permission Denied: Directory '${rootDir}' is READ-ONLY`);
        }
        return absolutePath;
    }

    
    async listFiles(virtualDir:AllowedDirectory): Promise<string[]> {
        const fullPath = this.validatePath(virtualDir, false);
        try {
            const dirents = await fs.readdir(fullPath, { withFileTypes: true });
            return dirents.map(dirent => dirent.name);
        } catch (error: any) {
            if (error.code === 'ENOENT') {
                return [];
            }
            throw error;
        }
    }

    async readFile(virtualPath: string): Promise<string> {
        const fullPath = this.validatePath(virtualPath, false);
        return await fs.readFile(fullPath, 'utf-8');
    }

    async writeFile(virtualPath: string, content: string): Promise<string> {
        const fullPath = this.validatePath(virtualPath, true);
        await this.ensureDirAndWrite(fullPath, content,);
        return `Successfully wrote to ${virtualPath}`;
    }

    /**
     * cooperation
     * @param virtualPath 
     * @param sender 
     * @param content 
     * @returns 
     */

    async appendToBlackboard(virtualPath: string, sender:Senders, content: string): Promise<string> {
        const fullPath = this.validatePath(virtualPath, true);
        const timestamp = new Date().toLocaleTimeString();
        const formattedEntry = `\n---\n### [${timestamp}] ${sender}:\n${content}\n`;
        await this.ensureDirAndWrite(fullPath, formattedEntry, true);
        return `Successfully added to blackboard.`;
    }

    async readBlackboard(virtualPath: string, readAll: boolean = false): Promise<string> {
        try {
            const rawText = await this.readFile(virtualPath);
            const allBlocks = rawText.split('###').map(b => b.trim()).filter(b => b !== "");
            if (allBlocks.length === 0) return "The blackboard is now empty";
            if (readAll) {
                return rawText;
            } else {
                const lastBlocks = allBlocks.slice(-3);
                return lastBlocks.map(block => `### ${block}`).join('\n\n');
            }
        } catch (error: any) {
            return "the blackboard hasnt been established, waiting for the first expert.";
        }
    }

    private stateFilePath = path.join(PROJECT_ROOT, '.state/.opengravity_state.json');

    async saveState(state: DiscussionState): Promise<void> {
        const data = JSON.stringify(state, null, 2);
        await this.ensureDirAndWrite(this.stateFilePath, data);
    }

    async loadState(): Promise<DiscussionState> {
        try {
            const data = await fs.readFile(this.stateFilePath, 'utf-8');
            return JSON.parse(data);
        } catch (error) {
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
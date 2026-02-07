// src/fs-manager.ts
import fs from 'fs/promises';
import path from 'path';

const PROJECT_ROOT = path.resolve(__dirname, '..');

export type AllowedDirectory = 'codes' | 'reviews' | 'notes' | 'brainstorm' | 'daily' | 'todo' | '.coopration';
export type Senders = 'Architect' | 'Critic' | 'Zen';

const PERMISSIONS: Record<AllowedDirectory, 'read' | 'write'> = {
    'codes'     : 'read',
    'reviews'   : 'write',
    'notes'     : 'read',
    'brainstorm': 'write',
    'daily'     : 'read',
    'todo'      : 'write',
    '.coopration': 'write'
};

export class FileSystemManager {

    private validatePath(virtualPath: string, allowWrite: boolean): string {
        const normalizedPath = path.normalize(virtualPath);

        const parts = normalizedPath.split(path.sep);
        const rootDir = parts[0] as AllowedDirectory;

        if (!(rootDir in PERMISSIONS)) {
            throw new Error(`Access denied: Directory '${rootDir}' is not managed.`);
        }

        if (allowWrite && PERMISSIONS[rootDir] === 'read') {
            throw new Error(`Permission denied: '${rootDir}' is READ-ONLY.`);
        }

        const absolutePath = path.resolve(PROJECT_ROOT, normalizedPath);

        if (!absolutePath.startsWith(PROJECT_ROOT)) {
            throw new Error(`Security violation: Path traversal detected.`);
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
        await fs.mkdir(path.dirname(fullPath), { recursive: true });
        await fs.writeFile(fullPath, content, 'utf-8');
        return `Successfully wrote to ${virtualPath}`;
    }

    /**
     * coopration
     * @param virtualPath 
     * @param sender 
     * @param content 
     * @returns 
     */

    async appendToBlackboard(virtualPath: string, sender:Senders, content: string): Promise<string> {
        const fullPath = this.validatePath(virtualPath, true);
        const timestamp = new Date().toLocaleTimeString();
        const formattedEntry = `\n---\n### [${timestamp}] ${sender}:\n${content}\n`;
        await fs.appendFile(fullPath, formattedEntry, 'utf-8');
        return `Successfully added to blackboard.`;
    }

    async readBlackboard(virtualPath: string): Promise<string> {
        try {
            const rawText = await this.readFile(virtualPath);
            const allBlocks = rawText.split('###').map(b => b.trim()).filter(b => b !== "");
            if (allBlocks.length === 0) return "The blackboard is now empty";
            const lastBlocks = allBlocks.slice(-3);
            return lastBlocks.map(block => `### ${block}`).join('\n\n');
        } catch (error: any) {
            return "the blackboard hasnt been established, waiting for the first expert.";
        }
    }
}
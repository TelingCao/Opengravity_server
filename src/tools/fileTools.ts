//./src/tools/fileTools.ts
import { AllowedDirectory, FileSystemManager } from "../fs-manager.js";

//const fsManager = new FileSystemManager();

export const LIST_DIR = async (fsManager: FileSystemManager, { path }: { path: AllowedDirectory }) => {
    try {
        const files: string[] = await fsManager.listFiles(path);
        return {
            content: [{
                type: "text" as const,
                text: files.length > 0 ? files.join('\n') : '(empty directory)'
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error listing directory: ${error.message}`
            }]
        };
    }
};

export const READ_FILE = async (fsManager: FileSystemManager, { path }: {path: string}) => {
    try {
        const file: string = await fsManager.readFile(path);
        return {
            content: [{
                type: "text" as const,
                text: file
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error reading file: ${error.message}`
            }]
        };
    }
};

export const WRITE_FILE = async (fsManager: FileSystemManager, { path, content }: {path: string, content: string}) => {
    try {
        const message: string = await fsManager.writeFile(path, content);
        return {
            content: [{
                type: "text" as const,
                text: message
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error writing file: ${error.message}`
            }]
        };
    }
};


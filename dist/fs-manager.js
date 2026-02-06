"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.FileSystemManager = void 0;
// src/fs-manager.ts
const promises_1 = __importDefault(require("fs/promises"));
const path_1 = __importDefault(require("path"));
const PROJECT_ROOT = path_1.default.resolve(__dirname, '..'); // 获取项目根目录
const PERMISSIONS = {
    'codes': 'read',
    'reviews': 'write',
    'notes': 'read',
    'brainstorm': 'write',
    'daily': 'read',
    'todo': 'write'
};
class FileSystemManager {
    /**
     * 核心方法: 验证路径安全性并返回绝对路径
     * @param virtualPath AI 传入的路径 (如 "codes/main.c")
     * @param allowWrite 是否需要写入权限
     */
    validatePath(virtualPath, allowWrite) {
        // 1. 安全标准化: 去除路径中的 '..' 防止目录遍历攻击
        // 提示: 使用 path.normalize
        const normalizedPath = path_1.default.normalize(virtualPath);
        // 2. 提取根目录名: 拿到路径的第一段 (比如 "codes")
        // 提示: 使用 path.sep 进行分割
        const parts = normalizedPath.split(path_1.default.sep);
        const rootDir = parts[0]; // 强制断言为 AllowedDirectory 类型
        // 检查 3.1: 这个 rootDir 是否在我们的 PERMISSIONS 表里？如果不在，抛出 Error。
        if (!(rootDir in PERMISSIONS)) {
            throw new Error(`Access denied: Directory '${rootDir}' is not managed.`);
        }
        // 检查 3.2: 如果当前操作要求写入 (allowWrite 为 true)，但该目录权限是 'read'，怎么办？
        if (allowWrite && PERMISSIONS[rootDir] === 'read') {
            throw new Error(`Permission denied: '${rootDir}' is READ-ONLY.`);
        }
        // 3. 构建绝对路径 (帮你写好了)
        const absolutePath = path_1.default.resolve(PROJECT_ROOT, normalizedPath);
        // 检查 3.3: 最终检查 (防止这一层漏网之鱼)
        // 确保 absolutePath 依然是以 PROJECT_ROOT 开头的
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
        // [TODO: 这里应该传 true 还是 false?]
        const fullPath = this.validatePath(virtualPath, true);
        // 确保父目录存在
        await promises_1.default.mkdir(path_1.default.dirname(fullPath), { recursive: true });
        await promises_1.default.writeFile(fullPath, content, 'utf-8');
        return `Successfully wrote to ${virtualPath}`;
    }
}
exports.FileSystemManager = FileSystemManager;

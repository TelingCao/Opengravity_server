"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// src/test-fs.ts
const fs_manager_1 = require("./fs-manager");
async function runTests() {
    const fsManager = new fs_manager_1.FileSystemManager();
    console.log("🚀 开始测试文件系统管家...");
    // 测试 1: 写入测试 (应该成功)
    try {
        console.log("1. 尝试写入 todo/hello.md...");
        await fsManager.writeFile('todo/hello.md', '# Hello from Test Script');
        console.log("✅ 写入成功！");
    }
    catch (error) {
        console.error("❌ 写入失败:", error.message);
    }
    // 测试 2: 越权写入 (应该失败)
    try {
        console.log("\n2. 尝试写入 codes/hack.js (预期被拒绝)...");
        await fsManager.writeFile('codes/hack.js', 'alert("hacked")');
        console.log("❌ 失败：竟然写入成功了，权限控制有漏洞！");
    }
    catch (error) {
        console.log("✅ 拦截成功:", error.message);
    }
    // 测试 3: 路径遍历攻击 (应该失败)
    try {
        console.log("\n3. 尝试读取系统密码文件 (预期被拦截)...");
        // 尝试访问项目之外的文件
        await fsManager.readFile('../package.json');
        console.log("❌ 失败：竟然读到了外部文件！");
    }
    catch (error) {
        console.log("✅ 拦截成功:", error.message);
    }
}
runTests();

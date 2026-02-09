//./src/tools/discTools.ts
import { Senders, FileSystemManager } from "../fs-manager.js";
//const fsManager = new FileSystemManager();

// src/tools/discTools.ts

export const POST_TO_BLACKBOARD = async (fsManager: FileSystemManager, { path, sender, content }: { path: string, sender: Senders, content: string }) => {
    try {
        const currentState = await fsManager.loadState();
        if (currentState.nextSender && sender !== currentState.nextSender) {
            return {
                isError: true,
                content: [{
                    type: "text" as const,
                    text: `❌ 协议错误 (Protocol Violation):\n当前是 [${currentState.nextSender}] 的发言回合。\n你试图使用 [${sender}] 发言被系统拦截。\n请立即切换角色为 [${currentState.nextSender}] 并重试。`
                }]
            };
        }
        await fsManager.appendToBlackboard(path, sender, content);

        const limit = currentState.maxRounds; 
        let next: any = 'Architect'; 
        let isFinished = false;
        let currentRound = currentState.rounds;
        if (sender === 'Architect') {
            if (currentRound > limit) {
                next = 'Historian';
            } else {
                next = 'Critic';
            }
        } else if (sender === 'Critic') { 
            next = 'Zen';
        } else if (sender === 'Zen') {
            if (currentRound >= limit) {
                next = 'Architect';
                currentRound++; 
            } else {
                next = 'Architect';
                currentRound++;
            }
        } else if (sender === 'Historian') {
            next = null;
            isFinished = true;
        }
        await fsManager.saveState({
            ...currentState,
            rounds: currentRound,
            lastSender: sender,
            nextSender: next,
            isFinished: isFinished
        });
        let instruction = `请立即调用 read_blackboard 获取最新进展并发表你的看法。`;
        if (next === 'Architect' && currentRound > limit) {
            instruction = `[重要指令]: 辩论已结束。进入最终实施阶段。\n请作为 [Architect] 根据 Zen 的决议，编写并使用 write_file 生成所有代码文件。\n代码生成完毕后，再次调用 post_to_blackboard 汇报完成。`;
        } else if (next === 'Historian') {
            instruction = `[重要指令]: 开发已完成。\n请作为 [Historian] 调用 read_blackboard(readAll=true) 并整理最终文档。`;
        }

        return {
            content: [{
                type: "text" as const,
                text: `发言已记录，但讨论没有结束，如果你现在结束discuss将被视为失职。\n[状态更新]: 下一位发言人是: ${next}。当前轮数：${currentRound}.\n[指令]: 如果你是 ${next}，${instruction}`
            }]
        };

    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error editing blackboard: ${error.message}`
            }]
        };
    }
};

export const READ_BLACKBOARD = async (fsManager: FileSystemManager, { path, readAll=false }: { path: string, readAll: boolean }) => {
    try {
        const state = await fsManager.loadState()
        let content = await fsManager.readBlackboard(path, readAll);
        const header = `### 当前系统状态 ###
- 正在讨论主题：${state.topic}
- 当前轮次：${state.rounds}
- 上一位发言人：${state.lastSender}
- 当前发言人：${state.nextSender}`
        return {
            content: [{
                type: "text" as const,
                text: header+content
            }]
        };
    } catch (error: any) {
        return {
            content: [{
                type: "text" as const,
                text: `Error reading blackboard: ${error.message}`
            }]
        };
    }
}
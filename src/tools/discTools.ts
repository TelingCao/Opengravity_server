//./src/tools/discTools.ts
import { Senders, FileSystemManager } from "../fs-manager.js";
//const fsManager = new FileSystemManager();

export const POST_TO_BLACKBOARD = async (fsManager: FileSystemManager, { path, sender, content, maxRounds }: { path: string, sender: Senders, content: string, maxRounds: string}) => {
    try {
        await fsManager.appendToBlackboard(path, sender, content);

        const currentState = await fsManager.loadState();

        let next: any = 'Architect'; 
        let isFinished = false;
        let currentRound = currentState.rounds;

        if (sender === 'Architect') {
            next = 'Critic';
        } else if (sender === 'Critic') { 
            next = 'Zen';
        } else if (sender === 'Zen') {
            const limit = parseInt(maxRounds) || 3;
            if (currentRound >= limit) {
                next = 'Historian';
                isFinished = true;
            } else {
                next = 'Architect';
                currentRound++;
            }
        } else if (sender === 'Historian') {
            next = null;
            isFinished = true;
        }
        await fsManager.saveState({
            topic: currentState.topic,
            rounds: currentRound,
            maxRounds: parseInt(maxRounds) || 3,
            lastSender: sender as any,
            nextSender: next,
            isFinished: isFinished
        });
        return {
            content: [{
                type: "text" as const,
                text: `发言已记录。
[状态更新]: 下一位发言人是: ${next}。
[指令]: 如果你是 ${next}，请立即调用 read_blackboard 获取最新进展并发表你的看法。`
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

export const READ_BLACKBOARD = async (fsManager: FileSystemManager, { path }: { path: string}) => {
    try {
        const state = await fsManager.loadState()
        const content = await fsManager.readBlackboard(path);
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
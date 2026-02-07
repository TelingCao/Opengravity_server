"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.READ_BLACKBOARD = exports.POST_TO_BLACKBOARD = void 0;
//const fsManager = new FileSystemManager();
const POST_TO_BLACKBOARD = async (fsManager, { path, sender, content }) => {
    try {
        await fsManager.appendToBlackboard(path, sender, content);
        const currentState = await fsManager.loadState();
        const limit = currentState.maxRounds;
        let next = 'Architect';
        let isFinished = false;
        let currentRound = currentState.rounds;
        if (sender === 'Architect') {
            next = 'Critic';
        }
        else if (sender === 'Critic') {
            next = 'Zen';
        }
        else if (sender === 'Zen') {
            if (currentRound >= limit) {
                next = 'Historian';
                isFinished = true;
            }
            else {
                next = 'Architect';
                currentRound++;
            }
        }
        else if (sender === 'Historian') {
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
        return {
            content: [{
                    type: "text",
                    text: `发言已记录。
[状态更新]: 下一位发言人是: ${next}。
[指令]: 如果你是 ${next}，请立即调用 read_blackboard 获取最新进展并发表你的看法。
[指令]: 如果你是 Historian，请立即调用 read_blackboard 并设置 readAll 为 true 以获取完整纪要并进行总结。`
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error editing blackboard: ${error.message}`
                }]
        };
    }
};
exports.POST_TO_BLACKBOARD = POST_TO_BLACKBOARD;
const READ_BLACKBOARD = async (fsManager, { path, readAll = false }) => {
    try {
        const state = await fsManager.loadState();
        let content = await fsManager.readBlackboard(path, readAll);
        const header = `### 当前系统状态 ###
- 正在讨论主题：${state.topic}
- 当前轮次：${state.rounds}
- 上一位发言人：${state.lastSender}
- 当前发言人：${state.nextSender}`;
        return {
            content: [{
                    type: "text",
                    text: header + content
                }]
        };
    }
    catch (error) {
        return {
            content: [{
                    type: "text",
                    text: `Error reading blackboard: ${error.message}`
                }]
        };
    }
};
exports.READ_BLACKBOARD = READ_BLACKBOARD;

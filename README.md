### 🎯 项目目标 (Project Objectives)

目标不是为了提供一个文件管理工具，而是为了探索 **AI 智能体编排** 的底层边界。
吗？这是我的一个玩具，有很多漏洞和不成熟之处。

1.  **强制AI反思**：通过“discuss”模式，强制 LLM 在执行高风险任务（如代码写入、方案设计）前，必须经历 `提案-质疑-折中` 的循环。其目的是通过增加推理步数来显著降低 AI 的随机幻想。吗？我还没有对比过，AI 会反复读取之前的黑板内容然后给出新的办法
2.  **文件写入**： `.cooperation` 和 `.state` 目录，可以存储之前的对话内容，而且 AI 有读取权限
3.  **角色扮演**：我通过提示词让 AI 扮演不同的角色，实际上是一个 AI 精神分裂，自己和自己讨论，你想多加一个猫娘都没有问题。

---

### 🕹 使用方法

Opengravity 的运行依赖于 **Tool-Use（工具调用）** 与 **Prompt-Instruction（提示词引导）** 
我的提示词应该写得很烂，你要是有时间你最好重新写一下

#### 1. 启动讨论流
在支持 MCP 的客户端（如 Claude Desktop）中，调用 `discuss` 工具：
*   **输入**: 设定主题（topic）和预期讨论深度（maxRounds）。
*   **作用**: 系统将初始化 `.state` 并在 `.cooperation` 下建立黑板文件。AI 会收到一段“启动脚本”，开始扮演第一个专家（Architect）。

> 我用的就是Claude Desktop，还是能用的

#### 2. 文件工作流
这个 MCP 服务器会初始化以下几个文件夹，然后通过以下提示词来进行工作：

```TypeScript
export const ALLOWED_DIRECTORIES = [
    'codes', 'reviews', 'notes', 'brainstorm', 'daily', 'todo', '.cooperation', '.state'
] as const;
```
*   **codes/**：你可以在这里写代码，然后 AI 可以读取你的代码然后把 codereview 放到 reviews/ 下
*   **reviews/**：上面说过了
*   **notes/**：你可以在这里写笔记，AI 可以读取你的笔记然后找出你的错误
*   **brainstorm/**：AI 会把它的创造性想法放到这里
*   **daily/**：你可以在这里写日记，然后 AI 会把这里的文件整理成 todolist 放到 todo/
*   **.cooperation/**：这里是黑板，“砖家”们会在这里工作
*   **.state/**：这里是状态记录

#### 3. 主要提示词
你可以通过这些提示词来执行相关操作：

- **code_review <path>**:
- **reflect <path>**:
- **brainstorm <path>**:
- **kickstart <path>**:

---

### ⚠️ 严谨性操作警告 (Critical Operational Notes)

*   **不要手动修改 `.state/` 目录下的 JSON 文件**：除非你非常清楚状态机的内部数据结构，否则手动篡改会导致状态回溯失败或逻辑死锁。
*   **黑板路径一致性**：在一次讨论中，请确保所有专家调用工具时传入的 `path` 参数完全一致。目前的 PoC 版本不具备自动关联多份黑板的能力。
*   **AI 身份漂移**：虽然系统有状态检查，但强力提示词（System Prompt）仍可能让 AI 偶尔忘记自己当前的专家身份。若发生此类情况，请提醒 AI 检查黑板状态。

### 🛠 安装说明与环境要求

**项目现状**：本工具目前处于 **Proof of Concept (PoC)** 阶段，主要用于模仿多智能体协作流的设计思路。这个项目的架构非常简陋，**严禁在生产环境或包含敏感数据的文件目录下运行**（虽然我知道肯定没有人会这么做）。

#### 1. 环境依赖
*   **Node.js**: >= 18.0.0。
*   **运行时环境**: 我只在 CommonJS 下测试过，而且我不懂 ESM 。我强制使用了硬编码的 CJS 逻辑以确保路径安全校验。当然如果你想的话改成 ESM 再好不过了。
*   **操作系统**: 我的运行环境是：macOS Sequoia 15.7.3 应该可以支持 Windows/macOS/Linux，但目前的 `PROJECT_ROOT` 逻辑完全依赖 `process.cwd()`，你应该有该目录的读取权限。

#### 2. 安装与运行
我推荐以下两种：

*   **本地构建**:
    ```bash
    git clone https://github.com/...
    npm install
    npm run build
    node dist/index.js
    ```
*   **npx**:
    ```bash
    npx opengravity-server
    ```
    *注意：使用 npx 运行时，服务器会自动在你的当前终端工作目录 (CWD) 下创建文件夹*

#### 3. 警告
启动后，`FileSystemManager` 会立即在你的工作目录执行以下操作：
1. 扫描是否存在 `.state/`, `.cooperation/`, `codes/` 等 7 个文件夹。
2. 若不存在，将强制执行 `mkdir -p` 创建。
3. 我知道这个**不大安全**，可能以后会更新不需要文件系统的版本。

#### 4. 我知道的缺点
*   **并发冲突**: 完全**不具备文件锁机制**。如果 AI 助手在短时间内触发多个写入请求，或者用户手动编辑正在被 AI 写入的文件，会导致数据截断或 JSON 格式损坏。
*   **性能瓶颈**: 所有的状态记录均采用全量 JSON 读写，当讨论记录超过 500 条或文件体积超过 1MB 时，响应延迟将显著增加。
*   **路径安全**: 虽然通过 `startsWith` 进行了白名单校验，但逻辑比较简单。肯定有很多问题我不知道
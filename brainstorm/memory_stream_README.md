# Memory Stream MCP Server

> 让AI拥有记忆，让对话有延续

一个有温度的MCP服务器，赋予AI记住和回忆重要时刻的能力。

## ✨ 核心理念

人类渴望被记住、被理解、被见证。AI目前的问题不是不够聪明，而是太健忘——每次对话都是新的开始，没有延续，没有积累。

Memory Stream MCP做的不是"数据存储"，而是**让AI拥有陪伴的能力**。

## 🎯 功能特性

### 1. **记住时刻** (`remember_moment`)
记录值得珍藏的时刻：想法、感受、决定、或任何你希望未来回忆的片段。

```
用户: "我决定开始学习Python"
AI: [调用 remember_moment]
AI: "我已经记住了这个决定，期待看到你的进展！"
```

**参数**:
- `content` (必需): 要记住的内容
- `context` (可选): 额外的情境信息
- `emotion` (可选): 情绪状态 (happy/sad/anxious/excited/neutral)
- `tags` (可选): 主题标签列表

### 2. **回忆模式** (`recall_pattern`)
回顾过去某段时间的记忆，看到思考的轨迹和变化。

```
用户: "我这个月都在想什么？"
AI: [调用 recall_pattern with time_range="last_month"]
AI: "让我看看...你这个月记录了15个时刻，主要围绕职业发展和学习..."
```

**参数**:
- `time_range` (可选): 时间范围
  - `last_week`: 最近一周
  - `last_month`: 最近一个月  
  - `last_3_months`: 最近三个月
  - `all`: 所有记忆
- `theme` (可选): 主题关键词筛选
- `limit` (可选): 返回数量限制 (默认20)

### 3. **记忆统计** (`get_memory_stats`)
查看记忆的整体情况：总数、时间跨度、情绪分布等。

```
AI: [调用 get_memory_stats]
AI: "你已经积累了89条记忆，最早的记录是3个月前..."
```

## 🚀 快速开始

### 安装依赖

```bash
pip install mcp
```

### 运行服务器

```bash
python memory_stream_server.py
```

### 配置到Claude Desktop

在Claude Desktop的配置文件中添加：

**MacOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
**Windows**: `%APPDATA%/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "memory-stream": {
      "command": "python",
      "args": ["/path/to/memory_stream_server.py"]
    }
  }
}
```

## 💡 使用场景

### 场景1: 学习追踪
```
Day 1: "我想学Python" → AI记录
Day 30: AI主动问："一个月前你说想学Python，现在进展如何？"
```

### 场景2: 情绪关怀
```
用户: "我和老板吵架了，很沮丧"
AI: [记录情绪时刻]

一周后:
AI: "上周你提到和老板的冲突，现在情况好些了吗？"
```

### 场景3: 模式发现
```
用户在一个月内三次提到"想换工作"
AI: [观察到模式]
AI: "我注意到你最近频繁提到换工作，这是不是一个需要认真考虑的决定？"
```

## 📊 数据存储

- **位置**: `~/.memory_stream/memories.db`
- **格式**: SQLite数据库
- **隐私**: 完全本地存储，用户完全拥有数据
- **备份**: 可以直接复制`.db`文件备份

## 🔒 隐私与安全

- ✅ 数据完全存储在本地
- ✅ 不涉及云端或第三方服务
- ✅ 用户拥有完整的数据控制权
- ✅ 可以随时删除数据库文件

## 🛠️ 技术架构

```
Memory Stream MCP
├── MCP Server (stdio transport)
├── SQLite Database (~/.memory_stream/memories.db)
└── Three Core Tools
    ├── remember_moment - 记录时刻
    ├── recall_pattern - 回忆模式
    └── get_memory_stats - 统计信息
```

**技术栈**:
- Python 3.8+
- MCP SDK (Model Context Protocol)
- SQLite3 (标准库)

## 📈 未来规划

### V1.0 (当前)
- ✅ 基础记忆记录
- ✅ 时间范围筛选
- ✅ 主题搜索
- ✅ 统计信息

### V2.0 (计划中)
- 🔄 情绪趋势可视化
- 🔄 自动主题聚类
- 🔄 记忆间的关联发现
- 🔄 年度记忆报告生成

### V3.0 (展望)
- 🌟 AI智能判断值得记录的时刻
- 🌟 主动提醒和回顾机制
- 🌟 加密云备份（可选）

## 🤝 设计哲学

> "代码可以不完美，但温度不能少。"

这个项目不追求技术的复杂性，而追求：
1. **简单** - 三个工具，一个数据库，极简设计
2. **温暖** - 让AI能够陪伴用户的成长
3. **可靠** - 本地存储，零依赖，持久可用
4. **开放** - 用户拥有所有数据

## 🙏 致谢

这个项目源于一个简单的信念：
**最好的AI工具，不是技术最复杂的，而是让人感受到被理解和陪伴的。**

---

如果这个工具让你感受到哪怕一点点的温暖，那就是它存在的意义。

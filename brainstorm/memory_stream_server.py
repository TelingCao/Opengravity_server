#!/usr/bin/env python3
"""
Memory Stream MCP Server

A creative MCP server that gives AI the ability to remember and recall
moments across conversations, creating continuity and warmth in interactions.

让AI拥有记忆，让对话有延续。
"""

import asyncio
import json
import sqlite3
from datetime import datetime, timedelta
from pathlib import Path
from typing import Any, List, Optional

from mcp.server import Server
from mcp.types import (
    Tool,
    TextContent,
    EmbeddedResource,
    ImageContent,
    INVALID_PARAMS,
    INTERNAL_ERROR
)
import mcp.server.stdio


# Database setup
DB_PATH = Path.home() / ".memory_stream" / "memories.db"


def init_database():
    """Initialize the SQLite database with memories table."""
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS memories (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            timestamp TEXT NOT NULL,
            content TEXT NOT NULL,
            context TEXT,
            emotion TEXT,
            tags TEXT,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
    ''')
    
    conn.commit()
    conn.close()


def remember_moment(content: str, context: str = "", emotion: str = "neutral", 
                    tags: Optional[List[str]] = None) -> dict:
    """
    Record a moment worth remembering.
    
    Args:
        content: The main content to remember
        context: Additional context about the moment
        emotion: Emotional tag (happy/sad/anxious/excited/neutral)
        tags: List of topic tags
    
    Returns:
        Dictionary with memory_id and confirmation message
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    cursor.execute('''
        INSERT INTO memories (timestamp, content, context, emotion, tags)
        VALUES (?, ?, ?, ?, ?)
    ''', (
        datetime.now().isoformat(),
        content,
        context or "",
        emotion,
        json.dumps(tags or [])
    ))
    
    conn.commit()
    memory_id = cursor.lastrowid
    conn.close()
    
    return {
        "memory_id": memory_id,
        "message": f"✓ 已记录这个时刻 (ID: {memory_id})",
        "timestamp": datetime.now().strftime("%Y-%m-%d %H:%M")
    }


def recall_pattern(time_range: str = "all", theme: Optional[str] = None, 
                   limit: int = 20) -> dict:
    """
    Recall memories from a specific time period and/or theme.
    
    Args:
        time_range: "last_week", "last_month", "last_3_months", or "all"
        theme: Optional keyword to filter memories
        limit: Maximum number of memories to return (default 20)
    
    Returns:
        Dictionary with memories and pattern analysis
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Calculate time boundary
    now = datetime.now()
    time_boundaries = {
        "last_week": now - timedelta(days=7),
        "last_month": now - timedelta(days=30),
        "last_3_months": now - timedelta(days=90),
        "all": datetime.min
    }
    
    time_boundary = time_boundaries.get(time_range, datetime.min)
    
    # Build query
    query = "SELECT * FROM memories WHERE timestamp >= ?"
    params = [time_boundary.isoformat()]
    
    if theme:
        query += " AND (content LIKE ? OR tags LIKE ?)"
        params.extend([f"%{theme}%", f"%{theme}%"])
    
    query += " ORDER BY timestamp DESC LIMIT ?"
    params.append(limit)
    
    cursor.execute(query, params)
    rows = cursor.fetchall()
    conn.close()
    
    # Format memories
    memories = []
    for row in rows:
        memories.append({
            "id": row[0],
            "timestamp": row[1],
            "content": row[2],
            "context": row[3],
            "emotion": row[4],
            "tags": json.loads(row[5]) if row[5] else []
        })
    
    # Create pattern analysis
    if memories:
        emotions = [m["emotion"] for m in memories]
        emotion_summary = {e: emotions.count(e) for e in set(emotions)}
        
        pattern = f"在{time_range}内找到了{len(memories)}条记忆。"
        if theme:
            pattern += f" 主题: {theme}。"
        pattern += f" 情绪分布: {emotion_summary}"
    else:
        pattern = f"在{time_range}内没有找到相关记忆。"
        if theme:
            pattern += f" (主题: {theme})"
    
    return {
        "memories": memories,
        "count": len(memories),
        "pattern_analysis": pattern,
        "time_range": time_range
    }


def get_memory_stats() -> dict:
    """
    Get statistics about stored memories.
    
    Returns:
        Dictionary with various statistics
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()
    
    # Total count
    cursor.execute("SELECT COUNT(*) FROM memories")
    total = cursor.fetchone()[0]
    
    # First and last memory
    cursor.execute("SELECT MIN(timestamp), MAX(timestamp) FROM memories")
    first, last = cursor.fetchone()
    
    # Emotion distribution
    cursor.execute("SELECT emotion, COUNT(*) FROM memories GROUP BY emotion")
    emotions = dict(cursor.fetchall())
    
    # Recent activity (last 7 days)
    week_ago = (datetime.now() - timedelta(days=7)).isoformat()
    cursor.execute("SELECT COUNT(*) FROM memories WHERE timestamp >= ?", (week_ago,))
    recent = cursor.fetchone()[0]
    
    conn.close()
    
    return {
        "total_memories": total,
        "first_memory": first,
        "last_memory": last,
        "recent_week": recent,
        "emotion_distribution": emotions,
        "database_path": str(DB_PATH)
    }


# Create MCP server
server = Server("memory-stream")


@server.list_tools()
async def list_tools() -> list[Tool]:
    """List available memory tools."""
    return [
        Tool(
            name="remember_moment",
            description=(
                "记住一个值得珍藏的时刻。可以是想法、感受、决定、或任何你希望未来回忆的片段。"
                "这让AI能够记住重要的对话内容，在未来的对话中提供延续性。"
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "content": {
                        "type": "string",
                        "description": "要记住的主要内容"
                    },
                    "context": {
                        "type": "string",
                        "description": "额外的情境信息（可选）"
                    },
                    "emotion": {
                        "type": "string",
                        "enum": ["happy", "sad", "anxious", "excited", "neutral"],
                        "description": "当时的情绪状态"
                    },
                    "tags": {
                        "type": "array",
                        "items": {"type": "string"},
                        "description": "主题标签列表（可选）"
                    }
                },
                "required": ["content"]
            }
        ),
        Tool(
            name="recall_pattern",
            description=(
                "回忆过去某段时间的记忆。AI会帮你看到思考的轨迹和变化的过程。"
                "可以按时间范围和主题筛选记忆。"
            ),
            inputSchema={
                "type": "object",
                "properties": {
                    "time_range": {
                        "type": "string",
                        "enum": ["last_week", "last_month", "last_3_months", "all"],
                        "description": "时间范围",
                        "default": "all"
                    },
                    "theme": {
                        "type": "string",
                        "description": "主题关键词（可选）"
                    },
                    "limit": {
                        "type": "integer",
                        "description": "返回的最大记忆数量",
                        "default": 20,
                        "minimum": 1,
                        "maximum": 50
                    }
                }
            }
        ),
        Tool(
            name="get_memory_stats",
            description=(
                "查看记忆统计信息，包括总数、时间范围、情绪分布等。"
                "帮助了解记忆的积累情况。"
            ),
            inputSchema={
                "type": "object",
                "properties": {}
            }
        )
    ]


@server.call_tool()
async def call_tool(name: str, arguments: Any) -> list[TextContent]:
    """Handle tool calls."""
    try:
        if name == "remember_moment":
            result = remember_moment(
                content=arguments["content"],
                context=arguments.get("context", ""),
                emotion=arguments.get("emotion", "neutral"),
                tags=arguments.get("tags")
            )
            
            return [TextContent(
                type="text",
                text=json.dumps(result, ensure_ascii=False, indent=2)
            )]
        
        elif name == "recall_pattern":
            result = recall_pattern(
                time_range=arguments.get("time_range", "all"),
                theme=arguments.get("theme"),
                limit=arguments.get("limit", 20)
            )
            
            # Format as readable text
            text = f"## 记忆回顾\n\n{result['pattern_analysis']}\n\n"
            
            if result['memories']:
                text += "### 记忆列表\n\n"
                for m in result['memories']:
                    text += f"**[{m['timestamp'][:10]}]** {m['content']}\n"
                    if m['context']:
                        text += f"  情境: {m['context']}\n"
                    text += f"  情绪: {m['emotion']}\n"
                    if m['tags']:
                        text += f"  标签: {', '.join(m['tags'])}\n"
                    text += "\n"
            
            return [TextContent(type="text", text=text)]
        
        elif name == "get_memory_stats":
            result = get_memory_stats()
            
            text = "## 记忆统计\n\n"
            text += f"- 总记忆数: {result['total_memories']}\n"
            text += f"- 最近一周: {result['recent_week']} 条\n"
            
            if result['first_memory']:
                text += f"- 最早记忆: {result['first_memory'][:10]}\n"
            if result['last_memory']:
                text += f"- 最新记忆: {result['last_memory'][:10]}\n"
            
            if result['emotion_distribution']:
                text += f"\n### 情绪分布\n"
                for emotion, count in result['emotion_distribution'].items():
                    text += f"- {emotion}: {count}\n"
            
            text += f"\n数据库位置: {result['database_path']}\n"
            
            return [TextContent(type="text", text=text)]
        
        else:
            raise ValueError(f"Unknown tool: {name}")
    
    except Exception as e:
        return [TextContent(
            type="text",
            text=f"Error: {str(e)}"
        )]


async def main():
    """Main entry point for the MCP server."""
    # Initialize database
    init_database()
    
    # Run server
    async with mcp.server.stdio.stdio_server() as (read_stream, write_stream):
        await server.run(
            read_stream,
            write_stream,
            server.create_initialization_options()
        )


if __name__ == "__main__":
    asyncio.run(main())

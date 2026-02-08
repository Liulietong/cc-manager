# Claude Code 本地数据结构文档

## 概述

Claude Code 的本地数据存储主要分为两个层级：
1. **User Scope (用户级)**: 存储在 `~/.claude/` 目录
2. **Project Scope (项目级)**: 存储在项目根目录的 `.claude/` 目录

---

## 目录结构树

```
~/.claude/
├── .active-profile              # 当前激活的配置文件名
├── settings.json                # 用户级主配置文件
├── settings.{profile}.json      # 多配置文件支持 (如 settings.deepseek.json)
├── settings.local.json          # 本地覆盖配置
├── history.jsonl                # 命令历史记录
├── stats-cache.json             # 使用统计缓存
│
├── projects/                    # Session 数据存储 (按项目路径组织)
│   └── {encoded-project-path}/  # 项目路径编码后的目录名
│       ├── {session-id}.jsonl   # Session 对话记录
│       └── {session-id}/        # Session 附属数据目录
│           └── tool-results/    # 工具调用结果缓存
│
├── plugins/                     # 插件系统
│   ├── config.json              # 插件仓库配置
│   ├── installed_plugins.json   # 已安装插件列表
│   ├── known_marketplaces.json  # 已知插件市场
│   ├── install-counts-cache.json
│   ├── cache/                   # 插件缓存目录
│   │   └── {marketplace}/{plugin}/{version}/
│   │       ├── .claude-plugin/
│   │       │   ├── plugin.json
│   │       │   └── marketplace.json
│   │       ├── .mcp.json        # MCP 服务器配置
│   │       └── hooks/
│   │           └── hooks.json
│   └── marketplaces/            # 插件市场本地副本
│
├── tasks/                       # 任务系统 (Agent Teams)
│   └── {team-id}/
│       └── {task-id}.json       # 任务定义文件
│
├── teams/                       # 团队配置
│   └── {team-id}/
│
├── todos/                       # Todo 列表 (按 session 组织)
│   └── {session-id}-agent-{session-id}.json
│
├── commands/                    # 用户级自定义命令 (Slash Commands)
│   └── {command-name}.md
│
├── output-styles/               # 输出风格定义
│   └── {style-name}.md
│
├── agents/                      # Agent 配置 (目前为空)
│
├── plans/                       # 计划文档
│   └── {plan-name}.md
│
├── file-history/                # 文件修改历史 (用于撤销)
│   └── {session-id}/
│       └── {file-hash}@v{version}
│
├── session-env/                 # Session 环境变量
│   └── {session-id}/
│
├── shell-snapshots/             # Shell 环境快照
│   └── snapshot-{shell}-{timestamp}-{random}.sh
│
├── transcripts/                 # 对话记录导出
│   └── ses_{session-id}.jsonl
│
├── paste-cache/                 # 粘贴内容缓存
│
├── cache/                       # 通用缓存
│
├── debug/                       # 调试日志
│
├── downloads/                   # 下载文件
│
├── ide/                         # IDE 集成数据
│
├── statsig/                     # Statsig 功能开关缓存
│
├── telemetry/                   # 遥测数据
│
└── usage-data/                  # 使用数据报告
    ├── facets/
    └── report.html
```

---

## 核心文件详解

### 1. Settings 配置文件

#### 1.1 User Scope: `~/.claude/settings.json`

**路径**: `~/.claude/settings.json`

**用途**: 用户级全局配置，包含 API 设置、模型选择、插件启用状态等。

**JSON 结构示例**:
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1",
    "ANTHROPIC_BASE_URL": "https://api.anthropic.com",
    "ANTHROPIC_AUTH_TOKEN": "sk-xxx"
  },
  "model": "opus",
  "enabledPlugins": {
    "plugin-name@marketplace": true,
    "another-plugin@marketplace": false
  },
  "alwaysThinkingEnabled": true
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `env` | object | 环境变量配置 |
| `model` | string | 默认模型 (opus, sonnet, haiku) |
| `enabledPlugins` | object | 插件启用状态映射 |
| `alwaysThinkingEnabled` | boolean | 是否启用思考模式 |

#### 1.2 多配置文件支持

**路径**: `~/.claude/settings.{profile}.json`

**用途**: 支持多个配置文件切换，如 `settings.deepseek.json`, `settings.aicodewith.json`

**当前激活配置**: `~/.claude/.active-profile` 文件内容为当前配置名

#### 1.3 Project Scope: `{project}/.claude/settings.json`

**路径**: `{project-root}/.claude/settings.json` 或 `{project-root}/.claude/settings.local.json`

**用途**: 项目级配置，覆盖用户级设置。

**JSON 结构示例**:
```json
{
  "permissions": {
    "allow": [
      "Bash(git status:*)",
      "Bash(npm install:*)",
      "WebSearch",
      "WebFetch(domain:github.com)"
    ],
    "defaultMode": "bypassPermissions"
  }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `permissions.allow` | array | 允许的工具调用模式列表 |
| `permissions.defaultMode` | string | 默认权限模式 |

---

### 2. Session 数据

#### 2.1 Projects 目录结构

**路径**: `~/.claude/projects/{encoded-project-path}/`

**目录命名规则**: 项目绝对路径中的 `/` 替换为 `-`
- 例如: `/Users/liulietong/workspace/ai_dev/cc-manager`
- 编码为: `-Users-liulietong-workspace-ai_dev-cc-manager`

#### 2.2 Session JSONL 文件

**路径**: `~/.claude/projects/{encoded-path}/{session-id}.jsonl`

**用途**: 存储完整的对话历史，每行一个 JSON 对象。

**消息类型**:

1. **file-history-snapshot** - 文件历史快照
```json
{
  "type": "file-history-snapshot",
  "messageId": "uuid",
  "snapshot": {
    "messageId": "uuid",
    "trackedFileBackups": {},
    "timestamp": "2026-02-07T14:31:32.960Z"
  },
  "isSnapshotUpdate": false
}
```

2. **progress** - 进度消息 (Hook 执行等)
```json
{
  "type": "progress",
  "parentUuid": "uuid",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/path/to/project",
  "sessionId": "uuid",
  "version": "2.1.34",
  "gitBranch": "HEAD",
  "data": {
    "type": "hook_progress",
    "hookEvent": "SessionStart",
    "hookName": "SessionStart:startup",
    "command": "..."
  },
  "timestamp": "2026-02-07T14:31:30.001Z",
  "uuid": "uuid"
}
```

3. **user** - 用户消息
```json
{
  "type": "user",
  "parentUuid": "uuid",
  "isSidechain": false,
  "userType": "external",
  "cwd": "/path/to/project",
  "sessionId": "uuid",
  "version": "2.1.34",
  "gitBranch": "HEAD",
  "message": {
    "role": "user",
    "content": "用户输入内容"
  },
  "uuid": "uuid",
  "timestamp": "2026-02-07T14:31:32.906Z",
  "thinkingMetadata": {
    "maxThinkingTokens": 31999
  },
  "todos": [],
  "permissionMode": "bypassPermissions"
}
```

4. **assistant** - 助手响应
```json
{
  "type": "assistant",
  "parentUuid": "uuid",
  "message": {
    "role": "assistant",
    "content": [
      {"type": "text", "text": "..."},
      {"type": "tool_use", "id": "...", "name": "...", "input": {...}}
    ]
  },
  "uuid": "uuid",
  "timestamp": "..."
}
```

---

### 3. Plugins 插件系统

#### 3.1 已安装插件列表

**路径**: `~/.claude/plugins/installed_plugins.json`

**JSON 结构示例**:
```json
{
  "version": 2,
  "plugins": {
    "plugin-name@marketplace-name": [
      {
        "scope": "user",
        "installPath": "/Users/.../plugins/cache/marketplace/plugin/version",
        "version": "1.0.0",
        "installedAt": "2025-12-16T12:02:30.893Z",
        "lastUpdated": "2025-12-28T08:22:28.857Z",
        "gitCommitSha": "abc123..."
      },
      {
        "scope": "local",
        "projectPath": "/path/to/project",
        "installPath": "...",
        "version": "1.0.0",
        "installedAt": "...",
        "lastUpdated": "..."
      }
    ]
  }
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `scope` | string | 安装范围: "user" (全局) 或 "local" (项目级) |
| `projectPath` | string | 仅 local scope 有效，关联的项目路径 |
| `installPath` | string | 插件安装的本地路径 |
| `version` | string | 插件版本 |
| `gitCommitSha` | string | Git 提交哈希 (可选) |

#### 3.2 已知插件市场

**路径**: `~/.claude/plugins/known_marketplaces.json`

**JSON 结构示例**:
```json
{
  "marketplace-name": {
    "source": {
      "source": "github",
      "repo": "owner/repo"
    },
    "installLocation": "/Users/.../plugins/marketplaces/marketplace-name",
    "lastUpdated": "2026-02-06T01:00:09.273Z"
  },
  "local-marketplace": {
    "source": {
      "source": "directory",
      "path": "/path/to/local/plugins"
    },
    "installLocation": "/path/to/local/plugins",
    "lastUpdated": "..."
  }
}
```

#### 3.3 插件定义文件

**路径**: `{plugin-path}/.claude-plugin/plugin.json`

**JSON 结构示例**:
```json
{
  "name": "context7",
  "description": "Upstash Context7 MCP server for up-to-date documentation lookup.",
  "author": {
    "name": "Upstash"
  }
}
```

#### 3.4 插件 MCP 配置

**路径**: `{plugin-path}/.mcp.json`

**JSON 结构示例**:
```json
{
  "server-name": {
    "command": "npx",
    "args": ["-y", "@upstash/context7-mcp"]
  }
}
```

---

### 4. Tasks 任务系统 (Agent Teams)

#### 4.1 任务文件

**路径**: `~/.claude/tasks/{team-id}/{task-id}.json`

**JSON 结构示例**:
```json
{
  "id": "1",
  "subject": "任务标题",
  "description": "任务详细描述...",
  "activeForm": "正在执行的动作描述",
  "status": "pending",
  "blocks": ["2", "3"],
  "blockedBy": []
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | string | 任务 ID |
| `subject` | string | 任务标题 |
| `description` | string | 任务详细描述 |
| `activeForm` | string | 进行中状态的显示文本 |
| `status` | string | 状态: "pending", "in_progress", "completed" |
| `blocks` | array | 被此任务阻塞的任务 ID 列表 |
| `blockedBy` | array | 阻塞此任务的任务 ID 列表 |

---

### 5. Commands 自定义命令

#### 5.1 用户级命令

**路径**: `~/.claude/commands/{command-name}.md`

#### 5.2 项目级命令

**路径**: `{project}/.claude/commands/{command-name}.md`

**Markdown 结构示例**:
```markdown
---
argument-hint: [--option1] [--option2=value]
description: 命令描述
allowed-tools: Bash(git:*), Bash(npm:*)
---

# 命令标题

命令的详细说明和执行逻辑...

## Context

- Current status: !`git status`

## Your task

执行步骤说明...
```

**Front Matter 字段**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `argument-hint` | string | 参数提示 |
| `description` | string | 命令描述 |
| `allowed-tools` | string | 允许使用的工具列表 |

---

### 6. Output Styles 输出风格

**路径**: `~/.claude/output-styles/{style-name}.md`

**Markdown 结构示例**:
```markdown
---
name: Style Name
description: 风格描述
---

# Style Name

风格的详细定义...

## Communication Style

- 语气和风格说明
- 格式要求
```

---

### 7. History 历史记录

**路径**: `~/.claude/history.jsonl`

**用途**: 存储用户输入的命令历史，用于命令补全和历史回溯。

**JSON 结构示例** (每行一条记录):
```json
{
  "display": "/explain_rust array 和 vec 区别是什么",
  "pastedContents": {},
  "timestamp": 1759831557510,
  "project": "/Users/liulietong/workspace/personal-coding-notes/rust-notes"
}
```

**字段说明**:
| 字段 | 类型 | 说明 |
|------|------|------|
| `display` | string | 显示的命令文本 |
| `pastedContents` | object | 粘贴的内容 (如代码片段) |
| `timestamp` | number | Unix 时间戳 (毫秒) |
| `project` | string | 关联的项目路径 |

---

### 8. Stats Cache 统计缓存

**路径**: `~/.claude/stats-cache.json`

**JSON 结构示例**:
```json
{
  "version": 2,
  "lastComputedDate": "2026-02-06",
  "dailyActivity": [
    {
      "date": "2026-01-25",
      "messageCount": 3270,
      "sessionCount": 14,
      "toolCallCount": 234
    }
  ]
}
```

---

### 9. File History 文件历史

**路径**: `~/.claude/file-history/{session-id}/{file-hash}@v{version}`

**用途**: 存储文件修改前的备份，支持撤销操作。

**文件命名规则**:
- `{file-hash}`: 文件路径的哈希值
- `@v{version}`: 版本号

---

### 10. Todos 待办事项

**路径**: `~/.claude/todos/{session-id}-agent-{session-id}.json`

**JSON 结构**: 数组格式，存储 session 相关的待办事项。

---

## 数据关系图

```
┌─────────────────────────────────────────────────────────────────┐
│                        User Scope (~/.claude/)                   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  settings.json ◄──────────────────────────────────────────────┐ │
│       │                                                        │ │
│       │ references                                             │ │
│       ▼                                                        │ │
│  plugins/installed_plugins.json ◄─────────────────────────────┤ │
│       │                                                        │ │
│       │ points to                                              │ │
│       ▼                                                        │ │
│  plugins/cache/{marketplace}/{plugin}/{version}/               │ │
│       ├── .claude-plugin/plugin.json                           │ │
│       └── .mcp.json                                            │ │
│                                                                  │
│  projects/{encoded-path}/                                       │
│       ├── {session-id}.jsonl  ◄─── Session 对话记录            │
│       └── {session-id}/                                         │
│           └── tool-results/   ◄─── 工具调用结果                │
│                                                                  │
│  tasks/{team-id}/                                               │
│       └── {task-id}.json      ◄─── Agent Teams 任务            │
│                                                                  │
│  file-history/{session-id}/   ◄─── 文件修改历史 (撤销支持)     │
│                                                                  │
│  history.jsonl                ◄─── 命令历史                    │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                   Project Scope ({project}/.claude/)             │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  settings.json / settings.local.json                            │
│       │                                                          │
│       │ overrides                                                │
│       ▼                                                          │
│  User Scope settings.json                                        │
│                                                                  │
│  commands/                                                       │
│       └── {command-name}.md   ◄─── 项目级自定义命令            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 配置优先级

配置加载优先级 (从低到高):
1. `~/.claude/settings.json` - 用户级默认配置
2. `~/.claude/settings.{profile}.json` - 配置文件 (通过 .active-profile 选择)
3. `~/.claude/settings.local.json` - 用户级本地覆盖
4. `{project}/.claude/settings.json` - 项目级配置
5. `{project}/.claude/settings.local.json` - 项目级本地覆盖

---

## 关键路径汇总

| 数据类型 | User Scope 路径 | Project Scope 路径 |
|----------|-----------------|-------------------|
| Settings | `~/.claude/settings.json` | `{project}/.claude/settings.json` |
| Settings (local) | `~/.claude/settings.local.json` | `{project}/.claude/settings.local.json` |
| Commands | `~/.claude/commands/` | `{project}/.claude/commands/` |
| Sessions | `~/.claude/projects/{encoded-path}/` | N/A |
| Plugins | `~/.claude/plugins/` | N/A |
| Tasks | `~/.claude/tasks/` | N/A |
| History | `~/.claude/history.jsonl` | N/A |
| Output Styles | `~/.claude/output-styles/` | N/A |
| Plans | `~/.claude/plans/` | N/A |

---

## 附录: 项目路径编码规则

项目路径编码为目录名时的转换规则:
- 绝对路径中的 `/` 替换为 `-`
- 保留其他字符

**示例**:
- 原始路径: `/Users/liulietong/workspace/ai_dev/cc-manager`
- 编码后: `-Users-liulietong-workspace-ai_dev-cc-manager`

**解码方法**:
```javascript
function decodeProjectPath(encodedPath) {
  // 将开头的 - 替换为 /，其余的 - 也替换为 /
  return encodedPath.replace(/^-/, '/').replace(/-/g, '/');
}
```

---

## 版本信息

- 文档版本: 1.0
- Claude Code 版本: 2.1.34
- 调研日期: 2026-02-07

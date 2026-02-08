# Claude Code Manager - 项目架构文档

> 本文档提供完整的项目架构设计，可直接用于端到端实施和测试。

## 1. 项目概述

### 1.1 项目目标

构建一个本地 Web 服务，提供 Claude Code 配置和会话的一站式管理：

- **Sessions 管理**: 按项目路径组织，查看、搜索、删除会话记录
- **Settings 管理**: 查看和编辑 User Scope 和 Project Scope 配置
- **Plugins 管理**: 查看已安装插件、启用/禁用插件
- **扩展预留**: MCP Servers、Skills、Plugins 的扩展接口

### 1.2 核心功能

| 功能模块 | 描述 | 优先级 |
|----------|------|--------|
| Sessions 浏览 | 按项目路径树形展示所有会话 | P0 |
| Session 详情 | 查看会话对话内容、元数据 | P0 |
| Settings 查看 | 展示 user/project scope 配置 | P0 |
| Settings 编辑 | 修改配置并保存 | P1 |
| Plugins 列表 | 展示已安装插件及状态 | P1 |
| Plugins 开关 | 启用/禁用插件 | P1 |
| 实时更新 | 文件变化时自动刷新 UI | P2 |
| 扩展系统 | MCP/Skills/Plugins 扩展接口 | P2 |

---

## 2. 技术栈

### 2.1 核心技术选型

| 层级 | 技术 | 版本 | 选型理由 |
|------|------|------|----------|
| 运行时 | Node.js | 20 LTS | 与 Claude Code 技术栈一致 |
| 后端框架 | Fastify | 4.x | 高性能、插件系统完善 |
| 前端框架 | React | 18.x | 生态丰富、TypeScript 支持好 |
| UI 组件库 | shadcn/ui | latest | 可定制、按需引入 |
| 样式方案 | Tailwind CSS | 3.x | 灵活、与 shadcn/ui 配合 |
| 构建工具 | Vite | 5.x | 开发体验极佳 |
| 语言 | TypeScript | 5.x | 全栈类型安全 |
| 包管理 | pnpm | 8.x | Monorepo 支持好 |

### 2.2 辅助依赖

| 用途 | 库 | 说明 |
|------|-----|------|
| 文件监听 | chokidar | 监听配置文件变化 |
| 实时通信 | SSE (原生) | 服务器推送更新 |
| 数据验证 | zod | Schema 验证 |
| API 请求 | @tanstack/react-query | 数据获取和缓存 |
| 路由 | react-router-dom | 前端路由 |
| 状态管理 | zustand | 轻量级状态管理 |
| 图标 | lucide-react | 图标库 |
| 代码高亮 | shiki | 语法高亮 |

---

## 3. 系统架构

### 3.1 整体架构图

```
┌─────────────────────────────────────────────────────────────────────┐
│                           Browser (React App)                        │
├─────────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────────┐ │
│  │ Sessions │  │ Settings │  │ Plugins  │  │ Extensions (Future)  │ │
│  │   Page   │  │   Page   │  │   Page   │  │  MCP/Skills/Plugins  │ │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘  └──────────┬───────────┘ │
│       │             │             │                   │             │
│       └─────────────┴─────────────┴───────────────────┘             │
│                              │                                       │
│                    React Query + SSE Client                          │
└──────────────────────────────┼───────────────────────────────────────┘
                               │ HTTP/SSE
┌──────────────────────────────┼───────────────────────────────────────┐
│                        Fastify Server                                │
├──────────────────────────────┼───────────────────────────────────────┤
│  ┌───────────────────────────┴────────────────────────────────────┐ │
│  │                         API Routes                              │ │
│  │  /api/sessions  /api/settings  /api/plugins  /api/sse          │ │
│  └───────────────────────────┬────────────────────────────────────┘ │
│                              │                                       │
│  ┌───────────────────────────┴────────────────────────────────────┐ │
│  │                        Services Layer                           │ │
│  │  SessionManager  SettingsManager  PluginManager  FileWatcher   │ │
│  └───────────────────────────┬────────────────────────────────────┘ │
│                              │                                       │
│  ┌───────────────────────────┴────────────────────────────────────┐ │
│  │                      Extension System                           │ │
│  │              Fastify Plugins for MCP/Skills/etc                 │ │
│  └────────────────────────────────────────────────────────────────┘ │
└──────────────────────────────────────────────────────────────────────┘
                               │
                               ▼
┌──────────────────────────────────────────────────────────────────────┐
│                     File System (~/.claude/)                         │
├──────────────────────────────────────────────────────────────────────┤
│  projects/     settings.json     plugins/     commands/     tasks/   │
└──────────────────────────────────────────────────────────────────────┘
```

### 3.2 数据流

```
1. 初始加载:
   Browser → GET /api/sessions → Server → Read ~/.claude/projects/ → Response

2. 实时更新:
   File Change → chokidar → Server → SSE Push → Browser → Re-fetch Data

3. 配置修改:
   Browser → PUT /api/settings → Server → Write File → SSE Notify → UI Update
```

---

## 4. 目录结构

```
cc-manager/
├── docs/                              # 项目文档
│   ├── architecture.md                # 本文档
│   ├── data-structure.md              # Claude Code 数据结构
│   └── tech-stack.md                  # 技术选型分析
│
├── packages/
│   ├── server/                        # 后端服务
│   │   ├── src/
│   │   │   ├── index.ts               # 入口文件
│   │   │   ├── app.ts                 # Fastify 应用配置
│   │   │   ├── config.ts              # 配置常量
│   │   │   │
│   │   │   ├── routes/                # API 路由
│   │   │   │   ├── index.ts           # 路由注册
│   │   │   │   ├── sessions.ts        # Sessions API
│   │   │   │   ├── settings.ts        # Settings API
│   │   │   │   ├── plugins.ts         # Plugins API
│   │   │   │   └── sse.ts             # SSE 端点
│   │   │   │
│   │   │   ├── services/              # 业务逻辑
│   │   │   │   ├── session-manager.ts # Session 读取/解析
│   │   │   │   ├── settings-manager.ts# Settings 读写
│   │   │   │   ├── plugin-manager.ts  # Plugin 管理
│   │   │   │   └── file-watcher.ts    # 文件监听
│   │   │   │
│   │   │   ├── utils/                 # 工具函数
│   │   │   │   ├── path-encoder.ts    # 路径编码/解码
│   │   │   │   └── jsonl-parser.ts    # JSONL 解析
│   │   │   │
│   │   │   └── types/                 # 类型定义
│   │   │       ├── session.ts
│   │   │       ├── settings.ts
│   │   │       └── plugin.ts
│   │   │
│   │   ├── package.json
│   │   └── tsconfig.json
│   │
│   ├── web/                           # 前端应用
│   │   ├── src/
│   │   │   ├── main.tsx               # 入口
│   │   │   ├── App.tsx                # 根组件
│   │   │   │
│   │   │   ├── components/            # 组件
│   │   │   │   ├── ui/                # shadcn/ui 组件
│   │   │   │   ├── layout/            # 布局组件
│   │   │   │   │   ├── Sidebar.tsx
│   │   │   │   │   └── Header.tsx
│   │   │   │   ├── sessions/          # Sessions 组件
│   │   │   │   │   ├── SessionTree.tsx
│   │   │   │   │   ├── SessionList.tsx
│   │   │   │   │   └── SessionDetail.tsx
│   │   │   │   ├── settings/          # Settings 组件
│   │   │   │   │   ├── SettingsEditor.tsx
│   │   │   │   │   └── SettingsDiff.tsx
│   │   │   │   └── plugins/           # Plugins 组件
│   │   │   │       ├── PluginList.tsx
│   │   │   │       └── PluginCard.tsx
│   │   │   │
│   │   │   ├── pages/                 # 页面
│   │   │   │   ├── SessionsPage.tsx
│   │   │   │   ├── SettingsPage.tsx
│   │   │   │   └── PluginsPage.tsx
│   │   │   │
│   │   │   ├── hooks/                 # 自定义 Hooks
│   │   │   │   ├── useSSE.ts          # SSE 连接
│   │   │   │   ├── useSessions.ts
│   │   │   │   └── useSettings.ts
│   │   │   │
│   │   │   ├── lib/                   # 工具库
│   │   │   │   ├── api.ts             # API 客户端
│   │   │   │   └── utils.ts
│   │   │   │
│   │   │   └── types/                 # 类型定义
│   │   │       └── index.ts
│   │   │
│   │   ├── index.html
│   │   ├── package.json
│   │   ├── tailwind.config.js
│   │   ├── postcss.config.js
│   │   ├── tsconfig.json
│   │   └── vite.config.ts
│   │
│   └── shared/                        # 共享代码 (可选)
│       ├── src/
│       │   └── types/                 # 共享类型
│       └── package.json
│
├── package.json                       # 根 package.json
├── pnpm-workspace.yaml                # pnpm workspace 配置
├── tsconfig.base.json                 # 共享 TypeScript 配置
└── README.md
```

---

## 5. API 设计

### 5.1 Sessions API

#### GET /api/sessions
获取所有项目及其会话列表。

**Response:**
```json
{
  "projects": [
    {
      "path": "/Users/xxx/workspace/project-a",
      "encodedPath": "-Users-xxx-workspace-project-a",
      "sessions": [
        {
          "id": "abc-123-def",
          "createdAt": "2026-02-07T10:00:00Z",
          "updatedAt": "2026-02-07T12:00:00Z",
          "messageCount": 42
        }
      ]
    }
  ]
}
```

#### GET /api/sessions/:encodedPath/:sessionId
获取单个会话详情。

**Response:**
```json
{
  "id": "abc-123-def",
  "projectPath": "/Users/xxx/workspace/project-a",
  "createdAt": "2026-02-07T10:00:00Z",
  "messages": [
    {
      "type": "user",
      "content": "Hello",
      "timestamp": "2026-02-07T10:00:00Z"
    },
    {
      "type": "assistant",
      "content": [{"type": "text", "text": "Hi!"}],
      "timestamp": "2026-02-07T10:00:01Z"
    }
  ]
}
```

#### DELETE /api/sessions/:encodedPath/:sessionId
删除指定会话。

**Response:**
```json
{ "success": true }
```

### 5.2 Settings API

#### GET /api/settings
获取所有配置 (user scope)。

**Response:**
```json
{
  "userSettings": {
    "path": "~/.claude/settings.json",
    "content": { "model": "opus", "env": {} }
  },
  "activeProfile": "default",
  "profiles": ["default", "deepseek"]
}
```

#### GET /api/settings/project?path=/path/to/project
获取项目级配置。

**Response:**
```json
{
  "projectSettings": {
    "path": "/path/to/project/.claude/settings.json",
    "content": { "permissions": { "allow": [] } }
  },
  "localSettings": {
    "path": "/path/to/project/.claude/settings.local.json",
    "content": {}
  }
}
```

#### PUT /api/settings
更新配置。

**Request:**
```json
{
  "scope": "user",
  "profile": "default",
  "content": { "model": "sonnet" }
}
```

**Response:**
```json
{ "success": true }
```

### 5.3 Plugins API

#### GET /api/plugins
获取已安装插件列表。

**Response:**
```json
{
  "plugins": [
    {
      "name": "context7",
      "marketplace": "claude-plugins",
      "version": "1.0.0",
      "enabled": true,
      "scope": "user",
      "description": "Up-to-date documentation lookup"
    }
  ]
}
```

#### PUT /api/plugins/:pluginId/toggle
启用/禁用插件。

**Request:**
```json
{ "enabled": false }
```

**Response:**
```json
{ "success": true }
```

### 5.4 SSE API

#### GET /api/sse
建立 SSE 连接，接收文件变化通知。

**Event Types:**
```
event: session-change
data: {"type": "created", "path": "..."}

event: settings-change
data: {"scope": "user", "path": "..."}

event: plugin-change
data: {"plugin": "context7", "action": "enabled"}
```

---

## 6. 数据模型

### 6.1 TypeScript 类型定义

```typescript
// packages/shared/src/types/session.ts

export interface Project {
  path: string;           // 原始项目路径
  encodedPath: string;    // 编码后的路径
  sessions: SessionMeta[];
}

export interface SessionMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

export interface Session {
  id: string;
  projectPath: string;
  createdAt: string;
  messages: Message[];
}

export type Message = UserMessage | AssistantMessage | ProgressMessage;

export interface UserMessage {
  type: 'user';
  content: string;
  timestamp: string;
  uuid: string;
}

export interface AssistantMessage {
  type: 'assistant';
  content: ContentBlock[];
  timestamp: string;
  uuid: string;
}

export interface ContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
}

export interface ProgressMessage {
  type: 'progress';
  data: {
    type: string;
    hookEvent?: string;
    hookName?: string;
  };
  timestamp: string;
}
```

```typescript
// packages/shared/src/types/settings.ts

export interface UserSettings {
  env?: Record<string, string>;
  model?: 'opus' | 'sonnet' | 'haiku';
  enabledPlugins?: Record<string, boolean>;
  alwaysThinkingEnabled?: boolean;
}

export interface ProjectSettings {
  permissions?: {
    allow?: string[];
    defaultMode?: string;
  };
}

export interface SettingsResponse {
  userSettings: {
    path: string;
    content: UserSettings;
  };
  activeProfile: string;
  profiles: string[];
}
```

```typescript
// packages/shared/src/types/plugin.ts

export interface Plugin {
  name: string;
  marketplace: string;
  version: string;
  enabled: boolean;
  scope: 'user' | 'local';
  projectPath?: string;
  description?: string;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

export interface InstalledPlugins {
  version: number;
  plugins: Record<string, PluginInstallation[]>;
}

export interface PluginInstallation {
  scope: 'user' | 'local';
  projectPath?: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
}
```

---

## 7. 扩展系统设计

### 7.1 后端扩展 (Fastify Plugins)

```typescript
// packages/server/src/extensions/index.ts

import { FastifyInstance } from 'fastify';

export interface Extension {
  name: string;
  version: string;
  register: (app: FastifyInstance) => Promise<void>;
}

export async function loadExtensions(app: FastifyInstance) {
  const extensionsDir = path.join(__dirname, 'installed');
  // 动态加载扩展
}
```

**扩展目录结构:**
```
packages/server/src/extensions/
├── index.ts              # 扩展加载器
├── types.ts              # 扩展类型定义
└── installed/            # 已安装扩展
    └── mcp-viewer/       # 示例: MCP 查看器扩展
        ├── index.ts
        └── routes.ts
```

### 7.2 前端扩展 (React Components)

```typescript
// packages/web/src/extensions/index.ts

export interface UIExtension {
  name: string;
  menuItem?: {
    label: string;
    icon: React.ComponentType;
    path: string;
  };
  routes?: RouteObject[];
  component?: React.ComponentType;
}

export const extensions: UIExtension[] = [];

export function registerExtension(ext: UIExtension) {
  extensions.push(ext);
}
```

### 7.3 扩展配置文件

```json
// cc-manager.extensions.json
{
  "extensions": [
    {
      "name": "mcp-viewer",
      "enabled": true,
      "config": {}
    }
  ]
}
```

---

## 8. 开发指南

### 8.1 环境准备

```bash
# 1. 安装 Node.js 20 LTS
nvm install 20
nvm use 20

# 2. 安装 pnpm
npm install -g pnpm

# 3. 克隆项目并安装依赖
cd cc-manager
pnpm install
```

### 8.2 开发命令

```bash
# 启动开发服务器 (前后端同时)
pnpm dev

# 仅启动后端
pnpm --filter server dev

# 仅启动前端
pnpm --filter web dev

# 构建生产版本
pnpm build

# 运行测试
pnpm test

# 类型检查
pnpm typecheck

# 代码格式化
pnpm format
```

### 8.3 配置文件

**pnpm-workspace.yaml:**
```yaml
packages:
  - 'packages/*'
```

**tsconfig.base.json:**
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "ESNext",
    "moduleResolution": "bundler",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true
  }
}
```

**根 package.json:**
```json
{
  "name": "cc-manager",
  "private": true,
  "scripts": {
    "dev": "pnpm -r --parallel dev",
    "build": "pnpm -r build",
    "test": "pnpm -r test",
    "typecheck": "pnpm -r typecheck",
    "format": "prettier --write ."
  },
  "devDependencies": {
    "prettier": "^3.0.0",
    "typescript": "^5.0.0"
  }
}
```

---

## 9. 测试计划

### 9.1 单元测试

| 模块 | 测试内容 | 工具 |
|------|----------|------|
| path-encoder | 路径编码/解码正确性 | vitest |
| jsonl-parser | JSONL 解析正确性 | vitest |
| session-manager | Session 读取逻辑 | vitest |
| settings-manager | Settings 读写逻辑 | vitest |

### 9.2 集成测试

| 场景 | 测试内容 |
|------|----------|
| Sessions API | 获取项目列表、会话详情、删除会话 |
| Settings API | 读取配置、修改配置、配置文件切换 |
| Plugins API | 获取插件列表、启用/禁用插件 |
| SSE | 文件变化推送 |

### 9.3 E2E 测试

| 场景 | 测试内容 | 工具 |
|------|----------|------|
| Sessions 浏览 | 项目树展示、会话列表、详情查看 | Playwright |
| Settings 编辑 | 配置修改、保存、实时更新 | Playwright |
| Plugins 管理 | 插件列表、开关切换 | Playwright |

### 9.4 验证标准

1. **功能验证**:
   - [ ] 能正确读取 `~/.claude/projects/` 下所有项目和会话
   - [ ] 能正确解析 JSONL 格式的会话文件
   - [ ] 能正确读取和修改 settings.json
   - [ ] 能正确显示已安装插件列表
   - [ ] SSE 能正确推送文件变化

2. **性能验证**:
   - [ ] 首页加载时间 < 2s
   - [ ] 会话详情加载时间 < 1s
   - [ ] 文件变化推送延迟 < 500ms

3. **兼容性验证**:
   - [ ] 支持 Chrome/Firefox/Safari 最新版本
   - [ ] 支持 macOS/Linux/Windows

---

## 10. 部署方案

### 10.1 本地运行

```bash
# 开发模式
pnpm dev

# 生产模式
pnpm build
pnpm start
```

### 10.2 打包为可执行文件 (可选)

使用 `pkg` 或 `nexe` 打包为单文件可执行程序：

```bash
# 安装 pkg
pnpm add -D pkg

# 打包
pnpm pkg packages/server/dist/index.js -o cc-manager
```

### 10.3 默认端口

- 后端 API: `http://localhost:3456`
- 前端开发: `http://localhost:5173`
- 生产模式: 前端静态文件由后端服务

---

## 11. 里程碑计划

### Phase 1: MVP (核心功能)
- [ ] 项目初始化 (monorepo 结构)
- [ ] Sessions 浏览和查看
- [ ] Settings 查看
- [ ] 基础 UI 框架

### Phase 2: 完善功能
- [ ] Settings 编辑
- [ ] Plugins 管理
- [ ] SSE 实时更新
- [ ] 搜索功能

### Phase 3: 扩展系统
- [ ] 后端扩展加载器
- [ ] 前端扩展注册
- [ ] MCP Servers 查看器 (示例扩展)

---

## 12. 附录

### 12.1 相关文档

- [Claude Code 数据结构](./data-structure.md)
- [技术选型分析](./tech-stack.md)

### 12.2 参考资源

- [Fastify 文档](https://fastify.dev/)
- [React 文档](https://react.dev/)
- [shadcn/ui 文档](https://ui.shadcn.com/)
- [Tailwind CSS 文档](https://tailwindcss.com/)
- [Vite 文档](https://vitejs.dev/)

---

## 版本信息

- 文档版本: 1.0
- 创建日期: 2026-02-07
- 作者: CC Manager Research Team

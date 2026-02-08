# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

CC Manager is a web-based GUI for managing Claude Code settings, sessions, plugins, skills, MCP servers, and marketplace. It's a monorepo with React frontend and Fastify backend.

## Commands

```bash
pnpm dev          # Start both frontend and backend in development mode
pnpm start        # Kill existing processes and start fresh (port 3456, 5173)
pnpm build        # Build all packages for production
pnpm typecheck    # Run TypeScript type checking
pnpm format       # Format code with Prettier
```

## Architecture

### Monorepo Structure

```
cc-manager/
├── packages/
│   ├── server/          # Fastify backend (port 3456)
│   │   └── src/
│   │       ├── routes/  # API route handlers (sessions, settings, plugins, etc.)
│   │       ├── services/ # Business logic (session-manager.ts, settings-manager.ts, etc.)
│   │       ├── index.ts  # Server entry point
│   │       └── config.ts # Server configuration
│   ├── web/             # React + Vite frontend (port 5173)
│   │   └── src/
│   │       ├── pages/    # Route components (SessionsPage, SettingsPage, etc.)
│   │       ├── hooks/    # React Query hooks (useSessions, useSettings, useSSE, etc.)
│   │       ├── components/ui/  # shadcn/ui components
│   │       └── components/layout/  # Layout with sidebar navigation
│   └── shared/           # Shared types
└── package.json          # pnpm workspace root
```

### Backend Patterns

- **Routes**: Each feature has a route file (`routes/*.ts`) using Fastify's plugin system with prefix
- **Services**: Business logic separated into service files (`services/*.ts`)
- **Config**: Server config reads from `CLAUDE_HOME` env or `~/.claude`
- **File Watching**: `file-watcher.ts` uses chokidar to watch `~/.claude/` for changes, broadcasting via SSE

### Frontend Patterns

- **React Router**: Routes defined in `App.tsx` with page components
- **React Query**: Data fetching via hooks in `hooks/*.ts` (useSessions, useSettings, usePlugins, etc.)
- **SSE**: `useSSE` hook manages Server-Sent Events for real-time updates
- **UI Components**: shadcn/ui design system components in `components/ui/`
- **Tailwind CSS**: Utility-first styling throughout

### API Endpoints

| Feature | Base | Endpoints |
|---------|------|-----------|
| Sessions | `/api/sessions/` | GET / (list), GET /:encodedPath/:sessionId, DELETE /:encodedPath/:sessionId |
| Settings | `/api/settings/` | GET / (profiles), PUT /active-profile, POST /profiles, PUT /profiles/:name |
| Plugins | `/api/plugins/` | GET /, PUT /:name/toggle |
| Skills | `/api/skills/` | GET /, DELETE / |
| MCP | `/api/mcp/` | GET / |
| Marketplace | `/api/marketplace/` | GET /, GET /plugins |
| SSE | `/api/sse` | GET / (stream) |

### Profile System

Settings are organized by profiles in `~/.claude/profiles/{profileName}/settings.json`:
- `common` profile: Shared env vars across all profiles
- User profiles: Profile-specific settings that override common
- Active profile stored in `~/.claude/.active-profile`
- Switching profiles merges common + target env into `~/.claude/settings.json`

## Key Files

- `packages/server/src/services/settings-manager.ts`: Profile/env management
- `packages/server/src/services/session-manager.ts`: Session parsing from JSONL files
- `packages/server/src/services/file-watcher.ts`: chokidar watch + SSE broadcast
- `packages/web/src/hooks/useSSE.ts`: Real-time updates via Server-Sent Events
- `packages/web/src/pages/SettingsPage.tsx`: Profile editing UI

## Development Notes

- SSE connections require the server to keep connections open - avoid long-running blocking operations
- React Query hooks use `staleTime: 0` or `refetchInterval` for real-time data
- Profile settings stored at `~/.claude/profiles/` directory structure
- Session messages stored as JSONL files in `~/.claude/projects/{encodedDir}/{sessionId}.jsonl`

1. 可以使用 claude cli 来验证 cc manager 的功能 
2. cc manager 的add/delete/modify 组件（plugin/skill/marketplace/mcp）可以使用claude cli 完成，但是加载，查询等不要使用cli，而是通过阅读相关metadata 文件

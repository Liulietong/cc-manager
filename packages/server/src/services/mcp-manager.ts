import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

export interface MCPServerConfig {
  type?: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
}

export interface MCPServerStatus {
  name: string;
  type: string;
  command: string;
  args: string[];
  env?: Record<string, string>;
  disabled?: boolean;
  scope: 'global' | 'project';
  projectPath?: string;
}

interface ClaudeConfig {
  mcpServers?: Record<string, MCPServerConfig>;
  projects?: Record<string, {
    mcpServers?: Record<string, MCPServerConfig>;
    [key: string]: unknown;
  }>;
  [key: string]: unknown;
}

function readClaudeConfig(): ClaudeConfig {
  const configPath = join(config.claudeHome, '..', '.claude.json');

  try {
    if (!existsSync(configPath)) {
      return {};
    }
    const content = readFileSync(configPath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return {};
  }
}

function writeClaudeConfig(claudeConfig: ClaudeConfig): boolean {
  const configPath = join(config.claudeHome, '..', '.claude.json');
  try {
    writeFileSync(configPath, JSON.stringify(claudeConfig, null, 2));
    return true;
  } catch {
    return false;
  }
}

export function getMCPServers(): MCPServerStatus[] {
  const claudeConfig = readClaudeConfig();
  const servers: MCPServerStatus[] = [];

  // Global MCP servers
  if (claudeConfig.mcpServers) {
    for (const [name, server] of Object.entries(claudeConfig.mcpServers)) {
      servers.push({
        name,
        type: server.type || 'stdio',
        command: server.command,
        args: server.args || [],
        env: server.env,
        disabled: server.disabled,
        scope: 'global',
      });
    }
  }

  // Project-level MCP servers
  if (claudeConfig.projects) {
    for (const [projectPath, project] of Object.entries(claudeConfig.projects)) {
      if (project.mcpServers) {
        for (const [name, server] of Object.entries(project.mcpServers)) {
          // Skip if already added as global
          if (servers.some((s) => s.name === name && s.scope === 'global')) continue;
          servers.push({
            name,
            type: server.type || 'stdio',
            command: server.command,
            args: server.args || [],
            env: server.env,
            disabled: server.disabled,
            scope: 'project',
            projectPath,
          });
        }
      }
    }
  }

  return servers;
}

export function addMCPServer(name: string, server: MCPServerConfig): boolean {
  const claudeConfig = readClaudeConfig();
  if (!claudeConfig.mcpServers) {
    claudeConfig.mcpServers = {};
  }
  claudeConfig.mcpServers[name] = server;
  return writeClaudeConfig(claudeConfig);
}

export function deleteMCPServer(name: string): boolean {
  const claudeConfig = readClaudeConfig();
  if (!claudeConfig.mcpServers || !claudeConfig.mcpServers[name]) {
    return false;
  }
  delete claudeConfig.mcpServers[name];
  return writeClaudeConfig(claudeConfig);
}

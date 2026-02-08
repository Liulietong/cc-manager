// Inline types to avoid monorepo import issues
export interface Project {
  path: string;
  encodedPath: string;
  sessions: SessionMeta[];
}
export interface Session {
  id: string;
  projectPath: string;
  createdAt: string;
  messages: SessionMessage[];
}
export interface SessionMessage {
  type?: string;
  timestamp?: string;
  isMeta?: boolean;
  message?: {
    role?: string;
    content?: string | SessionContentBlock[];
  };
}
export interface SessionContentBlock {
  type: 'text' | 'tool_use' | 'tool_result';
  text?: string;
  name?: string;
  input?: Record<string, unknown>;
  content?: string | SessionTextBlock[];
}
export interface SessionTextBlock {
  type: 'text';
  text: string;
}
export interface SessionMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}
export interface Plugin {
  name: string;
  displayName: string;
  description: string;
  enabled: boolean;
  installed: boolean;
  version?: string;
  author?: string;
  tags?: string[];
  scope?: string;
  projectPath?: string;
}
export interface UserSettings {
  env?: Record<string, string>;
  anthropicApiKey?: string;
  defaultModel?: string;
  [key: string]: unknown;
}
export interface ProjectSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

const API_BASE = '/api';

interface ApiError {
  message?: string;
  error?: string;
}

async function fetchJson<T>(url: string, options?: RequestInit): Promise<T> {
  const response = await fetch(url, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...options?.headers,
    },
  });

  if (!response.ok) {
    const status = response.status;
    try {
      const errorBody: ApiError = await response.json();
      throw new Error(errorBody.message || errorBody.error || `API Error: ${status}`);
    } catch {
      throw new Error(`API Error: ${status}`);
    }
  }

  return response.json();
}

// Sessions API
export async function getProjects(): Promise<{ projects: Project[] }> {
  return fetchJson(`${API_BASE}/sessions`);
}

export async function getSessionDetail(encodedPath: string, sessionId: string): Promise<Session> {
  return fetchJson(`${API_BASE}/sessions/${encodedPath}/${sessionId}`);
}

export async function deleteSession(encodedPath: string, sessionId: string): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/sessions/${encodedPath}/${sessionId}`, {
    method: 'DELETE',
  });
}

// Settings API
export async function getUserSettings(): Promise<{
  userSettings: { path: string; content: UserSettings };
  activeProfile: string;
  profiles: string[];
}> {
  return fetchJson(`${API_BASE}/settings`);
}

export interface LocalSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

export async function getProjectSettings(path: string): Promise<{
  projectSettings: { path: string; content: ProjectSettings };
  localSettings: { path: string; content: LocalSettings };
}> {
  return fetchJson(`${API_BASE}/settings/project?path=${encodeURIComponent(path)}`);
}

export async function updateUserSettings(content: UserSettings): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/settings`, {
    method: 'PUT',
    body: JSON.stringify({ content }),
  });
}

// Plugins API
export async function getPlugins(): Promise<{ plugins: Plugin[] }> {
  return fetchJson(`${API_BASE}/plugins`);
}

export async function togglePlugin(name: string, enabled: boolean): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/plugins/${name}/toggle`, {
    method: 'PUT',
    body: JSON.stringify({ enabled }),
  });
}

// Skills API
export interface Skill {
  name: string;
  fileName: string;
  scope: 'user' | 'plugin';
  path: string;
  description: string;
  argumentHint: string;
  content: string;
  pluginName?: string;
}

export async function getSkills(): Promise<{ skills: Skill[] }> {
  return fetchJson(`${API_BASE}/skills`);
}

export async function deleteSkill(path: string): Promise<{ success: boolean }> {
  return fetchJson(`${API_BASE}/skills`, {
    method: 'DELETE',
    body: JSON.stringify({ path }),
  });
}

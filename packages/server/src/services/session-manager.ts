import { readdirSync, existsSync, readFileSync, unlinkSync, statSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

interface Project {
  path: string;
  encodedPath: string;
  sessions: SessionMeta[];
}

interface SessionMeta {
  id: string;
  createdAt: string;
  updatedAt: string;
  messageCount: number;
}

interface SessionIndex {
  version: number;
  entries: SessionIndexEntry[];
  originalPath: string;
}

interface SessionIndexEntry {
  sessionId: string;
  fullPath: string;
  fileMtime: number;
  firstPrompt: string;
  summary: string;
  messageCount: number;
  created: string;
  modified: string;
  gitBranch: string;
  projectPath: string;
  isSidechain: boolean;
}

// Simple in-memory cache with TTL
interface ProjectListCache {
  data: Project[];
  timestamp: number;
}

interface SessionDetailResult {
  id: string;
  projectPath: string;
  createdAt: string;
  messages: unknown[];
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
}

const CACHE_TTL = 5000; // 5 seconds cache TTL
const projectCache = new Map<string, ProjectListCache>();
const sessionDetailCache = new Map<string, CacheEntry<SessionDetailResult>>();
const MAX_CACHE_SIZE = 100;

// Validation regex patterns
const ENCODED_DIR_REGEX = /^[a-zA-Z0-9_-]+$/;
const SESSION_ID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function isValidEncodedDirName(name: string): boolean {
  return ENCODED_DIR_REGEX.test(name) && !name.includes('..') && !name.includes('/');
}

function isValidSessionId(id: string): boolean {
  return SESSION_ID_REGEX.test(id) && !id.includes('..') && !id.includes('/');
}

function getProjectFromIndex(indexPath: string, encodedDirName: string): Project | null {
  // Validate input
  if (!isValidEncodedDirName(encodedDirName)) {
    return null;
  }

  try {
    const content = readFileSync(indexPath, 'utf-8');
    const index: SessionIndex = JSON.parse(content);

    const sessions: SessionMeta[] = index.entries.map((entry) => ({
      id: entry.sessionId,
      createdAt: entry.created,
      updatedAt: entry.modified,
      messageCount: entry.messageCount,
    }));

    return {
      path: index.originalPath,
      encodedPath: encodedDirName,
      sessions,
    };
  } catch {
    return null;
  }
}

export function getProjects(): Project[] {
  const now = Date.now();

  // Check cache first
  const cached = projectCache.get('all');
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const projectsDir = join(config.claudeHome, 'projects');

  if (!existsSync(projectsDir)) {
    return [];
  }

  const projects: Project[] = [];

  try {
    const entries = readdirSync(projectsDir, { withFileTypes: true });

    for (const entry of entries) {
      if (entry.isDirectory()) {
        const projectDir = join(projectsDir, entry.name);
        const indexPath = join(projectDir, 'sessions-index.json');

        if (existsSync(indexPath)) {
          const project = getProjectFromIndex(indexPath, entry.name);
          if (project && project.sessions.length > 0) {
            projects.push(project);
          }
        }
      }
    }
  } catch {
    // Skip inaccessible directories
  }

  // Update cache
  if (projects.length > 0) {
    // Evict oldest entry if cache is full
    if (projectCache.size >= MAX_CACHE_SIZE) {
      const entries = Array.from(projectCache.entries());
      const oldest = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) projectCache.delete(oldest[0]);
    }
    projectCache.set('all', { data: projects, timestamp: now });
  }

  return projects;
}

export function getSessionDetail(encodedDirName: string, sessionId: string) {
  // Validate input to prevent path traversal
  if (!isValidEncodedDirName(encodedDirName) || !isValidSessionId(sessionId)) {
    return null;
  }

  const cacheKey = `${encodedDirName}/${sessionId}`;
  const now = Date.now();

  // Check cache first
  const cached = sessionDetailCache.get(cacheKey);
  if (cached && now - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }

  const projectDir = join(config.claudeHome, 'projects', encodedDirName);
  const sessionFile = join(projectDir, `${sessionId}.jsonl`);

  if (!existsSync(sessionFile)) {
    return null;
  }

  try {
    // Check file mtime for changes
    const fileStat = statSync(sessionFile);
    if (cached && fileStat.mtime.getTime() <= cached.timestamp) {
      return cached.data;
    }

    const content = readFileSync(sessionFile, 'utf-8');
    const messages = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    const result = {
      id: sessionId,
      projectPath: projectDir,
      createdAt: messages[0]?.timestamp || new Date().toISOString(),
      messages,
    };

    // Update cache
    if (sessionDetailCache.size >= MAX_CACHE_SIZE) {
      const entries = Array.from(sessionDetailCache.entries());
      const oldest = entries.sort((a, b) => a[1].timestamp - b[1].timestamp)[0];
      if (oldest) sessionDetailCache.delete(oldest[0]);
    }
    sessionDetailCache.set(cacheKey, { data: result, timestamp: now });

    return result;
  } catch {
    return null;
  }
}

export function deleteSession(encodedDirName: string, sessionId: string): boolean {
  // Validate input to prevent path traversal
  if (!isValidEncodedDirName(encodedDirName) || !isValidSessionId(sessionId)) {
    return false;
  }

  const projectDir = join(config.claudeHome, 'projects', encodedDirName);
  const sessionFile = join(projectDir, `${sessionId}.jsonl`);

  if (!existsSync(sessionFile)) {
    return false;
  }

  try {
    unlinkSync(sessionFile);

    // Clear related caches
    const cacheKey = `${encodedDirName}/${sessionId}`;
    sessionDetailCache.delete(cacheKey);
    projectCache.delete('all');

    return true;
  } catch {
    return false;
  }
}

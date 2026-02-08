import { readdirSync, existsSync, readFileSync, unlinkSync } from 'fs';
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

  return projects;
}

export function getSessionDetail(encodedDirName: string, sessionId: string) {
  // Validate input to prevent path traversal
  if (!isValidEncodedDirName(encodedDirName) || !isValidSessionId(sessionId)) {
    return null;
  }

  const projectDir = join(config.claudeHome, 'projects', encodedDirName);
  const sessionFile = join(projectDir, `${sessionId}.jsonl`);

  if (!existsSync(sessionFile)) {
    return null;
  }

  try {
    const content = readFileSync(sessionFile, 'utf-8');
    const messages = content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line));

    return {
      id: sessionId,
      projectPath: projectDir,
      createdAt: messages[0]?.timestamp || new Date().toISOString(),
      messages,
    };
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
    return true;
  } catch {
    return false;
  }
}

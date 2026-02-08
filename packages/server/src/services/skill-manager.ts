import { existsSync, readFileSync, readdirSync, unlinkSync, lstatSync } from 'fs';
import { join, basename, dirname } from 'path';
import { config } from '../config.js';

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

function parseFrontmatter(content: string): { meta: Record<string, string>; body: string } {
  const meta: Record<string, string> = {};
  if (!content.startsWith('---')) {
    return { meta, body: content };
  }

  const endIndex = content.indexOf('---', 3);
  if (endIndex === -1) {
    return { meta, body: content };
  }

  const frontmatter = content.slice(3, endIndex).trim();
  for (const line of frontmatter.split('\n')) {
    const colonIndex = line.indexOf(':');
    if (colonIndex > 0) {
      const key = line.slice(0, colonIndex).trim();
      const value = line.slice(colonIndex + 1).trim();
      meta[key] = value;
    }
  }

  const body = content.slice(endIndex + 3).trim();
  return { meta, body };
}

function findSkillFiles(dir: string, found: string[] = []): string[] {
  if (!existsSync(dir)) return found;

  try {
    const entries = readdirSync(dir);
    for (const entry of entries) {
      const fullPath = join(dir, entry);
      if (lstatSync(fullPath).isDirectory()) {
        // Check if this directory contains SKILL.md
        const skillMd = join(fullPath, 'SKILL.md');
        if (existsSync(skillMd)) {
          found.push(skillMd);
        }
        // Recurse into subdirectories
        findSkillFiles(fullPath, found);
      }
    }
  } catch {
    // skip
  }
  return found;
}

function readSkillsFromDir(dir: string, scope: 'user' | 'plugin', pluginName?: string): Skill[] {
  const skills: Skill[] = [];

  // Find all skill files (SKILL.md in subdirectories)
  const skillFiles = findSkillFiles(dir);

  for (const filePath of skillFiles) {
    try {
      const content = readFileSync(filePath, 'utf-8');
      const { meta, body } = parseFrontmatter(content);
      const skillDirName = basename(dirname(filePath));

      skills.push({
        name: skillDirName,
        fileName: 'SKILL.md',
        scope,
        path: filePath,
        description: meta['description'] || '',
        argumentHint: meta['argument-hint'] || '',
        content: body,
        pluginName,
      });
    } catch {
      // skip
    }
  }

  // Also handle regular .md files in the directory
  try {
    const files = readdirSync(dir).filter((f) => f.endsWith('.md') && f !== 'SKILL.md');
    for (const file of files) {
      const filePath = join(dir, file);
      if (lstatSync(filePath).isFile()) {
        try {
          const content = readFileSync(filePath, 'utf-8');
          const { meta, body } = parseFrontmatter(content);
          const name = basename(file, '.md');

          skills.push({
            name,
            fileName: file,
            scope,
            path: filePath,
            description: meta['description'] || '',
            argumentHint: meta['argument-hint'] || '',
            content: body,
            pluginName,
          });
        } catch {
          // skip
        }
      }
    }
  } catch {
    // skip
  }

  return skills;
}

export function getUserSkills(): Skill[] {
  const skills: Skill[] = [];
  const commandsDir = join(config.claudeHome, 'commands');
  const skillsDir = join(config.claudeHome, 'skills');

  skills.push(...readSkillsFromDir(commandsDir, 'user'));
  skills.push(...readSkillsFromDir(skillsDir, 'user'));

  return skills;
}

export function getPluginSkills(): Skill[] {
  const skills: Skill[] = [];
  const pluginCacheDir = join(config.claudeHome, 'plugins', 'cache');

  if (!existsSync(pluginCacheDir)) return skills;

  try {
    const plugins = readdirSync(pluginCacheDir);
    for (const pluginName of plugins) {
      const pluginDir = join(pluginCacheDir, pluginName);
      if (!lstatSync(pluginDir).isDirectory()) continue;

      try {
        const versions = readdirSync(pluginDir);
        // Only take the latest version of each plugin
        const latestVersion = versions.sort((a, b) => b.localeCompare(a))[0];
        if (!latestVersion) continue;

        const versionDir = join(pluginDir, latestVersion);
        if (!lstatSync(versionDir).isDirectory()) continue;

        // Scan for skills in version directory
        const pluginSkills = readSkillsFromDir(versionDir, 'plugin', pluginName);
        skills.push(...pluginSkills);
      } catch {
        // skip
      }
    }
  } catch {
    // skip
  }

  return skills;
}

export function getAllSkills(): Skill[] {
  const userSkills = getUserSkills();
  const pluginSkills = getPluginSkills();

  // Combine and deduplicate by unique key: scope + name + pluginName
  const seen = new Set<string>();
  const deduped: Skill[] = [];

  for (const skill of [...userSkills, ...pluginSkills]) {
    const key = `${skill.scope}:${skill.name}:${skill.pluginName || ''}`;
    if (!seen.has(key)) {
      seen.add(key);
      deduped.push(skill);
    }
  }

  return deduped;
}

export function deleteSkill(filePath: string): boolean {
  if (!existsSync(filePath)) return false;
  // Only allow deleting files under ~/.claude/commands/, ~/.claude/skills/
  if (!filePath.includes('.claude/commands/') &&
      !filePath.includes('.claude\\commands\\') &&
      !filePath.includes('.claude/skills/') &&
      !filePath.includes('.claude\\skills\\')) {
    return false;
  }
  try {
    unlinkSync(filePath);
    return true;
  } catch {
    return false;
  }
}

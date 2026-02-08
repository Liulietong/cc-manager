import { existsSync, readFileSync, writeFileSync, readdirSync, mkdirSync, rmSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

interface UserSettings {
  env?: Record<string, string>;
  [key: string]: unknown;
}

const COMMON_PROFILE_NAME = 'common';

// Default common env vars
const DEFAULT_COMMON_ENV: Record<string, string> = {
  'CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS': '1',
  'API_TIMEOUT_MS': '3000000',
  'CLAUDE_CODE_DISABLE_NONESSENTIAL_TRAFFIC': '1',
};

export interface Profile {
  name: string;
  path: string;
  isCommon?: boolean;
}

export interface SettingsData {
  userSettings: { path: string; content: UserSettings };
  activeProfile: string;
  profiles: string[];
  mergedEnv: Record<string, string>;
}

function getActiveProfilePath(): string {
  return join(config.claudeHome, '.active-profile');
}

function getProfilePath(profileName: string): string {
  if (profileName === COMMON_PROFILE_NAME) {
    return join(config.claudeHome, 'profiles', COMMON_PROFILE_NAME, 'settings.json');
  }
  return join(config.claudeHome, `settings.${profileName}.json`);
}

function getProfileDir(profileName: string): string {
  return join(config.claudeHome, 'profiles', profileName);
}

export function getActiveProfile(): string {
  try {
    const path = getActiveProfilePath();
    if (existsSync(path)) {
      return readFileSync(path, 'utf-8').trim();
    }
  } catch {
    // ignore
  }
  return 'default';
}

export function setActiveProfile(profileName: string): boolean {
  try {
    // 1. Get merged env from common + target profile
    const commonSettings = getProfileSettings(COMMON_PROFILE_NAME);
    const targetSettings = getProfileSettings(profileName);

    // Merge: common env + target env (target overrides common)
    const mergedEnv: Record<string, string> = { ...(commonSettings.content.env || {}) };
    if (targetSettings.content.env) {
      for (const [key, value] of Object.entries(targetSettings.content.env)) {
        mergedEnv[key] = value;
      }
    }

    // 2. Read existing settings.json and update only the env section
    const settingsPath = join(config.claudeHome, 'settings.json');
    let existingSettings = { env: {} };
    if (existsSync(settingsPath)) {
      try {
        existingSettings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
      } catch {
        existingSettings = { env: {} };
      }
    }

    // Only update the env section, preserve everything else
    existingSettings.env = mergedEnv;
    writeFileSync(settingsPath, JSON.stringify(existingSettings, null, 2));

    // 3. Write the active profile file
    writeFileSync(getActiveProfilePath(), profileName);

    return true;
  } catch {
    return false;
  }
}

const IGNORED_PROFILE_FILES = ['settings.json', 'settings.local.json'];

function isValidProfileFile(filePath: string): boolean {
  try {
    const content = readFileSync(filePath, 'utf-8');
    const parsed = JSON.parse(content);
    // A valid profile must have 'env' field
    return parsed && typeof parsed === 'object' && 'env' in parsed;
  } catch {
    return false;
  }
}

export function migrateLegacyProfiles(): void {
  // Legacy migration is no longer needed - profiles are already in profiles/ directory
  // This function is kept for backward compatibility but does nothing
}

export function getAllProfiles(): Profile[] {
  const profiles: Profile[] = [];
  const profilesDir = join(config.claudeHome, 'profiles');

  if (!existsSync(profilesDir)) {
    return profiles;
  }

  try {
    const entries = readdirSync(profilesDir);
    for (const entry of entries) {
      // Skip ignored files
      if (IGNORED_PROFILE_FILES.includes(entry)) continue;

      const profilePath = join(profilesDir, entry, 'settings.json');
      if (!existsSync(profilePath)) continue;

      // Validate that this is a real profile (has 'env' field)
      if (!isValidProfileFile(profilePath)) continue;

      profiles.push({
        name: entry,
        path: profilePath,
        isCommon: entry === COMMON_PROFILE_NAME,
      });
    }
  } catch {
    // ignore
  }

  return profiles;
}

export function deleteProfile(profileName: string): boolean {
  // Can't delete common or active profile
  if (profileName === COMMON_PROFILE_NAME || profileName === getActiveProfile()) {
    return false;
  }

  try {
    const profileDir = getProfileDir(profileName);
    if (!existsSync(profileDir)) return false;

    // Delete the profile directory recursively
    rmSync(profileDir, { recursive: true, force: true });
    return true;
  } catch {
    return false;
  }
}

export function createProfile(profileName: string): boolean {
  try {
    // Try new directory structure first
    const profileDir = getProfileDir(profileName);
    if (!existsSync(profileDir)) {
      mkdirSync(profileDir, { recursive: true });
    }
    const settingsPath = join(profileDir, 'settings.json');
    if (!existsSync(settingsPath)) {
      writeFileSync(settingsPath, JSON.stringify({ env: {} }, null, 2));
    }
    return true;
  } catch {
    return false;
  }
}

export function getProfileSettings(profileName: string): { path: string; content: UserSettings } {
  // Try directory structure first
  let settingsPath = join(getProfileDir(profileName), 'settings.json');

  // Fall back to legacy file structure
  if (!existsSync(settingsPath)) {
    settingsPath = getProfilePath(profileName);
  }

  if (profileName === COMMON_PROFILE_NAME) {
    const commonDir = join(config.claudeHome, 'profiles', COMMON_PROFILE_NAME);
    const commonPath = join(commonDir, 'settings.json');

    if (!existsSync(commonPath)) {
      try {
        if (!existsSync(commonDir)) {
          mkdirSync(commonDir, { recursive: true });
        }
        writeFileSync(commonPath, JSON.stringify({ env: DEFAULT_COMMON_ENV }, null, 2));
      } catch {
        // ignore
      }
    }

    return {
      path: commonPath,
      content: existsSync(commonPath)
        ? JSON.parse(readFileSync(commonPath, 'utf-8'))
        : { env: DEFAULT_COMMON_ENV },
    };
  }

  return {
    path: settingsPath,
    content: existsSync(settingsPath)
      ? JSON.parse(readFileSync(settingsPath, 'utf-8'))
      : { env: {} },
  };
}

export function updateProfileEnv(profileName: string, env: Record<string, string>): boolean {
  try {
    let settingsPath = join(getProfileDir(profileName), 'settings.json');

    // Create directory if using new structure
    const profileDir = getProfileDir(profileName);
    if (!existsSync(profileDir) && profileName !== COMMON_PROFILE_NAME) {
      mkdirSync(profileDir, { recursive: true });
      settingsPath = join(profileDir, 'settings.json');
    }

    const current = existsSync(settingsPath)
      ? JSON.parse(readFileSync(settingsPath, 'utf-8'))
      : { env: {} };

    const updated = { ...current, env };
    writeFileSync(settingsPath, JSON.stringify(updated, null, 2));
    return true;
  } catch {
    return false;
  }
}

export function getMergedEnv(): Record<string, string> {
  const activeProfile = getActiveProfile();
  const commonSettings = getProfileSettings(COMMON_PROFILE_NAME);
  const profileSettings = getProfileSettings(activeProfile);

  // Merge: common env + profile env (profile overrides common)
  const merged: Record<string, string> = { ...(commonSettings.content.env || {}) };
  if (profileSettings.content.env) {
    for (const [key, value] of Object.entries(profileSettings.content.env)) {
      merged[key] = value;
    }
  }

  return merged;
}

export function getSettings(): SettingsData {
  const activeProfile = getActiveProfile();
  const profiles = getAllProfiles().map((p) => p.name);
  const userSettings = getProfileSettings(activeProfile);
  const mergedEnv = getMergedEnv();

  return {
    userSettings: { path: userSettings.path, content: userSettings.content },
    activeProfile,
    profiles,
    mergedEnv,
  };
}

export function getUserSettings(): { path: string; content: UserSettings } {
  const activeProfile = getActiveProfile();
  return getProfileSettings(activeProfile);
}

export function updateUserSettings(content: UserSettings): boolean {
  const activeProfile = getActiveProfile();
  return updateProfileEnv(activeProfile, content.env || {});
}

export function getProjectSettings(projectPath: string): {
  projectSettings: { path: string; content: UserSettings };
  localSettings: { path: string; content: Record<string, unknown> };
} {
  const projectClaudeDir = join(projectPath, '.claude');
  const projectSettingsPath = join(projectClaudeDir, 'settings.json');
  const localSettingsPath = join(projectClaudeDir, 'settings.local.json');

  const projectSettings = existsSync(projectSettingsPath)
    ? { path: projectSettingsPath, content: JSON.parse(readFileSync(projectSettingsPath, 'utf-8')) as UserSettings }
    : { path: projectSettingsPath, content: {} as UserSettings };

  const localSettings = existsSync(localSettingsPath)
    ? { path: localSettingsPath, content: JSON.parse(readFileSync(localSettingsPath, 'utf-8')) }
    : { path: localSettingsPath, content: {} };

  return { projectSettings, localSettings };
}

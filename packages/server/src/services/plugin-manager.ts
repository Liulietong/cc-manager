import { existsSync, readFileSync, writeFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

interface Plugin {
  name: string;
  marketplace: string;
  version: string;
  enabled: boolean;
  scope: 'user' | 'local';
  projectPath?: string;
  installPath: string;
  installedAt: string;
  lastUpdated: string;
}

function getEnabledPlugins(): Record<string, boolean> {
  const settingsPath = join(config.claudeHome, 'settings.json');
  if (!existsSync(settingsPath)) return {};
  try {
    const settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    return settings.enabledPlugins || {};
  } catch {
    return {};
  }
}

export function getInstalledPlugins(): Plugin[] {
  const pluginsPath = join(config.claudeHome, 'plugins/installed_plugins.json');

  if (!existsSync(pluginsPath)) {
    return [];
  }

  try {
    const content = JSON.parse(readFileSync(pluginsPath, 'utf-8'));
    const enabledPlugins = getEnabledPlugins();
    const plugins: Plugin[] = [];

    for (const [name, installations] of Object.entries(content.plugins || {})) {
      for (const inst of installations as Record<string, unknown>[]) {
        const isEnabled = enabledPlugins[name] !== false;
        plugins.push({
          name,
          marketplace: 'claude-plugins',
          version: (inst.version as string) || 'unknown',
          enabled: isEnabled,
          scope: ((inst.scope as string) || 'user') as 'user' | 'local',
          projectPath: inst.projectPath as string | undefined,
          installPath: (inst.installPath as string) || '',
          installedAt: (inst.installedAt as string) || new Date().toISOString(),
          lastUpdated: (inst.lastUpdated as string) || new Date().toISOString(),
        });
      }
    }

    return plugins;
  } catch {
    return [];
  }
}

export function togglePlugin(pluginName: string, enabled: boolean): boolean {
  const settingsPath = join(config.claudeHome, 'settings.json');

  try {
    let settings: Record<string, unknown> = {};
    if (existsSync(settingsPath)) {
      settings = JSON.parse(readFileSync(settingsPath, 'utf-8'));
    }

    if (!settings.enabledPlugins) {
      settings.enabledPlugins = {};
    }

    (settings.enabledPlugins as Record<string, boolean>)[pluginName] = enabled;
    writeFileSync(settingsPath, JSON.stringify(settings, null, 2));
    return true;
  } catch {
    return false;
  }
}

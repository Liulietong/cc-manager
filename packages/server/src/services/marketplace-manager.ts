import { existsSync, readFileSync, readdirSync, mkdirSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

export interface MarketplaceConfig {
  id: string;
  name: string;
  source: {
    source: 'github' | 'directory';
    repo?: string;
    path?: string;
  };
  installLocation: string;
  lastUpdated: string;
}

export interface PluginInstall {
  scope: string;
  installPath: string;
  version: string;
  installedAt: string;
  lastUpdated: string;
  gitCommitSha?: string;
  projectPath?: string;
}

export interface InstalledPlugins {
  plugins: Record<string, PluginInstall[]>;
}

function readJSON<T>(path: string): T | null {
  if (!existsSync(path)) return null;
  try {
    return JSON.parse(readFileSync(path, 'utf-8')) as T;
  } catch {
    return null;
  }
}

export function getMarketplaces(): MarketplaceConfig[] {
  const marketplacesPath = join(config.claudeHome, 'plugins', 'known_marketplaces.json');
  const raw = readJSON<Record<string, MarketplaceConfig>>(marketplacesPath);

  if (!raw) return [];

  return Object.entries(raw).map(([id, cfg]) => ({
    id,
    name: cfg.source.repo
      ? cfg.source.repo.split('/')[1].replace(/-/g, ' ')
      : id,
    source: cfg.source,
    installLocation: cfg.installLocation,
    lastUpdated: cfg.lastUpdated,
  }));
}

export function getInstalledPlugins(): Record<string, PluginInstall[]> {
  const installedPath = join(config.claudeHome, 'plugins', 'installed_plugins.json');
  const raw = readJSON<InstalledPlugins>(installedPath);
  return raw?.plugins || {};
}

export function getMarketplacePlugins(): {
  marketplace: string;
  plugins: {
    name: string;
    version: string;
    scope: string;
    status: string;
    installPath: string;
  }[];
}[] {
  const marketplaces = getMarketplaces();
  const installedPlugins = getInstalledPlugins();
  const result: {
    marketplace: string;
    plugins: {
      name: string;
      version: string;
      scope: string;
      status: string;
      installPath: string;
    }[];
  }[] = [];

  // Process each marketplace
  for (const mp of marketplaces) {
    const marketplaceId = mp.id;
    const plugins: {
      name: string;
      version: string;
      scope: string;
      status: string;
      installPath: string;
    }[] = [];

    // Get plugins from installed_plugins.json
    for (const [pluginKey, installs] of Object.entries(installedPlugins)) {
      // Match format: "name@marketplace"
      const [name, marketplace] = pluginKey.split('@');
      if (marketplace === marketplaceId) {
        for (const install of installs) {
          plugins.push({
            name,
            version: install.version,
            scope: install.scope,
            status: install.scope === 'user' ? 'enabled' : 'disabled',
            installPath: install.installPath,
          });
        }
      }
    }

    if (plugins.length > 0 || mp.source.source === 'directory') {
      result.push({
        marketplace: marketplaceId,
        plugins,
      });
    }
  }

  return result;
}

export function getAllPluginsGrouped(): {
  marketplace: string;
  plugins: {
    name: string;
    version: string;
    scope: string;
    status: string;
  }[];
}[] {
  const marketplaces = getMarketplaces();
  const installedPlugins = getInstalledPlugins();
  const result: {
    marketplace: string;
    plugins: {
      name: string;
      version: string;
      scope: string;
      status: string;
    }[];
  }[] = [];

  for (const mp of marketplaces) {
    const marketplaceId = mp.id;
    const plugins: {
      name: string;
      version: string;
      scope: string;
      status: string;
    }[] = [];

    for (const [pluginKey, installs] of Object.entries(installedPlugins)) {
      const [name, marketplace] = pluginKey.split('@');
      if (marketplace === marketplaceId) {
        for (const install of installs) {
          plugins.push({
            name,
            version: install.version,
            scope: install.scope,
            status: install.scope === 'user' ? 'enabled' : 'disabled',
          });
        }
      }
    }

    if (plugins.length > 0 || mp.source.source === 'directory') {
      result.push({
        marketplace: marketplaceId,
        plugins,
      });
    }
  }

  return result;
}

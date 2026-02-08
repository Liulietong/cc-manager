import chokidar from 'chokidar';
import { config } from '../config.js';

type EventHandler = (event: string, data: unknown) => void;

let watcher: chokidar.FSWatcher | null = null;
const eventHandlers: Set<EventHandler> = new Set();
let watcherStarted = false;

export function startFileWatcher() {
  if (watcherStarted) return;

  const projectsDir = `${config.claudeHome}/projects`;
  const settingsPath = `${config.claudeHome}/settings.json`;
  const pluginsPath = `${config.claudeHome}/plugins/installed_plugins.json`;

  watcher = chokidar.watch([projectsDir, settingsPath, pluginsPath], {
    ignored: /node_modules/,
    persistent: true,
    ignoreInitial: true, // Don't emit events for existing files
    awaitWriteFinish: {
      stabilityThreshold: 100,
      pollInterval: 50,
    },
  });

  watcher.on('all', (event, path) => {
    const eventType = path.includes('projects')
      ? 'session-change'
      : path.includes('settings')
        ? 'settings-change'
        : 'plugin-change';

    const data = { type: event, path };

    eventHandlers.forEach((handler) => handler(eventType, data));
  });

  watcherReady().then(() => {
    watcherStarted = true;
  });

  return watcher;
}

function watcherReady(): Promise<void> {
  return new Promise((resolve) => {
    if (!watcher) {
      resolve();
      return;
    }
    watcher.on('ready', () => resolve());
    // If already ready, resolve immediately
    if ((watcher as any)._watchers && (watcher as any)._watchers.size > 0) {
      setTimeout(resolve, 0);
    }
  });
}

export function stopFileWatcher() {
  if (watcher) {
    watcher.close();
    watcher = null;
  }
}

export function onFileChange(handler: EventHandler) {
  eventHandlers.add(handler);
  return () => eventHandlers.delete(handler);
}

export function broadcastSSE(event: string, data: unknown) {
  // This will be called from SSE route handler
  eventHandlers.forEach((handler) => handler(event, data));
}

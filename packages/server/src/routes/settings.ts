import { FastifyInstance, FastifyRequest } from 'fastify';
import {
  getSettings,
  getUserSettings,
  updateUserSettings,
  getProjectSettings,
  getAllProfiles,
  setActiveProfile,
  createProfile,
  deleteProfile,
  getActiveProfile,
} from '../services/settings-manager.js';
import { existsSync, readFileSync } from 'fs';
import { join } from 'path';
import { config } from '../config.js';

export async function settingsRoutes(app: FastifyInstance) {
  // GET /api/settings - Get user settings with profiles info
  app.get('/', async () => {
    const settings = getSettings();
    // Also read main settings.json
    const mainSettingsPath = join(config.claudeHome, 'settings.json');
    let mainSettings = null;
    if (existsSync(mainSettingsPath)) {
      try {
        mainSettings = JSON.parse(readFileSync(mainSettingsPath, 'utf-8'));
      } catch {
        // ignore
      }
    }
    return { ...settings, mainSettings };
  });

  // GET /api/settings/profiles - Get all profiles with active status
  app.get('/profiles', async () => {
    const profiles = getAllProfiles();
    const activeProfile = getActiveProfile();
    return { profiles, activeProfile };
  });

  // GET /api/settings/profiles/:name - Get profile settings
  app.get<{ Params: { name: string } }>('/profiles/:name', async (request) => {
    const { name } = request.params;
    const { getProfileSettings } = await import('../services/settings-manager.js');
    return getProfileSettings(name);
  });

  // PUT /api/settings/profiles/:name - Update profile settings
  app.put<{ Params: { name: string }; Body: { env: Record<string, string> } }>(
    '/profiles/:name',
    async (request) => {
      const { name } = request.params;
      const { env } = request.body;
      const { updateProfileEnv } = await import('../services/settings-manager.js');
      const success = updateProfileEnv(name, env);
      if (!success) {
        throw new Error('Failed to update profile');
      }
      return { success: true };
    }
  );

  // DELETE /api/settings/profiles/:name - Delete a profile
  app.delete<{ Params: { name: string } }>('/profiles/:name', async (request, reply) => {
    const { name } = request.params;
    const success = deleteProfile(name);
    if (!success) {
      reply.code(404);
      return { success: false, error: 'Failed to delete profile (may be active or common)' };
    }
    return { success: true };
  });

  // PUT /api/settings/active-profile - Switch active profile
  app.put<{ Body: { profile: string } }>('/active-profile', async (request, reply) => {
    const { profile } = request.body;
    const success = setActiveProfile(profile);
    if (!success) {
      reply.code(404);
      return { success: false, error: 'Failed to set active profile' };
    }
    return { success: true, activeProfile: profile };
  });

  // POST /api/settings/profiles - Create new profile
  app.post<{ Body: { name: string } }>('/profiles', async (request, reply) => {
    const { name } = request.body;
    if (!name || name.includes('/') || name.includes('\\')) {
      reply.code(400);
      return { success: false, error: 'Invalid profile name' };
    }
    const success = createProfile(name);
    if (!success) {
      reply.code(500);
      return { success: false, error: 'Failed to create profile' };
    }
    return { success: true, name };
  });

  // GET /api/settings/project?path=xxx - Get project settings
  app.get<{ Querystring: { path: string } }>('/project', async (request) => {
    const { path } = request.query;
    const { projectSettings, localSettings } = getProjectSettings(path);
    return { projectSettings, localSettings };
  });

  // PUT /api/settings - Update user settings (current active profile)
  app.put<{ Body: { content: Record<string, unknown> } }>('/', async (request) => {
    const { content } = request.body;
    const success = updateUserSettings(content as any);
    if (!success) {
      throw new Error('Failed to update settings');
    }
    return { success: true };
  });
}

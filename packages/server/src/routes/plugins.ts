import { FastifyInstance } from 'fastify';
import { getInstalledPlugins, togglePlugin } from '../services/plugin-manager.js';

export async function pluginsRoutes(app: FastifyInstance) {
  // GET /api/plugins - Get all installed plugins
  app.get('/', async () => {
    const plugins = getInstalledPlugins();
    return { plugins };
  });

  // PUT /api/plugins/:name/toggle - Toggle plugin enabled state
  app.put<{ Params: { name: string }; Body: { enabled: boolean } }>(
    '/:name/toggle',
    async (request) => {
      const { name } = request.params;
      const { enabled } = request.body;

      const success = togglePlugin(name, enabled);

      if (!success) {
        throw new Error('Plugin not found');
      }

      return { success: true };
    }
  );
}

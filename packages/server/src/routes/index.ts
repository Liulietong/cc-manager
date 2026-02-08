import { FastifyInstance } from 'fastify';
import { sessionsRoutes } from './sessions.js';
import { settingsRoutes } from './settings.js';
import { pluginsRoutes } from './plugins.js';
import { skillsRoutes } from './skills.js';
import { sseRoutes } from './sse.js';
import { mcpRoutes } from './mcp.js';
import { marketplaceRoutes } from './marketplace.js';

export async function routes(app: FastifyInstance) {
  await app.register(sessionsRoutes, { prefix: '/api/sessions' });
  await app.register(settingsRoutes, { prefix: '/api/settings' });
  await app.register(pluginsRoutes, { prefix: '/api/plugins' });
  await app.register(skillsRoutes, { prefix: '/api/skills' });
  await app.register(mcpRoutes, { prefix: '/api/mcp' });
  await app.register(marketplaceRoutes, { prefix: '/api/marketplace' });
  await app.register(sseRoutes, { prefix: '/api' });
}

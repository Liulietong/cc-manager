import { FastifyInstance } from 'fastify';
import {
  getMarketplaces,
  getAllPluginsGrouped,
  getInstalledPlugins,
} from '../services/marketplace-manager.js';

export async function marketplaceRoutes(app: FastifyInstance) {
  // GET /api/marketplace - Get configured marketplaces
  app.get('/', async () => {
    const marketplaces = getMarketplaces();
    return { marketplaces };
  });

  // GET /api/marketplace/plugins - Get installed plugins grouped by marketplace
  app.get('/plugins', async () => {
    const marketplacePlugins = getAllPluginsGrouped();
    return { marketplacePlugins };
  });

  // GET /api/marketplace/installed - Get flat list of installed plugins
  app.get('/installed', async () => {
    const plugins = getInstalledPlugins();
    return { plugins };
  });
}

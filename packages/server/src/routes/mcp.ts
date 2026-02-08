import { FastifyInstance } from 'fastify';
import {
  getMCPServers,
  addMCPServer,
  deleteMCPServer,
} from '../services/mcp-manager.js';

export async function mcpRoutes(app: FastifyInstance) {
  // GET /api/mcp - Get all MCP servers
  app.get('/', async () => {
    const servers = getMCPServers();
    return { servers };
  });

  // PUT /api/mcp/servers/:name - Add/update MCP server
  app.put<{ Params: { name: string }; Body: { command: string; args: string[]; env?: Record<string, string>; disabled?: boolean } }>(
    '/servers/:name',
    async (request, reply) => {
      const { name } = request.params;
      const { command, args, env, disabled } = request.body;

      const success = addMCPServer(name, { command, args, env, disabled });
      if (!success) {
        reply.code(500);
        return { success: false, error: 'Failed to update MCP server' };
      }
      return { success: true };
    }
  );

  // DELETE /api/mcp/servers/:name - Delete MCP server
  app.delete<{ Params: { name: string } }>('/servers/:name', async (request, reply) => {
    const { name } = request.params;
    const success = deleteMCPServer(name);
    if (!success) {
      reply.code(404);
      return { success: false, error: 'Server not found' };
    }
    return { success: true };
  });
}

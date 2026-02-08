import { FastifyInstance } from 'fastify';
import { startFileWatcher, onFileChange } from '../services/file-watcher.js';

const clients: Set<{ reply: any }> = new Set();

export async function sseRoutes(app: FastifyInstance) {
  // Start file watcher once
  startFileWatcher();

  // GET /api/sse - SSE endpoint
  app.get('/sse', (request, reply) => {
    reply.raw.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    });

    const client = { reply: reply.raw };
    clients.add(client);

    // Send initial connection event
    reply.raw.write(`event: connected\ndata: ${JSON.stringify({ timestamp: new Date().toISOString() })}\n\n`);

    // Handle client disconnect
    request.raw.on('close', () => {
      clients.delete(client);
    });
  });

  // Broadcast to all connected clients
  onFileChange((event, data) => {
    const message = `event: ${event}\ndata: ${JSON.stringify(data)}\n\n`;
    clients.forEach((client) => {
      try {
        client.reply.write(message);
      } catch {
        clients.delete(client);
      }
    });
  });
}

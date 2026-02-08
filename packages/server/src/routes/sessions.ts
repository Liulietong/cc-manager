import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { getProjects, getSessionDetail, deleteSession } from '../services/session-manager.js';

export async function sessionsRoutes(app: FastifyInstance) {
  // GET /api/sessions - List all projects and sessions
  app.get('/', async () => {
    const projects = getProjects();
    return { projects };
  });

  // GET /api/sessions/:encodedPath/:sessionId - Get session detail
  app.get<{
    Params: { encodedPath: string; sessionId: string };
  }>('/:encodedPath/:sessionId', async (request) => {
    const { encodedPath, sessionId } = request.params;
    const session = getSessionDetail(encodedPath, sessionId);

    if (!session) {
      throw new Error('Session not found');
    }

    return session;
  });

  // GET /api/sessions/:encodedPath/:sessionId/export?format=json|markdown
  app.get<{
    Params: { encodedPath: string; sessionId: string };
    Querystring: { format?: string };
  }>('/:encodedPath/:sessionId/export', async (request, reply) => {
    const { encodedPath, sessionId } = request.params;
    const format = request.query.format || 'markdown';

    const session = getSessionDetail(encodedPath, sessionId);
    if (!session) {
      reply.code(404);
      return { error: 'Session not found' };
    }

    if (format === 'json') {
      reply.header('Content-Type', 'application/json');
      reply.header('Content-Disposition', `attachment; filename="${sessionId}.json"`);
      return session;
    }

    // Markdown format
    const markdown = formatSessionAsMarkdown(session);
    reply.header('Content-Type', 'text/markdown');
    reply.header('Content-Disposition', `attachment; filename="${sessionId}.md"`);
    return markdown;
  });

  // DELETE /api/sessions/:encodedPath/:sessionId - Delete session
  app.delete<{
    Params: { encodedPath: string; sessionId: string };
  }>('/:encodedPath/:sessionId', async (request, reply) => {
    const { encodedPath, sessionId } = request.params;
    const success = deleteSession(encodedPath, sessionId);

    if (!success) {
      reply.code(404);
      return { success: false, error: 'Session not found' };
    }

    return { success: true };
  });
}

function formatSessionAsMarkdown(session: any): string {
  let md = `# Claude Session\n\n`;
  md += `- **Session ID**: \`${session.id}\`\n`;
  md += `- **Project**: \`${session.projectPath}\`\n`;
  md += `- **Created**: ${session.createdAt}\n`;
  md += `- **Messages**: ${session.messages.length}\n\n`;
  md += `---\n\n`;
  md += `## Conversation\n\n`;

  for (const msg of session.messages) {
    const msgType = msg.type;
    if (['queue-operation', 'progress', 'file-history-snapshot'].includes(msgType)) continue;
    if (msg.isMeta) continue;

    const role = msg.message?.role || msgType;
    const isUser = role === 'user';
    const isAssistant = role === 'assistant';

    const content = msg.message?.content;
    let text = '';
    if (typeof content === 'string') {
      text = content;
    } else if (Array.isArray(content)) {
      for (const block of content) {
        if (block.type === 'text') {
          text += block.text + '\n';
        } else if (block.type === 'tool_use') {
          text += `\n### Tool: ${block.name}\n`;
          text += '```json\n' + JSON.stringify(block.input, null, 2) + '\n```\n';
        } else if (block.type === 'tool_result') {
          const resultText = typeof block.content === 'string'
            ? block.content
            : block.content?.map((c: any) => c.text).join('\n') || '';
          text += `\n**Tool Result**:\n${resultText}\n`;
        }
      }
    }

    if (!text.trim()) continue;

    md += `### ${isUser ? '👤 User' : '🤖 Assistant'}\n\n`;
    md += `${text.trim()}\n\n`;
    md += `---\n\n`;
  }

  return md;
}

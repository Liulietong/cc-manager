import { FastifyInstance } from 'fastify';
import { getAllSkills, deleteSkill } from '../services/skill-manager.js';

export async function skillsRoutes(app: FastifyInstance) {
  // GET /api/skills - Get all skills
  app.get('/', async () => {
    const skills = getAllSkills();
    return { skills };
  });

  // GET /api/skills/:name - Get skill detail
  app.get<{ Params: { name: string }; Querystring: { path?: string } }>(
    '/:name',
    async (request) => {
      const { name } = request.params;
      const skills = getAllSkills();
      const skill = skills.find((s) => s.name === name && (!request.query.path || s.path === request.query.path));
      if (!skill) {
        throw new Error('Skill not found');
      }
      return skill;
    }
  );

  // DELETE /api/skills - Delete a skill by path
  app.delete<{ Body: { path: string } }>('/', async (request, reply) => {
    const { path } = request.body;
    const success = deleteSkill(path);
    if (!success) {
      reply.code(404);
      return { success: false, error: 'Skill not found' };
    }
    return { success: true };
  });
}

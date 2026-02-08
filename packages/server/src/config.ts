import path from 'path';

export const config = {
  port: 3456,
  claudeHome: process.env.CLAUDE_HOME || path.join(process.env.HOME || '', '.claude'),
};

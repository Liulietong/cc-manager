import { readFileSync } from 'fs';

export type Message = UserMessage | AssistantMessage | ProgressMessage;

interface UserMessage {
  type: 'user';
  content: string;
  timestamp: string;
  uuid: string;
}

interface AssistantMessage {
  type: 'assistant';
  content: unknown[];
  timestamp: string;
  uuid: string;
}

interface ProgressMessage {
  type: 'progress';
  data: unknown;
  timestamp: string;
}

export function parseJSONL(filePath: string): Message[] {
  try {
    const content = readFileSync(filePath, 'utf-8');
    return content
      .split('\n')
      .filter((line) => line.trim())
      .map((line) => JSON.parse(line) as Message);
  } catch {
    return [];
  }
}

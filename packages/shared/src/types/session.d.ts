export interface Project {
    path: string;
    encodedPath: string;
    sessions: SessionMeta[];
}
export interface SessionMeta {
    id: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}
export interface Session {
    id: string;
    projectPath: string;
    createdAt: string;
    messages: Message[];
}
export type Message = UserMessage | AssistantMessage | ProgressMessage;
export interface UserMessage {
    type: 'user';
    content: string;
    timestamp: string;
    uuid: string;
}
export interface AssistantMessage {
    type: 'assistant';
    content: ContentBlock[];
    timestamp: string;
    uuid: string;
}
export interface ContentBlock {
    type: 'text' | 'tool_use' | 'tool_result';
    text?: string;
    name?: string;
    input?: Record<string, unknown>;
}
export interface ProgressMessage {
    type: 'progress';
    data: {
        type: string;
        hookEvent?: string;
        hookName?: string;
    };
    timestamp: string;
}
//# sourceMappingURL=session.d.ts.map
export interface Project {
    path: string;
    encodedPath: string;
    sessions: SessionMeta[];
}
export interface Session {
    id: string;
    projectPath: string;
    createdAt: string;
    messages: unknown[];
}
export interface SessionMeta {
    id: string;
    createdAt: string;
    updatedAt: string;
    messageCount: number;
}
export interface Plugin {
    name: string;
    displayName: string;
    description: string;
    enabled: boolean;
    installed: boolean;
    version?: string;
    author?: string;
    tags?: string[];
    scope?: string;
    projectPath?: string;
}
export interface UserSettings {
    env?: Record<string, string>;
    [key: string]: unknown;
}
export interface ProjectSettings {
    env?: Record<string, string>;
    [key: string]: unknown;
}
export declare function getProjects(): Promise<{
    projects: Project[];
}>;
export declare function getSessionDetail(encodedPath: string, sessionId: string): Promise<Session>;
export declare function deleteSession(encodedPath: string, sessionId: string): Promise<{
    success: boolean;
}>;
export declare function getUserSettings(): Promise<{
    userSettings: {
        path: string;
        content: UserSettings;
    };
    activeProfile: string;
    profiles: string[];
}>;
export declare function getProjectSettings(path: string): Promise<{
    projectSettings: {
        path: string;
        content: ProjectSettings;
    };
    localSettings: {
        path: string;
        content: Record<string, unknown>;
    };
}>;
export declare function updateUserSettings(content: UserSettings): Promise<{
    success: boolean;
}>;
export declare function getPlugins(): Promise<{
    plugins: Plugin[];
}>;
export declare function togglePlugin(name: string, enabled: boolean): Promise<{
    success: boolean;
}>;
export interface Skill {
    name: string;
    fileName: string;
    scope: 'user' | 'plugin';
    path: string;
    description: string;
    argumentHint: string;
    content: string;
    pluginName?: string;
}
export declare function getSkills(): Promise<{
    skills: Skill[];
}>;
export declare function deleteSkill(path: string): Promise<{
    success: boolean;
}>;
//# sourceMappingURL=api.d.ts.map
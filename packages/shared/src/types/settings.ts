export interface UserSettings {
  env?: Record<string, string>;
  model?: 'opus' | 'sonnet' | 'haiku';
  enabledPlugins?: Record<string, boolean>;
  alwaysThinkingEnabled?: boolean;
}

export interface ProjectSettings {
  permissions?: {
    allow?: string[];
    defaultMode?: string;
  };
}

export interface SettingsResponse {
  userSettings: {
    path: string;
    content: UserSettings;
  };
  activeProfile: string;
  profiles: string[];
}

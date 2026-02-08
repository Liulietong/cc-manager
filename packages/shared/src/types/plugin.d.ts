export interface Plugin {
    name: string;
    marketplace: string;
    version: string;
    enabled: boolean;
    scope: 'user' | 'local';
    projectPath?: string;
    description?: string;
    installPath: string;
    installedAt: string;
    lastUpdated: string;
}
export interface InstalledPlugins {
    version: number;
    plugins: Record<string, PluginInstallation[]>;
}
export interface PluginInstallation {
    scope: 'user' | 'local';
    projectPath?: string;
    installPath: string;
    version: string;
    installedAt: string;
    lastUpdated: string;
    gitCommitSha?: string;
}
//# sourceMappingURL=plugin.d.ts.map
export declare function useUserSettings(): import("@tanstack/react-query").UseQueryResult<{
    userSettings: {
        path: string;
        content: import("../lib/api").UserSettings;
    };
    activeProfile: string;
    profiles: string[];
}, Error>;
export declare function useUpdateSettings(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
}, Error, Record<string, unknown>, unknown>;
//# sourceMappingURL=useSettings.d.ts.map
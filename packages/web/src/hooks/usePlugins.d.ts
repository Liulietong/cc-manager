export declare function usePlugins(): import("@tanstack/react-query").UseQueryResult<{
    plugins: import("../lib/api").Plugin[];
}, Error>;
export declare function useTogglePlugin(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
}, Error, {
    name: string;
    enabled: boolean;
}, unknown>;
//# sourceMappingURL=usePlugins.d.ts.map
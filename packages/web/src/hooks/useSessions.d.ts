export declare function useProjects(): import("@tanstack/react-query").UseQueryResult<{
    projects: import("../lib/api").Project[];
}, Error>;
export declare function useSessionDetail(encodedPath: string, sessionId: string): import("@tanstack/react-query").UseQueryResult<import("../lib/api").Session, Error>;
export declare function useDeleteSession(): import("@tanstack/react-query").UseMutationResult<{
    success: boolean;
}, Error, {
    encodedPath: string;
    sessionId: string;
}, unknown>;
//# sourceMappingURL=useSessions.d.ts.map
type SSEEventType = 'connected' | 'session-change' | 'settings-change' | 'plugin-change';
interface SSEEvent {
    type: SSEEventType;
    data: unknown;
}
export declare function useSSE(): {
    isConnected: boolean;
    lastEvent: SSEEvent | null;
};
export {};
//# sourceMappingURL=useSSE.d.ts.map
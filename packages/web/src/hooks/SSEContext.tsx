import { createContext, useContext, useEffect, useRef, useState, ReactNode } from 'react';

export type SSEEventType = 'connected' | 'session-change' | 'settings-change' | 'plugin-change';

export interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

export interface SSEContextValue {
  isConnected: boolean;
  lastEvent: SSEEvent | null;
  debouncedEvent: SSEEvent | null;
}

export const SSEContext = createContext<SSEContextValue>({
  isConnected: false,
  lastEvent: null,
  debouncedEvent: null,
});

export function useSSE() {
  return useContext(SSEContext);
}

const DEBOUNCE_DELAY = 200; // ms - debounce rapid SSE events

export function SSEProvider({ children }: { children: React.ReactNode }) {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const [debouncedEvent, setDebouncedEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);
  const debounceTimeoutRef = useRef<number | null>(null);

  // Debounce function for SSE events
  const debounceEvent = (event: SSEEvent) => {
    // Clear existing debounce timeout
    if (debounceTimeoutRef.current) {
      clearTimeout(debounceTimeoutRef.current);
    }
    // Set new debounced event after delay
    debounceTimeoutRef.current = window.setTimeout(() => {
      setDebouncedEvent(event);
    }, DEBOUNCE_DELAY);
  };

  useEffect(() => {
    // Set a timeout - if connection doesn't establish in 5s, mark as failed
    timeoutRef.current = window.setTimeout(() => {
      setIsConnected(false);
    }, 5000);

    let eventSource: EventSource;
    try {
      eventSource = new EventSource('/api/sse');
    } catch {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      setIsConnected(false);
      return;
    }
    eventSourceRef.current = eventSource;

    eventSource.onopen = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsConnected(true);
    };

    eventSource.onmessage = (event) => {
      // Ignore connected events
      if (event.data?.includes('connected')) return;
    };

    eventSource.addEventListener('session-change', ((event: MessageEvent) => {
      const sseEvent = { type: 'session-change' as SSEEventType, data: JSON.parse(event.data) };
      setLastEvent(sseEvent);
      debounceEvent(sseEvent);
    }) as EventListener);

    eventSource.addEventListener('settings-change', ((event: MessageEvent) => {
      const sseEvent = { type: 'settings-change' as SSEEventType, data: JSON.parse(event.data) };
      setLastEvent(sseEvent);
      debounceEvent(sseEvent);
    }) as EventListener);

    eventSource.addEventListener('plugin-change', ((event: MessageEvent) => {
      const sseEvent = { type: 'plugin-change' as SSEEventType, data: JSON.parse(event.data) };
      setLastEvent(sseEvent);
      debounceEvent(sseEvent);
    }) as EventListener);

    eventSource.onerror = () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      setIsConnected(false);

      // Clear any existing reconnect timeout
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      // Reconnect after 3 seconds
      reconnectTimeoutRef.current = window.setTimeout(() => {
        if (eventSourceRef.current === eventSource) {
          try {
            const newSource = new EventSource('/api/sse');
            eventSourceRef.current = newSource;
            // Set a new timeout for the new connection
            timeoutRef.current = window.setTimeout(() => {
              setIsConnected(false);
            }, 5000);
          } catch {
            // Ignore reconnection errors
          }
        }
      }, 3000);
    };

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }
      if (debounceTimeoutRef.current) {
        clearTimeout(debounceTimeoutRef.current);
      }
      eventSource.close();
    };
  }, []);

  return (
    <SSEContext.Provider value={{ isConnected, lastEvent, debouncedEvent }}>
      {children}
    </SSEContext.Provider>
  );
}

import { useEffect, useRef, useState } from 'react';

type SSEEventType = 'connected' | 'session-change' | 'settings-change' | 'plugin-change';

interface SSEEvent {
  type: SSEEventType;
  data: unknown;
}

export function useSSE() {
  const [isConnected, setIsConnected] = useState(false);
  const [lastEvent, setLastEvent] = useState<SSEEvent | null>(null);
  const eventSourceRef = useRef<EventSource | null>(null);
  const timeoutRef = useRef<number | null>(null);
  const reconnectTimeoutRef = useRef<number | null>(null);

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
      setLastEvent({ type: 'session-change', data: JSON.parse(event.data) });
    }) as EventListener);

    eventSource.addEventListener('settings-change', ((event: MessageEvent) => {
      setLastEvent({ type: 'settings-change', data: JSON.parse(event.data) });
    }) as EventListener);

    eventSource.addEventListener('plugin-change', ((event: MessageEvent) => {
      setLastEvent({ type: 'plugin-change', data: JSON.parse(event.data) });
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
      eventSource.close();
    };
  }, []);

  return { isConnected, lastEvent };
}

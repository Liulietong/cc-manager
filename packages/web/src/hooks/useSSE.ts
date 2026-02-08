import { useContext } from 'react';
import { SSEContext, SSEContextValue } from './SSEContext';

export function useSSE(): SSEContextValue {
  return useContext(SSEContext);
}

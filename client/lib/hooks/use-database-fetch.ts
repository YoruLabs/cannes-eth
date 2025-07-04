import React from 'react';

const useDatabaseFetchInitialState = {
  error: undefined,
  data: undefined,
  loading: false,
};

type UseDatabaseFetchState = {
  error: Error | undefined;
  data: any | undefined;
  loading: boolean;
};

const useDatabaseFetchReducer = (
  state: UseDatabaseFetchState,
  action: { type: 'loading' | 'fetched' | 'error'; payload?: any },
) => {
  switch (action.type) {
    case 'loading':
      return { ...useDatabaseFetchInitialState, data: state.data, loading: true };
    case 'fetched':
      return { ...useDatabaseFetchInitialState, data: action.payload, loading: false };
    case 'error':
      return { ...useDatabaseFetchInitialState, error: action.payload, loading: false };
    default:
      return state;
  }
};

export interface UseDatabaseFetchConfig {
  useCache?: boolean;
  retryOnError?: boolean;
  retryDelay?: number;
}

export function useDatabaseFetch(config: UseDatabaseFetchConfig = {}) {
  const cacheRef = React.useRef({} as Record<string, any>);
  const abortControllerRef = React.useRef<AbortController | null>(null);

  const [state, dispatch] = React.useReducer(
    useDatabaseFetchReducer,
    useDatabaseFetchInitialState,
  );

  const executeQuery = React.useCallback(
    async (queryKey: string, queryFn: () => Promise<any>) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      const controller = new AbortController();
      abortControllerRef.current = controller;

      const cachedResponse = cacheRef.current[queryKey];

      if (cachedResponse && config.useCache) {
        dispatch({ type: 'fetched', payload: cachedResponse });
        return cachedResponse;
      }

      dispatch({ type: 'loading' });

      try {
        const result = await queryFn();

        if (controller.signal.aborted) {
          return;
        }

        abortControllerRef.current = null;

        if (config.useCache) {
          cacheRef.current[queryKey] = result;
        }

        dispatch({ type: 'fetched', payload: result });
        return result;
      } catch (error: any) {
        if (!controller.signal.aborted) {
          console.error('Database query error:', error);
          dispatch({ type: 'error', payload: error });
          
          if (config.retryOnError) {
            setTimeout(() => {
              executeQuery(queryKey, queryFn);
            }, config.retryDelay || 1000);
          }
        }
        throw error;
      }
    },
    [config.useCache, config.retryOnError, config.retryDelay],
  );

  const clearCache = React.useCallback((queryKey?: string) => {
    if (queryKey) {
      delete cacheRef.current[queryKey];
    } else {
      cacheRef.current = {};
    }
  }, []);

  const reset = React.useCallback(() => {
    dispatch({ type: 'fetched', payload: undefined });
    clearCache();
  }, [clearCache]);

  React.useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return { 
    ...state, 
    executeQuery, 
    clearCache, 
    reset,
    isLoading: state.loading,
    hasError: !!state.error,
    hasData: !!state.data
  };
} 
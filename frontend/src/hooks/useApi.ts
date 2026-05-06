import { useState, useCallback } from 'react';
import type { AxiosError } from 'axios';

interface ApiState<T> {
  data: T | null;
  loading: boolean;
  error: string | null;
}

export function useApi<T, A extends unknown[]>(
  fn: (...args: A) => Promise<{ data: T }>
) {
  const [state, setState] = useState<ApiState<T>>({ data: null, loading: false, error: null });

  const execute = useCallback(
    async (...args: A): Promise<T | null> => {
      setState({ data: null, loading: true, error: null });
      try {
        const { data } = await fn(...args);
        setState({ data, loading: false, error: null });
        return data;
      } catch (err) {
        const message =
          (err as AxiosError<{ message: string }>).response?.data?.message ||
          'Something went wrong';
        setState({ data: null, loading: false, error: message });
        return null;
      }
    },
    [fn]
  );

  return { ...state, execute };
}

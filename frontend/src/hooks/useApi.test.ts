import { renderHook, act, waitFor } from '@testing-library/react';
import { useApi } from './useApi';

describe('useApi', () => {
  test('starts with null data, false loading, and null error', () => {
    const { result } = renderHook(() => useApi(async () => ({ data: 'unused' })));

    expect(result.current.data).toBeNull();
    expect(result.current.loading).toBe(false);
    expect(result.current.error).toBeNull();
  });

  test('toggles loading=true while the request is pending', async () => {
    let resolveFn: (v: { data: string }) => void = () => {};
    const pending = new Promise<{ data: string }>((resolve) => {
      resolveFn = resolve;
    });
    const { result } = renderHook(() => useApi(() => pending));

    act(() => {
      result.current.execute();
    });

    expect(result.current.loading).toBe(true);
    expect(result.current.data).toBeNull();

    await act(async () => {
      resolveFn({ data: 'done' });
      await pending;
    });

    expect(result.current.loading).toBe(false);
  });

  test('stores data on success and returns it from execute', async () => {
    const fn = async (id: number) => ({ data: { id, name: 'Alice' } });
    const { result } = renderHook(() => useApi(fn));

    let returned: { id: number; name: string } | null = null;
    await act(async () => {
      returned = await result.current.execute(7);
    });

    expect(returned).toEqual({ id: 7, name: 'Alice' });
    expect(result.current.data).toEqual({ id: 7, name: 'Alice' });
    expect(result.current.error).toBeNull();
    expect(result.current.loading).toBe(false);
  });

  test('stores the server message when execute fails with an axios error', async () => {
    const fn = async () => {
      throw { response: { data: { message: 'Email already registered' } } };
    };
    const { result } = renderHook(() => useApi(fn));

    let returned: unknown;
    await act(async () => {
      returned = await result.current.execute();
    });

    expect(returned).toBeNull();
    expect(result.current.data).toBeNull();
    expect(result.current.error).toBe('Email already registered');
    expect(result.current.loading).toBe(false);
  });

  test('falls back to "Something went wrong" when error has no message', async () => {
    const fn = async () => {
      throw new Error('plain js error');
    };
    const { result } = renderHook(() => useApi(fn));

    await act(async () => {
      await result.current.execute();
    });

    expect(result.current.error).toBe('Something went wrong');
  });

  test('execute keeps the same reference across re-renders when fn is stable', () => {
    const fn = async () => ({ data: 'x' });
    const { result, rerender } = renderHook(() => useApi(fn));

    const first = result.current.execute;
    rerender();
    expect(result.current.execute).toBe(first);
  });
});

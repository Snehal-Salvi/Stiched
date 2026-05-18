import { renderHook, act, waitFor } from '@testing-library/react';
import { vi } from 'vitest';
import type { ReactNode } from 'react';
import { AuthProvider, useAuth } from './AuthContext';
import type { User } from '../types';

const getMeMock = vi.fn();
vi.mock('../api/auth', () => ({
  getMe: (...args: unknown[]) => getMeMock(...args),
}));

const mockUser: User = {
  _id: 'u-1',
  name: 'Alice',
  email: 'alice@example.com',
  role: 'customer',
  avatar: '',
  isVerified: true,
};

const wrapper = ({ children }: { children: ReactNode }) => <AuthProvider>{children}</AuthProvider>;

beforeEach(() => {
  localStorage.clear();
  getMeMock.mockReset();
});

describe('AuthProvider initial state', () => {
  test('has no user/token and finishes loading when localStorage is empty', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(getMeMock).not.toHaveBeenCalled();
  });

  test('hydrates user from localStorage when both token and user are present', async () => {
    localStorage.setItem('token', 'cached-token');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.token).toBe('cached-token');
    expect(result.current.user).toEqual(mockUser);
    expect(getMeMock).not.toHaveBeenCalled();
  });

  test('fetches the user via getMe when only the token is in localStorage', async () => {
    localStorage.setItem('token', 'cached-token');
    getMeMock.mockResolvedValue({ data: mockUser });

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.user).toEqual(mockUser));
    expect(getMeMock).toHaveBeenCalledTimes(1);
    expect(JSON.parse(localStorage.getItem('user') as string)).toEqual(mockUser);
  });

  test('logs out when getMe fails on mount', async () => {
    localStorage.setItem('token', 'cached-token');
    getMeMock.mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => useAuth(), { wrapper });

    await waitFor(() => expect(result.current.isLoading).toBe(false));

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
  });
});

describe('login', () => {
  test('stores token and user in localStorage and state', async () => {
    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.isLoading).toBe(false));

    act(() => {
      result.current.login('new-token', mockUser);
    });

    expect(result.current.token).toBe('new-token');
    expect(result.current.user).toEqual(mockUser);
    expect(localStorage.getItem('token')).toBe('new-token');
    expect(JSON.parse(localStorage.getItem('user') as string)).toEqual(mockUser);
  });
});

describe('logout', () => {
  test('clears state and localStorage', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    act(() => {
      result.current.logout();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
    expect(localStorage.getItem('token')).toBeNull();
    expect(localStorage.getItem('user')).toBeNull();
  });
});

describe('refreshUser', () => {
  test('updates user from the server on success', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify(mockUser));

    const updated: User = { ...mockUser, name: 'Alice Updated' };
    getMeMock.mockResolvedValue({ data: updated });

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toEqual(updated);
    expect(JSON.parse(localStorage.getItem('user') as string)).toEqual(updated);
  });

  test('logs out when refreshUser fails', async () => {
    localStorage.setItem('token', 't');
    localStorage.setItem('user', JSON.stringify(mockUser));
    getMeMock.mockRejectedValue(new Error('401'));

    const { result } = renderHook(() => useAuth(), { wrapper });
    await waitFor(() => expect(result.current.user).toEqual(mockUser));

    await act(async () => {
      await result.current.refreshUser();
    });

    expect(result.current.user).toBeNull();
    expect(result.current.token).toBeNull();
  });
});

describe('useAuth without provider', () => {
  test('throws a clear error', () => {
    const spy = vi.spyOn(console, 'error').mockImplementation(() => {});
    expect(() => renderHook(() => useAuth())).toThrow(/must be used within AuthProvider/);
    spy.mockRestore();
  });
});

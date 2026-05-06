import api from './axios';
import type { AuthResponse, User } from '../types';

export const register = (data: { name: string; email: string; password: string; role: string }) =>
  api.post<{ message: string }>('/auth/register', data);

export const verifyOTP = (data: { email: string; otp: string }) =>
  api.post<AuthResponse>('/auth/verify-otp', data);

export const login = (data: { email: string; password: string }) =>
  api.post<AuthResponse>('/auth/login', data);

export const forgotPassword = (email: string) =>
  api.post<{ message: string }>('/auth/forgot-password', { email });

export const resetPassword = (data: { email: string; otp: string; newPassword: string }) =>
  api.post<{ message: string }>('/auth/reset-password', data);

export const getMe = () => api.get<User>('/auth/me');

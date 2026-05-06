import type { AxiosError } from 'axios';

export const getErrorMessage = (err: unknown): string =>
  (err as AxiosError<{ message: string }>).response?.data?.message || 'Something went wrong';

import api from './axios';
import type { Tailor, TailorsResponse } from '../types';

export interface TailorFilters {
  city?: string;
  serviceCategory?: string;
  minRating?: number;
  search?: string;
  page?: number;
  limit?: number;
}

export const getTailors = (filters: TailorFilters = {}) =>
  api.get<TailorsResponse>('/tailors', { params: filters });

export const getTailorById = (id: string) =>
  api.get<Tailor>(`/tailors/${id}`);

export const getMyTailorProfile = () =>
  api.get<Tailor>('/tailors/me');

export const createTailorProfile = (data: object) =>
  api.post<Tailor>('/tailors/profile', data);

export const updateTailorProfile = (data: object) =>
  api.put<Tailor>('/tailors/profile', data);

export const addShopPhoto = (formData: FormData) =>
  api.post<Tailor['shopPhotos']>('/tailors/photos', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const removeShopPhoto = (photoId: string) =>
  api.delete(`/tailors/photos/${photoId}`);

export const addWorkSample = (formData: FormData) =>
  api.post<Tailor['workSamples']>('/tailors/work-samples', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });

export const removeWorkSample = (sampleId: string) =>
  api.delete(`/tailors/work-samples/${sampleId}`);

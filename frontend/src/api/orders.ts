import api from './axios';
import type { Order, GarmentType, MeasurementType, PaymentMethod } from '../types';

export interface CreateOrderPayload {
  tailorId: string;
  serviceName: string;
  garmentType: GarmentType;
  measurementType: MeasurementType;
  measurements?: Record<string, string | number>;
  notes?: string;
  price: number;
  paymentMethod: PaymentMethod;
}

export const createOrder = (data: CreateOrderPayload) =>
  api.post<Order>('/orders', data);

export const getMyOrders = () =>
  api.get<Order[]>('/orders/my-orders');

export const getIncomingOrders = () =>
  api.get<Order[]>('/orders/incoming');

export const updateOrderStatus = (id: string, status: Order['status'], deliveryDate?: string) =>
  api.put<Order>(`/orders/${id}/status`, { status, deliveryDate });

export const leaveReview = (id: string, data: { rating: number; comment: string }) =>
  api.post<Order>(`/orders/${id}/review`, data);

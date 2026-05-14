export interface User {
  _id: string;
  name: string;
  email: string;
  role: 'customer' | 'tailor';
  avatar: string;
  isVerified: boolean;
}

export interface TailorService {
  _id: string;
  name: string;
  category: string;
  price: number;
  turnaroundDays: number;
  description: string;
}

export interface ShopPhoto {
  _id: string;
  image: string;
  caption: string;
}

export interface TailorLocation {
  city: string;
  state: string;
  pincode: string;
}

export interface Tailor {
  _id: string;
  user: User;
  shopName: string;
  description: string;
  experience: number;
  services: TailorService[];
  location: TailorLocation;
  shopPhotos: ShopPhoto[];
  workSamples: ShopPhoto[];
  rating: number;
  totalReviews: number;
  isAvailable: boolean;
  createdAt: string;
}

export type GarmentType =
  | 'blouse'
  | 'salwar_kameez'
  | 'lehenga'
  | 'dress'
  | 'mens_shirt'
  | 'mens_pants'
  | 'kurta'
  | 'alteration'
  | 'other';

export const GARMENT_LABELS: Record<GarmentType, string> = {
  blouse: 'Blouse',
  salwar_kameez: 'Salwar Kameez',
  lehenga: 'Lehenga',
  dress: 'Dress',
  mens_shirt: "Men's Shirt",
  mens_pants: "Men's Pants",
  kurta: 'Kurta',
  alteration: 'Alteration',
  other: 'Other',
};

export type MeasurementType = 'custom' | 'send_sample';

export type PaymentMethod = 'card' | 'cod';

export interface Review {
  rating: number;
  comment: string;
  createdAt: string;
}

export interface Order {
  _id: string;
  customer: User;
  tailor: Tailor;
  serviceName: string;
  garmentType: GarmentType;
  measurementType: MeasurementType;
  measurements: Record<string, string | number>;
  notes: string;
  price: number;
  paymentMethod: PaymentMethod;
  paymentStatus: 'pending' | 'paid' | 'failed';
  deliveryDate?: string;
  status: 'pending' | 'accepted' | 'in_progress' | 'completed' | 'cancelled' | 'rejected';
  review?: Review;
  createdAt: string;
}

export interface AuthResponse {
  token: string;
  user: User;
}

export interface TailorsResponse {
  tailors: Tailor[];
  total: number;
  page: number;
  pages: number;
}

export const SERVICE_CATEGORIES = [
  "Women's Wear",
  "Men's Wear",
  "Kids' Wear",
  'Alterations',
  'Embroidery',
  'Other',
];

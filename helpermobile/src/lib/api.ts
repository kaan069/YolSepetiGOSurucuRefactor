// API işlemler için axios konfigürasyonu ve fonksiyonları
// Axios configuration and functions for API operations
import axios from 'axios';
import { OfferDto, OrderDto } from './types';

// Backend API konfigürasyonu - Backend API configuration
// DEV ortamı için backend base URL - Backend base URL for DEV environment
export const api = axios.create({
  baseURL: 'http://localhost:5000/api/v1', // Backend portunu burada ayarla - Set backend port here
  timeout: 10000, // 10 saniye timeout - 10 seconds timeout
});

// --- SİPARİŞ İŞLEMLERİ / ORDER OPERATIONS ---

// Bekleyen siparişleri getir - Fetch pending orders
// Driver app için eşleşme listesi sağlar - Provides matching list for driver app
export async function fetchPendingOrders(): Promise<OrderDto[]> {
  const res = await api.get<OrderDto[]>('/orders', { params: { status: 'pending' } });
  return res.data;
}

// Belirli bir siparişin tekliflerini getir - Fetch offers for a specific order
export async function fetchOrderOffers(orderId: string): Promise<OfferDto[]> {
  const res = await api.get<OfferDto[]>(`/orders/${orderId}/offers`);
  return res.data;
}

// Yeni teklif gönder - Post new offer
export async function postOffer(orderId: string, body: {
  driverId: string; // Sürücü ID'si - Driver ID
  ratePerKm?: number; // Km başına ücret - Rate per kilometer
  etaMinutes?: number; // Tahmini varış süresi (dakika) - Estimated arrival time in minutes
}): Promise<OfferDto> {
  const res = await api.post<OfferDto>(`/orders/${orderId}/offers`, body);
  return res.data;
}

// Mevcut teklifi güncelle - Update existing offer
export async function patchOffer(orderId: string, offerId: string, body: {
  ratePerKm?: number; // Km başına ücret - Rate per kilometer
  customAmount?: number; // Özel tutar - Custom amount
  etaMinutes?: number; // Tahmini varış süresi - Estimated arrival time
}): Promise<OfferDto> {
  const res = await api.patch<OfferDto>(`/orders/${orderId}/offers/${offerId}`, body);
  return res.data;
}

// --- KİMLİK DOĞRULAMA İŞLEMLERİ / AUTHENTICATION OPERATIONS ---

// Telefon numarasına göre kullanıcı var mı kontrol et - Check if user exists by phone number
export async function checkUserExists(phoneNumber: string): Promise<{ exists: boolean; userId?: string }> {
  const res = await api.get<{ exists: boolean; userId?: string }>(`/auth/check-user`, {
    params: { phoneNumber }
  });
  return res.data;
}

// Telefon numarası ve şifre ile giriş yap - Login with phone number and password
export async function loginWithPassword(phoneNumber: string, password: string): Promise<{ success: boolean; user?: any; token?: string }> {
  const res = await api.post<{ success: boolean; user?: any; token?: string }>('/auth/login', {
    phoneNumber, // Kullanıcının telefon numarası - User's phone number
    password // Kullanıcının şifresi - User's password
  });
  return res.data;
}

// SMS doğrulama kodu gönder - Send SMS verification code
// Yeni kullanıcılar için telefon numarası doğrulama - Phone number verification for new users
export async function sendVerificationCode(phoneNumber: string): Promise<{ success: boolean; message: string }> {
  const res = await api.post<{ success: boolean; message: string }>('/auth/send-code', {
    phoneNumber // Doğrulama kodu gönderilecek telefon numarası - Phone number to send verification code
  });
  return res.data;
}
// Vinç sabitleri ve yardımcı fonksiyonlar
import * as Location from 'expo-location';
import { CraneRequest } from '../../api';

// Mesafe hesaplama (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Reverse geocoding ile adres detayı al
export const getAddressDetails = async (latitude: number, longitude: number) => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const address = results[0];
      return {
        district: address.district || address.subregion || '',
        neighborhood: address.street || address.name || '',
      };
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  return { district: '', neighborhood: '' };
};

// Request ID helper - object veya number formatını handle eder
export const getRequestId = (request: CraneRequest): number => {
  if (!request.request_id) return 0;
  if (typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.id;
  }
  return request.request_id as any;
};

// Status helper
export const getStatus = (request: CraneRequest): string => {
  if (request.status) return request.status;
  if (request.request_id && typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.status || 'unknown';
  }
  return 'unknown';
};

// Telefon numarası helper
export const getPhoneNumber = (request: CraneRequest): string | undefined => {
  if (!request.request_id) return undefined;
  if (typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.request_owner_phone;
  }
  return undefined;
};

// Sayı formatlama
export const formatNumber = (num: number): string => {
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

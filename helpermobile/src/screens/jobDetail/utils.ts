import * as Location from 'expo-location';
import { TowTruckRequestDetail } from '../../api';

// Utility function to calculate distance between two coordinates
// İki koordinat arasındaki mesafeyi hesaplayan utility fonksiyonu
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10; // Round to 1 decimal place
};

// Function to get address details from coordinates using reverse geocoding
// Koordinatlardan adres detaylarını almak için reverse geocoding kullanan fonksiyon
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

// Helper function to get request ID - handles both object and number formats
export const getRequestId = (request: TowTruckRequestDetail): number => {
  if (!request.request_id) {
    console.error('getRequestId: request_id is null or undefined');
    return 0;
  }

  if (typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.id;
  }

  return request.request_id as any;
};

// Helper function to get status - handles both object and number formats
export const getStatus = (request: TowTruckRequestDetail): string => {
  // Önce doğrudan status field'ına bak (backend'den geliyor)
  if (request.status) {
    return request.status;
  }

  // Sonra request_id içindeki status'a bak
  if (request.request_id && typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.status || 'unknown';
  }

  return 'unknown';
};

// Helper function to get phone number - handles both object and number formats
export const getPhoneNumber = (request: TowTruckRequestDetail): string | undefined => {
  if (!request.request_id) {
    return undefined;
  }

  if (typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.request_owner_phone;
  }

  return undefined;
};

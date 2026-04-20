/**
 * useCurrentLocation Hook
 *
 * Kullanıcının mevcut konumunu alan hook.
 * Konum izni ister ve GPS koordinatlarını döndürür.
 *
 * @returns {
 *   location: { latitude, longitude } | null
 *   loading: Konum alınıyor mu?
 *   error: Hata mesajı
 * }
 */
import { useState, useEffect } from 'react';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../../utils/locationPermission';
import { logger } from '../../../utils/logger';

interface Coordinates {
  latitude: number;
  longitude: number;
}

interface UseCurrentLocationReturn {
  location: Coordinates | null;
  loading: boolean;
  error: string | null;
}

export function useCurrentLocation(): UseCurrentLocationReturn {
  const [location, setLocation] = useState<Coordinates | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        setLoading(true);
        setError(null);

        const granted = await ensureForegroundPermission();

        if (!granted) {
          logger.warn('location', 'useCurrentLocation - permission denied');
          setError('Konum izni verilmedi');
          setLoading(false);
          return;
        }

        const currentLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.Balanced,
        });

        setLocation({
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
        });
      } catch (err: any) {
        logger.error('location', 'useCurrentLocation.get failure');
        setError(err?.message || 'Konum alınamadı');
      } finally {
        setLoading(false);
      }
    };

    getCurrentLocation();
  }, []);

  return { location, loading, error };
}

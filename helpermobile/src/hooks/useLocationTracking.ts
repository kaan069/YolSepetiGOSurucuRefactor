/**
 * SÜRÜCÜ GPS KONUM TAKİP SERVİSİ
 *
 * Sürücünün GPS konumunu takip eder ve global state'e kaydeder
 *
 * Optimizasyon:
 * - SADECE aktif iş varsa sürekli konum takibi yapar
 * - Aktif iş yokken konum takibi DURAR (pil tasarrufu)
 * - Kullanıcı haritada konum butonuna basarak anlık konum alabilir
 *
 * NOT: Bu hook App.tsx'de global olarak çalışır, sadece GPS'i okur
 * WebSocket gönderimi useLocationWebSocket hook'u tarafından yapılır
 */
import { useEffect } from 'react';
import * as Location from 'expo-location';
import { useDriverStore } from '../store/driverStore';
import { useAuthStore } from '../store/authStore';
import { useActiveJobStore } from '../store/useActiveJobStore';
import { useNakliyeLocationStore } from '../store/useNakliyeLocationStore';
import { requestLocationPermissions } from '../utils/locationPermission';

export function useLocationTracking() {
  const setCurrentLocation = useDriverStore((state) => state.setCurrentLocation);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);

  // Aktif iş durumunu kontrol et
  const activeJobId = useActiveJobStore((state) => state.activeJobId);
  const isNakliyeSharing = useNakliyeLocationStore((state) => state.isLocationSharing);

  // Sürekli konum takibi sadece aktif iş varsa çalışsın
  const hasActiveJob = !!activeJobId || isNakliyeSharing;

  // Uygulama başladığında konum izni iste (bir kerelik)
  useEffect(() => {
    if (!isAuthenticated) return;

    const initLocation = async () => {
      const granted = await requestLocationPermissions();
      if (!granted) return;

      // İlk konumu bir kerelik al (harita için)
      try {
        const location = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.High,
        });
        setCurrentLocation(location);
      } catch (error) {
        console.error('❌ [GPS Service] İlk konum alma hatası:', error);
      }
    };

    initLocation();
  }, [isAuthenticated, setCurrentLocation]);

  // Aktif iş varsa sürekli konum takibi başlat
  useEffect(() => {
    if (!isAuthenticated || !hasActiveJob) return;

    let subscription: Location.LocationSubscription | null = null;

    const startTracking = async () => {
      console.log('🟢 [GPS Service] Aktif iş var, sürekli konum takibi başlatılıyor...');

      subscription = await Location.watchPositionAsync(
        {
          accuracy: Location.Accuracy.BestForNavigation,
          timeInterval: 1000,
          distanceInterval: 1,
        },
        (location) => {
          setCurrentLocation(location);
        }
      );
    };

    startTracking();

    return () => {
      if (subscription) {
        console.log('🔴 [GPS Service] Sürekli konum takibi durduruluyor...');
        subscription.remove();
      }
    };
  }, [setCurrentLocation, isAuthenticated, hasActiveJob]);
}

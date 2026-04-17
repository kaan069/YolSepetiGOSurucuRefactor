/**
 * SÜRÜCÜ KONUM TAKİP SERVİSİ
 *
 * Sürücünün konumunu gerçek zamanlı olarak backend'e gönderir
 * WebSocket bağlantısı ile 5 saniyede bir konum güncellemesi yapar
 *
 * WebSocket URL: {WS_BASE_URL}/ws/location/{tracking_token}/
 * Authentication: JWT Token (query param - React Native limitasyonu)
 *
 * ⚠️ TRACKING TOKEN BAZLI - requestId yerine trackingToken kullanılıyor
 *
 * NOT: React Native WebSocket API'si header desteklemediği için
 * JWT token query parameter olarak gönderilir (?auth=xxx)
 * Backend bu yöntemi desteklemektedir.
 */
import { useEffect, useRef, useState } from 'react';
import { Alert } from 'react-native';
import * as Location from 'expo-location';
import { locationWebSocket } from '../services/locationWebSocket';
import { useDriverStore } from '../store/driverStore';
import { backgroundLocationService } from '../services/backgroundLocationService';

export interface UseLocationWebSocketOptions {
  trackingToken: string | null;  // ⚠️ TRACKING TOKEN BAZLI - requestId yerine trackingToken
  enabled: boolean; // WebSocket'i aktif et/kapat
  onConnected?: () => void;
  onError?: (error: any) => void;
  onDisconnected?: () => void;
  onStatusUpdate?: (data: any) => void;
  onRequestRejected?: () => void;
}

/**
 * Sürücü konum takip hook'u
 *
 * Aktif iş sırasında sürücünün konumunu otomatik olarak backend'e gönderir
 *
 * @param options.trackingToken - Aktif tracking token (32 karakter)
 * @param options.enabled - Konum gönderimi aktif mi?
 *
 * Kullanım:
 * ```typescript
 * useLocationWebSocket({
 *   trackingToken: job.trackingToken,
 *   enabled: status === 'in_progress'
 * });
 * ```
 */
export function useLocationWebSocket(options: UseLocationWebSocketOptions) {
  const { trackingToken, enabled, onConnected, onError, onDisconnected } = options;
  // ⚠️ FİX: currentLocation'ı component scope'da tutma, interval içinde fresh değer için store'dan oku
  const lastSentLocation = useRef<{ lat: number; lng: number } | null>(null);
  const isConnecting = useRef(false);
  const [wsConnected, setWsConnected] = useState(false); // ← WebSocket connection state
  const [isInternetDisconnected, setIsInternetDisconnected] = useState(false); // ← Internet status
  const backgroundStarted = useRef(false); // ← Background location tracking durumu

  // WebSocket bağlantısını yönet
  useEffect(() => {
    if (!enabled) return;
    if (!trackingToken) return;
    if (isConnecting.current) return;

    isConnecting.current = true;

    locationWebSocket.connect({
      trackingToken,
      onConnected: () => {
        isConnecting.current = false;
        setWsConnected(true);
        onConnected?.();

        // Arka plan konum takibini başlat (WebSocket bağlandığında)
        if (!backgroundStarted.current) {
          backgroundStarted.current = true;
          backgroundLocationService.requestStart().catch((err) => {
            console.error('❌ [useLocationWebSocket] Background location başlatma hatası:', err);
          });
        }
      },
      onError: (error) => {
        console.error('❌ WebSocket hatası:', error);
        isConnecting.current = false;
        setWsConnected(false);
        onError?.(error);
      },
      onDisconnected: () => {
        isConnecting.current = false;
        setWsConnected(false);
        onDisconnected?.();
      },
      onInternetDisconnected: () => {
        setIsInternetDisconnected(true);
        Alert.alert(
          '⚠️ Internet Bağlantısı Kesildi',
          'Konum gönderimi durdu. İnternet bağlantınız geldiğinde otomatik olarak devam edecek.',
          [{ text: 'Tamam' }]
        );
      },
      onInternetReconnected: () => {
        setIsInternetDisconnected(false);
        Alert.alert(
          '✅ Internet Bağlantısı Kuruldu',
          'Konum gönderimi yeniden başlatılıyor...',
          [{ text: 'Tamam' }]
        );
      },
    });

    return () => {
      locationWebSocket.disconnect();
      lastSentLocation.current = null;
      isConnecting.current = false;
      setWsConnected(false);

      // Arka plan konum takibini durdur (WebSocket kapandığında)
      if (backgroundStarted.current) {
        backgroundStarted.current = false;
        backgroundLocationService.requestStop().catch((err) => {
          console.error('❌ [useLocationWebSocket] Background location durdurma hatası:', err);
        });
      }
    };
  }, [trackingToken, enabled]);

  // Konum gönderimi - Her 5 saniyede bir (Döküman standardı)
  // ⚠️ FİX: WebSocket connection state'i dependency'e eklendi
  // ⚠️ FİX 2: GPS konumunu DOĞRUDAN cihazdan oku, store'a güvenme
  useEffect(() => {
    if (!enabled) return;
    if (!wsConnected) return;

    const interval = setInterval(async () => {
      if (!locationWebSocket.isConnected()) return;

      try {
        const freshLocation = await Location.getCurrentPositionAsync({
          accuracy: Location.Accuracy.BestForNavigation,
        });

        const lat = freshLocation.coords.latitude;
        const lng = freshLocation.coords.longitude;

        locationWebSocket.sendLocation({ latitude: lat, longitude: lng });
        lastSentLocation.current = { lat, lng };

      } catch (error) {
        console.error('❌ GPS konum okuma hatası:', error);
      }

    }, 5000);

    return () => {
      clearInterval(interval);
    };

  }, [enabled, wsConnected]);
}

/**
 * İki koordinat arasındaki mesafeyi hesaplar (km)
 */
function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Dünya yarıçapı (km)
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

function toRad(value: number): number {
  return (value * Math.PI) / 180;
}

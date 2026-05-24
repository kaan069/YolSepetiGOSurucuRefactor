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
import { backgroundLocationService } from '../services/backgroundLocationService';
import { flushLocationQueue } from '../tasks/backgroundLocation';
import { logger } from '../utils/logger';

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
  const { trackingToken, enabled } = options;
  const lastSentLocation = useRef<{ lat: number; lng: number } | null>(null);
  const isConnecting = useRef(false);
  const [wsConnected, setWsConnected] = useState(false);
  const [isInternetDisconnected, setIsInternetDisconnected] = useState(false);
  const backgroundStarted = useRef(false);

  // ⚠️ Callback ref pattern: parent her render'da yeni arrow function geciyor.
  // Effect deps'e koymadan en guncel callback'i kullanabilmek icin ref'te tut.
  const callbacksRef = useRef(options);
  useEffect(() => {
    callbacksRef.current = options;
  });

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
        callbacksRef.current.onConnected?.();

        // WS geri geldiginde bekleyen queue'yu flush et
        flushLocationQueue(trackingToken).catch(() => {});

        // Arka plan konum takibini başlat (WebSocket bağlandığında)
        if (!backgroundStarted.current) {
          backgroundStarted.current = true;
          backgroundLocationService.requestStart().catch(() => {
            logger.error('location', 'useLocationWebSocket.background.start failed');
          });
        }
      },
      onError: (error) => {
        logger.error('websocket', 'useLocationWebSocket.onError');
        isConnecting.current = false;
        setWsConnected(false);
        callbacksRef.current.onError?.(error);
      },
      onDisconnected: () => {
        isConnecting.current = false;
        setWsConnected(false);
        callbacksRef.current.onDisconnected?.();
      },
      onStatusUpdate: (data: any) => {
        callbacksRef.current.onStatusUpdate?.(data);
      },
      onRequestRejected: () => {
        callbacksRef.current.onRequestRejected?.();
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
        backgroundLocationService.requestStop().catch(() => {
          logger.error('location', 'useLocationWebSocket.background.stop failed');
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
        logger.error('location', 'useLocationWebSocket.tick getPosition failed');
      }

    }, 5000);

    return () => {
      clearInterval(interval);
    };

  }, [enabled, wsConnected]);
}

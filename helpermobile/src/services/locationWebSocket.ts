/**
 * SÜRÜCÜ KONUM WEBSOCKET SERVİSİ
 *
 * Sürücü konumunu gerçek zamanlı olarak backend'e göndermek için kullanılır
 *
 * WebSocket URL: {WS_BASE_URL}/ws/location/{tracking_token}/
 * Authentication: JWT Token (Query Parameter)
 *
 * ⚠️ TRACKING TOKEN BAZLI - requestId yerine trackingToken kullanılıyor
 *
 * Özellikler:
 * - Otomatik yeniden bağlanma (exponential backoff)
 * - Internet bağlantı kontrolü (NetInfo)
 * - Bağlantı kesildiğinde otomatik bekle ve yeniden bağlan
 * - JWT token authentication via query parameter
 * - Gerçek zamanlı konum güncellemeleri
 *
 * NOT: React Native native WebSocket API header desteklemediği için
 * JWT token query parameter olarak gönderilir.
 */
import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import { WS_BASE_URL } from '../constants/network';

export interface LocationUpdate {
  latitude: number;
  longitude: number;
}

export interface LocationWebSocketConfig {
  trackingToken: string;  // ⚠️ TRACKING TOKEN BAZLI - requestId yerine trackingToken
  onConnected?: () => void;
  onLocationUpdate?: (data: any) => void;
  onError?: (error: any) => void;
  onDisconnected?: () => void;
  // New approval workflow event handlers
  onRequestAccepted?: (data: any) => void;       // Driver accepted offer
  onRequestApproved?: (data: any) => void;       // Customer approved offer
  onRequestRejected?: (data: any) => void;       // Customer rejected offer
  onStatusUpdate?: (data: any) => void;          // Generic status change
  // Internet connection status handlers
  onInternetDisconnected?: () => void;           // Internet connection lost
  onInternetReconnected?: () => void;            // Internet connection restored
}

class LocationWebSocketService {
  private ws: WebSocket | null = null;
  private trackingToken: string | null = null;  // ⚠️ requestId yerine trackingToken
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private isIntentionallyClosed = false;
  private config: LocationWebSocketConfig | null = null;

  // Bounce detection - bağlantı çok kısa sürüyorsa reconnect etme
  private lastConnectedAt = 0;
  private static readonly MIN_CONNECTION_DURATION_MS = 2000;

  // Internet connectivity monitoring
  private netInfoUnsubscribe: (() => void) | null = null;
  private isInternetConnected = true;
  private wasDisconnectedDueToInternet = false;

  /**
   * Internet bağlantısını kontrol eder ve NetInfo listener'ını başlatır
   */
  private startInternetMonitoring(): void {
    // NetInfo listener - internet durumu değiştiğinde tetiklenir
    this.netInfoUnsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      const isConnected = state.isConnected && state.isInternetReachable !== false;

      // Internet kesildi
      if (!isConnected && this.isInternetConnected) {
        this.isInternetConnected = false;
        this.wasDisconnectedDueToInternet = true;
        this.config?.onInternetDisconnected?.();

        // WebSocket zaten açıksa kapat (hata almadan önce temiz bir şekilde)
        if (this.ws && this.ws.readyState === WebSocket.OPEN) {
          this.ws.close();
        }
      }
      // Internet geldi
      else if (isConnected && !this.isInternetConnected) {
        this.isInternetConnected = true;
        this.config?.onInternetReconnected?.();

        // Eğer daha önce internet kesilmesi yüzünden bağlantı kopmuşsa, yeniden bağlan
        if (this.wasDisconnectedDueToInternet && this.config && !this.isIntentionallyClosed) {
          this.wasDisconnectedDueToInternet = false;
          this.reconnectAttempts = 0; // Reset reconnect attempts
          this.connect(this.config);
        }
      }
    });
  }

  /**
   * Internet bağlantı izlemeyi durdurur
   */
  private stopInternetMonitoring(): void {
    if (this.netInfoUnsubscribe) {
      this.netInfoUnsubscribe();
      this.netInfoUnsubscribe = null;
    }
  }

  /**
   * Sürücü için WebSocket bağlantısını başlatır
   *
   * @param config - WebSocket konfigürasyonu (trackingToken ile)
   * @throws Error - JWT token bulunamazsa
   */
  async connect(config: LocationWebSocketConfig): Promise<void> {
    // ⚠️ GUARD: Tracking token yoksa bağlanma
    if (!config.trackingToken) {
      console.warn('⚠️ [WebSocket] connect() called with null/undefined trackingToken - ignoring');
      return;
    }

    this.config = config;
    this.trackingToken = config.trackingToken;
    this.isIntentionallyClosed = false;

    // Internet bağlantı izlemeyi başlat (ilk bağlantıda)
    if (!this.netInfoUnsubscribe) {
      this.startInternetMonitoring();
    }

    // Internet bağlantısını kontrol et
    const netState = await NetInfo.fetch();
    const isConnected = netState.isConnected && netState.isInternetReachable !== false;

    if (!isConnected) {
      this.isInternetConnected = false;
      this.wasDisconnectedDueToInternet = true;
      this.config?.onInternetDisconnected?.();
      return; // Don't attempt WebSocket connection without internet
    }

    this.isInternetConnected = true;

    try {
      // Backend URL'den WebSocket URL'ini oluştur - TRACKING TOKEN BAZLI
      const wsUrl = `${WS_BASE_URL}/ws/location/${this.trackingToken}/`;

      // JWT Token'ı al (Authentication için gerekli)
      const token = await AsyncStorage.getItem('access_token');

      if (!token) {
        console.error('❌ [CRITICAL] JWT token bulunamadı! Lütfen login olun');
        throw new Error('JWT token bulunamadı - Lütfen login olun');
      }

      // WebSocket bağlantısını oluştur
      // Backend middleware query parameter adı: 'auth' (NOT: 'token' değil!)
      const wsUrlWithToken = `${wsUrl}?auth=${token}`;

      // Native WebSocket API kullan (React Native'de çalışır)
      this.ws = new WebSocket(wsUrlWithToken) as any;

      this.ws!.onopen = () => {
        this.reconnectAttempts = 0;
        this.lastConnectedAt = Date.now();
        this.config?.onConnected?.();
      };

      this.ws!.onmessage = (event: any) => {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;

          switch (data.type) {
            case 'connection_established':
              break;

            case 'location_update':
              this.config?.onLocationUpdate?.(data);
              break;

            case 'request_accepted':
              this.config?.onRequestAccepted?.(data);
              break;

            case 'request_approved':
              this.config?.onRequestApproved?.(data);
              break;

            case 'request_rejected':
              this.config?.onRequestRejected?.(data);
              break;

            case 'status_update':
              this.config?.onStatusUpdate?.(data);
              break;
          }
        } catch (error) {
          console.error('❌ [Driver WebSocket] Mesaj parse hatası:', error);
        }
      };

      this.ws!.onerror = async (error) => {
        // Internet bağlantısını kontrol et
        const netState = await NetInfo.fetch();
        const isConnected = netState.isConnected && netState.isInternetReachable !== false;

        if (!isConnected) {
          // Internet yoksa hata olarak raporlama
          return;
        }

        // Internet varsa gerçek bir hata
        console.error('❌ [Driver WebSocket] ERROR:', error.type);
        this.config?.onError?.(error);
      };

      this.ws!.onclose = async (event: any) => {
        this.config?.onDisconnected?.();

        // Error code kontrolü
        if (event.code === 4003) {
          console.error('❌ [Driver WebSocket] Bu request size ait değil!');
          return;
        }

        if (event.code === 4001) {
          console.error('❌ [Driver WebSocket] JWT Token geçersiz veya süresi dolmuş!');
          return;
        }

        // Internet bağlantısını kontrol et
        const netState = await NetInfo.fetch();
        const isConnected = netState.isConnected && netState.isInternetReachable !== false;

        if (!isConnected) {
          this.wasDisconnectedDueToInternet = true;
          return; // Don't attempt reconnect, NetInfo listener will handle it
        }

        // Bounce detection: bağlantı çok kısa sürdüyse reconnect etme
        const connectionDuration = Date.now() - this.lastConnectedAt;
        if (this.lastConnectedAt > 0 && connectionDuration < LocationWebSocketService.MIN_CONNECTION_DURATION_MS) {
          console.warn(`⚠️ [Driver WebSocket] Bağlantı ${connectionDuration}ms içinde kapandı, reconnect atlanıyor`);
          return;
        }

        // Kasıtlı olarak kapatılmadıysa ve internet varsa yeniden bağlan
        if (!this.isIntentionallyClosed && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.attemptReconnect();
        }
      };
    } catch (error) {
      console.error('❌ WebSocket bağlantı hatası:', error);
      this.config?.onError?.(error);
    }
  }

  /**
   * Yeniden bağlanmayı dene
   */
  private attemptReconnect(): void {
    this.reconnectAttempts++;
    const delay = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 30000); // Exponential backoff, max 30s

    this.reconnectTimeout = setTimeout(() => {
      if (this.config) {
        this.connect(this.config);
      }
    }, delay);
  }

  /**
   * Sürücü konumunu WebSocket üzerinden backend'e gönderir
   *
   * @param location - GPS koordinatları (latitude, longitude)
   */
  sendLocation(location: LocationUpdate): void {
    // WebSocket.OPEN = 1
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      const message = {
        type: 'location_update',
        latitude: location.latitude,
        longitude: location.longitude,
      };

      this.ws.send(JSON.stringify(message));
    } else {
      const state = this.ws ? this.ws.readyState : 'NULL';
      const stateText = state === 0 ? 'CONNECTING' : state === 1 ? 'OPEN' : state === 2 ? 'CLOSING' : state === 3 ? 'CLOSED' : 'NULL';
      console.warn(`⚠️ WebSocket bağlı değil (${stateText}), konum gönderilemedi`);
    }
  }

  /**
   * Bağlantıyı kapat
   */
  disconnect(): void {
    this.isIntentionallyClosed = true;

    // Internet monitoring'i durdur
    this.stopInternetMonitoring();

    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }

    if (this.ws) {
      // WebSocket.OPEN ve WebSocket.CONNECTING kontrol et
      if (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING) {
        this.ws.close();
      }
      this.ws = null;
    }

    this.trackingToken = null;
    this.config = null;
    this.reconnectAttempts = 0;
    this.wasDisconnectedDueToInternet = false;
  }

  /**
   * Bağlantı durumunu kontrol et
   */
  isConnected(): boolean {
    return this.ws !== null && this.ws.readyState === WebSocket.OPEN;
  }

  /**
   * Aktif tracking token'ı döndür
   */
  getTrackingToken(): string | null {
    return this.trackingToken;
  }
}

// Singleton instance
export const locationWebSocket = new LocationWebSocketService();

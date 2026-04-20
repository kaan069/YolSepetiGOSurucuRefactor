import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import authAPI from '../api/auth';
import { deviceService } from './deviceService';
import { logger } from '../utils/logger';

/**
 * Firebase Messaging `RemoteMessage.data` tipi artık
 * `{ [key: string]: string | object }` şeklindedir (nested JSON desteği).
 * Handler'larımız sadece string alanları tüketiyor — bu tip, SDK ile uyumlu
 * olmak için union'ı genişletilmiş olarak tutar.
 */
type FCMDataRecord = { [key: string]: string | object };

/**
 * FCM data payload'ından string bir alanı güvenli şekilde okur.
 * Alan yoksa veya nested bir object ise `undefined` döner.
 */
const readString = (value: string | object | undefined): string | undefined =>
    typeof value === 'string' ? value : undefined;

/**
 * FCM (Firebase Cloud Messaging) Servisi
 *
 * Bu servis:
 * - Push notification izinlerini yönetir
 * - FCM token'ı alır ve backend'e kaydeder
 * - Foreground ve background bildirimleri işler
 * - Multi-device desteği sağlar
 *
 * LOG GÜVENLİĞİ: Bu servis FCM token, remoteMessage payload veya data
 * objesini asla log'lamaz (token/PII sızıntısı riski). Yalnız type
 * string'i ve hafif durum metadata'sı log'lanır.
 */
class FCMService {
    private fcmToken: string | null = null;
    private isInitialized = false;

    /**
     * FCM servisini başlat
     * App.tsx'den çağrılmalıdır
     */
    async initialize(): Promise<void> {
        if (this.isInitialized) {
            logger.debug('fcm', 'FCMService zaten başlatılmış');
            return;
        }

        try {
            // 1. Notification izinlerini kontrol et ve iste
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                logger.warn('fcm', 'Notification izni reddedildi');
                return;
            }

            // 2. FCM token'ı al
            await this.getFCMToken();

            // 3. Notification handler'ları kur
            this.setupNotificationHandlers();

            // 4. Token yenileme listener'ı kur
            this.setupTokenRefreshListener();

            this.isInitialized = true;
            logger.debug('fcm', 'FCMService başlatıldı');
        } catch (error) {
            logger.error('fcm', 'FCMService başlatma hatası');
            throw error;
        }
    }

    /**
     * Notification izinlerini iste
     */
    async requestPermissions(): Promise<boolean> {
        try {
            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            return enabled;
        } catch (error) {
            logger.error('fcm', 'Notification izni alma hatası');
            return false;
        }
    }

    /**
     * FCM token'ı al ve backend'e kaydet
     */
    async getFCMToken(): Promise<string | null> {
        try {
            // Firebase'den token al
            const token = await messaging().getToken();
            this.fcmToken = token;

            // Backend'e token'ı kaydet
            await this.registerTokenToBackend(token);

            return token;
        } catch (error) {
            logger.error('fcm', 'FCM token alma hatası');
            return null;
        }
    }

    /**
     * Token'ı backend'e kaydet
     */
    async registerTokenToBackend(token: string): Promise<void> {
        try {
            const deviceId = await deviceService.getDeviceId();
            const deviceType = Platform.OS as 'ios' | 'android';

            await authAPI.registerFCMToken({
                fcm_token: token,
                device_id: deviceId,
                device_type: deviceType,
            });
        } catch (error) {
            logger.warn('fcm', 'FCM token backend kayıt hatası (kritik değil)');
            // Token kaydetme hatası kritik değil, uygulama çalışmaya devam edebilir
        }
    }

    /**
     * Token yenileme listener'ı kur
     */
    private setupTokenRefreshListener(): void {
        messaging().onTokenRefresh(async (newToken) => {
            logger.debug('fcm', 'FCM token yenilendi');
            this.fcmToken = newToken;
            await this.registerTokenToBackend(newToken);
        });
    }

    /**
     * Notification handler'ları kur
     */
    private setupNotificationHandlers(): void {
        // Foreground mesajları (uygulama açıkken)
        messaging().onMessage(async (remoteMessage) => {
            // Data payload varsa işle
            if (remoteMessage.data) {
                this.handleNotificationData(remoteMessage.data);
            }
        });

        // Background mesajları (uygulama kapalıyken veya arka planda)
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
            if (remoteMessage.data) {
                this.handleNotificationData(remoteMessage.data);
            }
        });

        // Bildirime tıklanma (uygulama kapalıyken açılır)
        messaging().onNotificationOpenedApp((remoteMessage) => {
            if (remoteMessage.data) {
                this.handleNotificationClick(remoteMessage.data);
            }
        });

        // Uygulama kapalıyken gelen bildirime tıklanma (app başlatılır)
        messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
                if (remoteMessage && remoteMessage.data) {
                    this.handleNotificationClick(remoteMessage.data);
                }
            });
    }

    /**
     * Notification data'sını işle
     *
     * NOT: Firebase SDK `RemoteMessage.data` tipini
     * `{ [key: string]: string | object }` olarak verir (nested JSON desteği için).
     * Biz sadece string alanları okuduğumuzdan union'ı genişletilmiş olarak kabul
     * ediyoruz ve her okunan alan için `readString` ile narrow ediyoruz.
     */
    private handleNotificationData(data: FCMDataRecord): void {
        // Sadece type alanını log'la — payload'un tamamını değil.
        const type = readString(data.type);
        logger.debug('fcm', 'Notification received', { type });

        // Notification tipine göre işlem yap (navigation/store update hook'ları
        // ileride buraya eklenir; şu an tip-bazlı tüketim route layer'da.)
        switch (type) {
            case 'new_request':
            case 'request_accepted':
            case 'request_completed':
            case 'message':
            case 'job_assigned':
                break;
            default:
                break;
        }
    }

    /**
     * Bildirime tıklanma işle (navigation)
     *
     * Navigation tetikleme `useNotifications` hook tarafından yapılır.
     * Burada yalnız tip bilgisi log'lanır.
     */
    private handleNotificationClick(data: FCMDataRecord): void {
        logger.debug('fcm', 'Notification clicked', { type: readString(data.type) });
    }

    /**
     * Logout'ta FCM token'ı sil
     */
    async deleteToken(): Promise<void> {
        try {
            // Backend'den sil
            const deviceId = await deviceService.getDeviceId();
            await authAPI.deleteFCMToken(deviceId);

            // Firebase'den sil
            await messaging().deleteToken();

            this.fcmToken = null;
            logger.debug('fcm', 'FCM token silindi');
        } catch (error) {
            logger.error('fcm', 'FCM token silme hatası');
        }
    }

    /**
     * Mevcut FCM token'ı döndür
     */
    getCurrentToken(): string | null {
        return this.fcmToken;
    }

    /**
     * Servisin başlatılıp başlatılmadığını kontrol et
     */
    getIsInitialized(): boolean {
        return this.isInitialized;
    }
}

export default new FCMService();

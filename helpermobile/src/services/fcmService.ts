import messaging from '@react-native-firebase/messaging';
import { Platform } from 'react-native';
import authAPI from '../api/auth';
import deviceService from './deviceService';

/**
 * FCM (Firebase Cloud Messaging) Servisi
 *
 * Bu servis:
 * - Push notification izinlerini yönetir
 * - FCM token'ı alır ve backend'e kaydeder
 * - Foreground ve background bildirimleri işler
 * - Multi-device desteği sağlar
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
            console.log('⚠️ FCM servisi zaten başlatılmış');
            return;
        }

        try {
            console.log('🔔 FCM servisi başlatılıyor...');

            // 1. Notification izinlerini kontrol et ve iste
            const hasPermission = await this.requestPermissions();
            if (!hasPermission) {
                console.warn('⚠️ Notification izni reddedildi');
                return;
            }

            // 2. FCM token'ı al
            await this.getFCMToken();

            // 3. Notification handler'ları kur
            this.setupNotificationHandlers();

            // 4. Token yenileme listener'ı kur
            this.setupTokenRefreshListener();

            this.isInitialized = true;
            console.log('✅ FCM servisi başarıyla başlatıldı');
        } catch (error) {
            console.error('❌ FCM servisi başlatma hatası:', error);
            throw error;
        }
    }

    /**
     * Notification izinlerini iste
     */
    async requestPermissions(): Promise<boolean> {
        try {
            console.log('🔔 Notification izinleri kontrol ediliyor...');

            const authStatus = await messaging().requestPermission();
            const enabled =
                authStatus === messaging.AuthorizationStatus.AUTHORIZED ||
                authStatus === messaging.AuthorizationStatus.PROVISIONAL;

            if (enabled) {
                console.log('✅ Notification izni verildi:', authStatus);
            } else {
                console.warn('⚠️ Notification izni reddedildi:', authStatus);
            }

            return enabled;
        } catch (error) {
            console.error('❌ Notification izni alma hatası:', error);
            return false;
        }
    }

    /**
     * FCM token'ı al ve backend'e kaydet
     */
    async getFCMToken(): Promise<string | null> {
        try {
            console.log('🔔 FCM token alınıyor...');

            // Firebase'den token al
            const token = await messaging().getToken();
            this.fcmToken = token;

            console.log('✅ FCM token alındı');
            console.log('   Token uzunluğu:', token?.length || 0);

            // Backend'e token'ı kaydet
            await this.registerTokenToBackend(token);

            return token;
        } catch (error) {
            console.error('❌ FCM token alma hatası:', error);
            return null;
        }
    }

    /**
     * Token'ı backend'e kaydet
     */
    async registerTokenToBackend(token: string): Promise<void> {
        try {
            console.log('🔔 FCM token backend\'e kaydediliyor...');

            const deviceId = await deviceService.getDeviceId();
            const deviceType = Platform.OS as 'ios' | 'android';

            await authAPI.registerFCMToken({
                fcm_token: token,
                device_id: deviceId,
                device_type: deviceType,
            });

            console.log('✅ FCM token backend\'e kaydedildi');
        } catch (error) {
            console.error('❌ FCM token backend\'e kaydetme hatası:', error);
            // Token kaydetme hatası kritik değil, uygulama çalışmaya devam edebilir
        }
    }

    /**
     * Token yenileme listener'ı kur
     */
    private setupTokenRefreshListener(): void {
        messaging().onTokenRefresh(async (newToken) => {
            console.log('🔔 FCM token yenilendi');
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
            console.log('🔔 Foreground notification alındı:', remoteMessage);

            // Bildirimi göster
            if (remoteMessage.notification) {
                // Custom notification handler'ı buraya eklenebilir
                // Örneğin: Toast göster, local notification tetikle, vb.
                console.log('   Başlık:', remoteMessage.notification.title);
                console.log('   Mesaj:', remoteMessage.notification.body);
            }

            // Data payload varsa işle
            if (remoteMessage.data) {
                this.handleNotificationData(remoteMessage.data);
            }
        });

        // Background mesajları (uygulama kapalıyken veya arka planda)
        messaging().setBackgroundMessageHandler(async (remoteMessage) => {
            console.log('🔔 Background notification alındı:', remoteMessage);

            if (remoteMessage.data) {
                this.handleNotificationData(remoteMessage.data);
            }
        });

        // Bildirime tıklanma (uygulama kapalıyken açılır)
        messaging().onNotificationOpenedApp((remoteMessage) => {
            console.log('🔔 Notification açıldı (background):', remoteMessage);

            if (remoteMessage.data) {
                this.handleNotificationClick(remoteMessage.data);
            }
        });

        // Uygulama kapalıyken gelen bildirime tıklanma (app başlatılır)
        messaging()
            .getInitialNotification()
            .then((remoteMessage) => {
                if (remoteMessage) {
                    console.log('🔔 Notification açıldı (quit state):', remoteMessage);

                    if (remoteMessage.data) {
                        this.handleNotificationClick(remoteMessage.data);
                    }
                }
            });
    }

    /**
     * Notification data'sını işle
     */
    private handleNotificationData(data: { [key: string]: string }): void {
        console.log('📦 Notification data işleniyor:', data);

        // Notification tipine göre işlem yap
        const type = data.type;

        switch (type) {
            case 'new_request':
                console.log('   Yeni talep bildirimi');
                // Yeni talep geldiğinde yapılacaklar
                // Örn: Zustand store güncelle, navigation tetikle
                break;

            case 'request_accepted':
                console.log('   Talep kabul edildi bildirimi');
                break;

            case 'request_completed':
                console.log('   Talep tamamlandı bildirimi');
                break;

            case 'message':
                console.log('   Mesaj bildirimi');
                break;

            case 'job_assigned':
                console.log('   Eleman iş ataması bildirimi');
                // Employee panel store'u refresh etmeye gerek yok
                // Navigation handleNotificationClick'te yapılacak
                break;

            default:
                console.log('   Bilinmeyen bildirim tipi:', type);
        }
    }

    /**
     * Bildirime tıklanma işle (navigation)
     */
    private handleNotificationClick(data: { [key: string]: string }): void {
        console.log('👆 Notification tıklandı, navigation başlatılıyor...');
        console.log('   Data:', data);

        // Navigation logic buraya eklenecek
        // Örn: NavigationService.navigate('JobDetail', { requestId: data.request_id })
    }

    /**
     * Logout'ta FCM token'ı sil
     */
    async deleteToken(): Promise<void> {
        try {
            console.log('🗑️ FCM token siliniyor...');

            // Backend'den sil
            const deviceId = await deviceService.getDeviceId();
            await authAPI.deleteFCMToken(deviceId);

            // Firebase'den sil
            await messaging().deleteToken();

            this.fcmToken = null;
            console.log('✅ FCM token silindi');
        } catch (error) {
            console.error('❌ FCM token silme hatası:', error);
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

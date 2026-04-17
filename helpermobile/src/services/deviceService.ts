// Device ID ve FCM Token yönetimi için servis
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform, Linking } from 'react-native';
import AuthAPI from '../api/auth';

// PayPOS uygulama bilgileri
const PAYPOS_PACKAGE_NAME = 'com.paypos.app';
const PAYPOS_SCHEME = 'paypos://';
const PAYPOS_INSTALLED_KEY = 'paypos_installed';

const DEVICE_ID_KEY = 'device_id';
const FCM_TOKEN_KEY = 'fcm_token';

class DeviceService {
  /**
   * Cihaz için benzersiz ID oluştur veya mevcut olanı al
   * Her uygulama yüklemesi için unique bir ID
   */
  async getDeviceId(): Promise<string> {
    try {
      // Önce AsyncStorage'dan kontrol et
      let deviceId = await AsyncStorage.getItem(DEVICE_ID_KEY);

      if (!deviceId) {
        // Expo Application ID kullan (her yüklemede benzersiz)
        // Android: sync getAndroidId(), iOS: async getIosIdForVendorAsync()
        let nativeId: string | null = null;
        try {
          if (Platform.OS === 'android') {
            nativeId = Application.getAndroidId();
          } else if (Platform.OS === 'ios') {
            nativeId = await Application.getIosIdForVendorAsync();
          }
        } catch (nativeErr) {
          console.warn('⚠️ Native device ID alınamadı, fallback kullanılacak:', nativeErr);
          nativeId = null;
        }

        // Fallback: Timestamp-based unique ID
        if (!nativeId || nativeId === 'unknown') {
          deviceId = `${Platform.OS}_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        } else {
          deviceId = nativeId;
        }

        // Kaydet
        await AsyncStorage.setItem(DEVICE_ID_KEY, deviceId);
        console.log('📱 Yeni Device ID oluşturuldu:', deviceId);
      } else {
        console.log('📱 Mevcut Device ID kullanılıyor:', deviceId);
      }

      return deviceId;
    } catch (error) {
      console.error('❌ Device ID alma hatası:', error);
      // Fallback
      return `${Platform.OS}_${Date.now()}`;
    }
  }

  /**
   * Cihaz tipi (ios, android)
   */
  getDeviceType(): 'ios' | 'android' {
    return Platform.OS as 'ios' | 'android';
  }

  /**
   * FCM Token'ı kaydet (backend'e gönderilecek)
   * Login sonrası çağrılmalı
   */
  async registerFCMToken(fcmToken: string): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();
      const deviceType = this.getDeviceType();

      console.log(`🔔 FCM Token backend'e kaydediliyor...`);
      console.log('   • FCM Token:', fcmToken.substring(0, 20) + '...');
      console.log('   • Device ID:', deviceId);
      console.log('   • Device Type:', deviceType);

      // Backend'e gönder
      const response = await AuthAPI.registerFCMToken({
        fcm_token: fcmToken,
        device_id: deviceId,
        device_type: deviceType
      });

      // Local storage'a kaydet
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);

      console.log('✅ FCM Token kaydedildi:', response.created ? 'Yeni cihaz' : 'Güncellendi');
    } catch (error) {
      console.error('❌ FCM Token kaydetme hatası:', error);
      throw error;
    }
  }

  /**
   * FCM Token'ı sil (logout sırasında)
   * Sadece bu cihazın token'ı silinir
   */
  async unregisterFCMToken(): Promise<void> {
    try {
      const deviceId = await this.getDeviceId();

      console.log(`🗑️ FCM Token backend'den siliniyor...`);
      console.log('   • Device ID:', deviceId);

      // Backend'den sil
      await AuthAPI.deleteFCMToken(deviceId);

      // Local storage'dan sil
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);

      console.log('✅ FCM Token silindi');
    } catch (error) {
      console.error('❌ FCM Token silme hatası:', error);
      // Hata olsa bile local storage'dan sil
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
    }
  }

  /**
   * Kayıtlı FCM Token'ı al
   */
  async getSavedFCMToken(): Promise<string | null> {
    try {
      return await AsyncStorage.getItem(FCM_TOKEN_KEY);
    } catch (error) {
      console.error('❌ FCM Token alma hatası:', error);
      return null;
    }
  }

  /**
   * Device bilgilerini temizle (logout için)
   */
  async clearDeviceData(): Promise<void> {
    try {
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
      // Device ID'yi silme - uygulama yüklemesi boyunca aynı kalmalı
      console.log('🧹 Device data temizlendi (Device ID korundu)');
    } catch (error) {
      console.error('❌ Device data temizleme hatası:', error);
    }
  }

  // ==================== PayPOS App Kontrolü ====================

  /**
   * PayPOS uygulamasının yüklü olup olmadığını kontrol et
   * Sadece Android'de çalışır, iOS'ta her zaman false döner
   */
  async checkPayPOSInstalled(): Promise<boolean> {
    // Sadece Android'de PayPOS destekleniyor
    if (Platform.OS !== 'android') {
      console.log('📱 PayPOS sadece Android\'de destekleniyor');
      return false;
    }

    try {
      // PayPOS deeplink şemasını kontrol et
      const canOpen = await Linking.canOpenURL(PAYPOS_SCHEME);

      console.log(`📱 PayPOS uygulama kontrolü: ${canOpen ? 'Yüklü' : 'Yüklü değil'}`);

      // Sonucu cache'le
      await AsyncStorage.setItem(PAYPOS_INSTALLED_KEY, canOpen ? 'true' : 'false');

      return canOpen;
    } catch (error) {
      console.error('❌ PayPOS kontrol hatası:', error);
      return false;
    }
  }

  /**
   * Cache'lenmiş PayPOS durumunu al (hızlı erişim için)
   */
  async getPayPOSInstalledStatus(): Promise<boolean> {
    try {
      const cached = await AsyncStorage.getItem(PAYPOS_INSTALLED_KEY);
      return cached === 'true';
    } catch (error) {
      return false;
    }
  }

  /**
   * PayPOS uygulamasını Play Store'da aç
   */
  async openPayPOSInStore(): Promise<void> {
    if (Platform.OS !== 'android') return;

    try {
      const storeUrl = `market://details?id=${PAYPOS_PACKAGE_NAME}`;
      const canOpen = await Linking.canOpenURL(storeUrl);

      if (canOpen) {
        await Linking.openURL(storeUrl);
      } else {
        // Play Store web fallback
        await Linking.openURL(`https://play.google.com/store/apps/details?id=${PAYPOS_PACKAGE_NAME}`);
      }
    } catch (error) {
      console.error('❌ Play Store açma hatası:', error);
    }
  }
}

export const deviceService = new DeviceService();

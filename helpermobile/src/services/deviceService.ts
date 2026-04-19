// Device ID ve FCM Token yönetimi için servis
import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Application from 'expo-application';
import { Platform } from 'react-native';
import AuthAPI from '../api/auth';

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

      // Backend'e gönder
      await AuthAPI.registerFCMToken({
        fcm_token: fcmToken,
        device_id: deviceId,
        device_type: deviceType
      });

      // Local storage'a kaydet
      await AsyncStorage.setItem(FCM_TOKEN_KEY, fcmToken);
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

      // Backend'den sil
      await AuthAPI.deleteFCMToken(deviceId);

      // Local storage'dan sil
      await AsyncStorage.removeItem(FCM_TOKEN_KEY);
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

}

export const deviceService = new DeviceService();

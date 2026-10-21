/**
 * Merkezi Konum İzni Yöneticisi
 *
 * ExpoLocation native tarafında race condition (EXC_BAD_ACCESS) oluşmaması için
 * tüm konum izni istekleri bu modül üzerinden yapılmalıdır.
 * Aynı anda birden fazla requestPermission çağrısı yapılmasını engeller.
 */
import { Alert, Linking } from 'react-native';
import * as Location from 'expo-location';
import { logger } from './logger';

let permissionPromise: Promise<boolean> | null = null;

/**
 * Foreground + Background konum izni iste (singleton mutex)
 * Aynı anda sadece bir izin isteği çalışır, diğerleri aynı promise'i bekler
 */
export async function requestLocationPermissions(): Promise<boolean> {
  if (permissionPromise) return permissionPromise;

  permissionPromise = (async () => {
    try {
      const { status: fgStatus } = await Location.requestForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        logger.warn('location', 'locationPermission.foreground denied');
        return false;
      }

      const { status: bgStatus } = await Location.requestBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        logger.warn('location', 'locationPermission.background denied');
      }

      return true;
    } catch (error) {
      logger.error('location', 'locationPermission.request failure');
      return false;
    } finally {
      permissionPromise = null;
    }
  })();

  return permissionPromise;
}

/**
 * Foreground izni kontrol et, yoksa iste
 * Ekranlarda konum almadan önce kullanılır
 */
export async function ensureForegroundPermission(): Promise<boolean> {
  const { status } = await Location.getForegroundPermissionsAsync();
  if (status === 'granted') return true;
  return requestLocationPermissions();
}

// ---------------------------------------------------------------------------
// Çevrimiçi olurken konum izni (acente haritası)
// ---------------------------------------------------------------------------

type AlertChoice<T> = { text: string; value: T; style?: 'default' | 'cancel' | 'destructive' };

function ask<T>(title: string, message: string, choices: AlertChoice<T>[]): Promise<T> {
  return new Promise((resolve) => {
    Alert.alert(
      title,
      message,
      choices.map((c) => ({ text: c.text, style: c.style, onPress: () => resolve(c.value) })),
      { cancelable: false },
    );
  });
}

async function warnWithSettings(title: string, message: string): Promise<void> {
  const openSettings = await ask(title, message, [
    { text: 'Tamam', value: false, style: 'cancel' },
    { text: 'Ayarlara Git', value: true },
  ]);
  if (openSettings) Linking.openSettings().catch(() => {});
}

let onlinePromptPromise: Promise<void> | null = null;

/**
 * Sürücü "Çevrimiçi ol" dediğinde: acente haritasında güncel konumla görünmesi için
 * konum izinlerini ister. İzin vermese de çevrimiçi olabilir; sadece bilgilendirilir
 * (konum gelmezse acente haritasında iş adresinde görünür).
 *
 * Arka plan izninden önce, ne için ve uygulama kapalıyken de toplandığını anlatan
 * açıklama gösterilir (Google Play arka plan konum kuralı).
 */
export function ensureLocationForOnline(): Promise<void> {
  if (onlinePromptPromise) return onlinePromptPromise;
  onlinePromptPromise = (async () => {
    try {
      // Başka bir izin isteği sürüyorsa bitmesini bekle (aynı anda iki istek çöküyor)
      if (permissionPromise) await permissionPromise.catch(() => false);

      // 1) Ön plan izni
      let fg = await Location.getForegroundPermissionsAsync();
      if (fg.status !== 'granted' && fg.canAskAgain) {
        fg = await Location.requestForegroundPermissionsAsync();
      }
      if (fg.status !== 'granted') {
        logger.warn('location', 'online: foreground permission denied', { canAskAgain: fg.canAskAgain });
        await warnWithSettings(
          'Konum İzni Verilmedi',
          'Konum izni olmadan acente haritasında iş adresinizde görünürsünüz ve size yakındaki işler atanamayabilir. İzni Ayarlar\'dan açabilirsiniz.',
        );
        return;
      }

      // 2) Arka plan izni: önce açıklama
      const bg = await Location.getBackgroundPermissionsAsync();
      if (bg.status === 'granted') return;

      const accepted = await ask(
        'Arka Planda Konum',
        'Yol SepetiGo Sürücü, çevrimiçiyken size iş atanabilmesi için uygulama kapalıyken veya kullanılmıyorken de konumunuzu toplar ve acentelerle paylaşır. Aktif iş sırasında konumunuz müşteriyle de paylaşılır.',
        [
          { text: 'Şimdi Değil', value: false, style: 'cancel' },
          { text: 'İzin Ver', value: true },
        ],
      );

      let bgGranted = false;
      if (accepted) {
        const res = bg.canAskAgain
          ? await Location.requestBackgroundPermissionsAsync()
          : await Location.getBackgroundPermissionsAsync();
        bgGranted = res.status === 'granted';
      }
      if (!bgGranted) {
        logger.warn('location', 'online: background permission not granted', { accepted });
        await warnWithSettings(
          'Arka Plan Konumu Kapalı',
          'Uygulama kapalıyken konumunuz gönderilemez; uygulamayı uzun süre açmazsanız acente haritasında iş adresinizde görünürsünüz. Konum iznini Ayarlar\'dan "Her Zaman" yapabilirsiniz.',
        );
      }
    } catch (error: any) {
      logger.warn('location', 'online: permission flow failed', { message: error?.message });
    } finally {
      onlinePromptPromise = null;
    }
  })();
  return onlinePromptPromise;
}

import messaging, { FirebaseMessagingTypes } from '@react-native-firebase/messaging';
import * as Notifications from 'expo-notifications';
import { Platform } from 'react-native';

/**
 * Notification handler configuration
 * Bildirim gösterim ayarları
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: true,
    shouldShowBanner: true,
    shouldShowList: true,
  }),
});

/**
 * Register for push notifications and get FCM token
 * Push bildirimleri için kayıt ol ve FCM token'ı al
 */
export async function registerForPushNotificationsAsync(): Promise<string | undefined> {
  let token: string | undefined;

  if (Platform.OS === 'android') {
    await Notifications.setNotificationChannelAsync('default', {
      name: 'default',
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      lightColor: '#FF231F7C',
    });
  }

  const { status: existingStatus } = await Notifications.getPermissionsAsync();
  let finalStatus = existingStatus;

  if (existingStatus !== 'granted') {
    const { status } = await Notifications.requestPermissionsAsync();
    finalStatus = status;
  }

  if (finalStatus !== 'granted') {
    alert('Failed to get push token for push notification!');
    return;
  }

  // Get FCM token from Firebase
  try {
    token = await messaging().getToken();
    console.log('FCM Token:', token);
  } catch (error) {
    console.error('Error getting FCM token:', error);
  }

  return token;
}

/**
 * Setup foreground notification handler
 * Ön planda bildirim handler'ını ayarla
 *
 * Uygulama açıkken gelen bildirimleri göster
 */
export function setupForegroundNotificationHandler() {
  const unsubscribe = messaging().onMessage(async (remoteMessage) => {
    if (remoteMessage.notification) {
      try {
        await Notifications.scheduleNotificationAsync({
          content: {
            title: remoteMessage.notification.title || 'Yeni Bildirim',
            body: remoteMessage.notification.body || '',
            data: remoteMessage.data || {},
            sound: true,
          },
          trigger: null,
        });
      } catch (error) {
        console.error('❌ Local notification gösterme hatası:', error);
      }
    }
  });

  return unsubscribe;
}

/**
 * Setup background notification handler
 * Arka planda bildirim handler'ını ayarla
 *
 * Bu fonksiyon App.tsx'in dışında (index.ts) çağrılmalı
 *
 * ÖNEMLI: Background/Killed state'de gelen bildirim tıklamaları için
 * AsyncStorage'a kaydeder, böylece App mount olduğunda navigation yapılabilir
 */
export function setupBackgroundNotificationHandler() {
  messaging().setBackgroundMessageHandler(async (remoteMessage) => {
    console.log('📬 [Background Handler] Bildirim alındı:', remoteMessage);
    console.log('📬 [Background Handler] Bildirim data detay:', JSON.stringify(remoteMessage.data, null, 2));
    console.log('📬 [Background Handler] Bildirim notification:', JSON.stringify(remoteMessage.notification, null, 2));

    // Bildirime tıklandığında navigation için AsyncStorage'a kaydet
    // Böylece app mount olduğunda navigation yapılabilir
    const data = remoteMessage.data;
    if (data) {
      console.log('💾 [Background Handler] Pending navigation AsyncStorage\'a kaydediliyor...');

      const orderId = data.request_details_id || data.orderId || data.order_id || data.requestId || data.request_id;
      const serviceType = data.service_type || data.type || 'tow';

      const AsyncStorage = require('@react-native-async-storage/async-storage').default;
      await AsyncStorage.setItem('pending_notification_navigation', JSON.stringify({
        orderId: orderId,
        serviceType: serviceType,
        timestamp: Date.now()
      }));

      console.log('✅ [Background Handler] Pending navigation kaydedildi');
      console.log('   • orderId:', orderId);
      console.log('   • serviceType:', serviceType);
    }
  });
}

/**
 * Get initial notification (app açıldığında tıklanan bildirim)
 */
export async function getInitialNotification() {
  const remoteMessage = await messaging().getInitialNotification();
  if (remoteMessage) {
    console.log('📬 Uygulama bildirimden açıldı:', remoteMessage);
    return remoteMessage;
  }
  return null;
}

/**
 * Listen for notification opened app
 * Bildirime tıklandığında dinle
 */
export function onNotificationOpenedApp(callback: (remoteMessage: any) => void) {
  return messaging().onNotificationOpenedApp((remoteMessage) => {
    console.log('👆 Bildirime tıklandı (app background):', remoteMessage);
    callback(remoteMessage);
  });
}

/**
 * Schedule a local notification
 * Yerel bildirim planla
 */
export async function scheduleLocalNotification(
  title: string,
  body: string,
  data?: any,
  triggerSeconds: number = 1
) {
  await Notifications.scheduleNotificationAsync({
    content: {
      title,
      body,
      data,
      sound: true,
    },
    trigger: {
      type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
      seconds: triggerSeconds,
      repeats: false,
    },
  });
}

/**
 * Cancel all scheduled notifications
 * Tüm planlanmış bildirimleri iptal et
 */
export async function cancelAllNotifications() {
  await Notifications.cancelAllScheduledNotificationsAsync();
}

/**
 * Get badge count
 * Badge sayısını al
 */
export async function getBadgeCount(): Promise<number> {
  return await Notifications.getBadgeCountAsync();
}

/**
 * Set badge count
 * Badge sayısını ayarla
 */
export async function setBadgeCount(count: number) {
  await Notifications.setBadgeCountAsync(count);
}

/**
 * Clear badge
 * Badge'i temizle
 */
export async function clearBadge() {
  await Notifications.setBadgeCountAsync(0);
}

/**
 * Show error notification
 * Hata bildirimi göster
 *
 * Backend hatalarını kullanıcıya bildirim olarak gösterir
 */
export async function showErrorNotification(
  errorMessage: string,
  errorTitle: string = '❌ Hata Oluştu'
) {
  try {
    console.log('🔔 [Error Notification] Hata bildirimi gösteriliyor...');
    console.log('   • Title:', errorTitle);
    console.log('   • Message:', errorMessage);

    await Notifications.scheduleNotificationAsync({
      content: {
        title: errorTitle,
        body: errorMessage,
        sound: true,
        data: {
          type: 'error',
          timestamp: Date.now(),
        },
      },
      trigger: null, // Hemen göster
    });

    console.log('✅ [Error Notification] Hata bildirimi başarıyla gösterildi');
  } catch (error) {
    console.error('❌ [Error Notification] Bildirim gösterme hatası:', error);
  }
}

/**
 * Show WebSocket error notification
 * WebSocket hata bildirimi göster
 */
export async function showWebSocketErrorNotification(
  trackingToken?: string | null
) {
  const message = trackingToken
    ? `WebSocket bağlantısı kurulamadı. Konum takibi çalışmayabilir.\n\nTracking Token: ${trackingToken.substring(0, 16)}...`
    : 'WebSocket bağlantısı kurulamadı. Lütfen internet bağlantınızı kontrol edin.';

  await showErrorNotification(message, '🔌 Bağlantı Hatası');
}

/**
 * Show API error notification
 * API hata bildirimi göster
 */
export async function showAPIErrorNotification(
  endpoint: string,
  statusCode?: number,
  errorMessage?: string
) {
  const message = errorMessage
    ? `${errorMessage}\n\nEndpoint: ${endpoint}`
    : `API isteği başarısız oldu.\n\nEndpoint: ${endpoint}${statusCode ? `\nStatus: ${statusCode}` : ''}`;

  await showErrorNotification(message, '⚠️ API Hatası');
}

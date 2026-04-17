/**
 * Firebase Cloud Messaging (FCM) Bildirim Type Definitions
 *
 * Bu dosya backend ile frontend arasında bildirim data formatını standardize eder.
 * Backend'den gelen tüm bildirimler bu formatı takip etmelidir.
 */

/**
 * Bildirim Tipleri
 */
export type NotificationType =
  | 'new_request'          // Yeni iş talebi geldi
  | 'request_approved'     // Teklif onaylandı, işe başlayabilirsin
  | 'offer_accepted'       // Teklif kabul edildi (request_approved ile aynı)
  | 'request_cancelled'    // İş iptal edildi
  | 'payment_received'     // Ödeme alındı
  | 'system_message';      // Sistem mesajı

/**
 * Servis Tipleri
 */
export type ServiceType = 'tow' | 'crane' | 'home_moving' | 'city_moving' | 'road_assistance';

/**
 * Click Action - Bildirime tıklandığında ne olacak
 */
export type ClickAction =
  | 'OPEN_REQUEST_DETAILS'   // Teklif verme ekranı
  | 'OPEN_JOB_DETAILS'       // Aktif iş detayı ekranı
  | 'OPEN_EARNINGS'          // Kazanç ekranı
  | 'NONE';                  // Hiçbir şey yapma

/**
 * FCM Bildirim Data Payload
 *
 * BACKEND'DEN GELEN TÜM BİLDİRİMLER BU FORMATI KULLANMALIDIR!
 *
 * ⚠️ YENİ: tracking_token field'ı eklendi (backend tracking token sistemi)
 */
export interface NotificationDataPayload {
  /**
   * Bildirim tipi
   * @example 'new_request'
   */
  type: NotificationType;

  /**
   * Servis tipi - Çekici mi vinç mi?
   * @example 'tow'
   */
  service_type: ServiceType;

  /**
   * Request Details ID
   *
   * ÖNEMLI: Bu MUTLAKA CekiciRequestDetails.id veya VincRequestDetails.id olmalı!
   * Request.id DEĞİL!
   *
   * @example "123"
   */
  request_details_id: string;

  /**
   * Tracking Token (32 karakterlik)
   *
   * YENİ: Backend artık tüm endpoint'lerde tracking token kullanıyor
   * Bildirime tıklandığında bu token ile işlemler yapılacak
   *
   * @example "a1b2c3d4e5f6g7h8i9j0k1l2m3n4o5p6"
   */
  tracking_token?: string;

  /**
   * Bildirime tıklandığında yapılacak aksiyon
   * @example 'OPEN_REQUEST_DETAILS'
   */
  click_action: ClickAction;

  /**
   * Opsiyonel ekstra mesaj
   */
  message?: string;

  /**
   * Opsiyonel ekstra data
   */
  [key: string]: any;
}

/**
 * FCM Remote Message (Firebase'den gelen tam mesaj)
 */
export interface FCMRemoteMessage {
  messageId?: string;
  notification?: {
    title?: string;
    body?: string;
    android?: any;
    ios?: any;
  };
  data?: NotificationDataPayload;
  from?: string;
  collapseKey?: string;
  sentTime?: number;
}

/**
 * Backend Bildirim Gönderme Payload Örneği (Reference)
 *
 * Backend'de bu formatı kullanmalısınız:
 *
 * ÖNEMLI: Aşağıdaki örnek sadece DÖKÜMANTASYON amaçlıdır.
 * Gerçek bildirimler backend'den LocationTrackingToken ile gönderilmelidir.
 */
export const BACKEND_NOTIFICATION_EXAMPLE = {
  // Görsel bildirim (notification tray'de görünür)
  notification: {
    title: "Yeni İş Talebi! 🚛",
    body: "Yakınınızda yeni bir çekici talebi var. Detayları görüntüleyin.",
  },

  // Data payload (app içinde kullanılır)
  data: {
    type: "new_request" as NotificationType,
    service_type: "tow" as ServiceType,
    request_details_id: "123", // CekiciRequestDetails.id (string olarak)
    tracking_token: "<LocationTrackingToken.token>", // Backend'den gelen 32 karakterlik token
    click_action: "OPEN_REQUEST_DETAILS" as ClickAction,
  },

  // Platform-specific config
  android: {
    priority: "high" as const,
  },
  apns: {
    headers: {
      "apns-priority": "10",
    },
  },
};

/**
 * Validation Helper - Frontend'de bildirim data'sını validate et
 */
export function validateNotificationData(data: any): data is NotificationDataPayload {
  if (!data) {
    console.error('❌ Notification data is null/undefined');
    return false;
  }

  const requiredFields: (keyof NotificationDataPayload)[] = [
    'type',
    'service_type',
    'request_details_id',
    'click_action',
  ];

  for (const field of requiredFields) {
    if (!data[field]) {
      console.error(`❌ Missing required field: ${field}`);
      console.error('📦 Received data:', JSON.stringify(data, null, 2));
      return false;
    }
  }

  // request_details_id sayıya çevrilebilir olmalı
  if (isNaN(parseInt(data.request_details_id))) {
    console.error(`❌ Invalid request_details_id: ${data.request_details_id}`);
    console.error('Expected a numeric string, got:', typeof data.request_details_id);
    return false;
  }

  return true;
}

/**
 * Helper: Notification data'dan orderId ve serviceType çıkar
 */
export function extractNotificationInfo(data: NotificationDataPayload): {
  orderId: string;
  serviceType: ServiceType;
  clickAction: ClickAction;
} {
  return {
    orderId: data.request_details_id,
    serviceType: data.service_type,
    clickAction: data.click_action,
  };
}

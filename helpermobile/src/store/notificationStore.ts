import { create } from 'zustand';
import { NotificationDto } from '../lib/types';
import { logger } from '../utils/logger';

/**
 * Notification Store
 * Bildirim yönetimi için Zustand store
 *
 * Bu store:
 * - Uygulama içi bildirimleri saklar
 * - Okunmamış bildirim sayısını takip eder
 * - Bildirim geçmişini yönetir
 */

interface NotificationState {
  notifications: NotificationDto[];
  unreadCount: number;
  fcmToken: string | null;
}

interface NotificationActions {
  // FCM token'ı kaydet
  setFcmToken: (token: string) => void;

  // Yeni bildirim ekle
  addNotification: (notification: NotificationDto) => void;

  // Bildirimi okundu olarak işaretle
  markAsRead: (notificationId: string) => void;

  // Tüm bildirimleri okundu olarak işaretle
  markAllAsRead: () => void;

  // Bildirimi sil
  removeNotification: (notificationId: string) => void;

  // Tüm bildirimleri temizle
  clearAllNotifications: () => void;

  // Bildirimleri backend'den yükle
  loadNotifications: (notifications: NotificationDto[]) => void;
}

type NotificationStore = NotificationState & NotificationActions;

export const useNotificationStore = create<NotificationStore>((set, get) => ({
  // Initial state
  notifications: [],
  unreadCount: 0,
  fcmToken: null,

  // Actions
  setFcmToken: (token: string) => {
    set({ fcmToken: token });
  },

  addNotification: (notification: NotificationDto) => {
    const { notifications } = get();

    // Aynı bildirim zaten varsa ekleme
    if (notifications.some(n => n.id === notification.id)) {
      return;
    }

    set({
      notifications: [notification, ...notifications],
      unreadCount: get().unreadCount + (notification.isRead ? 0 : 1),
    });

    logger.debug('fcm', 'notificationStore.addNotification', { id: notification.id });
  },

  markAsRead: (notificationId: string) => {
    const { notifications } = get();

    const updatedNotifications = notifications.map(n =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );

    const unreadCount = updatedNotifications.filter(n => !n.isRead).length;

    set({
      notifications: updatedNotifications,
      unreadCount,
    });
  },

  markAllAsRead: () => {
    const { notifications } = get();

    const updatedNotifications = notifications.map(n => ({ ...n, isRead: true }));

    set({
      notifications: updatedNotifications,
      unreadCount: 0,
    });

    logger.debug('fcm', 'notificationStore.markAllAsRead');
  },

  removeNotification: (notificationId: string) => {
    const { notifications } = get();

    const notificationToRemove = notifications.find(n => n.id === notificationId);
    const updatedNotifications = notifications.filter(n => n.id !== notificationId);

    const unreadCount = notificationToRemove && !notificationToRemove.isRead
      ? get().unreadCount - 1
      : get().unreadCount;

    set({
      notifications: updatedNotifications,
      unreadCount,
    });
  },

  clearAllNotifications: () => {
    set({
      notifications: [],
      unreadCount: 0,
    });

    logger.debug('fcm', 'notificationStore.clearAllNotifications');
  },

  loadNotifications: (notifications: NotificationDto[]) => {
    const unreadCount = notifications.filter(n => !n.isRead).length;

    set({
      notifications,
      unreadCount,
    });

    logger.debug('fcm', 'notificationStore.loadNotifications', { total: notifications.length, unreadCount });
  },
}));

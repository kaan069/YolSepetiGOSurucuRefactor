/**
 * Bildirim izni durumu (tek kaynak). Kapalıysa yeni talep bildirimleri sürücüye ulaşmaz.
 *
 * useNotifications uygulama açılışında ve ön plana gelişte günceller; izin sonradan açılırsa
 * FCM token'ı o an alınıp backend'e gönderilir. Ana ekrandaki uyarı bandı da buradan okur.
 */
import { create } from 'zustand';
import { Linking } from 'react-native';
import * as Notifications from 'expo-notifications';
import { logger } from '../utils/logger';

interface PushPermissionState {
  /** null: henüz kontrol edilmedi */
  granted: boolean | null;
  /** Sistem izin penceresi tekrar gösterilebilir mi */
  canAskAgain: boolean;
  /** Bu oturumda banttan izin istendi mi (reddedilirse sonraki dokunuş ayarları açar) */
  asked: boolean;
  refresh: () => Promise<void>;
  /** İzin penceresini açar; açılamıyorsa telefonun ayarlarına götürür */
  enable: () => Promise<void>;
}

export const usePushPermissionStore = create<PushPermissionState>((set, get) => ({
  granted: null,
  canAskAgain: true,
  asked: false,

  refresh: async () => {
    try {
      const { granted, canAskAgain } = await Notifications.getPermissionsAsync();
      set({ granted, canAskAgain });
    } catch (error: any) {
      logger.warn('fcm', 'pushPermission.refresh failed', { message: error?.message });
    }
  },

  enable: async () => {
    const { canAskAgain, asked } = get();
    try {
      if (canAskAgain && !asked) {
        set({ asked: true });
        const result = await Notifications.requestPermissionsAsync();
        set({ granted: result.granted, canAskAgain: result.canAskAgain });
        return;
      }
      await Linking.openSettings();
    } catch (error: any) {
      logger.warn('fcm', 'pushPermission.enable failed', { message: error?.message });
    }
  },
}));

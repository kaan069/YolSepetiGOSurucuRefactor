import * as React from 'react';
import { Provider as PaperProvider } from 'react-native-paper';
import { View, Alert } from 'react-native';
import * as Font from 'expo-font';
import AsyncStorage from '@react-native-async-storage/async-storage';
import RootNavigator from './navigation';
import { theme, darkTheme } from './theme/theme';
import { useThemeStore } from './store/useThemeStore';
import { useOnboardingStore } from './store/useOnboardingStore';
import { useGuideStore } from './store/useGuideStore';
import GuideOverlay from './components/guide/GuideOverlay';
import { useLocationTracking } from './hooks/useLocationTracking';
import { useLocationWebSocket } from './hooks/useLocationWebSocket';
import LoadingSpinner from './components/LoadingSpinner';
import { useNotifications } from './hooks/useNotifications';
import NotificationBanner from './components/NotificationBanner';
import GlobalNotification from './components/GlobalNotification';
import NetworkStatusAlert from './components/NetworkStatusAlert';
import LocationPermissionAlert from './components/LocationPermissionAlert';
import BackgroundPermissionGate from './components/BackgroundPermissionGate';
import AccountReadinessGate from './components/AccountReadinessGate';
import UpgradeRequiredGate from './components/UpgradeRequiredGate';
import { useAuthStore } from './store/authStore';
import { useUpgradeStore } from './store/useUpgradeStore';
import { fetchAppVersionConfig } from './api/appVersion';
import { APP_VERSION, APP_PLATFORM, compareVersions } from './constants/appVersion';
import { useActiveJobStore } from './store/useActiveJobStore';
import { useNakliyeLocationStore } from './store/useNakliyeLocationStore';
import { authAPI, requestsAPI } from './api';
import { navigateByRequestStatus, isStaleNotification } from './utils/notificationNavigation';
import { backgroundLocationService } from './services/backgroundLocationService';
import { logger } from './utils/logger';

export default function App() {
  const [fontsLoaded, setFontsLoaded] = React.useState(false);
  const [authChecked, setAuthChecked] = React.useState(false);
  const { setIsAuthenticated, setCurrentUser, isAuthenticated } = useAuthStore();
  const { isDarkMode, loadThemePreference } = useThemeStore();
  const { isOnboardingLoaded, loadOnboardingStatus } = useOnboardingStore();
  const { isGuideLoaded, loadGuideStatus } = useGuideStore();
  const { trackingToken: activeJobTrackingToken, serviceType: activeJobServiceType, clearActiveJob } = useActiveJobStore();
  const nakliyeLocationState = useNakliyeLocationStore();
  const navigationRef = React.useRef<any>(null);

  // Check if user has valid tokens on app start
  React.useEffect(() => {
    async function checkAuthStatus() {
      try {
        const accessToken = await AsyncStorage.getItem('access_token');
        const userData = await AsyncStorage.getItem('user');

        if (accessToken && userData) {
          try {
            const profileResponse = await authAPI.getProfile();

            if (profileResponse && profileResponse.user) {
              setCurrentUser(profileResponse.user);

              setIsAuthenticated(true);
            } else {
              await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            }
          } catch (error: any) {
            // Network hatası ise (internet yok) kullanıcıyı çıkış yaptırma, cached data ile devam et
            if (!error.response && error.request) {
              logger.warn('auth', 'App.checkAuth - offline, using cached session');
              const cachedUser = JSON.parse(userData);
              setCurrentUser(cachedUser);
              setIsAuthenticated(true);
            } else {
              // Token geçersiz (401) veya başka API hatası - çıkış yap
              await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            }
          }
        }
      } catch (error: any) {
        logger.error('auth', 'App.checkAuth failure', { status: error?.response?.status });
      } finally {
        setAuthChecked(true);
      }
    }

    checkAuthStatus();
  }, [setIsAuthenticated, setCurrentUser]);

  React.useEffect(() => {
    async function loadFonts() {
      try {
        await Font.loadAsync({
          MaterialCommunityIcons: require('react-native-vector-icons/Fonts/MaterialCommunityIcons.ttf'),
        });
        setFontsLoaded(true);
      } catch (error) {
        logger.error('general', 'App.loadFonts failure');
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Tema tercihini AsyncStorage'dan yükle
  React.useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

  // Proactive versiyon kontrolü — splash sırasında `GET /app-version/` ile
  // min versiyonu sorgular. Düşükse UpgradeRequiredGate'i tetikler ve diğer
  // tüm akışları (auth check, font load) görsel olarak override eder.
  // Başarısız olursa interceptor 426 fallback'i devreye girer; uygulama kilitlenmez.
  React.useEffect(() => {
    let cancelled = false;
    (async () => {
      const config = await fetchAppVersionConfig();
      if (cancelled || !config) return;

      const driverConfig = config.driver;
      if (!driverConfig) return;

      const platform = APP_PLATFORM as 'ios' | 'android' | 'web';
      const minVersion = driverConfig.min_versions?.[platform];
      const updateUrl = driverConfig.update_urls?.[platform];

      if (minVersion && compareVersions(APP_VERSION, minVersion) < 0) {
        useUpgradeStore.getState().setUpgradeRequired({
          messageTr: config.update_message_tr || 'Lütfen uygulamayı güncelleyin.',
          messageEn: config.update_message_en || 'Please update the app.',
          minVersion,
          currentVersion: APP_VERSION,
          updateUrl: updateUrl || '',
        });
      }
    })();
    return () => { cancelled = true; };
  }, []);

  // Onboarding durumunu AsyncStorage'dan yükle
  React.useEffect(() => {
    loadOnboardingStatus();
  }, [loadOnboardingStatus]);

  // Rehber durumunu AsyncStorage'dan yükle
  React.useEffect(() => {
    loadGuideStatus();
  }, [loadGuideStatus]);

  // Uygulama başlatıldığında: orphaned task temizle + aktif işin hâlâ geçerli olup olmadığını backend'den doğrula
  React.useEffect(() => {
    const validateAndCleanup = async () => {
      // Önce orphaned background location task'ı temizle
      await backgroundLocationService.cleanupOrphanedTask();

      // Aktif iş hâlâ geçerli mi backend'den doğrula
      if (!isAuthenticated) return;
      const { activeJobId, serviceType, clearActiveJob } = useActiveJobStore.getState();
      if (!activeJobId || !serviceType) return;

      try {
        const jobId = parseInt(activeJobId);
        let detail: any = null;

        // NOT: Store canonical ServiceType tutar (Faz 2). Legacy key'ler
        // (tow/transport/...) geriye uyum için korundu — eski persist hydrate
        // edilip migrate edilmeden önce güvenli olmak için.
        const detailFetchers: Record<string, (id: number) => Promise<any>> = {
          // Canonical
          towTruck: (id) => requestsAPI.getTowTruckRequestDetail(id),
          crane: (id) => requestsAPI.getCraneRequestDetail(id),
          transfer: (id) => requestsAPI.getTransferRequestDetail(id),
          roadAssistance: (id) => requestsAPI.getRoadAssistanceRequestDetail(id),
          homeToHomeMoving: (id) => requestsAPI.getHomeMovingRequestDetail(id),
          cityToCity: (id) => requestsAPI.getHomeMovingRequestDetail(id),
          // Legacy (geriye uyum — migration öncesi çağrılar için)
          tow: (id) => requestsAPI.getTowTruckRequestDetail(id),
          transport: (id) => requestsAPI.getHomeMovingRequestDetail(id),
        };

        const fetcher = detailFetchers[serviceType];
        if (fetcher) detail = await fetcher(jobId);

        const status = detail?.status || detail?.request_id?.status;
        if (status === 'completed' || status === 'cancelled') {
          logger.debug('orders', 'App.validateActiveJob - cleared (completed/cancelled)');
          clearActiveJob();
          await backgroundLocationService.forceStop();
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          logger.debug('orders', 'App.validateActiveJob - cleared (404)');
          clearActiveJob();
          await backgroundLocationService.forceStop();
        }
      }
    };

    validateAndCleanup();
  }, [isAuthenticated]);

  useLocationTracking();

  // ═══════════════════════════════════════════════════════════════════════════
  // AKTİF İŞ WebSocket - useActiveJobStore'dan trackingToken alınır
  // ⚠️ SADECE İŞ DEVAM EDİYORKEN (in_progress) KONUM GÖNDERİMİ YAPILIR
  // ⚠️ NAKLİYE (transport) İŞLERİ HARİÇ - Onlar için manuel "Yola Çık" butonu kullanılır
  // ═══════════════════════════════════════════════════════════════════════════

  // Transport (nakliye) işleri ve employee kullanıcılar için WebSocket'i devre dışı bırak
  // Employee kullanıcılar kendi WebSocket'lerini EmployeeJobDetailScreen'de yönetir
  // NOT: Store canonical ServiceType tutar (Faz 2). Nakliye = homeToHomeMoving ∪ cityToCity.
  const currentUser = useAuthStore((s) => s.currentUser);
  const isEmployeeUser = (currentUser as any)?.provider_type === 'employee';
  const isNakliyeServiceType =
    activeJobServiceType === 'homeToHomeMoving' ||
    activeJobServiceType === 'cityToCity';
  const shouldEnableWebSocket =
    !!activeJobTrackingToken && !isNakliyeServiceType && !isEmployeeUser;

  // Global WebSocket - Aktif job varsa her zaman çalışır (background/foreground farketmez)
  // İş tamamlandığında (completed) veya iptal edildiğinde (cancelled) otomatik kapanır
  // ⚠️ TRACKING TOKEN BAZLI
  useLocationWebSocket({
    trackingToken: activeJobTrackingToken,
    enabled: isAuthenticated && !!shouldEnableWebSocket,
    onConnected: () => { },
    onError: async () => {
      logger.error('websocket', 'App.globalLocation.onError');
    },
    onDisconnected: () => { },
    onStatusUpdate: (data: any) => {
      if (data.status === 'cancelled' || data.status === 'completed') {
        clearActiveJob();
      }
    },
    onRequestRejected: () => {
      clearActiveJob();
    },
  });

  React.useEffect(() => { }, [shouldEnableWebSocket, activeJobTrackingToken, activeJobServiceType]);

  // ═══════════════════════════════════════════════════════════════════════════
  // NAKLİYE KONUM PAYLAŞIMI - Global WebSocket
  // Nakliye işlerinde sürücü manuel olarak "Yola Çık" butonuna bastığında başlar
  // Hangi ekranda olursa olsun konum paylaşımı devam eder
  // ═══════════════════════════════════════════════════════════════════════════
  useLocationWebSocket({
    trackingToken: nakliyeLocationState.trackingToken,
    enabled: isAuthenticated && nakliyeLocationState.isLocationSharing && !!nakliyeLocationState.trackingToken,
    onConnected: () => { },
    onError: () => {
      logger.error('websocket', 'App.nakliyeLocation.onError');
      // Hata durumunda konum paylaşımını durdur
      nakliyeLocationState.stopLocationSharing();
      Alert.alert('Hata', 'Konum paylaşımı başlatılamadı. Lütfen tekrar deneyin.');
    },
    onDisconnected: () => { },
  });

  React.useEffect(() => { }, [nakliyeLocationState.isLocationSharing]);

  const { expoPushToken, notification, showBanner, setShowBanner } = useNotifications(navigationRef);

  React.useEffect(() => { }, [expoPushToken]);

  React.useEffect(() => { }, [notification]);

  if (!fontsLoaded || !authChecked || !isOnboardingLoaded || !isGuideLoaded) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#fff' }}>
        <LoadingSpinner size={100} />
      </View>
    );
  }

  return (
    <PaperProvider theme={isDarkMode ? darkTheme : theme}>
      <RootNavigator navigationRef={navigationRef} />

      <NotificationBanner
        visible={showBanner}
        title={notification?.request.content.title || ''}
        body={notification?.request.content.body || ''}
        onDismiss={() => setShowBanner(false)}
        onPress={() => {
          setShowBanner(false);
          const data = notification?.request.content.data;

          if (!data) return;

          const orderId = data.request_details_id || data.orderId || data.order_id || data.requestId || data.request_id;
          const serviceType = data.service_type || data.type || 'tow';
          const notificationType = data.type;

          // Eski bildirim (>24h): foreground banner'da bile eski payload görülebilir
          // (örn. uygulama kapalıyken tray'de bekleyen bildirim açılışta banner'a düşerse).
          // OfferScreen'de 404 göstermek yerine OrdersTab'a yönlendir.
          const stale = isStaleNotification(notification);

          if (navigationRef.current) {
            if (stale) {
              navigationRef.current.navigate('Tabs', { screen: 'OrdersTab' });
            }
            // Eleman iş ataması bildirimi - EmployeeJobDetail'e yönlendir
            else if (notificationType === 'job_assigned') {
              const requestId = data.request_id;
              if (requestId) {
                try {
                  navigationRef.current.navigate('EmployeeJobDetail', {
                    requestId: parseInt(String(requestId)),
                  });
                } catch (e: any) {
                  logger.error('navigation', '[Banner] EmployeeJobDetail navigate failed', { message: e?.message });
                  navigationRef.current.navigate('Tabs', { screen: 'OrdersTab' });
                }
              }
            }
            else if (notificationType === 'job_completed' || notificationType === 'request_completed') {
              navigationRef.current.navigate('Tabs', { screen: 'EarningsTab' });
            }
            else if (notificationType === 'request_cancelled') {
              navigationRef.current.navigate('Tabs', { screen: 'OrdersTab' });
            }
            else if (orderId) {
              // Talebin gerçek statüsüne göre OfferScreen veya JobDetail'e yönlendir
              navigateByRequestStatus(navigationRef, orderId, serviceType, '[Banner]')
                .catch((e) => logger.error('navigation', '[Banner] navigateByRequestStatus rejected', { message: e?.message }));
            }
          }
        }}
      />

      <GuideOverlay />

      <GlobalNotification />

      {/* İnternet bağlantısı kontrolü - bağlantı yoksa kapanmayan alert gösterir */}
      <NetworkStatusAlert />

      {/* Konum izni / GPS kontrolü - konum kapalıysa kapanmayan alert gösterir */}
      <LocationPermissionAlert />

      {/* Arka plan çalışma izni kontrolü - arka plan konum izni ve pil optimizasyonu */}
      <BackgroundPermissionGate />

      {/* Hesap onay kontrolü - onaylanana kadar kapanmayan gate */}
      <AccountReadinessGate navigationRef={navigationRef} />

      {/* Zorunlu versiyon kontrolü - backend min versiyon yükselttiğinde veya
          splash kontrolü düşük versiyon tespit ettiğinde mağazaya yönlendirir.
          Diğer tüm gate'lerin üzerinde — auth/network sorunundan bağımsız çalışır. */}
      <UpgradeRequiredGate />
    </PaperProvider>
  );
}

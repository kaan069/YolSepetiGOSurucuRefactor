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
import { useAuthStore } from './store/authStore';
import { useActiveJobStore } from './store/useActiveJobStore';
import { useNakliyeLocationStore } from './store/useNakliyeLocationStore';
import { authAPI, requestsAPI } from './api';
import { navigateToAcceptedJob, navigateToOfferScreen } from './utils/notificationNavigation';
import { backgroundLocationService } from './services/backgroundLocationService';

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
              console.log('🌐 [App Start] İnternet yok, cached verilerle devam ediliyor');
              const cachedUser = JSON.parse(userData);
              setCurrentUser(cachedUser);
              setIsAuthenticated(true);
            } else {
              // Token geçersiz (401) veya başka API hatası - çıkış yap
              await AsyncStorage.multiRemove(['access_token', 'refresh_token', 'user']);
            }
          }
        }
      } catch (error) {
        console.error('❌ Error checking auth status:', error);
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
        console.error('Error loading fonts:', error);
        setFontsLoaded(true);
      }
    }
    loadFonts();
  }, []);

  // Tema tercihini AsyncStorage'dan yükle
  React.useEffect(() => {
    loadThemePreference();
  }, [loadThemePreference]);

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
          console.log('🧹 [App] Aktif iş artık geçerli değil, temizleniyor...');
          clearActiveJob();
          await backgroundLocationService.forceStop();
        }
      } catch (error: any) {
        if (error?.response?.status === 404) {
          console.log('🧹 [App] Aktif iş bulunamadı (404), temizleniyor...');
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
    onError: async (error) => {
      console.error('❌ [App] Global WebSocket hatası:', error);
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
    onError: (error) => {
      console.error('❌ [App] Nakliye WebSocket hatası:', error);
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

          if (navigationRef.current) {
            // Eleman iş ataması bildirimi - EmployeeJobDetail'e yönlendir
            if (notificationType === 'job_assigned') {
              const requestId = data.request_id;
              if (requestId) {
                navigationRef.current.navigate('EmployeeJobDetail', {
                  requestId: parseInt(String(requestId)),
                });
              }
            }
            else if (notificationType === 'job_completed' || notificationType === 'request_completed') {
              navigationRef.current.navigate('Tabs', { screen: 'EarningsTab' });
            }
            else if (notificationType === 'request_cancelled') {
              navigationRef.current.navigate('Tabs', { screen: 'OrdersTab' });
            }
            else if ((notificationType === 'offer_accepted' || notificationType === 'request_approved') && orderId) {
              navigateToAcceptedJob(navigationRef, orderId, serviceType, '[Banner]');
            }
            else if (orderId) {
              navigateToOfferScreen(navigationRef, orderId, serviceType);
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
    </PaperProvider>
  );
}

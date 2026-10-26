// This is the main screen of the application for the driver.
// Bu, sürücü için uygulamanın ana ekranıdır.
//
// Düzen (yukarıdan aşağı): çevrimiçi şeridi → uyarılar (hizmet şehri, bildirim izni) →
// duyuru panosu → butonlar → iş kutusu → talep özeti → kazanç özeti.
// Pano ve butonlar backend'den gelir (yoksa gizlenir); iş kutusu her zaman görünür.
// Duyuru ve iş kartları 16:9 ve aynı boyda (duyuru görseli detay sayfasındaki gibi tam görünür).
// Harita şimdilik kaldırıldı (kodu aşağıda yorum satırında).
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { RefreshControl, ScrollView, StyleSheet, View } from 'react-native';
import { Switch, Text } from 'react-native-paper';
// import { TouchableOpacity } from 'react-native';
// import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
// import MapView, { Region } from 'react-native-maps';
// import * as Location from 'expo-location';
// import { rememberPosition } from '../services/appLocationPing';
import messaging from '@react-native-firebase/messaging';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverStore } from '../store/driverStore';
import { useAuthStore } from '../store/authStore';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../hooks/useAppTheme';
import { useFkTokens } from '../hooks/useFkTokens';
import { useHomeJobs } from '../hooks/useHomeJobs';
import { RootStackParamList } from '../navigation';
import authAPI from '../api/auth';
import { logger } from '../utils/logger';
import { ensureLocationForOnline } from '../utils/locationPermission';
import { FkButton, FkInfoBanner } from '../components/fk';
import DriverBoard from '../components/home/DriverBoard';
import BoardButtons from '../components/home/BoardButtons';
import ActiveJobsBox from '../components/home/ActiveJobsBox';
import RequestSummary from '../components/home/RequestSummary';
import EarningsSummaryCard from '../components/home/EarningsSummaryCard';
import { useHomeEarnings } from '../hooks/useHomeEarnings';
import { usePushPermissionStore } from '../store/usePushPermissionStore';
import { userServiceTypesOf } from './orders/hooks/useUserServiceTypes';
import type { ServiceFilterType } from './orders/hooks/useOrdersData';
import driverBoardAPI, { BoardClickSource } from '../api/driverBoard';
import { useDriverBoard, useDriverBoardStore } from '../store/useDriverBoardStore';
import type { HomeJob } from '../services/homeJobs';
import { colors, spacing as ds, text } from '../theme/design';

/** Duyuru butonları şeridinin yüksekliği (kart boyları HomeCarousel'de genişlikten hesaplanır) */
const BUTTONS_HEIGHT = 84;

export default function HomeScreen() {
  // Get state and actions from global stores.
  // Global store'lardan state ve eylemleri al.
  const { isAvailable, updateOnlineStatus, loadOnlineStatus, isLoadingStatus } = useDriverStore();
  const { currentUser, setCurrentUser } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { screenBg, cardBg, textPrimary, textSecondary } = useAppTheme();
  const { tokens } = useFkTokens();
  const { safeArea } = useResponsive();

  // Hizmet şehirleri (service_cities) boş mu? Boşsa banner göster.
  // AsyncStorage'daki eski user objesi service_cities içermeyebilir; backend'den taze çekmeden
  // banner'ı gizlersek yanlış pozitif/negatif olur — useEffect aşağıda taze profil çeker.
  const needsServiceCity = !currentUser?.service_cities || currentUser.service_cities.length === 0;

  // Backend'den pano ve butonlar (yoksa bölüm gizlenir)
  const board = useDriverBoard();
  const hasBoard = board.items.length > 0;
  const hasButtons = board.buttons.length > 0;

  // Sürücünün üzerindeki işler (devam eden, ödeme bekleyen, randevulu); talep özetinin
  // sayıları da bu yenilemeyle gelir
  const homeJobs = useHomeJobs();
  const homeEarnings = useHomeEarnings();
  const userServices = useMemo(() => userServiceTypesOf(currentUser?.user_type), [currentUser?.user_type]);
  const [refreshing, setRefreshing] = useState(false);

  // Bildirim izni kapalıysa yeni talep bildirimleri gelmez (durum useNotifications'ta güncellenir)
  const pushGranted = usePushPermissionStore((s) => s.granted);
  const canPromptPush = usePushPermissionStore((s) => s.canAskAgain && !s.asked);

  useFocusEffect(
    useCallback(() => {
      useDriverBoardStore.getState().refresh();
    }, []),
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await Promise.all([
      useDriverBoardStore.getState().refresh({ force: true }),
      homeJobs.refresh(true),
      homeEarnings.refresh(true),
    ]);
    setRefreshing(false);
  }, [homeJobs, homeEarnings]);

  const openOrders = useCallback(
    (serviceFilter: ServiceFilterType, filter: 'pending' | 'awaiting_approval') => {
      navigation.navigate('Tabs', { screen: 'OrdersTab', params: { serviceFilter, filter, timestamp: Date.now() } });
    },
    [navigation],
  );

  const openBoardItem = useCallback(
    (itemId: number, source: BoardClickSource) => {
      driverBoardAPI.trackClick(itemId, source);
      navigation.navigate('BoardItemDetail', { itemId });
    },
    [navigation],
  );

  // Detay ekranları Siparişler / Randevulu İşlerim ile aynı kimlikle açılır
  const openJob = useCallback(
    (job: HomeJob) => {
      switch (job.service) {
        case 'towTruck':
          navigation.navigate('JobDetail', { jobId: job.jobId });
          break;
        case 'crane':
          navigation.navigate('CraneJobDetail', { jobId: job.jobId });
          break;
        case 'homeToHomeMoving':
          navigation.navigate('NakliyeJobDetail', { jobId: job.jobId, movingType: 'home' });
          break;
        case 'cityToCity':
          navigation.navigate('NakliyeJobDetail', { jobId: job.jobId, movingType: 'city' });
          break;
        case 'roadAssistance':
          navigation.navigate('RoadAssistanceJobDetail', { jobId: job.jobId });
          break;
        case 'transfer':
          navigation.navigate('TransferJobDetail', { jobId: job.jobId });
          break;
      }
    },
    [navigation],
  );

  // Online status'u yükle
  useEffect(() => {
    loadOnlineStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Backend'den taze profil çek — service_cities banner doğru kararla gösterilsin
  // (mevcut login'li kullanıcıların AsyncStorage'ındaki user objesi service_cities içermeyebilir)
  useEffect(() => {
    authAPI.getProfile()
      .then(r => setCurrentUser(r.user))
      .catch(err => logger.warn('auth', 'HomeScreen.refreshProfile failed', { status: err?.response?.status }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Online/offline durumunu değiştir
  const handleAvailabilityChange = async (value: boolean) => {
    // Çevrimiçi olmadan önce konum izni (acente haritasında güncel konumla görünmek için);
    // izin verilmese de çevrimiçi olunur, "online" app-ping'i izin varsa gider
    if (value) await ensureLocationForOnline();
    await updateOnlineStatus(value);
  };

  // ---------------------------------------------------------------------------
  // HARİTA (şimdilik kaldırıldı). Geri almak için bu bloğu, import'ları ve aşağıdaki
  // JSX bloğunu yorumdan çıkar; `currentLocation`'ı useDriverStore'dan, `spacing`,
  // `tabBar`, `moderateScale`'i useResponsive'den al.
  // ---------------------------------------------------------------------------
  // const mapRef = useRef<MapView>(null);
  // const [region, setRegion] = useState<Region | null>(null);
  //
  // // Konumu bul - Haritayı kullanıcının konumuna götür
  // const handleFindMyLocation = async () => {
  //   try {
  //     const freshLocation = await Location.getCurrentPositionAsync({
  //       accuracy: Location.Accuracy.High,
  //     });
  //     if (freshLocation) rememberPosition(freshLocation);
  //     if (freshLocation && mapRef.current) {
  //       mapRef.current.animateToRegion({
  //         latitude: freshLocation.coords.latitude,
  //         longitude: freshLocation.coords.longitude,
  //         latitudeDelta: 0.01, // Yakın zoom
  //         longitudeDelta: 0.01,
  //       }, 1000);
  //     }
  //   } catch (error) {
  //     logger.error('location', 'HomeScreen.findMyLocation failure');
  //     // Hata durumunda store'daki konumu kullan
  //     if (currentLocation && mapRef.current) {
  //       mapRef.current.animateToRegion({
  //         latitude: currentLocation.coords.latitude,
  //         longitude: currentLocation.coords.longitude,
  //         latitudeDelta: 0.01,
  //         longitudeDelta: 0.01,
  //       }, 1000);
  //     }
  //   }
  // };
  //
  // // HomeScreen yüklendiğinde otomatik olarak kullanıcı konumuna git
  // useEffect(() => {
  //   Location.getForegroundPermissionsAsync()
  //     .then(({ status }) => {
  //       // Kısa bir gecikme ile konuma git (haritanın yüklenmesi için)
  //       if (status === 'granted') setTimeout(() => handleFindMyLocation(), 500);
  //     })
  //     .catch(() => logger.error('location', 'HomeScreen.autoNavigate failure'));
  // }, []);
  //
  // const locationButtonStyle = {
  //   bottom: tabBar.height + spacing.sm, // Tab bar'ın hemen üstünde, sağ alt köşede
  //   right: spacing.md,
  //   width: moderateScale(52),
  //   height: moderateScale(52),
  //   borderRadius: moderateScale(26),
  // };

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      {/* HARİTA (şimdilik kaldırıldı)
      <MapView
        ref={mapRef}
        style={StyleSheet.absoluteFill}
        region={region || undefined}
        showsUserLocation
        loadingEnabled
      />
      <TouchableOpacity
        style={[styles.locationButton, locationButtonStyle, { backgroundColor: cardBg }]}
        onPress={handleFindMyLocation}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel="Konumumu bul"
      >
        <MaterialCommunityIcons name="crosshairs-gps" size={moderateScale(24)} color={colors.primary[500]} />
      </TouchableOpacity>
      */}

      {/* Çevrimiçi şeridi */}
      <View
        style={[
          styles.statusBar,
          { paddingTop: safeArea.top + ds.sm, backgroundColor: cardBg, borderBottomColor: tokens.colors.border },
        ]}
      >
        <View
          style={[
            styles.statusIcon,
            { backgroundColor: isAvailable ? colors.success[50] : colors.neutral[100] },
          ]}
        >
          <View
            style={[
              styles.statusDot,
              { backgroundColor: isAvailable ? colors.success[500] : colors.neutral[400] },
            ]}
          />
        </View>
        <View style={styles.statusTexts}>
          <Text style={[styles.statusTitle, { color: textPrimary }]}>
            {isAvailable ? 'Çevrimiçi' : 'Çevrimdışı'}
          </Text>
          <Text style={[styles.statusSubtitle, { color: textSecondary }]} numberOfLines={1}>
            {isAvailable ? 'Yeni iş talepleri size ulaşıyor' : 'Yeni iş talebi almıyorsunuz'}
          </Text>
        </View>
        <Switch
          value={isAvailable}
          onValueChange={handleAvailabilityChange}
          disabled={isLoadingStatus}
        />
      </View>

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
      >
        {/* Hizmet şehri seçilmediyse uyarı —
            backend bu durumda hiçbir talep döndürmez ve FCM göndermez */}
        {needsServiceCity && (
          <FkInfoBanner
            type="warning"
            icon="map-marker-alert-outline"
            title="Hizmet şehri seçilmedi"
            message="Yeni iş bildirimleri için hizmet şehirlerinizi seçin. Aksi takdirde talepler size ulaşmaz."
            style={styles.banner}
          >
            <FkButton
              size="sm"
              onPress={() => navigation.navigate('ServiceCity')}
              style={styles.bannerButton}
              icon="map-marker-plus-outline"
            >
              Şehir Seç
            </FkButton>
          </FkInfoBanner>
        )}

        {pushGranted === false && (
          <FkInfoBanner
            type="warning"
            icon="bell-off-outline"
            title="Bildirimler kapalı"
            message="Yeni iş talepleri bildirim olarak sana ulaşmaz. Talepleri kaçırmamak için bildirimleri aç."
            style={styles.banner}
          >
            <FkButton
              size="sm"
              onPress={() => usePushPermissionStore.getState().enable()}
              style={styles.bannerButton}
              icon="bell-ring-outline"
            >
              {canPromptPush ? 'Bildirimleri Aç' : 'Ayarları Aç'}
            </FkButton>
          </FkInfoBanner>
        )}

        {hasBoard && <DriverBoard items={board.items} onPress={(item) => openBoardItem(item.id, 'board')} />}

        {hasButtons && (
          <View style={{ height: BUTTONS_HEIGHT }}>
            <BoardButtons buttons={board.buttons} onPress={(button) => openBoardItem(button.item_id, 'button')} />
          </View>
        )}

        <ActiveJobsBox
          jobs={homeJobs.jobs}
          status={homeJobs.status}
          onOpen={openJob}
          onRetry={() => homeJobs.refresh(true)}
        />

        <RequestSummary
          services={userServices}
          ready={homeJobs.status === 'ready'}
          onOpenOrders={openOrders}
          onOpenScheduled={() => navigation.navigate('ScheduledJobs')}
        />

        <EarningsSummaryCard
          today={homeEarnings.today}
          week={homeEarnings.week}
          status={homeEarnings.status}
          onPress={() => navigation.navigate('Tabs', { screen: 'EarningsTab' })}
        />
      </ScrollView>
    </View>
  );
}

// Static styles - sadece değişmeyen değerler
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // locationButton: {
  //   position: 'absolute',
  //   justifyContent: 'center',
  //   alignItems: 'center',
  //   ...shadows.lg,
  // },
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.sm + 4,
    paddingHorizontal: ds.md,
    paddingBottom: ds.sm + 4,
    borderBottomWidth: 1,
  },
  statusIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusTexts: {
    flex: 1,
  },
  statusTitle: {
    ...text.cardTitle,
  },
  statusSubtitle: {
    ...text.meta,
    marginTop: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingBottom: ds.md,
  },
  banner: {
    marginHorizontal: ds.md,
    marginTop: ds.sm + 4,
  },
  bannerButton: {
    alignSelf: 'flex-start',
    marginTop: ds.sm,
  },
});

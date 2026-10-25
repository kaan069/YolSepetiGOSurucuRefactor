// This is the main screen of the application for the driver.
// Bu, sürücü için uygulamanın ana ekranıdır.
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Switch, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import MapView, { Region } from 'react-native-maps';
import messaging from '@react-native-firebase/messaging';
import * as Location from 'expo-location';
import { useFocusEffect, useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useDriverStore } from '../store/driverStore';
import { useAuthStore } from '../store/authStore';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../hooks/useAppTheme';
import { RootStackParamList } from '../navigation';
import authAPI from '../api/auth';
import { logger } from '../utils/logger';
import { rememberPosition } from '../services/appLocationPing';
import { ensureLocationForOnline } from '../utils/locationPermission';
import { FkButton, FkInfoBanner } from '../components/fk';
import DriverBoard from '../components/home/DriverBoard';
import BoardButtons from '../components/home/BoardButtons';
import driverBoardAPI, { BoardClickSource } from '../api/driverBoard';
import { useDriverBoard, useDriverBoardStore } from '../store/useDriverBoardStore';
import { colors, radius, shadows, spacing as ds, text } from '../theme/design';

/** Ekran payları (%): harita kalan payı alır */
const BOARD_FLEX = 35;
const BUTTONS_FLEX = 15;

export default function HomeScreen() {
  // Get state and actions from global stores.
  // Global store'lardan state ve eylemleri al.
  const { isAvailable, currentLocation, updateOnlineStatus, loadOnlineStatus, isLoadingStatus } = useDriverStore();
  const { currentUser, setCurrentUser } = useAuthStore();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { screenBg, cardBg, textPrimary, textSecondary } = useAppTheme();
  const { spacing, tabBar, safeArea, moderateScale } = useResponsive();

  // MapView referansı
  const mapRef = useRef<MapView>(null);

  // State for the map's currently viewed region.
  // Haritanın mevcut olarak görüntülenen bölgesi için state.
  const [region, setRegion] = useState<Region | null>(null);

  // Hizmet şehirleri (service_cities) boş mu? Boşsa banner göster.
  // AsyncStorage'daki eski user objesi service_cities içermeyebilir; backend'den taze çekmeden
  // banner'ı gizlersek yanlış pozitif/negatif olur — useEffect aşağıda taze profil çeker.
  const needsServiceCity = !currentUser?.service_cities || currentUser.service_cities.length === 0;

  // Backend'den pano ve butonlar: ikisi de yoksa ekran eskisi gibi tam harita.
  // Oranlar: harita 50 / pano 35 / butonlar 15; olmayan bölümün payı haritaya kalır.
  const board = useDriverBoard();
  const hasBoard = board.items.length > 0;
  const hasButtons = board.buttons.length > 0;
  const isSplit = hasBoard || hasButtons;
  const mapFlex = 100 - (hasBoard ? BOARD_FLEX : 0) - (hasButtons ? BUTTONS_FLEX : 0);

  useFocusEffect(
    useCallback(() => {
      useDriverBoardStore.getState().refresh();
    }, []),
  );

  const openBoardItem = useCallback(
    (itemId: number, source: BoardClickSource) => {
      driverBoardAPI.trackClick(itemId, source);
      navigation.navigate('BoardItemDetail', { itemId });
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

  // Konumu bul - Haritayı kullanıcının konumuna götür
  const handleFindMyLocation = async () => {
    try {
      // Her zaman güncel konumu al
      const freshLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

      if (freshLocation) rememberPosition(freshLocation);
      if (freshLocation && mapRef.current) {
        const userRegion = {
          latitude: freshLocation.coords.latitude,
          longitude: freshLocation.coords.longitude,
          latitudeDelta: 0.01, // Yakın zoom
          longitudeDelta: 0.01,
        };

        mapRef.current.animateToRegion(userRegion, 1000);
      }
    } catch (error) {
      logger.error('location', 'HomeScreen.findMyLocation failure');

      // Hata durumunda store'daki konumu kullan
      if (currentLocation && mapRef.current) {
        const userRegion = {
          latitude: currentLocation.coords.latitude,
          longitude: currentLocation.coords.longitude,
          latitudeDelta: 0.01,
          longitudeDelta: 0.01,
        };
        mapRef.current.animateToRegion(userRegion, 1000);
      }
    }
  };


  // Auto-navigate to user location when HomeScreen mounts
  // HomeScreen yüklendiğinde otomatik olarak kullanıcı konumuna git
  useEffect(() => {
    const autoNavigateToLocation = async () => {
      try {
        // Konum iznini kontrol et
        const { status } = await Location.getForegroundPermissionsAsync();

        if (status === 'granted') {
          // Kısa bir gecikme ile konuma git (haritanın yüklenmesi için)
          setTimeout(() => {
            handleFindMyLocation();
          }, 500);
        }
      } catch (error) {
        logger.error('location', 'HomeScreen.autoNavigate failure');
      }
    };

    autoNavigateToLocation();
  }, []); // Sadece component mount olduğunda çalışır

  // Responsive styles - her render'da güncel değerlerle
  const dynamicStyles = {
    locationButton: {
      // Tam haritada tab bar'ın hemen üstünde; bölünmüş düzende harita alanının sağ altında
      bottom: isSplit ? ds.sm : tabBar.height + spacing.sm,
      right: spacing.md,
      width: moderateScale(52),
      height: moderateScale(52),
      borderRadius: moderateScale(26),
    },
    overlayContainer: {
      paddingTop: safeArea.top + ds.sm, // Status bar için
    },
  };

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <View style={[styles.mapArea, { flex: mapFlex }]}>
        <MapView
          ref={mapRef}
          style={StyleSheet.absoluteFill}
          region={region || undefined}
          showsUserLocation
          loadingEnabled
        />

        {/* Konumu Bul Butonu — müşteri uygulamasındaki beyaz yuvarlak harita kontrolü */}
        <TouchableOpacity
          style={[styles.locationButton, dynamicStyles.locationButton, { backgroundColor: cardBg }]}
          onPress={handleFindMyLocation}
          activeOpacity={0.8}
          accessibilityRole="button"
          accessibilityLabel="Konumumu bul"
        >
          <MaterialCommunityIcons name="crosshairs-gps" size={moderateScale(24)} color={colors.primary[500]} />
        </TouchableOpacity>

        {/* Sürücü durumu kartı ve uyarılar */}
        <View style={[styles.overlayContainer, dynamicStyles.overlayContainer]}>
          <View style={[styles.statusCard, { backgroundColor: cardBg }]}>
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
              <Text style={[styles.statusSubtitle, { color: textSecondary }]}>
                {isAvailable ? 'Yeni iş talepleri size ulaşıyor' : 'Yeni iş talebi almıyorsunuz'}
              </Text>
            </View>
            <Switch
              value={isAvailable}
              onValueChange={handleAvailabilityChange}
              disabled={isLoadingStatus}
            />
          </View>

          {/* Hizmet şehri seçilmediyse uyarı —
              backend bu durumda hiçbir talep döndürmez ve FCM göndermez */}
          {needsServiceCity && (
            <FkInfoBanner
              type="warning"
              icon="map-marker-alert-outline"
              title="Hizmet şehri seçilmedi"
              message="Yeni iş bildirimleri için hizmet şehirlerinizi seçin. Aksi takdirde talepler size ulaşmaz."
              style={styles.serviceCityBanner}
            >
              <FkButton
                size="sm"
                onPress={() => navigation.navigate('ServiceCity')}
                style={styles.serviceCityButton}
                icon="map-marker-plus-outline"
              >
                Şehir Seç
              </FkButton>
            </FkInfoBanner>
          )}
        </View>
      </View>

      {hasBoard && (
        <View style={{ flex: BOARD_FLEX }}>
          <DriverBoard items={board.items} onPress={(item) => openBoardItem(item.id, 'board')} />
        </View>
      )}

      {hasButtons && (
        <View style={{ flex: BUTTONS_FLEX }}>
          <BoardButtons buttons={board.buttons} onPress={(button) => openBoardItem(button.item_id, 'button')} />
        </View>
      )}
    </View>
  );
}

// Static styles - sadece değişmeyen değerler
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  mapArea: {
    overflow: 'hidden',
  },
  locationButton: {
    position: 'absolute',
    justifyContent: 'center',
    alignItems: 'center',
    ...shadows.lg,
  },
  overlayContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingHorizontal: ds.md,
    gap: ds.sm + 4,
  },
  statusCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: radius.lg,
    padding: ds.sm + 4,
    gap: ds.sm + 4,
    ...shadows.md,
  },
  statusIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusDot: {
    width: 14,
    height: 14,
    borderRadius: 7,
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
  serviceCityBanner: {
    ...shadows.sm,
  },
  serviceCityButton: {
    alignSelf: 'flex-start',
    marginTop: ds.sm,
  },
});

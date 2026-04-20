// This is the main screen of the application for the driver.
// Bu, sürücü için uygulamanın ana ekranıdır.
import React, { useEffect, useState, useRef } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Switch, Text, Card, useTheme, Button, IconButton } from 'react-native-paper';
import MapView, { Region } from 'react-native-maps';
import messaging from '@react-native-firebase/messaging';
import * as Location from 'expo-location';
import NewJobNotification from '../components/NewJobNotification';
import { useDriverStore } from '../store/driverStore';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../hooks/useAppTheme';
import { logger } from '../utils/logger';


export default function HomeScreen() {
  // Get state and actions from global stores.
  // Global store'lardan state ve eylemleri al.
  const { isAvailable, currentLocation, updateOnlineStatus, loadOnlineStatus, isLoadingStatus } = useDriverStore();
  const theme = useTheme();
  const { spacing, tabBar, safeArea, moderateScale } = useResponsive();

  // MapView referansı
  const mapRef = useRef<MapView>(null);

  // State for the map's currently viewed region.
  // Haritanın mevcut olarak görüntülenen bölgesi için state.
  const [region, setRegion] = useState<Region | null>(null);
  // State to control the visibility of the new job notification banner.
  // Yeni iş bildirim banner'ının görünürlüğünü kontrol eden state.
  const [newJobVisible, setNewJobVisible] = useState(false);

  // Online status'u yükle
  useEffect(() => {
    loadOnlineStatus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Online/offline durumunu değiştir
  const handleAvailabilityChange = async (value: boolean) => {
    await updateOnlineStatus(value);
  };

  // Konumu bul - Haritayı kullanıcının konumuna götür
  const handleFindMyLocation = async () => {
    try {
      // Her zaman güncel konumu al
      const freshLocation = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.High,
      });

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
    map: {
      ...StyleSheet.absoluteFillObject,
      bottom: 0, // Harita tam ekranı kaplasın, tab bar üstte görünsün
    },
    locationButton: {
      position: 'absolute' as const,
      bottom: tabBar.height + spacing.sm, // Tab bar'ın hemen üstünde, sağ alt köşede
      right: spacing.sm,
      width: moderateScale(56),
      height: moderateScale(56),
      borderRadius: moderateScale(28),
      backgroundColor: '#26a69a',
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      elevation: 8,
      shadowColor: '#000',
      shadowOffset: { width: 0, height: 4 },
      shadowOpacity: 0.3,
      shadowRadius: 8,
    },
    overlayContainer: {
      position: 'absolute' as const,
      top: 0,
      left: 0,
      right: 0,
      paddingTop: safeArea.top, // Status bar için
    },
    headerCard: {
      margin: spacing.md,
      marginTop: spacing.sm, // SafeArea zaten paddingTop ile hallettik
      backgroundColor: 'transparent',
      elevation: 0,
    },
    headerContent: {
      flexDirection: 'row' as const,
      justifyContent: 'flex-end' as const,
      alignItems: 'center' as const,
      backgroundColor: 'rgba(38, 166, 154, 0.25)',
      borderRadius: moderateScale(12),
      padding: spacing.sm,
    },
    debugCard: {
      backgroundColor: 'rgba(255, 152, 0, 0.9)',
      borderRadius: moderateScale(12),
      padding: spacing.sm,
    },
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <MapView
        ref={mapRef}
        style={dynamicStyles.map}
        region={region || undefined}
        showsUserLocation
        loadingEnabled
      />

      {/* Konumu Bul Butonu */}
      <TouchableOpacity
        style={dynamicStyles.locationButton}
        onPress={handleFindMyLocation}
        activeOpacity={0.7}
      >
        <IconButton
          icon="crosshairs-gps"
          iconColor="#fff"
          size={moderateScale(24)}
          style={{ margin: 0 }}
        />
      </TouchableOpacity>

      {/* Overlay UI for driver status and stats. */}
      {/* Sürücü durumu ve istatistikleri için arayüz. */}
      <View style={dynamicStyles.overlayContainer}>
        <Card style={dynamicStyles.headerCard}>
          <Card.Content style={dynamicStyles.headerContent}>
            <View style={styles.availabilityContainer}>
              <Text variant="titleMedium" style={styles.headerText}>
                {isAvailable ? 'Çevrimiçi' : 'Çevrimdışı'}
              </Text>
              <Switch
                value={isAvailable}
                onValueChange={handleAvailabilityChange}
                disabled={isLoadingStatus}
              />
            </View>
          </Card.Content>
        </Card>

        {/* Firebase Test Button - for debugging */}
        
      </View>

      {/* Notification banner for new jobs. */}
      {/* Yeni işler için bildirim banner'ı. */}
      <NewJobNotification visible={newJobVisible} onDismiss={() => setNewJobVisible(false)} />
    </SafeAreaView>
  );
}

// Static styles - sadece değişmeyen değerler
const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  headerText: {
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  availabilityContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
});

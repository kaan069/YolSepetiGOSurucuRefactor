/**
 * BackgroundPermissionGate Component
 *
 * Arka plan konum izni ve Android pil optimizasyonunu kontrol eder.
 * İzinler verilmemişse blocking modal gösterir - kullanıcı uygulamayı kullanamaz.
 * REQUIRE_BACKGROUND_RUNNING_PERMISSION flag'i ile açılıp kapatılabilir.
 */
import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  Linking,
  Platform,
  AppState,
} from 'react-native';
import { Text } from 'react-native-paper';
import * as Location from 'expo-location';
import * as IntentLauncher from 'expo-intent-launcher';
import { requestLocationPermissions } from '../utils/locationPermission';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/authStore';
import { REQUIRE_BACKGROUND_RUNNING_PERMISSION, REQUIRE_BATTERY_OPTIMIZATION_CHECK } from '../constants/appConfig';
import { isIgnoringBatteryOptimizations } from '../../modules/battery-optimization-check';

type GateStatus =
  | 'checking'
  | 'granted'
  | 'needs_background_location'
  | 'needs_battery_optimization';

export default function BackgroundPermissionGate() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [status, setStatus] = useState<GateStatus>('checking');
  const hasRequestedBgPermission = useRef(false);

  const checkPermissions = async () => {
    if (!REQUIRE_BACKGROUND_RUNNING_PERMISSION) {
      setStatus('granted');
      return;
    }

    try {
      // Foreground izni yoksa bu gate'i gösterme - LocationPermissionAlert hallediyordur
      const { status: fgStatus } = await Location.getForegroundPermissionsAsync();
      if (fgStatus !== 'granted') {
        setStatus('granted');
        return;
      }

      // 1. Arka plan konum izni kontrol et
      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      if (bgStatus !== 'granted') {
        setStatus('needs_background_location');
        return;
      }

      // 2. Android pil optimizasyonu kontrol et (REQUIRE_BATTERY_OPTIMIZATION_CHECK flag'i ile açılıp kapatılabilir)
      if (REQUIRE_BATTERY_OPTIMIZATION_CHECK && Platform.OS === 'android') {
        const batteryOk = isIgnoringBatteryOptimizations();
        if (!batteryOk) {
          setStatus('needs_battery_optimization');
          return;
        }
      }

      // Tüm izinler OK
      setStatus('granted');
    } catch {
      // Hata durumunda engellemiyoruz
      setStatus('granted');
    }
  };

  useEffect(() => {
    if (!isAuthenticated) {
      setStatus('checking');
      hasRequestedBgPermission.current = false;
      return;
    }

    checkPermissions();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // Arka plan konum izni iste
  const handleRequestBackgroundLocation = async () => {
    try {
      if (!hasRequestedBgPermission.current) {
        hasRequestedBgPermission.current = true;
        const granted = await requestLocationPermissions();
        if (granted) {
          checkPermissions();
          return;
        }
      }
      // Sistem dialogu reddedildiyse veya daha önce istendiyse ayarlara yönlendir
      await Linking.openSettings();
    } catch {
      await Linking.openSettings();
    }
  };

  // Pil optimizasyonunu kapat (Android)
  const handleRequestBatteryOptimization = async () => {
    try {
      await IntentLauncher.startActivityAsync(
        IntentLauncher.ActivityAction.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS,
        { data: `package:com.devkaans.yolpaketi` }
      );
      // Dialog kapatıldıktan sonra tekrar kontrol et
      checkPermissions();
    } catch {
      // Fallback: genel pil optimizasyonu ayarlarını aç
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.IGNORE_BATTERY_OPTIMIZATION_SETTINGS
        );
      } catch {
        await Linking.openSettings();
      }
    }
  };

  // Modal'ı gösterme koşulları
  const showModal =
    isAuthenticated &&
    (status === 'needs_background_location' || status === 'needs_battery_optimization');

  if (!showModal) return null;

  const isBackgroundLocation = status === 'needs_background_location';

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* Ikon */}
          <View style={[styles.iconContainer, isBackgroundLocation ? styles.iconBgBlue : styles.iconBgAmber]}>
            <MaterialCommunityIcons
              name={isBackgroundLocation ? 'map-marker-alert' : 'battery-alert-variant-outline'}
              size={48}
              color={isBackgroundLocation ? '#2563eb' : '#d97706'}
            />
          </View>

          {/* Baslik */}
          <Text style={styles.title}>
            {isBackgroundLocation
              ? 'Arka Plan Konum İzni Gerekli'
              : 'Pil Optimizasyonu Kapatılmalı'}
          </Text>

          {/* Aciklama */}
          <Text style={styles.description}>
            {isBackgroundLocation
              ? 'Bu konum ve takip bilgisi iptal olan taleplerde ücret iadesi için gereklidir. Konum izni vermediğiniz durumda ücret iadesi alamayabilirsiniz.\n\nAksi takdirde uygulamayı kullanamazsınız.'
              : 'Uygulamanın arka planda düzgün çalışması ve konum takibinin kesintisiz devam etmesi için pil optimizasyonunu kapatmanız gerekmektedir.\n\nBu konum ve takip bilgisi iptal olan taleplerde ücret iadesi için gereklidir. Konum izni vermediğiniz durumda ücret iadesi alamayabilirsiniz.'}
          </Text>

          {/* Ayarlara Git Butonu */}
          <TouchableOpacity
            style={[styles.settingsButton, isBackgroundLocation ? styles.buttonBlue : styles.buttonAmber]}
            onPress={isBackgroundLocation ? handleRequestBackgroundLocation : handleRequestBatteryOptimization}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cog" size={20} color="#fff" />
            <Text style={styles.settingsButtonText}>
              {isBackgroundLocation ? 'Konum İznini Ayarla' : 'Pil Optimizasyonunu Kapat'}
            </Text>
          </TouchableOpacity>

          {/* İpuçları */}
          <View style={styles.tipsContainer}>
            {isBackgroundLocation ? (
              Platform.OS === 'android' ? (
                <>
                  <View style={styles.tipRow}>
                    <MaterialCommunityIcons name="cellphone-cog" size={16} color="#9ca3af" />
                    <Text style={styles.tipText}>Uygulama ayarlarına gidin</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <MaterialCommunityIcons name="map-marker-check" size={16} color="#9ca3af" />
                    <Text style={styles.tipText}>İzinler {'>'} Konum {'>'} Her zaman izin ver</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <MaterialCommunityIcons name="arrow-left" size={16} color="#9ca3af" />
                    <Text style={styles.tipText}>Uygulamaya geri dönün</Text>
                  </View>
                </>
              ) : (
                <>
                  <View style={styles.tipRow}>
                    <MaterialCommunityIcons name="cellphone-cog" size={16} color="#9ca3af" />
                    <Text style={styles.tipText}>Ayarlar {'>'} Yol SepetiGo Sürücü</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <MaterialCommunityIcons name="map-marker-check" size={16} color="#9ca3af" />
                    <Text style={styles.tipText}>Konum {'>'} Her Zaman</Text>
                  </View>
                  <View style={styles.tipRow}>
                    <MaterialCommunityIcons name="arrow-left" size={16} color="#9ca3af" />
                    <Text style={styles.tipText}>Uygulamaya geri dönün</Text>
                  </View>
                </>
              )
            ) : (
              <>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="cellphone-cog" size={16} color="#9ca3af" />
                  <Text style={styles.tipText}>Açılan pencerede "İzin Ver" seçin</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="battery-check" size={16} color="#9ca3af" />
                  <Text style={styles.tipText}>Bu, uygulamanın arka planda çalışmasını sağlar</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="arrow-left" size={16} color="#9ca3af" />
                  <Text style={styles.tipText}>Uygulamaya geri dönün</Text>
                </View>
              </>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  iconBgBlue: {
    backgroundColor: '#eff6ff',
  },
  iconBgAmber: {
    backgroundColor: '#fffbeb',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  settingsButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    marginBottom: 20,
  },
  buttonBlue: {
    backgroundColor: '#2563eb',
  },
  buttonAmber: {
    backgroundColor: '#d97706',
  },
  settingsButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    flex: 1,
    fontSize: 12,
    color: '#9ca3af',
  },
});

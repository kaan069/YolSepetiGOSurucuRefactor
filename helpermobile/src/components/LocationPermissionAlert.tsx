/**
 * LocationPermissionAlert Component
 *
 * Konum izni ve GPS durumunu kontrol eder.
 * Konum kapalı veya izin reddedilmişse blocking modal gösterir.
 * Ayarlara yönlendirme butonu ile kullanıcıyı yönlendirir.
 */
import React, { useState, useEffect } from 'react';
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
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/authStore';

type PermissionStatus = 'checking' | 'granted' | 'denied' | 'undetermined';

export default function LocationPermissionAlert() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const [permissionStatus, setPermissionStatus] = useState<PermissionStatus>('checking');
  const [serviceEnabled, setServiceEnabled] = useState(true);

  const checkLocationStatus = async () => {
    try {
      const serviceOk = await Location.hasServicesEnabledAsync();
      setServiceEnabled(serviceOk);

      const { status } = await Location.getForegroundPermissionsAsync();
      if (status === 'granted') {
        setPermissionStatus('granted');
      } else if (status === 'denied') {
        setPermissionStatus('denied');
      } else {
        setPermissionStatus('undetermined');
      }
    } catch {
      // Hata durumunda engellemiyoruz
      setPermissionStatus('granted');
      setServiceEnabled(true);
    }
  };

  // İlk kontrol + AppState listener
  useEffect(() => {
    if (!isAuthenticated) return;

    checkLocationStatus();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (nextState === 'active') {
        checkLocationStatus();
      }
    });

    return () => subscription.remove();
  }, [isAuthenticated]);

  // Ayarlara yönlendir
  const openSettings = async () => {
    try {
      if (!serviceEnabled) {
        // GPS kapalı → konum ayarlarını aç
        if (Platform.OS === 'android') {
          await IntentLauncher.startActivityAsync(
            IntentLauncher.ActivityAction.LOCATION_SOURCE_SETTINGS
          );
        } else {
          await Linking.openSettings();
        }
      } else {
        // İzin reddedilmiş → uygulama ayarlarını aç
        await Linking.openSettings();
      }
    } catch {
      await Linking.openSettings();
    }
  };

  // Modal'ı gösterme koşulları
  const showServiceDisabled = isAuthenticated && !serviceEnabled;
  const showPermissionDenied = isAuthenticated && serviceEnabled && permissionStatus === 'denied';
  const showModal = showServiceDisabled || showPermissionDenied;

  if (!showModal) return null;

  // GPS kapalı mı yoksa izin mi reddedildi?
  const isServiceIssue = showServiceDisabled;

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
          <View style={[styles.iconContainer, isServiceIssue ? styles.iconBgOrange : styles.iconBgRed]}>
            <MaterialCommunityIcons
              name={isServiceIssue ? 'crosshairs-off' : 'map-marker-off'}
              size={48}
              color={isServiceIssue ? '#f97316' : '#ef4444'}
            />
          </View>

          {/* Başlık */}
          <Text style={styles.title}>
            {isServiceIssue ? 'Konum Servisi Kapalı' : 'Konum İzni Gerekli'}
          </Text>

          {/* Açıklama */}
          <Text style={styles.description}>
            Yakınınızdaki talepleri ve işleri görüp teklif vermek istiyorsanız konumunuzu açın.{'\n\n'}
            Aksi takdirde uygulamayı kullanamazsınız.
          </Text>

          {/* Ayarlara Git Butonu */}
          <TouchableOpacity
            style={[styles.settingsButton, isServiceIssue ? styles.buttonOrange : styles.buttonRed]}
            onPress={openSettings}
            activeOpacity={0.8}
          >
            <MaterialCommunityIcons name="cog" size={20} color="#fff" />
            <Text style={styles.settingsButtonText}>
              {isServiceIssue ? 'Konum Ayarlarını Aç' : 'Ayarlara Git'}
            </Text>
          </TouchableOpacity>

          {/* İpuçları */}
          <View style={styles.tipsContainer}>
            {isServiceIssue ? (
              <>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="cellphone-cog" size={16} color="#9ca3af" />
                  <Text style={styles.tipText}>Ayarlar {'>'} Konum yolunu takip edin</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="toggle-switch" size={16} color="#9ca3af" />
                  <Text style={styles.tipText}>Konum servisini açın</Text>
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
                  <Text style={styles.tipText}>Uygulama ayarlarına gidin</Text>
                </View>
                <View style={styles.tipRow}>
                  <MaterialCommunityIcons name="map-marker-check" size={16} color="#9ca3af" />
                  <Text style={styles.tipText}>Konum iznini "Her Zaman" veya "Kullanırken" olarak ayarlayın</Text>
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
  iconBgRed: {
    backgroundColor: '#fef2f2',
  },
  iconBgOrange: {
    backgroundColor: '#fff7ed',
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
  buttonRed: {
    backgroundColor: '#ef4444',
  },
  buttonOrange: {
    backgroundColor: '#f97316',
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

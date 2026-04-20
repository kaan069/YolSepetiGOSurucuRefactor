/**
 * AccountReadinessGate Component
 *
 * Hesap onaylanana kadar uygulamayı engelleyen blocking modal.
 * 4 kriter kontrol edilir: ehliyet onayı, şirket bilgileri, ödeme bilgileri, araç onayı.
 * REQUIRE_ACCOUNT_READINESS flag'i ile açılıp kapatılabilir.
 */
import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ScrollView,
  AppState,
  ActivityIndicator,
} from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../store/authStore';
import { REQUIRE_ACCOUNT_READINESS } from '../constants/appConfig';
import { authAPI } from '../api';
import { AccountReadinessResponse } from '../api/types';
import { logger } from '../utils/logger';

interface Props {
  navigationRef: React.RefObject<any>;
}

export default function AccountReadinessGate({ navigationRef }: Props) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isEmployee = (currentUser as any)?.provider_type === 'employee';

  const [isReady, setIsReady] = useState<boolean | null>(null);
  const [readinessData, setReadinessData] = useState<AccountReadinessResponse | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [isNavigatingToFix, setIsNavigatingToFix] = useState(false);
  const appStateRef = useRef(AppState.currentState);

  const checkReadiness = useCallback(async () => {
    if (!isAuthenticated || isEmployee || !REQUIRE_ACCOUNT_READINESS) return;

    setIsChecking(true);
    try {
      const response = await authAPI.checkAccountReadiness();
      setReadinessData(response);
      setIsReady(response.is_ready);
      if (response.is_ready) {
        setIsNavigatingToFix(false);
      }
    } catch (error: any) {
      logger.error('auth', 'AccountReadinessGate.check failure', { status: error?.response?.status });
      // Hata durumunda kullanıcıyı engelleme (fail-open)
      setIsReady(true);
    } finally {
      setIsChecking(false);
    }
  }, [isAuthenticated, isEmployee]);

  // İlk kontrol + AppState listener
  useEffect(() => {
    if (!isAuthenticated || isEmployee || !REQUIRE_ACCOUNT_READINESS) {
      setIsReady(null);
      setReadinessData(null);
      setIsNavigatingToFix(false);
      return;
    }

    checkReadiness();

    const subscription = AppState.addEventListener('change', (nextState) => {
      if (appStateRef.current.match(/inactive|background/) && nextState === 'active') {
        if (isNavigatingToFix) {
          setIsNavigatingToFix(false);
        }
        checkReadiness();
      }
      appStateRef.current = nextState;
    });

    return () => subscription.remove();
  }, [isAuthenticated, isEmployee]);

  // Gate gösterilirken periyodik kontrol (30 saniye)
  useEffect(() => {
    if (isReady !== false) return;

    const interval = setInterval(() => {
      checkReadiness();
    }, 30000);

    return () => clearInterval(interval);
  }, [isReady, checkReadiness]);

  // Tamamla butonuna basıldığında ilgili ekrana yönlendir
  const handleNavigateToFix = (screen: string) => {
    setIsNavigatingToFix(true);
    setTimeout(() => {
      navigationRef.current?.navigate(screen);
    }, 100);
  };

  // Modal görünürlük koşulları
  const showModal =
    isAuthenticated &&
    !isEmployee &&
    REQUIRE_ACCOUNT_READINESS &&
    isReady === false &&
    !isNavigatingToFix;

  if (!showModal) return null;

  // Kriter durumunu belirle
  const getStatusIcon = (isComplete: boolean, status?: string | null) => {
    if (isComplete) {
      return { name: 'check-circle', color: '#4CAF50' };
    }
    if (status === 'pending') {
      return { name: 'clock-outline', color: '#ff9800' };
    }
    return { name: 'close-circle', color: '#f44336' };
  };

  const getLicenseStatusText = () => {
    if (!readinessData) return '';
    if (readinessData.license_approved) return 'Onaylandı';
    if (readinessData.license_status === 'pending') return 'Onay bekleniyor';
    if (readinessData.license_status === 'rejected') {
      return readinessData.license_rejection_reason
        ? `Reddedildi: ${readinessData.license_rejection_reason}`
        : 'Reddedildi';
    }
    return 'Eksik';
  };

  const getCompanyStatusText = () => {
    if (!readinessData) return '';
    if (readinessData.company_info_complete) return 'Tamamlandı';
    const missing = [];
    if (!readinessData.company_info_details?.company_name) missing.push('Şirket adı');
    if (!readinessData.company_info_details?.tax_number) missing.push('Vergi numarası');
    return `Eksik: ${missing.join(', ')}`;
  };

  const getVehicleStatusText = () => {
    if (!readinessData) return '';
    if (readinessData.has_approved_vehicle) return 'Onaylı araç mevcut';
    if (readinessData.vehicles && readinessData.vehicles.length > 0) {
      const pendingCount = readinessData.vehicles.filter(v => v.document_status === 'pending').length;
      if (pendingCount > 0) return `${pendingCount} araç onay bekliyor`;
      return 'Araç belgesi onaylanmamış';
    }
    return 'Araç kaydı yok';
  };

  const licenseIcon = getStatusIcon(
    readinessData?.license_approved ?? false,
    readinessData?.license_status
  );
  const companyIcon = getStatusIcon(readinessData?.company_info_complete ?? false);
  const paymentIcon = getStatusIcon(readinessData?.payment_info_complete ?? false);
  const vehicleIcon = getStatusIcon(
    readinessData?.has_approved_vehicle ?? false,
    readinessData?.vehicles?.some(v => v.document_status === 'pending') ? 'pending' : undefined
  );

  return (
    <Modal visible={true} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.overlay}>
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.gateContainer}>
            {/* İkon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="shield-check-outline" size={48} color="#2563eb" />
            </View>

            {/* Başlık */}
            <Text style={styles.title}>Hesap Onayı Gerekli</Text>
            <Text style={styles.description}>
              Uygulamayı kullanabilmek için aşağıdaki gereksinimleri tamamlayın.
            </Text>

            {/* Kriter Satırları */}
            <View style={styles.criteriaContainer}>
              {/* 1. Ehliyet & Vergi Levhası */}
              <View style={styles.criteriaRow}>
                <MaterialCommunityIcons name={licenseIcon.name} size={24} color={licenseIcon.color} />
                <View style={styles.criteriaTextContainer}>
                  <Text style={styles.criteriaTitle}>Ehliyet & Vergi Levhası</Text>
                  <Text style={[styles.criteriaStatus, { color: licenseIcon.color }]}>
                    {getLicenseStatusText()}
                  </Text>
                </View>
                {!readinessData?.license_approved && readinessData?.license_status !== 'pending' && (
                  <TouchableOpacity
                    style={styles.fixButton}
                    onPress={() => handleNavigateToFix('DocumentsScreen')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fixButtonText}>Tamamla</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 2. Şirket Bilgileri */}
              <View style={styles.criteriaRow}>
                <MaterialCommunityIcons name={companyIcon.name} size={24} color={companyIcon.color} />
                <View style={styles.criteriaTextContainer}>
                  <Text style={styles.criteriaTitle}>Şirket Bilgileri</Text>
                  <Text style={[styles.criteriaStatus, { color: companyIcon.color }]}>
                    {getCompanyStatusText()}
                  </Text>
                </View>
                {!readinessData?.company_info_complete && (
                  <TouchableOpacity
                    style={styles.fixButton}
                    onPress={() => handleNavigateToFix('CompanyInfo')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fixButtonText}>Tamamla</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 3. Ödeme Bilgileri (IBAN) */}
              <View style={styles.criteriaRow}>
                <MaterialCommunityIcons name={paymentIcon.name} size={24} color={paymentIcon.color} />
                <View style={styles.criteriaTextContainer}>
                  <Text style={styles.criteriaTitle}>Ödeme Bilgileri (IBAN)</Text>
                  <Text style={[styles.criteriaStatus, { color: paymentIcon.color }]}>
                    {readinessData?.payment_info_complete ? 'Tamamlandı' : 'Eksik'}
                  </Text>
                </View>
                {!readinessData?.payment_info_complete && (
                  <TouchableOpacity
                    style={styles.fixButton}
                    onPress={() => handleNavigateToFix('CompanyInfo')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fixButtonText}>Tamamla</Text>
                  </TouchableOpacity>
                )}
              </View>

              {/* 4. Araç Belgesi Onayı */}
              <View style={styles.criteriaRow}>
                <MaterialCommunityIcons name={vehicleIcon.name} size={24} color={vehicleIcon.color} />
                <View style={styles.criteriaTextContainer}>
                  <Text style={styles.criteriaTitle}>Araç Belgesi Onayı</Text>
                  <Text style={[styles.criteriaStatus, { color: vehicleIcon.color }]}>
                    {getVehicleStatusText()}
                  </Text>
                </View>
                {!readinessData?.has_approved_vehicle &&
                  !(readinessData?.vehicles?.some(v => v.document_status === 'pending')) && (
                  <TouchableOpacity
                    style={styles.fixButton}
                    onPress={() => handleNavigateToFix('VehicleAndServiceManagement')}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.fixButtonText}>Tamamla</Text>
                  </TouchableOpacity>
                )}
              </View>
            </View>

            {/* Yenile Butonu */}
            <TouchableOpacity
              style={styles.refreshButton}
              onPress={checkReadiness}
              activeOpacity={0.8}
              disabled={isChecking}
            >
              {isChecking ? (
                <ActivityIndicator size="small" color="#fff" />
              ) : (
                <MaterialCommunityIcons name="refresh" size={20} color="#fff" />
              )}
              <Text style={styles.refreshButtonText}>
                {isChecking ? 'Kontrol ediliyor...' : 'Yenile'}
              </Text>
            </TouchableOpacity>

            {/* Bilgilendirme */}
            <View style={styles.infoContainer}>
              <MaterialCommunityIcons name="information-outline" size={16} color="#9ca3af" />
              <Text style={styles.infoText}>
                Tüm belgeleriniz onaylandığında size SMS ile bildirim gönderilecektir.
              </Text>
            </View>
          </View>
        </ScrollView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
  },
  scrollContent: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 24,
  },
  gateContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 380,
    alignSelf: 'center',
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
    backgroundColor: '#eff6ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
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
  criteriaContainer: {
    width: '100%',
    gap: 12,
    marginBottom: 20,
  },
  criteriaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 10,
  },
  criteriaTextContainer: {
    flex: 1,
  },
  criteriaTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1f2937',
  },
  criteriaStatus: {
    fontSize: 12,
    marginTop: 2,
  },
  fixButton: {
    backgroundColor: '#2563eb',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  fixButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#fff',
  },
  refreshButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#2563eb',
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderRadius: 12,
    gap: 8,
    width: '100%',
    marginBottom: 16,
  },
  refreshButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
  infoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
  },
  infoText: {
    flex: 1,
    fontSize: 11,
    color: '#9ca3af',
    lineHeight: 16,
  },
});

// Transfer teklif ekrani
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, vehiclesAPI, documentsAPI, TransferRequest, TransferListItem } from '../../api';
import { ProviderType } from '../../api/types';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useDevOverrideStore } from '../../store/useDevOverrideStore';
import { validateOfferPrice } from '../../utils/offerValidation';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { VehicleSelector, EmployeeSelector } from '../../components/common';
import PhotosSection from '../../components/PhotosSection';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';
import PriceOfferSection from '../../components/offer/PriceOfferSection';
import { InfoRow, JobLocationCard, JobSection, JobScheduleCard } from '../../components/job';
import { FkButton, FkEmptyState, FkInfoBanner, FkLoadingOverlay, FkPill, FkStickyFooter } from '../../components/fk';
import { colors, spacing } from '../../theme/design';
import { useAgencyAssignment } from '../../hooks/useAgencyAssignment';
import AgencyAssignmentBanner from '../../components/AgencyAssignmentBanner';
import AgencyPaidFooter from '../../components/AgencyPaidFooter';
import { getScheduleInfo } from '../../utils/schedule';
import { transferTypeLabel, transferVehicleLabel } from '../../constants/backendLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferOffer'>;

// Mesafe hesaplama (Haversine formula)
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

export default function TransferOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();
  const minOfferOverride = useDevOverrideStore((s) => s.minOfferOverride);
  const { isDarkMode, appColors, cardBg, screenBg } = useAppTheme();

  // State
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [transferRequest, setTransferRequest] = useState<TransferRequest | null>(null);
  // Acente ataması: geri sayım, Reddet, süre dolunca kilit; acente ödemeli işte sabit ücretle Kabul / Reddet
  const agency = useAgencyAssignment(Number(orderId), transferRequest);
  const [loading, setLoading] = useState(false);

  // Arac secimi
  const [transferVehicles, setTransferVehicles] = useState<TransferListItem[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Fiyat teklifi (manuel giris)
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [acceptingJob, setAcceptingJob] = useState(false);

  // Calisan secimi (sirket tipi saglayicilar icin)
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // Talep detayini getir
  useEffect(() => {
    const fetchTransferRequest = async () => {
      try {
        setLoading(true);
        const request = await requestsAPI.getTransferRequestDetail(parseInt(orderId));
        setTransferRequest(request);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Talep detayları yüklenemedi';
        showNotification('error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTransferRequest();
  }, [orderId]);

  // Transfer arac listesini getir - talep tipine gore filtrele
  useEffect(() => {
    const fetchTransferVehicles = async () => {
      try {
        const vehicles = await vehiclesAPI.getMyTransferVehicles();

        // Talep tipine uygun araclari filtrele (vip talep -> vip araclar, organization talep -> organization araclar)
        const requestTransferType = transferRequest?.transfer_type;
        const filteredVehicles = requestTransferType
          ? vehicles.filter((v: any) => v.transfer_type === requestTransferType)
          : vehicles;

        setTransferVehicles(filteredVehicles as any);

        // Tek arac varsa otomatik sec
        if (filteredVehicles.length === 1) {
          setSelectedVehicleId(filteredVehicles[0].id);
        }

        if (filteredVehicles.length === 0) {
          const typeLabel = requestTransferType === 'vip' ? 'VIP' : 'Organizasyon';
          showNotification('warning', `Kayıtlı ${typeLabel} transfer aracınız bulunamadı. Lütfen önce araç ekleyin.`, 6000);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Araç listesi yüklenemedi';
        showNotification('error', errorMessage);
      }
    };
    if (transferRequest) {
      fetchTransferVehicles();
    }
  }, [transferRequest]);

  // Konum al
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const granted = await ensureForegroundPermission();
        if (!granted) return;

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        logger.error('orders', 'Konum alinamadi');
      }
    };
    getCurrentLocation();
  }, []);

  // Mesafe hesapla
  useEffect(() => {
    if (currentLocation && transferRequest) {
      const lat = parseFloat(transferRequest.pickup_latitude);
      const lng = parseFloat(transferRequest.pickup_longitude);
      setDistance(calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng));
    }
  }, [transferRequest, currentLocation]);

  // Saglayici tipini yukle
  useEffect(() => {
    AsyncStorage.getItem('user').then((userStr) => {
      if (userStr) {
        try {
          const user = JSON.parse(userStr);
          setProviderTypeState(user.provider_type || null);
          if (user.provider_type === 'company') {
            fetchEmployees().catch(() => {});
          }
        } catch {}
      }
    });
  }, []);

  // Arac secimi
  const handleSelectVehicle = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
  };

  // Teklif gonder
  const handleAccept = async () => {
    if (agency.expired) {
      Alert.alert('Süre Doldu', 'Atamanın yanıt süresi doldu, bu iş için artık teklif veremezsiniz.');
      return;
    }
    // Profil kontrolu
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();
      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `\u2022 ${field.message}`)
          .join('\n');

        Alert.alert(
          'Profil Tamamlanmamış',
          `İş kabul edebilmek için profilinizi tamamlamanız gerekiyor.\n\nEksik bilgiler:\n${missingMessages}`,
          [
            { text: 'Tamam', style: 'cancel' },
            { text: 'Profili Tamamla', onPress: () => navigation.navigate('MissingDocuments') }
          ]
        );
        return;
      }
    } catch (error) {
      logger.error('orders', 'Profil kontrolu hatasi');
    }

    if (!selectedVehicleId) {
      showNotification('warning', 'Lütfen bir araç seçin');
      return;
    }
    // Acente ödemeli iş: fiyat sabit
    if (agency.paid) {
      agency.confirmAccept(proceedWithAccept);
      return;
    }
    const priceCheck = validateOfferPrice(offerPrice, minOfferOverride);
    if (!priceCheck.valid) {
      showNotification('warning', priceCheck.error!);
      return;
    }

    proceedWithAccept();
  };

  const proceedWithAccept = async () => {
    try {
      setAcceptingJob(true);

      if (!transferRequest?.trackingToken) {
        throw new Error('Tracking token bulunamadi');
      }

      const response = await requestsAPI.submitTransferOffer(
        transferRequest.trackingToken,
        {
          // Acente ödemeli işte alan zorunlu ama backend yok sayar; ücret agreed_price'tır
          proposed_price: agency.paid ? Number(agency.agreedPrice) : parseFloat(offerPrice),
          vehicle_id: selectedVehicleId!,
          employee_id: selectedEmployeeId || undefined,
        }
      );
      agency.markOffered();

      // Acente ödemeli iş hemen başlar: müşteri onayı ve komisyon ödemesi yok
      if (agency.paid) {
        showNotification('success', 'İş kabul edildi.');
        agency.openAcceptedJob('transfer');
        return;
      }

      const totalPrice = response.driver_earnings || response.estimated_price || offerPrice;
      showNotification('success', `Teklifiniz gönderildi!\n\nTahmini Kazanç: ${totalPrice} TL`, 6000);

      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: { serviceFilter: 'transfer', filter: 'awaiting_approval', timestamp: Date.now() }
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      if (agency.handleOfferError(error)) return;
      const backendError = error?.response?.data?.error || error?.response?.data?.message || '';

      if (backendError.toLowerCase().includes('sirket bilgi')) {
        Alert.alert('Şirket Bilgisi Eksik', backendError, [
          { text: 'İptal', style: 'cancel' },
          { text: 'Görüntüle', onPress: () => navigation.navigate('CompanyInfo' as any) }
        ]);
      } else if (backendError.toLowerCase().includes('ehliyet') || backendError.toLowerCase().includes('belge')) {
        Alert.alert('Belgeleriniz Onaylanmamış', backendError, [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Evraklarım', onPress: () => navigation.navigate('DocumentsScreen' as any) }
        ]);
      } else {
        showNotification('error', backendError || 'Teklif gönderilemedi', 6000);
      }
    } finally {
      setAcceptingJob(false);
    }
  };

  // Tarih formatlama
  const formatDate = (dateStr: string) => {
    try {
      const date = new Date(dateStr);
      return date.toLocaleDateString('tr-TR', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });
    } catch {
      return dateStr;
    }
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={['bottom']}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Talep detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!transferRequest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Transfer Talebi" />
        <FkEmptyState icon="file-search-outline" title="Talep bulunamadı" style={styles.container} />
      </SafeAreaView>
    );
  }

  const hasValidPrice = offerPrice.trim() !== '' && parseFloat(offerPrice) > 0;
  const transferTypeText = transferTypeLabel(transferRequest.transfer_type);
  const vehiclePrefLabel = transferRequest.vehicle_preference
    ? transferVehicleLabel(transferRequest.vehicle_preference)
    : null;
  const isVip = transferRequest.transfer_type === 'vip';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Transfer Talebi" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <AgencyAssignmentBanner agency={agency} hideDecline={agency.paid} />
          {/* Randevulu talep: tarih/aralık + teklif taahhüdü */}
          <JobScheduleCard info={getScheduleInfo(transferRequest)} context="offer" />
          {/* Alış / varış noktası ve mesafe */}
          <JobLocationCard
            title="Talep Bilgileri"
            points={[
              { type: 'pickup', label: 'Alış Noktası', address: transferRequest.pickup_address },
              ...(transferRequest.dropoff_address
                ? [{ type: 'dropoff' as const, label: 'Varış Noktası', address: transferRequest.dropoff_address }]
                : []),
            ]}
          >
            {distance !== null && distance !== undefined && (
              <InfoRow
                icon="map-marker-distance"
                label="Müşteriye uzaklık"
                value={`${distance} km`}
                valueColor={colors.primary[600]}
                style={styles.firstRow}
                divider={!!transferRequest.estimated_km}
              />
            )}
            {transferRequest.estimated_km ? (
              <InfoRow
                icon="map-marker-path"
                label="Tahmini rota mesafesi"
                value={`${transferRequest.estimated_km} km`}
                valueColor={colors.primary[600]}
              />
            ) : null}
          </JobLocationCard>

          {/* Transfer detayları */}
          <JobSection
            title="Transfer Detayları"
            icon={isVip ? 'star-circle-outline' : 'account-group-outline'}
            right={<FkPill label={transferTypeText} color={isVip ? 'secondary' : 'success'} size="sm" />}
          >
            {transferRequest.transfer_type === 'organization' && transferRequest.passenger_count ? (
              <InfoRow icon="account-multiple-outline" label="Kişi Sayısı" value={`${transferRequest.passenger_count} kişi`} divider />
            ) : null}
            {vehiclePrefLabel ? <InfoRow icon="car-estate" label="Araç Tercihi" value={vehiclePrefLabel} divider /> : null}
            <InfoRow icon="calendar-outline" label="Tarih" value={formatDate(transferRequest.scheduled_date)} divider />
            <InfoRow icon="clock-outline" label="Saat" value={transferRequest.scheduled_time} />
            <FkPill
              icon={transferRequest.is_round_trip ? 'swap-horizontal' : 'arrow-right'}
              label={transferRequest.is_round_trip ? 'Gidiş - Dönüş' : 'Tek Yön'}
              color={transferRequest.is_round_trip ? 'info' : 'neutral'}
              style={styles.tripPill}
            />
            {transferRequest.additional_notes ? (
              <FkInfoBanner
                type="neutral"
                icon="note-text-outline"
                title="Ek Notlar"
                message={transferRequest.additional_notes}
                style={styles.block}
              />
            ) : null}
          </JobSection>

          {/* Araç Seçimi */}
          <VehicleSelector
            vehicles={transferVehicles}
            selectedId={selectedVehicleId}
            onSelect={handleSelectVehicle}
            serviceType="transfer"
          />

          {/* Çalışan Seçimi (şirket için) */}
          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          {/* Fotoğraflar */}
          <PhotosSection photos={transferRequest.photos} />

          {/* Gidiş-dönüş uyarısı */}
          {transferRequest.is_round_trip && (
            <FkInfoBanner
              type="warning"
              icon="alert-circle"
              message="Dikkat! Bu talep gidiş-dönüş rotasıdır. Fiyat verirken bunu göz önünde bulundurun."
              style={styles.roundTripWarning}
            />
          )}

          {/* Fiyat Teklifi (acente ödemeli işte fiyat sabit) */}
          {!agency.paid && (
            <PriceOfferSection
              value={offerPrice}
              onChange={setOfferPrice}
              hint="Müşteri için uygun gördüğünüz fiyatı girin."
            />
          )}
        </ScrollView>

        {agency.paid ? (
          <AgencyPaidFooter agency={agency} onAccept={handleAccept} loading={acceptingJob} disabled={!selectedVehicleId} />
        ) : (
          <FkStickyFooter safeArea={false}>
            <FkButton
              onPress={handleAccept}
              loading={acceptingJob}
              disabled={acceptingJob || agency.expired || !selectedVehicleId || !hasValidPrice}
              icon="send-check-outline"
              size="lg"
              fullWidth
            >
              Teklif Gönder
            </FkButton>
          </FkStickyFooter>
        )}
      </KeyboardAvoidingView>

      {acceptingJob && <FkLoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoid: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  firstRow: {
    marginTop: spacing.sm,
  },
  tripPill: {
    marginTop: spacing.sm + 4,
  },
  block: {
    marginTop: spacing.sm + 4,
  },
  roundTripWarning: {
    marginBottom: spacing.md,
  },
});

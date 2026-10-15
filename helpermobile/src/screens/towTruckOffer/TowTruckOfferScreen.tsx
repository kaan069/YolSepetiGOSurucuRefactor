/**
 * TowTruckOfferScreen
 *
 * Çekici talebi detaylarını gösteren ve sürücünün teklif göndermesini sağlayan ekran.
 *
 * Özellikler:
 * - Talep detaylarını gösterir (ID, araç tipi, mesafe, kazanç)
 * - Kullanıcının çekicilerinden birini seçmesini sağlar
 * - Fiyat hesaplaması yapar (backend'den)
 * - Teklif gönderme işlemini yönetir
 *
 * Componentler:
 * - RequestHeader: Talep numarası
 * - CustomerInfoSection: Müşteri bilgileri (sadece kabul sonrası)
 * - TowTruckSelector: Çekici seçimi dropdown
 * - DistanceEarningsSection: Mesafe ve kazanç kartları
 * - VehicleInfoSection: Araç bilgileri
 * - VehicleStatusSection: Araç durumu ve ek ücretler
 * - ExtraEquipmentSection: Ekstra ekipmanlar
 * - AcceptButton: Teklif gönder butonu
 * - LoadingOverlay: Tam ekran loading
 *
 * Hooks:
 * - useTowTruckRequest: Talep verisi
 * - useCurrentLocation: Kullanıcı konumu
 * - useTowTrucks: Çekici listesi
 * - usePricing: Fiyat hesaplama
 */
import React, { useState, useEffect, useMemo } from 'react';
import { StyleSheet, ScrollView, Alert, Linking, View, TextInput, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, documentsAPI } from '../../api';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useDevOverrideStore } from '../../store/useDevOverrideStore';
import { validateOfferPrice } from '../../utils/offerValidation';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';

// Components
import {
  RequestHeader,
  DistanceEarningsSection,
  VehicleInfoSection,
  VehicleStatusSection,
  ExtraEquipmentSection,
  DescriptionSection,
  AcceptButton,
  LoadingOverlay,
} from './components';
import { VehicleSelector, EmployeeSelector } from '../../components/common';
import { ProviderType } from '../../api/types';
import PhotosSection from '../../components/PhotosSection';

// Hooks
import {
  useTowTruckRequest,
  useCurrentLocation,
  useTowTrucks,
} from './hooks';

// Utils
import { calculateDistance, parseRouteDistance, getRequestId } from './utils';
import { logger } from '../../utils/logger';
import PriceOfferSection from '../../components/offer/PriceOfferSection';
import { FkEmptyState, FkInfoBanner } from '../../components/fk';
import { spacing } from '../../theme/design';
import { useAgencyAssignment } from '../../hooks/useAgencyAssignment';
import AgencyAssignmentBanner from '../../components/AgencyAssignmentBanner';

type Props = NativeStackScreenProps<RootStackParamList, 'TowTruckOffer'>;

export default function TowTruckOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  // Acente doğrudan ataması: geri sayım, Reddet, süre dolunca teklif kilidi
  const agency = useAgencyAssignment(Number(orderId));
  const { showNotification } = useNotificationStore();
  const minOfferOverride = useDevOverrideStore((s) => s.minOfferOverride);
  const { screenBg, appColors, cardBg, isDarkMode } = useAppTheme();

  // Hooks
  const { request: towTruckRequest, loading: requestLoading } = useTowTruckRequest(orderId);
  const { location: currentLocation } = useCurrentLocation();
  const { towTrucks, selectedId: selectedTowTruckId, setSelectedId: setSelectedTowTruckId } = useTowTrucks();

  // Provider & Employee state
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // Local state
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [pricing, setPricing] = useState<any | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState<string>('');

  // Araç durumu soruları — pricing yoksa question_answers'dan al
  const vehicleStatusData = useMemo(() => {
    if (pricing?.breakdown?.surcharges?.length > 0) return pricing.breakdown.surcharges;
    return (towTruckRequest?.question_answers || []).map((qa: any) => ({
      question: qa.questionText || qa.question_text || qa.question || '',
      answer: qa.selectedOptionText || qa.selected_option_text || qa.answer || '',
      amount: qa.surcharge_amount || qa.surchargeAmount || 0,
    }));
  }, [pricing, towTruckRequest]);

  const totalSurcharge = pricing?.breakdown?.total_surcharge ||
    vehicleStatusData.reduce((sum: number, s: any) => sum + (s.amount || 0), 0);

  // Mesafe hesaplama - sürücüden alış noktasına
  useEffect(() => {
    if (currentLocation && towTruckRequest) {
      const pickupLat = parseFloat(towTruckRequest.pickup_latitude);
      const pickupLng = parseFloat(towTruckRequest.pickup_longitude);

      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        pickupLat,
        pickupLng
      );
      setDistanceToPickup(dist);
    }
  }, [currentLocation, towTruckRequest]);

  // Toplam mesafe ve fiyat hesaplama
  useEffect(() => {
    if (distanceToPickup === null || !towTruckRequest) return;

    const calculatePricing = async () => {
      try {

        // Toplam mesafe = Sürücü → Pickup + Pickup → Dropoff
        const pickupToDropoffKm = parseRouteDistance(towTruckRequest.route_distance);
        const totalKm = distanceToPickup + pickupToDropoffKm;
        setTotalDistance(totalKm);

        // Tracking token kontrolü
        if (!towTruckRequest.trackingToken) {
          throw new Error('Tracking token bulunamadı');
        }

        // Backend'den fiyat hesapla
        const pricingResult = await requestsAPI.calculateTowTruckPrice(
          towTruckRequest.trackingToken,
          parseFloat(totalKm.toFixed(2)),
          {
            isOnRoad: towTruckRequest.isOnRoad,
            isGearStuck: towTruckRequest.is_gear_stuck,
            isTireLocked: false,
            isStuck: towTruckRequest.is_stuck,
            isVehicleOperational: towTruckRequest.is_vehicle_operational,
            hasExtraAttachments: towTruckRequest.has_extra_attachments,
          }
        );

        logger.debug('orders', 'Fiyat hesapland');
        setPricing(pricingResult);
      } catch (error: any) {
        logger.error('orders', 'Fiyat hesaplama hatas');
        showNotification('error', error?.response?.data?.error || 'Fiyat hesaplanamadı');
      }
    };

    // 500ms debounce
    const timeoutId = setTimeout(calculatePricing, 500);
    return () => clearTimeout(timeoutId);
  }, [distanceToPickup, towTruckRequest]);

  // pricing yüklenince tavsiye fiyatı input'a doldur (sadece ilk kez)
  useEffect(() => {
    if (pricing && !proposedPrice) {
      setProposedPrice(String(Math.round(pricing.driverEarnings)));
    }
  }, [pricing]);

  // Provider type yükle ve şirketse çalışanları getir
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

  // Route distance (çekim mesafesi)
  const routeDistance = useMemo(() => {
    if (!towTruckRequest) return 0;
    return parseRouteDistance(towTruckRequest.route_distance);
  }, [towTruckRequest]);


  // Teklif gönderme
  const handleAccept = async () => {
    if (agency.expired) {
      Alert.alert('Süre Doldu', 'Atamanın yanıt süresi doldu, bu iş için artık teklif veremezsiniz.');
      return;
    }
    // Profil tamamlığı kontrolü
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();

      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `• ${field.message}`)
          .join('\n');

        Alert.alert(
          'Profil Tamamlanmamış',
          `İş kabul edebilmek için profilinizi tamamlamanız gerekiyor.\n\nEksik bilgiler:\n${missingMessages}\n\nProfil tamamlama: %${completenessResponse.completion_percentage}`,
          [
            { text: 'Tamam', style: 'cancel' },
            {
              text: 'Profili Tamamla',
              onPress: () => navigation.navigate('MissingDocuments'),
            },
          ]
        );
        return;
      }
    } catch (error) {
      logger.error('orders', 'Profil kontrol hatas');
    }

    // Validasyonlar
    if (!pricing || !totalDistance) {
      Alert.alert('Hata', 'Fiyat henüz hesaplanmadı. Lütfen bekleyin.');
      return;
    }

    if (!selectedTowTruckId) {
      Alert.alert('Hata', 'Lütfen bir çekici seçin.');
      return;
    }

    if (!towTruckRequest?.trackingToken) {
      Alert.alert('Hata', 'Tracking token bulunamadı.');
      return;
    }

    const priceCheck = validateOfferPrice(proposedPrice, minOfferOverride);
    if (!priceCheck.valid) {
      Alert.alert('Hata', priceCheck.error!);
      return;
    }
    const parsedPrice = priceCheck.price!;

    // Onay dialogu
    Alert.alert(
      'Teklif Gönder',
      `Bu çekici talebi için teklif göndermek istediğinize emin misiniz?\n\n` +
        `Teklifiniz: ${parsedPrice.toLocaleString('tr-TR')} TL\n` +
        `Toplam Mesafe: ${totalDistance.toFixed(1)} km\n\n` +
        `Teklifiniz müşteriye gönderilecek ve onay beklemeye alınacak.`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Teklif Gönder',
          onPress: submitOffer,
        },
      ]
    );
  };

  // Teklifi gönder
  const submitOffer = async () => {
    try {
      setSubmitting(true);

      const response = await requestsAPI.submitTowTruckOffer(
        towTruckRequest!.trackingToken!,
        selectedTowTruckId!,
        parseFloat(totalDistance!.toFixed(2)),
        parseFloat(proposedPrice),
        towTruckRequest!.is_gear_stuck || false,
        towTruckRequest!.is_stuck || false,
        towTruckRequest!.is_vehicle_operational || true,
        towTruckRequest!.has_extra_attachments || false,
        [],
        selectedEmployeeId || undefined
      );
      agency.markOffered();

      logger.debug('orders', 'Teklif gnderildi');

      // Başarı mesajı
      const offerPrice = response.driver_earnings || response.estimated_price || pricing?.driverEarnings || 0;
      showNotification(
        'success',
        `Teklifiniz gönderildi!\n\nTahmini Kazanç: ${offerPrice} TL\n\nMüşteri teklifinizi seçtiğinde iş "Devam Eden İşler"e geçecek.`,
        6000
      );

      // Orders sayfasına yönlendir
      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: {
              serviceFilter: 'tow',
              filter: 'awaiting_approval',
              timestamp: Date.now(),
            },
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      if (agency.handleOfferError(error)) return;
      logger.error('orders', 'Teklif gnderme hatas');

      const backendError = error?.response?.data?.error || error?.response?.data?.message || '';

      // Şirket bilgisi hatası
      if (backendError.toLowerCase().includes('şirket')) {
        Alert.alert('Şirket Bilgisi Eksik', backendError, [
          { text: 'İptal', style: 'cancel' },
          { text: 'Görüntüle', onPress: () => navigation.navigate('CompanyInfo' as any) },
        ]);
      }
      // Ehliyet/belge hatası
      else if (backendError.toLowerCase().includes('ehliyet') || backendError.toLowerCase().includes('belge')) {
        Alert.alert('Belgeleriniz Onaylanmamış', backendError, [
          { text: 'Tamam', style: 'cancel' },
          {
            text: 'WhatsApp Destek',
            onPress: () => Linking.openURL('https://wa.me/905555555555'),
          },
          {
            text: 'Evraklarım',
            onPress: () => navigation.navigate('DocumentsScreen' as any),
          },
        ]);
      } else {
        showNotification('error', backendError || 'Teklif gönderilemedi', 6000);
      }
    } finally {
      setSubmitting(false);
    }
  };

  // Loading durumu
  if (requestLoading && !towTruckRequest) {
    return (
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Çekici Talebi" />
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Talep detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Talep bulunamadı
  if (!towTruckRequest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Çekici Talebi" />
        <FkEmptyState icon="file-search-outline" title="Talep bulunamadı" style={styles.container} />
      </SafeAreaView>
    );
  }

  const requestId = getRequestId(towTruckRequest);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Çekici Talebi" />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView contentContainerStyle={styles.scrollContent} keyboardShouldPersistTaps="handled">
        <AgencyAssignmentBanner agency={agency} />
        {/* Talep Numarası */}
        <RequestHeader requestId={requestId} />

        {/* Müşteri bilgileri gelen işlerde gösterilmez - sadece devam eden işlerde gösterilir */}

        {/* Çekici Seçimi */}
        <VehicleSelector
          vehicles={towTrucks}
          selectedId={selectedTowTruckId}
          onSelect={setSelectedTowTruckId}
          serviceType="towTruck"
        />

        {/* Çalışan Seçimi (Şirket hesapları için) */}
        {providerType === 'company' && (
          <EmployeeSelector
            employees={employees}
            selectedId={selectedEmployeeId}
            onSelect={setSelectedEmployeeId}
            loading={employeesLoading}
          />
        )}

        {/* Mesafe ve Kazanç */}
        <DistanceEarningsSection
          distanceToPickup={distanceToPickup}
          routeDistance={routeDistance}
          totalDistance={totalDistance}
        />

        <PhotosSection photos={towTruckRequest.photos} />

        {/* Ek Bilgiler — müşterinin eklediği not (sadece doluysa görünür) */}
        <DescriptionSection description={towTruckRequest.description} />

       {/* Araç Bilgileri */}
        <VehicleInfoSection vehicleType={towTruckRequest.vehicle_type} />

        {/* Araç Durumu ve Ek Ücretler */}
        {vehicleStatusData.length > 0 && (
          <VehicleStatusSection
            surcharges={vehicleStatusData}
            totalSurcharge={totalSurcharge}
          />
        )}
        {/* Ekstra Ekipmanlar */}
        <ExtraEquipmentSection
          hasExtraAttachments={towTruckRequest.has_extra_attachments || false}
          attachmentTypes={towTruckRequest.attachment_types}
        />

        {/* Fiyat Teklifi */}
        <PriceOfferSection
          value={proposedPrice}
          onChange={setProposedPrice}
          showCommissionNote={false}
          placeholder="Fiyat giriniz"
        >
          {pricing ? (
            <FkInfoBanner
              type="info"
              icon="lightbulb-outline"
              message={`Tavsiye fiyat: ₺${Math.round(pricing.driverEarnings).toLocaleString('tr-TR')}`}
              style={styles.suggested}
            />
          ) : null}
        </PriceOfferSection>
      </ScrollView>

      {/* Teklif Gönder Butonu (alt sabit alan) */}
      <AcceptButton
        onPress={handleAccept}
        loading={submitting}
        towTruckCount={towTrucks.length}
        hasPricing={!!pricing}
        disabled={agency.expired}
      />
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {submitting && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 16,
  },
  suggested: {
    marginTop: spacing.sm + 4,
  },
});

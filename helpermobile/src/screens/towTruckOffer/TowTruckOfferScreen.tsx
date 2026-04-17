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
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';

// Components
import {
  RequestHeader,
  DistanceEarningsSection,
  VehicleInfoSection,
  VehicleStatusSection,
  ExtraEquipmentSection,
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

type Props = NativeStackScreenProps<RootStackParamList, 'TowTruckOffer'>;

export default function TowTruckOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();
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

        console.log('💰 Fiyat hesaplandı:', pricingResult.driverEarnings, 'TL');
        setPricing(pricingResult);
      } catch (error: any) {
        console.error('❌ Fiyat hesaplama hatası:', error);
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
    // Profil tamamlığı kontrolü
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();

      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `• ${field.message}`)
          .join('\n');

        Alert.alert(
          '⚠️ Profil Tamamlanmamış',
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
      console.error('❌ Profil kontrolü hatası:', error);
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

    const parsedPrice = parseFloat(proposedPrice);
    if (!proposedPrice || isNaN(parsedPrice) || parsedPrice <= 0) {
      Alert.alert('Hata', 'Lütfen geçerli bir fiyat girin.');
      return;
    }

    // Onay dialogu
    Alert.alert(
      'Teklif Gönder',
      `Bu çekici talebi için teklif göndermek istediğinize emin misiniz?\n\n` +
        `💰 Teklifiniz: ${parsedPrice.toLocaleString('tr-TR')} TL\n` +
        `📍 Toplam Mesafe: ${totalDistance.toFixed(1)} km\n\n` +
        `ℹ️ Teklifiniz müşteriye gönderilecek ve onay beklemeye alınacak.`,
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

      console.log('✅ Teklif gönderildi:', response);

      // Başarı mesajı
      const offerPrice = response.driver_earnings || response.estimated_price || pricing?.driverEarnings || 0;
      showNotification(
        'success',
        `✅ Teklifiniz gönderildi!\n\n💰 Tahmini Kazanç: ${offerPrice} TL\n\nℹ️ Müşteri sizin teklifinizi seçtiğinde iş "Devam Eden İşler"e geçecek.`,
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
      console.error('❌ Teklif gönderme hatası:', error);

      const backendError = error?.response?.data?.error || error?.response?.data?.message || '';

      // Şirket bilgisi hatası
      if (backendError.toLowerCase().includes('şirket')) {
        Alert.alert('⚠️ Şirket Bilgisi Eksik', backendError, [
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
      <SafeAreaView style={[styles.loadingContainer, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Çekici Talebi" />
        <Text>Talep bulunamadı.</Text>
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
        <View style={[styles.priceCard, { backgroundColor: cardBg }]}>
          <View style={styles.priceCardHeader}>
            <MaterialCommunityIcons name="currency-try" size={20} color="#26a69a" />
            <Text style={[styles.priceCardTitle, { color: appColors.text.primary }]}>Fiyat Teklifiniz</Text>
          </View>
          {pricing && (
            <View style={[styles.suggestedRow, { backgroundColor: isDarkMode ? '#2a1f0e' : '#FFF3E0' }]}>
              <MaterialCommunityIcons name="lightbulb-outline" size={16} color="#E65100" />
              <Text style={styles.suggestedText}>
                Tavsiye Fiyat:{' '}
                <Text style={styles.suggestedValue}>₺{Math.round(pricing.driverEarnings).toLocaleString('tr-TR')}</Text>
              </Text>
            </View>
          )}
          <Text style={[styles.priceInputLabel, { color: appColors.text.secondary }]}>Fiyatınız (₺)</Text>
          <TextInput
            style={[
              styles.priceInput,
              {
                backgroundColor: isDarkMode ? '#2a2a2a' : '#F9F9F9',
                borderColor: isDarkMode ? '#444' : '#e0e0e0',
                color: appColors.text.primary,
              },
            ]}
            value={proposedPrice}
            onChangeText={setProposedPrice}
            keyboardType="numeric"
            placeholder="Fiyat giriniz"
            placeholderTextColor={appColors.text.disabled}
          />
        </View>

        {/* Teklif Gönder Butonu */}
        <AcceptButton
          onPress={handleAccept}
          loading={submitting}
          towTruckCount={towTrucks.length}
          hasPricing={!!pricing}
        />
      </ScrollView>
      </KeyboardAvoidingView>

      {/* Loading Overlay */}
      {submitting && <LoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollContent: {
    paddingTop: 4,
    paddingBottom: 20,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
  },
  priceCard: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  priceCardHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  priceCardTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  suggestedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 8,
    padding: 12,
  },
  suggestedText: {
    fontSize: 14,
    color: '#E65100',
  },
  suggestedValue: {
    fontWeight: '700',
    fontSize: 15,
  },
  priceInputLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  priceInput: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 18,
    fontWeight: '600',
  },
});

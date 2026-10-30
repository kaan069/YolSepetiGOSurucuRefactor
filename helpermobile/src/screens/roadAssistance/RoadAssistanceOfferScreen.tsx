// Yol yardım talebi teklif ekranı
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, documentsAPI } from '../../api';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useDevOverrideStore } from '../../store/useDevOverrideStore';
import { validateOfferPrice } from '../../utils/offerValidation';
import { AppBar, VehicleSelector } from '../../components/common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { LocationCard, ProblemDetailsCard, PriceOfferCard } from './components';
import { useRoadAssistanceVehicles } from './hooks';
import { calculateDistance, formatNumber } from './constants';
import PhotosSection from '../../components/PhotosSection';
import { useAppTheme } from '../../hooks/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { EmployeeSelector } from '../../components/common';
import { ProviderType } from '../../api/types';
import { logger } from '../../utils/logger';
import { FkButton, FkEmptyState, FkLoadingOverlay, FkStickyFooter } from '../../components/fk';
import { spacing } from '../../theme/design';
import { useAgencyAssignment } from '../../hooks/useAgencyAssignment';
import AgencyAssignmentBanner from '../../components/AgencyAssignmentBanner';
import AgencyPaidFooter from '../../components/AgencyPaidFooter';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadAssistanceOffer'>;

export default function RoadAssistanceOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();
  const minOfferOverride = useDevOverrideStore((s) => s.minOfferOverride);
  const { screenBg, appColors } = useAppTheme();

  // Araç seçimi hook
  const {
    vehicles,
    selectedId: selectedVehicleId,
    setSelectedId: setSelectedVehicleId,
    loading: vehiclesLoading,
    approvedCount
  } = useRoadAssistanceVehicles();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  // Acente ataması: geri sayım, Reddet, süre dolunca kilit; acente ödemeli işte sabit ücretle Kabul / Reddet
  const agency = useAgencyAssignment(Number(orderId), request);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // Talep detayını getir
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const data = await requestsAPI.getRoadAssistanceRequestDetail(parseInt(orderId));
        setRequest(data);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Talep detayları yüklenemedi';
        showNotification('error', errorMessage);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [orderId]);

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
        logger.error('orders', 'Konum alnamad');
      }
    };
    getCurrentLocation();
  }, []);

  // Mesafe hesapla
  useEffect(() => {
    if (currentLocation && request) {
      const lat = parseFloat(request.latitude || '0');
      const lng = parseFloat(request.longitude || '0');
      if (lat && lng) {
        setDistance(calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng));
      }
    }
  }, [request, currentLocation]);

  // Provider type kontrolü
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

  // Fiyat değişikliği
  const handlePriceChange = (text: string) => {
    setProposedPrice(text);
    setPriceError('');
  };

  // Teklif gönder
  const handleSubmitOffer = async () => {
    if (agency.expired) {
      Alert.alert('Süre Doldu', 'Atamanın yanıt süresi doldu, bu iş için artık teklif veremezsiniz.');
      return;
    }
    // Profil kontrolü
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();
      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `• ${field.message}`)
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
      logger.error('orders', 'Profil kontrol hatas');
    }

    // Acente ödemeli işte fiyat sabit: alan doğrulanmaz
    if (!agency.paid) {
      const priceCheck = validateOfferPrice(proposedPrice, minOfferOverride);
      if (!priceCheck.valid) {
        setPriceError(priceCheck.error!);
        return;
      }
    }

    if (!request?.trackingToken) {
      showNotification('error', 'Tracking token bulunamadı');
      return;
    }

    if (distance === null) {
      showNotification('error', 'Mesafe hesaplanamadı. Lütfen konum izni verin.');
      return;
    }

    // Araç kontrolü
    if (!selectedVehicleId) {
      showNotification('error', 'Lütfen bir araç seçin');
      return;
    }

    if (agency.paid) {
      agency.confirmAccept(submitOffer);
      return;
    }
    submitOffer();
  };

  const submitOffer = async () => {
    try {
      setSubmitting(true);
      await requestsAPI.submitRoadAssistanceOffer(
        request.trackingToken,
        // Acente ödemeli işte alan zorunlu ama backend yok sayar; ücret agreed_price'tır
        agency.paid ? Number(agency.agreedPrice) : parseInt(proposedPrice),
        parseFloat(distance!.toFixed(2)),
        selectedVehicleId!,
        selectedEmployeeId || undefined
      );
      agency.markOffered();

      // Acente ödemeli iş hemen başlar: müşteri onayı ve komisyon ödemesi yok
      if (agency.paid) {
        showNotification('success', 'İş kabul edildi.');
        agency.openAcceptedJob('road_assistance');
        return;
      }

      showNotification('success', `Teklifiniz gönderildi!\n\nTeklif: ${formatNumber(parseInt(proposedPrice))} TL`, 5000);

      // Orders sayfasına yönlendir - awaiting_approval filtresiyle
      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: {
              serviceFilter: 'roadAssistance',
              filter: 'awaiting_approval',
              timestamp: Date.now(),
            },
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      if (agency.handleOfferError(error)) return;
      const errorMessage = error?.response?.data?.error || 'Teklif gönderilirken hata oluştu';
      showNotification('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={['bottom']}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Talep detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Yol Yardım Talebi" />
        <FkEmptyState
          icon="file-search-outline"
          title="Talep bulunamadı"
          actionLabel="Geri Dön"
          actionVariant="secondary"
          onAction={() => navigation.goBack()}
          style={styles.container}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Yol Yardım Talebi" />
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
          <LocationCard
            address={request.address}
            latitude={parseFloat(request.latitude || '0')}
            longitude={parseFloat(request.longitude || '0')}
            distance={distance}
            hideExactLocation={true}
          />

          {/* Araç Seçimi */}
          <VehicleSelector
            vehicles={vehicles}
            selectedId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            serviceType="roadAssistance"
            loading={vehiclesLoading}
          />

          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          <PhotosSection photos={request.photos} />

          <ProblemDetailsCard
            vehicleType={request.vehicle_type}
            problemTypes={request.problem_types}
            problemDescription={request.problem_description}
            additionalNotes={request.additional_notes}
          />

          {!agency.paid && (
            <PriceOfferCard
              price={proposedPrice}
              onPriceChange={handlePriceChange}
              error={priceError}
            />
          )}

        </ScrollView>

        {agency.paid ? (
          <AgencyPaidFooter agency={agency} onAccept={handleSubmitOffer} loading={submitting} disabled={!selectedVehicleId || approvedCount === 0} />
        ) : (
          <FkStickyFooter safeArea={false}>
            <FkButton
              onPress={handleSubmitOffer}
              loading={submitting}
              disabled={submitting || agency.expired || !proposedPrice || parseInt(proposedPrice) <= 0 || !selectedVehicleId || approvedCount === 0}
              icon="send-check-outline"
              size="lg"
              fullWidth
            >
              Teklif Gönder
            </FkButton>
          </FkStickyFooter>
        )}
      </KeyboardAvoidingView>

      {submitting && <FkLoadingOverlay />}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardAvoid: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  loadingText: {
    marginTop: spacing.md,
  },
});

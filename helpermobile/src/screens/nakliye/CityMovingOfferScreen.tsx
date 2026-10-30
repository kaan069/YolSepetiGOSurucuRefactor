// Şehirler arası nakliye teklif ekranı
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI } from '../../api';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useDevOverrideStore } from '../../store/useDevOverrideStore';
import { validateOfferPrice } from '../../utils/offerValidation';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { RouteInfoCard, LoadDetailsCard, PriceOfferCard } from './components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { VehicleSelector, EmployeeSelector } from '../../components/common';
import { ProviderType } from '../../api/types';
import { useNakliyeVehicles } from './hooks';
import { calculateDistance } from './constants';
import PhotosSection from '../../components/PhotosSection';
import { logger } from '../../utils/logger';
import { FkButton, FkEmptyState, FkStickyFooter } from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { colors, spacing } from '../../theme/design';
import { useAgencyAssignment } from '../../hooks/useAgencyAssignment';
import AgencyAssignmentBanner from '../../components/AgencyAssignmentBanner';
import AgencyPaidFooter from '../../components/AgencyPaidFooter';
import { JobScheduleCard } from '../../components/job';
import { getScheduleInfo } from '../../utils/schedule';

type Props = NativeStackScreenProps<RootStackParamList, 'CityMovingOffer'>;

export default function CityMovingOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();
  const { screenBg } = useAppTheme();
  const minOfferOverride = useDevOverrideStore((s) => s.minOfferOverride);

  // Araç seçimi hook
  const {
    vehicles,
    selectedId: selectedVehicleId,
    setSelectedId: setSelectedVehicleId,
    loading: vehiclesLoading,
    approvedCount
  } = useNakliyeVehicles();

  // Employee seçimi (company tipi için)
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  const [request, setRequest] = useState<any | null>(null);
  // Acente ataması: geri sayım, Reddet, süre dolunca kilit; acente ödemeli işte sabit ücretle Kabul / Reddet
  const agency = useAgencyAssignment(Number(orderId), request);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceError, setPriceError] = useState('');

  // Talep detayını çek
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const pendingRequests = await requestsAPI.getPendingCityMovingRequests();
        const foundRequest = pendingRequests.find((r: any) => r.id.toString() === orderId);

        if (foundRequest) {
          setRequest(foundRequest);

          // Backend'den gelen route_distance değerini kullan
          if (foundRequest.route_distance) {
            const routeDistanceStr = String(foundRequest.route_distance);
            const parsedDistance = parseFloat(routeDistanceStr.replace(/[^\d.]/g, ''));
            if (!isNaN(parsedDistance) && parsedDistance > 0) {
              setTotalDistance(parsedDistance);
            }
          }
        } else {
          throw new Error('Talep bulunamadı');
        }
      } catch (error) {
        showNotification('error', 'Talep detayları yüklenemedi');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [orderId]);

  // Mevcut konum al ve müşteriye uzaklığı hesapla
  useEffect(() => {
    const getLocation = async () => {
      if (!request) return;

      try {
        const granted = await ensureForegroundPermission();
        if (!granted) return;

        const location = await Location.getCurrentPositionAsync({});
        const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
        const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');

        if (fromLat && fromLng) {
          setDistanceToPickup(
            calculateDistance(location.coords.latitude, location.coords.longitude, fromLat, fromLng)
          );
        }
      } catch (error) {
        logger.error('orders', 'Konum alnamad');
      }
    };
    getLocation();
  }, [request]);

  // Provider type yükle
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

  // Fiyat değişimi
  const handlePriceChange = (text: string) => {
    setProposedPrice(text);
    setPriceError('');
  };

  // Teklif gönder
  const handleSubmitOffer = async () => {
    if (agency.expired) {
      showNotification('warning', 'Atamanın yanıt süresi doldu, bu iş için artık teklif veremezsiniz.');
      return;
    }
    if (!request) return;

    // Acente ödemeli işte fiyat sabit: alan doğrulanmaz, backend agreed_price'ı kullanır
    let price = Math.round(Number(agency.agreedPrice));
    if (!agency.paid) {
      const priceCheck = validateOfferPrice(proposedPrice, minOfferOverride);
      if (!priceCheck.valid) {
        setPriceError(priceCheck.error!);
        return;
      }
      price = Math.round(priceCheck.price!);
    }

    // Araç kontrolü
    if (!selectedVehicleId) {
      showNotification('error', 'Lütfen bir araç seçin');
      return;
    }

    if (agency.paid) {
      agency.confirmAccept(() => submitOffer(price));
      return;
    }
    submitOffer(price);
  };

  const submitOffer = async (price: number) => {
    try {
      setSubmitting(true);
      const trackingToken = request.trackingToken || request.tracking_token;
      if (!trackingToken) throw new Error('Tracking token bulunamadı');

      await requestsAPI.submitCityMovingOffer(trackingToken, price, totalDistance || 0, selectedVehicleId!, selectedEmployeeId || undefined);
      agency.markOffered();

      // Acente ödemeli iş hemen başlar: müşteri onayı ve komisyon ödemesi yok
      if (agency.paid) {
        showNotification('success', 'İş kabul edildi.');
        agency.openAcceptedJob('city_moving');
        return;
      }

      showNotification('success', 'Teklifiniz başarıyla gönderildi!');

      // Orders sayfasına yönlendir - awaiting_approval filtresiyle
      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: {
              serviceFilter: 'nakliye',
              filter: 'awaiting_approval',
              timestamp: Date.now(),
            },
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      if (agency.handleOfferError(error)) return;
      const errorMessage = error?.response?.data?.error || 'Teklif gönderilemedi';
      showNotification('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || vehiclesLoading) {
    return (
      <View style={[styles.container, styles.centered, { backgroundColor: screenBg }]}>
        <LoadingSpinner size={80} />
      </View>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Talep Bulunamadı" showBackButton onBackPress={() => navigation.goBack()} />
        <FkEmptyState icon="alert-circle-outline" title="Talep detayları yüklenemedi" style={styles.container} />
      </SafeAreaView>
    );
  }

  // Request verilerini çıkar
  const fromCity = request.from_city || request.from_address || request.pickup_address || 'Alınacak şehir';
  const toCity = request.to_city || request.to_address || request.dropoff_address || 'Bırakılacak şehir';
  const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
  const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
  const toLat = parseFloat(request.to_latitude || request.dropoff_latitude || '0');
  const toLng = parseFloat(request.to_longitude || request.dropoff_longitude || '0');

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Şehirler Arası Nakliye" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          <AgencyAssignmentBanner agency={agency} hideDecline={agency.paid} />
          {/* Randevulu talep: tarih/aralık + teklif taahhüdü */}
          <JobScheduleCard info={getScheduleInfo(request)} context="offer" />
          {/* Araç Seçimi */}
          <VehicleSelector
            vehicles={vehicles}
            selectedId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            serviceType="nakliye"
            loading={vehiclesLoading}
            onAddVehicle={() => navigation.navigate('VehiclesScreen')}
          />

          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          <RouteInfoCard
            fromAddress={fromCity}
            toAddress={toCity}
            fromLat={fromLat}
            fromLng={fromLng}
            toLat={toLat}
            toLng={toLng}
            totalDistance={totalDistance}
            isCity={true}
          />

          <PhotosSection photos={request.photos} />

          <LoadDetailsCard
            loadType={request.load_type}
            loadWeight={request.load_weight}
            loadVolume={request.load_volume}
            width={request.width}
            length={request.length}
            height={request.height}
            notes={request.notes || request.additional_notes}
            distanceToPickup={distanceToPickup}
          />

          {!agency.paid && (
            <>
              <PriceOfferCard
                price={proposedPrice}
                onPriceChange={handlePriceChange}
                error={priceError}
                hint="Şehirler arası nakliye için teklif edeceğiniz fiyatı girin."
              />

              <Text style={styles.disclaimer}>
                Teklif gönderdiğinizde, müşteri teklifinizi değerlendirecek ve kabul ederse sizinle iletişime geçilecektir.
              </Text>
            </>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
    paddingBottom: spacing.lg,
  },
  disclaimer: {
    fontSize: 12,
    color: colors.neutral[400],
    textAlign: 'center',
    lineHeight: 17,
    paddingHorizontal: spacing.md,
  },
});

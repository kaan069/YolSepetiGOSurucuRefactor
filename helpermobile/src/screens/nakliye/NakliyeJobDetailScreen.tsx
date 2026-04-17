// Nakliye iş detayı ekranı (Evden Eve + Şehirler Arası)
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { View, StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI } from '../../api';
import { homeMovingAPI, cityMovingAPI } from '../../api/requests/nakliye';
import { useNakliyeLocationStore } from '../../store/useNakliyeLocationStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CommissionPaymentModal, CommissionPaymentCard, InsurancePricingCard } from '../../components/payment';
import CancelJobModal from '../../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../../store/useJobUpdateEventStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import type { CancelServiceType } from '../../api/types';
import {
  StatusBanner,
  EarningsCard,
  JobCustomerInfoCard,
  DistanceInfoCard,
  LocationCard,
  MovingDetailsJobCard,
  CompleteJobCard,
  StartTripCard,
  PreferredDateCard,
} from './components';
import { calculateDistance, getStatus } from './constants';
import PhotosSection from '../../components/PhotosSection';
import DriverPhotoUpload from '../../components/DriverPhotoUpload';

type Props = NativeStackScreenProps<RootStackParamList, 'NakliyeJobDetail'>;

export default function NakliyeJobDetailScreen({ route, navigation }: Props) {
  const { jobId, movingType } = route.params;
  const { screenBg, appColors } = useAppTheme();

  // Global nakliye konum paylaşımı store'u
  const { isLocationSharing, startLocationSharing, stopLocationSharing, jobId: activeJobId } = useNakliyeLocationStore();

  // State
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const status = request ? getStatus(request) : null;
  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';
  const isHomeMoving = movingType === 'home' || request?.moving_type === 'home';

  const requestId = request?.request_id?.id || request?.request_id || request?.id || null;
  const trackingToken = request?.tracking_token || request?.trackingToken || null;

  // Bu iş için konum paylaşımı aktif mi kontrol et
  const isThisJobLocationSharing = isLocationSharing && activeJobId === jobId;

  // Yola çık butonu - depart endpoint + konum paylaşımı
  const [departLoading, setDepartLoading] = useState(false);
  const [hasDeparted, setHasDeparted] = useState(false);

  const handleStartTrip = async () => {
    const granted = await ensureForegroundPermission();
    if (!granted) {
      Alert.alert('Konum İzni Gerekli', 'Müşteri ile konum paylaşımı için konum izni vermeniz gerekmektedir.', [{ text: 'Tamam' }]);
      return;
    }

    if (!trackingToken) {
      Alert.alert('Hata', 'Tracking token bulunamadı. Lütfen sayfayı yenileyip tekrar deneyin.');
      return;
    }

    setDepartLoading(true);
    try {
      // Backend'e yola çıkış bildir (müşteriye SMS gider)
      if (!hasDeparted) {
        const departAPI = isHomeMoving ? homeMovingAPI : cityMovingAPI;
        await departAPI.depart(trackingToken);
        setHasDeparted(true);
      }
      startLocationSharing(trackingToken, jobId, movingType as 'home' | 'city');
      Alert.alert('Yola Çıkış Bildirildi', 'Müşteriye SMS gönderildi ve konum paylaşımı başlatıldı. İyi yolculuklar!', [{ text: 'Tamam' }]);
    } catch (err: any) {
      // Depart başarısız olsa bile konum paylaşımını başlat
      startLocationSharing(trackingToken, jobId, movingType as 'home' | 'city');
      Alert.alert('Konum Paylaşımı Başladı', 'Konum paylaşımı başlatıldı.', [{ text: 'Tamam' }]);
    } finally {
      setDepartLoading(false);
    }
  };

  // Konum paylaşımını durdur - Global store'u kullan
  const handleStopTrip = () => {
    Alert.alert(
      'Konum Paylaşımını Durdur',
      'Müşteri artık konumunuzu göremeyecek. Devam etmek istiyor musunuz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Durdur',
          style: 'destructive',
          onPress: () => stopLocationSharing(),
        },
      ]
    );
  };

  // Talep detayını getir
  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      let data;

      if (movingType === 'city') {
        data = await requestsAPI.getCityMovingRequestDetail(parseInt(jobId));
      } else {
        data = await requestsAPI.getHomeMovingRequestDetail(parseInt(jobId));
      }

      setRequest(data);

      // Backend'den gelen route_distance değerini kullan
      if (data.route_distance) {
        const routeDistanceStr = String(data.route_distance);
        const parsedDistance = parseFloat(routeDistanceStr.replace(/[^\d.]/g, ''));
        if (!isNaN(parsedDistance) && parsedDistance > 0) {
          setTotalDistance(parsedDistance);
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Nakliye iş detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [jobId, movingType]);

  useFocusEffect(
    useCallback(() => {
      fetchRequest();
    }, [fetchRequest])
  );

  // WebSocket iptal event'ini dinle
  const { lastCancelledJobId, lastCancelledAt } = useCancellationEventStore();
  useEffect(() => {
    if (lastCancelledJobId && String(lastCancelledJobId) === jobId) {
      fetchRequest();
    }
  }, [lastCancelledJobId, lastCancelledAt, jobId, fetchRequest]);

  // WebSocket iş güncelleme event'ini dinle (ödeme yapıldığında vs.)
  const { lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus } = useJobUpdateEventStore();
  useEffect(() => {
    if (lastUpdatedJobId && String(lastUpdatedJobId) === jobId) {
      if (lastUpdatedStatus) {
        const statusLabels: Record<string, string> = {
          'awaiting_approval': 'Onay Bekleniyor',
          'awaiting_payment': 'Ödeme Bekleniyor',
          'in_progress': 'Devam Ediyor',
          'completed': 'Tamamlandı',
          'cancelled': 'İptal Edildi',
        };
        const label = statusLabels[lastUpdatedStatus] || lastUpdatedStatus;
        useJobUpdateEventStore.getState().clear();
        Alert.alert('İş Durumu Güncellendi', `İş durumu: ${label}`, [{
          text: 'Tamam',
          onPress: () => {
            navigation.navigate('Tabs', {
              screen: 'OrdersTab',
              params: {
                filter: lastUpdatedStatus === 'cancelled' ? 'pending' : lastUpdatedStatus,
                serviceFilter: 'nakliye',
                timestamp: Date.now(),
              },
            });
          },
        }]);
      } else {
        fetchRequest();
      }
    }
  }, [lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus, jobId, navigation, fetchRequest]);

  // Onay/ödeme beklerken fallback polling (10 saniyede bir)
  // Sadece WebSocket bağlantısı yoksa çalışır
  useEffect(() => {
    if (!isAwaitingApproval && !isAwaitingPayment) return;

    const { jobsWebSocket } = require('../../services/jobsWebSocket');
    const interval = setInterval(() => {
      if (!jobsWebSocket.hasActiveConnections()) {
        fetchRequest();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAwaitingApproval, isAwaitingPayment, fetchRequest]);

  // Nakliye için konum paylaşımı zaten useNakliyeLocationStore ile yönetiliyor
  // İş bitince konum paylaşımını durdur
  useEffect(() => {
    if (request && status) {
      if (status === 'completed' || status === 'cancelled') {
        // İş bitti - konum paylaşımını durdur
        if (isThisJobLocationSharing) {
          stopLocationSharing();
        }
      }
    }
  }, [status, request, isThisJobLocationSharing, stopLocationSharing]);

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
        console.error('Konum hatası:', error);
      }
    };
    getCurrentLocation();
  }, []);

  // Müşteriye mesafe hesapla
  useEffect(() => {
    if (currentLocation && request) {
      const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
      const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
      if (fromLat && fromLng) {
        const dist = calculateDistance(currentLocation.latitude, currentLocation.longitude, fromLat, fromLng);
        setDistanceToPickup(dist);
      }
    }
  }, [currentLocation, request]);

  // Ödeme başarılı
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    try {
      let updatedRequest;
      if (movingType === 'city') {
        updatedRequest = await requestsAPI.getCityMovingRequestDetail(parseInt(jobId));
      } else {
        updatedRequest = await requestsAPI.getHomeMovingRequestDetail(parseInt(jobId));
      }
      setRequest(updatedRequest);
    } catch (error) {
      console.error('Yenileme hatası:', error);
    }
    Alert.alert('Ödeme Başarılı', 'Komisyon ödemesi tamamlandı. İş artık devam ediyor.', [{ text: 'Tamam' }]);
  };

  // Ödeme başarısız
  const handlePaymentFailed = (errorMessage: string) => {
    Alert.alert('Ödeme Hatası', errorMessage);
  };

  // İptal başarılı
  const handleCancelSuccess = () => {
    if (isThisJobLocationSharing) {
      stopLocationSharing();
    }
    navigation.navigate('Tabs', { screen: 'OrdersTab' });
  };

  const cancelServiceType: CancelServiceType = movingType === 'city' ? 'city-moving' : 'home-moving';

  // Değerler - request değiştiğinde yeniden hesaplanır (yeni iş geldiğinde memo invalidate olur)
  const {
    driverEarnings, commissionAmount,
    totalPrice, commissionVatRate, commissionVatAmount,
    commissionTotalWithVat, paymentCommissionAmount, screenTitle,
    customerName, customerPhone, fromLat, fromLng, toLat, toLng,
  } = useMemo(() => {
    if (!request) {
      return {
        driverEarnings: 0, commissionAmount: 0, totalPrice: 0,
        commissionVatRate: undefined, commissionVatAmount: undefined,
        commissionTotalWithVat: undefined, paymentCommissionAmount: 0,
        screenTitle: isHomeMoving ? 'Evden Eve Nakliye' : 'Şehirler Arası Nakliye',
        customerName: '', customerPhone: '',
        fromLat: 0, fromLng: 0, toLat: 0, toLng: 0,
      };
    }
    const _offerAmount = request.my_offer?.offer_amount || request.my_offer?.estimated_price || request.final_price || 0;
    const _platformCommission = request.my_offer?.platform_commission || request.platform_commission || 0;
    const _commissionAmount = parseFloat(_platformCommission.toString());
    const _totalPrice = parseFloat(_offerAmount.toString());
    const _driverEarnings = request.my_offer?.driver_earnings || (_totalPrice - _commissionAmount);
    const _pricingBreakdown = request.my_offer?.pricing_breakdown;
    const _commissionVatRate = _pricingBreakdown?.commission_vat_rate;
    const _commissionVatAmount = _pricingBreakdown?.commission_vat_amount;
    const _commissionTotalWithVat = _pricingBreakdown?.commission_total_with_vat;

    return {
      driverEarnings: _driverEarnings,
      commissionAmount: _commissionAmount,
      totalPrice: _totalPrice,
      commissionVatRate: _commissionVatRate,
      commissionVatAmount: _commissionVatAmount,
      commissionTotalWithVat: _commissionTotalWithVat,
      paymentCommissionAmount: _commissionTotalWithVat || _commissionAmount,
      screenTitle: isHomeMoving ? 'Evden Eve Nakliye' : 'Şehirler Arası Nakliye',
      customerName: request.requestOwnerNameSurname || request.request_owner_name,
      customerPhone: request.requestOwnerPhone || request.request_owner_phone,
      fromLat: parseFloat(request.from_latitude || request.pickup_latitude || '0'),
      fromLng: parseFloat(request.from_longitude || request.pickup_longitude || '0'),
      toLat: parseFloat(request.to_latitude || request.dropoff_latitude || '0'),
      toLng: parseFloat(request.to_longitude || request.dropoff_longitude || '0'),
    };
  }, [request, isHomeMoving]);

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={{ marginTop: 16, color: appColors.text.secondary }}>Nakliye iş detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!request) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Nakliye İş Detayı" />
        <Text>Nakliye iş detayı bulunamadı.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          Geri Dön
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title={screenTitle} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <StatusBanner visible={isAwaitingApproval} />

        {isAwaitingPayment && (
          <CommissionPaymentCard
            visible={true}
            serviceType="nakliye"
            jobDetails={{
              finalPrice: totalPrice,
              commissionAmount: commissionAmount,
              commissionVatRate: commissionVatRate,
              commissionVatAmount: commissionVatAmount,
              commissionTotalWithVat: commissionTotalWithVat,
              customerName: customerName,
              description: isHomeMoving
                ? `Evden Eve Nakliye - ${request.room_count || '?'} oda`
                : `Şehirler Arası - ${request.from_city || ''} → ${request.to_city || ''}`,
            }}
            onPayCommission={() => setShowPaymentModal(true)}
            distanceKm={distanceToPickup}
            estimatedDuration={request.estimated_duration || request.estimated_duration_hours}
          />
        )}

        {(isAwaitingApproval || isInProgress || isCompleted) && parseFloat(driverEarnings.toString()) > 0 && (
          <EarningsCard
            finalPrice={parseFloat(driverEarnings.toString())}
            status={isCompleted ? 'completed' : isAwaitingApproval ? 'awaiting_approval' : 'in_progress'}
          />
        )}

        {/* Sigortalı iş fiyat detayı */}
        {request.pricing && (
          <InsurancePricingCard pricing={request.pricing} />
        )}

        {(isAwaitingApproval || isInProgress) && (
          <PhotosSection photos={request.photos} />
        )}

        {isInProgress && (
          <DriverPhotoUpload
            requestId={requestId}
            existingPhotos={request.photos}
            onPhotosUploaded={fetchRequest}
          />
        )}

        <JobCustomerInfoCard
          name={customerName}
          phone={customerPhone}
          visible={isInProgress}
        />

        {/* Yola Çık / Konum Paylaşımı Kartı - Sadece devam eden işlerde görünür */}
        <StartTripCard
          visible={isInProgress}
          isLocationSharing={isThisJobLocationSharing}
          loading={departLoading}
          onStartTrip={handleStartTrip}
          onStopTrip={handleStopTrip}
        />

        {/* Tercih edilen tarih - Konum bilgisinin üstünde */}
        <PreferredDateCard
          preferredDate={request.preferred_date}
          preferredTimeSlot={request.preferred_time_slot}
          visible={!isAwaitingPayment}
        />

        <DistanceInfoCard
          distanceToPickup={distanceToPickup}
          totalDistance={totalDistance}
          visible={!isAwaitingPayment}
        />

        <LocationCard
          type="pickup"
          address={request.from_address || request.pickup_address}
          latitude={fromLat}
          longitude={fromLng}
          floor={isHomeMoving ? request.floor_from : undefined}
          hasElevator={request.has_elevator}
          visible={!isAwaitingPayment}
          showDirectionsButton={!isAwaitingApproval}
        />

        <LocationCard
          type="dropoff"
          address={request.to_address || request.dropoff_address}
          latitude={toLat}
          longitude={toLng}
          floor={isHomeMoving ? request.floor_to : undefined}
          hasElevator={request.has_elevator_to}
          visible={!isAwaitingPayment}
          showDirectionsButton={!isAwaitingApproval}
        />

        <MovingDetailsJobCard
          isHomeMoving={isHomeMoving}
          // Evden Eve alanları
          homeType={request.home_type}
          floorFrom={request.floor_from}
          floorTo={request.floor_to}
          hasElevatorFrom={request.has_elevator_from}
          hasElevatorTo={request.has_elevator_to}
          hasLargeItems={request.has_large_items}
          largeItemsNote={request.large_items_note}
          hasFragileItems={request.has_fragile_items}
          needsPacking={request.needs_packing}
          needsDisassembly={request.needs_disassembly}
          // Şehirler Arası alanları
          loadType={request.load_type}
          loadWeight={request.load_weight}
          width={request.width}
          length={request.length}
          height={request.height}
          // Ortak alanlar
          preferredDate={request.preferred_date}
          preferredTimeSlot={request.preferred_time_slot}
          additionalNotes={request.additional_notes}
          visible={!isAwaitingPayment}
        />

        <CompleteJobCard visible={isInProgress} />

        {/* Teklifi Geri Çek Butonu */}
        {isAwaitingApproval && trackingToken && (
          <Button
            icon="undo"
            mode="outlined"
            textColor="#FF9800"
            loading={withdrawLoading}
            disabled={withdrawLoading}
            style={{ borderColor: '#FF9800', marginBottom: 8 }}
            onPress={() => {
              Alert.alert('Teklifi Geri Çek', 'Teklifinizi geri çekmek istediğinize emin misiniz?', [
                { text: 'Vazgeç', style: 'cancel' },
                { text: 'Geri Çek', style: 'destructive', onPress: async () => {
                  setWithdrawLoading(true);
                  try {
                    const withdrawFn = isHomeMoving ? requestsAPI.withdrawHomeMovingOffer : requestsAPI.withdrawCityMovingOffer;
                    await withdrawFn(trackingToken);
                    Alert.alert('Başarılı', 'Teklifiniz geri çekildi.');
                    navigation.navigate('Tabs', { screen: 'OrdersTab' });
                  } catch (err: any) {
                    Alert.alert('Hata', err?.response?.data?.error || 'Teklif geri çekilemedi.');
                  } finally { setWithdrawLoading(false); }
                }}
              ]);
            }}
          >
            Teklifi Geri Cek
          </Button>
        )}

        {/* İşi İptal Et Butonu */}
        {(isInProgress || isAwaitingApproval) && trackingToken && (
          <Button
            icon="cancel"
            mode="outlined"
            textColor="#F44336"
            style={{ borderColor: '#F44336', marginBottom: 16 }}
            onPress={() => setShowCancelModal(true)}
          >
            İşi İptal Et
          </Button>
        )}
      </ScrollView>

      <CommissionPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        requestId={requestId || 0}
        commissionAmount={paymentCommissionAmount}
        commissionBaseAmount={commissionAmount}
        commissionVatRate={commissionVatRate}
        commissionVatAmount={commissionVatAmount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
      />

      {/* İş İptal Modal */}
      <CancelJobModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        serviceType={cancelServiceType}
        trackingToken={trackingToken || ''}
        onCancelSuccess={handleCancelSuccess}
      />
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
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
});

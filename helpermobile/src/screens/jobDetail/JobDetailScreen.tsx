// This screen displays the details of a job. It can handle both active (accepted) and completed jobs.
// Bu ekran bir işin detaylarını görüntüler. Hem aktif (kabul edilmiş) hem de tamamlanmış işleri yönetebilir.
import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { StyleSheet, ScrollView, Linking, Platform, Alert, BackHandler } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, TowTruckRequestDetail } from '../../api';
import { useActiveJobStore } from '../../store/useActiveJobStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import AppBar from '../../components/common/AppBar';
// NFC/QR/PayPOS ödeme entegrasyonu iptal edildi - firma ile anlaşılamadı
// import { NFCPaymentModal, QRPaymentModal, PayPOSPaymentModal, CustomerPaymentWaitingCard } from '../../components/payment';
import { CustomerPaymentWaitingCard, InsurancePricingCard } from '../../components/payment';
import CancelJobModal from '../../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../../store/useJobUpdateEventStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  AwaitingApprovalBanner,
  HeroSection,
  JobMapSection,
  QuickActions,
  CustomerInfoCard,
  LocationInfoCard,
  VehicleDetailsCard,
  // PaymentSection, // NFC/QR/PayPOS ödeme iptal edildi
  CompleteJobCard,
} from './components';
import PhotosSection from '../../components/PhotosSection';
import DriverPhotoUpload from '../../components/DriverPhotoUpload';
import VehicleStatusSection from '../towTruckOffer/components/VehicleStatusSection';
import { calculateDistance, getStatus, getRequestId } from './utils';
import { LocationCoords } from './types';

type Props = NativeStackScreenProps<RootStackParamList, 'JobDetail'>;

export default function JobDetailScreen({ route, navigation }: Props) {
  const { jobId, fromScreen } = route.params;
  const { setActiveJob, clearActiveJob } = useActiveJobStore();
  const { screenBg, appColors } = useAppTheme();

  const [currentLocation, setCurrentLocation] = useState<LocationCoords | null>(null);
  const [towTruckRequest, setTowTruckRequest] = useState<TowTruckRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [pricing, setPricing] = useState<any | null>(null);
  const [pricingLoading, setPricingLoading] = useState(false);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  // Modal states - NFC/QR/PayPOS ödeme iptal edildi
  // const [showNFCPaymentModal, setShowNFCPaymentModal] = useState(false);
  // const [showQRPaymentModal, setShowQRPaymentModal] = useState(false);
  // const [showPayPOSPaymentModal, setShowPayPOSPaymentModal] = useState(false);

  const status = towTruckRequest ? getStatus(towTruckRequest) : null;
  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  // Fetch request from backend
  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const request = await requestsAPI.getTowTruckRequestDetail(parseInt(jobId));
      setTowTruckRequest(request);
    } catch (error) {
      console.error('Failed to fetch job detail:', error);
      Alert.alert('Hata', 'İş detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

  // Navigation handlers
  const handleBackPress = useCallback(() => {
    const currentStatus = towTruckRequest ? getStatus(towTruckRequest) : null;

    if (currentStatus === 'completed') {
      fromScreen === 'Earnings'
        ? navigation.navigate('Tabs', { screen: 'EarningsTab' })
        : navigation.navigate('Tabs', { screen: 'OrdersTab', params: { filter: 'completed' } });
    } else if (currentStatus === 'in_progress') {
      fromScreen === 'Earnings'
        ? navigation.navigate('Tabs', { screen: 'EarningsTab' })
        : navigation.navigate('Tabs', { screen: 'OrdersTab', params: { filter: 'in_progress' } });
    } else if (currentStatus === 'awaiting_approval') {
      fromScreen === 'Earnings'
        ? navigation.navigate('Tabs', { screen: 'EarningsTab' })
        : navigation.navigate('Tabs', { screen: 'OrdersTab', params: { filter: 'awaiting_approval' } });
    } else if (currentStatus === 'awaiting_payment') {
      fromScreen === 'Earnings'
        ? navigation.navigate('Tabs', { screen: 'EarningsTab' })
        : navigation.navigate('Tabs', { screen: 'OrdersTab', params: { filter: 'awaiting_payment' } });
    } else if (fromScreen === 'Earnings') {
      navigation.navigate('Tabs', { screen: 'EarningsTab' });
    } else {
      navigation.goBack();
    }
  }, [fromScreen, navigation, towTruckRequest]);

  const openInGoogleMaps = useCallback((latitude: number, longitude: number) => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      }).catch(() => {
        Alert.alert('Hata', 'Harita açılırken bir hata oluştu');
      });
    }
  }, []);

  const openPickupInGoogleMaps = useCallback(() => {
    if (!towTruckRequest) return;
    openInGoogleMaps(
      parseFloat(towTruckRequest.pickup_latitude),
      parseFloat(towTruckRequest.pickup_longitude)
    );
  }, [towTruckRequest, openInGoogleMaps]);

  const openDropoffInGoogleMaps = useCallback(() => {
    if (!towTruckRequest) return;
    openInGoogleMaps(
      parseFloat(towTruckRequest.dropoff_latitude),
      parseFloat(towTruckRequest.dropoff_longitude)
    );
  }, [towTruckRequest, openInGoogleMaps]);

  const handleCompleteJob = useCallback(() => {
    Alert.alert(
      'Bilgilendirme',
      'İşi bitirebilmeniz için müşterinin takip linkinden onay vermesi gerekmektedir.\n\nMüşteri, size gönderilen takip linkinden "Aracım Teslim Noktasına Bırakıldı" butonuna bastığında iş otomatik olarak tamamlanacaktır.',
      [{ text: 'Tamam' }]
    );
  }, []);

  const handleCancelSuccess = useCallback(() => {
    clearActiveJob();
    navigation.navigate('Tabs', { screen: 'OrdersTab' });
  }, [clearActiveJob, navigation]);

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
                serviceFilter: 'tow',
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

  useFocusEffect(
    useCallback(() => {
      fetchRequest();
    }, [fetchRequest])
  );

  useFocusEffect(
    useCallback(() => {
      const onBackPress = () => {
        handleBackPress();
        return true;
      };
      const subscription = BackHandler.addEventListener('hardwareBackPress', onBackPress);
      return () => subscription.remove();
    }, [handleBackPress])
  );

  // Aktif iş durumunu güncelle (WebSocket konum paylaşımı için)
  useEffect(() => {
    if (towTruckRequest && status) {
      if (status === 'completed' || status === 'cancelled') {
        // İş bitti - aktif iş store'unu temizle
        clearActiveJob();
      } else if (status === 'in_progress' && towTruckRequest.trackingToken) {
        // İş devam ediyor - aktif iş olarak set et
        setActiveJob(jobId, towTruckRequest.trackingToken, 'tow');
      }
    }
  }, [status, jobId, towTruckRequest, setActiveJob, clearActiveJob]);

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
        console.error('Error getting location:', error);
      }
    };
    getCurrentLocation();
  }, []);

  useEffect(() => {
    if (currentLocation && towTruckRequest) {
      const dist = calculateDistance(
        currentLocation.latitude,
        currentLocation.longitude,
        parseFloat(towTruckRequest.pickup_latitude),
        parseFloat(towTruckRequest.pickup_longitude)
      );
      setDistanceToPickup(dist);
    }
  }, [currentLocation, towTruckRequest]);

  useEffect(() => {
    const calculatePricingIfNeeded = async () => {
      if (status === 'completed' && towTruckRequest?.final_price) {
        setPricingLoading(false);
        return;
      }
      if ((status === 'in_progress' || status === 'awaiting_approval') && distanceToPickup !== null && towTruckRequest && !pricing) {
        try {
          setPricingLoading(true);
          const totalKm = distanceToPickup + towTruckRequest.estimated_km;
          if (!towTruckRequest.trackingToken) {
            setPricingLoading(false);
            return;
          }
          const pricingResult = await requestsAPI.calculateTowTruckPrice(
            towTruckRequest.trackingToken,
            parseFloat(totalKm.toFixed(2)),
            {
              isOnRoad: towTruckRequest.isOnRoad,
              isGearStuck: towTruckRequest.is_gear_stuck,
              isTireLocked: false,
              isStuck: towTruckRequest.is_stuck,
              isVehicleOperational: towTruckRequest.is_vehicle_operational,
              hasExtraAttachments: towTruckRequest.has_extra_attachments
            }
          );
          setPricing(pricingResult);
        } catch (error) {
          console.error('Fiyat hesaplama hatası:', error);
        } finally {
          setPricingLoading(false);
        }
      }
    };
    calculatePricingIfNeeded();
  }, [distanceToPickup, towTruckRequest, status, pricing]);

  // Araç durumu surcharge verileri
  const vehicleStatusSurcharges = useMemo(() => {
    const pricingSurcharges =
      pricing?.breakdown?.surcharges ||
      towTruckRequest?.my_offer?.pricing_breakdown?.surcharges ||
      towTruckRequest?.pricingBreakdown?.surcharges ||
      [];
    if (pricingSurcharges.length > 0) return pricingSurcharges;
    return (towTruckRequest?.question_answers || []).map((qa: any) => ({
      question: qa.questionText || qa.question_text || qa.question || '',
      answer: qa.selectedOptionText || qa.selected_option_text || qa.answer || '',
      amount: 0,
    }));
  }, [pricing, towTruckRequest]);

  const totalSurcharge =
    pricing?.breakdown?.total_surcharge ||
    towTruckRequest?.my_offer?.pricing_breakdown?.total_surcharge ||
    towTruckRequest?.pricingBreakdown?.total_surcharge ||
    0;

  // Loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>İş detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error state
  if (!towTruckRequest) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]}>
        <Text>İş detayı bulunamadı.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          Geri Dön
        </Button>
      </SafeAreaView>
    );
  }

  // NFC/QR/PayPOS ödeme iptal edildi - paymentAmount kullanılmıyor
  // const paymentAmount = towTruckRequest?.final_price
  //   ? Number(towTruckRequest.final_price)
  //   : towTruckRequest?.my_offer?.driver_earnings
  //     ? Number(towTruckRequest.my_offer.driver_earnings)
  //     : 0;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Çekici İş Detayı" onBackPress={handleBackPress} />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <AwaitingApprovalBanner visible={isAwaitingApproval} />

        {/* Çekici: Müşteri Ödeme Bekleniyor Ekranı */}
        {(isAwaitingApproval || isInProgress) && (
          <PhotosSection photos={towTruckRequest.photos} />
        )}

        {isInProgress && (
          <DriverPhotoUpload
            requestId={getRequestId(towTruckRequest)}
            existingPhotos={towTruckRequest.photos}
            onPhotosUploaded={fetchRequest}
          />
        )}

        {isAwaitingPayment ? (
          <CustomerPaymentWaitingCard
            visible={true}
            jobDetails={{
              finalPrice: towTruckRequest.final_price,
              driverEarnings: towTruckRequest.my_offer?.driver_earnings || towTruckRequest.final_price,
              customerName: towTruckRequest.requestOwnerNameSurname,
              vehicleType: towTruckRequest.vehicle_type,
            }}
            distanceKm={distanceToPickup}
            estimatedDuration={towTruckRequest.route_duration}
          />
        ) : (
          <>
            <HeroSection
              towTruckRequest={towTruckRequest}
              isAwaitingApproval={isAwaitingApproval}
              isInProgress={isInProgress}
              isCompleted={isCompleted}
              pricingLoading={pricingLoading}
              pricing={pricing}
            />

            {/* Harita ve konum bilgileri - onay bekleyen durumda gizle */}
            {!isAwaitingApproval && (
              <>
                <JobMapSection
                  towTruckRequest={towTruckRequest}
                  currentLocation={currentLocation}
                  distanceToPickup={distanceToPickup}
                  visible={fromScreen !== 'Earnings'}
                />

                <QuickActions
                  towTruckRequest={towTruckRequest}
                  visible={isInProgress}
                  onNavigatePickup={openPickupInGoogleMaps}
                  onNavigateDropoff={openDropoffInGoogleMaps}
                />

                <CustomerInfoCard
                  towTruckRequest={towTruckRequest}
                  visible={isInProgress}
                />

                <LocationInfoCard towTruckRequest={towTruckRequest} />
              </>
            )}

            <VehicleDetailsCard
              towTruckRequest={towTruckRequest}
              towTruckDetails={towTruckRequest.towTruckDetails}
            />

            {/* Araç Durumu ve Ek Ücretler */}
            <VehicleStatusSection
              surcharges={vehicleStatusSurcharges}
              totalSurcharge={totalSurcharge}
            />

            {/* Sigortalı iş fiyat detayı */}
            {towTruckRequest.pricing && (
              <InsurancePricingCard pricing={towTruckRequest.pricing} />
            )}

            {/* NFC/QR/PayPOS ödeme entegrasyonu iptal edildi - firma ile anlaşılamadı
            <PaymentSection
              towTruckRequest={towTruckRequest}
              visible={isInProgress}
              onNFCPayment={() => setShowNFCPaymentModal(true)}
              onQRPayment={() => setShowQRPaymentModal(true)}
              onPayPOSPayment={() => setShowPayPOSPaymentModal(true)}
            />
            */}

            <CompleteJobCard
              visible={isInProgress}
              onComplete={handleCompleteJob}
            />

            {/* Teklifi Geri Çek Butonu */}
            {isAwaitingApproval && towTruckRequest.trackingToken && (
              <Button
                icon="undo"
                mode="outlined"
                textColor="#FF9800"
                loading={withdrawLoading}
                disabled={withdrawLoading}
                style={{ marginHorizontal: 16, marginBottom: 8, borderColor: '#FF9800' }}
                onPress={() => {
                  Alert.alert('Teklifi Geri Çek', 'Teklifinizi geri çekmek istediğinize emin misiniz?', [
                    { text: 'Vazgeç', style: 'cancel' },
                    {
                      text: 'Geri Çek', style: 'destructive', onPress: async () => {
                        setWithdrawLoading(true);
                        try {
                          await requestsAPI.withdrawTowTruckOffer(towTruckRequest.trackingToken!);
                          Alert.alert('Başarılı', 'Teklifiniz geri çekildi.');
                          navigation.navigate('Tabs', { screen: 'OrdersTab' });
                        } catch (err: any) {
                          Alert.alert('Hata', err?.response?.data?.error || 'Teklif geri çekilemedi.');
                        } finally { setWithdrawLoading(false); }
                      }
                    }
                  ]);
                }}
              >
                Teklifi Geri Cek
              </Button>
            )}

            {/* İşi İptal Et Butonu */}
            {(isInProgress || isAwaitingApproval) && towTruckRequest.trackingToken && (
              <Button
                icon="cancel"
                mode="outlined"
                textColor="#F44336"
                style={{ marginHorizontal: 16, marginBottom: 16, borderColor: '#F44336' }}
                onPress={() => setShowCancelModal(true)}
              >
                İşi İptal Et
              </Button>
            )}
          </>
        )}
      </ScrollView>

      {/* NFC/QR/PayPOS ödeme entegrasyonu iptal edildi - firma ile anlaşılamadı
      <NFCPaymentModal
        visible={showNFCPaymentModal}
        onClose={() => setShowNFCPaymentModal(false)}
        amount={paymentAmount}
        currency="TL"
        jobId={jobId}
        customerName={towTruckRequest?.requestOwnerNameSurname}
        description={`Çekici Hizmeti - ${towTruckRequest?.vehicle_type || ''}`}
        onPaymentSuccess={(transactionId) => console.log('NFC ödeme başarılı:', transactionId)}
        onPaymentError={(error) => console.error('NFC ödeme hatası:', error)}
      />

      <QRPaymentModal
        visible={showQRPaymentModal}
        onClose={() => setShowQRPaymentModal(false)}
        amount={paymentAmount}
        currency="TL"
        jobId={jobId}
        customerName={towTruckRequest?.requestOwnerNameSurname}
        description={`Çekici Hizmeti - ${towTruckRequest?.vehicle_type || ''}`}
        onPaymentSuccess={(transactionId) => console.log('QR ödeme başarılı:', transactionId)}
        onPaymentError={(error) => console.error('QR ödeme hatası:', error)}
      />

      <PayPOSPaymentModal
        visible={showPayPOSPaymentModal}
        onClose={() => setShowPayPOSPaymentModal(false)}
        amount={paymentAmount}
        currency="TL"
        requestId={parseInt(jobId)}
        customerName={towTruckRequest?.requestOwnerNameSurname}
        description={`Çekici Hizmeti - ${towTruckRequest?.vehicle_type || ''}`}
        onPaymentSuccess={() => {
          console.log('PayPOS ödeme başarılı');
          // Ödeme başarılı olduğunda sayfayı yenile
          fetchRequest();
        }}
        onPaymentError={(error) => console.error('PayPOS ödeme hatası:', error)}
      />
      */}

      {/* İş İptal Modal */}
      <CancelJobModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        serviceType="tow-truck"
        trackingToken={towTruckRequest?.trackingToken || ''}
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
    paddingTop: 8,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 16,
  },
});

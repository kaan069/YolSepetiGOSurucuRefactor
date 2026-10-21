// Yol yardım iş detayı ekranı - sürücü komisyon ödeyecek
import React, { useState, useEffect, useCallback } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../utils/locationPermission';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import LoadingSpinner from '../components/LoadingSpinner';
import { RootStackParamList } from '../navigation';
import { requestsAPI } from '../api';
import type { RoadAssistanceRequestDetail } from '../api/types';
import { useActiveJobStore } from '../store/useActiveJobStore';
import AppBar from '../components/common/AppBar';
import { CommissionPaymentModal, CommissionPaymentCard, InsurancePricingCard } from '../components/payment';
import { cancelFromDetail } from '../components/payment/commission/cancelReason';
import CancelJobModal from '../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../store/useJobUpdateEventStore';
import { getProblemLabel, getProblemIcon, getVehicleTypeLabel } from './roadAssistance/constants';
import { roadProblemListLabel } from '../constants/backendLabels';
import PhotosSection from '../components/PhotosSection';
import DriverPhotoUpload from '../components/DriverPhotoUpload';
import BackgroundAppWarningModal from '../components/BackgroundAppWarningModal';
import { useBackgroundAppWarning } from '../hooks/useBackgroundAppWarning';
import { useAppTheme } from '../hooks/useAppTheme';
import { logger } from '../utils/logger';
import { FkEmptyState } from '../components/fk';
import {
  InfoRow,
  JobActions,
  JobAwaitingApprovalBanner,
  JobCompleteCard,
  JobEarningsCard,
  JobLocationCard,
  JobSection,
} from '../components/job';
import { CustomerInfoCard, ProblemDetailsCard } from './roadAssistance/components';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadAssistanceJobDetail'>;

// Mesafe hesaplama
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

// Status helper
const getStatus = (request: any): string => {
  return request?.status || 'unknown';
};

export default function RoadAssistanceJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const paymentJustCompleted = (route.params as any)?.paymentJustCompleted === true;
  const { setActiveJob, clearActiveJob } = useActiveJobStore();
  const { isDarkMode, appColors, screenBg } = useAppTheme();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [request, setRequest] = useState<RoadAssistanceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToLocation, setDistanceToLocation] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  // Komisyon ödenince modal/card kalıcı olarak gizlenir. navigation.reset sonrası yeni mount'ta da nav param'dan true gelir.
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(paymentJustCompleted);

  const status = request ? getStatus(request) : null;
  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  // Müşteri eşleşmesi gerçekleşip aktif iş başladığında uyarı popup'ı
  const bgWarning = useBackgroundAppWarning(jobId, isInProgress);

  // Request ID - backend RequestIdInfo objesi ya da raw number olarak gelebiliyor
  const requestId =
    (typeof request?.request_id === 'object' && request?.request_id !== null
      ? request.request_id.id
      : request?.request_id) ?? request?.id ?? null;

  // Fetch request detail
  const fetchRequest = useCallback(async () => {
    try {
      setLoading(true);
      const data = await requestsAPI.getRoadAssistanceRequestDetail(parseInt(jobId));
      setRequest(data);
      logger.debug('orders', 'Yol yardm i detay');
    } catch (error) {
      logger.error('orders', 'Yol yardm detay hatas');
      Alert.alert('Hata', 'Yol yardım iş detayları yüklenemedi');
    } finally {
      setLoading(false);
    }
  }, [jobId]);

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

  // WebSocket iş güncelleme event'ini dinle — sessizce detayı yenile.
  // Önceki Alert + zorla OrdersTab'a navigate yapısı kaldırıldı (UX bozuyordu).
  const { lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus } = useJobUpdateEventStore();
  useEffect(() => {
    if (lastUpdatedJobId && String(lastUpdatedJobId) === jobId) {
      useJobUpdateEventStore.getState().clear();
      fetchRequest();
    }
  }, [lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus, jobId, fetchRequest]);

  // Onay/ödeme beklerken fallback polling (10 saniyede bir)
  // Sadece WebSocket bağlantısı yoksa çalışır
  useEffect(() => {
    if (!isAwaitingApproval && !isAwaitingPayment) return;

    const { jobsWebSocket } = require('../services/jobsWebSocket');
    const interval = setInterval(() => {
      if (!jobsWebSocket.hasActiveConnections()) {
        fetchRequest();
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAwaitingApproval, isAwaitingPayment, fetchRequest]);

  // Aktif iş durumunu güncelle (WebSocket konum paylaşımı için)
  useEffect(() => {
    if (request && status) {
      if (status === 'completed' || status === 'cancelled') {
        clearActiveJob();
      } else if (status === 'in_progress' && request.tracking_token) {
        setActiveJob(jobId, request.tracking_token, 'roadAssistance');
      }
    }
  }, [status, jobId, request, setActiveJob, clearActiveJob]);

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
        logger.error('orders', 'Konum hatas');
      }
    };
    getCurrentLocation();
  }, []);

  // Mesafe hesapla
  useEffect(() => {
    if (currentLocation && request) {
      const lat = parseFloat(request.latitude || request.location_latitude || '0');
      const lng = parseFloat(request.longitude || request.location_longitude || '0');
      if (lat && lng) {
        const dist = calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng);
        setDistanceToLocation(dist);
      }
    }
  }, [currentLocation, request]);

  // Haritada aç
  const openLocationInGoogleMaps = () => {
    if (!request) return;

    const lat = parseFloat(request.latitude || request.location_latitude || '0');
    const lng = parseFloat(request.longitude || request.location_longitude || '0');

    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}${lat},${lng}?q=${lat},${lng}`,
      android: `${scheme}${lat},${lng}?q=${lat},${lng}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`);
        }
      }).catch(() => {
        Alert.alert('Hata', 'Harita açılamadı');
      });
    }
  };

  // İşi tamamla
  const handleCompleteJob = () => {
    Alert.alert(
      'Bilgilendirme',
      'İşi bitirebilmeniz için müşterinin takip linkinden onay vermesi gerekmektedir.',
      [{ text: 'Tamam' }]
    );
  };

  // İptal başarılı
  const handleCancelSuccess = () => {
    clearActiveJob();
    navigation.navigate('Tabs', { screen: 'OrdersTab' });
  };

  // Ödeme başarılı — sürücüyü "Devam Eden" sekmesi üzerinden talebin detayına yönlendir
  const handlePaymentSuccess = async () => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    setRequest((prev) => (prev ? { ...prev, status: 'in_progress' } : prev));
    navigation.reset({
      index: 1,
      routes: [
        {
          name: 'Tabs',
          params: {
            screen: 'OrdersTab',
            params: { filter: 'in_progress', serviceFilter: 'roadAssistance', timestamp: Date.now() },
          },
        } as any,
        { name: 'RoadAssistanceJobDetail', params: { jobId, paymentJustCompleted: true } } as any,
      ],
    });
  };

  // Ödeme başarısız
  const handlePaymentFailed = (errorMessage: string) => {
    logger.error('orders', 'deme hatas');
    Alert.alert('Ödeme Hatası', errorMessage);
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={{ marginTop: 16, color: appColors.text.secondary }}>Yol yardım iş detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!request) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Yol Yardım İş Detayı" />
        <FkEmptyState
          icon="file-search-outline"
          title="Yol yardım iş detayı bulunamadı"
          actionLabel="Geri Dön"
          actionVariant="secondary"
          onAction={() => navigation.goBack()}
          style={styles.container}
        />
      </SafeAreaView>
    );
  }

  // Komisyon tutarı - Backend'den gelen değeri kullan
  const finalPrice = request.final_price || request.my_offer?.driver_earnings || 0;
  const platformCommission = request.my_offer?.platform_commission || request.platform_commission || 0;
  const commissionAmount = parseFloat(platformCommission.toString());

  // Komisyon KDV bilgileri - pricing_breakdown'dan
  const pricingBreakdown = request.my_offer?.pricing_breakdown;
  const commissionVatRate = pricingBreakdown?.commission_vat_rate;
  const commissionVatAmount = pricingBreakdown?.commission_vat_amount;
  const commissionTotalWithVat = pricingBreakdown?.commission_total_with_vat;
  const paymentCommissionAmount = commissionTotalWithVat || commissionAmount;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Yol Yardım İş Detayı" />
      <ScrollView contentContainerStyle={styles.scrollContent}>

        {/* Onay Bekliyor Banner */}
        {isAwaitingApproval && <JobAwaitingApprovalBanner showTrackingNote={false} />}

        {/* Komisyon Ödeme Ekranı — ödeme bittiyse asla gösterme */}
        {isAwaitingPayment && !paymentCompleted && (
          <CommissionPaymentCard
            visible={true}
            serviceType="roadAssistance"
            jobDetails={{
              finalPrice: finalPrice,
              commissionAmount: commissionAmount,
              commissionVatRate: commissionVatRate,
              commissionVatAmount: commissionVatAmount,
              commissionTotalWithVat: commissionTotalWithVat,
              customerName: request.requestOwnerNameSurname || request.request_owner_name,
              description: `Yol Yardım - ${roadProblemListLabel(request.problem_types)}`,
            }}
            onPayCommission={() => {
              if (paymentCompleted || status !== 'awaiting_payment') return;
              setShowPaymentModal(true);
            }}
            distanceKm={distanceToLocation}
            estimatedDuration={request.estimated_duration}
          />
        )}

        {/* Kazanç Kartı */}
        {(isAwaitingApproval || isInProgress || isCompleted) && finalPrice ? (
          <JobEarningsCard
            amount={finalPrice}
            status={isCompleted ? 'completed' : isAwaitingApproval ? 'awaiting_approval' : 'in_progress'}
          />
        ) : null}

        {/* Sigortalı iş fiyat detayı */}
        {request.pricing && (
          <InsurancePricingCard pricing={request.pricing} />
        )}

        {(isAwaitingApproval || isInProgress) && (
          <PhotosSection photos={request.photos} />
        )}

        {isInProgress && (
          <DriverPhotoUpload
            requestId={requestId || 0}
            existingPhotos={request.photos}
            onPhotosUploaded={fetchRequest}
          />
        )}

        {/* Müşteri Bilgileri - Sadece devam eden işlerde */}
        {isInProgress && (
          <CustomerInfoCard
            name={request.requestOwnerNameSurname || request.request_owner_name}
            phone={request.requestOwnerPhone || request.request_owner_phone}
          />
        )}

        {/* Mesafe Bilgisi */}
        {!isAwaitingPayment && distanceToLocation !== null && (
          <JobSection title="Mesafe Bilgisi" icon="map-marker-distance">
            <InfoRow label="Müşteriye uzaklık" value={`${distanceToLocation.toFixed(1)} km`} emphasize />
          </JobSection>
        )}

        {/* Konum Kartı */}
        {!isAwaitingPayment && (
          <JobLocationCard
            title="Müşteri Konumu"
            points={[
              {
                type: 'single',
                address: request.address || request.location_address,
                latitude: request.latitude,
                longitude: request.longitude,
                directionsLabel: 'Yol Tarifi Al',
              },
            ]}
          />
        )}

        {/* Araç Problemleri */}
        {!isAwaitingPayment && (
          <ProblemDetailsCard
            vehicleType={request.vehicle_type}
            problemTypes={request.problem_types}
            problemDescription={request.description || request.problem_description || request.additional_notes}
          />
        )}

        {/* İşi Tamamla Butonu */}
        {isInProgress && <JobCompleteCard onComplete={handleCompleteJob} />}

        {/* Teklifi Geri Çek / İşi İptal Et */}
        <JobActions
          withdraw={
            isAwaitingApproval && (request.tracking_token || request.trackingToken)
              ? {
                  loading: withdrawLoading,
                  onPress: () => {
                    Alert.alert('Teklifi Geri Çek', 'Teklifinizi geri çekmek istediğinize emin misiniz?', [
                      { text: 'Vazgeç', style: 'cancel' },
                      { text: 'Geri Çek', style: 'destructive', onPress: async () => {
                        setWithdrawLoading(true);
                        try {
                          await requestsAPI.withdrawRoadAssistanceOffer((request.tracking_token || request.trackingToken)!);
                          Alert.alert('Başarılı', 'Teklifiniz geri çekildi.');
                          navigation.navigate('Tabs', { screen: 'OrdersTab' });
                        } catch (err: any) {
                          Alert.alert('Hata', err?.response?.data?.error || 'Teklif geri çekilemedi.');
                        } finally { setWithdrawLoading(false); }
                      }}
                    ]);
                  },
                }
              : null
          }
          cancel={
            (isInProgress || isAwaitingApproval) && (request.tracking_token || request.trackingToken)
              ? { onPress: () => setShowCancelModal(true) }
              : null
          }
        />
      </ScrollView>

      {/* Komisyon Ödeme Modal — başarı sonrası asla geri açılmaz */}
      <CommissionPaymentModal
        visible={showPaymentModal && !paymentCompleted}
        onClose={() => setShowPaymentModal(false)}
        requestId={requestId || 0}
        commissionAmount={paymentCommissionAmount}
        commissionBaseAmount={commissionAmount}
        commissionVatRate={commissionVatRate}
        commissionVatAmount={commissionVatAmount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
        verifyJobCleared={async () => {
          try {
            const fresh = await requestsAPI.getRoadAssistanceRequestDetail(parseInt(jobId));
            setRequest(fresh);
            const freshStatus = getStatus(fresh);
            // İptal / iş sürücüden alındı: sebebi detaydaki cancelReason belirler
            const cancel = cancelFromDetail(fresh, freshStatus);
            if (cancel) return cancel;
            return freshStatus === 'in_progress' || freshStatus === 'completed';
          } catch {
            return false;
          }
        }}
      />

      {/* İş İptal Modal */}
      <CancelJobModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        serviceType="roadAssistance"
        trackingToken={request?.tracking_token || request?.trackingToken || ''}
        onCancelSuccess={handleCancelSuccess}
      />

      {/* Aktif iş başlangıcında arka plan uyarısı */}
      <BackgroundAppWarningModal visible={bgWarning.visible} onDismiss={bgWarning.dismiss} />
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

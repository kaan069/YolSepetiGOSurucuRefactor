// Transfer is detay ekrani
import React, { useState, useEffect, useRef } from 'react';
import { StyleSheet, ScrollView, Alert, View, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, TransferRequest } from '../../api';
import { transferAPI } from '../../api/requests';
import type { TransferRequestDetail } from '../../api/types';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useNakliyeLocationStore } from '../../store/useNakliyeLocationStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CommissionPaymentModal, CommissionPaymentCard, InsurancePricingCard } from '../../components/payment';
import { cancelFromDetail } from '../../components/payment/commission/cancelReason';
import CancelJobModal from '../../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../../store/useJobUpdateEventStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import PhotosSection from '../../components/PhotosSection';
import DriverPhotoUpload from '../../components/DriverPhotoUpload';
import BackgroundAppWarningModal from '../../components/BackgroundAppWarningModal';
import { useBackgroundAppWarning } from '../../hooks/useBackgroundAppWarning';
import { logger } from '../../utils/logger';
import { FkCard, FkEmptyState, FkIconChip, FkInfoBanner, FkPill } from '../../components/fk';
import {
  InfoRow,
  JobActions,
  JobCompleteCard,
  JobCustomerCard,
  JobEarningsCard,
  JobLocationCard,
  JobSection,
  JobScheduleCard,
} from '../../components/job';
import { StartTripCard } from '../nakliye/components';
import { colors, getStatusStyle, spacing, text } from '../../theme/design';
import { getScheduleInfo } from '../../utils/schedule';
import { transferTypeLabel, transferVehicleLabel } from '../../constants/backendLabels';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferJobDetail'>;

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

// Request ID helper - object veya number formatini handle eder
const getRequestId = (request: TransferRequest): number => {
  if (!request.request_id) return 0;
  if (typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.id;
  }
  return request.request_id as any;
};

// Status helper
const getStatus = (request: TransferRequest): string => {
  if (request.status) return request.status;
  if (request.request_id && typeof request.request_id === 'object' && request.request_id !== null) {
    return (request.request_id as any).status || 'unknown';
  }
  return 'unknown';
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

// Hero section renk ve ikon
const getHeroConfig = (status: string) => {
  switch (status) {
    case 'awaiting_approval':
      return { icon: 'clock-outline' as const, label: 'Onay Bekleniyor', description: 'Teklif gönderildi, müşteri onayı bekleniyor' };
    case 'awaiting_payment':
      return { icon: 'credit-card-outline' as const, label: 'Ödeme Bekleniyor', description: 'Müşteri onayladı, ödeme bekleniyor' };
    case 'in_progress':
      return { icon: 'car-connected' as const, label: 'Devam Ediyor', description: 'İş devam ediyor' };
    case 'completed':
      return { icon: 'check-circle' as const, label: 'Tamamlandı', description: 'İş başarıyla tamamlandı' };
    case 'cancelled':
      return { icon: 'cancel' as const, label: 'İptal Edildi', description: 'İş iptal edildi' };
    default:
      return { icon: 'information-outline' as const, label: 'Bilinmiyor', description: '' };
  }
};

export default function TransferJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const paymentJustCompleted = (route.params as any)?.paymentJustCompleted === true;
  const { isLocationSharing, startLocationSharing, stopLocationSharing } = useNakliyeLocationStore();
  const { isDarkMode, screenBg, cardBg, appColors } = useAppTheme();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [transferRequest, setTransferRequest] = useState<TransferRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  // Komisyon ödenince modal/card kalıcı olarak gizlenir. navigation.reset sonrası yeni mount'ta da nav param'dan true gelir.
  const [paymentCompleted, setPaymentCompleted] = useState<boolean>(paymentJustCompleted);
  const { showNotification } = useNotificationStore();

  const status = transferRequest ? getStatus(transferRequest) : null;
  const requestId = transferRequest ? getRequestId(transferRequest) : null;
  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  // Komisyon ödendikten sonra (artık aktif iş) uyarı popup'ı
  const bgWarning = useBackgroundAppWarning(jobId, isInProgress);

  // Istek detayini getir
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const request = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
        setTransferRequest(request);
      } catch (error: any) {
        Alert.alert('Hata', 'Transfer iş detayları yüklenemedi');
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [jobId]);

  // WebSocket iptal event'ini dinle
  const { lastCancelledJobId, lastCancelledAt } = useCancellationEventStore();
  useEffect(() => {
    if (lastCancelledJobId && String(lastCancelledJobId) === jobId) {
      const refetch = async () => {
        try {
          const request = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
          setTransferRequest(request);
        } catch (error) {
          // Iptal sonrasi detay alinamazsa yoksay
        }
      };
      refetch();
    }
  }, [lastCancelledJobId, lastCancelledAt, jobId]);

  // WebSocket is guncelleme event'ini dinle (odeme yapildiginda vs.)
  const { lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus } = useJobUpdateEventStore();
  const lastShownUpdateKeyRef = useRef<string | null>(null);
  useEffect(() => {
    if (lastUpdatedJobId && String(lastUpdatedJobId) === jobId) {
      if (lastUpdatedStatus) {
        const eventKey = `${lastUpdatedJobId}-${lastUpdatedStatus}`;
        if (lastShownUpdateKeyRef.current === eventKey) return;
        lastShownUpdateKeyRef.current = eventKey;
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
                serviceFilter: 'transfer',
                timestamp: Date.now(),
              },
            });
          },
        }]);
      } else {
        const refetch = async () => {
          try {
            const request = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
            setTransferRequest(request);
          } catch (error) {
            // Guncelleme sonrasi detay alinamazsa yoksay
          }
        };
        refetch();
      }
    }
  }, [lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus, jobId, navigation]);

  // Onay/odeme beklerken fallback polling (10 saniyede bir)
  useEffect(() => {
    if (!isAwaitingApproval && !isAwaitingPayment) return;

    const { jobsWebSocket } = require('../../services/jobsWebSocket');
    const interval = setInterval(async () => {
      if (!jobsWebSocket.hasActiveConnections()) {
        try {
          const request = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
          setTransferRequest(request);
        } catch (error) {
          // Polling hatasi yoksay
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAwaitingApproval, isAwaitingPayment, jobId]);

  // Is tamamlandiginda veya iptal edildiginde konum paylasimini durdur
  useEffect(() => {
    if (transferRequest && status) {
      if (status === 'completed' || status === 'cancelled') {
        stopLocationSharing();
      }
    }
  }, [status, transferRequest, stopLocationSharing]);

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

  // Mesafe hesapla (alis noktasina)
  useEffect(() => {
    if (currentLocation && transferRequest) {
      const pickupLat = parseFloat(transferRequest.pickup_latitude || '0');
      const pickupLng = parseFloat(transferRequest.pickup_longitude || '0');
      setDistanceToPickup(
        calculateDistance(currentLocation.latitude, currentLocation.longitude, pickupLat, pickupLng)
      );
    }
  }, [currentLocation, transferRequest]);

  // Randevulu talep (yola çıkış backend'de departedAt ile tutulur)
  const schedule = getScheduleInfo(transferRequest);

  // Yola cik - konum paylasimini baslat + backend'e bildir
  const [departLoading, setDepartLoading] = useState(false);
  const [hasDeparted, setHasDeparted] = useState(false);

  const handleStartLocationSharing = async () => {
    if (!transferRequest?.trackingToken) return;

    setDepartLoading(true);
    try {
      // Backend'e yola çıkış bildir (müşteriye SMS gider)
      if (!hasDeparted && !schedule.departedAt) {
        await transferAPI.depart(transferRequest.trackingToken);
        setHasDeparted(true);
      }
      // Konum paylaşımını başlat
      startLocationSharing(transferRequest.trackingToken, jobId, 'city');
      Alert.alert('Yola Çıkış', 'Yola çıkış bildirildi ve konum paylaşımı başlatıldı. Müşteriye SMS gönderildi.');
    } catch (err: any) {
      // Depart başarısız olsa bile konum paylaşımını başlat
      startLocationSharing(transferRequest.trackingToken, jobId, 'city');
      Alert.alert('Konum Paylaşımı', 'Konum paylaşımı başlatıldı.');
    } finally {
      setDepartLoading(false);
    }
  };

  // Konum paylasimini durdur
  const handleStopLocationSharing = () => {
    Alert.alert(
      'Konum Paylaşımı',
      'Konum paylaşımını durdurmak istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Durdur',
          style: 'destructive',
          onPress: () => stopLocationSharing(),
        },
      ]
    );
  };

  // Isi tamamla
  const handleCompleteJob = () => {
    Alert.alert(
      'Bilgilendirme',
      'İşi bitirebilmeniz için müşterinin takip linkinden onay vermesi gerekmektedir.',
      [{ text: 'Tamam' }]
    );
  };

  // Teklifi geri cek
  const handleWithdrawOffer = () => {
    Alert.alert(
      'Teklifi Geri Çek',
      'Teklifinizi geri çekmek istediğinize emin misiniz?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        {
          text: 'Geri Çek',
          style: 'destructive',
          onPress: async () => {
            if (!transferRequest?.trackingToken) return;
            setWithdrawLoading(true);
            try {
              const response = await transferAPI.withdrawOffer(transferRequest.trackingToken);
              showNotification('success', response.message || 'Teklifiniz geri çekildi');
              navigation.navigate('Tabs', {
                screen: 'OrdersTab',
                params: { filter: 'pending', serviceFilter: 'transfer', timestamp: Date.now() },
              });
            } catch (error: any) {
              const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Teklif geri çekilemedi';
              showNotification('error', errorMessage, 6000);
            } finally {
              setWithdrawLoading(false);
            }
          },
        },
      ]
    );
  };

  // Haritada konuma git
  const openInMaps = (lat: string, lng: string, label: string) => {
    const latitude = parseFloat(lat);
    const longitude = parseFloat(lng);
    const url = Platform.select({
      ios: `maps:0,0?q=${label}@${latitude},${longitude}`,
      android: `geo:0,0?q=${latitude},${longitude}(${label})`,
    });
    if (url) {
      Linking.openURL(url).catch(() => {
        Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
      });
    }
  };

  // Iptal basarili
  const handleCancelSuccess = () => {
    stopLocationSharing();
    navigation.navigate('Tabs', { screen: 'OrdersTab' });
  };

  // Odeme basarili — surucuyu "Devam Eden" sekmesi uzerinden talebin detayina yonlendir
  const handlePaymentSuccess = async () => {
    setPaymentCompleted(true);
    setShowPaymentModal(false);
    setTransferRequest((prev) => (prev ? { ...prev, status: 'in_progress' } : prev));
    // Yola çıkılmamış randevulu iş Devam Eden'de değil Randevulu İşlerim'de; geri dönüş oraya
    const waitingDeparture = schedule.isScheduled && !schedule.departedAt;
    navigation.reset({
      index: waitingDeparture ? 2 : 1,
      routes: [
        {
          name: 'Tabs',
          params: {
            screen: 'OrdersTab',
            params: { filter: 'in_progress', serviceFilter: 'transfer', timestamp: Date.now() },
          },
        } as any,
        ...(waitingDeparture ? [{ name: 'ScheduledJobs' } as any] : []),
        { name: 'TransferJobDetail', params: { jobId, paymentJustCompleted: true } } as any,
      ],
    });
  };

  const handlePaymentFailed = (errorMessage: string) => {
    Alert.alert('Ödeme Hatası', errorMessage);
  };

  // Telefon arama
  const handleCallCustomer = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Hata', 'Telefon araması yapılamıyor');
      }
    });
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Transfer iş detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!transferRequest) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Transfer İş Detayı" />
        <FkEmptyState
          icon="file-search-outline"
          title="Transfer iş detayı bulunamadı"
          actionLabel="Geri Dön"
          actionVariant="secondary"
          onAction={() => navigation.goBack()}
          style={styles.container}
        />
      </SafeAreaView>
    );
  }

  const heroConfig = getHeroConfig(status || 'unknown');
  const heroStatus = getStatusStyle(status);
  const isVip = transferRequest.transfer_type === 'vip';
  const transferTypeText = transferTypeLabel(transferRequest.transfer_type);
  const vehiclePrefLabel = transferRequest.vehicle_preference
    ? transferVehicleLabel(transferRequest.vehicle_preference)
    : null;

  // Kazanc bilgisini my_offer'dan al
  const driverEarnings = transferRequest.my_offer?.driver_earnings
    ? parseFloat(transferRequest.my_offer.driver_earnings)
    : transferRequest.final_price || 0;

  // Toplam fiyat (musterinin odedigi)
  const totalPrice = transferRequest.my_offer?.estimated_price
    ? parseFloat(transferRequest.my_offer.estimated_price)
    : transferRequest.final_price || 0;

  // Platform komisyonu
  const platformCommission = transferRequest.my_offer?.platform_commission
    ? parseFloat(transferRequest.my_offer.platform_commission)
    : transferRequest.platform_commission
    ? parseFloat(transferRequest.platform_commission)
    : 0;

  // Komisyon KDV bilgileri
  const pricingBreakdown = transferRequest.my_offer?.pricing_breakdown;
  const commissionVatRate = pricingBreakdown?.commission_vat_rate;
  const commissionVatAmount = pricingBreakdown?.commission_vat_amount;
  const commissionTotalWithVat = pricingBreakdown?.commission_total_with_vat;
  const paymentCommissionAmount = commissionTotalWithVat || platformCommission;

  // Backend'den gelen mesafe
  const distanceFromBackend = transferRequest.distance_to_location_km ||
    transferRequest.my_offer?.pricing_breakdown?.distance_km as number | undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Transfer İş Detayı" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Durum özeti */}
        <FkCard style={styles.heroCard}>
          <View style={styles.heroRow}>
            <FkIconChip
              icon={heroConfig.icon}
              size={52}
              shape="circle"
              backgroundColor={heroStatus.bg}
              iconColor={heroStatus.text}
            />
            <View style={styles.heroTexts}>
              <Text style={[styles.heroTitle, { color: appColors.text.primary }]}>{heroConfig.label}</Text>
              {heroConfig.description ? (
                <Text style={[styles.heroDescription, { color: appColors.text.secondary }]}>{heroConfig.description}</Text>
              ) : null}
            </View>
          </View>
        </FkCard>

        {/* Randevulu iş: tarih/saat + Bugün / Gecikti */}
        {schedule.isScheduled && !isCompleted && <JobScheduleCard info={schedule} context="job" />}

        {/* Yola Çık / Konum Paylaşımı */}
        <StartTripCard
          visible={isInProgress}
          isLocationSharing={isLocationSharing}
          loading={departLoading}
          onStartTrip={handleStartLocationSharing}
          onStopTrip={handleStopLocationSharing}
          description='Transfer zamanı geldiğinde "Yola Çık" butonuna basarak müşteri ile canlı konum paylaşımı başlatabilirsiniz.'
        />

        {/* Komisyon Ödeme Kartı — ödeme bittiyse asla gösterme */}
        {isAwaitingPayment && !paymentCompleted && (
          <CommissionPaymentCard
            visible={true}
            serviceType="transfer"
            jobDetails={{
              finalPrice: totalPrice,
              commissionAmount: platformCommission,
              commissionVatRate: commissionVatRate,
              commissionVatAmount: commissionVatAmount,
              commissionTotalWithVat: commissionTotalWithVat,
              customerName: transferRequest.requestOwnerNameSurname,
              description: `Transfer Hizmeti - ${transferTypeText}`,
            }}
            onPayCommission={() => {
              if (paymentCompleted || status !== 'awaiting_payment') return;
              setShowPaymentModal(true);
            }}
            distanceKm={distanceFromBackend || distanceToPickup}
            estimatedDuration={transferRequest.estimated_duration_hours}
          />
        )}

        {/* Kazanç Kartı */}
        {(isAwaitingApproval || isInProgress || isCompleted) && driverEarnings > 0 && (
          <JobEarningsCard
            amount={driverEarnings}
            status={isCompleted ? 'completed' : isAwaitingApproval ? 'awaiting_approval' : 'in_progress'}
            label={isCompleted ? 'Kazancınız' : 'Tahmini Kazanç'}
          />
        )}

        {/* Müşteri Bilgileri - Sadece devam eden işlerde */}
        {isInProgress && (
          <JobCustomerCard
            name={transferRequest.requestOwnerNameSurname}
            phone={transferRequest.requestOwnerPhone}
            showCallButton
          />
        )}

        {/* Mesafe Bilgisi */}
        {!isAwaitingPayment && distanceToPickup !== null && (
          <JobSection>
            <InfoRow
              icon="map-marker-distance"
              label="Alış noktasına uzaklık"
              value={`${distanceToPickup} km`}
              emphasize
              valueColor={colors.primary[600]}
            />
          </JobSection>
        )}

        {/* Transfer Detayları */}
        {!isAwaitingPayment && (
          <JobSection
            title="Transfer Detayları"
            icon="car-connected"
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
        )}

        {/* Alış / Bırakış Adresleri */}
        {!isAwaitingPayment && !isAwaitingApproval && (
          <JobLocationCard
            title="Adresler"
            points={[
              {
                type: 'pickup',
                label: 'Alış Adresi',
                address: transferRequest.pickup_address,
                latitude: transferRequest.pickup_latitude,
                longitude: transferRequest.pickup_longitude,
                directionsLabel:
                  isInProgress && transferRequest.pickup_latitude && transferRequest.pickup_longitude
                    ? 'Alış Noktasına Git'
                    : undefined,
              },
              ...(transferRequest.dropoff_address
                ? [
                    {
                      type: 'dropoff' as const,
                      label: 'Bırakış Adresi',
                      address: transferRequest.dropoff_address,
                      latitude: transferRequest.dropoff_latitude,
                      longitude: transferRequest.dropoff_longitude,
                      directionsLabel:
                        isInProgress && transferRequest.dropoff_latitude && transferRequest.dropoff_longitude
                          ? 'Teslim Noktasına Git'
                          : undefined,
                    },
                  ]
                : []),
            ]}
          />
        )}

        {/* Dönüş Bilgileri (gidiş-dönüş ise) */}
        {!isAwaitingPayment && transferRequest.is_round_trip && (
          transferRequest.return_same_route ? (
            <JobSection title="Dönüş Bilgileri" icon="swap-horizontal">
              <InfoRow icon="map-marker-path" label="Dönüş" value="Aynı rota üzerinden dönüş" />
            </JobSection>
          ) : (
            <JobLocationCard
              title="Dönüş Bilgileri"
              icon="swap-horizontal"
              points={[
                ...(transferRequest.return_pickup_location
                  ? [
                      {
                        type: 'pickup' as const,
                        label: 'Dönüş Alış',
                        address: transferRequest.return_pickup_location.address,
                        latitude: transferRequest.return_pickup_location.latitude,
                        longitude: transferRequest.return_pickup_location.longitude,
                        directionsLabel: isInProgress ? 'Konuma Git' : undefined,
                      },
                    ]
                  : []),
                ...(transferRequest.return_dropoff_location
                  ? [
                      {
                        type: 'dropoff' as const,
                        label: 'Dönüş Bırakış',
                        address: transferRequest.return_dropoff_location.address,
                        latitude: transferRequest.return_dropoff_location.latitude,
                        longitude: transferRequest.return_dropoff_location.longitude,
                        directionsLabel: isInProgress ? 'Konuma Git' : undefined,
                      },
                    ]
                  : []),
              ]}
            />
          )
        )}

        {/* Fotoğraflar */}
        {(isAwaitingApproval || isInProgress) && (
          <PhotosSection photos={transferRequest.photos} />
        )}

        {/* Sürücü Fotoğraf Yükleme */}
        {isInProgress && (
          <DriverPhotoUpload
            requestId={getRequestId(transferRequest)}
            existingPhotos={transferRequest.photos}
            onPhotosUploaded={async () => {
              try {
                const updated = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
                setTransferRequest(updated);
              } catch {}
            }}
          />
        )}

        {/* Sigortalı iş fiyat detayı */}
        {transferRequest.pricing && (
          <InsurancePricingCard pricing={transferRequest.pricing} />
        )}

        {/* İşi Tamamla */}
        {isInProgress && <JobCompleteCard onComplete={handleCompleteJob} />}

        {/* Teklifi Geri Çek (onay beklerken) / İşi İptal Et (devam ederken) */}
        <JobActions
          withdraw={
            isAwaitingApproval && transferRequest.trackingToken
              ? { onPress: handleWithdrawOffer, loading: withdrawLoading }
              : null
          }
          cancel={isInProgress && transferRequest.trackingToken ? { onPress: () => setShowCancelModal(true) } : null}
        />
      </ScrollView>

      {/* Odeme Modal — basari sonrasi asla geri acilmaz */}
      <CommissionPaymentModal
        visible={showPaymentModal && !paymentCompleted}
        onClose={() => setShowPaymentModal(false)}
        requestId={requestId || 0}
        commissionAmount={paymentCommissionAmount}
        commissionBaseAmount={platformCommission}
        commissionVatRate={commissionVatRate}
        commissionVatAmount={commissionVatAmount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
        verifyJobCleared={async () => {
          try {
            const fresh = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
            setTransferRequest(fresh);
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

      {/* Is Iptal Modal */}
      <CancelJobModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        serviceType="transfer"
        trackingToken={transferRequest?.trackingToken || ''}
        onCancelSuccess={handleCancelSuccess}
      />

      {/* Aktif is baslangicinda arka plan uyarisi */}
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
    padding: spacing.md,
    paddingBottom: 100,
  },
  loadingText: {
    marginTop: spacing.md,
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  heroTexts: {
    flex: 1,
  },
  heroTitle: {
    ...text.section,
  },
  heroDescription: {
    ...text.meta,
    marginTop: 2,
  },
  tripPill: {
    marginTop: spacing.sm + 4,
  },
  block: {
    marginTop: spacing.sm + 4,
  },
});

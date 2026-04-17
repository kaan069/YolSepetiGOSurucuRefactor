// Vinç iş detay ekranı
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, CraneRequest } from '../../api';
import { useActiveJobStore } from '../../store/useActiveJobStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CommissionPaymentModal, CommissionPaymentCard, InsurancePricingCard } from '../../components/payment';
import CancelJobModal from '../../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../../store/useJobUpdateEventStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  StatusBanner,
  EarningsCard,
  CustomerInfoCard,
  LocationCard,
  DistanceCard,
  LoadDetailsCard,
  DurationCard,
} from './components';
import { calculateDistance, getStatus, getRequestId } from './constants';
import PhotosSection from '../../components/PhotosSection';
import DriverPhotoUpload from '../../components/DriverPhotoUpload';

type Props = NativeStackScreenProps<RootStackParamList, 'CraneJobDetail'>;

export default function CraneJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { setActiveJob, clearActiveJob } = useActiveJobStore();
  const { screenBg, appColors } = useAppTheme();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [craneRequest, setCraneRequest] = useState<CraneRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToLocation, setDistanceToLocation] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const status = craneRequest ? getStatus(craneRequest) : null;
  const requestId = craneRequest ? getRequestId(craneRequest) : null;

  // İstek detayını getir
  // Earnings ekranından gelen jobId, ServiceRequest ID olabilir (CraneRequestDetails ID değil)
  // Bu yüzden 404 hatası alırsan tamamlanan işlerde ServiceRequest ID ile ara
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const request = await requestsAPI.getCraneRequestDetail(parseInt(jobId));
        setCraneRequest(request);
      } catch (error: any) {
        // 404 hatası - Kazanç ekranından gelen ID ServiceRequest ID olabilir
        // CraneRequestDetails ID ile eşleşmeyebilir, tamamlanan işlerde ara
        if (error?.response?.status === 404) {
          const fallback = await requestsAPI.findCraneByServiceRequestId(parseInt(jobId));
          if (fallback) {
            setCraneRequest(fallback);
          } else {
            Alert.alert('Hata', 'Vinç iş detayları bulunamadı');
          }
        } else {
          Alert.alert('Hata', 'Vinç iş detayları yüklenemedi');
        }
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
          const request = await requestsAPI.getCraneRequestDetail(parseInt(jobId));
          setCraneRequest(request);
        } catch (error) {
          // İptal sonrası detay alınamazsa yoksay
        }
      };
      refetch();
    }
  }, [lastCancelledJobId, lastCancelledAt, jobId]);

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
                serviceFilter: 'crane',
                timestamp: Date.now(),
              },
            });
          },
        }]);
      } else {
        const refetch = async () => {
          try {
            const request = await requestsAPI.getCraneRequestDetail(parseInt(jobId));
            setCraneRequest(request);
          } catch (error) {
            // Güncelleme sonrası detay alınamazsa yoksay
          }
        };
        refetch();
      }
    }
  }, [lastUpdatedJobId, lastUpdatedAt, lastUpdatedStatus, jobId, navigation]);

  // Onay/ödeme beklerken fallback polling (10 saniyede bir)
  // Sadece WebSocket bağlantısı yoksa çalışır
  useEffect(() => {
    if (!isAwaitingApproval && !isAwaitingPayment) return;

    const { jobsWebSocket } = require('../../services/jobsWebSocket');
    const interval = setInterval(async () => {
      if (!jobsWebSocket.hasActiveConnections()) {
        try {
          const request = await requestsAPI.getCraneRequestDetail(parseInt(jobId));
          setCraneRequest(request);
        } catch (error) {
          // Polling hatası yoksay
        }
      }
    }, 10000);

    return () => clearInterval(interval);
  }, [isAwaitingApproval, isAwaitingPayment, jobId]);

  // Aktif iş durumunu güncelle (WebSocket konum paylaşımı için)
  useEffect(() => {
    if (craneRequest && status) {
      if (status === 'completed' || status === 'cancelled') {
        clearActiveJob();
      } else if (status === 'in_progress' && craneRequest.trackingToken) {
        setActiveJob(jobId, craneRequest.trackingToken, 'crane');
      }
    }
  }, [status, jobId, craneRequest, setActiveJob, clearActiveJob]);

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
        console.error('Konum alınamadı:', error);
      }
    };
    getCurrentLocation();
  }, []);

  // Mesafe hesapla
  useEffect(() => {
    if (currentLocation && craneRequest) {
      const locationLat = parseFloat(craneRequest.latitude || '0');
      const locationLng = parseFloat(craneRequest.longitude || '0');
      setDistanceToLocation(
        calculateDistance(currentLocation.latitude, currentLocation.longitude, locationLat, locationLng)
      );
    }
  }, [currentLocation, craneRequest]);

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

  // Ödeme başarılı
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    try {
      const updatedRequest = await requestsAPI.getCraneRequestDetail(parseInt(jobId));
      setCraneRequest(updatedRequest);
    } catch (error) {
      console.error('Yenileme hatası:', error);
    }
    Alert.alert('Ödeme Başarılı', 'Komisyon ödemesi tamamlandı.', [{ text: 'Tamam' }]);
  };

  const handlePaymentFailed = (errorMessage: string) => {
    Alert.alert('Ödeme Hatası', errorMessage);
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Vinç iş detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!craneRequest) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Vinç İş Detayı" />
        <Text>Vinç iş detayı bulunamadı.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          Geri Dön
        </Button>
      </SafeAreaView>
    );
  }

  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  const estimatedDuration = craneRequest.estimated_duration_hours || craneRequest.estimatedDurationHours;

  // Kazanç bilgisini my_offer'dan al (backend driver_earnings olarak gönderiyor)
  const driverEarnings = craneRequest.my_offer?.driver_earnings
    ? parseFloat(craneRequest.my_offer.driver_earnings)
    : craneRequest.final_price || 0;

  // Toplam fiyat (müşterinin ödediği)
  const totalPrice = craneRequest.my_offer?.estimated_price
    ? parseFloat(craneRequest.my_offer.estimated_price)
    : craneRequest.final_price || 0;

  // Platform komisyonu - Backend'den gelen değeri kullan
  const platformCommission = craneRequest.my_offer?.platform_commission
    ? parseFloat(craneRequest.my_offer.platform_commission)
    : craneRequest.platform_commission
    ? parseFloat(craneRequest.platform_commission)
    : 0;

  // Komisyon KDV bilgileri - pricing_breakdown'dan
  const pricingBreakdown = craneRequest.my_offer?.pricing_breakdown;
  const commissionVatRate = pricingBreakdown?.commission_vat_rate;
  const commissionVatAmount = pricingBreakdown?.commission_vat_amount;
  const commissionTotalWithVat = pricingBreakdown?.commission_total_with_vat;
  // iyzico'ya giden tutar: KDV dahil (varsa), yoksa mevcut komisyon
  const paymentCommissionAmount = commissionTotalWithVat || platformCommission;

  // Backend'den gelen mesafe
  const distanceFromBackend = craneRequest.distance_to_location_km ||
    craneRequest.my_offer?.pricing_breakdown?.distance_km as number | undefined;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Vinç İş Detayı" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Onay Bekleniyor Banner */}
        {isAwaitingApproval && <StatusBanner type="awaiting_approval" />}

        {/* Komisyon Ödeme Kartı */}
        {isAwaitingPayment && (
          <CommissionPaymentCard
            visible={true}
            serviceType="crane"
            jobDetails={{
              finalPrice: totalPrice,
              commissionAmount: platformCommission,
              commissionVatRate: commissionVatRate,
              commissionVatAmount: commissionVatAmount,
              commissionTotalWithVat: commissionTotalWithVat,
              customerName: craneRequest.requestOwnerNameSurname,
              description: `Vinç Hizmeti - ${craneRequest.load_type || 'Yük'} (${craneRequest.load_weight || '?'} kg)`,
            }}
            onPayCommission={() => setShowPaymentModal(true)}
            distanceKm={distanceFromBackend || distanceToLocation}
            estimatedDuration={estimatedDuration}
          />
        )}

        {/* Kazanç Kartı */}
        {(isAwaitingApproval || isInProgress || isCompleted) && driverEarnings > 0 && (
          <EarningsCard
            amount={driverEarnings}
            status={status as 'awaiting_approval' | 'in_progress' | 'completed'}
          />
        )}

        {/* Müşteri Bilgileri - Sadece devam eden işlerde */}
        {isInProgress && (
          <CustomerInfoCard
            name={craneRequest.requestOwnerNameSurname}
            phone={craneRequest.requestOwnerPhone}
          />
        )}

        {/* Mesafe Bilgisi */}
        {!isAwaitingPayment && distanceToLocation !== null && (
          <DistanceCard distance={distanceToLocation} />
        )}

        {/* Konum Kartı - Onay bekleyenlerde gizle */}
        {!isAwaitingPayment && !isAwaitingApproval && (
          <LocationCard
            address={craneRequest.address || ''}
            latitude={parseFloat(craneRequest.latitude || '0')}
            longitude={parseFloat(craneRequest.longitude || '0')}
          />
        )}

        {/* Yük Detayları */}
        {!isAwaitingPayment && (
          <LoadDetailsCard
            loadType={craneRequest.load_type}
            loadWeight={craneRequest.load_weight}
            liftHeight={craneRequest.lift_height}
            floor={craneRequest.floor}
            hasObstacles={craneRequest.has_obstacles}
            obstacleNote={craneRequest.obstacle_note}
          />
        )}

        {/* İş Süresi */}
        {!isAwaitingPayment && estimatedDuration && (
          <DurationCard hours={estimatedDuration} />
        )}

        {(isAwaitingApproval || isInProgress) && (
          <PhotosSection photos={craneRequest.photos} />
        )}

        {isInProgress && (
          <DriverPhotoUpload
            requestId={getRequestId(craneRequest)}
            existingPhotos={craneRequest.photos}
            onPhotosUploaded={async () => {
              try {
                const updated = await requestsAPI.getCraneRequestDetail(parseInt(jobId));
                setCraneRequest(updated);
              } catch {}
            }}
          />
        )}

        {/* Sigortalı iş fiyat detayı */}
        {craneRequest.pricing && (
          <InsurancePricingCard pricing={craneRequest.pricing} />
        )}

        {/* İşi Tamamla Butonu */}
        {isInProgress && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                icon="check-circle"
                mode="contained"
                buttonColor="#4CAF50"
                contentStyle={{ paddingVertical: 8 }}
                onPress={handleCompleteJob}
              >
                İşi Tamamla
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Teklifi Geri Çek Butonu */}
        {isAwaitingApproval && craneRequest.trackingToken && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                icon="undo"
                mode="outlined"
                textColor="#FF9800"
                loading={withdrawLoading}
                disabled={withdrawLoading}
                style={{ borderColor: '#FF9800' }}
                onPress={() => {
                  Alert.alert('Teklifi Geri Çek', 'Teklifinizi geri çekmek istediğinize emin misiniz?', [
                    { text: 'Vazgeç', style: 'cancel' },
                    { text: 'Geri Çek', style: 'destructive', onPress: async () => {
                      setWithdrawLoading(true);
                      try {
                        await requestsAPI.withdrawCraneOffer(craneRequest.trackingToken!);
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
            </Card.Content>
          </Card>
        )}

        {/* İşi İptal Et Butonu */}
        {(isInProgress || isAwaitingApproval) && craneRequest.trackingToken && (
          <Card style={styles.card}>
            <Card.Content>
              <Button
                icon="cancel"
                mode="outlined"
                textColor="#F44336"
                style={{ borderColor: '#F44336' }}
                onPress={() => setShowCancelModal(true)}
              >
                İşi İptal Et
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Ödeme Modal */}
      <CommissionPaymentModal
        visible={showPaymentModal}
        onClose={() => setShowPaymentModal(false)}
        requestId={requestId || 0}
        commissionAmount={paymentCommissionAmount}
        commissionBaseAmount={platformCommission}
        commissionVatRate={commissionVatRate}
        commissionVatAmount={commissionVatAmount}
        onPaymentSuccess={handlePaymentSuccess}
        onPaymentFailed={handlePaymentFailed}
      />

      {/* İş İptal Modal */}
      <CancelJobModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        serviceType="crane"
        trackingToken={craneRequest?.trackingToken || ''}
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
    padding: 16,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  card: {
    marginBottom: 16,
  },
  loadingText: {
    marginTop: 16,
  },
  backButton: {
    marginTop: 16,
  },
});

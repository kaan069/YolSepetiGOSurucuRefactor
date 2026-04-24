// Yol yardım iş detayı ekranı - sürücü komisyon ödeyecek
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button } from 'react-native-paper';
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
import CancelJobModal from '../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../store/useJobUpdateEventStore';
import { getServiceTypeLabel, getProblemLabel, getProblemIcon, getVehicleTypeLabel } from './roadAssistance/constants';
import PhotosSection from '../components/PhotosSection';
import DriverPhotoUpload from '../components/DriverPhotoUpload';
import { useAppTheme } from '../hooks/useAppTheme';
import { logger } from '../utils/logger';

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
  const { setActiveJob, clearActiveJob } = useActiveJobStore();
  const { isDarkMode, appColors, screenBg } = useAppTheme();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [request, setRequest] = useState<RoadAssistanceRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToLocation, setDistanceToLocation] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);

  const status = request ? getStatus(request) : null;
  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

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

  // WebSocket iş güncelleme event'ini dinle (ödeme yapıldığında vs.)
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
                serviceFilter: 'roadAssistance',
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

  // Ödeme başarılı
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    logger.debug('orders', 'Komisyon deme baarl');
    try {
      const updatedRequest = await requestsAPI.getRoadAssistanceRequestDetail(parseInt(jobId));
      setRequest(updatedRequest);
    } catch (error) {
      logger.error('orders', 'Yenileme hatas');
    }
    Alert.alert('Ödeme Başarılı', 'Komisyon ödemesi tamamlandı. İş artık devam ediyor.', [{ text: 'Tamam' }]);
  };

  // Ödeme başarısız
  const handlePaymentFailed = (errorMessage: string) => {
    logger.error('orders', 'deme hatas');
    Alert.alert('Ödeme Hatası', errorMessage);
  };

  // Dynamic colors
  const bannerBg = isDarkMode ? '#2a2200' : '#FFF9C4';
  const bannerTitleColor = isDarkMode ? '#FFB74D' : '#E65100';
  const earningsBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';
  const distanceBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const distanceValueColor = isDarkMode ? '#90CAF9' : '#1976D2';
  const problemChipBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';
  const problemChipTextColor = isDarkMode ? '#FFB74D' : '#e65100';
  const descriptionBg = isDarkMode ? '#2a2a2a' : '#f9f9f9';

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={{ marginTop: 16 }}>Yol yardım iş detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!request) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Yol Yardım İş Detayı" />
        <Text>Yol yardım iş detayı bulunamadı.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={{ marginTop: 16 }}>
          Geri Dön
        </Button>
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
        {isAwaitingApproval && (
          <Card style={[styles.card, { backgroundColor: bannerBg }]}>
            <Card.Content>
              <View style={styles.bannerContent}>
                <MaterialCommunityIcons name="clock-alert-outline" size={48} color="#F57C00" />
                <Text style={[styles.bannerTitle, { color: bannerTitleColor }]}>Müşteri Onayı Bekleniyor</Text>
                <Text style={[styles.bannerText, { color: appColors.text.secondary }]}>
                  Teklifiniz müşteriye iletildi. Müşteri teklifi onayladığında iş başlayacak.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Komisyon Ödeme Ekranı */}
        {isAwaitingPayment && (
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
              description: `Yol Yardım - ${getServiceTypeLabel(request.service_type || request.assistance_type || '')}`,
            }}
            onPayCommission={() => setShowPaymentModal(true)}
            distanceKm={distanceToLocation}
            estimatedDuration={request.estimated_duration}
          />
        )}

        {/* Kazanç Kartı */}
        {(isAwaitingApproval || isInProgress || isCompleted) && finalPrice && (
          <Card style={styles.card}>
            <Card.Content>
              <View style={[styles.earningsContainer, { backgroundColor: earningsBg }]}>
                <Text style={styles.earningsLabel}>
                  {isCompleted ? 'Bu İşten Kazancınız' : isAwaitingApproval ? 'Teklif Tutarı' : 'Tahmini Kazancınız'}
                </Text>
                <Text style={styles.earningsValue}>{finalPrice} TL</Text>
                <Text style={[styles.earningsStatus, { color: appColors.text.secondary }]}>
                  {isCompleted ? 'İş tamamlandı' : isAwaitingApproval ? 'Onay bekleniyor' : 'İş devam ediyor'}
                </Text>
              </View>
            </Card.Content>
          </Card>
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
            requestId={requestId || 0}
            existingPhotos={request.photos}
            onPhotosUploaded={fetchRequest}
          />
        )}

        {/* Müşteri Bilgileri - Sadece devam eden işlerde */}
        {isInProgress && (request.requestOwnerNameSurname || request.requestOwnerPhone || request.request_owner_phone) && (
          <Card style={styles.card}>
            <Card.Title
              title="Müşteri Bilgileri"
              left={() => <MaterialCommunityIcons name="account" size={24} color="#4CAF50" />}
            />
            <Card.Content>
              {(request.requestOwnerNameSurname || request.request_owner_name) && (
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="account-circle" size={20} color="#666" />
                  <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>İsim:</Text>
                  <Text style={[styles.infoValue, { color: appColors.text.primary }]}>{request.requestOwnerNameSurname || request.request_owner_name}</Text>
                </View>
              )}
              {(request.requestOwnerPhone || request.request_owner_phone) && (
                <>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="phone" size={20} color="#666" />
                    <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>Telefon:</Text>
                    <Text style={[styles.infoValue, { color: appColors.text.primary }]}>{request.requestOwnerPhone || request.request_owner_phone}</Text>
                  </View>
                  <Button
                    mode="contained"
                    icon="phone"
                    onPress={() => {
                      const phone = (request.requestOwnerPhone || request.request_owner_phone || '').replace(/[^0-9]/g, '');
                      Linking.openURL(`tel:${phone}`).catch(() => Alert.alert('Hata', 'Telefon açılamadı'));
                    }}
                    style={styles.callButton}
                    buttonColor="#4CAF50"
                  >
                    Müşteriyi Ara
                  </Button>
                </>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Mesafe Bilgisi */}
        {!isAwaitingPayment && distanceToLocation !== null && (
          <Card style={styles.card}>
            <Card.Title title="Mesafe Bilgisi" titleStyle={styles.cardTitle} />
            <Card.Content>
              <View style={[styles.distanceContainer, { backgroundColor: distanceBg }]}>
                <Text style={[styles.distanceLabel, { color: appColors.text.secondary }]}>Müşteriye uzaklık</Text>
                <Text style={[styles.distanceValue, { color: distanceValueColor }]}>{distanceToLocation.toFixed(1)} km</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Konum Kartı */}
        {!isAwaitingPayment && (
          <Card style={styles.card}>
            <Card.Title
              title="Müşteri Konumu"
              titleStyle={[styles.cardTitle, { color: '#4CAF50' }]}
            />
            <Card.Content>
              <Text style={[styles.addressText, { color: appColors.text.primary }]}>{request.address || request.location_address || 'Adres belirtilmemiş'}</Text>
              <Button icon="directions" mode="contained" buttonColor="#4CAF50" onPress={openLocationInGoogleMaps}>
                Yol Tarifi Al
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Araç Problemleri */}
        {!isAwaitingPayment && (
          <Card style={styles.card}>
            <Card.Title
              title="Araç Problemleri"
              titleStyle={styles.cardTitle}
              left={() => <MaterialCommunityIcons name="car-wrench" size={24} color="#f44336" />}
            />
            <Card.Content>
              {/* Araç Tipi */}
              {request.vehicle_type && (
                <View style={styles.detailRow}>
                  <Text style={[styles.detailLabel, { color: appColors.text.secondary }]}>Araç Tipi:</Text>
                  <Text style={[styles.detailValue, { color: appColors.text.primary }]}>{getVehicleTypeLabel(request.vehicle_type)}</Text>
                </View>
              )}

              {/* Problem Tipleri */}
              {request.problem_types && request.problem_types.length > 0 && (
                <>
                  <Text style={[styles.detailLabel, { marginTop: 12, marginBottom: 8, color: appColors.text.secondary }]}>Sorun Türü:</Text>
                  <View style={styles.problemChipsContainer}>
                    {request.problem_types.map((type: string, index: number) => (
                      <View key={index} style={[styles.problemChip, { backgroundColor: problemChipBg }]}>
                        <MaterialCommunityIcons
                          name={getProblemIcon(type) as any}
                          size={16}
                          color="#f57c00"
                        />
                        <Text style={[styles.problemChipText, { color: problemChipTextColor }]}>{getProblemLabel(type)}</Text>
                      </View>
                    ))}
                  </View>
                </>
              )}

              {/* Açıklama */}
              {(request.description || request.problem_description || request.additional_notes) && (
                <>
                  <Text style={[styles.detailLabel, { marginTop: 12, color: appColors.text.secondary }]}>Açıklama:</Text>
                  <Text style={[styles.descriptionText, { color: appColors.text.primary, backgroundColor: descriptionBg }]}>
                    {request.description || request.problem_description || request.additional_notes}
                  </Text>
                </>
              )}
            </Card.Content>
          </Card>
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
        {isAwaitingApproval && (request.tracking_token || request.trackingToken) && (
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
                        await requestsAPI.withdrawRoadAssistanceOffer((request.tracking_token || request.trackingToken)!);
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
        {(isInProgress || isAwaitingApproval) && (request.tracking_token || request.trackingToken) && (
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

      {/* Komisyon Ödeme Modal */}
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
        serviceType="roadAssistance"
        trackingToken={request?.tracking_token || request?.trackingToken || ''}
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
  card: {
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: '600',
  },
  bannerContent: {
    padding: 16,
    alignItems: 'center',
  },
  bannerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 12,
    textAlign: 'center',
  },
  bannerText: {
    fontSize: 14,
    marginTop: 8,
    textAlign: 'center',
  },
  earningsContainer: {
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  earningsLabel: {
    fontSize: 14,
    color: '#2E7D32',
    marginBottom: 8,
  },
  earningsValue: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#2E7D32',
  },
  earningsStatus: {
    fontSize: 12,
    marginTop: 4,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    flex: 1,
  },
  callButton: {
    marginTop: 12,
    borderRadius: 12,
  },
  distanceContainer: {
    padding: 16,
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  distanceLabel: {
    fontSize: 14,
  },
  distanceValue: {
    fontSize: 14,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 15,
    marginBottom: 12,
  },
  detailsContainer: {
    padding: 16,
    borderRadius: 8,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  detailLabel: {
    fontSize: 14,
    fontWeight: '500',
  },
  detailValue: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  problemChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  problemChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f57c00',
  },
  problemChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  descriptionText: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 8,
    padding: 12,
    borderRadius: 8,
  },
});

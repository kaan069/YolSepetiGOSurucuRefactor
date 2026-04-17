// Transfer is detay ekrani
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, Alert, View, Linking, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, TransferRequest } from '../../api';
import { transferAPI } from '../../api/requests';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useNakliyeLocationStore } from '../../store/useNakliyeLocationStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { CommissionPaymentModal, CommissionPaymentCard, InsurancePricingCard } from '../../components/payment';
import CancelJobModal from '../../components/cancellation/CancelJobModal';
import { useCancellationEventStore } from '../../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../../store/useJobUpdateEventStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import PhotosSection from '../../components/PhotosSection';
import DriverPhotoUpload from '../../components/DriverPhotoUpload';

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

// Transfer tipi etiketleri
const TRANSFER_TYPE_LABELS: Record<string, string> = {
  organization: 'Organizasyon Transferi',
  vip: 'VIP Transfer',
};

// Arac tercihi etiketleri
const VEHICLE_PREFERENCE_LABELS: Record<string, string> = {
  sedan: 'Sedan',
  vip_car: 'VIP Arac',
  minibus: 'Minibus',
  midibus: 'Midibus',
  bus: 'Otobus',
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
      return { color: '#FF9800', icon: 'clock-outline' as const, label: 'Onay Bekleniyor', description: 'Teklif gonderildi, musteri onayi bekleniyor' };
    case 'awaiting_payment':
      return { color: '#2196F3', icon: 'credit-card-outline' as const, label: 'Odeme Bekleniyor', description: 'Musteri onayladi, odeme bekleniyor' };
    case 'in_progress':
      return { color: '#4CAF50', icon: 'car-connected' as const, label: 'Devam Ediyor', description: 'Is devam ediyor' };
    case 'completed':
      return { color: '#9E9E9E', icon: 'check-circle' as const, label: 'Tamamlandi', description: 'Is basariyla tamamlandi' };
    case 'cancelled':
      return { color: '#F44336', icon: 'cancel' as const, label: 'Iptal Edildi', description: 'Is iptal edildi' };
    default:
      return { color: '#607D8B', icon: 'information-outline' as const, label: 'Bilinmiyor', description: '' };
  }
};

export default function TransferJobDetailScreen({ route, navigation }: Props) {
  const { jobId } = route.params;
  const { isLocationSharing, startLocationSharing, stopLocationSharing } = useNakliyeLocationStore();
  const { isDarkMode, screenBg, cardBg, appColors } = useAppTheme();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [transferRequest, setTransferRequest] = useState<TransferRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [showPaymentModal, setShowPaymentModal] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [withdrawLoading, setWithdrawLoading] = useState(false);
  const { showNotification } = useNotificationStore();

  const status = transferRequest ? getStatus(transferRequest) : null;
  const requestId = transferRequest ? getRequestId(transferRequest) : null;
  const isAwaitingApproval = status === 'awaiting_approval';
  const isAwaitingPayment = status === 'awaiting_payment';
  const isInProgress = status === 'in_progress';
  const isCompleted = status === 'completed';

  // Istek detayini getir
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const request = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
        setTransferRequest(request);
      } catch (error: any) {
        Alert.alert('Hata', 'Transfer is detaylari yuklenemedi');
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
  useEffect(() => {
    if (lastUpdatedJobId && String(lastUpdatedJobId) === jobId) {
      if (lastUpdatedStatus) {
        const statusLabels: Record<string, string> = {
          'awaiting_approval': 'Onay Bekleniyor',
          'awaiting_payment': 'Odeme Bekleniyor',
          'in_progress': 'Devam Ediyor',
          'completed': 'Tamamlandi',
          'cancelled': 'Iptal Edildi',
        };
        const label = statusLabels[lastUpdatedStatus] || lastUpdatedStatus;
        useJobUpdateEventStore.getState().clear();
        Alert.alert('Is Durumu Guncellendi', `Is durumu: ${label}`, [{
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
        console.error('Konum alinamadi:', error);
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

  // Yola cik - konum paylasimini baslat + backend'e bildir
  const [departLoading, setDepartLoading] = useState(false);
  const [hasDeparted, setHasDeparted] = useState(false);

  const handleStartLocationSharing = async () => {
    if (!transferRequest?.trackingToken) return;

    setDepartLoading(true);
    try {
      // Backend'e yola çıkış bildir (müşteriye SMS gider)
      if (!hasDeparted) {
        await transferAPI.depart(transferRequest.trackingToken);
        setHasDeparted(true);
      }
      // Konum paylaşımını başlat
      startLocationSharing(transferRequest.trackingToken, jobId, 'city');
      Alert.alert('Yola Cikis', 'Yola cikis bildirildi ve konum paylasimi baslatildi. Musteriye SMS gonderildi.');
    } catch (err: any) {
      // Depart başarısız olsa bile konum paylaşımını başlat
      startLocationSharing(transferRequest.trackingToken, jobId, 'city');
      Alert.alert('Konum Paylasimi', 'Konum paylasimi baslatildi.');
    } finally {
      setDepartLoading(false);
    }
  };

  // Konum paylasimini durdur
  const handleStopLocationSharing = () => {
    Alert.alert(
      'Konum Paylasimi',
      'Konum paylasimini durdurmak istediginize emin misiniz?',
      [
        { text: 'Vazgec', style: 'cancel' },
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
      'Isi bitirebilmeniz icin musterinin takip linkinden onay vermesi gerekmektedir.',
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

  // Odeme basarili
  const handlePaymentSuccess = async () => {
    setShowPaymentModal(false);
    try {
      const updatedRequest = await requestsAPI.getTransferRequestDetail(parseInt(jobId));
      setTransferRequest(updatedRequest);
    } catch (error) {
      console.error('Yenileme hatasi:', error);
    }
    Alert.alert('Odeme Basarili', 'Komisyon odemesi tamamlandi.', [{ text: 'Tamam' }]);
  };

  const handlePaymentFailed = (errorMessage: string) => {
    Alert.alert('Odeme Hatasi', errorMessage);
  };

  // Telefon arama
  const handleCallCustomer = (phone: string) => {
    const phoneUrl = `tel:${phone}`;
    Linking.canOpenURL(phoneUrl).then((supported) => {
      if (supported) {
        Linking.openURL(phoneUrl);
      } else {
        Alert.alert('Hata', 'Telefon aramasi yapilamiyor');
      }
    });
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["top", "bottom"]}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Transfer is detaylari yukleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!transferRequest) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Transfer Is Detayi" />
        <Text style={{ color: appColors.text.primary }}>Transfer is detayi bulunamadi.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          Geri Don
        </Button>
      </SafeAreaView>
    );
  }

  const heroConfig = getHeroConfig(status || 'unknown');
  const isVip = transferRequest.transfer_type === 'vip';
  const transferTypeLabel = TRANSFER_TYPE_LABELS[transferRequest.transfer_type] || transferRequest.transfer_type;
  const vehiclePrefLabel = transferRequest.vehicle_preference
    ? VEHICLE_PREFERENCE_LABELS[transferRequest.vehicle_preference] || transferRequest.vehicle_preference
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
      <AppBar title="Transfer Is Detayi" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        {/* Hero Section - Durum Gosterimi */}
        <Card style={[styles.heroCard, { backgroundColor: heroConfig.color }]}>
          <Card.Content style={styles.heroContent}>
            <MaterialCommunityIcons name={heroConfig.icon} size={48} color="#FFFFFF" />
            <View style={styles.heroTextContainer}>
              <Text style={styles.heroTitle}>{heroConfig.label}</Text>
              <Text style={styles.heroDescription}>{heroConfig.description}</Text>
            </View>
          </Card.Content>
        </Card>

        {/* Yola Çık / Konum Paylaşımı Butonu */}
        {isInProgress && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content>
              {isLocationSharing ? (
                <>
                  <View style={styles.locationSharingActive}>
                    <MaterialCommunityIcons name="map-marker-radius" size={24} color="#4CAF50" />
                    <Text style={{ color: '#4CAF50', fontWeight: 'bold', marginLeft: 8 }}>
                      Konum paylaşılıyor...
                    </Text>
                  </View>
                  <Button
                    icon="stop-circle"
                    mode="outlined"
                    textColor="#FF9800"
                    style={{ borderColor: '#FF9800', marginTop: 8 }}
                    contentStyle={{ paddingVertical: 4 }}
                    onPress={handleStopLocationSharing}
                  >
                    Konum Paylaşımını Durdur
                  </Button>
                </>
              ) : (
                <Button
                  icon="navigation"
                  mode="contained"
                  buttonColor="#2196F3"
                  contentStyle={{ paddingVertical: 8 }}
                  loading={departLoading}
                  disabled={departLoading}
                  onPress={handleStartLocationSharing}
                >
                  {departLoading ? 'Yola Cikiliyor...' : 'Yola Cik'}
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Komisyon Odeme Karti */}
        {isAwaitingPayment && (
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
              description: `Transfer Hizmeti - ${transferTypeLabel}`,
            }}
            onPayCommission={() => setShowPaymentModal(true)}
            distanceKm={distanceFromBackend || distanceToPickup}
            estimatedDuration={transferRequest.estimated_duration_hours}
          />
        )}

        {/* Kazanc Karti */}
        {(isAwaitingApproval || isInProgress || isCompleted) && driverEarnings > 0 && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.earningsContent}>
              <MaterialCommunityIcons name="cash-multiple" size={28} color="#4CAF50" />
              <View style={{ marginLeft: 12, flex: 1 }}>
                <Text style={[styles.earningsLabel, { color: appColors.text.secondary }]}>
                  {isCompleted ? 'Kazanciniz' : 'Tahmini Kazanc'}
                </Text>
                <Text style={styles.earningsAmount}>{driverEarnings.toLocaleString('tr-TR')} TL</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Musteri Bilgileri - Sadece devam eden islerde */}
        {isInProgress && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title
              title="Musteri Bilgileri"
              titleStyle={{ color: appColors.text.primary }}
              left={(props) => <MaterialCommunityIcons {...props} name="account" size={24} color="#26a69a" />}
            />
            <Card.Content>
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                {transferRequest.requestOwnerNameSurname && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Ad Soyad:</Text>
                    <Text style={[styles.value, { color: appColors.text.primary }]}>
                      {transferRequest.requestOwnerNameSurname}
                    </Text>
                  </View>
                )}
                {transferRequest.requestOwnerPhone && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Telefon:</Text>
                    <Text style={[styles.value, { color: appColors.text.primary }]}>
                      {transferRequest.requestOwnerPhone}
                    </Text>
                  </View>
                )}
              </View>
              {transferRequest.requestOwnerPhone && (
                <Button
                  icon="phone"
                  mode="contained"
                  buttonColor="#26a69a"
                  style={{ marginTop: 12 }}
                  onPress={() => handleCallCustomer(transferRequest.requestOwnerPhone!)}
                >
                  Musteriyi Ara
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Mesafe Bilgisi */}
        {!isAwaitingPayment && distanceToPickup !== null && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.distanceContent}>
              <MaterialCommunityIcons name="map-marker-distance" size={28} color="#26a69a" />
              <View style={{ marginLeft: 12 }}>
                <Text style={[styles.distanceLabel, { color: appColors.text.secondary }]}>Alis Noktasina Uzaklik</Text>
                <Text style={styles.distanceValue}>{distanceToPickup} km</Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Transfer Detaylari Karti */}
        {!isAwaitingPayment && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title
              title="Transfer Detaylari"
              titleStyle={{ color: appColors.text.primary }}
              left={(props) => <MaterialCommunityIcons {...props} name="car-connected" size={24} color="#26a69a" />}
            />
            <Card.Content>
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                {/* Transfer tipi badge */}
                <View style={styles.row}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons
                      name={isVip ? 'star-circle' : 'account-group'}
                      size={18}
                      color={isVip ? '#FFD700' : '#4CAF50'}
                    />
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Transfer Tipi:</Text>
                  </View>
                  <View style={[styles.badge, { backgroundColor: isVip ? '#FFF3E0' : '#E8F5E9' }]}>
                    <Text style={[styles.badgeText, { color: isVip ? '#E65100' : '#2E7D32' }]}>
                      {transferTypeLabel}
                    </Text>
                  </View>
                </View>

                {/* Kisi sayisi (organizasyon icin) */}
                {transferRequest.transfer_type === 'organization' && transferRequest.passenger_count && (
                  <View style={styles.row}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="account-multiple" size={18} color="#2196F3" />
                      <Text style={[styles.label, { color: appColors.text.secondary }]}>Kisi Sayisi:</Text>
                    </View>
                    <Text style={[styles.value, { color: appColors.text.primary }]}>
                      {transferRequest.passenger_count} kisi
                    </Text>
                  </View>
                )}

                {/* Arac tercihi */}
                {vehiclePrefLabel && (
                  <View style={styles.row}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="car-estate" size={18} color="#9C27B0" />
                      <Text style={[styles.label, { color: appColors.text.secondary }]}>Arac Tercihi:</Text>
                    </View>
                    <Text style={[styles.value, { color: appColors.text.primary }]}>
                      {vehiclePrefLabel}
                    </Text>
                  </View>
                )}

                {/* Tarih + Saat */}
                <View style={styles.row}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="calendar-clock" size={18} color="#FF9800" />
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Tarih:</Text>
                  </View>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>
                    {formatDate(transferRequest.scheduled_date)}
                  </Text>
                </View>

                <View style={styles.row}>
                  <View style={styles.infoRow}>
                    <MaterialCommunityIcons name="clock-outline" size={18} color="#FF9800" />
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Saat:</Text>
                  </View>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>
                    {transferRequest.scheduled_time}
                  </Text>
                </View>

                {/* Gidis-Donus bilgisi - belirgin banner */}
                <View style={[
                  styles.roundTripBanner,
                  {
                    backgroundColor: transferRequest.is_round_trip ? '#E3F2FD' : '#F3E5F5',
                    borderColor: transferRequest.is_round_trip ? '#1976D2' : '#7B1FA2',
                  },
                ]}>
                  <MaterialCommunityIcons
                    name={transferRequest.is_round_trip ? 'swap-horizontal-circle' : 'arrow-right-circle'}
                    size={26}
                    color={transferRequest.is_round_trip ? '#1976D2' : '#7B1FA2'}
                  />
                  <Text style={[
                    styles.roundTripText,
                    { color: transferRequest.is_round_trip ? '#1565C0' : '#6A1B9A' },
                  ]}>
                    {transferRequest.is_round_trip ? 'Gidiş - Dönüş' : 'Tek Yön'}
                  </Text>
                </View>

                {/* Ek notlar */}
                {transferRequest.additional_notes && (
                  <View style={{ marginTop: 8 }}>
                    <View style={styles.infoRow}>
                      <MaterialCommunityIcons name="note-text-outline" size={18} color="#795548" />
                      <Text style={[styles.label, { color: appColors.text.secondary }]}>Ek Notlar:</Text>
                    </View>
                    <Text style={[styles.noteText, { color: appColors.text.primary }]}>
                      {transferRequest.additional_notes}
                    </Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Alış Adresi */}
        {!isAwaitingPayment && !isAwaitingApproval && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title
              title="Alış Adresi"
              titleStyle={{ color: appColors.text.primary }}
              left={(props) => <MaterialCommunityIcons {...props} name="map-marker" size={24} color="#26a69a" />}
            />
            <Card.Content>
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                  {transferRequest.pickup_address}
                </Text>
              </View>
              {isInProgress && transferRequest.pickup_latitude && transferRequest.pickup_longitude && (
                <Button
                  icon="navigation-variant"
                  mode="contained"
                  buttonColor="#26a69a"
                  style={{ marginTop: 12 }}
                  onPress={() => openInMaps(transferRequest.pickup_latitude, transferRequest.pickup_longitude, 'Alış Noktası')}
                >
                  Alış Noktasına Git
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Bırakış Adresi */}
        {!isAwaitingPayment && !isAwaitingApproval && transferRequest.dropoff_address && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title
              title="Bırakış Adresi"
              titleStyle={{ color: appColors.text.primary }}
              left={(props) => <MaterialCommunityIcons {...props} name="map-marker-check" size={24} color="#E91E63" />}
            />
            <Card.Content>
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                  {transferRequest.dropoff_address}
                </Text>
              </View>
              {isInProgress && transferRequest.dropoff_latitude && transferRequest.dropoff_longitude && (
                <Button
                  icon="navigation-variant"
                  mode="contained"
                  buttonColor="#E91E63"
                  style={{ marginTop: 12 }}
                  onPress={() => openInMaps(transferRequest.dropoff_latitude, transferRequest.dropoff_longitude, 'Teslim Noktası')}
                >
                  Teslim Noktasına Git
                </Button>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Dönüş Bilgileri (gidiş-dönüş ise) */}
        {!isAwaitingPayment && transferRequest.is_round_trip && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title
              title="Dönüş Bilgileri"
              titleStyle={{ color: appColors.text.primary }}
              left={(props) => <MaterialCommunityIcons {...props} name="swap-horizontal" size={24} color="#607D8B" />}
            />
            <Card.Content>
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                {transferRequest.return_same_route ? (
                  <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                    Aynı rota üzerinden dönüş
                  </Text>
                ) : (
                  <>
                    {transferRequest.return_pickup_location && (
                      <View style={{ marginBottom: 8 }}>
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons name="map-marker" size={16} color="#26a69a" />
                          <Text style={[styles.label, { color: appColors.text.secondary }]}>Dönüş Alış:</Text>
                        </View>
                        <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                          {transferRequest.return_pickup_location.address}
                        </Text>
                        {isInProgress && (
                          <Button
                            icon="navigation-variant"
                            mode="outlined"
                            textColor="#26a69a"
                            style={{ borderColor: '#26a69a', marginTop: 8 }}
                            compact
                            onPress={() => openInMaps(transferRequest.return_pickup_location!.latitude, transferRequest.return_pickup_location!.longitude, 'Dönüş Alış Noktası')}
                          >
                            Konuma Git
                          </Button>
                        )}
                      </View>
                    )}
                    {transferRequest.return_dropoff_location && (
                      <View>
                        <View style={styles.infoRow}>
                          <MaterialCommunityIcons name="map-marker-check" size={16} color="#E91E63" />
                          <Text style={[styles.label, { color: appColors.text.secondary }]}>Dönüş Bırakış:</Text>
                        </View>
                        <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                          {transferRequest.return_dropoff_location.address}
                        </Text>
                        {isInProgress && (
                          <Button
                            icon="navigation-variant"
                            mode="outlined"
                            textColor="#E91E63"
                            style={{ borderColor: '#E91E63', marginTop: 8 }}
                            compact
                            onPress={() => openInMaps(transferRequest.return_dropoff_location!.latitude, transferRequest.return_dropoff_location!.longitude, 'Dönüş Teslim Noktası')}
                          >
                            Konuma Git
                          </Button>
                        )}
                      </View>
                    )}
                  </>
                )}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Fotograflar */}
        {(isAwaitingApproval || isInProgress) && (
          <PhotosSection photos={transferRequest.photos} />
        )}

        {/* Surucu Fotograf Yukleme */}
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

        {/* Sigortali is fiyat detayi */}
        {transferRequest.pricing && (
          <InsurancePricingCard pricing={transferRequest.pricing} />
        )}


        {/* Isi Tamamla Butonu */}
        {isInProgress && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content>
              <Button
                icon="check-circle"
                mode="contained"
                buttonColor="#4CAF50"
                contentStyle={{ paddingVertical: 8 }}
                onPress={handleCompleteJob}
              >
                Isi Tamamla
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Teklifi Geri Çek Butonu - Onay beklerken */}
        {isAwaitingApproval && transferRequest.trackingToken && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content>
              <Button
                icon="undo-variant"
                mode="outlined"
                textColor="#FF9800"
                style={{ borderColor: '#FF9800' }}
                loading={withdrawLoading}
                disabled={withdrawLoading}
                onPress={handleWithdrawOffer}
              >
                Teklifi Geri Çek
              </Button>
            </Card.Content>
          </Card>
        )}

        {/* Isi Iptal Et Butonu */}
        {isInProgress && transferRequest.trackingToken && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content>
              <Button
                icon="cancel"
                mode="outlined"
                textColor="#F44336"
                style={{ borderColor: '#F44336' }}
                onPress={() => setShowCancelModal(true)}
              >
                Isi Iptal Et
              </Button>
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Odeme Modal */}
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

      {/* Is Iptal Modal */}
      <CancelJobModal
        visible={showCancelModal}
        onClose={() => setShowCancelModal(false)}
        serviceType="transfer"
        trackingToken={transferRequest?.trackingToken || ''}
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
  // Hero section
  heroCard: {
    marginBottom: 16,
    elevation: 4,
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
  },
  heroTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  heroTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#FFFFFF',
  },
  heroDescription: {
    fontSize: 13,
    color: 'rgba(255, 255, 255, 0.9)',
    marginTop: 4,
  },
  // Kazanc
  earningsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  earningsLabel: {
    fontSize: 13,
  },
  earningsAmount: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#4CAF50',
  },
  // Mesafe
  distanceContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  distanceLabel: {
    fontSize: 13,
  },
  distanceValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#26a69a',
  },
  // Detay kartlari
  infoBox: {
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontWeight: 'bold',
    fontSize: 13,
    marginLeft: 4,
  },
  value: {
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: 'bold',
  },
  addressText: {
    fontSize: 14,
    lineHeight: 20,
  },
  noteText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 24,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  roundTripBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 10,
    borderWidth: 1.5,
    marginTop: 10,
  },
  roundTripText: {
    fontSize: 15,
    fontWeight: 'bold',
  },
  locationSharingActive: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
});

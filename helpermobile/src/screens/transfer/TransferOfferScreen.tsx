// Transfer teklif ekrani
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text, Card } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, vehiclesAPI, documentsAPI, TransferRequest, TransferListItem } from '../../api';
import { ProviderType } from '../../api/types';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import { VehicleSelector, EmployeeSelector } from '../../components/common';
import PhotosSection from '../../components/PhotosSection';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferOffer'>;

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

export default function TransferOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();
  const { isDarkMode, appColors, cardBg, screenBg } = useAppTheme();

  // State
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [transferRequest, setTransferRequest] = useState<TransferRequest | null>(null);
  const [loading, setLoading] = useState(false);

  // Arac secimi
  const [transferVehicles, setTransferVehicles] = useState<TransferListItem[]>([]);
  const [selectedVehicleId, setSelectedVehicleId] = useState<number | null>(null);

  // Fiyat teklifi (manuel giris)
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [acceptingJob, setAcceptingJob] = useState(false);

  // Calisan secimi (sirket tipi saglayicilar icin)
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // Talep detayini getir
  useEffect(() => {
    const fetchTransferRequest = async () => {
      try {
        setLoading(true);
        const request = await requestsAPI.getTransferRequestDetail(parseInt(orderId));
        setTransferRequest(request);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Talep detaylari yuklenemedi';
        showNotification('error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchTransferRequest();
  }, [orderId]);

  // Transfer arac listesini getir - talep tipine gore filtrele
  useEffect(() => {
    const fetchTransferVehicles = async () => {
      try {
        const vehicles = await vehiclesAPI.getMyTransferVehicles();

        // Talep tipine uygun araclari filtrele (vip talep -> vip araclar, organization talep -> organization araclar)
        const requestTransferType = transferRequest?.transfer_type;
        const filteredVehicles = requestTransferType
          ? vehicles.filter((v: any) => v.transfer_type === requestTransferType)
          : vehicles;

        setTransferVehicles(filteredVehicles as any);

        // Tek arac varsa otomatik sec
        if (filteredVehicles.length === 1) {
          setSelectedVehicleId(filteredVehicles[0].id);
        }

        if (filteredVehicles.length === 0) {
          const typeLabel = requestTransferType === 'vip' ? 'VIP' : 'Organizasyon';
          showNotification('warning', `Kayitli ${typeLabel} transfer araciniz bulunamadi. Lutfen once arac ekleyin.`, 6000);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Arac listesi yuklenemedi';
        showNotification('error', errorMessage);
      }
    };
    if (transferRequest) {
      fetchTransferVehicles();
    }
  }, [transferRequest]);

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

  // Mesafe hesapla
  useEffect(() => {
    if (currentLocation && transferRequest) {
      const lat = parseFloat(transferRequest.pickup_latitude);
      const lng = parseFloat(transferRequest.pickup_longitude);
      setDistance(calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng));
    }
  }, [transferRequest, currentLocation]);

  // Saglayici tipini yukle
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

  // Arac secimi
  const handleSelectVehicle = (vehicleId: number) => {
    setSelectedVehicleId(vehicleId);
  };

  // Teklif gonder
  const handleAccept = async () => {
    // Profil kontrolu
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();
      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `\u2022 ${field.message}`)
          .join('\n');

        Alert.alert(
          'Profil Tamamlanmamis',
          `Is kabul edebilmek icin profilinizi tamamlamaniz gerekiyor.\n\nEksik bilgiler:\n${missingMessages}`,
          [
            { text: 'Tamam', style: 'cancel' },
            { text: 'Profili Tamamla', onPress: () => navigation.navigate('MissingDocuments') }
          ]
        );
        return;
      }
    } catch (error) {
      console.error('Profil kontrolu hatasi:', error);
    }

    if (!selectedVehicleId) {
      showNotification('warning', 'Lutfen bir arac secin');
      return;
    }
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      showNotification('warning', 'Lutfen gecerli bir fiyat teklifi girin');
      return;
    }

    proceedWithAccept();
  };

  const proceedWithAccept = async () => {
    try {
      setAcceptingJob(true);

      if (!transferRequest?.trackingToken) {
        throw new Error('Tracking token bulunamadi');
      }

      const response = await requestsAPI.submitTransferOffer(
        transferRequest.trackingToken,
        {
          proposed_price: parseFloat(offerPrice),
          vehicle_id: selectedVehicleId!,
          employee_id: selectedEmployeeId || undefined,
        }
      );

      const totalPrice = response.driver_earnings || response.estimated_price || offerPrice;
      showNotification('success', `Teklifiniz gonderildi!\n\nTahmini Kazanc: ${totalPrice} TL`, 6000);

      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: { serviceFilter: 'transfer', filter: 'awaiting_approval', timestamp: Date.now() }
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      const backendError = error?.response?.data?.error || error?.response?.data?.message || '';

      if (backendError.toLowerCase().includes('sirket bilgi')) {
        Alert.alert('API Hatasi', backendError, [
          { text: 'Iptal', style: 'cancel' },
          { text: 'Goruntule', onPress: () => navigation.navigate('CompanyInfo' as any) }
        ]);
      } else if (backendError.toLowerCase().includes('ehliyet') || backendError.toLowerCase().includes('belge')) {
        Alert.alert('Belgeleriniz Onaylanmamis', backendError, [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Evraklarim', onPress: () => navigation.navigate('DocumentsScreen' as any) }
        ]);
      } else {
        showNotification('error', backendError || 'Teklif gonderilemedi', 6000);
      }
    } finally {
      setAcceptingJob(false);
    }
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

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={['bottom']}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.primary }]}>Talep detaylari yukleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!transferRequest) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Transfer Talebi" />
        <Text style={{ color: appColors.text.primary }}>Talep bulunamadi.</Text>
      </SafeAreaView>
    );
  }

  const hasValidPrice = offerPrice.trim() !== '' && parseFloat(offerPrice) > 0;
  const transferTypeLabel = TRANSFER_TYPE_LABELS[transferRequest.transfer_type] || transferRequest.transfer_type;
  const vehiclePrefLabel = transferRequest.vehicle_preference
    ? VEHICLE_PREFERENCE_LABELS[transferRequest.vehicle_preference] || transferRequest.vehicle_preference
    : null;
  const isVip = transferRequest.transfer_type === 'vip';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Transfer Talebi" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          {/* MapCard - Alis noktasi ve mesafe */}
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title title="Talep Bilgileri" titleStyle={{ color: appColors.text.primary }} />
            <Card.Content>
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                <View style={styles.infoRow}>
                  <MaterialCommunityIcons name="map-marker" size={18} color="#26a69a" />
                  <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>Alis Noktasi:</Text>
                </View>
                <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                  {transferRequest.pickup_address}
                </Text>

                {transferRequest.dropoff_address && (
                  <>
                    <View style={[styles.infoRow, { marginTop: 12 }]}>
                      <MaterialCommunityIcons name="map-marker-check" size={18} color="#E91E63" />
                      <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>Varis Noktasi:</Text>
                    </View>
                    <Text style={[styles.addressText, { color: appColors.text.primary }]}>
                      {transferRequest.dropoff_address}
                    </Text>
                  </>
                )}

                {distance !== null && distance !== undefined && (
                  <View style={[styles.row, { marginTop: 12 }]}>
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Musteriye Olan Uzaklik:</Text>
                    <Text style={[styles.value, styles.distanceText]}>{distance} km</Text>
                  </View>
                )}

                {transferRequest.estimated_km && (
                  <View style={styles.row}>
                    <Text style={[styles.label, { color: appColors.text.secondary }]}>Tahmini Rota Mesafesi:</Text>
                    <Text style={[styles.value, styles.distanceText]}>{transferRequest.estimated_km} km</Text>
                  </View>
                )}
              </View>
            </Card.Content>
          </Card>

          {/* Transfer Detaylari Karti */}
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title title="Transfer Detaylari" titleStyle={{ color: appColors.text.primary }} />
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

          {/* Arac Secimi */}
          <VehicleSelector
            vehicles={transferVehicles}
            selectedId={selectedVehicleId}
            onSelect={handleSelectVehicle}
            serviceType="transfer"
          />

          {/* Calisan Secimi (sirket icin) */}
          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          {/* Fotograflar */}
          <PhotosSection photos={transferRequest.photos} />

          {/* Gidis-Donus Uyarisi */}
          {transferRequest.is_round_trip && (
            <Card style={[styles.card, { backgroundColor: '#FFF8E1', borderLeftWidth: 4, borderLeftColor: '#FF8F00' }]}>
              <Card.Content style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                <MaterialCommunityIcons name="alert-circle" size={24} color="#FF8F00" />
                <Text style={{ flex: 1, color: '#E65100', fontSize: 13, fontWeight: '600', lineHeight: 19 }}>
                  Dikkat! Bu talep gidiş-dönüş rotasıdır. Fiyat verirken bunu göz önünde bulundurun.
                </Text>
              </Card.Content>
            </Card>
          )}

          {/* Fiyat Teklifi Karti */}
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Title title="Fiyat Teklifi" titleStyle={{ color: appColors.text.primary }} />
            <Card.Content>
              <View style={[styles.priceInputContainer, { backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5' }]}>
                <View style={styles.priceRow}>
                  <MaterialCommunityIcons name="currency-try" size={24} color="#4CAF50" />
                  <TextInput
                    style={[
                      styles.priceInput,
                      {
                        color: appColors.text.primary,
                        borderColor: isDarkMode ? '#444' : '#ddd',
                        backgroundColor: isDarkMode ? '#333' : '#fff',
                      },
                    ]}
                    placeholder="Fiyat teklifinizi girin"
                    placeholderTextColor={isDarkMode ? '#888' : '#999'}
                    keyboardType="numeric"
                    value={offerPrice}
                    onChangeText={setOfferPrice}
                  />
                  <Text style={[styles.currencyLabel, { color: appColors.text.secondary }]}>TL</Text>
                </View>
                <Text style={[styles.priceHint, { color: appColors.text.secondary }]}>
                  Musteri icin uygun gordugunu fiyati girin
                </Text>
              </View>
            </Card.Content>
          </Card>

          {/* Teklif Gonder Butonu */}
          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={handleAccept}
              loading={acceptingJob}
              disabled={acceptingJob || !selectedVehicleId || !hasValidPrice}
              style={styles.acceptButton}
              icon="check-circle"
            >
              Teklif Gonder
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {acceptingJob && (
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContent, { backgroundColor: cardBg }]}>
            <LoadingSpinner size={100} />
            <Text style={[styles.loadingOverlayText, { color: appColors.text.primary }]}>Teklif gonderiliyor...</Text>
            <Text style={[styles.loadingOverlaySubtext, { color: appColors.text.secondary }]}>Lutfen bekleyiniz</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  keyboardAvoid: {
    flex: 1,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 40,
  },
  loadingText: {
    marginTop: 16,
  },
  card: {
    marginBottom: 16,
  },
  infoBox: {
    padding: 12,
    borderRadius: 8,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '600',
  },
  addressText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 24,
    lineHeight: 20,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 13,
    marginLeft: 4,
  },
  value: {
    color: '#333',
    fontSize: 14,
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  distanceText: {
    fontWeight: 'bold',
    color: '#26a69a',
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
  noteText: {
    fontSize: 14,
    marginTop: 4,
    marginLeft: 24,
    lineHeight: 20,
    fontStyle: 'italic',
  },
  priceInputContainer: {
    padding: 12,
    borderRadius: 8,
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  priceInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 18,
    fontWeight: 'bold',
  },
  currencyLabel: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  priceHint: {
    fontSize: 12,
    marginTop: 8,
    textAlign: 'center',
  },
  actionsContainer: {
    gap: 12,
    marginBottom: 20,
  },
  acceptButton: {
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  loadingContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  loadingOverlayText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  loadingOverlaySubtext: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
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
});

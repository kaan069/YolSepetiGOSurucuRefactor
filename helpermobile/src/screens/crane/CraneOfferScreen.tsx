// Vinç teklif ekranı
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, CraneRequest, CraneListItem, vehiclesAPI, documentsAPI } from '../../api';
import { useNotificationStore } from '../../store/useNotificationStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  MapCard,
  PricingCard,
  JobDetailsCard,
  RequirementsCard,
} from './components';
import { VehicleSelector } from '../../components/common';
import { calculateDistance } from './constants';
import PhotosSection from '../../components/PhotosSection';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { EmployeeSelector } from '../../components/common';
import { ProviderType } from '../../api/types';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'CraneOffer'>;

export default function CraneOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();

  // State
  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [craneRequest, setCraneRequest] = useState<CraneRequest | null>(null);
  const [loading, setLoading] = useState(false);

  // Vinç seçimi
  const [cranesList, setCranesList] = useState<CraneListItem[]>([]);
  const [selectedCraneId, setSelectedCraneId] = useState<number | null>(null);

  // Fiyat teklifi (manuel giriş)
  const [offerPrice, setOfferPrice] = useState<string>('');
  const [acceptingJob, setAcceptingJob] = useState(false);

  // Çalışan seçimi (şirket tipi sağlayıcılar için)
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // Talep detayını getir
  useEffect(() => {
    const fetchCraneRequest = async () => {
      try {
        setLoading(true);
        const request = await requestsAPI.getCraneRequestDetail(parseInt(orderId));
        setCraneRequest(request);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Talep detayları yüklenemedi';
        showNotification('error', errorMessage);
      } finally {
        setLoading(false);
      }
    };
    fetchCraneRequest();
  }, [orderId]);

  // Vinç listesini getir
  useEffect(() => {
    const fetchCranes = async () => {
      try {
        const cranes = await vehiclesAPI.getMyCranes();
        setCranesList(cranes as any);

        // Tek vinç varsa otomatik seç
        if (cranes.length === 1) {
          setSelectedCraneId(cranes[0].id ?? null);
        }

        if (cranes.length === 0) {
          showNotification('warning', 'Kayıtlı vinciniz bulunamadı. Lütfen önce vinç ekleyin.', 6000);
        }
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Vinç listesi yüklenemedi';
        showNotification('error', errorMessage);
      }
    };
    fetchCranes();
  }, []);

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
    if (currentLocation && craneRequest) {
      const lat = parseFloat(craneRequest.latitude);
      const lng = parseFloat(craneRequest.longitude);
      setDistance(calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng));
    }
  }, [craneRequest, currentLocation]);

  // Sağlayıcı tipini yükle
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

  // Vinç seçimi
  const handleSelectCrane = (craneId: number) => {
    setSelectedCraneId(craneId);
  };

  // Teklif gönder
  const handleAccept = async () => {
    // Profil kontrolü
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();
      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `• ${field.message}`)
          .join('\n');

        Alert.alert(
          '⚠️ Profil Tamamlanmamış',
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

    if (!selectedCraneId) {
      showNotification('warning', 'Lütfen bir vinç seçin');
      return;
    }
    if (!distance) {
      showNotification('warning', 'Mesafe hesaplanamadı');
      return;
    }
    if (!offerPrice || parseFloat(offerPrice) <= 0) {
      showNotification('warning', 'Lütfen geçerli bir fiyat teklifi girin');
      return;
    }

    proceedWithAccept();
  };

  const proceedWithAccept = async () => {
    try {
      setAcceptingJob(true);

      if (!craneRequest?.trackingToken) {
        throw new Error('Tracking token bulunamadı');
      }

      const estimatedDuration = craneRequest.estimatedDurationHours || craneRequest.estimated_duration_hours || 2.0;

      const response = await requestsAPI.submitCraneOffer(
        craneRequest.trackingToken,
        selectedCraneId!,
        distance!,
        estimatedDuration,
        parseFloat(offerPrice),
        selectedEmployeeId || undefined
      );

      const totalPrice = response.driver_earnings || response.estimated_price || offerPrice;
      showNotification('success', `Teklifiniz gönderildi!\n\nTahmini Kazanç: ${totalPrice} TL`, 6000);

      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: { serviceFilter: 'crane', filter: 'awaiting_approval', timestamp: Date.now() }
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      const backendError = error?.response?.data?.error || error?.response?.data?.message || '';

      if (backendError.toLowerCase().includes('şirket bilgi')) {
        Alert.alert('⚠️ API Hatası', backendError, [
          { text: 'İptal', style: 'cancel' },
          { text: 'Görüntüle', onPress: () => navigation.navigate('CompanyInfo' as any) }
        ]);
      } else if (backendError.toLowerCase().includes('ehliyet') || backendError.toLowerCase().includes('belge')) {
        Alert.alert('Belgeleriniz Onaylanmamış', backendError, [
          { text: 'Tamam', style: 'cancel' },
          { text: 'Evraklarım', onPress: () => navigation.navigate('DocumentsScreen' as any) }
        ]);
      } else {
        showNotification('error', backendError || 'Teklif gönderilemedi', 6000);
      }
    } finally {
      setAcceptingJob(false);
    }
  };

  // Loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom']}>
        <LoadingSpinner size={80} />
        <Text style={styles.loadingText}>Talep detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // Error
  if (!craneRequest) {
    return (
      <SafeAreaView style={[styles.container, styles.centered]} edges={['bottom']}>
        <AppBar title="Vinç Talebi" />
        <Text>Talep bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  const estimatedDuration = craneRequest.estimatedDurationHours || craneRequest.estimated_duration_hours;
  const hasValidPrice = offerPrice.trim() !== '' && parseFloat(offerPrice) > 0;

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppBar title="Vinç Talebi" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <MapCard
            latitude={parseFloat(craneRequest.latitude)}
            longitude={parseFloat(craneRequest.longitude)}
            address={craneRequest.address}
            distance={distance}
            estimatedDuration={estimatedDuration}
          />

          {/* Müşteri bilgileri gelen işlerde gösterilmez - sadece devam eden işlerde gösterilir */}

          {/* Vinç Seçimi */}
          <VehicleSelector
            vehicles={cranesList}
            selectedId={selectedCraneId}
            onSelect={handleSelectCrane}
            serviceType="crane"
          />

          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          <PhotosSection photos={craneRequest.photos} />

          <JobDetailsCard
            orderId={orderId}
            loadType={craneRequest.load_type}
            loadWeight={craneRequest.load_weight}
            liftHeight={craneRequest.lift_height}
            floor={craneRequest.floor}
            hasObstacles={craneRequest.has_obstacles}
            obstacleNote={craneRequest.obstacle_note}
          />

          <RequirementsCard
            selectedCraneId={selectedCraneId}
            distance={distance}
            offerPrice={offerPrice}
          />

          <PricingCard
            offerPrice={offerPrice}
            onOfferPriceChange={setOfferPrice}
            distance={distance}
            estimatedDuration={estimatedDuration || null}
          />

          <View style={styles.actionsContainer}>
            <Button
              mode="contained"
              onPress={handleAccept}
              loading={acceptingJob}
              disabled={acceptingJob || !selectedCraneId || !distance || !hasValidPrice}
              style={styles.acceptButton}
              icon="check-circle"
            >
              Teklif Gönder
            </Button>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {acceptingJob && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingContent}>
            <LoadingSpinner size={100} />
            <Text style={styles.loadingOverlayText}>Teklif gönderiliyor...</Text>
            <Text style={styles.loadingOverlaySubtext}>Lütfen bekleyiniz</Text>
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
});

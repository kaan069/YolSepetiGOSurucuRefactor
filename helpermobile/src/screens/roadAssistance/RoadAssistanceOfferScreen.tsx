// Yol yardım talebi teklif ekranı
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import { RootStackParamList } from '../../navigation';
import { requestsAPI, documentsAPI } from '../../api';
import { useNotificationStore } from '../../store/useNotificationStore';
import { AppBar, VehicleSelector } from '../../components/common';
import LoadingSpinner from '../../components/LoadingSpinner';
import { LocationCard, ProblemDetailsCard, PriceOfferCard } from './components';
import { useRoadAssistanceVehicles } from './hooks';
import { calculateDistance, formatNumber } from './constants';
import PhotosSection from '../../components/PhotosSection';
import { useAppTheme } from '../../hooks/useAppTheme';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { EmployeeSelector } from '../../components/common';
import { ProviderType } from '../../api/types';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'RoadAssistanceOffer'>;

export default function RoadAssistanceOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();
  const { screenBg, appColors } = useAppTheme();

  // Araç seçimi hook
  const {
    vehicles,
    selectedId: selectedVehicleId,
    setSelectedId: setSelectedVehicleId,
    loading: vehiclesLoading,
    approvedCount
  } = useRoadAssistanceVehicles();

  const [currentLocation, setCurrentLocation] = useState<{ latitude: number; longitude: number } | null>(null);
  const [distance, setDistance] = useState<number | null>(null);
  const [request, setRequest] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceError, setPriceError] = useState('');
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // Talep detayını getir
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const data = await requestsAPI.getRoadAssistanceRequestDetail(parseInt(orderId));
        setRequest(data);
      } catch (error: any) {
        const errorMessage = error?.response?.data?.error || 'Talep detayları yüklenemedi';
        showNotification('error', errorMessage);
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };
    fetchRequest();
  }, [orderId]);

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
    if (currentLocation && request) {
      const lat = parseFloat(request.latitude || '0');
      const lng = parseFloat(request.longitude || '0');
      if (lat && lng) {
        setDistance(calculateDistance(currentLocation.latitude, currentLocation.longitude, lat, lng));
      }
    }
  }, [request, currentLocation]);

  // Provider type kontrolü
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

  // Fiyat değişikliği
  const handlePriceChange = (text: string) => {
    setProposedPrice(text);
    setPriceError('');
  };

  // Teklif gönder
  const handleSubmitOffer = async () => {
    // Profil kontrolü
    try {
      const completenessResponse = await documentsAPI.checkProfileCompleteness();
      if (!completenessResponse.is_complete) {
        const missingMessages = completenessResponse.missing_fields
          .map((field: any) => `• ${field.message}`)
          .join('\n');

        Alert.alert(
          'Profil Tamamlanmamış',
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

    if (!proposedPrice || parseInt(proposedPrice) <= 0) {
      setPriceError('Lütfen geçerli bir fiyat girin.');
      return;
    }

    if (!request?.trackingToken) {
      showNotification('error', 'Tracking token bulunamadı');
      return;
    }

    if (distance === null) {
      showNotification('error', 'Mesafe hesaplanamadı. Lütfen konum izni verin.');
      return;
    }

    // Araç kontrolü
    if (!selectedVehicleId) {
      showNotification('error', 'Lütfen bir araç seçin');
      return;
    }

    try {
      setSubmitting(true);
      await requestsAPI.submitRoadAssistanceOffer(
        request.trackingToken,
        parseInt(proposedPrice),
        parseFloat(distance.toFixed(2)),
        selectedVehicleId,
        selectedEmployeeId || undefined
      );

      showNotification('success', `Teklifiniz gönderildi!\n\nTeklif: ${formatNumber(parseInt(proposedPrice))} TL`, 5000);

      // Orders sayfasına yönlendir - awaiting_approval filtresiyle
      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: {
              serviceFilter: 'roadAssistance',
              filter: 'awaiting_approval',
              timestamp: Date.now(),
            },
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || 'Teklif gönderilirken hata oluştu';
      showNotification('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading || vehiclesLoading) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={['bottom']}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Talep detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  if (!request) {
    return (
      <SafeAreaView style={[styles.container, styles.centered, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Yol Yardım Talebi" />
        <Text>Talep bulunamadı.</Text>
        <Button mode="outlined" onPress={() => navigation.goBack()} style={styles.backButton}>
          Geri Dön
        </Button>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Yol Yardım Talebi" />
      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
        >
          <LocationCard
            address={request.address}
            latitude={parseFloat(request.latitude || '0')}
            longitude={parseFloat(request.longitude || '0')}
            distance={distance}
            hideExactLocation={true}
          />

          {/* Araç Seçimi */}
          <VehicleSelector
            vehicles={vehicles}
            selectedId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            serviceType="roadAssistance"
            loading={vehiclesLoading}
          />

          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          <PhotosSection photos={request.photos} />

          <ProblemDetailsCard
            vehicleType={request.vehicle_type}
            problemTypes={request.problem_types}
            problemDescription={request.problem_description}
            additionalNotes={request.additional_notes}
          />

          <PriceOfferCard
            price={proposedPrice}
            onPriceChange={handlePriceChange}
            error={priceError}
          />

          <Button
            mode="contained"
            onPress={handleSubmitOffer}
            loading={submitting}
            disabled={submitting || !proposedPrice || parseInt(proposedPrice) <= 0 || !selectedVehicleId || approvedCount === 0}
            style={styles.submitButton}
            contentStyle={styles.submitButtonContent}
            icon="send"
          >
            {submitting ? 'Gönderiliyor...' : 'Teklif Gönder'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {submitting && (
        <View style={styles.overlay}>
          <View style={styles.overlayContent}>
            <LoadingSpinner size={100} />
            <Text style={styles.overlayText}>Teklif gönderiliyor...</Text>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
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
  backButton: {
    marginTop: 16,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 20,
    borderRadius: 8,
    backgroundColor: '#26a69a',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  overlay: {
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
  overlayContent: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
  },
  overlayText: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
  },
});

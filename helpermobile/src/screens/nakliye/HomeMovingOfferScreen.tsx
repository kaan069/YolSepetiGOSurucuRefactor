// Evden eve nakliye teklif ekranı
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../../utils/locationPermission';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation';
import { requestsAPI } from '../../api';
import { useNotificationStore } from '../../store/useNotificationStore';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import {
  AddressInfoCard,
  MovingDetailsCard,
  PriceOfferCard,
} from './components';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { VehicleSelector, EmployeeSelector } from '../../components/common';
import { ProviderType } from '../../api/types';
import { useNakliyeVehicles } from './hooks';
import { calculateDistance, formatNumber } from './constants';
import PhotosSection from '../../components/PhotosSection';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeMovingOffer'>;

export default function HomeMovingOfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;
  const { showNotification } = useNotificationStore();

  // Araç seçimi hook
  const {
    vehicles,
    selectedId: selectedVehicleId,
    setSelectedId: setSelectedVehicleId,
    loading: vehiclesLoading,
    approvedCount
  } = useNakliyeVehicles();

  // Employee seçimi (company tipi için)
  const [providerType, setProviderTypeState] = useState<ProviderType | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<number | null>(null);
  const { employees, fetchEmployees, loading: employeesLoading } = useEmployeeStore();

  // State
  const [request, setRequest] = useState<any | null>(null);
  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [distanceToPickup, setDistanceToPickup] = useState<number | null>(null);
  const [totalDistance, setTotalDistance] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [proposedPrice, setProposedPrice] = useState('');
  const [priceError, setPriceError] = useState('');

  // Talep detayını getir
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        const pendingRequests = await requestsAPI.getPendingHomeMovingRequests();
        const foundRequest = pendingRequests.find((r: any) => r.id.toString() === orderId);

        if (foundRequest) {
          setRequest(foundRequest);

          // Backend'den gelen route_distance değerini kullan
          if (foundRequest.route_distance) {
            const routeDistanceStr = String(foundRequest.route_distance);
            const parsedDistance = parseFloat(routeDistanceStr.replace(/[^\d.]/g, ''));
            if (!isNaN(parsedDistance) && parsedDistance > 0) {
              setTotalDistance(parsedDistance);
            }
          }
        } else {
          throw new Error('Talep bulunamadı');
        }
      } catch (error) {
        showNotification('error', 'Talep detayları yüklenemedi');
        navigation.goBack();
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [orderId]);

  // Konum al
  useEffect(() => {
    const getLocation = async () => {
      try {
        const granted = await ensureForegroundPermission();
        if (!granted) return;

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude
        });

        if (request) {
          const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
          const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
          if (fromLat && fromLng) {
            const distance = calculateDistance(
              location.coords.latitude,
              location.coords.longitude,
              fromLat,
              fromLng
            );
            setDistanceToPickup(distance);
          }
        }
      } catch (error) {
        console.error('Konum alınamadı:', error);
      }
    };

    if (request) {
      getLocation();
    }
  }, [request]);

  // Provider type yükle
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

  // Fiyat değişimi
  const handlePriceChange = (text: string) => {
    const numericValue = text.replace(/[^0-9]/g, '');
    setProposedPrice(numericValue);
    setPriceError('');
  };

  // Teklif gönder
  const handleSubmitOffer = async () => {
    if (!request) return;

    const price = parseInt(proposedPrice);
    if (!price || price <= 0) {
      setPriceError('Lütfen geçerli bir fiyat girin.');
      return;
    }

    // Araç kontrolü
    if (!selectedVehicleId) {
      showNotification('error', 'Lütfen bir araç seçin');
      return;
    }

    try {
      setSubmitting(true);

      const trackingToken = request.trackingToken || request.tracking_token;
      if (!trackingToken) {
        throw new Error('Tracking token bulunamadı');
      }

      await requestsAPI.submitHomeMovingOffer(
        trackingToken,
        price,
        totalDistance || 0,
        selectedVehicleId,
        selectedEmployeeId || undefined
      );

      showNotification('success', 'Teklifiniz başarıyla gönderildi!');

      // Orders sayfasına yönlendir - awaiting_approval filtresiyle
      setTimeout(() => {
        navigation.navigate('Tabs', { screen: 'OrdersTab' } as any);
        setTimeout(() => {
          navigation.navigate('Tabs', {
            screen: 'OrdersTab',
            params: {
              serviceFilter: 'nakliye',
              filter: 'awaiting_approval',
              timestamp: Date.now(),
            },
          } as any);
        }, 100);
      }, 1000);
    } catch (error: any) {
      const errorMessage = error?.response?.data?.error || error?.response?.data?.message || 'Teklif gönderilemedi';
      showNotification('error', errorMessage);
    } finally {
      setSubmitting(false);
    }
  };


  if (loading || vehiclesLoading) {
    return <LoadingSpinner />;
  }

  if (!request) {
    return (
      <SafeAreaView style={styles.container} edges={['bottom']}>
        <AppBar title="Talep Bulunamadı" showBackButton onBackPress={() => navigation.goBack()} />
        <View style={styles.emptyState}>
          <MaterialCommunityIcons name="alert-circle-outline" size={64} color="#ccc" />
          <Text style={styles.emptyText}>Talep detayları yüklenemedi</Text>
        </View>
      </SafeAreaView>
    );
  }

  const fromAddress = request.from_address || request.pickup_address || 'Alınacak adres';
  const toAddress = request.to_address || request.dropoff_address || 'Bırakılacak adres';
  const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
  const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
  const toLat = parseFloat(request.to_latitude || request.dropoff_latitude || '0');
  const toLng = parseFloat(request.to_longitude || request.dropoff_longitude || '0');

  return (
    <SafeAreaView style={styles.container} edges={['bottom']}>
      <AppBar title="Evden Eve Nakliye" showBackButton onBackPress={() => navigation.goBack()} />

      <KeyboardAvoidingView
        style={styles.keyboardAvoid}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Araç Seçimi */}
          <VehicleSelector
            vehicles={vehicles}
            selectedId={selectedVehicleId}
            onSelect={setSelectedVehicleId}
            serviceType="nakliye"
            loading={vehiclesLoading}
            onAddVehicle={() => navigation.navigate('VehiclesScreen')}
          />

          {providerType === 'company' && (
            <EmployeeSelector
              employees={employees}
              selectedId={selectedEmployeeId}
              onSelect={setSelectedEmployeeId}
              loading={employeesLoading}
            />
          )}

          <AddressInfoCard
            fromAddress={fromAddress}
            toAddress={toAddress}
            fromLat={fromLat}
            fromLng={fromLng}
            toLat={toLat}
            toLng={toLng}
            floorFrom={request.floor_from}
            floorTo={request.floor_to}
            hasElevatorFrom={request.has_elevator_from}
            hasElevatorTo={request.has_elevator_to}
            totalDistance={totalDistance}
          />

          <PhotosSection photos={request.photos} />

          <MovingDetailsCard
            homeType={request.home_type}
            hasLargeItems={request.has_large_items}
            largeItemsNote={request.large_items_note}
            hasFragileItems={request.has_fragile_items}
            needsPacking={request.needs_packing}
            needsDisassembly={request.needs_disassembly}
            preferredDate={request.preferred_date}
            preferredTimeSlot={request.preferred_time_slot}
            additionalNotes={request.additional_notes}
            distanceToPickup={distanceToPickup}
          />

          <PriceOfferCard
            price={proposedPrice}
            onPriceChange={handlePriceChange}
            error={priceError}
            hint="Evden eve nakliye için teklif edeceğiniz fiyatı girin."
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

          <Text style={styles.disclaimer}>
            Teklif gönderdiğinizde, müşteri teklifinizi değerlendirecek ve kabul ederse sizinle iletişime geçilecektir.
          </Text>
        </ScrollView>
      </KeyboardAvoidingView>
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
  scrollView: {
    flex: 1,
  },
  content: {
    padding: 16,
    paddingBottom: 40,
  },
  submitButton: {
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    backgroundColor: '#26a69a',
  },
  submitButtonContent: {
    paddingVertical: 8,
  },
  disclaimer: {
    fontSize: 12,
    color: '#999',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 16,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emptyText: {
    marginTop: 16,
    fontSize: 16,
    color: '#999',
    textAlign: 'center',
  },
});

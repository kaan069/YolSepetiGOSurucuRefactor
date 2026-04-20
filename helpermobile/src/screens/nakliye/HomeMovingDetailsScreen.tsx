import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, HomeMovingInfo, MovingVehicleType } from '../../store/useVehicleStore';
import { useRegistrationDataStore, ServiceType } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import AppBar from '../../components/common/AppBar';
import SelectDropdown from '../../components/common/SelectDropdown';

// Nakliye araç tipi seçenekleri
const MOVING_VEHICLE_TYPE_OPTIONS = [
  { value: 'closed_truck', label: 'Kapalı Kasa Kamyon' },
  { value: 'closed_pickup', label: 'Kapalı Kasa Kamyonet' },
  { value: 'elevator_truck', label: 'Asansörlü Nakliye Aracı' },
  { value: 'panelvan', label: 'Panelvan (Kargo Van)' },
  { value: 'open_truck', label: 'Açık Kasa Kamyon' },
  { value: 'open_pickup', label: 'Açık Kasa Kamyonet' },
  { value: 'refrigerated', label: 'Frigorifik (Soğutuculu) Araç' },
  { value: 'tir', label: 'Tır' },
  { value: 'lowbed', label: 'Lowbed' },
  { value: 'partial_load', label: 'Parsiyel Yük Aracı' },
];

import {
  HomeMovingBasicInfoSection,
  AddedHomeMovingCard,
  HomeMovingLoadingOverlay,
  VehiclePhotoSection,
} from './components';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'HomeMovingDetails'>;

type HomeMovingFormData = Omit<HomeMovingInfo, 'id'>;

const initialFormState: HomeMovingFormData = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  vehicleType: 'van',
  movingVehicleType: undefined, // Nakliye araç tipi (backend enum)
  capacity: '',
  volume: '',
  length: '',
  width: '',
  height: '',
  hasLift: false,
  hasRamp: false,
  equipment: [],
  hasHelper: false,
  helperCount: '0',
  pricePerKm: '',
  pricePerHour: '',
  minPrice: '',
};

export default function HomeMovingDetailsScreen({ navigation, route }: Props) {
  const fromRegistration = route.params?.fromRegistration === true;
  const { homeMoving, addHomeMoving, removeHomeMoving } = useVehicleStore();
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<HomeMovingFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);

  const updateField = (field: keyof HomeMovingFormData) => (value: any) => {
    setCurrentVehicle(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateVehicle = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentVehicle.plate.trim()) newErrors.plate = 'Plaka gerekli';
    if (!currentVehicle.brand.trim()) newErrors.brand = 'Marka gerekli';
    if (!currentVehicle.model.trim()) newErrors.model = 'Model gerekli';
    if (!currentVehicle.movingVehicleType) newErrors.movingVehicleType = 'Araç tipi seçimi gerekli';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVehicle = async () => {
    if (!validateVehicle()) return;

    setLoading(true);

    try {
      // API'ye nakliye aracı oluştur
      const nakliyeData = await vehiclesAPI.createNakliyeVehicle({
        brand: currentVehicle.brand,
        model: currentVehicle.model,
        year: parseInt(currentVehicle.year) || new Date().getFullYear(),
        plate_number: currentVehicle.plate.toUpperCase(),
        vehicle_type: currentVehicle.movingVehicleType!, // Nakliye araç tipi (zorunlu)
        capacity_type: 'medium',
        max_volume: 10,
        max_weight: 1000,
        has_helper: false,
      });

      logger.debug('orders', 'Nakliye arac oluturuldu');

      // Fotoğraf yükleme
      let photoUploadSuccess = false;
      if ((vehiclePhoto || insurancePhoto) && nakliyeData.id) {
        try {
          logger.debug('orders', 'NAKLYE FOTORAF YKLEME LEM BALIYOR...');
          await vehiclesAPI.uploadNakliyeVehiclePhoto(nakliyeData.id, vehiclePhoto || undefined, insurancePhoto || undefined);
          logger.debug('orders', 'NAKLYE FOTORAF BAARIYLA YKLEND');
          photoUploadSuccess = true;
        } catch (photoError: any) {
          logger.error('orders', 'NAKLYE FOTORAF YKLEME HATASI');
          const photoErrorMessage = photoError?.response?.data?.error ||
                                    photoError?.response?.data?.message ||
                                    photoError?.message ||
                                    'Fotoğraf yüklenirken bir hata oluştu';
          Alert.alert('Uyarı', `Araç eklendi ama fotoğraf yüklenemedi:\n\n${photoErrorMessage}\n\nFotoğrafı daha sonra araç düzenleme sayfasından ekleyebilirsiniz.`);
        }
      }

      // Local store'a ekle
      addHomeMoving({ ...currentVehicle, plate: currentVehicle.plate.toUpperCase() });

      // Başarı mesajı göster
      const successMessage = vehiclePhoto && photoUploadSuccess
        ? 'Nakliye aracı ve fotoğraf başarıyla eklendi!'
        : vehiclePhoto && !photoUploadSuccess
        ? 'Nakliye aracı başarıyla eklendi! (Fotoğraf yüklenemedi)'
        : 'Nakliye aracı başarıyla eklendi!';

      Alert.alert('Başarılı', successMessage);

      // Backend'den araç listesini yenile
      try {
        await vehiclesAPI.loadUserVehicles();
      } catch (e) {
        logger.warn('orders', 'Ara listesi yenilenirken hata');
      }

      // Formu sıfırla - birden fazla araç eklenebilsin
      setCurrentVehicle(initialFormState);
      setVehiclePhoto(null);
      setInsurancePhoto(null);
    } catch (error: any) {
      logger.error('orders', 'Create nakliye vehicle error');
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          'Araç eklenirken bir hata oluştu. Lütfen tekrar deneyin.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeVehicle = (id: string) => {
    removeHomeMoving(id);
  };

  const navigateToNextScreen = (nextType: ServiceType | null) => {
    if (nextType === 'towTruck') {
      navigation.navigate('TowTruckDetails', { fromRegistration: true });
    } else if (nextType === 'crane') {
      navigation.navigate('CraneDetails', { fromRegistration: true });
    } else if (nextType === 'roadAssistance') {
      navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
    } else if (nextType === 'homeToHomeMoving' || nextType === 'cityToCity') {
      navigation.navigate('HomeMovingDetails', { fromRegistration: true });
    } else if (nextType === 'transfer') {
      navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
    }
  };

  const handleContinue = async () => {
    if (homeMoving.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir nakliye aracı ekleyin');
      return;
    }

    // Kayıt akışında değilse ve zaten giriş yapılmışsa geri dön
    if (!fromRegistration) {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        navigation.goBack();
        return;
      }
    }

    // Her iki nakliye türünü de tamamlanmış olarak işaretle
    completeVehicleType('homeToHomeMoving');
    completeVehicleType('cityToCity');
    const nextServiceType = getNextVehicleType();

    if (nextServiceType) {
      navigateToNextScreen(nextServiceType);
    } else {
      // Tüm araç tipleri tamamlandı, belgelere git
      navigation.navigate('DocumentsScreen', { fromRegistration: true });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AppBar title="Nakliye Araçları" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            🚚 Nakliye Araçlarım
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Evden eve ve şehirler arası nakliye hizmeti vereceğiniz araçların detaylarını girin
          </Text>
        </View>

        {/* Add New Vehicle Form */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Yeni Araç Ekle
            </Text>

            <HomeMovingBasicInfoSection
              plate={currentVehicle.plate}
              brand={currentVehicle.brand}
              model={currentVehicle.model}
              year={currentVehicle.year}
              onPlateChange={updateField('plate')}
              onBrandChange={updateField('brand')}
              onModelChange={updateField('model')}
              onYearChange={updateField('year')}
              errors={errors}
            />

            {/* Nakliye Araç Tipi Seçimi */}
            <SelectDropdown
              label="Araç Tipi"
              value={currentVehicle.movingVehicleType || ''}
              options={MOVING_VEHICLE_TYPE_OPTIONS}
              onChange={(value) => updateField('movingVehicleType')(value as MovingVehicleType)}
              placeholder="Araç tipi seçin"
              error={errors.movingVehicleType}
              required
              primaryColor="#1565c0"
            />

            <VehiclePhotoSection
              vehiclePhoto={vehiclePhoto}
              onPhotoChange={setVehiclePhoto}
              title="Nakliye Aracı Fotoğrafı"
              helperText="Plaka görünür şekilde araç fotoğrafı ekleyin"
              primaryColor="#1565c0"
            />

            <VehiclePhotoSection
              vehiclePhoto={insurancePhoto}
              onPhotoChange={setInsurancePhoto}
              title="Sigorta Belgesi (Opsiyonel)"
              helperText="Araç sigorta belgesini fotoğraf veya PDF olarak yükleyin"
              primaryColor="#1565c0"
            />

            <Button
              mode="contained"
              onPress={addVehicle}
              loading={loading}
              disabled={loading}
              style={styles.addButton}
              icon="plus"
            >
              {loading ? 'Araç Ekleniyor...' : 'Aracı Ekle'}
            </Button>
          </Card.Content>
        </Card>

        {/* Continue Button */}
        {homeMoving.length > 0 && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              Devam Et ({homeMoving.length} Araç)
            </Button>
          </View>
        )}

        {/* Added Vehicles List */}
        {homeMoving.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Eklenen Araçlar ({homeMoving.length})
              </Text>

              {homeMoving.map((vehicle) => (
                <AddedHomeMovingCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onRemove={removeVehicle}
                />
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <HomeMovingLoadingOverlay visible={loading} />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#1565c0',
  },
  addButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#1565c0',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  continueButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

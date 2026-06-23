import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, RoadAssistanceInfo } from '../../store/useVehicleStore';
import { useRegistrationDataStore, ServiceType } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import AppBar from '../../components/common/AppBar';
import { SelectDropdown } from '../../components/common';
import { TRANSPORT_VEHICLE_BRANDS, getVehicleYears, getModelsByBrand } from '../../data/vehicleData';

import {
  AddedServiceCard,
  LoadingOverlay,
  VehiclePhotoSection,
} from './components';
import { logger } from '../../utils/logger';

const PLATE_REGEX = /^[0-9]{2}[A-Z]{1,3}[0-9]{2,4}$/;

type Props = NativeStackScreenProps<RootStackParamList, 'RoadAssistanceDetails'>;

type RoadAssistanceFormData = Omit<RoadAssistanceInfo, 'id'>;

// Araç bilgileri için ek state
interface VehicleFormData {
  plate: string;
  brand: string;
  model: string;
  year: string;
}

const initialFormState: RoadAssistanceFormData = {
  services: [],
  pricePerService: '',
  pricePerKm: '',
  workingAreas: [],
  is24Hours: true,
  workingHoursStart: '',
  workingHoursEnd: '',
};

const initialVehicleFormState: VehicleFormData = {
  plate: '',
  brand: '',
  model: '',
  year: '',
};

export default function RoadAssistanceDetailsScreen({ navigation, route }: Props) {
  const fromRegistration = route.params?.fromRegistration === true;
  const { roadAssistance, addRoadAssistance, removeRoadAssistance } = useVehicleStore();
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentService, setCurrentService] = useState<RoadAssistanceFormData>(initialFormState);
  const [vehicleForm, setVehicleForm] = useState<VehicleFormData>(initialVehicleFormState);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateVehicleField = (field: keyof VehicleFormData) => (value: string) => {
    setVehicleForm(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const brandOptions = TRANSPORT_VEHICLE_BRANDS.map(b => ({ value: b.value, label: b.label }));
  const availableModels = vehicleForm.brand ? getModelsByBrand(vehicleForm.brand, 'transport') : [];
  const modelOptions = availableModels.map(m => ({ value: m, label: m }));
  const yearOptions = getVehicleYears().map(y => ({ value: y.toString(), label: y.toString() }));

  const validateService = (): boolean => {
    const newErrors: Record<string, string> = {};

    const plate = vehicleForm.plate.trim().toUpperCase().replace(/\s/g, '');
    if (!plate) {
      newErrors.plate = 'Plaka gerekli';
    } else if (!PLATE_REGEX.test(plate)) {
      newErrors.plate = 'Geçerli bir plaka giriniz (örn. 34ABC1234)';
    }

    if (!vehicleForm.brand.trim()) newErrors.brand = 'Marka gerekli';
    if (!vehicleForm.model.trim()) newErrors.model = 'Model gerekli';
    if (!vehicleForm.year.trim()) newErrors.year = 'Yıl gerekli';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addService = async () => {
    if (!validateService()) return;

    if (!vehiclePhoto) {
      Alert.alert('Eksik Bilgi', 'Araç fotoğrafı zorunludur.');
      return;
    }
    if (!insurancePhoto) {
      Alert.alert('Eksik Bilgi', 'Sigorta belgesi zorunludur.');
      return;
    }

    setLoading(true);

    try {
      // API'ye yol yardım aracı oluştur
      const roadAssistanceData = await vehiclesAPI.createRoadAssistanceVehicle({
        brand: vehicleForm.brand,
        model: vehicleForm.model,
        year: parseInt(vehicleForm.year) || new Date().getFullYear(),
        plate_number: vehicleForm.plate.toUpperCase(),
      });

      logger.debug('orders', 'Yol yardm arac oluturuldu');

      // Fotoğraf yükleme
      let photoUploadSuccess = false;
      if ((vehiclePhoto || insurancePhoto) && roadAssistanceData.id) {
        try {
          logger.debug('orders', 'YOL YARDIM FOTORAF YKLEME LEM BALIYOR...');
          await vehiclesAPI.uploadRoadAssistanceVehiclePhoto(roadAssistanceData.id, vehiclePhoto || undefined, insurancePhoto || undefined);
          logger.debug('orders', 'YOL YARDIM FOTORAF BAARIYLA YKLEND');
          photoUploadSuccess = true;
        } catch (photoError: any) {
          logger.error('orders', 'YOL YARDIM FOTORAF YKLEME HATASI');
          const photoErrorMessage = photoError?.response?.data?.error ||
                                    photoError?.response?.data?.message ||
                                    photoError?.message ||
                                    'Fotoğraf yüklenirken bir hata oluştu';
          Alert.alert('Uyarı', `Araç eklendi ama fotoğraf yüklenemedi:\n\n${photoErrorMessage}\n\nFotoğrafı daha sonra araç düzenleme sayfasından ekleyebilirsiniz.`);
        }
      }

      // Local store'a ekle
      addRoadAssistance({ ...currentService });

      // Backend'den araç listesini yenile
      try {
        await vehiclesAPI.loadUserVehicles();
      } catch (e) {
        logger.warn('orders', 'Ara listesi yenilenirken hata');
      }

      // Kayıt akışındaysa otomatik devam et
      if (fromRegistration) {
        setCurrentService(initialFormState);
        setVehicleForm(initialVehicleFormState);
        setVehiclePhoto(null);
        setInsurancePhoto(null);

        // Bir sonraki adıma geç
        completeVehicleType('roadAssistance');
        const nextServiceType = getNextVehicleType();

        logger.debug('orders', 'Yol yardm kayd tamamland sonraki tip');

        if (nextServiceType) {
          navigateToNextScreen(nextServiceType);
        } else {
          navigation.navigate('DocumentsScreen', { fromRegistration: true });
        }
        return;
      }

      // Normal mod: Alert göster
      const successMessage = vehiclePhoto && photoUploadSuccess
        ? 'Yol yardım aracı ve fotoğraf başarıyla eklendi!'
        : vehiclePhoto && !photoUploadSuccess
        ? 'Yol yardım aracı başarıyla eklendi! (Fotoğraf yüklenemedi)'
        : 'Yol yardım aracı başarıyla eklendi!';

      Alert.alert('Başarılı', successMessage);

      // Formları sıfırla
      setCurrentService(initialFormState);
      setVehicleForm(initialVehicleFormState);
      setVehiclePhoto(null);
    } catch (error: any) {
      logger.error('orders', 'Create road assistance vehicle error');
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          'Araç eklenirken bir hata oluştu. Lütfen tekrar deneyin.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
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
    if (roadAssistance.length === 0) {
      Alert.alert('Uyarı', 'Lütfen en az bir yol yardım hizmeti ekleyin');
      return;
    }

    // Kayıt akışındaysak devam et, değilse geri dön
    if (!fromRegistration) {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        navigation.goBack();
        return;
      }
    }

    completeVehicleType('roadAssistance');
    const nextServiceType = getNextVehicleType();

    if (nextServiceType) {
      navigateToNextScreen(nextServiceType);
    } else {
      // Tüm araç tipleri tamamlandı, belgelere git
      logger.debug('orders', 'Yol yardm kayd tamamland belgelere ynlendiriliyor...');
      navigation.navigate('DocumentsScreen', { fromRegistration: true });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AppBar title="Yol Yardım Hizmeti" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            🆘 Yol Yardım Hizmetlerim
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Yolda kalan araçlara vereceğiniz hizmetlerin detaylarını girin
          </Text>
        </View>

        {/* Add New Service Form */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Yeni Araç ve Hizmet Ekle
            </Text>

            {/* Araç Bilgileri */}
            <Text variant="titleSmall" style={styles.subsectionTitle}>
              Araç Bilgileri
            </Text>

            <TextInput
              label="Plaka *"
              value={vehicleForm.plate}
              onChangeText={(v) => updateVehicleField('plate')(v.replace(/\s/g, '').toUpperCase())}
              style={styles.input}
              error={!!errors.plate}
              autoCapitalize="characters"
              maxLength={9}
              placeholder="34ABC1234"
            />
            {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}

            <SelectDropdown
              label="Marka"
              value={vehicleForm.brand}
              options={brandOptions}
              onChange={(value) => {
                updateVehicleField('brand')(value);
                if (vehicleForm.model) updateVehicleField('model')('');
              }}
              placeholder="Marka seçiniz"
              error={errors.brand}
              searchable
              searchPlaceholder="Marka ara..."
              required
              primaryColor="#26a69a"
            />

            <SelectDropdown
              label="Model"
              value={vehicleForm.model}
              options={modelOptions}
              onChange={updateVehicleField('model')}
              placeholder={vehicleForm.brand ? 'Model seçiniz' : 'Önce marka seçiniz'}
              disabled={!vehicleForm.brand}
              error={errors.model}
              searchable
              searchPlaceholder="Model ara..."
              required
              primaryColor="#26a69a"
            />

            <SelectDropdown
              label="Yıl"
              value={vehicleForm.year}
              options={yearOptions}
              onChange={updateVehicleField('year')}
              placeholder="Yıl seçiniz"
              error={errors.year}
              searchable
              searchPlaceholder="Yıl ara..."
              required
              primaryColor="#26a69a"
            />

            <VehiclePhotoSection
              vehiclePhoto={vehiclePhoto}
              onPhotoChange={setVehiclePhoto}
              title="Yol Yardım Aracı Fotoğrafı"
              helperText="Plaka görünür şekilde araç fotoğrafı ekleyin"
              required
            />

            <VehiclePhotoSection
              vehiclePhoto={insurancePhoto}
              onPhotoChange={setInsurancePhoto}
              title="Sigorta Belgesi"
              helperText="Araç sigorta belgesini fotoğraf veya PDF olarak yükleyin"
              required
            />

            <Button
              mode="contained"
              onPress={addService}
              loading={loading}
              disabled={loading}
              style={styles.addButton}
              icon="plus"
            >
              {loading ? 'Ekleniyor...' : 'Aracı ve Hizmeti Ekle'}
            </Button>
          </Card.Content>
        </Card>

        {/* Continue Button - Sadece düzenleme modunda göster */}
        {!fromRegistration && roadAssistance.length > 0 && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              Devam Et ({roadAssistance.length} Hizmet)
            </Button>
          </View>
        )}

        {/* Added Services List - Sadece düzenleme modunda göster */}
        {!fromRegistration && roadAssistance.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Eklenen Hizmetler ({roadAssistance.length})
              </Text>

              {roadAssistance.map((service) => (
                <AddedServiceCard
                  key={service.id}
                  service={service}
                  onRemove={removeRoadAssistance}
                />
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <LoadingOverlay visible={loading} />
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
    color: '#e65100',
  },
  subsectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    marginTop: 8,
    color: '#666',
  },
  input: {
    marginBottom: 12,
    backgroundColor: 'white',
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 4,
  },
  addButton: {
    marginTop: 16,
    borderRadius: 12,
    backgroundColor: '#e65100',
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

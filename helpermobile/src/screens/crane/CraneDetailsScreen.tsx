// Vinç Araç Kayıt Ekranı - Crane Registration Screen
// Bu ekran vinç araç kayıt işlemlerini yönetir
// This screen manages crane registration process
import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, CraneInfo } from '../../store/useVehicleStore';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import { AppBar } from '../../components/common';
import { CRANE_BRANDS, getVehicleYears, getModelsByBrand } from '../../data/vehicleData';

import {
  BasicInfoSection,
  VehiclePhotoSection,
  TechnicalSpecsSection,
  AddedCraneCard,
  CraneLoadingOverlay,
} from './components';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'CraneDetails'>;

type CraneFormData = Omit<CraneInfo, 'id'>;

const initialFormState: CraneFormData = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  maxHeight: '',
};

export default function CraneDetailsScreen({ navigation, route }: Props) {
  const fromRegistration = route.params?.fromRegistration === true;
  const { cranes, addCrane } = useVehicleStore();
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();

  const [currentCrane, setCurrentCrane] = useState<CraneFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);

  // Dinamik yıl listesi ve model listesi
  const vehicleYears = getVehicleYears();
  const availableModels = currentCrane.brand ? getModelsByBrand(currentCrane.brand, 'crane') : [];

  // SelectDropdown için options formatı
  const brandOptions = CRANE_BRANDS.map(b => ({ value: b.value, label: b.label }));
  const modelOptions = availableModels.map(m => ({ value: m, label: m }));
  const yearOptions = vehicleYears.map(y => ({ value: y.toString(), label: y.toString() }));

  // Form alanlarını güncelleme fonksiyonu
  const updateField = (field: keyof CraneFormData) => (value: string) => {
    setCurrentCrane(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // Marka değiştiğinde modeli sıfırla
  const handleBrandChange = (brandValue: string) => {
    setCurrentCrane(prev => ({ ...prev, brand: brandValue, model: '' }));
    if (errors.brand) setErrors(prev => ({ ...prev, brand: '' }));
    if (errors.model) setErrors(prev => ({ ...prev, model: '' }));
  };

  // Form validasyon fonksiyonu
  const validateCrane = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentCrane.plate.trim()) newErrors.plate = 'Plaka gerekli';
    if (!currentCrane.brand.trim()) newErrors.brand = 'Marka gerekli';
    if (!currentCrane.model.trim()) newErrors.model = 'Model gerekli';
    if (!currentCrane.year.trim()) {
      newErrors.year = 'Yıl gerekli';
    } else {
      const year = parseInt(currentCrane.year);
      if (isNaN(year) || year < 1900 || year > 2025) {
        newErrors.year = 'Yıl 1900-2025 arasında olmalı';
      }
    }
    if (!currentCrane.maxHeight.trim()) newErrors.maxHeight = 'Maksimum yükseklik gerekli';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Yeni vinç ekleme fonksiyonu
  const addNewCrane = async () => {
    if (!validateCrane()) return;

    setLoading(true);

    try {
      // API'ye vinç oluştur
      const craneData = await vehiclesAPI.createCrane({
        brand: currentCrane.brand,
        model: currentCrane.model,
        year: parseInt(currentCrane.year),
        plate_number: currentCrane.plate.toUpperCase(),
        color: 'Sarı', // Default renk - vinçler genellikle sarı
        max_height: parseInt(currentCrane.maxHeight),
      });

      logger.debug('orders', 'Vin oluturuldu');

      // Fotoğraf yükleme durumu
      let photoUploadSuccess = false;

      if ((vehiclePhoto || insurancePhoto) && craneData.id) {
        try {
          logger.debug('orders', 'VIN FOTORAF YKLEME LEM BALIYOR...');
          await vehiclesAPI.uploadCranePhoto(craneData.id, vehiclePhoto || undefined, insurancePhoto || undefined);
          logger.debug('orders', 'VIN FOTORAF BAARIYLA YKLEND');
          photoUploadSuccess = true;
        } catch (photoError: any) {
          logger.error('orders', 'VIN FOTORAF YKLEME HATASI');
          const photoErrorMessage = photoError?.response?.data?.error ||
                                    photoError?.response?.data?.message ||
                                    photoError?.message ||
                                    'Fotoğraf yüklenirken bir hata oluştu';
          Alert.alert('Uyarı', `Vinç eklendi ama fotoğraf yüklenemedi:\n\n${photoErrorMessage}\n\nFotoğrafı daha sonra araç düzenleme sayfasından ekleyebilirsiniz.`);
        }
      }

      // Local store'a ekle
      addCrane({
        ...currentCrane,
        plate: currentCrane.plate.toUpperCase(),
      });

      // Backend'den araç listesini yenile
      try {
        await vehiclesAPI.loadUserVehicles();
      } catch (e) {
        logger.warn('orders', 'Ara listesi yenilenirken hata');
      }

      // Kayıt akışındaysa otomatik devam et
      if (fromRegistration) {
        setCurrentCrane(initialFormState);
        setVehiclePhoto(null);
      setInsurancePhoto(null);

        // Bir sonraki adıma geç
        completeVehicleType('crane');
        const nextVehicleType = getNextVehicleType();

        logger.debug('orders', 'Vin kayd tamamland sonraki tip');

        if (nextVehicleType === 'towTruck') {
          navigation.navigate('TowTruckDetails', { fromRegistration: true });
        } else if (nextVehicleType === 'roadAssistance') {
          navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
        } else if (nextVehicleType === 'homeToHomeMoving' || nextVehicleType === 'cityToCity') {
          navigation.navigate('HomeMovingDetails', { fromRegistration: true });
        } else if (nextVehicleType === 'transfer') {
          navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
        } else {
          navigation.navigate('DocumentsScreen', { fromRegistration: true });
        }
        return;
      }

      // Normal mod: Alert göster
      const successMessage = vehiclePhoto && photoUploadSuccess
        ? 'Vinç ve fotoğraf başarıyla eklendi!'
        : vehiclePhoto && !photoUploadSuccess
        ? 'Vinç başarıyla eklendi! (Fotoğraf yüklenemedi)'
        : 'Vinç başarıyla eklendi!';

      Alert.alert('Başarılı', successMessage);

      // Formu sıfırla
      setCurrentCrane(initialFormState);
      setVehiclePhoto(null);
      setInsurancePhoto(null);
    } catch (error: any) {
      logger.error('orders', 'Create crane error');
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          'Vinç eklenirken bir hata oluştu. Lütfen tekrar deneyin.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeCrane = (id: string) => {
    const { removeCrane: removeCraneFromStore } = useVehicleStore.getState();
    removeCraneFromStore(id);
  };

  const handleContinue = async () => {
    if (!cranes || cranes.length === 0) {
      alert('Lütfen en az bir vinç ekleyin');
      return;
    }

    // Kayıt akışındaysak devam et, değilse VehiclesScreen'e git
    if (!fromRegistration) {
      const { isAuthenticated } = useAuthStore.getState();
      if (isAuthenticated) {
        navigation.navigate('VehiclesScreen');
        return;
      }
    }

    completeVehicleType('crane');
    const nextVehicleType = getNextVehicleType();

    if (nextVehicleType === 'towTruck') {
      navigation.navigate('TowTruckDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'roadAssistance') {
      navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'homeToHomeMoving' || nextVehicleType === 'cityToCity') {
      navigation.navigate('HomeMovingDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'transfer') {
      navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
    } else {
      // Tüm araç tipleri tamamlandı, belgelere git
      logger.debug('orders', 'Vin kayd tamamland belgelere ynlendiriliyor...');
      navigation.navigate('DocumentsScreen', { fromRegistration: true });
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <AppBar title="Vinç Detayları" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            🏗️ Vinç Araçlarım
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Hizmet vereceğiniz vinçlerin detaylarını girin
          </Text>
        </View>

        {/* Add New Crane Form */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Yeni Vinç Ekle
            </Text>

            <BasicInfoSection
              plate={currentCrane.plate}
              brand={currentCrane.brand}
              model={currentCrane.model}
              year={currentCrane.year}
              brandOptions={brandOptions}
              modelOptions={modelOptions}
              yearOptions={yearOptions}
              onPlateChange={updateField('plate')}
              onBrandChange={handleBrandChange}
              onModelChange={updateField('model')}
              onYearChange={updateField('year')}
              errors={errors}
            />

            <VehiclePhotoSection
              vehiclePhoto={vehiclePhoto}
              onPhotoChange={setVehiclePhoto}
            />

            <VehiclePhotoSection
              vehiclePhoto={insurancePhoto}
              onPhotoChange={setInsurancePhoto}
              title="Sigorta Belgesi (Opsiyonel)"
              helperText="Araç sigorta belgesini fotoğraf veya PDF olarak yükleyin"
            />

            <TechnicalSpecsSection
              maxHeight={currentCrane.maxHeight}
              onMaxHeightChange={updateField('maxHeight')}
              errors={errors}
            />

            <Button
              mode="contained"
              onPress={addNewCrane}
              loading={loading}
              disabled={loading}
              style={styles.addButton}
              icon="plus"
            >
              {loading ? 'Vinç Ekleniyor...' : 'Vinci Ekle'}
            </Button>
          </Card.Content>
        </Card>

        {/* Continue Button - Sadece düzenleme modunda göster */}
        {!fromRegistration && cranes && cranes.length > 0 && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              Devam Et ({cranes?.length || 0} Vinç)
            </Button>
          </View>
        )}

        {/* Added Cranes List - Sadece düzenleme modunda göster */}
        {!fromRegistration && cranes && cranes.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Eklenen Vinçler ({cranes?.length || 0})
              </Text>

              {cranes.map((crane) => (
                <AddedCraneCard
                  key={crane.id}
                  crane={crane}
                  onRemove={removeCrane}
                />
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <CraneLoadingOverlay visible={loading} />
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
    color: '#26a69a',
  },
  addButton: {
    marginTop: 16,
    borderRadius: 12,
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

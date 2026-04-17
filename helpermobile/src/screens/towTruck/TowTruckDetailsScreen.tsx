import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, TowTruckInfo } from '../../store/useVehicleStore';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import { AppBar } from '../../components/common';
import { TOW_TRUCK_BRANDS } from '../../data/vehicleData';

import {
  TowTruckBasicInfoSection,
  TowTruckPhotoSection,
  TowTruckVehicleTypesSection,
  AddedTowTruckCard,
  TowTruckLoadingOverlay,
} from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'TowTruckDetails'>;

type TowTruckFormData = Omit<TowTruckInfo, 'id'>;

const initialFormState: TowTruckFormData = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  platformType: 'open',
  supportedVehicleTypes: [],
};

export default function TowTruckDetailsScreen({ navigation, route }: Props) {
  const fromRegistration = route.params?.fromRegistration === true;
  const { towTrucks, addTowTruck, removeTowTruck } = useVehicleStore();
  const { completeVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentVehicle, setCurrentVehicle] = useState<TowTruckFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);

  const getBrandLabel = (brandValue: string) => {
    return TOW_TRUCK_BRANDS.find(b => b.value === brandValue)?.label || brandValue;
  };

  const updateField = (field: keyof TowTruckFormData) => (value: any) => {
    setCurrentVehicle(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const handleBrandChange = (brandValue: string) => {
    setCurrentVehicle(prev => ({ ...prev, brand: brandValue, model: '' }));
    if (errors.brand) setErrors(prev => ({ ...prev, brand: '' }));
    if (errors.model) setErrors(prev => ({ ...prev, model: '' }));
  };

  const toggleVehicleType = (vehicleType: string) => {
    setCurrentVehicle(prev => ({
      ...prev,
      supportedVehicleTypes: prev.supportedVehicleTypes.includes(vehicleType)
        ? prev.supportedVehicleTypes.filter(type => type !== vehicleType)
        : [...prev.supportedVehicleTypes, vehicleType]
    }));
  };

  const validateVehicle = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentVehicle.plate.trim()) newErrors.plate = 'Plaka gerekli';
    if (!currentVehicle.brand.trim()) newErrors.brand = 'Marka gerekli';
    if (!currentVehicle.model.trim()) newErrors.model = 'Model gerekli';
    if (!currentVehicle.year.trim()) {
      newErrors.year = 'Yil gerekli';
    } else {
      const year = parseInt(currentVehicle.year);
      if (isNaN(year) || year < 1900 || year > 2025) {
        newErrors.year = 'Yil 1900-2025 arasinda olmali';
      }
    }
    if (currentVehicle.supportedVehicleTypes.length === 0) {
      newErrors.supportedVehicleTypes = 'En az bir arac turu secmelisiniz';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVehicle = async () => {
    if (!validateVehicle()) return;

    setLoading(true);

    try {
      const towTruckData = await vehiclesAPI.createTowTruck({
        brand: getBrandLabel(currentVehicle.brand),
        model: currentVehicle.model,
        year: parseInt(currentVehicle.year),
        plate_number: currentVehicle.plate.toUpperCase(),
        color: 'Beyaz', // Default color for API requirement
        availibility_vehicles_types: currentVehicle.supportedVehicleTypes,
      });

      console.log('Cekici olusturuldu:', towTruckData);

      if ((vehiclePhoto || insurancePhoto) && towTruckData.id) {
        try {
          await vehiclesAPI.uploadTowTruckPhoto(towTruckData.id, vehiclePhoto || undefined, insurancePhoto || undefined);
          console.log('Fotograf yuklendi');
        } catch (photoError: any) {
          console.error('Fotograf yukleme hatasi:', photoError);
          const photoErrorMessage = photoError?.response?.data?.error ||
                                    photoError?.response?.data?.message ||
                                    photoError?.message ||
                                    'Fotograf yuklenirken bir hata olustu';
          Alert.alert('Uyari', `Cekici eklendi ama fotograf yuklenemedi:\n\n${photoErrorMessage}\n\nFotografi daha sonra arac duzenleme sayfasindan ekleyebilirsiniz.`);
        }
      }

      addTowTruck({
        ...currentVehicle,
        brand: getBrandLabel(currentVehicle.brand),
        plate: currentVehicle.plate.toUpperCase(),
      });

      // Backend'den araç listesini yenile
      try {
        await vehiclesAPI.loadUserVehicles();
      } catch (e) {
        console.warn('Araç listesi yenilenirken hata:', e);
      }

      // Kayıt akışındaysa otomatik devam et
      if (fromRegistration) {
        setCurrentVehicle(initialFormState);
        setVehiclePhoto(null);
        setInsurancePhoto(null);

        // Bir sonraki adıma geç
        completeVehicleType('towTruck');
        const { getNextVehicleType } = useRegistrationDataStore.getState();
        const nextVehicleType = getNextVehicleType();

        console.log('Cekici kaydi tamamlandi, sonraki tip:', nextVehicleType);

        if (nextVehicleType === 'crane') {
          navigation.navigate('CraneDetails', { fromRegistration: true });
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

      // Normal mod (VehiclesScreen'den): Alert göster
      Alert.alert('Basarili', vehiclePhoto ? 'Cekici ve fotograf basariyla eklendi!' : 'Cekici basariyla eklendi!');
      setCurrentVehicle(initialFormState);
      setVehiclePhoto(null);
    } catch (error: any) {
      console.error('Create tow truck error:', error);
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          'Cekici eklenirken bir hata olustu. Lutfen tekrar deneyin.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const removeVehicle = (id: string) => {
    removeTowTruck(id);
  };

  const handleContinue = async () => {
    if (!towTrucks || towTrucks.length === 0) {
      Alert.alert('Uyari', 'Lutfen en az bir arac ekleyin');
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

    completeVehicleType('towTruck');

    // Sonraki araç tipine yönlendir
    const { getNextVehicleType } = useRegistrationDataStore.getState();
    const nextVehicleType = getNextVehicleType();

    console.log('Cekici kaydi tamamlandi, sonraki tip:', nextVehicleType);

    if (nextVehicleType === 'crane') {
      navigation.navigate('CraneDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'roadAssistance') {
      navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'homeToHomeMoving' || nextVehicleType === 'cityToCity') {
      navigation.navigate('HomeMovingDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'transfer') {
      navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
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
      <AppBar title="Cekici Detaylari" />

      <ScrollView
        style={styles.content}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Cekici Araclarim
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Hizmet verecegimiz cekici araclarin detaylarini girin
          </Text>
        </View>

        {/* Add New Vehicle Form */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Yeni Cekici Ekle
            </Text>

            <TowTruckBasicInfoSection
              plate={currentVehicle.plate}
              brand={currentVehicle.brand}
              model={currentVehicle.model}
              year={currentVehicle.year}
              onPlateChange={updateField('plate')}
              onBrandChange={handleBrandChange}
              onModelChange={updateField('model')}
              onYearChange={updateField('year')}
              errors={errors}
            />

            <TowTruckPhotoSection
              vehiclePhoto={vehiclePhoto}
              onPhotoChange={setVehiclePhoto}
            />

            <TowTruckPhotoSection
              vehiclePhoto={insurancePhoto}
              onPhotoChange={setInsurancePhoto}
              title="Sigorta Belgesi (Opsiyonel)"
              helperText="Arac sigorta belgesini fotograf veya PDF olarak yukleyin"
            />

            <TowTruckVehicleTypesSection
              supportedVehicleTypes={currentVehicle.supportedVehicleTypes}
              onToggleVehicleType={toggleVehicleType}
              error={errors.supportedVehicleTypes}
            />

            <Button
              mode="contained"
              onPress={addVehicle}
              style={styles.addButton}
              icon="plus"
            >
              Cekiciyi Ekle
            </Button>
          </Card.Content>
        </Card>

        {/* Added Vehicles List - Sadece düzenleme modunda göster */}
        {!fromRegistration && towTrucks && towTrucks.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Eklenen Araclar ({towTrucks?.length || 0})
              </Text>

              {towTrucks.map((vehicle) => (
                <AddedTowTruckCard
                  key={vehicle.id}
                  vehicle={vehicle}
                  onRemove={removeVehicle}
                />
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      {/* Continue Button - Sadece düzenleme modunda göster */}
      {!fromRegistration && towTrucks && towTrucks.length > 0 && (
        <View style={styles.fixedFooter}>
          <Button
            mode="contained"
            onPress={handleContinue}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
            icon="arrow-right"
          >
            Devam Et ({towTrucks?.length || 0} Arac)
          </Button>
        </View>
      )}

      <TowTruckLoadingOverlay visible={loading} />
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
  scrollContent: {
    paddingBottom: 100,
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
  fixedFooter: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    paddingHorizontal: 20,
    paddingVertical: 16,
    paddingBottom: 24,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 8,
  },
  continueButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
});

import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { Button, Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, TransportInfo } from '../../store/useVehicleStore';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import AppBar from '../../components/common/AppBar';

import {
  TransportBasicInfoSection,
  VehicleTypeSection,
  TechnicalSpecsTransportSection,
  EquipmentSection,
  ServicesSection,
  TransportPricingSection,
  HelperStaffSection,
  TransportWorkingAreasSection,
  AddedTransportCard,
  TransportLoadingOverlay,
} from './components';

type Props = NativeStackScreenProps<RootStackParamList, 'TransportDetails'>;

type TransportFormData = Omit<TransportInfo, 'id'>;

const initialFormState: TransportFormData = {
  plate: '',
  brand: '',
  model: '',
  year: '',
  vehicleType: 'van',
  capacity: '',
  volume: '',
  length: '',
  width: '',
  height: '',
  maxWeight: '',
  hasLift: false,
  hasRamp: false,
  equipment: [],
  services: ['Ev Taşıma'],
  pricePerKm: '',
  pricePerHour: '',
  minPrice: '',
  hasHelper: true,
  helperCount: '1',
  workingAreas: ['Şehir İçi'],
};

export default function TransportDetailsScreen({ navigation }: Props) {
  const { transports, addTransport, removeTransport } = useVehicleStore();
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);
  const [currentTransport, setCurrentTransport] = useState<TransportFormData>(initialFormState);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateField = (field: keyof TransportFormData) => (value: any) => {
    setCurrentTransport(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleEquipment = (equipment: string) => {
    setCurrentTransport(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment]
    }));
  };

  const toggleService = (service: string) => {
    setCurrentTransport(prev => ({
      ...prev,
      services: prev.services.includes(service)
        ? prev.services.filter(s => s !== service)
        : [...prev.services, service]
    }));
    if (errors.services) {
      setErrors(prev => ({ ...prev, services: '' }));
    }
  };

  const toggleWorkingArea = (area: string) => {
    setCurrentTransport(prev => ({
      ...prev,
      workingAreas: prev.workingAreas.includes(area)
        ? prev.workingAreas.filter(w => w !== area)
        : [...prev.workingAreas, area]
    }));
  };

  const validateTransport = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!currentTransport.plate.trim()) newErrors.plate = 'Plaka gerekli';
    if (!currentTransport.brand.trim()) newErrors.brand = 'Marka gerekli';
    if (!currentTransport.model.trim()) newErrors.model = 'Model gerekli';
    if (!currentTransport.capacity.trim()) newErrors.capacity = 'Yük kapasitesi gerekli';
    if (!currentTransport.volume.trim()) newErrors.volume = 'Hacim kapasitesi gerekli';
    if (!currentTransport.pricePerKm.trim()) newErrors.pricePerKm = 'Km başına ücret gerekli';
    if (currentTransport.services.length === 0) newErrors.services = 'En az bir hizmet seçmelisiniz';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const addVehicle = () => {
    if (validateTransport()) {
      addTransport({ ...currentTransport, plate: currentTransport.plate.toUpperCase() });
      setCurrentTransport(initialFormState);
    }
  };

  const removeVehicle = (id: string) => {
    removeTransport(id);
  };

  const handleContinue = async () => {
    if (transports.length === 0) {
      alert('Lütfen en az bir nakliye aracı ekleyin');
      return;
    }

    const { isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated) {
      navigation.navigate('VehiclesScreen');
      return;
    }

    // Not: 'transport' ServiceType'da olmadığı için homeToHomeMoving kullanıyoruz
    // Bu nakliye kategorisine karşılık geliyor
    completeVehicleType('homeToHomeMoving');
    const nextVehicleType = getNextVehicleType();

    if (nextVehicleType === 'towTruck') {
      navigation.navigate('TowTruckDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'crane') {
      navigation.navigate('CraneDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'roadAssistance') {
      navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
    } else if (nextVehicleType === 'homeToHomeMoving' || nextVehicleType === 'cityToCity') {
      navigation.navigate('HomeMovingDetails', { fromRegistration: true });
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
      <AppBar title="Nakliye Detayları" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            🚚 Nakliye Araçlarım
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Nakliye hizmeti vereceğiniz araçların detaylarını girin
          </Text>
        </View>

        {/* Add New Transport Form */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Yeni Nakliye Aracı Ekle
            </Text>

            <TransportBasicInfoSection
              plate={currentTransport.plate}
              brand={currentTransport.brand}
              model={currentTransport.model}
              year={currentTransport.year}
              onPlateChange={updateField('plate')}
              onBrandChange={updateField('brand')}
              onModelChange={updateField('model')}
              onYearChange={updateField('year')}
              errors={errors}
            />

            <VehicleTypeSection
              vehicleType={currentTransport.vehicleType}
              onVehicleTypeChange={updateField('vehicleType')}
            />

            <TechnicalSpecsTransportSection
              capacity={currentTransport.capacity}
              volume={currentTransport.volume}
              length={currentTransport.length}
              width={currentTransport.width}
              height={currentTransport.height}
              maxWeight={currentTransport.maxWeight}
              hasLift={currentTransport.hasLift}
              hasRamp={currentTransport.hasRamp}
              onCapacityChange={updateField('capacity')}
              onVolumeChange={updateField('volume')}
              onLengthChange={updateField('length')}
              onWidthChange={updateField('width')}
              onHeightChange={updateField('height')}
              onMaxWeightChange={updateField('maxWeight')}
              onHasLiftChange={updateField('hasLift')}
              onHasRampChange={updateField('hasRamp')}
              errors={errors}
            />

            <EquipmentSection
              selectedEquipment={currentTransport.equipment}
              onToggleEquipment={toggleEquipment}
            />

            <ServicesSection
              selectedServices={currentTransport.services}
              onToggleService={toggleService}
              error={errors.services}
            />

            <TransportPricingSection
              pricePerKm={currentTransport.pricePerKm}
              pricePerHour={currentTransport.pricePerHour}
              minPrice={currentTransport.minPrice}
              onPricePerKmChange={updateField('pricePerKm')}
              onPricePerHourChange={updateField('pricePerHour')}
              onMinPriceChange={updateField('minPrice')}
              errors={errors}
            />

            <HelperStaffSection
              hasHelper={currentTransport.hasHelper}
              helperCount={currentTransport.helperCount}
              onHasHelperChange={updateField('hasHelper')}
              onHelperCountChange={updateField('helperCount')}
            />

            <TransportWorkingAreasSection
              selectedAreas={currentTransport.workingAreas}
              onToggleArea={toggleWorkingArea}
            />

            <Button
              mode="contained"
              onPress={addVehicle}
              style={styles.addButton}
              icon="plus"
            >
              Nakliye Aracını Ekle
            </Button>
          </Card.Content>
        </Card>

        {/* Continue Button */}
        {transports.length > 0 && (
          <View style={styles.buttonContainer}>
            <Button
              mode="contained"
              onPress={handleContinue}
              style={styles.continueButton}
              contentStyle={styles.buttonContent}
            >
              Devam Et ({transports.length} Araç)
            </Button>
          </View>
        )}

        {/* Added Transports List */}
        {transports.length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Eklenen Nakliye Araçları ({transports.length})
              </Text>

              {transports.map((transport) => (
                <AddedTransportCard
                  key={transport.id}
                  transport={transport}
                  onRemove={removeVehicle}
                />
              ))}
            </Card.Content>
          </Card>
        )}
      </ScrollView>

      <TransportLoadingOverlay visible={loading} />
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

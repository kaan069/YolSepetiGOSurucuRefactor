import React, { useState, useRef, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Animated, Modal, Alert } from 'react-native';
import { Button, Card, Text, TextInput, useTheme, Chip, Menu, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, CityToCityInfo } from '../../store/useVehicleStore';
import { useRegistrationDataStore, ServiceType } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'CityToCityDetails'>;

type CityToCityFormData = Omit<CityToCityInfo, 'id'>;

// Araç türleri
const vehicleTypes = [
  { value: 'van', label: 'Kamyonet', icon: '🚐', description: 'Küçük yükler için (1-3 ton)' },
  { value: 'small-truck', label: 'Küçük Kamyon', icon: '🚚', description: 'Orta boy yükler için (5-10 ton)' },
  { value: 'truck', label: 'Kamyon', icon: '🚛', description: 'Büyük yükler için (15-25 ton)' },
  { value: 'large-truck', label: 'TIR', icon: '🚛', description: 'Çok büyük yükler için (25+ ton)' },
];

// Nakliye donanımları
const equipmentOptions = [
  'Ambalaj Malzemesi',
  'Koruma Örtüsü',
  'Taşıma Askısı',
  'Streç Film',
  'Hava Yastıklı Paket',
  'Mobilya Koruyucu',
  'Battaniye/Örtü',
  'Koli',
  'Bant',
  'İp/Kayış',
  'Forklift',
];

// Güzergah seçenekleri
const routeOptions = [
  'İstanbul - Ankara',
  'İstanbul - İzmir',
  'İstanbul - Bursa',
  'İstanbul - Antalya',
  'Ankara - İzmir',
  'Ankara - Antalya',
  'İzmir - Antalya',
  'Marmara Bölgesi',
  'Ege Bölgesi',
  'Akdeniz Bölgesi',
  'İç Anadolu Bölgesi',
  'Karadeniz Bölgesi',
  'Doğu Anadolu Bölgesi',
  'Güneydoğu Anadolu Bölgesi',
  'Tüm Türkiye',
];

export default function CityToCityDetailsScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
  const { cityToCity, addCityToCity, removeCityToCity } = useVehicleStore();
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const [loading, setLoading] = useState(false);

  // Logo animation
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (loading) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [loading, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Form için initial state
  const getInitialVehicle = (): CityToCityFormData => ({
    plate: '',
    brand: '',
    model: '',
    year: '',
    vehicleType: 'truck',
    capacity: '',
    volume: '',
    length: '',
    width: '',
    height: '',
    hasLift: false,
    hasRamp: false,
    equipment: [],
    routes: [],
    pricePerKm: '',
    minPrice: '',
  });

  const [currentVehicle, setCurrentVehicle] = useState<CityToCityFormData>(getInitialVehicle());
  const [vehicleTypeMenuVisible, setVehicleTypeMenuVisible] = useState(false);
  const [showVehicleForm, setShowVehicleForm] = useState(true);

  const toggleEquipment = (equipment: string) => {
    setCurrentVehicle(prev => ({
      ...prev,
      equipment: prev.equipment.includes(equipment)
        ? prev.equipment.filter(e => e !== equipment)
        : [...prev.equipment, equipment],
    }));
  };

  const toggleRoute = (route: string) => {
    setCurrentVehicle(prev => ({
      ...prev,
      routes: prev.routes.includes(route)
        ? prev.routes.filter(r => r !== route)
        : [...prev.routes, route],
    }));
  };

  const isVehicleValid = () => {
    return (
      currentVehicle.plate.trim() !== '' &&
      currentVehicle.brand.trim() !== '' &&
      currentVehicle.model.trim() !== '' &&
      currentVehicle.year.trim() !== '' &&
      currentVehicle.capacity.trim() !== '' &&
      currentVehicle.volume.trim() !== '' &&
      currentVehicle.routes.length > 0 &&
      currentVehicle.pricePerKm.trim() !== '' &&
      currentVehicle.minPrice.trim() !== ''
    );
  };

  const handleAddVehicle = () => {
    if (!isVehicleValid()) {
      Alert.alert('Eksik Bilgi', 'Lütfen tüm zorunlu alanları doldurun ve en az bir güzergah seçin.');
      return;
    }

    addCityToCity(currentVehicle);
    setCurrentVehicle(getInitialVehicle());
    setShowVehicleForm(false);
  };

  const handleRemoveVehicle = (id: string) => {
    Alert.alert(
      'Araç Sil',
      'Bu aracı silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        { text: 'Sil', style: 'destructive', onPress: () => removeCityToCity(id) },
      ]
    );
  };

  const navigateToNextScreen = (serviceType: ServiceType) => {
    switch (serviceType) {
      case 'towTruck':
        navigation.navigate('TowTruckDetails');
        break;
      case 'crane':
        navigation.navigate('CraneDetails');
        break;
      case 'roadAssistance':
        navigation.navigate('RoadAssistanceDetails');
        break;
      case 'homeToHomeMoving':
        navigation.navigate('HomeMovingDetails');
        break;
      case 'cityToCity':
        navigation.navigate('CityToCityDetails');
        break;
      case 'transfer':
        navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
        break;
    }
  };

  const handleContinue = async () => {
    // Eğer form açıksa ve geçerliyse önce aracı ekle
    if (showVehicleForm && isVehicleValid()) {
      addCityToCity(currentVehicle);
    }

    // En az bir araç olmalı
    if (cityToCity.length === 0 && !isVehicleValid()) {
      Alert.alert('Hata', 'Lütfen en az bir araç ekleyin.');
      return;
    }

    // Check if user is already authenticated (post-registration service addition)
    const { isAuthenticated } = useAuthStore.getState();

    if (isAuthenticated) {
      navigation.goBack();
      return;
    }

    // Initial registration flow - continue to next service type
    completeVehicleType('cityToCity');

    const nextServiceType = getNextVehicleType();

    if (nextServiceType) {
      navigateToNextScreen(nextServiceType);
    } else {
      // Tüm hizmetler eklendi, kayıt tamamlandı
      try {
        setLoading(true);
        await vehiclesAPI.loadUserVehicles();
        setIsAuthenticated(true);
        Alert.alert('Başarılı', 'Kayıt başarıyla tamamlandı!');
      } catch (error: any) {
        console.error('Load vehicles error:', error);
        Alert.alert('Hata', 'Kayıt tamamlanırken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    }
  };

  const selectedVehicleType = vehicleTypes.find(v => v.value === currentVehicle.vehicleType);

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <AppBar title="Şehirler Arası Nakliye" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            🚚 Şehirler Arası Nakliye Araçlarım
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Şehirler arası yük ve eşya taşıma hizmeti vereceğiniz araçların detaylarını girin
          </Text>
        </View>

        {/* Add New Vehicle Form */}
        <Card style={styles.card}>
          <Card.Content>
            <View style={styles.cardHeader}>
              <Text variant="titleMedium" style={styles.cardTitle}>
                {cityToCity.length === 0 ? '📝 Araç Bilgileri' : '➕ Yeni Araç Ekle'}
              </Text>
              {cityToCity.length > 0 && !showVehicleForm && (
                <Button mode="text" onPress={() => setShowVehicleForm(true)}>
                  Araç Ekle
                </Button>
              )}
            </View>

            {showVehicleForm && (
              <>
                {/* Araç Türü Seçimi */}
                <Text variant="bodyMedium" style={styles.fieldLabel}>Araç Türü</Text>
                <Menu
                  visible={vehicleTypeMenuVisible}
                  onDismiss={() => setVehicleTypeMenuVisible(false)}
                  anchor={
                    <Button
                      mode="outlined"
                      onPress={() => setVehicleTypeMenuVisible(true)}
                      style={styles.menuButton}
                      contentStyle={styles.menuButtonContent}
                    >
                      {selectedVehicleType ? `${selectedVehicleType.icon} ${selectedVehicleType.label}` : 'Araç Türü Seçin'}
                    </Button>
                  }
                >
                  {vehicleTypes.map((type) => (
                    <Menu.Item
                      key={type.value}
                      onPress={() => {
                        setCurrentVehicle(prev => ({ ...prev, vehicleType: type.value as any }));
                        setVehicleTypeMenuVisible(false);
                      }}
                      title={`${type.icon} ${type.label} - ${type.description}`}
                    />
                  ))}
                </Menu>

                {/* Araç Bilgileri */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { marginTop: 16 }]}>Araç Bilgileri</Text>
                <View style={styles.row}>
                  <TextInput
                    label="Plaka *"
                    value={currentVehicle.plate}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, plate: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    autoCapitalize="characters"
                  />
                  <TextInput
                    label="Marka *"
                    value={currentVehicle.brand}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, brand: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                  />
                </View>
                <View style={styles.row}>
                  <TextInput
                    label="Model *"
                    value={currentVehicle.model}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, model: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                  />
                  <TextInput
                    label="Model Yılı *"
                    value={currentVehicle.year}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, year: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                    maxLength={4}
                  />
                </View>

                {/* Teknik Özellikler */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { marginTop: 16 }]}>Teknik Özellikler</Text>
                <View style={styles.row}>
                  <TextInput
                    label="Yük Kapasitesi (ton) *"
                    value={currentVehicle.capacity}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, capacity: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Hacim (m³) *"
                    value={currentVehicle.volume}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, volume: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                  />
                </View>

                <Text variant="bodySmall" style={styles.optionalLabel}>Kasa Boyutları (opsiyonel)</Text>
                <View style={styles.row}>
                  <TextInput
                    label="Uzunluk (m)"
                    value={currentVehicle.length}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, length: text }))}
                    mode="outlined"
                    style={[styles.input, styles.thirdInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Genişlik (m)"
                    value={currentVehicle.width}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, width: text }))}
                    mode="outlined"
                    style={[styles.input, styles.thirdInput]}
                    keyboardType="numeric"
                  />
                  <TextInput
                    label="Yükseklik (m)"
                    value={currentVehicle.height}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, height: text }))}
                    mode="outlined"
                    style={[styles.input, styles.thirdInput]}
                    keyboardType="numeric"
                  />
                </View>

                {/* Özellikler */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { marginTop: 16 }]}>Özellikler</Text>
                <View style={styles.chipRow}>
                  <Chip
                    selected={currentVehicle.hasLift}
                    onPress={() => setCurrentVehicle(prev => ({ ...prev, hasLift: !prev.hasLift }))}
                    style={styles.featureChip}
                    showSelectedCheck
                  >
                    Hidrolik Lift
                  </Chip>
                  <Chip
                    selected={currentVehicle.hasRamp}
                    onPress={() => setCurrentVehicle(prev => ({ ...prev, hasRamp: !prev.hasRamp }))}
                    style={styles.featureChip}
                    showSelectedCheck
                  >
                    Rampa
                  </Chip>
                </View>

                {/* Donanımlar */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { marginTop: 16 }]}>Donanımlar</Text>
                <View style={styles.chipContainer}>
                  {equipmentOptions.map((equipment) => (
                    <Chip
                      key={equipment}
                      selected={currentVehicle.equipment.includes(equipment)}
                      onPress={() => toggleEquipment(equipment)}
                      style={styles.chip}
                      showSelectedCheck
                    >
                      {equipment}
                    </Chip>
                  ))}
                </View>

                {/* Güzergahlar */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { marginTop: 16 }]}>Hizmet Güzergahları *</Text>
                <Text variant="bodySmall" style={styles.optionalLabel}>Hangi güzergahlarda hizmet veriyorsunuz?</Text>
                <View style={styles.chipContainer}>
                  {routeOptions.map((route) => (
                    <Chip
                      key={route}
                      selected={currentVehicle.routes.includes(route)}
                      onPress={() => toggleRoute(route)}
                      style={styles.chip}
                      showSelectedCheck
                    >
                      {route}
                    </Chip>
                  ))}
                </View>

                {/* Ücretlendirme */}
                <Text variant="bodyMedium" style={[styles.fieldLabel, { marginTop: 16 }]}>Referans Ücretlendirme</Text>
                <Text variant="bodySmall" style={styles.optionalLabel}>Her iş için manuel teklif vereceksiniz. Bu değerler referans olarak kullanılır.</Text>
                <View style={styles.row}>
                  <TextInput
                    label="Km Başı Ücret (₺) *"
                    value={currentVehicle.pricePerKm}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, pricePerKm: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon="currency-try" />}
                  />
                  <TextInput
                    label="Minimum Ücret (₺) *"
                    value={currentVehicle.minPrice}
                    onChangeText={(text) => setCurrentVehicle(prev => ({ ...prev, minPrice: text }))}
                    mode="outlined"
                    style={[styles.input, styles.halfInput]}
                    keyboardType="numeric"
                    left={<TextInput.Icon icon="currency-try" />}
                  />
                </View>

                {cityToCity.length > 0 && (
                  <View style={styles.formButtons}>
                    <Button
                      mode="outlined"
                      onPress={() => {
                        setCurrentVehicle(getInitialVehicle());
                        setShowVehicleForm(false);
                      }}
                      style={styles.cancelButton}
                    >
                      İptal
                    </Button>
                    <Button
                      mode="contained"
                      onPress={handleAddVehicle}
                      disabled={!isVehicleValid()}
                      style={styles.addButton}
                    >
                      Araç Ekle
                    </Button>
                  </View>
                )}
              </>
            )}
          </Card.Content>
        </Card>

        {/* Mevcut Araçlar Listesi */}
        {cityToCity.length > 0 && (
          <Card style={styles.card}>
            <Card.Content>
              <Text variant="titleMedium" style={styles.cardTitle}>
                🚛 Eklenen Araçlar ({cityToCity.length})
              </Text>
              {cityToCity.map((vehicle) => {
                const vType = vehicleTypes.find(v => v.value === vehicle.vehicleType);
                return (
                  <View key={vehicle.id} style={styles.vehicleItem}>
                    <View style={styles.vehicleInfo}>
                      <Text variant="titleSmall" style={styles.vehiclePlate}>
                        {vType?.icon} {vehicle.plate}
                      </Text>
                      <Text variant="bodySmall" style={styles.vehicleDetails}>
                        {vehicle.brand} {vehicle.model} ({vehicle.year}) • {vType?.label}
                      </Text>
                      <Text variant="bodySmall" style={styles.vehicleDetails}>
                        {vehicle.capacity} ton • {vehicle.volume} m³
                      </Text>
                      <Text variant="bodySmall" style={styles.vehicleDetails}>
                        Güzergahlar: {vehicle.routes.slice(0, 2).join(', ')}{vehicle.routes.length > 2 ? ` +${vehicle.routes.length - 2}` : ''}
                      </Text>
                    </View>
                    <IconButton
                      icon="delete"
                      size={20}
                      onPress={() => handleRemoveVehicle(vehicle.id)}
                    />
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Bilgi Kartı */}
        <Card style={[styles.card, styles.infoCard, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
          <Card.Content>
            <Text variant="titleSmall" style={styles.infoTitle}>📝 Bilgi</Text>
            <Text variant="bodySmall" style={styles.infoText}>
              Şehirler arası nakliye işlerinde her talep için ayrı teklif vereceksiniz.
              Mesafe, yük tipi ve özel gereksinimler fiyatı etkileyebilir.
            </Text>
          </Card.Content>
        </Card>

        {/* Devam Et Butonu */}
        <Button
          mode="contained"
          onPress={handleContinue}
          disabled={loading || (cityToCity.length === 0 && !isVehicleValid())}
          style={styles.continueButton}
          contentStyle={styles.buttonContent}
          loading={loading}
        >
          {loading ? 'Kaydediliyor...' : 'Kaydet ve Devam Et'}
        </Button>
      </ScrollView>

      {/* Loading Modal */}
      <Modal visible={loading} transparent animationType="fade">
        <View style={styles.loadingOverlay}>
          <View style={[styles.loadingContainer, { backgroundColor: cardBg }]}>
            <Animated.Text style={[styles.loadingIcon, { transform: [{ rotate: spin }] }]}>
              🚚
            </Animated.Text>
            <Text variant="titleMedium" style={styles.loadingText}>
              Araç bilgileri kaydediliyor...
            </Text>
          </View>
        </View>
      </Modal>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  titleContainer: {
    marginBottom: 20,
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
  },
  card: {
    marginBottom: 16,
    borderRadius: 12,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  cardTitle: {
    fontWeight: 'bold',
  },
  fieldLabel: {
    marginBottom: 8,
    fontWeight: '500',
  },
  optionalLabel: {
    opacity: 0.6,
    marginBottom: 8,
  },
  menuButton: {
    marginBottom: 8,
  },
  menuButtonContent: {
    justifyContent: 'flex-start',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 12,
  },
  halfInput: {
    flex: 1,
  },
  thirdInput: {
    flex: 1,
  },
  chipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 8,
  },
  featureChip: {
    marginRight: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    marginBottom: 4,
  },
  formButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
    marginTop: 16,
  },
  cancelButton: {
    flex: 1,
  },
  addButton: {
    flex: 1,
  },
  vehicleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  vehicleDetails: {
    opacity: 0.7,
    marginBottom: 2,
  },
  infoCard: {
  },
  infoTitle: {
    fontWeight: 'bold',
    color: '#1976d2',
    marginBottom: 8,
  },
  infoText: {
    color: '#1976d2',
    lineHeight: 18,
  },
  continueButton: {
    marginVertical: 20,
    borderRadius: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    padding: 32,
    borderRadius: 16,
    alignItems: 'center',
  },
  loadingIcon: {
    fontSize: 48,
    marginBottom: 16,
  },
  loadingText: {
    textAlign: 'center',
  },
});

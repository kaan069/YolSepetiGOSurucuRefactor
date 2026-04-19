// Transfer Araç Kayıt Ekranı - Transfer Vehicle Registration Screen
// Bu ekran transfer araç kayıt işlemlerini yönetir (Organizasyon / VIP)
import React, { useState, useMemo } from 'react';
import {
  View,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  TouchableOpacity,
  Image,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { Button, Card, Text, TextInput } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import { AppBar, SelectDropdown } from '../../components/common';
import { useAppTheme } from '../../hooks/useAppTheme';
import { TRANSPORT_VEHICLE_BRANDS, getVehicleYears, getModelsByBrand } from '../../data/vehicleData';

type Props = NativeStackScreenProps<RootStackParamList, 'TransferVehicleDetails'>;

type TransferType = 'organization' | 'vip';

interface DocumentField {
  key: string;
  label: string;
}

interface AddedVehicle {
  id: number;
  type: TransferType;
  plate: string;
  brand: string;
  model: string;
  year: string;
  passengerCapacity: string;
  vehicleClass: string;
  photoUri: string | null;
}

const COMMON_DOCUMENTS: DocumentField[] = [
  { key: 'license_photo', label: 'Ehliyet Fotografi' },
  { key: 'traffic_insurance_photo', label: 'Trafik Sigortasi' },
  { key: 'kasko_photo', label: 'Kasko Policesi' },
];

const VIP_DOCUMENTS: DocumentField[] = [
  { key: 'authority_certificate_photo', label: 'D2 Yetki Belgesi veya A1/A2 Belgesi' },
  { key: 'src_certificate_photo', label: 'SRC1/SRC2 Belgesi' },
  { key: 'psychotechnic_report_photo', label: 'Psikoteknik Rapor' },
  { key: 'passenger_seat_insurance_photo', label: 'Yolcu Koltuk Sigortasi' },
  { key: 'tourism_transport_certificate_photo', label: 'Turizm Tasimacilik Belgesi' },
];

const ORGANIZATION_DOCUMENTS: DocumentField[] = [
  { key: 'authority_certificate_photo', label: 'D2 veya B2 Yetki Belgesi' },
  { key: 's_plate_certificate_photo', label: 'S Plaka Belgesi' },
  { key: 'route_permit_photo', label: 'Guzergah Izin Belgesi' },
  { key: 'src_certificate_photo', label: 'SRC-2 Belgesi' },
  { key: 'psychotechnic_report_photo', label: 'Psikoteknik Rapor' },
  { key: 'passenger_seat_insurance_photo', label: 'Yolcu Koltuk Sigortasi' },
];

const ALL_VEHICLE_CLASSES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Arac' },
  { value: 'minibus', label: 'Minibus' },
  { value: 'midibus', label: 'Midibus' },
  { value: 'bus', label: 'Otobus' },
];

const VIP_VEHICLE_CLASSES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Arac' },
];

const CLASS_LABELS: Record<string, string> = {
  sedan: 'Sedan', vip_car: 'VIP Arac', minibus: 'Minibus', midibus: 'Midibus', bus: 'Otobus',
};

export default function TransferVehicleScreen({ navigation, route }: Props) {
  const fromRegistration = route.params?.fromRegistration === true;
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const { screenBg, cardBg, textPrimary, textSecondary, isDarkMode } = useAppTheme();

  const primaryColor = '#5C6BC0';

  // Transfer tipleri secimi
  const [selectedTransferTypes, setSelectedTransferTypes] = useState<TransferType[]>([]);
  // Eklenen araclar
  const [addedVehicles, setAddedVehicles] = useState<AddedVehicle[]>([]);
  const [expandedVehicleIndex, setExpandedVehicleIndex] = useState<number | null>(null);
  // Belge yukleme
  const [documentPhotos, setDocumentPhotos] = useState<Record<string, string>>({});
  const [finishLoading, setFinishLoading] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransferType>('organization');
  const [modalLoading, setModalLoading] = useState(false);

  // Modal form state
  const [mPlate, setMPlate] = useState('');
  const [mBrand, setMBrand] = useState('');
  const [mModel, setMModel] = useState('');
  const [mYear, setMYear] = useState('');
  const [mCapacity, setMCapacity] = useState('');
  const [mVehicleClass, setMVehicleClass] = useState('');
  const [mPhoto, setMPhoto] = useState<string | null>(null);
  const [mInteriorPhotos, setMInteriorPhotos] = useState<(string | null)[]>([null, null, null, null]);
  const [mErrors, setMErrors] = useState<Record<string, string>>({});

  const hasVip = selectedTransferTypes.includes('vip');
  const hasOrganization = selectedTransferTypes.includes('organization');
  const hasAnyType = selectedTransferTypes.length > 0;

  // Dynamic data
  const vehicleYears = getVehicleYears();
  const availableModels = mBrand ? getModelsByBrand(mBrand, 'transport') : [];
  const brandOptions = TRANSPORT_VEHICLE_BRANDS.map(b => ({ value: b.value, label: b.label }));
  const modelOptions = availableModels.map(m => ({ value: m, label: m }));
  const yearOptions = vehicleYears.map(y => ({ value: y.toString(), label: y.toString() }));

  const vehicleClassOptions = useMemo(() => {
    if (modalType === 'vip') return VIP_VEHICLE_CLASSES;
    return ALL_VEHICLE_CLASSES;
  }, [modalType]);

  const requiredDocuments = useMemo(() => {
    if (!hasAnyType) return [];
    const docs = [...COMMON_DOCUMENTS];
    const addedKeys = new Set(docs.map(d => d.key));
    if (hasVip) {
      VIP_DOCUMENTS.forEach(d => { if (!addedKeys.has(d.key)) { docs.push(d); addedKeys.add(d.key); } });
    }
    if (hasOrganization) {
      ORGANIZATION_DOCUMENTS.forEach(d => { if (!addedKeys.has(d.key)) { docs.push(d); addedKeys.add(d.key); } });
    }
    return docs;
  }, [hasVip, hasOrganization, hasAnyType]);

  const toggleTransferType = (type: TransferType) => {
    setSelectedTransferTypes(prev =>
      prev.includes(type) ? prev.filter(t => t !== type) : [...prev, type]
    );
  };

  // Modal acma
  const openAddModal = (type: TransferType) => {
    setModalType(type);
    setMPlate(''); setMBrand(''); setMModel(''); setMYear('');
    setMCapacity(''); setMVehicleClass(''); setMPhoto(null);
    setMInteriorPhotos([null, null, null, null]); setMErrors({});
    setModalVisible(true);
  };

  // Modal foto secimi
  const pickModalCamera = async () => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin Gerekli', 'Kamera izni vermelisiniz.'); return; }
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.3, exif: false });
    if (!result.canceled && result.assets[0]) setMPhoto(result.assets[0].uri);
  };

  const pickModalGallery = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin Gerekli', 'Galeri izni vermelisiniz.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.3, exif: false });
    if (!result.canceled && result.assets[0]) setMPhoto(result.assets[0].uri);
  };

  // Interior photo picker
  const pickInteriorPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { Alert.alert('Izin Gerekli', 'Galeri izni vermelisiniz.'); return; }
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.3, exif: false });
    if (!result.canceled && result.assets[0]) {
      setMInteriorPhotos(prev => { const next = [...prev]; next[index] = result.assets[0].uri; return next; });
    }
  };

  const removeInteriorPhoto = (index: number) => {
    setMInteriorPhotos(prev => { const next = [...prev]; next[index] = null; return next; });
  };

  // Modal validate
  const validateModal = (): boolean => {
    const errs: Record<string, string> = {};
    if (!mPlate.trim()) errs.plate = 'Plaka gerekli';
    if (!mBrand.trim()) errs.brand = 'Marka gerekli';
    if (!mModel.trim()) errs.model = 'Model gerekli';
    if (!mYear.trim()) errs.year = 'Yil gerekli';
    if (!mCapacity.trim()) errs.capacity = 'Yolcu kapasitesi gerekli';
    else { const c = parseInt(mCapacity); if (isNaN(c) || c < 1) errs.capacity = 'Gecerli kapasite girin'; }
    if (!mVehicleClass) errs.vehicleClass = 'Arac sinifi gerekli';
    if (!mPhoto) errs.photo = 'Arac fotografi zorunludur';
    if (modalType === 'vip' && !mInteriorPhotos.some(p => p)) {
      errs.interiorPhotos = 'VIP arac icin en az 1 ic gorsel zorunludur';
    }
    setMErrors(errs);
    return Object.keys(errs).length === 0;
  };

  // Modal submit
  const handleModalSubmit = async () => {
    if (!validateModal()) return;
    setModalLoading(true);
    const payload = {
      brand: mBrand,
      model: mModel,
      year: parseInt(mYear),
      plate_number: mPlate.toUpperCase(),
      transfer_type: modalType,
      passenger_capacity: parseInt(mCapacity),
      vehicle_class: mVehicleClass,
    };
    try {
      const vehicleData = await vehiclesAPI.createTransferVehicle(payload);

      // Araç fotoğrafı + VIP iç görselleri tek seferde yükle
      if (vehicleData.id && (mPhoto || mInteriorPhotos.some(p => p))) {
        try {
          const formData = new FormData();
          if (mPhoto) {
            formData.append('vehicle_photo', { uri: mPhoto, type: 'image/jpeg', name: 'vehicle_photo.jpg' } as any);
          }
          mInteriorPhotos.forEach((photo, i) => {
            if (photo) {
              formData.append(`interior_photo_${i + 1}`, { uri: photo, type: 'image/jpeg', name: `interior_photo_${i + 1}.jpg` } as any);
            }
          });
          console.log('📷 [TransferVehicle] Foto/gorseller yukleniyor, vehicleId:', vehicleData.id);
          await vehiclesAPI.uploadTransferVehicleDocuments(vehicleData.id, formData);
          console.log('✅ [TransferVehicle] Foto/gorseller yuklendi');
        } catch (photoErr: any) {
          console.error('❌ [TransferVehicle] Foto yukleme hatasi:', photoErr?.response?.data || photoErr.message);
        }
      }

      try { await vehiclesAPI.loadUserVehicles(); } catch {}

      setAddedVehicles(prev => [...prev, {
        id: vehicleData.id,
        type: modalType,
        plate: mPlate.toUpperCase(),
        brand: mBrand,
        model: mModel,
        year: mYear,
        passengerCapacity: mCapacity,
        vehicleClass: mVehicleClass,
        photoUri: mPhoto,
      }]);

      setModalVisible(false);
      const typeLabel = modalType === 'vip' ? 'VIP' : 'Servis';
      Alert.alert('Basarili', `${typeLabel} araci eklendi!`);
    } catch (error: any) {
      console.error('❌ [TransferVehicle] Arac kaydi hatasi:', error?.response?.status);
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Arac eklenemedi.';
      Alert.alert('Hata', msg);
    } finally {
      setModalLoading(false);
    }
  };

  // Belge foto secimi
  const pickDocCamera = async (key: string) => {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.3, exif: false });
    if (!result.canceled && result.assets[0]) setDocumentPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
  };

  const pickDocGallery = async (key: string) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.3, exif: false });
    if (!result.canceled && result.assets[0]) setDocumentPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
  };

  const pickDocFile = async (key: string) => {
    try {
      const result = await DocumentPicker.getDocumentAsync({ type: ['image/*', 'application/pdf'], copyToCacheDirectory: true });
      if (!result.canceled && result.assets[0]) setDocumentPhotos(prev => ({ ...prev, [key]: result.assets[0].uri }));
    } catch {}
  };

  const removeDoc = (key: string) => {
    setDocumentPhotos(prev => { const n = { ...prev }; delete n[key]; return n; });
  };

  // Kaydi tamamla - belgeleri yukle ve devam et
  const handleFinish = async () => {
    if (addedVehicles.length === 0) {
      Alert.alert('Uyari', 'En az bir arac eklemelisiniz.');
      return;
    }

    setFinishLoading(true);
    try {
      // Belgeleri her arac icin yukle
      const docEntries = Object.entries(documentPhotos);
      if (docEntries.length > 0) {
        console.log('📄 [TransferVehicle] Belge yukleme basliyor, toplam belge:', docEntries.length, 'toplam arac:', addedVehicles.length);

        for (const vehicle of addedVehicles) {
          const formData = new FormData();
          for (const [key, uri] of docEntries) {
            formData.append(key, {
              uri,
              type: 'image/jpeg',
              name: `${key}.jpg`,
            } as any);
          }
          console.log(`📄 [TransferVehicle] Belgeler yukleniyor vehicleId: ${vehicle.id} (${vehicle.type} - ${vehicle.plate})`);
          await vehiclesAPI.uploadTransferVehicleDocuments(vehicle.id, formData);
          console.log(`✅ [TransferVehicle] Belgeler yuklendi vehicleId: ${vehicle.id}`);
        }
        console.log('✅ [TransferVehicle] Tum belgeler basariyla yuklendi');
      } else {
        console.log('⚠️ [TransferVehicle] Yuklenecek belge yok, devam ediliyor');
      }

      // Navigate
      if (fromRegistration) {
        completeVehicleType('transfer');
        const next = getNextVehicleType();
        if (next === 'towTruck') navigation.navigate('TowTruckDetails', { fromRegistration: true });
        else if (next === 'crane') navigation.navigate('CraneDetails', { fromRegistration: true });
        else if (next === 'roadAssistance') navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
        else if (next === 'homeToHomeMoving' || next === 'cityToCity') navigation.navigate('HomeMovingDetails', { fromRegistration: true });
        else navigation.navigate('DocumentsScreen', { fromRegistration: true });
      } else {
        navigation.goBack();
      }
    } catch (error: any) {
      console.error('❌ [TransferVehicle] Belge yukleme hatasi:', error?.response?.status);
      Alert.alert('Hata', 'Belgeler yuklenirken bir hata olustu. Lutfen tekrar deneyin.');
    } finally {
      setFinishLoading(false);
    }
  };

  // Accordion toggle
  const toggleExpand = (index: number) => {
    setExpandedVehicleIndex(prev => prev === index ? null : index);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <AppBar title="Transfer Araci Ekle" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Title */}
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={[styles.title, { color: textPrimary }]}>
            Transfer Araclarim
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
            Transfer hizmeti verecegi arac bilgilerini girin
          </Text>
        </View>

        {/* Step 1: Transfer Type Selection */}
        <Card style={[styles.card, { backgroundColor: cardBg }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: primaryColor }]}>
              1. Transfer Tipi Secin
            </Text>
            <Text variant="bodySmall" style={{ color: textSecondary, marginBottom: 8 }}>
              Birden fazla secebilirsiniz
            </Text>

            <View style={styles.typeCardsRow}>
              <TouchableOpacity
                style={[
                  styles.typeCard,
                  { borderColor: hasOrganization ? primaryColor : '#e0e0e0' },
                  hasOrganization && { backgroundColor: primaryColor + '15' },
                ]}
                onPress={() => toggleTransferType('organization')}
              >
                {hasOrganization && (
                  <View style={styles.typeCheckmark}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={primaryColor} />
                  </View>
                )}
                <MaterialCommunityIcons name="bus-multiple" size={36} color={hasOrganization ? primaryColor : '#999'} />
                <Text style={[styles.typeCardText, { color: hasOrganization ? primaryColor : textSecondary }]}>
                  Organizasyon
                </Text>
                <Text style={[styles.typeCardSubtext, { color: textSecondary }]}>Servis / Toplu</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.typeCard,
                  { borderColor: hasVip ? primaryColor : '#e0e0e0' },
                  hasVip && { backgroundColor: primaryColor + '15' },
                ]}
                onPress={() => toggleTransferType('vip')}
              >
                {hasVip && (
                  <View style={styles.typeCheckmark}>
                    <MaterialCommunityIcons name="check-circle" size={20} color={primaryColor} />
                  </View>
                )}
                <MaterialCommunityIcons name="car-estate" size={36} color={hasVip ? primaryColor : '#999'} />
                <Text style={[styles.typeCardText, { color: hasVip ? primaryColor : textSecondary }]}>VIP</Text>
                <Text style={[styles.typeCardSubtext, { color: textSecondary }]}>Ozel / Lux</Text>
              </TouchableOpacity>
            </View>

            {/* Info Card */}
            {hasAnyType && (
              <Card style={[styles.infoCard, { backgroundColor: primaryColor + '10' }]}>
                <Card.Content>
                  <View style={styles.infoCardHeader}>
                    <MaterialCommunityIcons name="information-outline" size={20} color={primaryColor} />
                    <Text variant="titleSmall" style={[styles.infoCardTitle, { color: primaryColor }]}>
                      Gerekli Belgeler
                    </Text>
                  </View>
                  <Text variant="bodyMedium" style={{ color: textSecondary, marginTop: 6 }}>
                    {hasVip && hasOrganization
                      ? 'VIP ve Organizasyon transfer icin ehliyet, trafik sigortasi, kasko, D2/A1/A2/B2 yetki belgesi, SRC1/SRC2, psikoteknik rapor, yolcu koltuk sigortasi, turizm tasimacilik belgesi, S plaka belgesi ve guzergah izin belgesi gereklidir.'
                      : hasVip
                      ? 'VIP transfer icin ehliyet, trafik sigortasi, kasko, D2/A1/A2 yetki belgesi, SRC1/SRC2, psikoteknik rapor, yolcu koltuk sigortasi ve turizm tasimacilik belgesi gereklidir.'
                      : 'Organizasyon/servis transfer icin ehliyet, trafik sigortasi, kasko, D2/B2 yetki belgesi, S plaka belgesi, guzergah izin belgesi, SRC-2, psikoteknik rapor ve yolcu koltuk sigortasi gereklidir.'}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>

        {/* Arac Ekle Butonlari */}
        {hasAnyType && (
          <View style={styles.addButtonsRow}>
            {hasOrganization && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => openAddModal('organization')}
              >
                <MaterialCommunityIcons name="bus-multiple" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Servis Araci Ekle</Text>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {hasVip && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#FFB300' }]}
                onPress={() => openAddModal('vip')}
              >
                <MaterialCommunityIcons name="car-estate" size={24} color="#fff" />
                <Text style={styles.addButtonText}>VIP Araci Ekle</Text>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {/* Eklenen Araclar - Accordion */}
        {addedVehicles.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text variant="titleMedium" style={{ color: textPrimary, fontWeight: 'bold', marginBottom: 10 }}>
              Eklenen Araclar ({addedVehicles.length})
            </Text>
            {addedVehicles.map((v, i) => {
              const isExpanded = expandedVehicleIndex === i;
              const isVipVehicle = v.type === 'vip';
              const badgeColor = isVipVehicle ? '#FFB300' : '#4CAF50';
              const badgeBg = isVipVehicle ? '#FFF3E0' : '#E8F5E9';
              const badgeTextColor = isVipVehicle ? '#E65100' : '#2E7D32';

              return (
                <Card key={i} style={[styles.vehicleAccordion, { backgroundColor: cardBg }]}>
                  <TouchableOpacity onPress={() => toggleExpand(i)} activeOpacity={0.7}>
                    <View style={styles.accordionHeader}>
                      <View style={[styles.accordionIcon, { backgroundColor: badgeColor + '20' }]}>
                        <MaterialCommunityIcons
                          name={isVipVehicle ? 'car-estate' : 'bus-multiple'}
                          size={24}
                          color={badgeColor}
                        />
                      </View>
                      <View style={{ flex: 1, marginLeft: 12 }}>
                        <Text variant="titleMedium" style={{ color: textPrimary, fontWeight: 'bold' }}>
                          {v.plate}
                        </Text>
                        <Text variant="bodySmall" style={{ color: textSecondary }}>
                          {v.brand} {v.model}
                        </Text>
                      </View>
                      <View style={[styles.typeBadge, { backgroundColor: badgeBg }]}>
                        <Text style={{ fontSize: 11, fontWeight: 'bold', color: badgeTextColor }}>
                          {isVipVehicle ? 'VIP' : 'Servis'}
                        </Text>
                      </View>
                      <MaterialCommunityIcons
                        name={isExpanded ? 'chevron-up' : 'chevron-down'}
                        size={24}
                        color={textSecondary}
                        style={{ marginLeft: 8 }}
                      />
                    </View>
                  </TouchableOpacity>

                  {isExpanded && (
                    <View style={styles.accordionBody}>
                      {v.photoUri && (
                        <Image source={{ uri: v.photoUri }} style={styles.accordionPhoto} />
                      )}
                      <View style={styles.accordionInfoRow}>
                        <MaterialCommunityIcons name="car" size={16} color={textSecondary} />
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Marka/Model:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{v.brand} {v.model}</Text>
                      </View>
                      <View style={styles.accordionInfoRow}>
                        <MaterialCommunityIcons name="calendar" size={16} color={textSecondary} />
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Yil:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{v.year}</Text>
                      </View>
                      <View style={styles.accordionInfoRow}>
                        <MaterialCommunityIcons name="seat-passenger" size={16} color={textSecondary} />
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Kapasite:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{v.passengerCapacity} kisi</Text>
                      </View>
                      <View style={styles.accordionInfoRow}>
                        <MaterialCommunityIcons name="car-cog" size={16} color={textSecondary} />
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Sinif:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{CLASS_LABELS[v.vehicleClass] || v.vehicleClass}</Text>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {/* Belgeler */}
        {hasAnyType && requiredDocuments.length > 0 && (
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: primaryColor }]}>
                2. Belgeler
              </Text>
              <Text variant="bodySmall" style={{ color: textSecondary, marginBottom: 16 }}>
                Gerekli belgeleri yukleyin
              </Text>

              {requiredDocuments.map((doc) => {
                const photo = documentPhotos[doc.key];
                return (
                  <Card key={doc.key} style={[styles.documentCard, { backgroundColor: cardBg }]}>
                    <Card.Content style={styles.documentCardContent}>
                      <View style={styles.documentHeader}>
                        <MaterialCommunityIcons name="file-document-outline" size={22} color={primaryColor} />
                        <Text variant="titleSmall" style={[styles.documentTitle, { color: textPrimary }]}>
                          {doc.label}
                        </Text>
                      </View>

                      {photo ? (
                        <View style={styles.documentPhotoContainer}>
                          <Image source={{ uri: photo }} style={styles.documentThumbnail} />
                          <Button mode="outlined" onPress={() => removeDoc(doc.key)} icon="delete" textColor="#f44336" compact style={{ minWidth: 100 }}>
                            Sil
                          </Button>
                        </View>
                      ) : (
                        <View style={styles.documentPickerRow}>
                          <TouchableOpacity style={[styles.documentPickerButton, { borderColor: primaryColor }]} onPress={() => pickDocCamera(doc.key)}>
                            <MaterialCommunityIcons name="camera" size={22} color={primaryColor} />
                            <Text style={[styles.documentPickerText, { color: primaryColor }]}>Cek</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.documentPickerButton, { borderColor: primaryColor }]} onPress={() => pickDocGallery(doc.key)}>
                            <MaterialCommunityIcons name="image" size={22} color={primaryColor} />
                            <Text style={[styles.documentPickerText, { color: primaryColor }]}>Galeri</Text>
                          </TouchableOpacity>
                          <TouchableOpacity style={[styles.documentPickerButton, { borderColor: primaryColor }]} onPress={() => pickDocFile(doc.key)}>
                            <MaterialCommunityIcons name="file-document" size={22} color={primaryColor} />
                            <Text style={[styles.documentPickerText, { color: primaryColor }]}>Dosya</Text>
                          </TouchableOpacity>
                        </View>
                      )}
                    </Card.Content>
                  </Card>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {/* Kaydi Tamamla */}
        {addedVehicles.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Button
              mode="contained"
              onPress={handleFinish}
              loading={finishLoading}
              disabled={finishLoading}
              style={[styles.finishButton, { backgroundColor: primaryColor }]}
              contentStyle={{ paddingVertical: 10 }}
              icon="check-all"
            >
              {finishLoading ? 'Belgeler Yukleniyor...' : 'Kaydi Tamamla ve Devam Et'}
            </Button>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============ ARAC EKLEME MODAL ============ */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { backgroundColor: screenBg }]}
        >
          {/* Modal Header */}
          <View style={[styles.modalHeader, { backgroundColor: modalType === 'vip' ? '#FFB300' : '#4CAF50' }]}>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.modalClose}>
              <MaterialCommunityIcons name="close" size={24} color="#fff" />
            </TouchableOpacity>
            <MaterialCommunityIcons
              name={modalType === 'vip' ? 'car-estate' : 'bus-multiple'}
              size={32}
              color="#fff"
            />
            <Text style={styles.modalTitle}>
              {modalType === 'vip' ? 'VIP Araci Ekle' : 'Servis Araci Ekle'}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Arac Fotografi */}
            <Card style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.cardContent}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: primaryColor }]}>
                  Arac Fotografi *
                </Text>
                {mErrors.photo ? <Text style={styles.errorText}>{mErrors.photo}</Text> : null}
                {mPhoto ? (
                  <View>
                    <Image source={{ uri: mPhoto }} style={styles.modalPhotoPreview} />
                    <View style={{ flexDirection: 'row', gap: 10, marginTop: 8 }}>
                      <Button mode="outlined" onPress={() => pickModalGallery()} icon="image" style={{ flex: 1 }}>Degistir</Button>
                      <Button mode="outlined" onPress={() => setMPhoto(null)} icon="delete" textColor="#f44336" style={{ flex: 1 }}>Sil</Button>
                    </View>
                  </View>
                ) : (
                  <View style={{ flexDirection: 'row', gap: 10 }}>
                    <TouchableOpacity style={styles.modalPhotoButton} onPress={pickModalCamera}>
                      <MaterialCommunityIcons name="camera" size={28} color={primaryColor} />
                      <Text style={[styles.documentPickerText, { color: primaryColor }]}>Kamera</Text>
                    </TouchableOpacity>
                    <TouchableOpacity style={styles.modalPhotoButton} onPress={pickModalGallery}>
                      <MaterialCommunityIcons name="image" size={28} color={primaryColor} />
                      <Text style={[styles.documentPickerText, { color: primaryColor }]}>Galeri</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </Card.Content>
            </Card>

            {/* VIP Araç İçi Görselleri */}
            {modalType === 'vip' && (
              <Card style={[styles.card, { backgroundColor: cardBg }]}>
                <Card.Content style={styles.cardContent}>
                  <Text variant="titleMedium" style={[styles.sectionTitle, { color: '#FFB300' }]}>
                    Arac Ici Gorselleri (VIP)
                  </Text>
                  <Text variant="bodySmall" style={{ color: textSecondary, marginBottom: 4 }}>
                    Musterilerin aracinizin icini gorebilmesi icin en az 1 gorsel ekleyin *
                  </Text>
                  {mErrors.interiorPhotos ? <Text style={[styles.errorText, { marginBottom: 8 }]}>{mErrors.interiorPhotos}</Text> : null}
                  <View style={styles.interiorGrid}>
                    {[0, 1, 2, 3].map((index) => (
                      <View key={index} style={styles.interiorSlot}>
                        {mInteriorPhotos[index] ? (
                          <TouchableOpacity onPress={() => removeInteriorPhoto(index)} style={styles.interiorPhotoFilled}>
                            <Image source={{ uri: mInteriorPhotos[index]! }} style={styles.interiorImage} />
                            <View style={styles.interiorRemove}>
                              <MaterialCommunityIcons name="close-circle" size={22} color="#f44336" />
                            </View>
                          </TouchableOpacity>
                        ) : (
                          <TouchableOpacity style={styles.interiorPhotoEmpty} onPress={() => pickInteriorPhoto(index)}>
                            <MaterialCommunityIcons name="camera-plus" size={28} color="#999" />
                            <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Gorsel {index + 1}</Text>
                          </TouchableOpacity>
                        )}
                      </View>
                    ))}
                  </View>
                </Card.Content>
              </Card>
            )}

            {/* Arac Bilgileri */}
            <Card style={[styles.card, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.cardContent}>
                <Text variant="titleMedium" style={[styles.sectionTitle, { color: primaryColor }]}>
                  Arac Bilgileri
                </Text>

                <TextInput
                  label="Plaka"
                  value={mPlate}
                  onChangeText={setMPlate}
                  mode="outlined"
                  autoCapitalize="characters"
                  style={styles.input}
                  error={!!mErrors.plate}
                  left={<TextInput.Icon icon="car" />}
                />
                {mErrors.plate ? <Text style={styles.errorText}>{mErrors.plate}</Text> : null}

                <SelectDropdown label="Marka" value={mBrand} options={brandOptions}
                  onChange={(v) => { setMBrand(v); setMModel(''); }} placeholder="Marka secin" error={mErrors.brand} />

                <SelectDropdown label="Model" value={mModel} options={modelOptions}
                  onChange={setMModel} placeholder="Model secin" disabled={!mBrand} error={mErrors.model} />

                <SelectDropdown label="Yil" value={mYear} options={yearOptions}
                  onChange={setMYear} placeholder="Yil secin" error={mErrors.year} />

                <TextInput
                  label="Yolcu Kapasitesi"
                  value={mCapacity}
                  onChangeText={setMCapacity}
                  mode="outlined"
                  keyboardType="numeric"
                  style={styles.input}
                  error={!!mErrors.capacity}
                  left={<TextInput.Icon icon="seat-passenger" />}
                />
                {mErrors.capacity ? <Text style={styles.errorText}>{mErrors.capacity}</Text> : null}

                <SelectDropdown label="Arac Sinifi" value={mVehicleClass} options={vehicleClassOptions}
                  onChange={setMVehicleClass} placeholder="Arac sinifi secin" error={mErrors.vehicleClass} />
              </Card.Content>
            </Card>

            {/* Ekle Butonu */}
            <Button
              mode="contained"
              onPress={handleModalSubmit}
              loading={modalLoading}
              disabled={modalLoading}
              style={[styles.finishButton, { backgroundColor: modalType === 'vip' ? '#FFB300' : '#4CAF50' }]}
              contentStyle={{ paddingVertical: 10 }}
              icon="plus"
            >
              {modalLoading ? 'Ekleniyor...' : 'Araci Kaydet'}
            </Button>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {/* Loading Overlay */}
      {modalLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Arac ekleniyor...</Text>
          </View>
        </View>
      )}
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1, padding: 20 },
  titleContainer: { marginBottom: 24, alignItems: 'center' },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', opacity: 0.7, paddingHorizontal: 20 },
  card: { borderRadius: 16, elevation: 2, marginBottom: 16 },
  cardContent: { padding: 20 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 16 },
  // Type cards
  typeCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeCard: { flex: 1, borderWidth: 2, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  typeCheckmark: { position: 'absolute', top: 8, right: 8 },
  typeCardText: { fontWeight: 'bold', fontSize: 16, marginTop: 8 },
  typeCardSubtext: { fontSize: 12, marginTop: 2 },
  infoCard: { borderRadius: 12, marginTop: 12 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoCardTitle: { fontWeight: 'bold' },
  // Add buttons
  addButtonsRow: { gap: 10, marginBottom: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, elevation: 3 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  // Accordion
  vehicleAccordion: { borderRadius: 14, marginBottom: 10, elevation: 2 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  accordionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  accordionBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  accordionPhoto: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  accordionInfoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  // Documents
  documentCard: { borderRadius: 12, marginBottom: 12, elevation: 1 },
  documentCardContent: { padding: 12 },
  documentHeader: { flexDirection: 'row', alignItems: 'center', gap: 8, marginBottom: 12 },
  documentTitle: { fontWeight: '600', flex: 1 },
  documentPhotoContainer: { alignItems: 'center' },
  documentThumbnail: { width: '100%', height: 140, borderRadius: 8, marginBottom: 8 },
  documentPickerRow: { flexDirection: 'row', gap: 10 },
  documentPickerButton: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, borderWidth: 1.5, borderStyle: 'dashed', borderRadius: 10, paddingVertical: 14 },
  documentPickerText: { fontWeight: '600', fontSize: 14 },
  // Finish
  finishButton: { borderRadius: 14, marginBottom: 16, elevation: 3 },
  // Modal
  modalHeader: { paddingTop: 50, paddingBottom: 20, alignItems: 'center', gap: 8 },
  modalClose: { position: 'absolute', top: 50, left: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  modalPhotoPreview: { width: '100%', height: 180, borderRadius: 12 },
  modalPhotoButton: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed', paddingVertical: 24, alignItems: 'center', justifyContent: 'center' },
  // Interior photos grid
  interiorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  interiorSlot: { width: '47%', aspectRatio: 1.3 },
  interiorPhotoEmpty: { flex: 1, backgroundColor: '#f5f5f5', borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' },
  interiorPhotoFilled: { flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' },
  interiorImage: { width: '100%', height: '100%', borderRadius: 12 },
  interiorRemove: { position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 12 },
  input: { marginBottom: 12 },
  errorText: { color: '#f44336', fontSize: 12, marginTop: -8, marginBottom: 8, marginLeft: 4 },
  // Loading
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, fontWeight: '600', color: '#333' },
});

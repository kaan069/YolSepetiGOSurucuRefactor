// Transfer Araç Kayıt Ekranı - Transfer Vehicle Registration Screen
// Bu ekran transfer araç kayıt işlemlerini yönetir (Organizasyon / VIP)
import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { vehiclesAPI } from '../../api';
import { AppBar } from '../../components/common';
import { useAppTheme } from '../../hooks/useAppTheme';
import {
  FkButton,
  FkDocumentUpload,
  FkFormSection,
  FkImageGrid,
  FkSelect,
  FkTextInput,
  FkVehiclePlateInput,
} from '../../components/fk';
import { TRANSPORT_VEHICLE_BRANDS, getVehicleYears, getModelsByBrand } from '../../data/vehicleData';
import { logger } from '../../utils/logger';

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
  { key: 'license_photo', label: 'Ehliyet Fotoğrafı' },
  { key: 'traffic_insurance_photo', label: 'Trafik Sigortası' },
  { key: 'kasko_photo', label: 'Kasko Poliçesi' },
];

const VIP_DOCUMENTS: DocumentField[] = [
  { key: 'authority_certificate_photo', label: 'D2 Yetki Belgesi veya A1/A2 Belgesi' },
  { key: 'src_certificate_photo', label: 'SRC1/SRC2 Belgesi' },
  { key: 'psychotechnic_report_photo', label: 'Psikoteknik Rapor' },
  { key: 'passenger_seat_insurance_photo', label: 'Yolcu Koltuk Sigortası' },
  { key: 'tourism_transport_certificate_photo', label: 'Turizm Taşımacılık Belgesi' },
];

const ORGANIZATION_DOCUMENTS: DocumentField[] = [
  { key: 'authority_certificate_photo', label: 'D2 veya B2 Yetki Belgesi' },
  { key: 's_plate_certificate_photo', label: 'S Plaka Belgesi' },
  { key: 'route_permit_photo', label: 'Güzergah İzin Belgesi' },
  { key: 'src_certificate_photo', label: 'SRC-2 Belgesi' },
  { key: 'psychotechnic_report_photo', label: 'Psikoteknik Rapor' },
  { key: 'passenger_seat_insurance_photo', label: 'Yolcu Koltuk Sigortası' },
];

const ALL_VEHICLE_CLASSES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Araç' },
  { value: 'minibus', label: 'Minibüs' },
  { value: 'midibus', label: 'Midibüs' },
  { value: 'bus', label: 'Otobüs' },
];

const VIP_VEHICLE_CLASSES = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Araç' },
];

const CLASS_LABELS: Record<string, string> = {
  sedan: 'Sedan', vip_car: 'VIP Araç', minibus: 'Minibüs', midibus: 'Midibüs', bus: 'Otobüs',
};

export default function TransferVehicleScreen({ navigation, route }: Props) {
  const fromRegistration = route.params?.fromRegistration === true;
  const { completeVehicleType, getNextVehicleType } = useRegistrationDataStore();
  const { setIsAuthenticated } = useAuthStore();
  const { screenBg, cardBg, textPrimary, textSecondary } = useAppTheme();

  const primaryColor = '#5C6BC0';

  const [selectedTransferTypes, setSelectedTransferTypes] = useState<TransferType[]>([]);
  const [addedVehicles, setAddedVehicles] = useState<AddedVehicle[]>([]);
  const [expandedVehicleIndex, setExpandedVehicleIndex] = useState<number | null>(null);
  const [documentPhotos, setDocumentPhotos] = useState<Record<string, string | null>>({});
  const [finishLoading, setFinishLoading] = useState(false);

  const [modalVisible, setModalVisible] = useState(false);
  const [modalType, setModalType] = useState<TransferType>('organization');
  const [modalLoading, setModalLoading] = useState(false);

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

  const openAddModal = (type: TransferType) => {
    setModalType(type);
    setMPlate(''); setMBrand(''); setMModel(''); setMYear('');
    setMCapacity(''); setMVehicleClass(''); setMPhoto(null);
    setMInteriorPhotos([null, null, null, null]); setMErrors({});
    setModalVisible(true);
  };

  const validateModal = (): boolean => {
    const errs: Record<string, string> = {};
    if (!mPlate.trim()) errs.plate = 'Plaka gerekli';
    if (!mBrand.trim()) errs.brand = 'Marka gerekli';
    if (!mModel.trim()) errs.model = 'Model gerekli';
    if (!mYear.trim()) errs.year = 'Yıl gerekli';
    if (!mCapacity.trim()) errs.capacity = 'Yolcu kapasitesi gerekli';
    else { const c = parseInt(mCapacity, 10); if (isNaN(c) || c < 1) errs.capacity = 'Geçerli kapasite girin'; }
    if (!mVehicleClass) errs.vehicleClass = 'Araç sınıfı gerekli';
    if (!mPhoto) errs.photo = 'Araç fotoğrafı zorunludur';
    if (modalType === 'vip' && !mInteriorPhotos.some(p => p)) {
      errs.interiorPhotos = 'VIP araç için en az 1 iç görsel zorunludur';
    }
    setMErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleModalSubmit = async () => {
    if (!validateModal()) return;
    setModalLoading(true);
    const payload = {
      brand: mBrand,
      model: mModel,
      year: parseInt(mYear, 10),
      plate_number: mPlate.toUpperCase(),
      transfer_type: modalType,
      passenger_capacity: parseInt(mCapacity, 10),
      vehicle_class: mVehicleClass,
    };
    try {
      const vehicleData = await vehiclesAPI.createTransferVehicle(payload);

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
          logger.debug('orders', 'TransferVehicle Foto/gorseller yukleniyor vehicleId');
          await vehiclesAPI.uploadTransferVehicleDocuments(vehicleData.id, formData);
          logger.debug('orders', 'TransferVehicle Foto/gorseller yuklendi');
        } catch (photoErr: any) {
          logger.error('orders', 'TransferVehicle Foto yukleme hatasi');
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
      Alert.alert('Başarılı', `${typeLabel} aracı eklendi!`);
    } catch (error: any) {
      logger.error('orders', 'TransferVehicle Arac kaydi hatasi');
      const msg = error?.response?.data?.message || error?.response?.data?.error || 'Araç eklenemedi.';
      Alert.alert('Hata', msg);
    } finally {
      setModalLoading(false);
    }
  };

  const handleFinish = async () => {
    if (addedVehicles.length === 0) {
      Alert.alert('Uyarı', 'En az bir araç eklemelisiniz.');
      return;
    }

    const missingDocs = requiredDocuments.filter(d => !documentPhotos[d.key]);
    if (missingDocs.length > 0) {
      const list = missingDocs.map(d => `• ${d.label}`).join('\n');
      Alert.alert('Eksik Belge', `Aşağıdaki belgeler zorunludur:\n${list}`);
      return;
    }

    setFinishLoading(true);
    try {
      const docEntries = Object.entries(documentPhotos).filter(([_, uri]) => !!uri) as [string, string][];
      if (docEntries.length > 0) {
        logger.debug('orders', 'TransferVehicle Belge yukleme basliyor toplam belge');

        for (const vehicle of addedVehicles) {
          const formData = new FormData();
          for (const [key, uri] of docEntries) {
            formData.append(key, {
              uri,
              type: 'image/jpeg',
              name: `${key}.jpg`,
            } as any);
          }
          logger.debug('orders', 'TransferVehicle Belgeler yukleniyor vehicleId');
          await vehiclesAPI.uploadTransferVehicleDocuments(vehicle.id, formData);
          logger.debug('orders', 'TransferVehicle Belgeler yuklendi');
        }
        logger.debug('orders', 'TransferVehicle Tum belgeler basariyla yuklendi');
      }

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
      logger.error('orders', 'TransferVehicle Belge yukleme hatasi');
      Alert.alert('Hata', 'Belgeler yüklenirken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setFinishLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedVehicleIndex(prev => prev === index ? null : index);
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <AppBar title="Transfer Aracı Ekle" />

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={[styles.title, { color: textPrimary }]}>
            Transfer Araçlarım
          </Text>
          <Text variant="bodyMedium" style={[styles.subtitle, { color: textSecondary }]}>
            Transfer hizmeti vereceği araç bilgilerini girin
          </Text>
        </View>

        <Card style={[styles.card, { backgroundColor: cardBg }]}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: primaryColor }]}>
              1. Transfer Tipi Seçin
            </Text>
            <Text variant="bodySmall" style={{ color: textSecondary, marginBottom: 8 }}>
              Birden fazla seçebilirsiniz
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
                <Text style={[styles.typeCardSubtext, { color: textSecondary }]}>Özel / Lüx</Text>
              </TouchableOpacity>
            </View>

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
                      ? 'VIP ve Organizasyon transfer için ehliyet, trafik sigortası, kasko, D2/A1/A2/B2 yetki belgesi, SRC1/SRC2, psikoteknik rapor, yolcu koltuk sigortası, turizm taşımacılık belgesi, S plaka belgesi ve güzergah izin belgesi gereklidir.'
                      : hasVip
                      ? 'VIP transfer için ehliyet, trafik sigortası, kasko, D2/A1/A2 yetki belgesi, SRC1/SRC2, psikoteknik rapor, yolcu koltuk sigortası ve turizm taşımacılık belgesi gereklidir.'
                      : 'Organizasyon/servis transfer için ehliyet, trafik sigortası, kasko, D2/B2 yetki belgesi, S plaka belgesi, güzergah izin belgesi, SRC-2, psikoteknik rapor ve yolcu koltuk sigortası gereklidir.'}
                  </Text>
                </Card.Content>
              </Card>
            )}
          </Card.Content>
        </Card>

        {hasAnyType && (
          <View style={styles.addButtonsRow}>
            {hasOrganization && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#4CAF50' }]}
                onPress={() => openAddModal('organization')}
              >
                <MaterialCommunityIcons name="bus-multiple" size={24} color="#fff" />
                <Text style={styles.addButtonText}>Servis Aracı Ekle</Text>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              </TouchableOpacity>
            )}
            {hasVip && (
              <TouchableOpacity
                style={[styles.addButton, { backgroundColor: '#FFB300' }]}
                onPress={() => openAddModal('vip')}
              >
                <MaterialCommunityIcons name="car-estate" size={24} color="#fff" />
                <Text style={styles.addButtonText}>VIP Aracı Ekle</Text>
                <MaterialCommunityIcons name="plus-circle" size={20} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        )}

        {addedVehicles.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <Text variant="titleMedium" style={{ color: textPrimary, fontWeight: 'bold', marginBottom: 10 }}>
              Eklenen Araçlar ({addedVehicles.length})
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
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Yıl:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{v.year}</Text>
                      </View>
                      <View style={styles.accordionInfoRow}>
                        <MaterialCommunityIcons name="seat-passenger" size={16} color={textSecondary} />
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Kapasite:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{v.passengerCapacity} kişi</Text>
                      </View>
                      <View style={styles.accordionInfoRow}>
                        <MaterialCommunityIcons name="car-cog" size={16} color={textSecondary} />
                        <Text variant="bodyMedium" style={{ color: textSecondary, marginLeft: 6 }}>Sınıf:</Text>
                        <Text variant="bodyMedium" style={{ color: textPrimary, marginLeft: 4, fontWeight: '600' }}>{CLASS_LABELS[v.vehicleClass] || v.vehicleClass}</Text>
                      </View>
                    </View>
                  )}
                </Card>
              );
            })}
          </View>
        )}

        {hasAnyType && requiredDocuments.length > 0 && (
          <View>
            <Text variant="titleMedium" style={[styles.sectionTitle, { color: primaryColor, marginBottom: 4, marginLeft: 4 }]}>
              2. Belgeler
            </Text>
            <Text variant="bodySmall" style={{ color: textSecondary, marginBottom: 12, marginLeft: 4 }}>
              Gerekli belgeleri yükleyin (hepsi zorunludur)
            </Text>

            {requiredDocuments.map((doc) => (
              <FkFormSection key={doc.key} title={`📄 ${doc.label}`} required>
                <FkDocumentUpload
                  value={documentPhotos[doc.key] ?? null}
                  onChange={(uri) =>
                    setDocumentPhotos(prev => ({ ...prev, [doc.key]: uri }))
                  }
                  imageQuality={0.8}
                />
              </FkFormSection>
            ))}
          </View>
        )}

        {addedVehicles.length > 0 && (
          <View style={{ marginBottom: 16 }}>
            <FkButton
              onPress={handleFinish}
              loading={finishLoading}
              disabled={finishLoading}
              icon="check-all"
              fullWidth
            >
              {finishLoading ? 'Belgeler Yükleniyor...' : 'Kaydı Tamamla ve Devam Et'}
            </FkButton>
          </View>
        )}

        <View style={{ height: 40 }} />
      </ScrollView>

      {/* ============ ARAÇ EKLEME MODAL ============ */}
      <Modal visible={modalVisible} animationType="slide" transparent={false}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={[styles.container, { backgroundColor: screenBg }]}
        >
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
              {modalType === 'vip' ? 'VIP Aracı Ekle' : 'Servis Aracı Ekle'}
            </Text>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            <FkFormSection title="📷 Araç Fotoğrafı" required>
              <FkDocumentUpload
                helperText="Plaka görünür şekilde araç fotoğrafı ekleyin"
                value={mPhoto}
                onChange={setMPhoto}
                imageQuality={0.8}
                error={mErrors.photo}
              />
            </FkFormSection>

            {modalType === 'vip' && (
              <FkFormSection
                title="⭐ Araç İçi Görselleri (VIP)"
                titleColor="#FFB300"
                description="Müşterilerin aracınızın içini görebilmesi için en az 1 görsel ekleyin"
                required
              >
                <FkImageGrid
                  slots={4}
                  value={mInteriorPhotos}
                  slotLabelPrefix="Görsel"
                  onChange={(next) => {
                    setMInteriorPhotos(next);
                    if (mErrors.interiorPhotos && next.some(p => p)) {
                      setMErrors(prev => { const n = { ...prev }; delete n.interiorPhotos; return n; });
                    }
                  }}
                  error={mErrors.interiorPhotos}
                />
              </FkFormSection>
            )}

            <FkFormSection title="Araç Bilgileri">
              <FkVehiclePlateInput
                label="Plaka"
                required
                value={mPlate}
                onChange={(v) => {
                  setMPlate(v);
                  if (mErrors.plate) setMErrors(prev => { const n = { ...prev }; delete n.plate; return n; });
                }}
                error={mErrors.plate}
              />

              <FkSelect
                label="Marka"
                required
                value={mBrand || null}
                options={brandOptions}
                onChange={(v) => {
                  setMBrand(v);
                  setMModel('');
                  if (mErrors.brand) setMErrors(prev => { const n = { ...prev }; delete n.brand; return n; });
                }}
                placeholder="Marka seçin"
                searchable
                error={mErrors.brand}
              />

              <FkSelect
                label="Model"
                required
                value={mModel || null}
                options={modelOptions}
                onChange={(v) => {
                  setMModel(v);
                  if (mErrors.model) setMErrors(prev => { const n = { ...prev }; delete n.model; return n; });
                }}
                placeholder="Model seçin"
                disabled={!mBrand}
                searchable
                error={mErrors.model}
              />

              <FkSelect
                label="Yıl"
                required
                value={mYear || null}
                options={yearOptions}
                onChange={(v) => {
                  setMYear(v);
                  if (mErrors.year) setMErrors(prev => { const n = { ...prev }; delete n.year; return n; });
                }}
                placeholder="Yıl seçin"
                error={mErrors.year}
              />

              <FkTextInput
                label="Yolcu Kapasitesi"
                required
                value={mCapacity}
                onChange={(v) => {
                  setMCapacity(v.replace(/\D/g, ''));
                  if (mErrors.capacity) setMErrors(prev => { const n = { ...prev }; delete n.capacity; return n; });
                }}
                keyboardType="numeric"
                leftIcon="seat-passenger"
                placeholder="örn. 16"
                error={mErrors.capacity}
              />

              <FkSelect
                label="Araç Sınıfı"
                required
                value={mVehicleClass || null}
                options={vehicleClassOptions}
                onChange={(v) => {
                  setMVehicleClass(v);
                  if (mErrors.vehicleClass) setMErrors(prev => { const n = { ...prev }; delete n.vehicleClass; return n; });
                }}
                placeholder="Araç sınıfı seçin"
                error={mErrors.vehicleClass}
              />
            </FkFormSection>

            <FkButton
              onPress={handleModalSubmit}
              loading={modalLoading}
              disabled={modalLoading}
              icon="plus"
              fullWidth
              style={{ marginBottom: 16, backgroundColor: modalType === 'vip' ? '#FFB300' : '#4CAF50' }}
            >
              {modalLoading ? 'Ekleniyor...' : 'Aracı Kaydet'}
            </FkButton>

            <View style={{ height: 40 }} />
          </ScrollView>
        </KeyboardAvoidingView>
      </Modal>

      {modalLoading && (
        <View style={styles.loadingOverlay}>
          <View style={styles.loadingBox}>
            <ActivityIndicator size="large" color={primaryColor} />
            <Text style={styles.loadingText}>Araç ekleniyor...</Text>
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
  typeCardsRow: { flexDirection: 'row', gap: 12, marginBottom: 8 },
  typeCard: { flex: 1, borderWidth: 2, borderRadius: 16, paddingVertical: 20, alignItems: 'center', justifyContent: 'center', position: 'relative' },
  typeCheckmark: { position: 'absolute', top: 8, right: 8 },
  typeCardText: { fontWeight: 'bold', fontSize: 16, marginTop: 8 },
  typeCardSubtext: { fontSize: 12, marginTop: 2 },
  infoCard: { borderRadius: 12, marginTop: 12 },
  infoCardHeader: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  infoCardTitle: { fontWeight: 'bold' },
  addButtonsRow: { gap: 10, marginBottom: 16 },
  addButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 14, borderRadius: 14, elevation: 3 },
  addButtonText: { color: '#fff', fontWeight: 'bold', fontSize: 16 },
  vehicleAccordion: { borderRadius: 14, marginBottom: 10, elevation: 2 },
  accordionHeader: { flexDirection: 'row', alignItems: 'center', padding: 14 },
  accordionIcon: { width: 44, height: 44, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  typeBadge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 10 },
  accordionBody: { paddingHorizontal: 14, paddingBottom: 14, borderTopWidth: 1, borderTopColor: '#eee', paddingTop: 12 },
  accordionPhoto: { width: '100%', height: 160, borderRadius: 12, marginBottom: 12 },
  accordionInfoRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 4 },
  modalHeader: { paddingTop: 50, paddingBottom: 20, alignItems: 'center', gap: 8 },
  modalClose: { position: 'absolute', top: 50, left: 16 },
  modalTitle: { color: '#fff', fontSize: 20, fontWeight: 'bold' },
  loadingOverlay: { ...StyleSheet.absoluteFillObject, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', zIndex: 999 },
  loadingBox: { backgroundColor: '#fff', borderRadius: 16, padding: 32, alignItems: 'center', gap: 16 },
  loadingText: { fontSize: 16, fontWeight: '600', color: '#333' },
});

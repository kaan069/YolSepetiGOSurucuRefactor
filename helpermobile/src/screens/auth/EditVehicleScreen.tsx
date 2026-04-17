import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Image, TouchableOpacity } from 'react-native';
import { Button, Card, Text, TextInput, Menu, Checkbox, Chip } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useVehicleStore, TowTruckInfo, CraneInfo, TransportInfo, HomeMovingInfo, RoadAssistanceInfo, TransferVehicleInfo, MovingVehicleType } from '../../store/useVehicleStore';
import { vehiclesAPI } from '../../api';
import { downloadToCache } from '../../api/vehicles';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AppBar from '../../components/common/AppBar';
import SelectDropdown from '../../components/common/SelectDropdown';
import { useAppTheme } from '../../hooks/useAppTheme';

// URI'nin PDF olup olmadığını kontrol et (query parametrelerini de destekler)
const isPdfFile = (uri: string | null): boolean => {
  if (!uri) return false;
  const cleanUri = uri.split('?')[0].split('#')[0].toLowerCase();
  return cleanUri.endsWith('.pdf');
};

// Backend'den gelen URL'yi tam URL'e çevir (hem relative hem absolute URL destekler)
const buildFullUrl = (url: string): string => {
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url;
  }
  return `https://api.yolsepetigo.com${url}`;
};

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

type Props = NativeStackScreenProps<RootStackParamList, 'EditVehicle'>;

const platformTypes = [
  { value: 'open', label: 'Açık Platform', icon: '🚛' },
  { value: 'closed', label: 'Kapalı Kasa', icon: '🚚' },
  { value: 'flatbed', label: 'Düz Platform', icon: '🛻' },
];

// Backend enum: car, motorcycle, commercial, suv, minibus, truck, tractor
const vehicleTypes = [
  { value: 'car', label: 'Araba', icon: '🚗' },
  { value: 'motorcycle', label: 'Motosiklet', icon: '🏍️' },
  { value: 'suv', label: 'Arazi Aracı', icon: '🚙' },
  { value: 'commercial', label: 'Ticari Araç', icon: '🚐' },
  { value: 'minibus', label: 'Minibüs', icon: '🚌' },
  { value: 'truck', label: 'Tır', icon: '🚚' },
  { value: 'tractor', label: 'Traktör', icon: '🚜' },
];

export default function EditVehicleScreen({ route, navigation }: Props) {
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
  const { vehicleId, vehicleType } = route.params;
  const {
    towTrucks, cranes, transports, homeMoving, roadAssistance, transfers,
    updateTowTruck, updateCrane, updateTransport, updateHomeMoving, updateRoadAssistance, updateTransfer
  } = useVehicleStore();

  // Find vehicle based on vehicleType parameter
  const vehicle = vehicleType === 'tow'
    ? towTrucks.find(v => v.id === vehicleId)
    : vehicleType === 'crane'
      ? cranes.find(v => v.id === vehicleId)
      : vehicleType === 'homeMoving'
        ? homeMoving.find(v => v.id === vehicleId)
        : vehicleType === 'roadAssistance'
          ? roadAssistance.find(v => v.id === vehicleId)
          : vehicleType === 'transfer'
            ? transfers.find(v => v.id === vehicleId)
            : transports.find(v => v.id === vehicleId);

  const [formData, setFormData] = useState<Partial<TowTruckInfo & CraneInfo & TransportInfo & HomeMovingInfo & RoadAssistanceInfo & TransferVehicleInfo>>({});
  const [showPlatformMenu, setShowPlatformMenu] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [transferDocuments, setTransferDocuments] = useState<Record<string, string>>({});
  const [interiorPhotos, setInteriorPhotos] = useState<(string | null)[]>([null, null, null, null]);

  useEffect(() => {
    if (vehicle) {
      setFormData({ ...vehicle });

      // Fotoğrafı backend'den çek
      loadVehiclePhoto();
    }
  }, [vehicle]);

  const loadVehiclePhoto = async () => {
    if (!vehicle) return;

    setLoadingPhoto(true);
    try {
      const vehicleIdNum = parseInt(vehicle.id);
      let photoData;

      if (vehicleType === 'tow') {
        photoData = await vehiclesAPI.getTowTruckPhoto(vehicleIdNum);
      } else if (vehicleType === 'crane') {
        photoData = await vehiclesAPI.getCranePhoto(vehicleIdNum);
      } else if (vehicleType === 'homeMoving') {
        photoData = await vehiclesAPI.getNakliyeVehiclePhoto(vehicleIdNum);
      } else if (vehicleType === 'roadAssistance') {
        photoData = await vehiclesAPI.getRoadAssistanceVehiclePhoto(vehicleIdNum);
      } else if (vehicleType === 'transfer') {
        console.log('📄 [EditVehicle] Transfer belgeleri çekiliyor, vehicleId:', vehicleIdNum);
        photoData = await vehiclesAPI.getTransferVehicleDocuments(vehicleIdNum);
        console.log('📄 [EditVehicle] Transfer belge yanıtı:', JSON.stringify(photoData, null, 2));
        // Transfer belgelerini kaydet
        if (photoData) {
          const docs: Record<string, string> = {};
          const docFields = [
            'license_photo', 'traffic_insurance_photo', 'kasko_photo',
            'authority_certificate_photo', 'src_certificate_photo',
            'psychotechnic_report_photo', 'passenger_seat_insurance_photo',
            'tourism_transport_certificate_photo', 's_plate_certificate_photo', 'route_permit_photo'
          ];
          docFields.forEach(field => {
            if (photoData[field]) docs[field] = buildFullUrl(photoData[field]);
          });
          setTransferDocuments(docs);

          // Interior photos
          const ip = [
            photoData.interior_photo_1 ? buildFullUrl(photoData.interior_photo_1) : null,
            photoData.interior_photo_2 ? buildFullUrl(photoData.interior_photo_2) : null,
            photoData.interior_photo_3 ? buildFullUrl(photoData.interior_photo_3) : null,
            photoData.interior_photo_4 ? buildFullUrl(photoData.interior_photo_4) : null,
          ];
          setInteriorPhotos(ip);
        }
      }

      console.log('📷 [EditVehicle] photoData:', JSON.stringify(photoData, null, 2));
      if (photoData && photoData.vehicle_photo) {
        const fullPhotoUrl = buildFullUrl(photoData.vehicle_photo);
        console.log('📷 [EditVehicle] Vehicle photo URL:', fullPhotoUrl);
        setVehiclePhoto(fullPhotoUrl);
      }
      if (photoData && photoData.insurance_document_photo) {
        const fullInsuranceUrl = buildFullUrl(photoData.insurance_document_photo);
        console.log('📷 [EditVehicle] Insurance URL:', fullInsuranceUrl);
        setInsurancePhoto(fullInsuranceUrl);
      }
    } catch (error: any) {
      // 404 hatası normaldir (fotoğraf yüklenmemişse)
      if (error?.response?.status !== 404) {
        console.error('Fotoğraf yükleme hatası:', error);
      }
    } finally {
      setLoadingPhoto(false);
    }
  };

  const updateField = (field: string) => (value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const toggleVehicleType = (vehicleType: string) => {
    setFormData(prev => ({
      ...prev,
      supportedVehicleTypes: prev.supportedVehicleTypes?.includes(vehicleType)
        ? prev.supportedVehicleTypes.filter(vt => vt !== vehicleType)
        : [...(prev.supportedVehicleTypes || []), vehicleType]
    }));
  };

  // Fotoğraf seçme fonksiyonları
  const pickImageFromGallery = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 0.3,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setVehiclePhoto(result.assets[0].uri);
    }
  };

  const pickImageFromCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();

    if (permissionResult.granted === false) {
      Alert.alert('İzin Gerekli', 'Kamera erişim izni vermelisiniz.');
      return;
    }

    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: false,
      quality: 0.3,
      exif: false,
    });

    if (!result.canceled && result.assets[0]) {
      setVehiclePhoto(result.assets[0].uri);
    }
  };

  const pickDocumentFile = async (target: 'vehicle' | 'insurance') => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
          return;
        }

        const ext = file.name?.toLowerCase().split('.').pop();
        if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext || '')) {
          Alert.alert('Hata', 'Sadece JPG, PNG ve PDF dosyaları kabul edilir.');
          return;
        }

        if (target === 'vehicle') {
          setVehiclePhoto(file.uri);
        } else {
          setInsurancePhoto(file.uri);
        }
      }
    } catch (error) {
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  const removePhoto = () => {
    setVehiclePhoto(null);
  };

  const pickInteriorPhoto = async (index: number) => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) return;
    const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.3, exif: false });
    if (!result.canceled && result.assets[0]) {
      setInteriorPhotos(prev => { const next = [...prev]; next[index] = result.assets[0].uri; return next; });
    }
  };

  const removeInteriorPhoto = (index: number) => {
    setInteriorPhotos(prev => { const next = [...prev]; next[index] = null; return next; });
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!formData.plate?.trim()) newErrors.plate = 'Plaka gerekli';
    if (!formData.brand?.trim()) newErrors.brand = 'Marka gerekli';
    if (!formData.model?.trim()) newErrors.model = 'Model gerekli';
    if (!formData.year?.trim()) {
      newErrors.year = 'Yıl gerekli';
    } else {
      const year = parseInt(formData.year);
      if (isNaN(year) || year < 1900 || year > 2025) {
        newErrors.year = 'Yıl 1900-2025 arasında olmalı';
      }
    }

    if (vehicleType === 'crane') {
      if (!formData.maxHeight?.toString().trim()) newErrors.maxHeight = 'Maksimum yükseklik gerekli';
    }

    if (vehicleType === 'transport') {
      if (!formData.capacity?.toString().trim()) newErrors.capacity = 'Kapasite gerekli';
      if (!formData.volume?.toString().trim()) newErrors.volume = 'Hacim gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm() || !vehicle) return;

    setLoading(true);

    try {
      const vehicleId = parseInt(vehicle.id);

      if (vehicleType === 'tow') {
        // Backend'e güncelleme isteği gönder
        await vehiclesAPI.updateTowTruck(vehicleId, {
          brand: formData.brand || '',
          model: formData.model || '',
          year: parseInt(formData.year || '0'),
          plate_number: formData.plate?.toUpperCase() || '',
          color: '',
          availibility_vehicles_types: formData.supportedVehicleTypes || ['otomobil'],
        });

        // Fotoğraf değiştiyse yükle (http ile başlamıyorsa yeni - file:// veya content:// olabilir)
        {
          const newVP = vehiclePhoto && !vehiclePhoto.startsWith('http') ? vehiclePhoto : undefined;
          const newIP = insurancePhoto && !insurancePhoto.startsWith('http') ? insurancePhoto : undefined;
          if (newVP || newIP) {
            try {
              console.log('📷 Çekici fotoğrafı/belgesi güncelleniyor...');
              let uploadVP = newVP;
              // Sadece sigorta değiştiyse, mevcut araç fotoğrafını indir ve birlikte gönder (backend vehicle_photo zorunlu)
              if (!uploadVP && newIP && vehiclePhoto) {
                uploadVP = await downloadToCache(vehiclePhoto);
              }
              await vehiclesAPI.uploadTowTruckPhoto(vehicleId, uploadVP, newIP);
              console.log('✅ Fotoğraf/belge güncellendi');
            } catch (photoError) {
              console.error('❌ Fotoğraf güncelleme hatası:', photoError);
              Alert.alert('Uyarı', 'Araç güncellendi ama fotoğraf/belge yüklenemedi.');
            }
          }
        }

        // Local store'u güncelle
        updateTowTruck({
          ...formData as TowTruckInfo,
          plate: formData.plate?.toUpperCase() || '',
        });

        Alert.alert('Başarılı', 'Çekici aracı başarıyla güncellendi!');
      } else if (vehicleType === 'crane') {
        // Backend'e güncelleme isteği gönder
        await vehiclesAPI.updateCrane(vehicleId, {
          brand: formData.brand || '',
          model: formData.model || '',
          year: parseInt(formData.year || '0'),
          plate_number: formData.plate?.toUpperCase() || '',
          color: '',
          max_height: parseFloat(formData.maxHeight || '0'),
        });

        // Fotoğraf değiştiyse yükle (local URI ise)
        {
          const newVP = vehiclePhoto && !vehiclePhoto.startsWith('http') ? vehiclePhoto : undefined;
          const newIP = insurancePhoto && !insurancePhoto.startsWith('http') ? insurancePhoto : undefined;
          if (newVP || newIP) {
            try {
              let uploadVP = newVP;
              if (!uploadVP && newIP && vehiclePhoto) {
                uploadVP = await downloadToCache(vehiclePhoto);
              }
              await vehiclesAPI.uploadCranePhoto(vehicleId, uploadVP, newIP);
            } catch (photoError) {
              Alert.alert('Uyarı', 'Araç güncellendi ama fotoğraf/belge yüklenemedi.');
            }
          }
        }

        // Local store'u güncelle
        updateCrane({
          ...formData as CraneInfo,
          plate: formData.plate?.toUpperCase() || '',
        });

        Alert.alert('Başarılı', 'Vinç aracı başarıyla güncellendi!');
      } else if (vehicleType === 'homeMoving') {
        // Evden eve nakliye aracı güncelle
        await vehiclesAPI.updateNakliyeVehicle(vehicleId, {
          brand: formData.brand || '',
          model: formData.model || '',
          year: parseInt(formData.year || '0'),
          plate_number: formData.plate?.toUpperCase() || '',
          vehicle_type: formData.movingVehicleType || 'closed_truck', // Nakliye araç tipi
          capacity_type: 'medium',
          max_volume: parseFloat(formData.volume || '0'),
          max_weight: parseFloat(formData.capacity || '0') * 1000,
          has_helper: formData.hasHelper || false,
        });

        // Fotoğraf değiştiyse yükle
        {
          const newVP = vehiclePhoto && !vehiclePhoto.startsWith('http') ? vehiclePhoto : undefined;
          const newIP = insurancePhoto && !insurancePhoto.startsWith('http') ? insurancePhoto : undefined;
          if (newVP || newIP) {
            try {
              let uploadVP = newVP;
              if (!uploadVP && newIP && vehiclePhoto) {
                uploadVP = await downloadToCache(vehiclePhoto);
              }
              await vehiclesAPI.uploadNakliyeVehiclePhoto(vehicleId, uploadVP, newIP);
            } catch (photoError) {
              Alert.alert('Uyarı', 'Araç güncellendi ama fotoğraf/belge yüklenemedi.');
            }
          }
        }

        // Local store'u güncelle
        updateHomeMoving({
          ...formData as HomeMovingInfo,
          plate: formData.plate?.toUpperCase() || '',
        });

        Alert.alert('Başarılı', 'Nakliye aracı başarıyla güncellendi!');
      } else if (vehicleType === 'roadAssistance') {
        // Yol yardım aracı güncelle
        await vehiclesAPI.updateRoadAssistanceVehicle(vehicleId, {
          brand: formData.brand || '',
          model: formData.model || '',
          year: parseInt(formData.year || '0'),
          plate_number: formData.plate?.toUpperCase() || '',
        });

        // Fotoğraf değiştiyse yükle
        {
          const newVP = vehiclePhoto && !vehiclePhoto.startsWith('http') ? vehiclePhoto : undefined;
          const newIP = insurancePhoto && !insurancePhoto.startsWith('http') ? insurancePhoto : undefined;
          if (newVP || newIP) {
            try {
              let uploadVP = newVP;
              if (!uploadVP && newIP && vehiclePhoto) {
                uploadVP = await downloadToCache(vehiclePhoto);
              }
              await vehiclesAPI.uploadRoadAssistanceVehiclePhoto(vehicleId, uploadVP, newIP);
            } catch (photoError) {
              Alert.alert('Uyarı', 'Araç güncellendi ama fotoğraf/belge yüklenemedi.');
            }
          }
        }

        // Local store'u güncelle
        updateRoadAssistance({
          ...formData as RoadAssistanceInfo,
        });

        Alert.alert('Başarılı', 'Yol yardım aracı başarıyla güncellendi!');
      } else if (vehicleType === 'transfer') {
        await vehiclesAPI.updateTransferVehicle(vehicleId, {
          brand: formData.brand || '',
          model: formData.model || '',
          year: parseInt(formData.year || '0'),
          plate_number: formData.plate?.toUpperCase() || '',
          transfer_type: (formData as any).transferType || 'vip',
          passenger_capacity: (formData as any).passengerCapacity || 0,
          vehicle_class: (formData as any).vehicleClass || '',
        });

        // Fotoğraf ve iç görseller değiştiyse yükle
        {
          const newVP = vehiclePhoto && !vehiclePhoto.startsWith('http') ? vehiclePhoto : undefined;
          const newInteriors = interiorPhotos.map((p, i) => p && !p.startsWith('http') ? { index: i, uri: p } : null).filter(Boolean);

          if (newVP || newInteriors.length > 0) {
            try {
              const formData = new FormData();
              if (newVP) {
                formData.append('vehicle_photo', { uri: newVP, type: 'image/jpeg', name: 'vehicle_photo.jpg' } as any);
              }
              newInteriors.forEach((item: any) => {
                formData.append(`interior_photo_${item.index + 1}`, { uri: item.uri, type: 'image/jpeg', name: `interior_photo_${item.index + 1}.jpg` } as any);
              });
              await vehiclesAPI.uploadTransferVehicleDocuments(vehicleId, formData);
            } catch (photoError) {
              Alert.alert('Uyarı', 'Araç güncellendi ama görseller yüklenemedi.');
            }
          }
        }

        updateTransfer({
          ...formData as TransferVehicleInfo,
          plate: formData.plate?.toUpperCase() || '',
        });

        Alert.alert('Başarılı', 'Transfer aracı başarıyla güncellendi!');
      } else {
        // Transport için sadece local store güncelle (backend API yok)
        updateTransport({
          ...formData as TransportInfo,
          plate: formData.plate?.toUpperCase() || '',
        });

        Alert.alert('Başarılı', 'Nakliye aracı başarıyla güncellendi!');
      }

      navigation.goBack();
    } catch (error: any) {
      console.error('Error updating vehicle:', error);
      const errorMessage = error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Araç güncellenirken bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (!vehicle) {
    return (
      <View style={[styles.container, { backgroundColor: screenBg }]}>
        <AppBar title="Aracı Düzenle" />
        <View style={styles.centeredContainer}>
          <Text variant="headlineSmall" style={styles.errorText}>
            Araç bulunamadı
          </Text>
          <Button mode="outlined" onPress={() => navigation.goBack()}>
            Geri Dön
          </Button>
        </View>
      </View>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <AppBar title="Aracı Düzenle" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            {vehicleType === 'tow' ? '🚛' : vehicleType === 'crane' ? '🏗️' : vehicleType === 'homeMoving' ? '🏠' : vehicleType === 'roadAssistance' ? '🔧' : vehicleType === 'transfer' ? '🚐' : '🚚'} Aracı Düzenle
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            {formData.plate} - {vehicleType === 'tow' ? 'Çekici' : vehicleType === 'crane' ? 'Vinç' : vehicleType === 'homeMoving' ? 'Nakliye' : vehicleType === 'roadAssistance' ? 'Yol Yardım' : vehicleType === 'transfer' ? 'Transfer' : 'Nakliye'} Aracı
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Temel Bilgiler
            </Text>

            <TextInput
              label="Plaka *"
              value={formData.plate || ''}
              onChangeText={updateField('plate')}
              style={styles.input}
              error={!!errors.plate}
              autoCapitalize="characters"
              placeholder="34 ABC 1234"
            />
            {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}

            <View style={styles.row}>
              <TextInput
                label="Marka *"
                value={formData.brand || ''}
                onChangeText={updateField('brand')}
                style={[styles.halfInput, styles.inputLeft]}
                error={!!errors.brand}
              />
              <TextInput
                label="Model *"
                value={formData.model || ''}
                onChangeText={updateField('model')}
                style={[styles.halfInput, styles.inputRight]}
                error={!!errors.model}
              />
            </View>

            <TextInput
              label="Yıl *"
              value={formData.year || ''}
              onChangeText={updateField('year')}
              keyboardType="numeric"
              maxLength={4}
              style={styles.input}
              error={!!errors.year}
              placeholder="2020"
            />
          </Card.Content>
        </Card>

        {/* ARAÇ FOTOĞRAFI - Vehicle Photo */}
        {(vehicleType === 'tow' || vehicleType === 'crane' || vehicleType === 'homeMoving' || vehicleType === 'roadAssistance' || vehicleType === 'transfer') && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                📷 {vehicleType === 'tow' ? 'Çekici' : vehicleType === 'crane' ? 'Vinç' : vehicleType === 'homeMoving' ? 'Nakliye' : vehicleType === 'transfer' ? 'Transfer' : 'Yol Yardım'} Fotoğrafı
              </Text>
              <Text variant="bodySmall" style={[styles.helperText, { fontWeight: '700', fontSize: 15, color: appColors.text.secondary }]}>
                Plaka görünür şekilde araç fotoğrafı ekleyin
              </Text>

              {loadingPhoto ? (
                <View style={styles.photoLoadingContainer}>
                  <Text>Fotoğraf yükleniyor...</Text>
                </View>
              ) : vehiclePhoto ? (
                <View style={styles.photoContainer}>
                  {isPdfFile(vehiclePhoto) ? (
                    <View style={styles.pdfPreview}>
                      <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
                      <Text style={styles.pdfFileName} numberOfLines={1}>
                        {vehiclePhoto.split('/').pop()}
                      </Text>
                    </View>
                  ) : (
                    <Image source={{ uri: vehiclePhoto }} style={styles.photoPreview} />
                  )}
                  <View style={styles.photoActions}>
                    <Button
                      mode="outlined"
                      onPress={pickImageFromGallery}
                      style={styles.photoButton}
                      icon="image"
                    >
                      Değiştir
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={removePhoto}
                      style={styles.photoButton}
                      icon="delete"
                      textColor="#f44336"
                    >
                      Sil
                    </Button>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.photoPickerContainer}>
                    <TouchableOpacity
                      style={styles.photoPickerButton}
                      onPress={pickImageFromCamera}
                    >
                      <MaterialCommunityIcons name="camera" size={32} color="#26a69a" />
                      <Text style={styles.photoPickerText}>Kameradan Çek</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoPickerButton}
                      onPress={pickImageFromGallery}
                    >
                      <MaterialCommunityIcons name="image" size={32} color="#26a69a" />
                      <Text style={styles.photoPickerText}>Galeriden Seç</Text>
                    </TouchableOpacity>
                  </View>
                  <Button
                    mode="outlined"
                    icon="file-upload"
                    onPress={() => pickDocumentFile('vehicle')}
                    style={styles.filePickerButton}
                  >
                    Dosya Seç (PDF)
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* SİGORTA BELGESİ - Insurance Document */}
        {(vehicleType === 'tow' || vehicleType === 'crane' || vehicleType === 'homeMoving' || vehicleType === 'roadAssistance') && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Sigorta Belgesi (Opsiyonel)
              </Text>
              <Text variant="bodySmall" style={[styles.helperText, { fontWeight: '700', fontSize: 15, color: appColors.text.secondary }]}>
                Araç sigorta belgesini fotoğraf veya PDF olarak yükleyin
              </Text>

              {insurancePhoto ? (
                <View style={styles.photoContainer}>
                  {isPdfFile(insurancePhoto) ? (
                    <View style={styles.pdfPreview}>
                      <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
                      <Text style={styles.pdfFileName} numberOfLines={1}>
                        {insurancePhoto.split('/').pop()}
                      </Text>
                    </View>
                  ) : (
                    <Image source={{ uri: insurancePhoto }} style={styles.photoPreview} />
                  )}
                  <View style={styles.photoActions}>
                    <Button
                      mode="outlined"
                      onPress={() => pickDocumentFile('insurance')}
                      style={styles.photoButton}
                      icon="refresh"
                    >
                      Değiştir
                    </Button>
                    <Button
                      mode="outlined"
                      onPress={() => setInsurancePhoto(null)}
                      style={styles.photoButton}
                      icon="delete"
                      textColor="#f44336"
                    >
                      Sil
                    </Button>
                  </View>
                </View>
              ) : (
                <View>
                  <View style={styles.photoPickerContainer}>
                    <TouchableOpacity
                      style={styles.photoPickerButton}
                      onPress={async () => {
                        const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
                        if (!permissionResult.granted) {
                          Alert.alert('İzin Gerekli', 'Kamera erişim izni vermelisiniz.');
                          return;
                        }
                        const result = await ImagePicker.launchCameraAsync({ allowsEditing: false, quality: 0.3, exif: false });
                        if (!result.canceled && result.assets[0]) {
                          setInsurancePhoto(result.assets[0].uri);
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="camera" size={32} color="#26a69a" />
                      <Text style={styles.photoPickerText}>Kameradan Çek</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.photoPickerButton}
                      onPress={async () => {
                        const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
                        if (!permissionResult.granted) {
                          Alert.alert('İzin Gerekli', 'Galeri erişim izni vermelisiniz.');
                          return;
                        }
                        const result = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: false, quality: 0.3, exif: false });
                        if (!result.canceled && result.assets[0]) {
                          setInsurancePhoto(result.assets[0].uri);
                        }
                      }}
                    >
                      <MaterialCommunityIcons name="image" size={32} color="#26a69a" />
                      <Text style={styles.photoPickerText}>Galeriden Seç</Text>
                    </TouchableOpacity>
                  </View>
                  <Button
                    mode="outlined"
                    icon="file-upload"
                    onPress={() => pickDocumentFile('insurance')}
                    style={styles.filePickerButton}
                  >
                    Dosya Seç (PDF)
                  </Button>
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {vehicleType === 'tow' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Teknik Özellikler
              </Text>

              <Menu
                visible={showPlatformMenu}
                onDismiss={() => setShowPlatformMenu(false)}
                anchor={
                  <TextInput
                    label="Platform Türü"
                    value={platformTypes.find(p => p.value === formData.platformType)?.label || ''}
                    onPress={() => setShowPlatformMenu(true)}
                    style={styles.input}
                    right={<TextInput.Icon icon="chevron-down" onPress={() => setShowPlatformMenu(true)} />}
                    editable={false}
                  />
                }
              >
                {platformTypes.map((type) => (
                  <Menu.Item
                    key={type.value}
                    title={`${type.icon} ${type.label}`}
                    onPress={() => {
                      updateField('platformType')(type.value);
                      setShowPlatformMenu(false);
                    }}
                  />
                ))}
              </Menu>
            </Card.Content>
          </Card>
        )}

        {vehicleType === 'transfer' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Transfer Bilgileri
              </Text>

              <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 12 }}>
                <Text variant="bodyMedium" style={{ marginRight: 8 }}>Transfer Tipi:</Text>
                <Chip
                  style={{ backgroundColor: (formData as any).transferType === 'vip' ? '#FFF3E0' : '#E8F5E9' }}
                  textStyle={{ color: (formData as any).transferType === 'vip' ? '#E65100' : '#2E7D32' }}
                >
                  {(formData as any).transferType === 'vip' ? '⭐ VIP' : '🚌 Servis/Organizasyon'}
                </Chip>
              </View>

              <TextInput
                label="Yolcu Kapasitesi *"
                value={(formData as any).passengerCapacity?.toString() || ''}
                onChangeText={(val) => setFormData(prev => ({ ...prev, passengerCapacity: parseInt(val) || 0 }))}
                keyboardType="numeric"
                style={styles.input}
                placeholder="16"
              />

              <SelectDropdown
                label="Araç Sınıfı"
                value={(formData as any).vehicleClass || ''}
                options={
                  (formData as any).transferType === 'vip'
                    ? [{ value: 'sedan', label: 'Sedan' }, { value: 'vip_car', label: 'VIP Araç' }]
                    : [{ value: 'sedan', label: 'Sedan' }, { value: 'vip_car', label: 'VIP Araç' }, { value: 'minibus', label: 'Minibüs' }, { value: 'midibus', label: 'Midibüs' }, { value: 'bus', label: 'Otobüs' }]
                }
                onChange={(val) => setFormData(prev => ({ ...prev, vehicleClass: val }))}
                placeholder="Araç sınıfı seçin"
              />
            </Card.Content>
          </Card>
        )}

        {/* VIP Araç İçi Görselleri */}
        {vehicleType === 'transfer' && (formData as any).transferType === 'vip' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={[styles.sectionTitle, { color: '#FFB300' }]}>
                ⭐ Araç İçi Görselleri
              </Text>
              <Text variant="bodySmall" style={{ color: appColors.text.secondary, marginBottom: 12 }}>
                Müşterilerin aracınızın içini görebilmesi için görseller ekleyin
              </Text>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 10 }}>
                {[0, 1, 2, 3].map((index) => (
                  <View key={index} style={{ width: '47%', aspectRatio: 1.3 }}>
                    {interiorPhotos[index] ? (
                      <TouchableOpacity
                        onPress={() => removeInteriorPhoto(index)}
                        style={{ flex: 1, borderRadius: 12, overflow: 'hidden', position: 'relative' }}
                      >
                        <Image source={{ uri: interiorPhotos[index]! }} style={{ width: '100%', height: '100%', borderRadius: 12 }} />
                        <View style={{ position: 'absolute', top: 4, right: 4, backgroundColor: '#fff', borderRadius: 12 }}>
                          <MaterialCommunityIcons name="close-circle" size={22} color="#f44336" />
                        </View>
                      </TouchableOpacity>
                    ) : (
                      <TouchableOpacity
                        onPress={() => pickInteriorPhoto(index)}
                        style={{ flex: 1, backgroundColor: isDarkMode ? '#2A2A2A' : '#f5f5f5', borderRadius: 12, borderWidth: 2, borderColor: '#e0e0e0', borderStyle: 'dashed', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <MaterialCommunityIcons name="camera-plus" size={28} color="#999" />
                        <Text style={{ fontSize: 11, color: '#999', marginTop: 4 }}>Görsel {index + 1}</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {/* Transfer Yüklü Belgeler */}
        {vehicleType === 'transfer' && Object.keys(transferDocuments).length > 0 && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                📄 Yüklenen Belgeler
              </Text>
              {Object.entries(transferDocuments).map(([key, url]) => {
                const labelMap: Record<string, string> = {
                  license_photo: 'Ehliyet',
                  traffic_insurance_photo: 'Trafik Sigortası',
                  kasko_photo: 'Kasko',
                  authority_certificate_photo: 'Yetki Belgesi',
                  src_certificate_photo: 'SRC Belgesi',
                  psychotechnic_report_photo: 'Psikoteknik Rapor',
                  passenger_seat_insurance_photo: 'Yolcu Koltuk Sigortası',
                  tourism_transport_certificate_photo: 'Turizm Taşımacılık Belgesi',
                  s_plate_certificate_photo: 'S Plaka Belgesi',
                  route_permit_photo: 'Güzergah İzin Belgesi',
                };
                return (
                  <View key={key} style={{ marginBottom: 12 }}>
                    <Text variant="bodyMedium" style={{ fontWeight: '600', marginBottom: 6, color: appColors.text.primary }}>
                      {labelMap[key] || key}
                    </Text>
                    {isPdfFile(url) ? (
                      <View style={styles.pdfPreview}>
                        <MaterialCommunityIcons name="file-pdf-box" size={36} color="#f44336" />
                        <Text style={{ marginLeft: 8, color: appColors.text.secondary }}>PDF Belgesi</Text>
                      </View>
                    ) : (
                      <Image source={{ uri: url }} style={{ width: '100%', height: 120, borderRadius: 8 }} resizeMode="cover" />
                    )}
                  </View>
                );
              })}
            </Card.Content>
          </Card>
        )}

        {vehicleType === 'crane' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Teknik Özellikler
              </Text>

              <TextInput
                label="Maksimum Yükseklik (metre) *"
                value={formData.maxHeight?.toString() || ''}
                onChangeText={updateField('maxHeight')}
                keyboardType="numeric"
                style={styles.input}
                error={!!errors.maxHeight}
                placeholder="40"
              />
              {errors.maxHeight && <Text style={styles.errorText}>{errors.maxHeight}</Text>}
            </Card.Content>
          </Card>
        )}

        {vehicleType === 'tow' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                🚗 Çekebileceği Araç Türleri *
              </Text>
              <Text variant="bodyMedium" style={[styles.vehicleTypesHelperText, { color: appColors.text.secondary }]}>
                Bu çekici aracın çekebileceği araç türlerini seçin (Birden fazla seçim yapabilirsiniz)
              </Text>

              <View style={styles.vehicleTypesContainer}>
                {vehicleTypes.map((vehicleType) => (
                  <TouchableOpacity
                    key={vehicleType.value}
                    style={styles.checkboxItem}
                    onPress={() => toggleVehicleType(vehicleType.value)}
                    activeOpacity={0.7}
                  >
                    <Checkbox
                      status={formData.supportedVehicleTypes?.includes(vehicleType.value) ? 'checked' : 'unchecked'}
                      onPress={() => toggleVehicleType(vehicleType.value)}
                      color="#26a69a"
                    />
                    <Text style={styles.checkboxLabel}>
                      {vehicleType.icon} {vehicleType.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </Card.Content>
          </Card>
        )}

        {vehicleType === 'transport' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Nakliye Özellikleri
              </Text>

              <View style={styles.row}>
                <TextInput
                  label="Kapasite (ton) *"
                  value={formData.capacity?.toString() || ''}
                  onChangeText={updateField('capacity')}
                  keyboardType="numeric"
                  style={[styles.halfInput, styles.inputLeft]}
                  error={!!errors.capacity}
                  placeholder="5"
                />
                <TextInput
                  label="Hacim (m³) *"
                  value={formData.volume?.toString() || ''}
                  onChangeText={updateField('volume')}
                  keyboardType="numeric"
                  style={[styles.halfInput, styles.inputRight]}
                  error={!!errors.volume}
                  placeholder="25"
                />
              </View>

              <View style={styles.row}>
                <TextInput
                  label="Uzunluk (m)"
                  value={formData.length || ''}
                  onChangeText={updateField('length')}
                  keyboardType="numeric"
                  style={[styles.halfInput, styles.inputLeft]}
                  placeholder="6"
                />
                <TextInput
                  label="Genişlik (m)"
                  value={formData.width || ''}
                  onChangeText={updateField('width')}
                  keyboardType="numeric"
                  style={[styles.halfInput, styles.inputRight]}
                  placeholder="2.5"
                />
              </View>

              <TextInput
                label="Yükseklik (m)"
                value={formData.height || ''}
                onChangeText={updateField('height')}
                keyboardType="numeric"
                style={styles.input}
                placeholder="2.5"
              />
            </Card.Content>
          </Card>
        )}

        {/* Nakliye (Evden Eve) Araç Tipi Seçimi */}
        {vehicleType === 'homeMoving' && (
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Nakliye Araç Tipi
              </Text>

              <SelectDropdown
                label="Araç Tipi"
                value={formData.movingVehicleType || ''}
                options={MOVING_VEHICLE_TYPE_OPTIONS}
                onChange={(value) => updateField('movingVehicleType')(value as MovingVehicleType)}
                placeholder="Araç tipi seçin"
                primaryColor="#26a69a"
              />
            </Card.Content>
          </Card>
        )}

        <View style={styles.buttonContainer}>
          <Button
            mode="outlined"
            onPress={() => navigation.goBack()}
            style={[styles.button, styles.cancelButton]}
            disabled={loading}
          >
            İptal
          </Button>
          <Button
            mode="contained"
            onPress={handleSave}
            style={[styles.button, styles.saveButton]}
            loading={loading}
            disabled={loading}
          >
            {loading ? 'Güncelleniyor...' : 'Kaydet'}
          </Button>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 20,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
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
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputLeft: {
    marginRight: 6,
  },
  inputRight: {
    marginLeft: 6,
  },
  helperText: {
    marginBottom: 12,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  equipmentChip: {
    marginBottom: 4,
  },
  vehicleTypesContainer: {
    marginTop: 8,
  },
  vehicleTypesHelperText: {
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 8,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    marginBottom: 8,
  },
  checkboxLabel: {
    fontSize: 17,
    marginLeft: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  checkboxRow: {
    marginTop: 8,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
    paddingBottom: 20,
    marginTop: 8,
  },
  button: {
    flex: 1,
    borderRadius: 12,
  },
  cancelButton: {
    borderColor: '#666',
  },
  saveButton: {
    // Default contained button styling
  },
  photoLoadingContainer: {
    padding: 20,
    alignItems: 'center',
  },
  photoContainer: {
    marginTop: 8,
  },
  photoPreview: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    marginBottom: 12,
  },
  photoActions: {
    flexDirection: 'row',
    gap: 12,
  },
  photoButton: {
    flex: 1,
  },
  photoPickerContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  photoPickerButton: {
    flex: 1,
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    paddingVertical: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  photoPickerText: {
    marginTop: 8,
    color: '#26a69a',
    fontWeight: '600',
    fontSize: 14,
  },
  filePickerButton: {
    marginTop: 12,
    borderColor: '#666',
  },
  pdfPreview: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pdfFileName: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '80%',
  },
});
import { useCallback, useEffect, useState } from 'react';
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { vehiclesAPI } from '../../../api';
import { buildFullUrl } from '../../../utils/fileHelpers';
import {
  ALLOWED_DOCUMENT_EXTENSIONS,
  INTERIOR_PHOTO_SLOT_COUNT,
  MAX_DOCUMENT_SIZE_BYTES,
  PHOTO_PICKER_QUALITY,
  TRANSFER_DOCUMENT_FIELDS,
} from './constants';
import { VehicleKind } from './types';

type PickTarget = 'vehicle' | 'insurance';

async function requestMediaLibraryPermission(): Promise<boolean> {
  const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert('İzin Gerekli', 'Galeriye erişim izni vermelisiniz.');
    return false;
  }
  return true;
}

async function requestCameraPermission(): Promise<boolean> {
  const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
  if (!permissionResult.granted) {
    Alert.alert('İzin Gerekli', 'Kamera erişim izni vermelisiniz.');
    return false;
  }
  return true;
}

async function pickFromGallery(): Promise<string | null> {
  const granted = await requestMediaLibraryPermission();
  if (!granted) return null;
  const result = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ImagePicker.MediaTypeOptions.Images,
    allowsEditing: false,
    quality: PHOTO_PICKER_QUALITY,
    exif: false,
  });
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

async function pickFromCamera(): Promise<string | null> {
  const granted = await requestCameraPermission();
  if (!granted) return null;
  const result = await ImagePicker.launchCameraAsync({
    allowsEditing: false,
    quality: PHOTO_PICKER_QUALITY,
    exif: false,
  });
  if (!result.canceled && result.assets[0]) {
    return result.assets[0].uri;
  }
  return null;
}

async function pickDocument(): Promise<string | null> {
  try {
    const result = await DocumentPicker.getDocumentAsync({
      type: ['application/pdf', 'image/jpeg', 'image/png'],
      copyToCacheDirectory: true,
    });
    if (result.canceled || !result.assets || result.assets.length === 0) return null;

    const file = result.assets[0];
    if (file.size && file.size > MAX_DOCUMENT_SIZE_BYTES) {
      Alert.alert('Hata', "Dosya boyutu 5MB'dan küçük olmalıdır.");
      return null;
    }

    const ext = file.name?.toLowerCase().split('.').pop();
    if (!ALLOWED_DOCUMENT_EXTENSIONS.includes(ext || '')) {
      Alert.alert('Hata', 'Sadece JPG, PNG ve PDF dosyaları kabul edilir.');
      return null;
    }

    return file.uri;
  } catch {
    Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    return null;
  }
}

export function useVehiclePhotos(vehicleId: string | undefined, vehicleType: VehicleKind) {
  const [vehiclePhoto, setVehiclePhoto] = useState<string | null>(null);
  const [insurancePhoto, setInsurancePhoto] = useState<string | null>(null);
  const [loadingPhoto, setLoadingPhoto] = useState(false);
  const [transferDocuments, setTransferDocuments] = useState<Record<string, string>>({});
  const [interiorPhotos, setInteriorPhotos] = useState<(string | null)[]>(
    Array(INTERIOR_PHOTO_SLOT_COUNT).fill(null)
  );

  const loadVehiclePhoto = useCallback(async () => {
    if (!vehicleId) return;

    setLoadingPhoto(true);
    try {
      const vehicleIdNum = parseInt(vehicleId);
      let photoData: any;

      if (vehicleType === 'tow') {
        photoData = await vehiclesAPI.getTowTruckPhoto(vehicleIdNum);
      } else if (vehicleType === 'crane') {
        photoData = await vehiclesAPI.getCranePhoto(vehicleIdNum);
      } else if (vehicleType === 'homeMoving') {
        photoData = await vehiclesAPI.getNakliyeVehiclePhoto(vehicleIdNum);
      } else if (vehicleType === 'roadAssistance') {
        photoData = await vehiclesAPI.getRoadAssistanceVehiclePhoto(vehicleIdNum);
      } else if (vehicleType === 'transfer') {
        photoData = await vehiclesAPI.getTransferVehicleDocuments(vehicleIdNum);

        if (photoData) {
          const docs: Record<string, string> = {};
          TRANSFER_DOCUMENT_FIELDS.forEach((field) => {
            if (photoData[field]) docs[field] = buildFullUrl(photoData[field]);
          });
          setTransferDocuments(docs);

          const ip = Array.from({ length: INTERIOR_PHOTO_SLOT_COUNT }, (_, i) => {
            const key = `interior_photo_${i + 1}` as const;
            return photoData[key] ? buildFullUrl(photoData[key]) : null;
          });
          setInteriorPhotos(ip);
        }
      }

      if (photoData?.vehicle_photo) {
        setVehiclePhoto(buildFullUrl(photoData.vehicle_photo));
      }
      if (photoData?.insurance_document_photo) {
        setInsurancePhoto(buildFullUrl(photoData.insurance_document_photo));
      }
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        console.error('Fotoğraf yükleme hatası:', error);
      }
    } finally {
      setLoadingPhoto(false);
    }
  }, [vehicleId, vehicleType]);

  useEffect(() => {
    if (vehicleId) {
      loadVehiclePhoto();
    }
  }, [vehicleId, loadVehiclePhoto]);

  const pickVehicleFromGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) setVehiclePhoto(uri);
  };

  const pickVehicleFromCamera = async () => {
    const uri = await pickFromCamera();
    if (uri) setVehiclePhoto(uri);
  };

  const pickInsuranceFromGallery = async () => {
    const uri = await pickFromGallery();
    if (uri) setInsurancePhoto(uri);
  };

  const pickInsuranceFromCamera = async () => {
    const uri = await pickFromCamera();
    if (uri) setInsurancePhoto(uri);
  };

  const pickDocumentFor = async (target: PickTarget) => {
    const uri = await pickDocument();
    if (!uri) return;
    if (target === 'vehicle') setVehiclePhoto(uri);
    else setInsurancePhoto(uri);
  };

  const removeVehiclePhoto = () => setVehiclePhoto(null);
  const removeInsurancePhoto = () => setInsurancePhoto(null);

  const pickInteriorPhoto = async (index: number) => {
    const uri = await pickFromGallery();
    if (!uri) return;
    setInteriorPhotos((prev) => {
      const next = [...prev];
      next[index] = uri;
      return next;
    });
  };

  const removeInteriorPhoto = (index: number) => {
    setInteriorPhotos((prev) => {
      const next = [...prev];
      next[index] = null;
      return next;
    });
  };

  return {
    vehiclePhoto,
    insurancePhoto,
    interiorPhotos,
    transferDocuments,
    loadingPhoto,
    pickVehicleFromGallery,
    pickVehicleFromCamera,
    pickInsuranceFromGallery,
    pickInsuranceFromCamera,
    pickDocumentFor,
    removeVehiclePhoto,
    removeInsurancePhoto,
    pickInteriorPhoto,
    removeInteriorPhoto,
  };
}

import { vehiclesAPI } from '../../../../api';
import { downloadToCache } from '../../../../api/vehicles';
import {
  CraneInfo,
  HomeMovingInfo,
  MovingVehicleType,
  RoadAssistanceInfo,
  TowTruckInfo,
  TransferVehicleInfo,
  TransportInfo,
} from '../../../../store/useVehicleStore';
import { isLocalUri } from '../../../../utils/fileHelpers';
import { EditVehicleFormData } from '../types';
import { logger } from '../../../../utils/logger';

interface PhotoState {
  vehiclePhoto: string | null;
  insurancePhoto: string | null;
  interiorPhotos: (string | null)[];
}

interface PhotoUploader {
  (
    vehicleId: number,
    photoUri?: string,
    insurancePhotoUri?: string
  ): Promise<any>;
}

async function uploadStandardPhotosIfChanged(
  vehicleId: number,
  photos: PhotoState,
  uploader: PhotoUploader
): Promise<boolean> {
  const newVP = isLocalUri(photos.vehiclePhoto) ? photos.vehiclePhoto! : undefined;
  const newIP = isLocalUri(photos.insurancePhoto) ? photos.insurancePhoto! : undefined;

  if (!newVP && !newIP) return true;

  try {
    let uploadVP = newVP;
    // Backend, sadece sigorta degisse bile vehicle_photo bekliyor.
    // Mevcut remote vehicle photo'yu cache'e indirip gonder.
    if (!uploadVP && newIP && photos.vehiclePhoto) {
      uploadVP = await downloadToCache(photos.vehiclePhoto);
    }
    await uploader(vehicleId, uploadVP, newIP);
    return true;
  } catch (error) {
    logger.error('auth', 'Photo upload error');
    return false;
  }
}

interface UpdateResult {
  message: string;
  photoUploadFailed: boolean;
}

export async function updateTowTruckVehicle(
  vehicleId: number,
  formData: EditVehicleFormData,
  photos: PhotoState,
  updateStore: (info: TowTruckInfo) => void
): Promise<UpdateResult> {
  const upperPlate = formData.plate?.toUpperCase() || '';

  await vehiclesAPI.updateTowTruck(vehicleId, {
    brand: formData.brand || '',
    model: formData.model || '',
    year: parseInt(formData.year || '0'),
    plate_number: upperPlate,
    color: '',
    availibility_vehicles_types: formData.supportedVehicleTypes || ['otomobil'],
  });

  const photoOk = await uploadStandardPhotosIfChanged(
    vehicleId,
    photos,
    vehiclesAPI.uploadTowTruckPhoto.bind(vehiclesAPI)
  );

  updateStore({
    ...(formData as TowTruckInfo),
    plate: upperPlate,
  });

  return {
    message: 'Çekici aracı başarıyla güncellendi!',
    photoUploadFailed: !photoOk,
  };
}

export async function updateCraneVehicle(
  vehicleId: number,
  formData: EditVehicleFormData,
  photos: PhotoState,
  updateStore: (info: CraneInfo) => void
): Promise<UpdateResult> {
  const upperPlate = formData.plate?.toUpperCase() || '';

  await vehiclesAPI.updateCrane(vehicleId, {
    brand: formData.brand || '',
    model: formData.model || '',
    year: parseInt(formData.year || '0'),
    plate_number: upperPlate,
    color: '',
    max_height: parseFloat(formData.maxHeight || '0'),
  });

  const photoOk = await uploadStandardPhotosIfChanged(
    vehicleId,
    photos,
    vehiclesAPI.uploadCranePhoto.bind(vehiclesAPI)
  );

  updateStore({
    ...(formData as CraneInfo),
    plate: upperPlate,
  });

  return {
    message: 'Vinç aracı başarıyla güncellendi!',
    photoUploadFailed: !photoOk,
  };
}

export async function updateHomeMovingVehicle(
  vehicleId: number,
  formData: EditVehicleFormData,
  photos: PhotoState,
  updateStore: (info: HomeMovingInfo) => void
): Promise<UpdateResult> {
  const upperPlate = formData.plate?.toUpperCase() || '';

  await vehiclesAPI.updateNakliyeVehicle(vehicleId, {
    brand: formData.brand || '',
    model: formData.model || '',
    year: parseInt(formData.year || '0'),
    plate_number: upperPlate,
    vehicle_type: (formData.movingVehicleType || 'closed_truck') as MovingVehicleType,
    capacity_type: 'medium',
    max_volume: parseFloat(formData.volume || '0'),
    max_weight: parseFloat(formData.capacity || '0') * 1000,
    has_helper: formData.hasHelper || false,
  });

  const photoOk = await uploadStandardPhotosIfChanged(
    vehicleId,
    photos,
    vehiclesAPI.uploadNakliyeVehiclePhoto.bind(vehiclesAPI)
  );

  updateStore({
    ...(formData as HomeMovingInfo),
    plate: upperPlate,
  });

  return {
    message: 'Nakliye aracı başarıyla güncellendi!',
    photoUploadFailed: !photoOk,
  };
}

export async function updateRoadAssistanceVehicle(
  vehicleId: number,
  formData: EditVehicleFormData,
  photos: PhotoState,
  updateStore: (info: RoadAssistanceInfo) => void
): Promise<UpdateResult> {
  await vehiclesAPI.updateRoadAssistanceVehicle(vehicleId, {
    brand: formData.brand || '',
    model: formData.model || '',
    year: parseInt(formData.year || '0'),
    plate_number: formData.plate?.toUpperCase() || '',
  });

  const photoOk = await uploadStandardPhotosIfChanged(
    vehicleId,
    photos,
    vehiclesAPI.uploadRoadAssistanceVehiclePhoto.bind(vehiclesAPI)
  );

  updateStore({
    ...(formData as RoadAssistanceInfo),
  });

  return {
    message: 'Yol yardım aracı başarıyla güncellendi!',
    photoUploadFailed: !photoOk,
  };
}

export async function updateTransferVehicleService(
  vehicleId: number,
  formData: EditVehicleFormData,
  photos: PhotoState,
  updateStore: (info: TransferVehicleInfo) => void
): Promise<UpdateResult> {
  const upperPlate = formData.plate?.toUpperCase() || '';
  const transferData = formData as Partial<TransferVehicleInfo>;

  await vehiclesAPI.updateTransferVehicle(vehicleId, {
    brand: formData.brand || '',
    model: formData.model || '',
    year: parseInt(formData.year || '0'),
    plate_number: upperPlate,
    transfer_type: transferData.transferType || 'vip',
    passenger_capacity: transferData.passengerCapacity || 0,
    vehicle_class: transferData.vehicleClass || '',
  });

  const newVP = isLocalUri(photos.vehiclePhoto) ? photos.vehiclePhoto! : undefined;
  const newInteriors = photos.interiorPhotos
    .map((p, i) => (p && isLocalUri(p) ? { index: i, uri: p } : null))
    .filter((x): x is { index: number; uri: string } => x !== null);

  let photoUploadFailed = false;
  if (newVP || newInteriors.length > 0) {
    try {
      const uploadFormData = new FormData();
      if (newVP) {
        uploadFormData.append('vehicle_photo', {
          uri: newVP,
          type: 'image/jpeg',
          name: 'vehicle_photo.jpg',
        } as any);
      }
      newInteriors.forEach((item) => {
        uploadFormData.append(`interior_photo_${item.index + 1}`, {
          uri: item.uri,
          type: 'image/jpeg',
          name: `interior_photo_${item.index + 1}.jpg`,
        } as any);
      });
      await vehiclesAPI.uploadTransferVehicleDocuments(vehicleId, uploadFormData);
    } catch (error) {
      logger.error('auth', 'Transfer photo upload error');
      photoUploadFailed = true;
    }
  }

  updateStore({
    ...(formData as TransferVehicleInfo),
    plate: upperPlate,
  });

  return {
    message: 'Transfer aracı başarıyla güncellendi!',
    photoUploadFailed,
  };
}

export async function updateTransportVehicleLocal(
  formData: EditVehicleFormData,
  updateStore: (info: TransportInfo) => void
): Promise<UpdateResult> {
  const upperPlate = formData.plate?.toUpperCase() || '';
  updateStore({
    ...(formData as TransportInfo),
    plate: upperPlate,
  });
  return {
    message: 'Nakliye aracı başarıyla güncellendi!',
    photoUploadFailed: false,
  };
}

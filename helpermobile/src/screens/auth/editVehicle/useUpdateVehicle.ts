import { useState } from 'react';
import { Alert } from 'react-native';
import { useVehicleStore } from '../../../store/useVehicleStore';
import {
  updateCraneVehicle,
  updateHomeMovingVehicle,
  updateRoadAssistanceVehicle,
  updateTowTruckVehicle,
  updateTransferVehicleService,
  updateTransportVehicleLocal,
} from './services/editVehicleService';
import { EditVehicleFormData, VehicleKind, VehicleRecord } from './types';
import { logger } from '../../../utils/logger';

interface UseUpdateVehicleParams {
  vehicle: VehicleRecord | undefined;
  vehicleType: VehicleKind;
  validateForm: () => boolean;
  formData: EditVehicleFormData;
  vehiclePhoto: string | null;
  insurancePhoto: string | null;
  interiorPhotos: (string | null)[];
  onSuccess: () => void;
}

export function useUpdateVehicle({
  vehicle,
  vehicleType,
  validateForm,
  formData,
  vehiclePhoto,
  insurancePhoto,
  interiorPhotos,
  onSuccess,
}: UseUpdateVehicleParams) {
  const {
    updateTowTruck,
    updateCrane,
    updateTransport,
    updateHomeMoving,
    updateRoadAssistance,
    updateTransfer,
  } = useVehicleStore();

  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    if (!validateForm() || !vehicle) return;

    setLoading(true);
    try {
      const vehicleId = parseInt(vehicle.id);
      const photos = { vehiclePhoto, insurancePhoto, interiorPhotos };

      let result;
      if (vehicleType === 'tow') {
        result = await updateTowTruckVehicle(vehicleId, formData, photos, updateTowTruck);
      } else if (vehicleType === 'crane') {
        result = await updateCraneVehicle(vehicleId, formData, photos, updateCrane);
      } else if (vehicleType === 'homeMoving') {
        result = await updateHomeMovingVehicle(vehicleId, formData, photos, updateHomeMoving);
      } else if (vehicleType === 'roadAssistance') {
        result = await updateRoadAssistanceVehicle(
          vehicleId,
          formData,
          photos,
          updateRoadAssistance
        );
      } else if (vehicleType === 'transfer') {
        result = await updateTransferVehicleService(
          vehicleId,
          formData,
          photos,
          updateTransfer
        );
      } else {
        result = await updateTransportVehicleLocal(formData, updateTransport);
      }

      if (result.photoUploadFailed) {
        Alert.alert(
          'Uyarı',
          vehicleType === 'transfer'
            ? 'Araç güncellendi ama görseller yüklenemedi.'
            : 'Araç güncellendi ama fotoğraf/belge yüklenemedi.'
        );
      }
      Alert.alert('Başarılı', result.message);
      onSuccess();
    } catch (error: any) {
      logger.error('auth', 'Error updating vehicle');
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Araç güncellenirken bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  return { loading, handleSave };
}

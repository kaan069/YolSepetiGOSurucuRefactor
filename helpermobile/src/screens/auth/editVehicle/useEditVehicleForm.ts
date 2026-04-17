import { useEffect, useMemo, useState } from 'react';
import { useVehicleStore } from '../../../store/useVehicleStore';
import { EditVehicleFormData, VehicleKind, VehicleRecord } from './types';

const MIN_YEAR = 1900;
const MAX_YEAR = 2025;

export function useEditVehicleForm(vehicleId: string, vehicleType: VehicleKind) {
  const { towTrucks, cranes, transports, homeMoving, roadAssistance, transfers } =
    useVehicleStore();

  const vehicle: VehicleRecord | undefined = useMemo(() => {
    switch (vehicleType) {
      case 'tow':
        return towTrucks.find((v) => v.id === vehicleId);
      case 'crane':
        return cranes.find((v) => v.id === vehicleId);
      case 'homeMoving':
        return homeMoving.find((v) => v.id === vehicleId);
      case 'roadAssistance':
        return roadAssistance.find((v) => v.id === vehicleId);
      case 'transfer':
        return transfers.find((v) => v.id === vehicleId);
      case 'transport':
      default:
        return transports.find((v) => v.id === vehicleId);
    }
  }, [vehicleType, vehicleId, towTrucks, cranes, transports, homeMoving, roadAssistance, transfers]);

  const [formData, setFormData] = useState<EditVehicleFormData>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  useEffect(() => {
    if (vehicle) {
      setFormData({ ...vehicle });
    }
  }, [vehicle]);

  const updateField = (field: string) => (value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: '' }));
    }
  };

  const setFieldValue = (field: string, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const toggleSupportedVehicleType = (type: string) => {
    setFormData((prev) => ({
      ...prev,
      supportedVehicleTypes: prev.supportedVehicleTypes?.includes(type)
        ? prev.supportedVehicleTypes.filter((vt) => vt !== type)
        : [...(prev.supportedVehicleTypes || []), type],
    }));
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
      if (isNaN(year) || year < MIN_YEAR || year > MAX_YEAR) {
        newErrors.year = `Yıl ${MIN_YEAR}-${MAX_YEAR} arasında olmalı`;
      }
    }

    if (vehicleType === 'crane' && !formData.maxHeight?.toString().trim()) {
      newErrors.maxHeight = 'Maksimum yükseklik gerekli';
    }

    if (vehicleType === 'transport') {
      if (!formData.capacity?.toString().trim()) newErrors.capacity = 'Kapasite gerekli';
      if (!formData.volume?.toString().trim()) newErrors.volume = 'Hacim gerekli';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  return {
    vehicle,
    formData,
    errors,
    updateField,
    setFieldValue,
    toggleSupportedVehicleType,
    validateForm,
  };
}

import React from 'react';
import { FkFormSection, FkMultiSelect, FkSelect } from '../../../../components/fk';
import { PLATFORM_TYPES, SUPPORTED_VEHICLE_TYPES } from '../constants';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  updateField: (field: string) => (value: any) => void;
  toggleSupportedVehicleType: (type: string) => void;
}

const PLATFORM_OPTIONS = PLATFORM_TYPES.map((p) => ({
  value: p.value,
  label: p.label,
  icon: p.icon,
}));

const SUPPORTED_OPTIONS = SUPPORTED_VEHICLE_TYPES.map((t) => ({
  value: t.value,
  label: t.label,
  icon: t.icon,
}));

export default function TowTruckFieldsCard({
  formData,
  updateField,
  toggleSupportedVehicleType,
}: Props) {
  const supportedValues = formData.supportedVehicleTypes ?? [];

  return (
    <>
      <FkFormSection title="Teknik Özellikler">
        <FkSelect
          label="Platform Türü"
          placeholder="Platform türü seçin"
          value={formData.platformType || null}
          options={PLATFORM_OPTIONS}
          onChange={(v) => updateField('platformType')(v)}
        />
      </FkFormSection>

      <FkFormSection
        title="🚗 Çekebileceği Araç Türleri"
        description="Bu çekici aracın çekebileceği araç türlerini seçin (Birden fazla seçim yapabilirsiniz)"
      >
        <FkMultiSelect
          value={supportedValues}
          onChange={(next) => {
            const added = next.filter((v) => !supportedValues.includes(v));
            const removed = supportedValues.filter((v) => !next.includes(v));
            added.forEach(toggleSupportedVehicleType);
            removed.forEach(toggleSupportedVehicleType);
          }}
          options={SUPPORTED_OPTIONS}
          inline
        />
      </FkFormSection>
    </>
  );
}

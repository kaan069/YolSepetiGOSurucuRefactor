import React from 'react';
import { FkFormSection, FkSelect } from '../../../../components/fk';
import { MovingVehicleType } from '../../../../store/useVehicleStore';
import { MOVING_VEHICLE_TYPE_OPTIONS } from '../constants';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  updateField: (field: string) => (value: any) => void;
  /** Onaylı araç: alanlar salt okunur */
  readOnly?: boolean;
}

export default function HomeMovingFieldsCard({ formData, updateField, readOnly }: Props) {
  return (
    <FkFormSection title="Nakliye Araç Tipi">
      <FkSelect
        disabled={readOnly}
        label="Araç Tipi"
        placeholder="Araç tipi seçin"
        value={formData.movingVehicleType || null}
        options={MOVING_VEHICLE_TYPE_OPTIONS}
        onChange={(value) => updateField('movingVehicleType')(value as MovingVehicleType)}
        searchable
      />
    </FkFormSection>
  );
}

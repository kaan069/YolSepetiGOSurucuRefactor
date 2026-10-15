import React from 'react';
import { FkFormSection, FkTextInput } from '../../../../components/fk';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
  /** Onaylı araç: alanlar salt okunur */
  readOnly?: boolean;
}

export default function CraneFieldsCard({ formData, errors, updateField, readOnly }: Props) {
  return (
    <FkFormSection title="Teknik Özellikler">
      <FkTextInput
        disabled={readOnly}
        label="Maksimum Yükseklik (metre)"
        required
        value={formData.maxHeight?.toString() || ''}
        onChange={updateField('maxHeight')}
        keyboardType="numeric"
        placeholder="40"
        error={errors.maxHeight}
      />
    </FkFormSection>
  );
}

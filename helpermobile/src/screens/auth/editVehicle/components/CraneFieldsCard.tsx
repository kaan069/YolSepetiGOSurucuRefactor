import React from 'react';
import { FkFormSection, FkTextInput } from '../../../../components/fk';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
}

export default function CraneFieldsCard({ formData, errors, updateField }: Props) {
  return (
    <FkFormSection title="Teknik Özellikler">
      <FkTextInput
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

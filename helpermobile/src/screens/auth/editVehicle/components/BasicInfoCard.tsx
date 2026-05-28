import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FkFormSection, FkTextInput, FkVehiclePlateInput } from '../../../../components/fk';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
}

export default function BasicInfoCard({ formData, errors, updateField }: Props) {
  return (
    <FkFormSection title="Temel Bilgiler">
      <FkVehiclePlateInput
        label="Plaka"
        required
        value={formData.plate || ''}
        onChange={updateField('plate')}
        error={errors.plate}
      />

      <View style={styles.row}>
        <View style={styles.col}>
          <FkTextInput
            label="Marka"
            required
            value={formData.brand || ''}
            onChange={updateField('brand')}
            error={errors.brand}
          />
        </View>
        <View style={styles.col}>
          <FkTextInput
            label="Model"
            required
            value={formData.model || ''}
            onChange={updateField('model')}
            error={errors.model}
          />
        </View>
      </View>

      <FkTextInput
        label="Yıl"
        required
        value={formData.year || ''}
        onChange={updateField('year')}
        keyboardType="numeric"
        maxLength={4}
        placeholder="2020"
        error={errors.year}
      />
    </FkFormSection>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
});

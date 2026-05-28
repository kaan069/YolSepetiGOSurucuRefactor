import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FkFormSection, FkTextInput } from '../../../../components/fk';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
}

export default function TransportFieldsCard({ formData, errors, updateField }: Props) {
  return (
    <FkFormSection title="Nakliye Özellikleri">
      <View style={styles.row}>
        <View style={styles.col}>
          <FkTextInput
            label="Kapasite (ton)"
            required
            value={formData.capacity?.toString() || ''}
            onChange={updateField('capacity')}
            keyboardType="numeric"
            placeholder="5"
            error={errors.capacity}
          />
        </View>
        <View style={styles.col}>
          <FkTextInput
            label="Hacim (m³)"
            required
            value={formData.volume?.toString() || ''}
            onChange={updateField('volume')}
            keyboardType="numeric"
            placeholder="25"
            error={errors.volume}
          />
        </View>
      </View>

      <View style={styles.row}>
        <View style={styles.col}>
          <FkTextInput
            label="Uzunluk (m)"
            value={formData.length || ''}
            onChange={updateField('length')}
            keyboardType="numeric"
            placeholder="6"
          />
        </View>
        <View style={styles.col}>
          <FkTextInput
            label="Genişlik (m)"
            value={formData.width || ''}
            onChange={updateField('width')}
            keyboardType="numeric"
            placeholder="2.5"
          />
        </View>
      </View>

      <FkTextInput
        label="Yükseklik (m)"
        value={formData.height || ''}
        onChange={updateField('height')}
        keyboardType="numeric"
        placeholder="2.5"
      />
    </FkFormSection>
  );
}

const styles = StyleSheet.create({
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
});

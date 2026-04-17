import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text } from 'react-native-paper';
import SelectDropdown from '../../../../components/common/SelectDropdown';
import { MovingVehicleType } from '../../../../store/useVehicleStore';
import { MOVING_VEHICLE_TYPE_OPTIONS } from '../constants';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  updateField: (field: string) => (value: any) => void;
}

export default function HomeMovingFieldsCard({ formData, updateField }: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Nakliye Araç Tipi
        </Text>

        <SelectDropdown
          label="Araç Tipi"
          value={formData.movingVehicleType || ''}
          options={MOVING_VEHICLE_TYPE_OPTIONS}
          onChange={(value) => updateField('movingVehicleType')(value as MovingVehicleType)}
          placeholder="Araç tipi seçin"
          primaryColor="#26a69a"
        />
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#26a69a',
  },
});

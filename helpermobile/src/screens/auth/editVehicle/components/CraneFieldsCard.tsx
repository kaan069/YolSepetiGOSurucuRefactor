import React from 'react';
import { StyleSheet } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
}

export default function CraneFieldsCard({ formData, errors, updateField }: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Teknik Özellikler
        </Text>

        <TextInput
          label="Maksimum Yükseklik (metre) *"
          value={formData.maxHeight?.toString() || ''}
          onChangeText={updateField('maxHeight')}
          keyboardType="numeric"
          style={styles.input}
          error={!!errors.maxHeight}
          placeholder="40"
        />
        {errors.maxHeight && <Text style={styles.errorText}>{errors.maxHeight}</Text>}
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
  input: {
    marginBottom: 16,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
  },
});

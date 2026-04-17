import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
}

export default function BasicInfoCard({ formData, errors, updateField }: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Temel Bilgiler
        </Text>

        <TextInput
          label="Plaka *"
          value={formData.plate || ''}
          onChangeText={updateField('plate')}
          style={styles.input}
          error={!!errors.plate}
          autoCapitalize="characters"
          placeholder="34 ABC 1234"
        />
        {errors.plate && <Text style={styles.errorText}>{errors.plate}</Text>}

        <View style={styles.row}>
          <TextInput
            label="Marka *"
            value={formData.brand || ''}
            onChangeText={updateField('brand')}
            style={[styles.halfInput, styles.inputLeft]}
            error={!!errors.brand}
          />
          <TextInput
            label="Model *"
            value={formData.model || ''}
            onChangeText={updateField('model')}
            style={[styles.halfInput, styles.inputRight]}
            error={!!errors.model}
          />
        </View>

        <TextInput
          label="Yıl *"
          value={formData.year || ''}
          onChangeText={updateField('year')}
          keyboardType="numeric"
          maxLength={4}
          style={styles.input}
          error={!!errors.year}
          placeholder="2020"
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
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputLeft: {
    marginRight: 6,
  },
  inputRight: {
    marginLeft: 6,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
  },
});

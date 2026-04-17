import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Card, Text, TextInput } from 'react-native-paper';
import { EditVehicleFormData } from '../types';

interface Props {
  formData: EditVehicleFormData;
  errors: Record<string, string>;
  updateField: (field: string) => (value: any) => void;
}

export default function TransportFieldsCard({ formData, errors, updateField }: Props) {
  return (
    <Card style={styles.card}>
      <Card.Content style={styles.cardContent}>
        <Text variant="titleMedium" style={styles.sectionTitle}>
          Nakliye Özellikleri
        </Text>

        <View style={styles.row}>
          <TextInput
            label="Kapasite (ton) *"
            value={formData.capacity?.toString() || ''}
            onChangeText={updateField('capacity')}
            keyboardType="numeric"
            style={[styles.halfInput, styles.inputLeft]}
            error={!!errors.capacity}
            placeholder="5"
          />
          <TextInput
            label="Hacim (m³) *"
            value={formData.volume?.toString() || ''}
            onChangeText={updateField('volume')}
            keyboardType="numeric"
            style={[styles.halfInput, styles.inputRight]}
            error={!!errors.volume}
            placeholder="25"
          />
        </View>

        <View style={styles.row}>
          <TextInput
            label="Uzunluk (m)"
            value={formData.length || ''}
            onChangeText={updateField('length')}
            keyboardType="numeric"
            style={[styles.halfInput, styles.inputLeft]}
            placeholder="6"
          />
          <TextInput
            label="Genişlik (m)"
            value={formData.width || ''}
            onChangeText={updateField('width')}
            keyboardType="numeric"
            style={[styles.halfInput, styles.inputRight]}
            placeholder="2.5"
          />
        </View>

        <TextInput
          label="Yükseklik (m)"
          value={formData.height || ''}
          onChangeText={updateField('height')}
          keyboardType="numeric"
          style={styles.input}
          placeholder="2.5"
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
});

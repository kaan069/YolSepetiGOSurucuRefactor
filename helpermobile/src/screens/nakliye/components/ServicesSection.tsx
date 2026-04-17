import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';

// Hizmet türleri - Service types
export const serviceOptions = [
  'Ev Taşıma',
  'Ofis Taşıma',
  'Paket Gönderimi',
  'Yük Taşıma',
  'Eşya Depolama',
  'Montaj/Demontaj',
  'Temizlik Hizmeti',
  'Sigorta Hizmeti',
];

interface ServicesSectionProps {
  selectedServices: string[];
  onToggleService: (service: string) => void;
  error?: string;
}

export default function ServicesSection({
  selectedServices,
  onToggleService,
  error,
}: ServicesSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Hizmet Türleri *</Text>
      <Text variant="bodySmall" style={styles.helperText}>
        Verdiğiniz nakliye hizmetlerini seçin (en az 1 tane)
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.chipContainer}>
        {serviceOptions.map((service) => (
          <Chip
            key={service}
            selected={selectedServices.includes(service)}
            onPress={() => onToggleService(service)}
            style={styles.serviceChip}
            mode={selectedServices.includes(service) ? 'flat' : 'outlined'}
          >
            {service}
          </Chip>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  formSection: {
    marginBottom: 24,
  },
  subsectionTitle: {
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#666',
  },
  helperText: {
    color: '#666',
    marginBottom: 12,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  serviceChip: {
    marginBottom: 4,
    backgroundColor: '#e3f2fd',
  },
});

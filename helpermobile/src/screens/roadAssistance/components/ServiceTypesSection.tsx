import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';

// Yol yardım hizmet türleri
export const serviceOptions = [
  { value: 'tire', label: 'Lastik Tamiri/Değişimi', icon: '🛞' },
  { value: 'battery', label: 'Akü Takviye', icon: '🔋' },
  { value: 'fuel', label: 'Yakıt İkmali', icon: '⛽' },
  { value: 'locksmith', label: 'Çilingir (Araç Kilidi)', icon: '🔐' },
  { value: 'breakdown', label: 'Yol Kenarı Arıza Desteği', icon: '🔧' },
  { value: 'towing_rope', label: 'Çekme Halatı ile Yardım', icon: '🪢' },
];

interface ServiceTypesSectionProps {
  selectedServices: string[];
  onToggleService: (service: string) => void;
  error?: string;
}

export default function ServiceTypesSection({
  selectedServices,
  onToggleService,
  error,
}: ServiceTypesSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleSmall" style={styles.subsectionTitle}>Hizmet Türleri *</Text>
      <Text variant="bodySmall" style={styles.helperText}>
        Vereceğiniz hizmetleri seçin (en az 1 tane)
      </Text>
      {error && <Text style={styles.errorText}>{error}</Text>}

      <View style={styles.chipContainer}>
        {serviceOptions.map((service) => (
          <Chip
            key={service.value}
            selected={selectedServices.includes(service.value)}
            onPress={() => onToggleService(service.value)}
            style={[
              styles.serviceChip,
              selectedServices.includes(service.value) && styles.serviceChipSelected
            ]}
            mode={selectedServices.includes(service.value) ? 'flat' : 'outlined'}
            icon={() => <Text>{service.icon}</Text>}
          >
            {service.label}
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
    backgroundColor: '#fff3e0',
  },
  serviceChipSelected: {
    backgroundColor: '#ffcc80',
  },
});

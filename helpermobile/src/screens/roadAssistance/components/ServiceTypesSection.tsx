import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text, Chip } from 'react-native-paper';
import { colors } from '../../../theme/design';

// Yol yardım hizmet türleri
export const serviceOptions = [
  { value: 'tire', label: 'Lastik Tamiri/Değişimi', icon: 'tire' },
  { value: 'battery', label: 'Akü Takviye', icon: 'car-battery' },
  { value: 'fuel', label: 'Yakıt İkmali', icon: 'gas-station' },
  { value: 'locksmith', label: 'Çilingir (Araç Kilidi)', icon: 'key-variant' },
  { value: 'breakdown', label: 'Yol Kenarı Arıza Desteği', icon: 'wrench' },
  { value: 'towing_rope', label: 'Çekme Halatı ile Yardım', icon: 'link-variant' },
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
            icon={service.icon}
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
    color: colors.neutral[500],
  },
  helperText: {
    color: colors.neutral[500],
    marginBottom: 12,
  },
  errorText: {
    color: colors.danger[600],
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
    backgroundColor: colors.warning[50],
  },
  serviceChipSelected: {
    backgroundColor: '#ffcc80',
  },
});

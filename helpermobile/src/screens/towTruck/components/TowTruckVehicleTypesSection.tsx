import React from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export const vehicleTypes = [
  { value: 'car', label: 'Otomobil', icon: '' },
  { value: 'motorcycle', label: 'Motosiklet', icon: '' },
  { value: 'suv', label: 'SUV/Arazi', icon: '' },
  { value: 'commercial', label: 'Ticari Arac', icon: '' },
  { value: 'minibus', label: 'Minibus', icon: '' },
  { value: 'truck', label: 'Tir', icon: '' },
];

interface TowTruckVehicleTypesSectionProps {
  supportedVehicleTypes: string[];
  onToggleVehicleType: (type: string) => void;
  error?: string;
}

export default function TowTruckVehicleTypesSection({
  supportedVehicleTypes,
  onToggleVehicleType,
  error,
}: TowTruckVehicleTypesSectionProps) {
  return (
    <View style={styles.formSection}>
      <Text variant="titleMedium" style={styles.subsectionTitle}>
        Cekilebilecek Arac Turleri *
      </Text>
      <Text variant="bodyMedium" style={styles.vehicleTypesHelperText}>
        Cekicinizin cekebilecegi arac turlerini secin (Birden fazla secim yapabilirsiniz)
      </Text>

      {error && (
        <Text style={styles.errorText}>{error}</Text>
      )}

      <View style={styles.vehicleTypesContainer}>
        {vehicleTypes.map((vehicleType) => (
          <TouchableOpacity
            key={vehicleType.value}
            style={[
              styles.checkboxItem,
              supportedVehicleTypes.includes(vehicleType.value) && styles.checkboxItemSelected
            ]}
            onPress={() => onToggleVehicleType(vehicleType.value)}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name={supportedVehicleTypes.includes(vehicleType.value) ? 'checkbox-marked' : 'checkbox-blank-outline'}
              size={26}
              color={supportedVehicleTypes.includes(vehicleType.value) ? '#26a69a' : '#888'}
            />
            <Text style={[
              styles.checkboxLabel,
              supportedVehicleTypes.includes(vehicleType.value) && styles.checkboxLabelSelected
            ]}>
              {vehicleType.icon} {vehicleType.label}
            </Text>
          </TouchableOpacity>
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
  vehicleTypesHelperText: {
    color: '#666',
    marginBottom: 16,
    fontSize: 16,
    fontWeight: '500',
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 12,
  },
  vehicleTypesContainer: {
    marginTop: 8,
  },
  checkboxItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    borderRadius: 12,
    marginBottom: 10,
    borderWidth: 2,
    borderColor: '#d0d0d0',
  },
  checkboxItemSelected: {
    backgroundColor: '#e8f5e9',
    borderColor: '#26a69a',
  },
  checkboxLabel: {
    fontSize: 17,
    marginLeft: 12,
    color: '#333',
    fontWeight: '500',
    flex: 1,
  },
  checkboxLabelSelected: {
    color: '#1b5e20',
    fontWeight: '600',
  },
});

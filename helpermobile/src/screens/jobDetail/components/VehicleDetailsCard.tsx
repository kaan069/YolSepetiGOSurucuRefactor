import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { TowTruckRequestDetail } from '../../../api';
import CollapsibleCard from '../../../components/common/CollapsibleCard';
import { useAppTheme } from '../../../hooks/useAppTheme';

// Araç tipi Türkçe çeviriler
const vehicleTypeLabels: Record<string, string> = {
  'car': 'Otomobil',
  'motorcycle': 'Motosiklet',
  'suv': 'SUV/Arazi Aracı',
  'commercial': 'Ticari Araç',
  'minibus': 'Minibüs',
  'truck': 'Kamyon/TIR',
  'tractor': 'Traktör',
};

interface VehicleDetailsCardProps {
  towTruckRequest: TowTruckRequestDetail;
  towTruckDetails?: {
    vehicleType?: string;
    licensePlate?: string;
  };
}

export default function VehicleDetailsCard({
  towTruckRequest,
  towTruckDetails,
}: VehicleDetailsCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const vehicleType = towTruckDetails?.vehicleType || towTruckRequest.vehicle_type || '';
  const vehicleTypeLabel = vehicleTypeLabels[vehicleType] || vehicleType || 'Belirtilmemiş';
  const licensePlate = towTruckDetails?.licensePlate || towTruckRequest.license_plate || towTruckRequest.vehicle_plate || '';

  const vehicleInfoBg = isDarkMode ? '#1a2e1a' : '#E8F5E9';

  return (
    <CollapsibleCard
      title="Araç Detayları"
      icon="car-info"
      iconColor="#FF9800"
      defaultExpanded={false}
    >
      <View style={[styles.vehicleInfoBox, { backgroundColor: vehicleInfoBg }]}>
        <Text style={[styles.vehicleType, { color: appColors.text.primary }]}>
          Araç Tipi: {vehicleTypeLabel}
        </Text>
        <Text style={[styles.vehiclePlate, { color: appColors.text.secondary }]}>
          Plaka: {licensePlate || 'Belirtilmemiş'}
        </Text>
        {towTruckRequest.estimated_km > 0 && (
          <Text style={[styles.vehicleDistance, { color: appColors.text.secondary }]}>
            Çekim Mesafesi: {towTruckRequest.estimated_km} km
          </Text>
        )}
      </View>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  vehicleInfoBox: {
    padding: 16,
    borderRadius: 8,
    marginBottom: 12,
  },
  vehicleType: {
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 8,
  },
  vehiclePlate: {
    fontSize: 14,
  },
  vehicleDistance: {
    fontSize: 14,
    marginTop: 4,
  },
});

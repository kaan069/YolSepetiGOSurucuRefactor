import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { TowTruckRequestDetail } from '../../../api';
import CollapsibleCard from '../../../components/common/CollapsibleCard';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface LocationInfoCardProps {
  towTruckRequest: TowTruckRequestDetail;
}

export default function LocationInfoCard({ towTruckRequest }: LocationInfoCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const dividerColor = isDarkMode ? '#444' : '#e0e0e0';

  return (
    <CollapsibleCard
      title="Konum Bilgileri"
      icon="map-marker"
      iconColor="#26a69a"
      defaultExpanded={false}
    >
      <View style={styles.locationSection}>
        <View style={styles.locationItem}>
          <View style={styles.locationBadge}>
            <Text style={styles.locationBadgeText}>A</Text>
          </View>
          <View style={styles.locationContent}>
            <Text style={[styles.locationTitle, { color: appColors.text.primary }]}>Alış Noktası</Text>
            <Text style={[styles.locationAddress, { color: appColors.text.secondary }]}>{towTruckRequest.pickup_address}</Text>
            <Text style={[styles.locationExtra, { color: appColors.text.secondary }]}>Araç: {towTruckRequest.vehicle_type}</Text>
          </View>
        </View>
        <View style={[styles.locationDivider, { backgroundColor: dividerColor }]} />
        <View style={styles.locationItem}>
          <View style={[styles.locationBadge, styles.locationBadgeB]}>
            <Text style={styles.locationBadgeText}>B</Text>
          </View>
          <View style={styles.locationContent}>
            <Text style={[styles.locationTitle, { color: appColors.text.primary }]}>Teslim Noktası</Text>
            <Text style={[styles.locationAddress, { color: appColors.text.secondary }]}>{towTruckRequest.dropoff_address}</Text>
            <Text style={[styles.locationExtra, { color: appColors.text.secondary }]}>Mesafe: {towTruckRequest.estimated_km} km</Text>
          </View>
        </View>
      </View>
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  locationSection: {
    gap: 16,
  },
  locationItem: {
    flexDirection: 'row',
    gap: 12,
  },
  locationBadge: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#4CAF50',
    alignItems: 'center',
    justifyContent: 'center',
  },
  locationBadgeB: {
    backgroundColor: '#F44336',
  },
  locationBadgeText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#fff',
  },
  locationContent: {
    flex: 1,
  },
  locationTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  locationAddress: {
    fontSize: 13,
    marginBottom: 4,
    lineHeight: 18,
  },
  locationExtra: {
    fontSize: 12,
  },
  locationDivider: {
    height: 1,
  },
});

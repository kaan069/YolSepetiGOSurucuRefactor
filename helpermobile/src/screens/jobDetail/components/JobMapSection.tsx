import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MapView, { Marker } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TowTruckRequestDetail } from '../../../api';
import { MarkerIcon } from '../../../components/map/CustomMarker';
import { LocationCoords } from '../types';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface JobMapSectionProps {
  towTruckRequest: TowTruckRequestDetail;
  currentLocation: LocationCoords | null;
  distanceToPickup: number | null;
  visible: boolean;
}

export default function JobMapSection({
  towTruckRequest,
  currentLocation,
  distanceToPickup,
  visible,
}: JobMapSectionProps) {
  const { isDarkMode } = useAppTheme();

  if (!visible) return null;

  const pickupLat = parseFloat(towTruckRequest.pickup_latitude);
  const pickupLng = parseFloat(towTruckRequest.pickup_longitude);
  const dropoffLat = parseFloat(towTruckRequest.dropoff_latitude);
  const dropoffLng = parseFloat(towTruckRequest.dropoff_longitude);

  const chipBg = isDarkMode ? 'rgba(30, 30, 30, 0.95)' : 'rgba(255, 255, 255, 0.95)';
  const chipText = isDarkMode ? '#e0e0e0' : '#333';

  return (
    <View style={styles.mapSection}>
      <MapView
        style={styles.heroMap}
        initialRegion={{
          latitude: (pickupLat + dropoffLat) / 2,
          longitude: (pickupLng + dropoffLng) / 2,
          latitudeDelta: Math.abs(pickupLat - dropoffLat) * 2 || 0.05,
          longitudeDelta: Math.abs(pickupLng - dropoffLng) * 2 || 0.05,
        }}
      >
        {/* Pickup Marker */}
        <Marker
          coordinate={{ latitude: pickupLat, longitude: pickupLng }}
          title="Alış Noktası"
          description={towTruckRequest.pickup_address}
        >
          <MarkerIcon type="pickup" />
        </Marker>

        {/* Dropoff Marker */}
        <Marker
          coordinate={{ latitude: dropoffLat, longitude: dropoffLng }}
          title="Teslim Noktası"
          description={towTruckRequest.dropoff_address}
        >
          <MarkerIcon type="dropoff" />
        </Marker>

        {/* Driver Marker */}
        {currentLocation && (
          <Marker
            coordinate={{
              latitude: currentLocation.latitude,
              longitude: currentLocation.longitude,
            }}
            title="Sürücü Konumu"
          >
            <MarkerIcon type="driver" />
          </Marker>
        )}
      </MapView>

      {/* Mesafe Bilgileri Overlay */}
      <View style={styles.mapOverlay}>
        <View style={[styles.metricChip, { backgroundColor: chipBg }]}>
          <MaterialCommunityIcons name="map-marker-distance" size={16} color="#26a69a" />
          <Text style={[styles.metricChipText, { color: chipText }]}>
            {distanceToPickup ? `${distanceToPickup.toFixed(1)} km` : '...'} → Alış
          </Text>
        </View>
        <View style={[styles.metricChip, { backgroundColor: chipBg }]}>
          <MaterialCommunityIcons name="clock-outline" size={16} color="#26a69a" />
          <Text style={[styles.metricChipText, { color: chipText }]}>
            {towTruckRequest.route_duration || 'Hesaplanıyor'}
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  mapSection: {
    position: 'relative',
    marginBottom: 12,
  },
  heroMap: {
    height: 300,
  },
  mapOverlay: {
    position: 'absolute',
    top: 12,
    left: 12,
    right: 12,
    flexDirection: 'row',
    gap: 8,
  },
  metricChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 4,
    elevation: 3,
    gap: 6,
  },
  metricChipText: {
    fontSize: 12,
    fontWeight: '600',
  },
});

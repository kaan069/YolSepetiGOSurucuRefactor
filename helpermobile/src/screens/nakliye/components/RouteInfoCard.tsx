// Rota bilgileri kartı - Nakliye (alış-bırakış konumları)
import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface RouteInfoCardProps {
  fromAddress: string;
  toAddress: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  totalDistance?: number | null;
  isCity?: boolean; // true = şehirler arası, false = evden eve
}

export default function RouteInfoCard({
  fromAddress,
  toAddress,
  fromLat,
  fromLng,
  toLat,
  toLng,
  totalDistance,
  isCity = false,
}: RouteInfoCardProps) {
  const openNavigation = (lat?: number, lng?: number) => {
    if (lat && lng) {
      Linking.openURL(`https://www.google.com/maps/dir/?api=1&destination=${lat},${lng}`);
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="truck-delivery" size={24} color="#26a69a" />
          <Text variant="titleMedium" style={styles.title}>Rota Bilgileri</Text>
        </View>
        <Divider style={styles.divider} />

        {/* Alınacak Konum */}
        <TouchableOpacity
          style={styles.addressBlock}
          onPress={() => openNavigation(fromLat, fromLng)}
          disabled={!fromLat || !fromLng}
        >
          <View style={styles.addressHeader}>
            <MaterialCommunityIcons
              name={isCity ? 'city' : 'home-map-marker'}
              size={20}
              color="#f57c00"
            />
            <Text style={styles.addressLabel}>{isCity ? 'Alınacak Şehir' : 'Alınacak Adres'}</Text>
            {fromLat && fromLng && (
              <MaterialCommunityIcons name="navigation" size={16} color="#26a69a" />
            )}
          </View>
          <Text style={styles.addressText}>{fromAddress}</Text>
        </TouchableOpacity>

        {/* Ok işareti ve mesafe */}
        <View style={styles.arrowContainer}>
          <MaterialCommunityIcons name="arrow-down" size={32} color="#26a69a" />
          {totalDistance !== null && totalDistance !== undefined && totalDistance > 0 && (
            <Text style={styles.distanceText}>{totalDistance.toFixed(0)} km</Text>
          )}
        </View>

        {/* Bırakılacak Konum */}
        <TouchableOpacity
          style={styles.addressBlock}
          onPress={() => openNavigation(toLat, toLng)}
          disabled={!toLat || !toLng}
        >
          <View style={styles.addressHeader}>
            <MaterialCommunityIcons
              name={isCity ? 'city-variant' : 'map-marker-check'}
              size={20}
              color="#4caf50"
            />
            <Text style={styles.addressLabel}>{isCity ? 'Bırakılacak Şehir' : 'Bırakılacak Adres'}</Text>
            {toLat && toLng && (
              <MaterialCommunityIcons name="navigation" size={16} color="#26a69a" />
            )}
          </View>
          <Text style={styles.addressText}>{toAddress}</Text>
        </TouchableOpacity>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginBottom: 12,
  },
  addressBlock: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  addressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  addressLabel: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    marginLeft: 8,
  },
  addressText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    marginTop: 4,
  },
  arrowContainer: {
    alignItems: 'center',
    marginVertical: 8,
  },
  distanceText: {
    fontSize: 14,
    color: '#26a69a',
    fontWeight: 'bold',
    marginTop: 4,
  },
});

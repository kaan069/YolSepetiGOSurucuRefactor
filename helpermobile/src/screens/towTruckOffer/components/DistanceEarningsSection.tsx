/**
 * DistanceEarningsSection Component
 *
 * Mesafe ve kazanç bilgilerini gösteren bileşen.
 * - Sürücüden alış noktasına mesafe
 * - Çekim mesafesi (pickup -> dropoff)
 * - Toplam mesafe
 * - Tahmini kazanç
 * - Gizlilik uyarısı (harita işten sonra görünür)
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface DistanceEarningsSectionProps {
  /** Sürücüden alış noktasına mesafe (km) */
  distanceToPickup: number | null;
  /** Çekim mesafesi - pickup'tan dropoff'a (km) */
  routeDistance: number;
  /** Toplam mesafe (km) */
  totalDistance: number | null;
}

/**
 * Mesafeyi formatla (binlik ayracı olmadan, max 1 ondalık)
 */
const formatDistance = (num: number): string => {
  return num.toFixed(1).replace('.0', '');
};


export default function DistanceEarningsSection({
  distanceToPickup,
  routeDistance,
  totalDistance,
}: DistanceEarningsSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const borderColor = isDarkMode ? '#333' : '#F0F0F0';
  const distanceCardBg = isDarkMode ? '#2a2a2a' : '#F9F9F9';
  const totalDistanceBg = isDarkMode ? '#0d2137' : '#E3F2FD';
  const totalDistanceTextColor = isDarkMode ? '#90CAF9' : '#1976D2';
  const totalDistanceValueColor = isDarkMode ? '#90CAF9' : '#1565C0';
  const privacyBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';

  return (
    <View style={[styles.section, { backgroundColor: cardBg }]}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
        <MaterialCommunityIcons name="map-marker-distance" size={20} color="#26a69a" />
        <Text style={[styles.sectionTitle, { color: appColors.text.primary }]}>Mesafe ve Kazanç</Text>
      </View>

      {/* Section Content */}
      <View style={styles.sectionContent}>
        {/* Mesafe Kartları */}
        <View style={styles.distanceGrid}>
          {/* Sürücüden Alış Noktasına */}
          <View style={[styles.distanceCard, { backgroundColor: distanceCardBg }]}>
            <MaterialCommunityIcons name="map-marker" size={24} color="#2196F3" />
            <Text style={[styles.distanceValue, { color: appColors.text.primary }]}>
              {distanceToPickup ? `${formatDistance(distanceToPickup)} km` : '-'}
            </Text>
            <Text style={[styles.distanceLabel, { color: appColors.text.secondary }]}>Sizden Alış Noktasına</Text>
          </View>

          {/* Çekim Mesafesi */}
          <View style={[styles.distanceCard, { backgroundColor: distanceCardBg }]}>
            <MaterialCommunityIcons name="truck-delivery" size={24} color="#FF9800" />
            <Text style={[styles.distanceValue, { color: appColors.text.primary }]}>{formatDistance(routeDistance)} km</Text>
            <Text style={[styles.distanceLabel, { color: appColors.text.secondary }]}>Çekim Mesafesi</Text>
          </View>
        </View>

        {/* Toplam Mesafe */}
        {totalDistance && (
          <View style={[styles.totalDistanceCard, { backgroundColor: totalDistanceBg }]}>
            <Text style={[styles.totalDistanceLabel, { color: totalDistanceTextColor }]}>Toplam Mesafe</Text>
            <Text style={[styles.totalDistanceValue, { color: totalDistanceValueColor }]}>{formatDistance(totalDistance)} km</Text>
          </View>
        )}

        {/* Gizlilik Uyarısı */}
        <View style={[styles.privacyNotice, { backgroundColor: privacyBg }]}>
          <MaterialCommunityIcons name="lock-outline" size={16} color="#E65100" />
          <Text style={styles.privacyText}>
            Harita ve konum detayları işi kabul ettikten sonra görüntülenecektir
          </Text>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
  },
  // Distance Grid
  distanceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 12,
  },
  distanceCard: {
    flex: 1,
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
    gap: 8,
  },
  distanceValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  distanceLabel: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  // Total Distance
  totalDistanceCard: {
    borderRadius: 8,
    padding: 16,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  totalDistanceLabel: {
    fontSize: 15,
    fontWeight: '600',
  },
  totalDistanceValue: {
    fontSize: 20,
    fontWeight: '700',
  },
  // Privacy Notice
  privacyNotice: {
    borderRadius: 8,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    color: '#E65100',
    lineHeight: 16,
  },
});

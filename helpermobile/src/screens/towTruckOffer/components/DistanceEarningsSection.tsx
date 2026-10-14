/**
 * DistanceEarningsSection Component
 *
 * Mesafe bilgileri: sürücüden alış noktasına, çekim mesafesi (pickup → dropoff), toplam.
 * Gizlilik notu: harita ve konum detayları işi kabul ettikten sonra görünür.
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InfoRow, JobSection } from '../../../components/job';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { colors, radius, spacing } from '../../../theme/design';

interface DistanceEarningsSectionProps {
  /** Sürücüden alış noktasına mesafe (km) */
  distanceToPickup: number | null;
  /** Çekim mesafesi - pickup'tan dropoff'a (km) */
  routeDistance: number;
  /** Toplam mesafe (km) */
  totalDistance: number | null;
}

/** Mesafeyi formatla (binlik ayracı olmadan, max 1 ondalık) */
const formatDistance = (num: number): string => num.toFixed(1).replace('.0', '');

export default function DistanceEarningsSection({ distanceToPickup, routeDistance, totalDistance }: DistanceEarningsSectionProps) {
  const { appColors } = useAppTheme();

  const tile = (icon: string, value: string, label: string, color: string) => (
    <View style={[styles.tile, { backgroundColor: colors.neutral[50] }]}>
      <MaterialCommunityIcons name={icon} size={22} color={color} />
      <Text style={[styles.tileValue, { color: appColors.text.primary }]}>{value}</Text>
      <Text style={[styles.tileLabel, { color: appColors.text.secondary }]}>{label}</Text>
    </View>
  );

  return (
    <JobSection title="Mesafe Bilgileri" icon="map-marker-distance">
      <View style={styles.grid}>
        {tile('crosshairs-gps', distanceToPickup ? `${formatDistance(distanceToPickup)} km` : '-', 'Sizden alış noktasına', colors.info[500])}
        {tile('tow-truck', `${formatDistance(routeDistance)} km`, 'Çekim mesafesi', colors.secondary[500])}
      </View>
      {totalDistance ? (
        <InfoRow
          icon="map-marker-path"
          label="Toplam mesafe"
          value={`${formatDistance(totalDistance)} km`}
          emphasize
          valueColor={colors.primary[600]}
        />
      ) : null}
      <View style={styles.privacy}>
        <MaterialCommunityIcons name="lock-outline" size={16} color={colors.neutral[400]} />
        <Text style={[styles.privacyText, { color: appColors.text.secondary }]}>
          Harita ve konum detayları işi kabul ettikten sonra görüntülenecektir
        </Text>
      </View>
    </JobSection>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  tile: {
    flex: 1,
    alignItems: 'center',
    borderRadius: radius.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    gap: 4,
  },
  tileValue: {
    fontSize: 18,
    fontWeight: '700',
  },
  tileLabel: {
    fontSize: 12,
    textAlign: 'center',
  },
  privacy: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  privacyText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
});

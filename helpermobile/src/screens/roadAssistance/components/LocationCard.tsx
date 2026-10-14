// Müşteri konum kartı - Harita ve adres bilgisi
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MapView, { Marker, Circle } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { maskAddressToArea } from '../../../utils/addressMask';
import { openMapsAt } from '../../../utils/contactActions';
import { InfoRow, JobSection } from '../../../components/job';
import { FkButton } from '../../../components/fk';
import { colors, radius, spacing } from '../../../theme/design';

interface LocationCardProps {
  address: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  hideExactLocation?: boolean; // Teklif vermeden önce konumu gizle
}

export default function LocationCard({ address, latitude, longitude, distance, hideExactLocation = false }: LocationCardProps) {
  const { appColors } = useAppTheme();
  const hasValidCoords = latitude !== 0 && longitude !== 0;

  // Konum gizliyse yaklaşık bölge göster
  if (hideExactLocation) {
    return (
      <JobSection
        title="Yaklaşık Konum"
        subtitle="Teklif kabul edilince tam konum gösterilecek"
        icon="map-marker-question-outline"
      >
        {hasValidCoords && (
          <View style={styles.mapWrap}>
            <MapView
              style={styles.map}
              initialRegion={{ latitude, longitude, latitudeDelta: 0.08, longitudeDelta: 0.08 }}
              scrollEnabled={false}
              zoomEnabled={false}
              pitchEnabled={false}
              rotateEnabled={false}
            >
              <Circle
                center={{ latitude, longitude }}
                radius={2000}
                fillColor="rgba(21, 155, 141, 0.18)"
                strokeColor="rgba(21, 155, 141, 0.5)"
                strokeWidth={2}
              />
            </MapView>
          </View>
        )}
        <InfoRow icon="map-marker-outline" label="Bölge" value={maskAddressToArea(address)} divider={distance !== null} />
        {distance !== null && (
          <InfoRow icon="map-marker-distance" label="Yaklaşık uzaklık" value={`~${Math.round(distance)} km`} valueColor={colors.primary[600]} />
        )}
        <View style={styles.lockRow}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={colors.neutral[400]} />
          <Text style={[styles.lockText, { color: appColors.text.secondary }]}>
            Tam adres ve konum, teklifiniz kabul edildikten sonra görüntülenecektir.
          </Text>
        </View>
      </JobSection>
    );
  }

  return (
    <JobSection title="Müşteri Konumu" subtitle="Yolda kalan müşterinin bulunduğu yer" icon="map-marker-outline">
      {hasValidCoords && (
        <View style={styles.mapWrap}>
          <MapView
            style={styles.map}
            initialRegion={{ latitude, longitude, latitudeDelta: 0.02, longitudeDelta: 0.02 }}
          >
            <Marker coordinate={{ latitude, longitude }} title="Müşteri Konumu" />
          </MapView>
        </View>
      )}
      <InfoRow icon="map-marker-outline" label="Adres" value={address || 'Adres belirtilmemiş'} stacked divider={distance !== null} />
      {distance !== null && (
        <InfoRow
          icon="map-marker-distance"
          label="Müşteriye uzaklığınız"
          value={`${distance.toFixed(1)} km`}
          valueColor={colors.primary[600]}
        />
      )}
      <FkButton icon="directions" fullWidth onPress={() => openMapsAt(latitude, longitude)} style={styles.button}>
        Yol Tarifi Al
      </FkButton>
    </JobSection>
  );
}

const styles = StyleSheet.create({
  mapWrap: {
    borderRadius: radius.md,
    overflow: 'hidden',
    marginBottom: spacing.sm,
  },
  map: {
    height: 180,
  },
  lockRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  lockText: {
    flex: 1,
    fontSize: 12,
    lineHeight: 17,
  },
  button: {
    marginTop: spacing.md,
  },
});

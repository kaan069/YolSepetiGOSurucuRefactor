// Müşteri konum kartı - Harita ve adres bilgisi
import React from 'react';
import { View, StyleSheet, Platform, Linking, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import MapView, { Marker, Circle } from 'react-native-maps';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface LocationCardProps {
  address: string;
  latitude: number;
  longitude: number;
  distance: number | null;
  hideExactLocation?: boolean; // Teklif vermeden önce konumu gizle
}

// Adresten sadece ilçe/şehir bilgisini çıkar
const getApproximateArea = (address: string): string => {
  if (!address) return 'Bölge belirtilmemiş';

  // Adresi virgül veya / ile böl
  const parts = address.split(/[,\/]/);

  // Son 2-3 parçayı al (genelde ilçe, şehir, ülke)
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ').trim();
  }

  // Eğer bölünemiyorsa, ilk 30 karakteri göster
  return address.length > 30 ? address.substring(0, 30) + '...' : address;
};

export default function LocationCard({ address, latitude, longitude, distance, hideExactLocation = false }: LocationCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const locationInfoBg = isDarkMode ? '#1e1e1e' : '#f5f5f5';
  const dividerColor = isDarkMode ? '#444' : '#e0e0e0';

  const openInGoogleMaps = () => {
    const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
    const url = Platform.select({
      ios: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          Linking.openURL(`https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`);
        }
      }).catch(() => Alert.alert('Hata', 'Harita açılamadı'));
    }
  };

  const hasValidCoords = latitude !== 0 && longitude !== 0;

  // Konum gizliyse yaklaşık bölge göster
  if (hideExactLocation) {
    return (
      <Card style={styles.card}>
        <Card.Title
          title="Yaklaşık Konum"
          subtitle="Teklif kabul edilince tam konum gösterilecek"
          left={() => <MaterialCommunityIcons name="map-marker-question" size={24} color="#f57c00" />}
        />
        {hasValidCoords && (
          <MapView
            style={styles.map}
            initialRegion={{
              latitude,
              longitude,
              latitudeDelta: 0.08,
              longitudeDelta: 0.08,
            }}
            scrollEnabled={false}
            zoomEnabled={false}
            pitchEnabled={false}
            rotateEnabled={false}
          >
            <Circle
              center={{ latitude, longitude }}
              radius={2000}
              fillColor="rgba(245, 124, 0, 0.2)"
              strokeColor="rgba(245, 124, 0, 0.5)"
              strokeWidth={2}
            />
          </MapView>
        )}
        <Card.Content>
          <View style={[styles.locationInfo, { backgroundColor: locationInfoBg }]}>
            <View style={styles.addressRow}>
              <MaterialCommunityIcons name="map-marker-radius" size={20} color="#f57c00" />
              <Text style={[styles.addressText, { color: appColors.text.primary }]}>{getApproximateArea(address)}</Text>
            </View>
            {distance !== null && (
              <View style={styles.distanceRow}>
                <MaterialCommunityIcons name="map-marker-distance" size={20} color="#26a69a" />
                <Text style={[styles.distanceLabel, { color: appColors.text.secondary }]}>Yaklaşık uzaklık:</Text>
                <Text style={styles.distanceValue}>~{Math.round(distance)} km</Text>
              </View>
            )}
            <View style={[styles.hiddenInfoRow, { borderTopColor: dividerColor }]}>
              <MaterialCommunityIcons name="lock" size={16} color="#999" />
              <Text style={[styles.hiddenInfoText, { color: appColors.text.disabled }]}>
                Tam adres ve konum, teklifiniz kabul edildikten sonra görüntülenecektir.
              </Text>
            </View>
          </View>
        </Card.Content>
      </Card>
    );
  }

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Müşteri Konumu"
        subtitle="Yolda kalan müşterinin bulunduğu yer"
        left={() => <MaterialCommunityIcons name="map-marker" size={24} color="#f57c00" />}
      />
      {hasValidCoords && (
        <MapView
          style={styles.map}
          initialRegion={{
            latitude,
            longitude,
            latitudeDelta: 0.02,
            longitudeDelta: 0.02,
          }}>
          <Marker coordinate={{ latitude, longitude }} title="Müşteri Konumu" />
        </MapView>
      )}
      <Card.Content>
        <View style={[styles.locationInfo, { backgroundColor: locationInfoBg }]}>
          <View style={styles.addressRow}>
            <MaterialCommunityIcons name="map-marker" size={20} color="#f57c00" />
            <Text style={[styles.addressText, { color: appColors.text.primary }]}>{address || 'Adres belirtilmemiş'}</Text>
          </View>
          {distance !== null && (
            <View style={styles.distanceRow}>
              <MaterialCommunityIcons name="map-marker-distance" size={20} color="#26a69a" />
              <Text style={[styles.distanceLabel, { color: appColors.text.secondary }]}>Müşteriye uzaklığınız:</Text>
              <Text style={styles.distanceValue}>{distance.toFixed(1)} km</Text>
            </View>
          )}
        </View>
        <Button
          icon="directions"
          mode="contained"
          buttonColor="#4CAF50"
          onPress={openInGoogleMaps}
          style={styles.button}
        >
          Yol Tarifi Al
        </Button>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  map: {
    height: 200,
    marginHorizontal: 16,
    borderRadius: 8,
  },
  locationInfo: {
    marginTop: 12,
    padding: 12,
    borderRadius: 8,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  addressText: {
    flex: 1,
    fontSize: 14,
    lineHeight: 20,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    gap: 8,
  },
  distanceLabel: {
    fontSize: 14,
  },
  distanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#26a69a',
  },
  hiddenInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    gap: 8,
  },
  hiddenInfoText: {
    flex: 1,
    fontSize: 12,
    fontStyle: 'italic',
  },
  button: {
    marginTop: 12,
  },
});

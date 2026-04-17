// Konum kartı - Nakliye iş detayı (Alış/Teslim noktası)
import React from 'react';
import { StyleSheet, Linking, Platform, Alert } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface LocationCardProps {
  type: 'pickup' | 'dropoff';
  // Backend detay response'larında adres alanı opsiyonel olabildiğinden
  // prop da opsiyonel tutulur; render'da 'Adres belirtilmemiş' fallback'i var.
  address?: string;
  latitude: number;
  longitude: number;
  // Backend sayısal alanları string olarak da dönebildiği için (ör. floor_from: "3")
  // prop'u gevşetiyoruz; render <Text> içinde stringleştirme otomatik.
  floor?: number | string | null;
  hasElevator?: boolean;
  visible: boolean;
  showDirectionsButton?: boolean;
}

export default function LocationCard({
  type,
  address,
  latitude,
  longitude,
  floor,
  hasElevator,
  visible,
  showDirectionsButton = true,
}: LocationCardProps) {
  const { appColors } = useAppTheme();

  if (!visible) return null;

  const isPickup = type === 'pickup';
  const title = isPickup ? 'Alış Noktası' : 'Teslim Noktası';
  const color = isPickup ? '#4CAF50' : '#F44336';
  const iconName = isPickup ? 'map-marker' : 'map-marker-check';

  const openInMaps = () => {
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
      }).catch(() => {
        Alert.alert('Hata', 'Harita açılamadı');
      });
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title={title}
        titleStyle={[styles.title, { color }]}
        left={() => <MaterialCommunityIcons name={iconName} size={24} color={color} />}
      />
      <Card.Content>
        <Text style={[styles.address, { color: appColors.text.primary }]}>{address || 'Adres belirtilmemiş'}</Text>
        {floor !== undefined && floor !== null && (
          <Text style={[styles.floor, { color: appColors.text.secondary }]}>
            Kat: {floor} {hasElevator ? '(Asansör var)' : '(Asansör yok)'}
          </Text>
        )}
        {showDirectionsButton && (
          <Button
            icon="directions"
            mode={isPickup ? 'contained' : 'outlined'}
            buttonColor={isPickup ? color : undefined}
            onPress={openInMaps}
          >
            {title}na Yol Tarifi
          </Button>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  address: {
    fontSize: 15,
    marginBottom: 8,
  },
  floor: {
    fontSize: 13,
    marginBottom: 12,
  },
});

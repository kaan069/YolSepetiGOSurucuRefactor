// Müşteri konum kartı - Vinç
import React from 'react';
import { StyleSheet, Platform, Alert, Linking } from 'react-native';
import { Card, Text, Button } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface LocationCardProps {
  address: string;
  latitude: number;
  longitude: number;
}

export default function LocationCard({ address, latitude, longitude }: LocationCardProps) {
  const { appColors } = useAppTheme();

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
      }).catch(() => Alert.alert('Hata', 'Harita açılamadı'));
    }
  };

  return (
    <Card style={styles.card}>
      <Card.Title
        title="📍 Müşteri Konumu"
        titleStyle={styles.title}
      />
      <Card.Content>
        <Text style={[styles.address, { color: appColors.text.primary }]}>{address || 'Adres belirtilmemiş'}</Text>
        <Button
          icon="directions"
          mode="contained"
          buttonColor="#4CAF50"
          onPress={openInMaps}
        >
          Müşteri Konumuna Yol Tarifi Al
        </Button>
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
    color: '#4CAF50',
  },
  address: {
    fontSize: 15,
    marginBottom: 12,
  },
});

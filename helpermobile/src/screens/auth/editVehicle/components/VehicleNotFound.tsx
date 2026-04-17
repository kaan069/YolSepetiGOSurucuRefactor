import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button, Text } from 'react-native-paper';
import AppBar from '../../../../components/common/AppBar';
import { useAppTheme } from '../../../../hooks/useAppTheme';

interface Props {
  onBack: () => void;
}

export default function VehicleNotFound({ onBack }: Props) {
  const { screenBg } = useAppTheme();
  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <AppBar title="Aracı Düzenle" />
      <View style={styles.centeredContainer}>
        <Text variant="headlineSmall" style={styles.errorText}>
          Araç bulunamadı
        </Text>
        <Button mode="outlined" onPress={onBack}>
          Geri Dön
        </Button>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centeredContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    color: '#d32f2f',
    marginBottom: 16,
  },
});

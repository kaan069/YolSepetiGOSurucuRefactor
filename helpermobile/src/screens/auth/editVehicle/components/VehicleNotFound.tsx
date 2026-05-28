import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import AppBar from '../../../../components/common/AppBar';
import { FkButton } from '../../../../components/fk';
import { useFkTokens } from '../../../../hooks/useFkTokens';

interface Props {
  onBack: () => void;
}

export default function VehicleNotFound({ onBack }: Props) {
  const { tokens } = useFkTokens();
  return (
    <View style={[styles.container, { backgroundColor: tokens.colors.screenBg }]}>
      <AppBar title="Aracı Düzenle" />
      <View style={styles.centered}>
        <Text variant="headlineSmall" style={[styles.errorText, { color: tokens.colors.error }]}>
          Araç bulunamadı
        </Text>
        <FkButton variant="secondary" onPress={onBack}>
          Geri Dön
        </FkButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centered: { flex: 1, justifyContent: 'center', alignItems: 'center', padding: 20 },
  errorText: { marginBottom: 16 },
});

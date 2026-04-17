/**
 * AcceptButton Component
 *
 * Teklif gönderme butonu.
 * Çekici seçilmediğinde veya fiyat hesaplanmadığında disabled olur.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Button } from 'react-native-paper';

interface AcceptButtonProps {
  /** Butona tıklandığında çağrılacak fonksiyon */
  onPress: () => void;
  /** Yükleme durumu */
  loading: boolean;
  /** Çekici sayısı (0 ise buton disabled) */
  towTruckCount: number;
  /** Fiyat hesaplandı mı? */
  hasPricing: boolean;
}

export default function AcceptButton({
  onPress,
  loading,
  towTruckCount,
  hasPricing,
}: AcceptButtonProps) {
  // Buton disabled durumu
  const isDisabled = loading || towTruckCount === 0 || !hasPricing;

  // Buton metni
  const buttonText = towTruckCount === 0 ? 'Kayıtlı Çekici Yok' : 'Teklif Gönder';

  return (
    <View style={styles.container}>
      <Button
        mode="contained"
        icon="check-circle"
        onPress={onPress}
        style={styles.button}
        contentStyle={styles.buttonContent}
        disabled={isDisabled}
        buttonColor="#4CAF50"
      >
        {buttonText}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingTop: 8,
    paddingBottom: 16,
  },
  button: {
    borderRadius: 8,
    elevation: 0,
  },
  buttonContent: {
    paddingVertical: 12,
  },
});

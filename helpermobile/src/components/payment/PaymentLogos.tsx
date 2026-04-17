/**
 * PaymentLogos Component
 *
 * iyzico onayı için gerekli Visa, MasterCard ve iyzico logolarını gösterir.
 * Ödeme yapılan tüm ekranlarda kullanılmalıdır.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface PaymentLogosProps {
  size?: 'small' | 'medium' | 'large';
  showLabel?: boolean;
}

export default function PaymentLogos({ size = 'medium', showLabel = true }: PaymentLogosProps) {
  const iconSize = size === 'small' ? 28 : size === 'medium' ? 36 : 44;
  const containerPadding = size === 'small' ? 8 : size === 'medium' ? 12 : 16;
  const fontSize = size === 'small' ? 10 : size === 'medium' ? 11 : 12;

  return (
    <View style={[styles.container, { padding: containerPadding }]}>
      {showLabel && (
        <Text style={[styles.label, { fontSize }]}>
          Güvenli Ödeme
        </Text>
      )}
      <View style={styles.logosRow}>
        {/* Visa */}
        <View style={styles.logoBox}>
          <Text style={[styles.visaText, { fontSize: iconSize * 0.5 }]}>VISA</Text>
        </View>

        {/* MasterCard */}
        <View style={styles.logoBox}>
          <View style={styles.mastercardContainer}>
            <View style={[styles.mastercardCircle, styles.mastercardRed, { width: iconSize * 0.55, height: iconSize * 0.55 }]} />
            <View style={[styles.mastercardCircle, styles.mastercardYellow, { width: iconSize * 0.55, height: iconSize * 0.55, marginLeft: -iconSize * 0.2 }]} />
          </View>
        </View>

        {/* iyzico */}
        <View style={styles.logoBox}>
          <View style={styles.iyzicoContainer}>
            <MaterialCommunityIcons name="shield-check" size={iconSize * 0.5} color="#1a73e8" />
            <Text style={[styles.iyzicoText, { fontSize: iconSize * 0.35 }]}>iyzico</Text>
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    backgroundColor: '#F8F9FA',
    borderRadius: 8,
    marginTop: 12,
  },
  label: {
    color: '#666',
    marginBottom: 8,
    fontWeight: '500',
  },
  logosRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
  },
  logoBox: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  visaText: {
    fontWeight: '800',
    color: '#1A1F71',
    fontStyle: 'italic',
    letterSpacing: 1,
  },
  mastercardContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  mastercardCircle: {
    borderRadius: 100,
  },
  mastercardRed: {
    backgroundColor: '#EB001B',
  },
  mastercardYellow: {
    backgroundColor: '#F79E1B',
    opacity: 0.9,
  },
  iyzicoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  iyzicoText: {
    fontWeight: '700',
    color: '#1a73e8',
  },
});

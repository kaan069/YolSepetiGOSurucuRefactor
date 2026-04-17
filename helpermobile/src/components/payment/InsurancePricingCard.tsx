/**
 * InsurancePricingCard
 *
 * Sigortalı işler için backend'den gelen pricing bilgisini gösterir.
 * Backend ne gönderirse onu satır satır gösterir.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { InsurancePricingInfo } from '../../api/types';

interface InsurancePricingCardProps {
  pricing: InsurancePricingInfo;
}

const formatCurrency = (amount: string | number): string => {
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  if (isNaN(num)) return '0';
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export default function InsurancePricingCard({ pricing }: InsurancePricingCardProps) {
  const vatAmount = parseFloat(pricing.total_with_vat) - parseFloat(pricing.total_amount);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="shield-check" size={24} color="#1976D2" />
        <Text style={styles.headerTitle}>Fiyat Detayı</Text>
      </View>

      {/* Temel Fiyat */}
      <View style={styles.row}>
        <Text style={styles.label}>Temel Fiyat</Text>
        <Text style={styles.value}>{formatCurrency(pricing.base_price)} ₺</Text>
      </View>

      {/* Platform Komisyonu */}
      <View style={styles.row}>
        <Text style={styles.label}>Platform Komisyonu</Text>
        <Text style={styles.deductValue}>-{formatCurrency(pricing.platform_commission)} ₺</Text>
      </View>

      {/* Sigorta Komisyonu */}
      <View style={styles.row}>
        <Text style={styles.label}>Sigorta Komisyonu</Text>
        <Text style={styles.deductValue}>-{formatCurrency(pricing.insurance_commission)} ₺</Text>
      </View>

      <View style={styles.divider} />

      {/* KDV Hariç Toplam */}
      <View style={styles.row}>
        <Text style={styles.label}>Ara Toplam (KDV Hariç)</Text>
        <Text style={styles.value}>{formatCurrency(pricing.total_amount)} ₺</Text>
      </View>

      {/* KDV */}
      <View style={styles.row}>
        <Text style={styles.label}>KDV (%{pricing.vat_rate})</Text>
        <Text style={styles.value}>{formatCurrency(vatAmount)} ₺</Text>
      </View>

      <View style={styles.divider} />

      {/* KDV Dahil Toplam */}
      <View style={styles.totalRow}>
        <Text style={styles.totalLabel}>Genel Toplam (KDV Dahil)</Text>
        <Text style={styles.totalValue}>{formatCurrency(pricing.total_with_vat)} ₺</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    gap: 8,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  deductValue: {
    fontSize: 14,
    fontWeight: '500',
    color: '#F44336',
  },
  divider: {
    height: 1,
    backgroundColor: '#E0E0E0',
    marginVertical: 8,
  },
  totalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  totalLabel: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1976D2',
  },
});

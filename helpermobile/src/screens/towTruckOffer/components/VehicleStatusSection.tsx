/**
 * VehicleStatusSection Component
 *
 * Araç durumu ve ek ücretleri gösteren bileşen.
 * Backend'den gelen surcharges listesini dinamik olarak gösterir.
 * Her durum için ek ücret varsa turuncu, yoksa yeşil gösterilir.
 *
 * Örnek durumlar:
 * - Araç yolda mı?
 * - Vites kilitli mi?
 * - Araç saplanmış mı?
 * - Araç yürür durumda mı?
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Surcharge {
  /** Soru metni (örn: "Araç yolda mı?") */
  question: string;
  /** Cevap metni (örn: "Evet" veya "Hayır") */
  answer: string;
  /** Ek ücret miktarı (0 ise ek ücret yok) */
  amount: number;
}

interface VehicleStatusSectionProps {
  /** Backend'den gelen ek ücret listesi */
  surcharges: Surcharge[];
  /** Toplam ek ücret */
  totalSurcharge: number;
}

/**
 * Sayıyı Türkçe formatla (binlik ayracı ile)
 */
const formatNumber = (num: number): string => {
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

export default function VehicleStatusSection({
  surcharges,
  totalSurcharge,
}: VehicleStatusSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  // Surcharges yoksa gösterme
  if (!surcharges || surcharges.length === 0) {
    return null;
  }

  const borderColor = isDarkMode ? '#333' : '#F0F0F0';
  const statusCardBg = isDarkMode ? '#2a2a2a' : '#F9F9F9';
  const warningBadgeBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';
  const totalSurchargeBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';

  return (
    <View style={[styles.section, { backgroundColor: cardBg }]}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={20} color="#26a69a" />
        <Text style={[styles.sectionTitle, { color: appColors.text.primary }]}>Araç Durumu</Text>

        {/* Ek ücret varsa uyarı badge'i */}
        {totalSurcharge > 0 && (
          <View style={[styles.warningBadge, { backgroundColor: warningBadgeBg }]}>
            <MaterialCommunityIcons name="alert" size={14} color="#FF9800" />
            <Text style={styles.warningBadgeText}>Ek durumlar var</Text>
          </View>
        )}
      </View>

      {/* Section Content */}
      <View style={styles.sectionContent}>
        {/* Durum Kartları Grid */}
        <View style={styles.statusGrid}>
          {surcharges.map((surcharge, index) => {
            const hasExtraCharge = surcharge.amount > 0;

            return (
              <View key={index} style={[styles.statusCard, { backgroundColor: statusCardBg }]}>
                <MaterialCommunityIcons
                  name={hasExtraCharge ? 'alert-circle' : 'check-circle'}
                  size={24}
                  color={hasExtraCharge ? '#FF9800' : '#4CAF50'}
                />
                <Text style={[styles.statusLabel, { color: appColors.text.secondary }]} numberOfLines={2}>
                  {surcharge.question}
                </Text>
                <Text
                  style={[styles.statusValue, hasExtraCharge && styles.statusValueWarning]}
                >
                  {surcharge.answer}
                </Text>
                {hasExtraCharge && (
                  <Text style={styles.surchargeAmount}>+₺{formatNumber(surcharge.amount)}</Text>
                )}
              </View>
            );
          })}
        </View>

        {/* Toplam Ek Ücret */}
        {totalSurcharge > 0 && (
          <View style={[styles.totalSurchargeCard, { backgroundColor: totalSurchargeBg }]}>
            <MaterialCommunityIcons name="cash-plus" size={20} color="#E65100" />
            <Text style={styles.totalSurchargeLabel}>Toplam Ek Ücret</Text>
            <Text style={styles.totalSurchargeValue}>+₺{formatNumber(totalSurcharge)}</Text>
          </View>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
  },
  // Warning Badge
  warningBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 'auto',
    gap: 4,
  },
  warningBadgeText: {
    fontSize: 11,
    color: '#E65100',
    fontWeight: '600',
  },
  // Status Grid
  statusGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  statusCard: {
    flex: 1,
    minWidth: '45%',
    borderRadius: 8,
    padding: 12,
    alignItems: 'center',
    gap: 6,
  },
  statusLabel: {
    fontSize: 12,
    fontWeight: '500',
    textAlign: 'center',
  },
  statusValue: {
    fontSize: 13,
    color: '#333',
    fontWeight: '600',
  },
  statusValueWarning: {
    color: '#E65100',
  },
  surchargeAmount: {
    fontSize: 12,
    color: '#E65100',
    fontWeight: '700',
    marginTop: 4,
  },
  // Total Surcharge
  totalSurchargeCard: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: 8,
    padding: 12,
    marginTop: 12,
    gap: 8,
  },
  totalSurchargeLabel: {
    flex: 1,
    fontSize: 14,
    color: '#E65100',
    fontWeight: '500',
  },
  totalSurchargeValue: {
    fontSize: 16,
    color: '#E65100',
    fontWeight: '700',
  },
});

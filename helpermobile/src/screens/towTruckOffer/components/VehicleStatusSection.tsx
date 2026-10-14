/**
 * VehicleStatusSection Component
 *
 * Araç durumu ve ek ücretler. Backend'den gelen surcharges listesini gösterir:
 * ek ücret varsa turuncu uyarı, yoksa yeşil onay.
 * (Araç yolda mı? Vites kilitli mi? Araç saplanmış mı? Yürür durumda mı?)
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { JobSection } from '../../../components/job';
import { FkPill } from '../../../components/fk';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { colors, radius, spacing } from '../../../theme/design';

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

/** Sayıyı Türkçe formatla (binlik ayracı ile) */
const formatNumber = (num: number): string =>
  num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });

export default function VehicleStatusSection({ surcharges, totalSurcharge }: VehicleStatusSectionProps) {
  const { appColors } = useAppTheme();
  if (!surcharges || surcharges.length === 0) return null;

  return (
    <JobSection
      title="Araç Durumu"
      icon="clipboard-check-outline"
      right={totalSurcharge > 0 ? <FkPill icon="alert" label="Ek durumlar var" color="warning" size="sm" /> : undefined}
    >
      <View style={styles.grid}>
        {surcharges.map((surcharge, index) => {
          const hasExtra = surcharge.amount > 0;
          return (
            <View
              key={index}
              style={[
                styles.tile,
                {
                  backgroundColor: hasExtra ? colors.warning[50] : colors.neutral[50],
                  borderColor: hasExtra ? colors.warning[200] : 'transparent',
                },
              ]}
            >
              <MaterialCommunityIcons
                name={hasExtra ? 'alert-circle' : 'check-circle'}
                size={22}
                color={hasExtra ? colors.warning[500] : colors.success[500]}
              />
              <Text style={[styles.question, { color: appColors.text.secondary }]} numberOfLines={2}>
                {surcharge.question}
              </Text>
              <Text style={[styles.answer, { color: hasExtra ? colors.warning[700] : appColors.text.primary }]}>
                {surcharge.answer}
              </Text>
              {hasExtra && <Text style={styles.amount}>+₺{formatNumber(surcharge.amount)}</Text>}
            </View>
          );
        })}
      </View>

      {totalSurcharge > 0 && (
        <View style={styles.total}>
          <MaterialCommunityIcons name="cash-plus" size={20} color={colors.warning[600]} />
          <Text style={styles.totalLabel}>Toplam Ek Ücret</Text>
          <Text style={styles.totalValue}>+₺{formatNumber(totalSurcharge)}</Text>
        </View>
      )}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tile: {
    width: '48.5%',
    flexGrow: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    padding: spacing.sm + 4,
    alignItems: 'center',
    gap: 4,
  },
  question: {
    fontSize: 12,
    textAlign: 'center',
    lineHeight: 16,
  },
  answer: {
    fontSize: 14,
    fontWeight: '700',
  },
  amount: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.warning[700],
  },
  total: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.sm + 4,
    padding: spacing.sm + 4,
    borderRadius: radius.md,
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  totalLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: colors.warning[800],
  },
  totalValue: {
    fontSize: 16,
    fontWeight: '800',
    color: colors.warning[700],
  },
});

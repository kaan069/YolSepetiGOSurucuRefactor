import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { PeriodEarningsResponse, EarningsServiceType } from '../../../api';
import { StatsShimmer } from '../../../components/common/ShimmerPlaceholder';
import { STAT_CARDS, formatMoney } from '../constants';
import ServiceTypeStatCard from './ServiceTypeStatCard';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  periodEarnings: PeriodEarningsResponse | null;
  periodLoading: boolean;
  userServiceTypes: EarningsServiceType[];
}

export default function PeriodStatsCard({
  periodEarnings,
  periodLoading,
  userServiceTypes,
}: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  if (periodLoading) {
    return (
      <View style={[styles.container, { backgroundColor: cardBg }]}>
        <StatsShimmer />
      </View>
    );
  }

  if (!periodEarnings) return null;

  const getEarningsForTypes = (types: EarningsServiceType[]): number =>
    types.reduce((sum, type) => sum + (parseFloat(periodEarnings.by_service_type?.[type]?.earnings || '0')), 0);

  const getJobCountForTypes = (types: EarningsServiceType[]): number =>
    types.reduce((sum, type) => sum + (periodEarnings.by_service_type?.[type]?.job_count || 0), 0);

  const totalEarnings = parseFloat(periodEarnings.total_earnings);

  return (
    <View style={[styles.container, { backgroundColor: cardBg }]}>
      <Text style={[styles.title, { color: appColors.text.primary }]}>{periodEarnings.period} Özeti</Text>

      <View style={[styles.summaryRow, {
        backgroundColor: isDarkMode ? '#1a2e2c' : '#f8fffe',
        borderColor: isDarkMode ? '#2c4a47' : '#e0f2f1',
      }]}>
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: isDarkMode ? appColors.primary[300] : '#004d40' }]}>
            {formatMoney(totalEarnings)} ₺
          </Text>
          <Text style={[styles.summaryLabel, { color: appColors.text.secondary }]}>Toplam Kazanç</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: isDarkMode ? appColors.primary[300] : '#004d40' }]}>
            {periodEarnings.total_jobs}
          </Text>
          <Text style={[styles.summaryLabel, { color: appColors.text.secondary }]}>Toplam İş</Text>
        </View>
        <View style={[styles.summaryDivider, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]} />
        <View style={styles.summaryItem}>
          <Text style={[styles.summaryValue, { color: isDarkMode ? appColors.primary[300] : '#004d40' }]}>
            {periodEarnings.total_jobs > 0 ? formatMoney(totalEarnings / periodEarnings.total_jobs) : '0'} ₺
          </Text>
          <Text style={[styles.summaryLabel, { color: appColors.text.secondary }]}>Ortalama</Text>
        </View>
      </View>

      <View style={styles.grid}>
        {STAT_CARDS.filter(card =>
          userServiceTypes.length === 0 || card.serviceTypes.some(st => userServiceTypes.includes(st))
        ).map((card) => (
          <ServiceTypeStatCard
            key={card.key}
            label={card.label}
            emoji={card.emoji}
            color={card.color}
            bgColor={isDarkMode ? `${card.color}15` : card.bgColor}
            earnings={getEarningsForTypes(card.serviceTypes)}
            jobCount={getJobCountForTypes(card.serviceTypes)}
          />
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 16,
    padding: 18,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 16,
  },
  summaryRow: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
  },
  summaryItem: {
    flex: 1,
    alignItems: 'center',
  },
  summaryValue: {
    fontSize: 15,
    fontWeight: '800',
    marginBottom: 2,
  },
  summaryLabel: {
    fontSize: 10,
    fontWeight: '500',
  },
  summaryDivider: {
    width: 1,
    marginVertical: 2,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
});

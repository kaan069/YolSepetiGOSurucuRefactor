import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { PeriodRange } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { colors, radius, shadows, spacing } from '../../../theme/design';

interface Props {
  range: PeriodRange;
  onRangeChange: (range: PeriodRange) => void;
}

const PERIODS: { value: PeriodRange; label: string }[] = [
  { value: 'today', label: 'Bugün' },
  { value: 'week', label: 'Hafta' },
  { value: 'month', label: 'Ay' },
  { value: 'year', label: 'Yıl' },
];

/** Dönem seçici — İşler sekmesindeki segment kontrolüyle aynı görünüm. */
export default function PeriodSelector({ range, onRangeChange }: Props) {
  const { isDarkMode } = useAppTheme();

  return (
    <View style={[styles.track, { backgroundColor: isDarkMode ? '#2C2C2C' : colors.neutral[100] }]}>
      {PERIODS.map((period) => {
        const isActive = range === period.value;
        return (
          <TouchableOpacity
            key={period.value}
            style={[styles.tab, isActive && [styles.activeTab, { backgroundColor: isDarkMode ? '#1E1E1E' : colors.white }]]}
            onPress={() => onRangeChange(period.value)}
            activeOpacity={0.7}
          >
            <Text
              style={[
                styles.tabText,
                { color: isActive ? (isDarkMode ? colors.neutral[200] : colors.primary[700]) : colors.neutral[500] },
                isActive && styles.activeTabText,
              ]}
            >
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    marginBottom: spacing.md,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: radius.sm + 2,
  },
  activeTab: {
    ...shadows.sm,
  },
  tabText: {
    fontSize: 14,
    fontWeight: '500',
  },
  activeTabText: {
    fontWeight: '700',
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { PeriodRange } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

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

export default function PeriodSelector({ range, onRangeChange }: Props) {
  const { isDarkMode, appColors } = useAppTheme();

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#333333' : '#f0f0f0' }]}>
      {PERIODS.map((period) => {
        const isActive = range === period.value;
        return (
          <TouchableOpacity
            key={period.value}
            style={[styles.tab, isActive && styles.activeTab]}
            onPress={() => onRangeChange(period.value)}
            activeOpacity={0.7}
          >
            <Text style={[styles.tabText, { color: appColors.text.secondary }, isActive && styles.activeTabText]}>
              {period.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    borderRadius: 12,
    padding: 4,
    marginBottom: 16,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderRadius: 10,
  },
  activeTab: {
    backgroundColor: '#00897b',
    elevation: 2,
    shadowColor: '#00897b',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
  },
  activeTabText: {
    color: '#fff',
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Text } from 'react-native-paper';
import { EarningsServiceType } from '../../../api';
import { SERVICE_TYPES } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  selectedServiceTypes: EarningsServiceType[];
  userServiceTypes: EarningsServiceType[];
  onToggle: (serviceType: EarningsServiceType) => void;
  onClear: () => void;
}

export default function ServiceTypeFilter({ selectedServiceTypes, userServiceTypes, onToggle, onClear }: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const visibleTypes = userServiceTypes.length > 0
    ? SERVICE_TYPES.filter(st => userServiceTypes.includes(st.value))
    : SERVICE_TYPES;

  if (visibleTypes.length <= 1) return null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: appColors.text.secondary }]}>Hizmet Filtresi</Text>
        {selectedServiceTypes.length > 0 && (
          <TouchableOpacity onPress={onClear} style={[styles.clearButton, { backgroundColor: isDarkMode ? '#442726' : '#ffebee' }]}>
            <Text style={styles.clearText}>Temizle</Text>
          </TouchableOpacity>
        )}
      </View>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.chipRow}>
        {visibleTypes.map((filter) => {
          const isSelected = selectedServiceTypes.includes(filter.value);
          return (
            <TouchableOpacity
              key={filter.value}
              style={[
                styles.chip,
                { backgroundColor: cardBg, borderColor: appColors.primary[400] },
                isSelected && styles.chipActive,
              ]}
              onPress={() => onToggle(filter.value)}
              activeOpacity={0.7}
            >
              <Text style={styles.chipEmoji}>{filter.emoji}</Text>
              <Text style={[styles.chipLabel, { color: appColors.text.primary }, isSelected && styles.chipLabelActive]}>
                {filter.label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 10,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  clearButton: {
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  clearText: {
    fontSize: 12,
    color: '#D32F2F',
    fontWeight: '600',
  },
  chipRow: {
    gap: 8,
    paddingVertical: 2,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1.5,
    gap: 6,
  },
  chipActive: {
    backgroundColor: '#00897b',
  },
  chipEmoji: {
    fontSize: 14,
  },
  chipLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  chipLabelActive: {
    color: '#fff',
  },
});

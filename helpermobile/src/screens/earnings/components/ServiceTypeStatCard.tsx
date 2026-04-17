import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { formatMoney } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Props {
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
  earnings: number;
  jobCount: number;
}

export default function ServiceTypeStatCard({
  label,
  emoji,
  color,
  bgColor,
  earnings,
  jobCount,
}: Props) {
  const { appColors } = useAppTheme();

  return (
    <View style={[styles.card, { backgroundColor: bgColor }]}>
      <View style={[styles.emojiContainer, { backgroundColor: `${color}20` }]}>
        <Text style={styles.emoji}>{emoji}</Text>
      </View>
      <Text style={[styles.label, { color: appColors.text.secondary }]}>
        {label}
      </Text>
      <Text style={[styles.amount, { color }]}>
        {formatMoney(earnings)} ₺
      </Text>
      <View style={[styles.badge, { backgroundColor: `${color}15` }]}>
        <Text style={[styles.badgeText, { color }]}>
          {jobCount} iş
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    width: '48%',
    padding: 14,
    borderRadius: 14,
  },
  emojiContainer: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  emoji: { fontSize: 18 },
  label: {
    fontSize: 11,
    fontWeight: '500',
    marginBottom: 4,
  },
  amount: {
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 6,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
});

import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated, Text } from 'react-native';
import { OrderStatus } from '../../../lib/types';
import { useSyncedBlink } from '../../../hooks/useSyncedBlink';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { colors, radius, spacing } from '../../../theme/design';

interface MyJobsTabsProps {
  filter: OrderStatus;
  onFilterChange: (filter: OrderStatus) => void;
  visible: boolean;
  hasAwaitingApproval: boolean;
  hasAwaitingPayment: boolean;
  hasInProgress: boolean;
  serviceFilter: 'tow' | 'crane' | 'roadAssistance' | 'nakliye' | 'transfer';
}

/** Benim İşlerim alt durum çipleri. İş bekleyen çip nabız atar (onay/devam: kırmızı, ödeme: turuncu). */
export default function MyJobsTabs({
  filter,
  onFilterChange,
  visible,
  hasAwaitingApproval,
  hasAwaitingPayment,
  hasInProgress,
}: MyJobsTabsProps) {
  const { isDarkMode } = useAppTheme();
  // Global senkronize animasyon - herhangi birinde iş varsa aktif
  const hasAnyActiveJob = hasAwaitingApproval || hasAwaitingPayment || hasInProgress;
  const blinkAnim = useSyncedBlink(hasAnyActiveJob);

  if (!visible) return null;

  const redPulse = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(239, 68, 68, 0.85)', 'rgba(239, 68, 68, 0)'],
  });
  const orangePulse = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(249, 115, 22, 0.85)', 'rgba(249, 115, 22, 0)'],
  });

  const idleBg = isDarkMode ? '#1E1E1E' : colors.white;
  const idleBorder = isDarkMode ? '#444444' : colors.neutral[200];
  const idleText = isDarkMode ? '#E0E0E0' : colors.neutral[700];

  const chips: { value: OrderStatus; label: string; blink: boolean; pulse: Animated.AnimatedInterpolation<string> }[] = [
    { value: 'awaiting_approval', label: 'Onay Bekleyen', blink: hasAwaitingApproval, pulse: redPulse },
    { value: 'awaiting_payment', label: 'Ödeme Bekl.', blink: hasAwaitingPayment, pulse: orangePulse },
    { value: 'in_progress', label: 'Devam Eden', blink: hasInProgress, pulse: redPulse },
  ];

  return (
    <View style={styles.container}>
      {chips.map((chip) => {
        const active = filter === chip.value;
        return (
          <TouchableOpacity
            key={chip.value}
            style={[
              styles.chip,
              active
                ? { backgroundColor: colors.primary[500], borderColor: colors.primary[500] }
                : { backgroundColor: idleBg, borderColor: idleBorder },
            ]}
            onPress={() => onFilterChange(chip.value)}
            activeOpacity={0.8}
          >
            {chip.blink && (
              <Animated.View
                pointerEvents="none"
                style={[StyleSheet.absoluteFillObject, { backgroundColor: chip.pulse }]}
              />
            )}
            <Text style={[styles.chipText, { color: active ? colors.white : idleText }]} numberOfLines={1}>
              {chip.label}
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
    gap: spacing.sm,
    marginTop: spacing.sm + 4,
    marginBottom: spacing.xs,
  },
  chip: {
    flex: 1,
    paddingVertical: 9,
    paddingHorizontal: 8,
    borderRadius: radius.full,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

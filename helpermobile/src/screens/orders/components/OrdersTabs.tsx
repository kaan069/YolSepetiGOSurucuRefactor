import React from 'react';
import { StyleSheet, Animated, View, TouchableOpacity, Text } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useSyncedBlink } from '../../../hooks/useSyncedBlink';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { colors, radius, shadows, spacing } from '../../../theme/design';

interface OrdersTabsProps {
  mainTab: 'incoming' | 'my_jobs';
  onMainTabChange: (tab: 'incoming' | 'my_jobs') => void;
  hasIncoming: boolean;
  hasInProgress: boolean;
  incomingCount: number;
  hasActiveJobs?: boolean; // Benim İşlerim için: awaiting_approval + awaiting_payment + in_progress > 0
}

/** Gelen İşler / Benim İşlerim segment kontrolü. Bekleyen iş varsa ilgili segment kırmızı nabız atar. */
export default function OrdersTabs({
  mainTab,
  onMainTabChange,
  hasIncoming,
  hasInProgress,
  incomingCount,
  hasActiveJobs = false,
}: OrdersTabsProps) {
  const { isDarkMode } = useAppTheme();

  // Global senkronize animasyon
  const blinkAnim = useSyncedBlink(hasActiveJobs || hasIncoming);

  // Gelen İşler için kırmızı nabız (devam eden iş yoksa ve gelen iş varsa)
  const showIncomingBlink = !hasInProgress && hasIncoming;
  // Benim İşlerim için kırmızı nabız
  const showMyJobsBlink = hasActiveJobs;

  const pulseColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(239, 68, 68, 0.85)', 'rgba(239, 68, 68, 0)'],
  });

  const trackBg = isDarkMode ? '#2C2C2C' : colors.neutral[100];
  const activeBg = isDarkMode ? '#1E1E1E' : colors.white;

  const renderTab = (
    value: 'incoming' | 'my_jobs',
    label: string,
    icon: string,
    blink: boolean,
    count?: number,
  ) => {
    const active = mainTab === value;
    const fg = active ? (isDarkMode ? '#E0E0E0' : colors.primary[700]) : isDarkMode ? '#9E9E9E' : colors.neutral[500];
    return (
      <TouchableOpacity
        style={[styles.tab, active && [styles.tabActive, { backgroundColor: activeBg }]]}
        onPress={() => onMainTabChange(value)}
        activeOpacity={0.8}
        accessibilityRole="tab"
        accessibilityState={{ selected: active }}
      >
        {blink && (
          <Animated.View
            pointerEvents="none"
            style={[StyleSheet.absoluteFillObject, styles.pulse, { backgroundColor: pulseColor }]}
          />
        )}
        <MaterialCommunityIcons name={icon} size={18} color={fg} />
        <Text style={[styles.tabText, { color: fg, fontWeight: active ? '700' : '500' }]}>{label}</Text>
        {count !== undefined && count > 0 ? (
          <View style={[styles.count, { backgroundColor: active ? colors.primary[500] : colors.neutral[300] }]}>
            <Text style={styles.countText}>{count}</Text>
          </View>
        ) : null}
      </TouchableOpacity>
    );
  };

  return (
    <View style={[styles.track, { backgroundColor: trackBg }]}>
      {renderTab('incoming', 'Gelen İşler', 'inbox-arrow-down-outline', showIncomingBlink, incomingCount)}
      {renderTab('my_jobs', 'Benim İşlerim', 'clipboard-list-outline', showMyJobsBlink)}
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    flexDirection: 'row',
    borderRadius: radius.md,
    padding: 4,
    marginTop: spacing.sm,
  },
  tab: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingVertical: 10,
    borderRadius: radius.sm + 2,
    overflow: 'hidden',
  },
  tabActive: {
    ...shadows.sm,
  },
  pulse: {
    borderRadius: radius.sm + 2,
  },
  tabText: {
    fontSize: 14,
  },
  count: {
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  countText: {
    color: colors.white,
    fontSize: 11,
    fontWeight: '700',
  },
});

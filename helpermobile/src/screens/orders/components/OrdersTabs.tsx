import React from 'react';
import { SegmentedButtons } from 'react-native-paper';
import { StyleSheet, Animated, View } from 'react-native';
import { useSyncedBlink } from '../../../hooks/useSyncedBlink';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface OrdersTabsProps {
  mainTab: 'incoming' | 'my_jobs';
  onMainTabChange: (tab: 'incoming' | 'my_jobs') => void;
  hasIncoming: boolean;
  hasInProgress: boolean;
  incomingCount: number;
  hasActiveJobs?: boolean; // Benim İşlerim için: awaiting_approval + awaiting_payment + in_progress > 0
}

export default function OrdersTabs({
  mainTab,
  onMainTabChange,
  hasIncoming,
  hasInProgress,
  incomingCount,
  hasActiveJobs = false,
}: OrdersTabsProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const COLORS = {
    primary: '#26a69a',
    primaryDark: '#00897b',
    selectedBg: '#26a69a',
    unselectedBg: isDarkMode ? '#333333' : '#f5f5f5',
    selectedText: '#ffffff',
    unselectedText: isDarkMode ? '#9E9E9E' : '#666666',
    border: isDarkMode ? '#444444' : '#e0e0e0',
  };

  // Global senkronize animasyon
  const blinkAnim = useSyncedBlink(hasActiveJobs || hasIncoming);

  // Gelen İşler için kırmızı overlay (devam eden iş yoksa ve gelen iş varsa)
  const showIncomingBlink = !hasInProgress && hasIncoming;

  // Benim İşlerim için kırmızı overlay
  const showMyJobsBlink = hasActiveJobs;

  const incomingBackgroundColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(244, 67, 54, 0.8)', 'transparent'],
  });

  const myJobsBackgroundColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(239, 68, 68, 0.9)', 'transparent'], // Kırmızı (#EF4444)
  });

  return (
    <View style={styles.container}>
      <SegmentedButtons
        value={mainTab}
        onValueChange={(value) => onMainTabChange(value as 'incoming' | 'my_jobs')}
        buttons={[
          {
            value: 'incoming',
            label: `📥 Gelen İşler${incomingCount > 0 ? ` (${incomingCount})` : ''}`,
            style: mainTab === 'incoming'
              ? { backgroundColor: COLORS.selectedBg, borderColor: COLORS.primaryDark, borderWidth: 2 }
              : { backgroundColor: COLORS.unselectedBg, borderColor: COLORS.border, borderWidth: 1 },
            labelStyle: mainTab === 'incoming'
              ? { color: COLORS.selectedText, fontWeight: '700' as const, fontSize: 14 }
              : { color: COLORS.unselectedText, fontWeight: '500' as const, fontSize: 14 },
            checkedColor: COLORS.selectedText,
            uncheckedColor: COLORS.unselectedText,
          },
          {
            value: 'my_jobs',
            label: '📋 Benim İşlerim',
            style: mainTab === 'my_jobs'
              ? { backgroundColor: COLORS.selectedBg, borderColor: COLORS.primaryDark, borderWidth: 2 }
              : { backgroundColor: COLORS.unselectedBg, borderColor: COLORS.border, borderWidth: 1 },
            labelStyle: mainTab === 'my_jobs'
              ? { color: COLORS.selectedText, fontWeight: '700' as const, fontSize: 14 }
              : { color: COLORS.unselectedText, fontWeight: '500' as const, fontSize: 14 },
            checkedColor: COLORS.selectedText,
            uncheckedColor: COLORS.unselectedText,
          },
        ]}
        style={styles.buttons}
        theme={{
          colors: {
            secondaryContainer: COLORS.selectedBg,
            onSecondaryContainer: COLORS.selectedText,
          },
        }}
      />
      {/* Gelen İşler overlay */}
      {showIncomingBlink && (
        <Animated.View
          style={[
            styles.pulseOverlay,
            styles.leftOverlay,
            {
              backgroundColor: incomingBackgroundColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
      {/* Benim İşlerim overlay - kırmızı yanıp sönme */}
      {showMyJobsBlink && (
        <Animated.View
          style={[
            styles.pulseOverlay,
            styles.rightOverlay,
            {
              backgroundColor: myJobsBackgroundColor,
            },
          ]}
          pointerEvents="none"
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'relative',
  },
  buttons: {
    marginTop: 4,
    marginBottom: 8,
  },
  pulseOverlay: {
    position: 'absolute',
    top: 4,
    bottom: 8,
    borderRadius: 8,
  },
  leftOverlay: {
    left: 0,
    right: '50%',
  },
  rightOverlay: {
    left: '50%',
    right: 0,
  },
});

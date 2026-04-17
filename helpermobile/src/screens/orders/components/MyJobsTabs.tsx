import React from 'react';
import { View, TouchableOpacity, StyleSheet, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { OrderStatus } from '../../../lib/types';
import { useSyncedBlink } from '../../../hooks/useSyncedBlink';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface MyJobsTabsProps {
  filter: OrderStatus;
  onFilterChange: (filter: OrderStatus) => void;
  visible: boolean;
  hasAwaitingApproval: boolean;
  hasAwaitingPayment: boolean;
  hasInProgress: boolean;
  serviceFilter: 'tow' | 'crane' | 'roadAssistance' | 'nakliye' | 'transfer';
}

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

  // Onay Bekleyen için kırmızı overlay
  const awaitingBgColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(239, 68, 68, 0.9)', 'transparent'], // Kırmızı
  });

  // Ödeme Bekl. için mor overlay
  const paymentBgColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(156, 39, 176, 0.8)', 'transparent'], // Mor
  });

  // Devam Eden için kırmızı overlay
  const inProgressBgColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(239, 68, 68, 0.9)', 'transparent'], // Kırmızı
  });

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a2e2c' : '#b2dfdb' }]}>
      {/* Onay Bekleyen */}
      <TouchableOpacity
        style={[
          styles.button,
          filter === 'awaiting_approval' && styles.buttonActive,
        ]}
        onPress={() => onFilterChange('awaiting_approval')}
      >
        {hasAwaitingApproval && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: awaitingBgColor,
                borderRadius: 6,
                zIndex: -1,
              },
            ]}
          />
        )}
        <Text
          style={[
            styles.buttonText,
            { color: isDarkMode ? '#80cbc4' : '#00695c' },
            filter === 'awaiting_approval' && styles.buttonTextActive,
          ]}
        >
          Onay Bekleyen
        </Text>
      </TouchableOpacity>

      {/* Ödeme Bekl. */}
      <TouchableOpacity
        style={[
          styles.button,
          filter === 'awaiting_payment' && styles.buttonActivePayment,
        ]}
        onPress={() => onFilterChange('awaiting_payment')}
      >
        {hasAwaitingPayment && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: paymentBgColor,
                borderRadius: 6,
                zIndex: -1,
              },
            ]}
          />
        )}
        <Text
          style={[
            styles.buttonText,
            { color: isDarkMode ? '#80cbc4' : '#00695c' },
            filter === 'awaiting_payment' && styles.buttonTextActive,
          ]}
        >
          Ödeme Bekl.
        </Text>
      </TouchableOpacity>

      {/* Devam Eden */}
      <TouchableOpacity
        style={[
          styles.button,
          filter === 'in_progress' && styles.buttonActive,
        ]}
        onPress={() => onFilterChange('in_progress')}
      >
        {hasInProgress && (
          <Animated.View
            style={[
              StyleSheet.absoluteFillObject,
              {
                backgroundColor: inProgressBgColor,
                borderRadius: 6,
                zIndex: -1,
              },
            ]}
          />
        )}
        <Text
          style={[
            styles.buttonText,
            { color: isDarkMode ? '#80cbc4' : '#00695c' },
            filter === 'in_progress' && styles.buttonTextActive,
          ]}
        >
          Devam Eden
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 4,
    marginBottom: 8,
    borderRadius: 8,
    padding: 4,
    gap: 4,
  },
  button: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: 'transparent',
    overflow: 'hidden',
    position: 'relative',
  },
  buttonActive: {
    backgroundColor: '#26a69a', // Ana turkuaz (primary.400)
  },
  buttonActivePayment: {
    backgroundColor: '#9C27B0', // Mor - Ödeme Bekleniyor
  },
  buttonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  buttonTextActive: {
    color: '#FFF',
    fontWeight: '600',
  },
});

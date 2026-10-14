import React from 'react';
import { View, StyleSheet, Animated, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { formatCurrency } from './paymentUtils';
import { colors } from '../../../theme/design';

// --- Processing Screen ---
interface ProcessingScreenProps {
  amount: number;
  spin: Animated.AnimatedInterpolation<string>;
}

export function ProcessingScreen({ amount, spin }: ProcessingScreenProps) {
  return (
    <View style={styles.processingContainer}>
      <Animated.View style={[styles.spinnerContainer, { transform: [{ rotate: spin }] }]}>
        <MaterialCommunityIcons name="loading" size={80} color={colors.success[500]} />
      </Animated.View>
      <Text style={styles.processingTitle}>Ödeme Alınıyor</Text>
      <Text style={styles.processingSubtitle}>Lütfen bekleyiniz...</Text>
      <Text style={styles.processingAmount}>{formatCurrency(amount)} TL</Text>
    </View>
  );
}

// --- Success Screen ---
interface SuccessScreenProps {
  amount: number;
  scaleValue: Animated.Value;
  verifyingJobStatus?: boolean;
}

export function SuccessScreen({ amount, scaleValue, verifyingJobStatus }: SuccessScreenProps) {
  const subtitle = verifyingJobStatus ? 'İş başlatılıyor...' : 'Yönlendiriliyorsunuz...';
  return (
    <View style={styles.successContainer}>
      <Animated.View style={[styles.successIcon, { transform: [{ scale: scaleValue }] }]}>
        <MaterialCommunityIcons name="check-circle" size={100} color={colors.success[500]} />
      </Animated.View>
      <Text style={styles.successTitle}>Ödeme Başarılı!</Text>
      <Text style={styles.successSubtitle}>{subtitle}</Text>
      <Text style={styles.successAmount}>{formatCurrency(amount)} TL</Text>
    </View>
  );
}

// --- Failed Screen ---
interface FailedScreenProps {
  errorMessage: string;
  onRetry: () => void;
  onCancel: () => void;
}

export function FailedScreen({ errorMessage, onRetry, onCancel }: FailedScreenProps) {
  return (
    <View style={styles.failedContainer}>
      <View style={styles.failedIcon}>
        <MaterialCommunityIcons name="close-circle" size={100} color={colors.danger[500]} />
      </View>
      <Text style={styles.failedTitle}>Ödeme Başarısız</Text>
      <Text style={styles.failedSubtitle}>{errorMessage || 'Ödeme işlemi tamamlanamadı'}</Text>
      <TouchableOpacity style={styles.retryButton} onPress={onRetry} activeOpacity={0.8}>
        <MaterialCommunityIcons name="refresh" size={20} color={colors.white} />
        <Text style={styles.retryButtonText}>Tekrar Dene</Text>
      </TouchableOpacity>
      <TouchableOpacity style={styles.cancelButton} onPress={onCancel} activeOpacity={0.8}>
        <Text style={styles.cancelButtonText}>Vazgeç</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  // Processing
  processingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  spinnerContainer: {
    marginBottom: 24,
  },
  processingTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.success[500],
    marginBottom: 8,
  },
  processingSubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    marginBottom: 24,
  },
  processingAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  // Success
  successContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
  },
  successIcon: {
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.success[500],
    marginBottom: 8,
  },
  successSubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    marginBottom: 24,
  },
  successAmount: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.neutral[800],
  },
  // Failed
  failedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: colors.neutral[50],
    paddingHorizontal: 32,
  },
  failedIcon: {
    marginBottom: 24,
  },
  failedTitle: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.danger[500],
    marginBottom: 8,
  },
  failedSubtitle: {
    fontSize: 16,
    color: colors.neutral[500],
    marginBottom: 32,
    textAlign: 'center',
    lineHeight: 22,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary[500],
    borderRadius: 16,
    paddingVertical: 16,
    paddingHorizontal: 32,
    gap: 8,
    width: '100%',
    marginBottom: 12,
  },
  retryButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  cancelButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
  },
  cancelButtonText: {
    fontSize: 16,
    color: colors.neutral[500],
  },
});

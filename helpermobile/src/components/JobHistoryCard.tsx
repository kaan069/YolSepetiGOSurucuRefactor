import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { CompletedJob } from '../screens/earnings';
import { useAppTheme } from '../hooks/useAppTheme';
import { colors, shadows } from '../theme/design';

interface Props {
  job: CompletedJob;
  onPress: () => void;
  serviceTypeLabel?: string;
  /** MaterialCommunityIcons adı — servis rozetinde gösterilir */
  serviceTypeIcon?: string;
}

export default function JobHistoryCard({ job, onPress, serviceTypeLabel, serviceTypeIcon }: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();
  const isReferral = job.earningType === 'referral';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={onPress}
      activeOpacity={isReferral ? 1 : 0.7}
      disabled={isReferral}
    >
      <View style={styles.topRow}>
        <View style={styles.idContainer}>
          {isReferral ? (
            <MaterialCommunityIcons name="gift-outline" size={18} color={colors.primary[500]} />
          ) : null}
          <Text style={[styles.idLabel, { color: appColors.text.secondary }]}>
            {isReferral ? 'Referans' : 'İş'}
          </Text>
          <Text style={[styles.idValue, { color: appColors.text.primary }]}>#{job.id}</Text>
        </View>
        {(isReferral || serviceTypeLabel) && (
          <View
            style={[
              styles.typeBadge,
              {
                backgroundColor: isReferral
                  ? (isDarkMode ? '#1f3f3c' : colors.primary[50])
                  : appColors.primary[50],
              },
            ]}
          >
            {!isReferral && serviceTypeIcon ? (
              <MaterialCommunityIcons name={serviceTypeIcon} size={14} color={colors.primary[700]} />
            ) : null}
            <Text style={[styles.typeBadgeText, isReferral && styles.referralBadgeText]}>
              {isReferral ? 'Referans payı' : serviceTypeLabel}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.date, { color: appColors.text.secondary }]}>
        {new Date(job.finishedAt).toLocaleDateString('tr-TR', {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>

      {(job.pickupAddress || job.dropoffAddress) && (
        <View style={styles.addressContainer}>
          {job.pickupAddress && (
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: colors.primary[600] }]} />
              <Text style={[styles.addressText, { color: appColors.text.primary }]} numberOfLines={1}>{job.pickupAddress}</Text>
            </View>
          )}
          {job.pickupAddress && job.dropoffAddress && (
            <View style={[styles.addressConnector, { backgroundColor: isDarkMode ? colors.neutral[700] : colors.neutral[200] }]} />
          )}
          {job.dropoffAddress && (
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: colors.danger[600] }]} />
              <Text style={[styles.addressText, { color: appColors.text.primary }]} numberOfLines={1}>{job.dropoffAddress}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: isDarkMode ? colors.neutral[800] : colors.neutral[100] }]}>
        {job.distanceKm > 0 && (
          <View style={[styles.distanceBadge, { backgroundColor: isDarkMode ? colors.neutral[800] : colors.neutral[100] }]}>
            <Text style={[styles.distanceText, { color: appColors.text.secondary }]}>{job.distanceKm.toFixed(1)} km</Text>
          </View>
        )}
        <Text style={[styles.amount, { color: isDarkMode ? appColors.primary[300] : colors.primary[800] }]}>
          {job.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 12,
    ...shadows.sm,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  idContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  idLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  idValue: {
    fontSize: 14,
    fontWeight: '700',
  },
  typeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 9999,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: colors.primary[600],
  },
  referralBadgeText: {
    color: colors.primary[500],
  },
  date: {
    fontSize: 12,
    marginBottom: 10,
  },
  addressContainer: {
    marginBottom: 10,
    paddingLeft: 2,
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  addressDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  addressConnector: {
    width: 2,
    height: 10,
    marginLeft: 3,
  },
  addressText: {
    fontSize: 13,
    flex: 1,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 10,
    borderTopWidth: 1,
  },
  distanceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 8,
  },
  distanceText: {
    fontSize: 12,
    fontWeight: '600',
  },
  amount: {
    fontSize: 18,
    fontWeight: '800',
  },
});

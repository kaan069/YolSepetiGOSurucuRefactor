import React from 'react';
import { View, TouchableOpacity, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { CompletedJob } from '../screens/earnings';
import { useAppTheme } from '../hooks/useAppTheme';

interface Props {
  job: CompletedJob;
  onPress: () => void;
  serviceTypeLabel?: string;
}

export default function JobHistoryCard({ job, onPress, serviceTypeLabel }: Props) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  return (
    <TouchableOpacity style={[styles.card, { backgroundColor: cardBg }]} onPress={onPress} activeOpacity={0.7}>
      <View style={styles.topRow}>
        <View style={styles.idContainer}>
          <Text style={[styles.idLabel, { color: appColors.text.secondary }]}>İş</Text>
          <Text style={[styles.idValue, { color: appColors.text.primary }]}>#{job.id}</Text>
        </View>
        {serviceTypeLabel && (
          <View style={[styles.typeBadge, { backgroundColor: appColors.primary[50] }]}>
            <Text style={styles.typeBadgeText}>{serviceTypeLabel}</Text>
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
              <View style={[styles.addressDot, { backgroundColor: '#00897b' }]} />
              <Text style={[styles.addressText, { color: appColors.text.primary }]} numberOfLines={1}>{job.pickupAddress}</Text>
            </View>
          )}
          {job.pickupAddress && job.dropoffAddress && (
            <View style={[styles.addressConnector, { backgroundColor: isDarkMode ? '#444' : '#e0e0e0' }]} />
          )}
          {job.dropoffAddress && (
            <View style={styles.addressRow}>
              <View style={[styles.addressDot, { backgroundColor: '#D32F2F' }]} />
              <Text style={[styles.addressText, { color: appColors.text.primary }]} numberOfLines={1}>{job.dropoffAddress}</Text>
            </View>
          )}
        </View>
      )}

      <View style={[styles.footer, { borderTopColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
        {job.distanceKm > 0 && (
          <View style={[styles.distanceBadge, { backgroundColor: isDarkMode ? '#333' : '#f5f5f5' }]}>
            <Text style={[styles.distanceText, { color: appColors.text.secondary }]}>{job.distanceKm.toFixed(1)} km</Text>
          </View>
        )}
        <Text style={[styles.amount, { color: isDarkMode ? appColors.primary[300] : '#004d40' }]}>
          {job.amount.toLocaleString('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ₺
        </Text>
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 14,
    padding: 16,
    marginBottom: 10,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
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
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 10,
  },
  typeBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#00897b',
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

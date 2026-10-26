/**
 * Ana ekranda sürücünün üzerindeki bir iş: hizmet, durum (sağ üst), müşteri adı ve numarası,
 * arama, alış / bırakış konumu butonları. Karta basınca işin detayı açılır.
 * Ödeme bekleyen işte backend müşteri bilgisini maskeler: numara '+905*****', arama ve konum
 * butonları yerine ödeme sonrası açılacağı yazılır.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton, FkIconChip } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import type { HomeJob } from '../../services/homeJobs';
import { SERVICE_ICON, SERVICE_LABEL } from '../../constants/serviceTypeUI';
import { callPhone, openMapsAt } from '../../utils/contactActions';
import { formatSchedule, getScheduleState } from '../../utils/schedule';
import { colors, radius, shadows, spacing, statusColors, text } from '../../theme/design';

interface Props {
  job: HomeJob;
  onOpen: (job: HomeJob) => void;
  style?: StyleProp<ViewStyle>;
}

function statusBadge(job: HomeJob): { label: string; bg: string; fg: string } {
  if (job.kind === 'scheduled') {
    const state = getScheduleState(job.schedule);
    const late = state?.state === 'late';
    return {
      label: state ? `Randevu · ${state.label}` : 'Randevulu',
      bg: late ? colors.danger[100] : colors.info[100],
      fg: late ? colors.danger[700] : colors.info[700],
    };
  }
  if (job.kind === 'awaiting_payment') {
    return { label: 'Ödeme Bekleniyor', bg: statusColors.awaiting_payment.bg, fg: statusColors.awaiting_payment.text };
  }
  return { label: 'Devam Ediyor', bg: statusColors.in_progress.bg, fg: statusColors.in_progress.text };
}

export default function JobShortcutCard({ job, onOpen, style }: Props) {
  const { tokens } = useFkTokens();
  const badge = statusBadge(job);
  // Randevuda tarih, diğerlerinde alış adresi
  const subtitle = job.kind === 'scheduled' ? formatSchedule(job.schedule) : job.pickup?.address;

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: tokens.colors.cardBg, borderColor: tokens.colors.border }, style]}
      activeOpacity={0.9}
      onPress={() => onOpen(job)}
      accessibilityRole="button"
      accessibilityLabel={`${SERVICE_LABEL[job.service]} işinin detayı`}
    >
      <View style={styles.header}>
        <FkIconChip icon={SERVICE_ICON[job.service]} size={36} />
        <View style={styles.headerTexts}>
          <Text style={[styles.service, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
            {SERVICE_LABEL[job.service]}
          </Text>
          {!!subtitle && (
            <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
              {subtitle}
            </Text>
          )}
        </View>
        <View style={[styles.badge, { backgroundColor: badge.bg }]}>
          <Text style={[styles.badgeText, { color: badge.fg }]} numberOfLines={1}>
            {badge.label}
          </Text>
        </View>
      </View>

      <View style={styles.customer}>
        <View style={styles.customerTexts}>
          <Text style={[styles.name, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
            {job.customerName || 'Müşteri'}
          </Text>
          <Text style={[styles.phone, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
            {job.customerPhone || job.customerPhoneMasked || 'Numara henüz paylaşılmadı'}
          </Text>
        </View>
        {!!job.customerPhone && (
          <FkButton size="sm" variant="success" icon="phone" onPress={() => callPhone(job.customerPhone)}>
            Ara
          </FkButton>
        )}
      </View>

      {!job.contactsVisible ? (
        <View style={styles.hiddenNote}>
          <MaterialCommunityIcons name="lock-outline" size={16} color={tokens.colors.textSecondary} />
          <Text style={[styles.hiddenText, { color: tokens.colors.textSecondary }]} numberOfLines={2}>
            Müşteri ödemeyi yapınca tam adres ve numara açılır.
          </Text>
        </View>
      ) : (job.pickup || job.dropoff) && (
        <View style={styles.actions}>
          {job.pickup && (
            <FkButton
              size="sm"
              variant="secondary"
              icon="map-marker-outline"
              style={styles.action}
              onPress={() => openMapsAt(job.pickup?.lat, job.pickup?.lng)}
            >
              {job.dropoff ? 'Alış Konumu' : 'İş Konumu'}
            </FkButton>
          )}
          {job.dropoff && (
            <FkButton
              size="sm"
              variant="secondary"
              icon="flag-checkered"
              style={styles.action}
              onPress={() => openMapsAt(job.dropoff?.lat, job.dropoff?.lng)}
            >
              Bırakış Konumu
            </FkButton>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerTexts: {
    flex: 1,
  },
  service: {
    ...text.cardTitle,
  },
  subtitle: {
    ...text.caption,
    marginTop: 1,
  },
  badge: {
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
    maxWidth: '45%',
  },
  badgeText: {
    ...text.captionStrong,
  },
  customer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  customerTexts: {
    flex: 1,
  },
  name: {
    ...text.bodyStrong,
  },
  phone: {
    ...text.meta,
    marginTop: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
  action: {
    flex: 1,
  },
  hiddenNote: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: 'auto',
    paddingTop: spacing.sm,
  },
  hiddenText: {
    ...text.caption,
    flex: 1,
  },
});

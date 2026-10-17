import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton, FkCard, FkIconChip, FkPill } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import { ColorScale, spacing } from '../../theme/design';
import {
  formatScheduleDate,
  formatScheduleTime,
  getScheduleState,
  ScheduleInfo,
  ScheduleState,
} from '../../utils/schedule';

const STATE_COLOR: Record<ScheduleState, ColorScale> = {
  late: 'danger',
  now: 'warning',
  today: 'warning',
  departed: 'success',
  tomorrow: 'primary',
  upcoming: 'primary',
};

interface Props {
  info: ScheduleInfo;
  /** offer: teklif ekranı (taahhüt notu), job: kabul edilmiş iş */
  context: 'offer' | 'job';
  /** Verilirse ve yola çıkılmadıysa "Yola Çık" butonu gösterilir */
  onDepart?: () => void;
  departing?: boolean;
  style?: StyleProp<ViewStyle>;
}

/**
 * Randevulu talep kartı: tarih, saat aralığı (transferde saat), Bugün / Yarın / Gecikti.
 * Anlık işte hiçbir şey çizmez.
 */
export default function JobScheduleCard({ info, context, onDepart, departing, style }: Props) {
  const { tokens } = useFkTokens();
  if (!info.isScheduled || !info.scheduledAt) return null;

  const state = getScheduleState(info);
  const color = STATE_COLOR[state?.state ?? 'upcoming'];
  const canDepart = !!onDepart && !info.departedAt;

  const note =
    context === 'offer'
      ? 'Teklifiniz kabul edilirse bu tarih ve saatte hizmet vermeniz gerekir.'
      : canDepart
        ? 'Randevu saatinde yola çıktığınızda "Yola Çık"a basın. Müşteriye SMS gider ve konumunuz paylaşılmaya başlar.'
        : null;

  return (
    <FkCard style={[styles.card, style]}>
      <View style={styles.header}>
        <FkIconChip icon="calendar-clock" color={color} size={44} />
        <View style={styles.texts}>
          <Text style={[styles.title, { color: tokens.colors.textSecondary }]}>
            {context === 'offer' ? 'Randevulu Talep' : 'Randevulu İş'}
          </Text>
          <Text style={[styles.date, { color: tokens.colors.textPrimary }]}>{formatScheduleDate(info, true)}</Text>
          <Text style={[styles.time, { color: tokens.colors.textPrimary }]}>{formatScheduleTime(info)}</Text>
        </View>
        {state ? <FkPill label={state.label} color={color} size="sm" /> : null}
      </View>

      {note ? (
        <View style={[styles.noteRow, { borderTopColor: tokens.colors.border }]}>
          <MaterialCommunityIcons name="information-outline" size={16} color={tokens.colors.textSecondary} />
          <Text style={[styles.note, { color: tokens.colors.textSecondary }]}>{note}</Text>
        </View>
      ) : null}

      {canDepart ? (
        <FkButton
          icon="truck-fast-outline"
          onPress={onDepart}
          loading={departing}
          disabled={departing}
          fullWidth
          style={styles.departButton}
        >
          Yola Çık
        </FkButton>
      ) : null}
    </FkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm + 4,
  },
  texts: {
    flex: 1,
  },
  title: {
    fontSize: 13,
    fontWeight: '600',
  },
  date: {
    fontSize: 17,
    fontWeight: '700',
    marginTop: 2,
  },
  time: {
    fontSize: 14,
    marginTop: 2,
  },
  noteRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    marginTop: spacing.sm + 4,
    paddingTop: spacing.sm + 4,
    borderTopWidth: 1,
  },
  note: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
  },
  departButton: {
    marginTop: spacing.md,
  },
});

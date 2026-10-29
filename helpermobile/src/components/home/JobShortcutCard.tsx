/**
 * Ana ekranda sürücünün üzerindeki bir iş (16:9 kart). Karta basınca işin detayı açılır.
 *
 * Üstte duruma göre renkli bant (hizmet + durum rozeti), altında iş akışı adımları
 * (Teklif → Onay → Ödeme → Yolda / Randevu). Gövde aşamaya göre değişir:
 * - Yeni talep (Gelen İşler): güzergâh, ne zaman geldiği ve "İş Detayına Gir" (teklif ekranı).
 * - Onay / ödeme bekleniyor: güzergâh, tahmini kazanç ve ne beklendiği. Bu aşamalarda backend
 *   müşteri bilgisini ve açık adresi maskeler; arama ve konum butonları gösterilmez.
 * - Devam ediyor / randevu: müşteri adı ve numarası, "Ara", alış / bırakış konumu butonları.
 */
import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton } from '../fk';
import { useFkTokens } from '../../hooks/useFkTokens';
import type { HomeJob } from '../../services/homeJobs';
import { SERVICE_ICON, SERVICE_LABEL } from '../../constants/serviceTypeUI';
import { callPhone, openMapsAt } from '../../utils/contactActions';
import { formatSchedule, getScheduleState } from '../../utils/schedule';
import { colors, radius, shadows, spacing, text } from '../../theme/design';

interface Props {
  job: HomeJob;
  onOpen: (job: HomeJob) => void;
  style?: StyleProp<ViewStyle>;
}

type Stage = 'new' | 'approval' | 'payment' | 'appointment' | 'active';

interface StageStyle {
  label: string;
  icon: string;
  solid: string;
  soft: string;
  ink: string;
  /** İş akışında bulunulan adım (0 Teklif, 1 Onay, 2 Ödeme, 3 Yolda / Randevu) */
  step: number;
}

const STAGES: Record<Stage, StageStyle> = {
  new: {
    label: 'Yeni Talep',
    icon: 'bell-ring-outline',
    solid: colors.success[600],
    soft: colors.success[50],
    ink: colors.success[700],
    step: 0,
  },
  approval: {
    label: 'Onay Bekleniyor',
    icon: 'timer-sand',
    solid: colors.warning[500],
    soft: colors.warning[50],
    ink: colors.warning[700],
    step: 1,
  },
  payment: {
    label: 'Ödeme Bekleniyor',
    icon: 'credit-card-clock-outline',
    solid: colors.secondary[500],
    soft: colors.secondary[50],
    ink: colors.secondary[700],
    step: 2,
  },
  appointment: {
    label: 'Randevu',
    icon: 'calendar-clock',
    solid: colors.info[500],
    soft: colors.info[50],
    ink: colors.info[700],
    step: 3,
  },
  active: {
    label: 'Devam Ediyor',
    icon: 'navigation-variant',
    solid: colors.primary[500],
    soft: colors.primary[50],
    ink: colors.primary[700],
    step: 3,
  },
};

const LATE: Pick<StageStyle, 'solid' | 'soft' | 'ink'> = {
  solid: colors.danger[500],
  soft: colors.danger[50],
  ink: colors.danger[700],
};

const NOTES: Partial<Record<Stage, string>> = {
  approval: 'Müşteri teklifini değerlendiriyor.',
  payment: 'Teklifin kabul edildi, müşterinin ödemesi bekleniyor.',
};

function stageOf(job: HomeJob): Stage {
  if (job.status === 'pending') return 'new';
  if (job.status === 'awaiting_approval') return 'approval';
  if (job.status === 'awaiting_payment') return 'payment';
  if (job.schedule.isScheduled && !job.schedule.departedAt) return 'appointment';
  return 'active';
}

function formatAmount(value: number): string {
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} ₺`;
}

/** "5 dk önce geldi" */
function arrivedAgo(createdAt: number): string | null {
  if (!createdAt) return null;
  const minutes = Math.max(0, Math.floor((Date.now() - createdAt) / 60000));
  if (minutes < 1) return 'Az önce geldi';
  if (minutes < 60) return `${minutes} dk önce geldi`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours} sa önce geldi`;
  return `${Math.floor(hours / 24)} gün önce geldi`;
}

export default function JobShortcutCard({ job, onOpen, style }: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const stage = stageOf(job);
  const schedule = job.schedule.isScheduled ? getScheduleState(job.schedule) : null;
  const palette = { ...STAGES[stage], ...(stage === 'appointment' && schedule?.state === 'late' ? LATE : null) };
  const statusLabel = stage === 'appointment' && schedule ? `Randevu · ${schedule.label}` : palette.label;
  const steps = ['Teklif', 'Onay', 'Ödeme', stage === 'appointment' ? 'Randevu' : 'Yolda'];
  const route = [job.pickup?.address, job.dropoff?.address].filter(Boolean).join('  →  ');
  const waiting = stage === 'approval' || stage === 'payment';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: tokens.colors.cardBg, borderColor: tokens.colors.border }, style]}
      activeOpacity={0.9}
      onPress={() => onOpen(job)}
      accessibilityRole="button"
      accessibilityLabel={`${SERVICE_LABEL[job.service]}, ${statusLabel}. İş detayını aç`}
    >
      {/* Durum bandı */}
      <View style={[styles.header, { backgroundColor: isDarkMode ? tokens.colors.surfaceMuted : palette.soft }]}>
        <View style={[styles.serviceIcon, { backgroundColor: isDarkMode ? tokens.colors.cardBg : colors.white }]}>
          <MaterialCommunityIcons name={SERVICE_ICON[job.service]} size={18} color={palette.solid} />
        </View>
        <View style={styles.headerTexts}>
          <Text style={[styles.service, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
            {SERVICE_LABEL[job.service]}
          </Text>
          {job.schedule.isScheduled && (
            <Text style={[styles.headerMeta, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
              {formatSchedule(job.schedule)}
            </Text>
          )}
        </View>
        <View style={[styles.statusPill, { backgroundColor: palette.solid }]}>
          <MaterialCommunityIcons name={palette.icon} size={12} color={colors.white} />
          <Text style={styles.statusText} numberOfLines={1}>
            {statusLabel}
          </Text>
        </View>
      </View>

      {/* İş akışı adımları */}
      <View style={styles.steps}>
        {steps.map((label, index) => {
          const done = index < palette.step;
          const current = index === palette.step;
          const color = done || current ? palette.solid : tokens.colors.border;
          return (
            <React.Fragment key={label}>
              <View style={styles.step}>
                <View
                  style={[
                    styles.stepDot,
                    { borderColor: color, backgroundColor: done ? color : tokens.colors.cardBg },
                  ]}
                >
                  {done ? (
                    <MaterialCommunityIcons name="check" size={9} color={colors.white} />
                  ) : current ? (
                    <View style={[styles.stepCore, { backgroundColor: color }]} />
                  ) : null}
                </View>
                <Text
                  style={[
                    styles.stepLabel,
                    { color: current ? palette.ink : tokens.colors.textSecondary },
                    current && styles.stepLabelCurrent,
                  ]}
                  numberOfLines={1}
                >
                  {label}
                </Text>
              </View>
              {index < steps.length - 1 && (
                <View style={[styles.stepLine, { backgroundColor: index < palette.step ? palette.solid : tokens.colors.border }]} />
              )}
            </React.Fragment>
          );
        })}
      </View>

      {/* Gövde */}
      <View style={styles.body}>
        {stage === 'new' ? (
          <>
            {!!route && (
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color={tokens.colors.textSecondary} />
                <Text style={[styles.route, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
                  {route}
                </Text>
              </View>
            )}
            {!!arrivedAgo(job.createdAt) && (
              <View style={styles.row}>
                <MaterialCommunityIcons name="clock-outline" size={15} color={tokens.colors.textSecondary} />
                <Text style={[styles.route, { color: tokens.colors.textSecondary }]} numberOfLines={1}>
                  {arrivedAgo(job.createdAt)}
                </Text>
              </View>
            )}
            <FkButton
              size="sm"
              icon="arrow-right"
              iconPosition="right"
              fullWidth
              style={styles.cta}
              onPress={() => onOpen(job)}
            >
              İş Detayına Gir
            </FkButton>
          </>
        ) : waiting ? (
          <>
            {!!route && (
              <View style={styles.row}>
                <MaterialCommunityIcons name="map-marker-outline" size={15} color={tokens.colors.textSecondary} />
                <Text style={[styles.route, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
                  {route}
                </Text>
              </View>
            )}
            {job.earnings != null && (
              <View style={[styles.row, styles.earningsRow]}>
                <Text style={[styles.earningsLabel, { color: tokens.colors.textSecondary }]}>Tahmini kazanç</Text>
                <Text style={[styles.earnings, { color: tokens.colors.textPrimary }]}>{formatAmount(job.earnings)}</Text>
              </View>
            )}
            <View style={[styles.note, { backgroundColor: isDarkMode ? tokens.colors.surfaceMuted : palette.soft }]}>
              <MaterialCommunityIcons name={palette.icon} size={14} color={palette.ink} />
              <Text style={[styles.noteText, { color: palette.ink }]} numberOfLines={1}>
                {NOTES[stage]}
              </Text>
            </View>
          </>
        ) : (
          <>
            <View style={styles.row}>
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
            {(job.pickup || job.dropoff) && (
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
          </>
        )}
      </View>
    </TouchableOpacity>
  );
}

const STEP_WIDTH = 52;
const DOT = 14;

const styles = StyleSheet.create({
  card: {
    borderRadius: radius.lg,
    borderWidth: 1,
    overflow: 'hidden',
    ...shadows.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 2,
    paddingHorizontal: spacing.sm + 6,
    paddingVertical: spacing.sm + 1,
  },
  serviceIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTexts: {
    flex: 1,
  },
  service: {
    ...text.cardTitle,
  },
  headerMeta: {
    ...text.caption,
    marginTop: 1,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
    maxWidth: '55%',
  },
  statusText: {
    ...text.captionStrong,
    color: colors.white,
    flexShrink: 1,
  },
  steps: {
    flexDirection: 'row',
    paddingHorizontal: spacing.sm,
    paddingTop: spacing.xs + 2,
  },
  step: {
    width: STEP_WIDTH,
    alignItems: 'center',
  },
  stepDot: {
    width: DOT,
    height: DOT,
    borderRadius: DOT / 2,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepCore: {
    width: 6,
    height: 6,
    borderRadius: 3,
  },
  stepLabel: {
    fontSize: 11,
    marginTop: 3,
  },
  stepLabelCurrent: {
    fontWeight: '700',
  },
  stepLine: {
    flex: 1,
    height: 2,
    marginTop: DOT / 2 - 1,
    // Çizgi noktalara değsin (adım sütunu noktadan geniş)
    marginHorizontal: -(STEP_WIDTH - DOT) / 2,
  },
  body: {
    flex: 1,
    paddingHorizontal: spacing.sm + 6,
    paddingTop: spacing.sm,
    paddingBottom: spacing.sm + 2,
    gap: spacing.xs + 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  route: {
    ...text.meta,
    flex: 1,
  },
  earningsRow: {
    gap: spacing.sm,
  },
  earningsLabel: {
    ...text.caption,
  },
  earnings: {
    ...text.bodyStrong,
    fontSize: 16,
  },
  note: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs + 2,
    marginTop: 'auto',
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
    borderRadius: radius.sm,
  },
  noteText: {
    ...text.captionStrong,
    flex: 1,
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
  },
  action: {
    flex: 1,
  },
  cta: {
    marginTop: 'auto',
  },
});

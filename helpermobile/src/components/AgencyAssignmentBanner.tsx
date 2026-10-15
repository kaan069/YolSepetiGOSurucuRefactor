import React, { useEffect, useState } from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton } from './fk';
import type { AgencyAssignmentState } from '../hooks/useAgencyAssignment';
import { colors, radius, spacing, tint } from '../theme/design';

/** Son bu kadar saniyede geri sayım kırmızıya döner */
const URGENT_SECONDS = 30;

export function formatRemaining(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}

/** expiresAt'e kalan süreyi saniyede bir günceller. */
export function useRemainingMs(expiresAt: string | undefined, active = true): number {
  const target = expiresAt ? new Date(expiresAt).getTime() : NaN;
  const [now, setNow] = useState(Date.now());
  useEffect(() => {
    if (!active || !Number.isFinite(target)) return;
    setNow(Date.now());
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [target, active]);
  return Number.isFinite(target) ? target - now : 0;
}

interface Props {
  agency: AgencyAssignmentState;
  style?: StyleProp<ViewStyle>;
}

/**
 * Teklif ekranlarının üstündeki acente ataması bandı: acente adı, geri sayım, Reddet.
 * Atama yoksa hiçbir şey çizmez. Kabul = aşağıdan teklif göndermek.
 */
export default function AgencyAssignmentBanner({ agency, style }: Props) {
  const { assignment, expired, declining, decline } = agency;
  const remaining = useRemainingMs(assignment?.expiresAt, !!assignment && !expired);

  if (!assignment) return null;

  const urgent = expired || remaining <= URGENT_SECONDS * 1000;
  const t = tint(urgent ? 'danger' : 'primary');

  return (
    <View style={[styles.container, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="account-tie-outline" size={22} color={t.icon} />
        <Text style={[styles.title, { color: t.text }]} numberOfLines={2}>
          {assignment.agencyName} bu işi size atadı
        </Text>
        <View style={[styles.timer, { backgroundColor: t.solid }]}>
          <MaterialCommunityIcons name={expired ? 'timer-off-outline' : 'timer-sand'} size={14} color={colors.white} />
          <Text style={styles.timerText}>{expired ? 'Süre doldu' : formatRemaining(remaining)}</Text>
        </View>
      </View>

      <Text style={[styles.message, { color: t.text }]}>
        {expired
          ? 'Yanıt süresi doldu. Bu iş için artık teklif veremezsiniz.'
          : 'Kabul etmek için aşağıdan teklifinizi gönderin.'}
      </Text>

      {!expired ? (
        <FkButton
          variant="secondary"
          tone="danger"
          size="sm"
          icon="close-circle-outline"
          onPress={decline}
          loading={declining}
          disabled={declining}
          style={styles.decline}
        >
          Reddet
        </FkButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  title: {
    flex: 1,
    fontSize: 15,
    fontWeight: '700',
  },
  timer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: radius.full,
  },
  timerText: {
    color: colors.white,
    fontSize: 13,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  message: {
    fontSize: 13,
    lineHeight: 18,
  },
  decline: {
    alignSelf: 'flex-start',
  },
});

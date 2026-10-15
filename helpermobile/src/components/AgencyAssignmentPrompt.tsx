import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FkButton, FkIconChip, FkModal } from './fk';
import { useAgencyAssignmentStore } from '../store/useAgencyAssignmentStore';
import { navigateByRequestStatus } from '../utils/notificationNavigation';
import { formatRemaining, useRemainingMs } from './AgencyAssignmentBanner';
import { useFkTokens } from '../hooks/useFkTokens';
import { colors, spacing } from '../theme/design';
import { logger } from '../utils/logger';

interface Props {
  navigationRef: React.RefObject<any>;
}

/**
 * Bekleyen acente ataması penceresi: "{acente} size bir iş atadı (#id) · kalan süre".
 * Push ile ya da açılış senkronuyla gelen atamada açılır; sürücü o talebin teklif
 * ekranındaysa gösterilmez (bant zaten orada). "İşi Gör" teklif ekranını açar.
 */
export default function AgencyAssignmentPrompt({ navigationRef }: Props) {
  const { tokens } = useFkTokens();
  const active = useAgencyAssignmentStore((s) => s.active);
  const viewingRequestId = useAgencyAssignmentStore((s) => s.viewingRequestId);
  // Bu oturumda "Sonra" denen ya da açılan atamalar tekrar sorulmaz
  const [dismissed, setDismissed] = useState<Set<number>>(() => new Set());

  const current = useMemo(() => {
    const now = Date.now();
    return Object.entries(active)
      .map(([requestId, a]) => ({ requestId: Number(requestId), ...a }))
      .filter(
        (a) =>
          a.requestId !== viewingRequestId &&
          !dismissed.has(a.assignmentId) &&
          new Date(a.expiresAt).getTime() > now,
      )
      .sort((a, b) => new Date(a.expiresAt).getTime() - new Date(b.expiresAt).getTime())[0];
  }, [active, viewingRequestId, dismissed]);

  const remaining = useRemainingMs(current?.expiresAt, !!current);
  const visible = !!current && remaining > 0;

  if (!current) return null;

  const dismiss = () => setDismissed((prev) => new Set(prev).add(current.assignmentId));

  const openJob = () => {
    dismiss();
    navigateByRequestStatus(navigationRef, current.requestId, current.serviceType, '[AgencyPrompt]').catch((e) =>
      logger.error('navigation', '[AgencyPrompt] navigateByRequestStatus rejected', { message: e?.message }),
    );
  };

  const urgent = remaining <= 30 * 1000;

  return (
    <FkModal visible={visible} onDismiss={dismiss} variant="center" showClose={false}>
      <View style={styles.content}>
        <FkIconChip icon="account-tie-outline" size={64} shape="circle" />
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>Yeni İş Ataması</Text>
        <Text style={[styles.message, { color: tokens.colors.textSecondary }]}>
          {current.agencyName} size bir iş atadı (#{current.requestId}). Kabul etmek için teklifinizi gönderin.
        </Text>
        <Text style={[styles.timer, { color: urgent ? colors.danger[600] : colors.primary[600] }]}>
          Yanıt için {formatRemaining(remaining)}
        </Text>
        <View style={styles.actions}>
          <FkButton variant="secondary" onPress={dismiss} style={styles.action}>
            Sonra
          </FkButton>
          <FkButton icon="arrow-right" iconPosition="right" onPress={openJob} style={styles.action}>
            İşi Gör
          </FkButton>
        </View>
      </View>
    </FkModal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.sm,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
  timer: {
    fontSize: 16,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
    alignSelf: 'stretch',
  },
  action: {
    flex: 1,
  },
});

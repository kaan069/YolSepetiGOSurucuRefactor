import React, { useMemo, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton, FkIconChip, FkModal } from './fk';
import { useAgencyAssignmentStore } from '../store/useAgencyAssignmentStore';
import { navigateByRequestStatus } from '../utils/notificationNavigation';
import { formatRemaining, useRemainingMs } from './AgencyAssignmentBanner';
import { useFkTokens } from '../hooks/useFkTokens';
import { radius, spacing, tint } from '../theme/design';
import { logger } from '../utils/logger';
import { agencyPaidLabel, formatAgreedPrice, isAgencyPaid } from '../utils/agencyPaid';

interface Props {
  navigationRef: React.RefObject<any>;
}

/** Bu genişliğin altında ya da büyük yazı tipinde butonlar alt alta dizilir */
const STACK_BELOW_WIDTH = 360;
const STACK_ABOVE_FONT_SCALE = 1.3;

/**
 * Bekleyen acente ataması penceresi: "{acente} size bir iş atadı (#id) · kalan süre".
 * Push ile ya da açılış senkronuyla gelen atamada açılır; sürücü o talebin teklif
 * ekranındaysa gösterilmez (bant zaten orada). "İşi Gör" teklif ekranını açar.
 * Toplu davet süresizdir: geri sayım gösterilmez.
 */

export default function AgencyAssignmentPrompt({ navigationRef }: Props) {
  const { tokens } = useFkTokens();
  const { width, fontScale } = useWindowDimensions();
  const stacked = width < STACK_BELOW_WIDTH || fontScale > STACK_ABOVE_FONT_SCALE;
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
          (!a.expiresAt || new Date(a.expiresAt).getTime() > now),
      )
      // Süresi yaklaşan önce, süresiz toplu davetler sonda
      .sort(
        (a, b) =>
          (a.expiresAt ? new Date(a.expiresAt).getTime() : Infinity) -
          (b.expiresAt ? new Date(b.expiresAt).getTime() : Infinity),
      )[0];
  }, [active, viewingRequestId, dismissed]);

  const timed = !!current?.expiresAt;
  const remaining = useRemainingMs(current?.expiresAt ?? undefined, timed);
  const visible = !!current && (!timed || remaining > 0);

  if (!current) return null;

  const dismiss = () => setDismissed((prev) => new Set(prev).add(current.assignmentId));

  const openJob = () => {
    dismiss();
    navigateByRequestStatus(navigationRef, current.requestId, current.serviceType, '[AgencyPrompt]').catch((e) =>
      logger.error('navigation', '[AgencyPrompt] navigateByRequestStatus rejected', { message: e?.message }),
    );
  };

  const urgent = remaining <= 30 * 1000;
  const timerTint = tint(urgent ? 'danger' : 'primary');
  const paid = isAgencyPaid(current.payer);
  const broadcast = current.mode === 'broadcast';
  const price = formatAgreedPrice(current.agreedPrice);
  const message = paid
    ? broadcast
      ? ` ekibine ${price ? `${price} ücretli ` : ''}bir iş gönderdi. İlk kabul eden alır.`
      : ` size ${price ? `${price} ücretli ` : ''}bir iş gönderdi.`
    : broadcast
      ? ' bu iş için teklifinizi bekliyor.'
      : ' size bir iş atadı. Kabul etmek için teklifinizi gönderin.';

  // Yan yana: [Sonra][İşi Gör]; alt alta: İşi Gör üstte, Sonra metin butonu
  const actionStyle = stacked ? undefined : styles.rowAction;
  const laterButton = (
    <FkButton variant={stacked ? 'ghost' : 'secondary'} onPress={dismiss} fullWidth={stacked} style={actionStyle}>
      Sonra
    </FkButton>
  );
  const openButton = (
    <FkButton
      icon="arrow-right"
      iconPosition="right"
      onPress={openJob}
      fullWidth={stacked}
      style={actionStyle}
    >
      İşi Gör
    </FkButton>
  );

  return (
    <FkModal visible={visible} onDismiss={dismiss} variant="center" showClose={false}>
      {/* FkModal ortadaki pencerede içeriğe boşluk vermez; kenar boşlukları burada */}
      <View style={styles.content}>
        <FkIconChip icon="account-tie-outline" size={64} shape="circle" />

        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
          {broadcast ? 'Yeni İş Teklifi' : 'Yeni İş Ataması'}
        </Text>

        <Text style={[styles.message, { color: tokens.colors.textSecondary }]}>
          <Text style={[styles.agency, { color: tokens.colors.textPrimary }]}>{current.agencyName}</Text>
          {message}
        </Text>

        <View style={styles.pills}>
          <View style={[styles.pill, { backgroundColor: tokens.colors.surfaceMuted }]}>
            <MaterialCommunityIcons name="file-document-outline" size={14} color={tokens.colors.textSecondary} />
            <Text style={[styles.pillText, { color: tokens.colors.textSecondary }]}>Talep #{current.requestId}</Text>
          </View>
          {paid ? (
            <View style={[styles.pill, { backgroundColor: tokens.colors.surfaceMuted }]}>
              <MaterialCommunityIcons name="cash-check" size={14} color={tokens.colors.textSecondary} />
              <Text style={[styles.pillText, { color: tokens.colors.textSecondary }]}>
                {agencyPaidLabel(current.agreedPrice)}
              </Text>
            </View>
          ) : null}
          {timed ? (
            <View style={[styles.pill, { backgroundColor: timerTint.bg, borderColor: timerTint.border }]}>
              <MaterialCommunityIcons name="timer-sand" size={14} color={timerTint.icon} />
              <Text style={[styles.pillText, styles.timerText, { color: timerTint.text }]}>
                Yanıt için {formatRemaining(remaining)}
              </Text>
            </View>
          ) : null}
        </View>

        {stacked ? (
          <View style={styles.actionsStacked}>
            {openButton}
            {laterButton}
          </View>
        ) : (
          <View style={styles.actionsRow}>
            {laterButton}
            {openButton}
          </View>
        )}
      </View>
    </FkModal>
  );
}

const styles = StyleSheet.create({
  content: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg + 4,
    paddingBottom: spacing.lg,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginTop: spacing.md,
  },
  message: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginTop: spacing.sm,
  },
  agency: {
    fontWeight: '700',
  },
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: 6,
    borderRadius: radius.full,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
  },
  timerText: {
    fontVariant: ['tabular-nums'],
  },
  actionsRow: {
    flexDirection: 'row',
    gap: spacing.sm + 4,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
  rowAction: {
    flex: 1,
  },
  actionsStacked: {
    gap: spacing.sm,
    marginTop: spacing.lg,
    alignSelf: 'stretch',
  },
});

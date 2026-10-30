import React from 'react';
import { StyleSheet, View } from 'react-native';
import { FkButton, FkStickyFooter } from './fk';
import type { AgencyAssignmentState } from '../hooks/useAgencyAssignment';
import { spacing } from '../theme/design';

interface Props {
  agency: AgencyAssignmentState;
  onAccept: () => void;
  /** Kabul isteği sürüyor */
  loading: boolean;
  /** Ek kilit (ör. araç seçilmedi) */
  disabled?: boolean;
}

/** Acente ödemeli işin alt alanı: fiyat sabit olduğu için teklif yerine Reddet / Kabul et. */
export default function AgencyPaidFooter({ agency, onAccept, loading, disabled }: Props) {
  const locked = loading || agency.declining || agency.expired;
  return (
    <FkStickyFooter safeArea={false}>
      <View style={styles.row}>
        {agency.assignment ? (
          <FkButton
            variant="secondary"
            tone="danger"
            size="lg"
            icon="close-circle-outline"
            onPress={agency.decline}
            loading={agency.declining}
            disabled={locked}
            style={styles.action}
          >
            Reddet
          </FkButton>
        ) : null}
        <FkButton
          size="lg"
          icon="check-circle-outline"
          onPress={onAccept}
          loading={loading}
          disabled={locked || !!disabled}
          style={styles.action}
        >
          Kabul et
        </FkButton>
      </View>
    </FkStickyFooter>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  action: {
    flex: 1,
  },
});

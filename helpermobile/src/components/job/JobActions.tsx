import React from 'react';
import { StyleProp, StyleSheet, View, ViewStyle } from 'react-native';
import { FkButton } from '../fk';
import { spacing } from '../../theme/design';

interface ActionConfig {
  onPress: () => void;
  loading?: boolean;
  label?: string;
}

interface Props {
  /** "Teklifi Geri Çek" (turuncu çerçeve) — verilmezse gösterilmez */
  withdraw?: ActionConfig | false | null;
  /** "İşi İptal Et" (kırmızı çerçeve) — verilmezse gösterilmez */
  cancel?: ActionConfig | false | null;
  style?: StyleProp<ViewStyle>;
}

/**
 * İş detayının altındaki ikincil aksiyonlar. Mantık ekranda kalır, bu bileşen yalnızca görünümdür.
 */
export default function JobActions({ withdraw, cancel, style }: Props) {
  if (!withdraw && !cancel) return null;
  return (
    <View style={[styles.container, style]}>
      {withdraw ? (
        <FkButton
          variant="secondary"
          tone="warning"
          icon="undo"
          fullWidth
          loading={withdraw.loading}
          disabled={withdraw.loading}
          onPress={withdraw.onPress}
        >
          {withdraw.label ?? 'Teklifi Geri Çek'}
        </FkButton>
      ) : null}
      {cancel ? (
        <FkButton
          variant="secondary"
          tone="danger"
          icon="cancel"
          fullWidth
          loading={cancel.loading}
          onPress={cancel.onPress}
        >
          {cancel.label ?? 'İşi İptal Et'}
        </FkButton>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm + 4,
    marginBottom: spacing.md,
  },
});

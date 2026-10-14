/**
 * RequestHeader Component
 *
 * Çekici talebi ekranının üst kısmında talep numarasını gösteren bileşen.
 * Talep ID'sini 4 haneli formatta gösterir (örn: #0231)
 */
import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { FkCard, FkIconChip, FkStatusBadge } from '../../../components/fk';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { spacing, text } from '../../../theme/design';

interface RequestHeaderProps {
  /** Talep ID numarası */
  requestId: number;
}

export default function RequestHeader({ requestId }: RequestHeaderProps) {
  const { appColors } = useAppTheme();
  // ID'yi 4 haneli formata çevir (örn: 231 -> 0231)
  const formattedId = requestId.toString().padStart(4, '0');

  return (
    <FkCard style={styles.card}>
      <View style={styles.row}>
        <FkIconChip icon="tow-truck" size={44} />
        <View style={styles.texts}>
          <Text style={[styles.title, { color: appColors.text.primary }]}>Çekici Talebi</Text>
          <Text style={[styles.caption, { color: appColors.text.secondary }]}>Talep #{formattedId}</Text>
        </View>
        <FkStatusBadge status="pending" label="Gelen İş" size="sm" />
      </View>
    </FkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm + 4,
  },
  texts: {
    flex: 1,
  },
  title: {
    ...text.cardTitle,
  },
  caption: {
    ...text.caption,
    marginTop: 2,
  },
});

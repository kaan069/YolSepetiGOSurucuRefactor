/**
 * DescriptionSection Component
 *
 * Müşterinin çekici talebi oluştururken eklediği serbest-metin "Ek Bilgiler"
 * (description) notunu gösteren bileşen. Not boş/undefined ise hiç gösterilmez.
 */
import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { JobSection } from '../../../components/job';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface DescriptionSectionProps {
  /** Müşterinin eklediği açıklama / ek bilgiler (opsiyonel) */
  description?: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  const { appColors } = useAppTheme();
  if (!description?.trim()) return null;
  return (
    <JobSection title="Ek Bilgiler" icon="information-outline">
      <Text style={[styles.text, { color: appColors.text.primary }]}>{description.trim()}</Text>
    </JobSection>
  );
}

const styles = StyleSheet.create({
  text: {
    fontSize: 14,
    lineHeight: 21,
  },
});

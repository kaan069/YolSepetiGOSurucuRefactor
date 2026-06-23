/**
 * DescriptionSection Component
 *
 * Müşterinin çekici talebi oluştururken eklediği serbest-metin "Ek Bilgiler"
 * (description) notunu gösteren bileşen. Müşteri araç/durum hakkında bir açıklama
 * yazmışsa, sürücü teklif vermeden önce bu notu görür.
 *
 * Not boş/undefined ise hiç gösterilmez (null döner) — boş kart oluşmaz.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface DescriptionSectionProps {
  /** Müşterinin eklediği açıklama / ek bilgiler (opsiyonel) */
  description?: string;
}

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  // Not boşsa hiç gösterme
  if (!description?.trim()) {
    return null;
  }

  const borderColor = isDarkMode ? '#333' : '#F0F0F0';

  return (
    <View style={[styles.section, { backgroundColor: cardBg }]}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
        <MaterialCommunityIcons name="information-outline" size={20} color="#26a69a" />
        <Text style={[styles.sectionTitle, { color: appColors.text.primary }]}>Ek Bilgiler</Text>
      </View>

      {/* Section Content */}
      <View style={styles.sectionContent}>
        <Text style={[styles.descriptionText, { color: appColors.text.primary }]}>
          {description.trim()}
        </Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    marginHorizontal: 12,
    marginVertical: 6,
    borderRadius: 12,
    overflow: 'hidden',
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  sectionContent: {
    padding: 16,
  },
  descriptionText: {
    fontSize: 15,
    lineHeight: 22,
  },
});

/**
 * ExtraEquipmentSection Component
 *
 * Ekstra ekipman bilgilerini gösteren bileşen.
 * Araçta ek ekipman varsa (has_extra_attachments=true) gösterilir.
 * Ekipman tipleri chip olarak listelenir.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface ExtraEquipmentSectionProps {
  /** Ekstra ekipman var mı? */
  hasExtraAttachments: boolean;
  /** Ekipman tipleri listesi */
  attachmentTypes?: string[];
}

export default function ExtraEquipmentSection({
  hasExtraAttachments,
  attachmentTypes,
}: ExtraEquipmentSectionProps) {
  // Ekstra ekipman yoksa gösterme
  if (!hasExtraAttachments) {
    return null;
  }

  return (
    <View style={styles.section}>
      {/* Section Header */}
      <View style={styles.sectionHeader}>
        <MaterialCommunityIcons name="toolbox-outline" size={20} color="#26a69a" />
        <Text style={styles.sectionTitle}>Ekstra Ekipmanlar</Text>
      </View>

      {/* Section Content */}
      <View style={styles.sectionContent}>
        {attachmentTypes && attachmentTypes.length > 0 ? (
          <View style={styles.chipContainer}>
            {attachmentTypes.map((attachment, index) => (
              <View key={index} style={styles.chip}>
                <Text style={styles.chipText}>{attachment}</Text>
              </View>
            ))}
          </View>
        ) : (
          <Text style={styles.emptyText}>Ekipman bilgisi belirtilmemiş</Text>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  section: {
    backgroundColor: '#fff',
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
    borderBottomColor: '#F0F0F0',
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
  },
  sectionContent: {
    padding: 16,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chip: {
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderWidth: 1,
    borderColor: '#E0E0E0',
  },
  chipText: {
    fontSize: 13,
    color: '#333',
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    color: '#999',
    fontStyle: 'italic',
  },
});

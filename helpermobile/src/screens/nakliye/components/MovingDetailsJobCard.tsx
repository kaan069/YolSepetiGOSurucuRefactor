// Nakliye detayları kartı - Nakliye iş detayı
// Backend response alanları:
// Evden Eve: home_type, floor_from, floor_to, has_elevator_from, has_elevator_to,
//            has_large_items, large_items_note, has_fragile_items, needs_packing, needs_disassembly,
//            preferred_date, preferred_time_slot, additional_notes
// Şehirler Arası: load_type, load_weight, width, length, height,
//                 preferred_date, preferred_time_slot, additional_notes
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Chip } from 'react-native-paper';
import { useAppTheme } from '../../../hooks/useAppTheme';

// Ev tipi çevirisi
const HOME_TYPE_LABELS: Record<string, string> = {
  'studio': 'Stüdyo',
  '1+1': '1+1',
  '2+1': '2+1',
  '3+1': '3+1',
  '4+1': '4+1',
  '5+1': '5+1 ve üzeri',
  'villa': 'Villa',
  'office': 'Ofis',
};

interface MovingDetailsJobCardProps {
  isHomeMoving: boolean;
  // Evden Eve alanları
  homeType?: string;
  floorFrom?: number;
  floorTo?: number;
  hasElevatorFrom?: boolean;
  hasElevatorTo?: boolean;
  hasLargeItems?: boolean;
  largeItemsNote?: string;
  hasFragileItems?: boolean;
  needsPacking?: boolean;
  needsDisassembly?: boolean;
  // Şehirler Arası alanları
  loadType?: string;
  loadWeight?: number;
  width?: number;
  length?: number;
  height?: number;
  // Ortak alanlar
  preferredDate?: string;
  preferredTimeSlot?: string;
  additionalNotes?: string;
  visible: boolean;
}

export default function MovingDetailsJobCard({
  isHomeMoving,
  homeType,
  floorFrom,
  floorTo,
  hasElevatorFrom,
  hasElevatorTo,
  hasLargeItems,
  largeItemsNote,
  hasFragileItems,
  needsPacking,
  needsDisassembly,
  loadType,
  loadWeight,
  width,
  length,
  height,
  preferredDate,
  preferredTimeSlot,
  additionalNotes,
  visible,
}: MovingDetailsJobCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  if (!visible) return null;

  const homeTypeLabel = homeType ? (HOME_TYPE_LABELS[homeType] || homeType) : null;

  const containerBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';
  const noteBoxBg = isDarkMode ? '#0d2137' : '#e3f2fd';
  const noteBoxColor = isDarkMode ? '#90CAF9' : '#1976d2';
  const notesContainerBg = isDarkMode ? '#2a2200' : '#fff8e1';
  const chipBg = isDarkMode ? '#1a2e1a' : '#e8f5e9';
  const chipWarningBg = isDarkMode ? '#2a0a0a' : '#ffebee';

  return (
    <Card style={styles.card}>
      <Card.Title title="Nakliye Detayları" titleStyle={styles.title} />
      <Card.Content>
        <View style={[styles.container, { backgroundColor: containerBg }]}>
          {isHomeMoving ? (
            <>
              {/* Ev Tipi */}
              {homeTypeLabel && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: appColors.text.secondary }]}>Ev Tipi:</Text>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>{homeTypeLabel}</Text>
                </View>
              )}
              {/* Kat Bilgileri */}
              {floorFrom !== undefined && floorFrom !== null && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: appColors.text.secondary }]}>Alış Katı:</Text>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>
                    {floorFrom}. kat {hasElevatorFrom ? '(Asansör var)' : '(Asansör yok)'}
                  </Text>
                </View>
              )}
              {floorTo !== undefined && floorTo !== null && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: appColors.text.secondary }]}>Teslim Katı:</Text>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>
                    {floorTo}. kat {hasElevatorTo ? '(Asansör var)' : '(Asansör yok)'}
                  </Text>
                </View>
              )}
              {/* Özel Durumlar */}
              <View style={styles.chipsContainer}>
                {hasLargeItems && (
                  <Chip icon="sofa" style={[styles.chip, { backgroundColor: chipBg }]} textStyle={styles.chipText}>
                    Büyük Eşya
                  </Chip>
                )}
                {hasFragileItems && (
                  <Chip icon="glass-fragile" style={[styles.chipWarning, { backgroundColor: chipWarningBg }]} textStyle={styles.chipText}>
                    Kırılacak Eşya
                  </Chip>
                )}
                {needsPacking && (
                  <Chip icon="package-variant-closed" style={[styles.chip, { backgroundColor: chipBg }]} textStyle={styles.chipText}>
                    Paketleme
                  </Chip>
                )}
                {needsDisassembly && (
                  <Chip icon="wrench" style={[styles.chip, { backgroundColor: chipBg }]} textStyle={styles.chipText}>
                    Demontaj
                  </Chip>
                )}
              </View>
              {/* Büyük eşya notu */}
              {hasLargeItems && largeItemsNote && (
                <View style={[styles.noteBox, { backgroundColor: noteBoxBg }]}>
                  <Text style={[styles.noteLabel, { color: noteBoxColor }]}>Büyük Eşya Detayı:</Text>
                  <Text style={[styles.noteText, { color: appColors.text.primary }]}>{largeItemsNote}</Text>
                </View>
              )}
            </>
          ) : (
            <>
              {/* Şehirler Arası - Yük Bilgileri */}
              {loadType && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: appColors.text.secondary }]}>Yük Türü:</Text>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>{loadType}</Text>
                </View>
              )}
              {loadWeight && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: appColors.text.secondary }]}>Yük Ağırlığı:</Text>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>{loadWeight} kg</Text>
                </View>
              )}
              {/* Boyutlar */}
              {(width || length || height) && (
                <View style={styles.row}>
                  <Text style={[styles.label, { color: appColors.text.secondary }]}>Boyutlar:</Text>
                  <Text style={[styles.value, { color: appColors.text.primary }]}>
                    {width || '-'} x {length || '-'} x {height || '-'} cm
                  </Text>
                </View>
              )}
            </>
          )}

          {/* Ortak Alanlar */}
          {preferredDate && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Tercih Edilen Tarih:</Text>
              <Text style={[styles.value, { color: appColors.text.primary }]}>{preferredDate}</Text>
            </View>
          )}
          {preferredTimeSlot && (
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Tercih Edilen Saat:</Text>
              <Text style={[styles.value, { color: appColors.text.primary }]}>{preferredTimeSlot}</Text>
            </View>
          )}
          {additionalNotes && (
            <View style={[styles.notesContainer, { backgroundColor: notesContainerBg }]}>
              <Text style={[styles.noteLabel, { color: appColors.text.secondary }]}>Müşteri Notu:</Text>
              <Text style={[styles.noteText, { color: appColors.text.primary }]}>{additionalNotes}</Text>
            </View>
          )}
        </View>
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
  },
  container: {
    padding: 16,
    borderRadius: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
  },
  value: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
    textAlign: 'right',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  chip: {},
  chipWarning: {},
  chipText: {
    fontSize: 12,
  },
  noteBox: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    marginTop: 4,
  },
  notesContainer: {
    marginTop: 12,
    padding: 10,
    borderRadius: 8,
  },
});

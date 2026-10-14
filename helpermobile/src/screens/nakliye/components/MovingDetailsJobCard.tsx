// Nakliye detayları kartı - Nakliye iş detayı
// Backend response alanları:
// Evden Eve: home_type, floor_from, floor_to, has_elevator_from, has_elevator_to,
//            has_large_items, large_items_note, has_fragile_items, needs_packing, needs_disassembly,
//            preferred_date, preferred_time_slot, additional_notes
// Şehirler Arası: load_type, load_weight, width, length, height,
//                 preferred_date, preferred_time_slot, additional_notes
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { InfoRow, JobSection } from '../../../components/job';
import { FkInfoBanner, FkPill } from '../../../components/fk';
import { spacing } from '../../../theme/design';

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

// Backend sayısal alanları (floor_from, load_weight, width vb.) string olarak
// da dönebildiği için prop tipleri `number | string` ile gevşetildi. <Text>
// içinde her iki tip de güvenle render edilir.
interface MovingDetailsJobCardProps {
  isHomeMoving: boolean;
  // Evden Eve alanları
  homeType?: string;
  floorFrom?: number | string;
  floorTo?: number | string;
  hasElevatorFrom?: boolean;
  hasElevatorTo?: boolean;
  hasLargeItems?: boolean;
  largeItemsNote?: string;
  hasFragileItems?: boolean;
  needsPacking?: boolean;
  needsDisassembly?: boolean;
  // Şehirler Arası alanları
  loadType?: string;
  loadWeight?: number | string;
  width?: number | string;
  length?: number | string;
  height?: number | string;
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
  if (!visible) return null;

  const homeTypeLabel = homeType ? (HOME_TYPE_LABELS[homeType] || homeType) : null;
  const rows: { icon: string; label: string; value: string }[] = [];

  if (isHomeMoving) {
    if (homeTypeLabel) rows.push({ icon: 'home-outline', label: 'Ev Tipi', value: homeTypeLabel });
    if (floorFrom !== undefined && floorFrom !== null) {
      rows.push({
        icon: 'stairs-up',
        label: 'Alış Katı',
        value: `${floorFrom}. kat ${hasElevatorFrom ? '(Asansör var)' : '(Asansör yok)'}`,
      });
    }
    if (floorTo !== undefined && floorTo !== null) {
      rows.push({
        icon: 'stairs-down',
        label: 'Teslim Katı',
        value: `${floorTo}. kat ${hasElevatorTo ? '(Asansör var)' : '(Asansör yok)'}`,
      });
    }
  } else {
    if (loadType) rows.push({ icon: 'package-variant-closed', label: 'Yük Türü', value: loadType });
    if (loadWeight) rows.push({ icon: 'weight-kilogram', label: 'Yük Ağırlığı', value: `${loadWeight} kg` });
    if (width || length || height) {
      rows.push({ icon: 'ruler-square', label: 'Boyutlar', value: `${width || '-'} x ${length || '-'} x ${height || '-'} cm` });
    }
  }
  if (preferredDate) rows.push({ icon: 'calendar-outline', label: 'Tercih Edilen Tarih', value: preferredDate });
  if (preferredTimeSlot) rows.push({ icon: 'clock-outline', label: 'Tercih Edilen Saat', value: preferredTimeSlot });

  const pills = isHomeMoving
    ? [
        hasLargeItems && { icon: 'sofa-outline', label: 'Büyük Eşya', color: 'info' as const },
        hasFragileItems && { icon: 'glass-fragile', label: 'Kırılacak Eşya', color: 'danger' as const },
        needsPacking && { icon: 'package-variant-closed', label: 'Paketleme', color: 'warning' as const },
        needsDisassembly && { icon: 'wrench-outline', label: 'Demontaj', color: 'warning' as const },
      ].filter(Boolean) as { icon: string; label: string; color: 'info' | 'danger' | 'warning' }[]
    : [];

  return (
    <JobSection title="Nakliye Detayları" icon="truck-delivery-outline">
      {rows.map((r, i) => (
        <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} divider={i < rows.length - 1} />
      ))}

      {pills.length > 0 && (
        <View style={styles.pills}>
          {pills.map((p) => (
            <FkPill key={p.label} icon={p.icon} label={p.label} color={p.color} />
          ))}
        </View>
      )}

      {isHomeMoving && hasLargeItems && largeItemsNote ? (
        <FkInfoBanner type="info" icon="sofa-outline" title="Büyük Eşya Detayı" message={largeItemsNote} style={styles.block} />
      ) : null}

      {additionalNotes ? (
        <FkInfoBanner type="neutral" icon="note-text-outline" title="Müşteri Notu" message={additionalNotes} style={styles.block} />
      ) : null}
    </JobSection>
  );
}

const styles = StyleSheet.create({
  pills: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  block: {
    marginTop: spacing.sm + 4,
  },
});

// Taşınma detayları kartı - Evden eve nakliye
// Backend response alanları: home_type, has_large_items, large_items_note, has_fragile_items,
// needs_packing, needs_disassembly, preferred_date, preferred_time_slot, additional_notes
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { InfoRow, JobSection } from '../../../components/job';
import { FkInfoBanner, FkPill } from '../../../components/fk';
import { spacing } from '../../../theme/design';

interface MovingDetailsCardProps {
  // Backend alanları
  homeType?: string;
  hasLargeItems?: boolean;
  largeItemsNote?: string;
  hasFragileItems?: boolean;
  needsPacking?: boolean;
  needsDisassembly?: boolean;
  preferredDate?: string;
  preferredTimeSlot?: string;
  additionalNotes?: string;
  // Hesaplanan
  distanceToPickup?: number | null;
}

// Saat dilimi çevirisi
const TIME_SLOT_LABELS: Record<string, string> = {
  'morning': 'Sabah (07:00 - 12:00)',
  'afternoon': 'Öğleden Sonra (12:00 - 17:00)',
  'evening': 'Akşam (17:00 - 21:00)',
  'flexible': 'Esnek',
};

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

export default function MovingDetailsCard({
  homeType,
  hasLargeItems,
  largeItemsNote,
  hasFragileItems,
  needsPacking,
  needsDisassembly,
  preferredDate,
  preferredTimeSlot,
  additionalNotes,
  distanceToPickup,
}: MovingDetailsCardProps) {
  const homeTypeLabel = homeType ? (HOME_TYPE_LABELS[homeType] || homeType) : null;
  const rows: { icon: string; label: string; value: string }[] = [];
  if (homeTypeLabel) rows.push({ icon: 'home-outline', label: 'Ev Tipi', value: homeTypeLabel });
  if (preferredDate) rows.push({ icon: 'calendar-outline', label: 'Tercih Edilen Tarih', value: preferredDate });
  if (preferredTimeSlot) {
    rows.push({
      icon: 'clock-outline',
      label: 'Tercih Edilen Saat',
      value: TIME_SLOT_LABELS[preferredTimeSlot] || preferredTimeSlot,
    });
  }
  if (distanceToPickup !== null && distanceToPickup !== undefined) {
    rows.push({ icon: 'map-marker-distance', label: 'Müşteriye uzaklığınız', value: `${distanceToPickup.toFixed(1)} km` });
  }

  return (
    <JobSection title="Taşınma Detayları" icon="package-variant">
      {rows.map((r, i) => (
        <InfoRow key={r.label} icon={r.icon} label={r.label} value={r.value} divider={i < rows.length - 1} />
      ))}

      {(hasLargeItems || hasFragileItems) && (
        <View style={styles.pills}>
          {hasLargeItems && <FkPill icon="sofa-outline" label="Büyük Eşya Var" color="info" />}
          {hasFragileItems && <FkPill icon="glass-fragile" label="Kırılacak Eşya" color="danger" />}
        </View>
      )}

      {(needsPacking || needsDisassembly) && (
        <FkInfoBanner
          type="warning"
          icon="cash-plus"
          title="Fiyatı Artıracak İşler"
          message={[needsPacking && 'Paketleme isteniyor', needsDisassembly && 'Demontaj isteniyor']
            .filter(Boolean)
            .join(' · ')}
          style={styles.block}
        />
      )}

      {hasLargeItems && largeItemsNote ? (
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

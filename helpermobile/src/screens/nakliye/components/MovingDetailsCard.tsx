// Taşınma detayları kartı - Evden eve nakliye
// Backend response alanları: home_type, has_large_items, large_items_note, has_fragile_items,
// needs_packing, needs_disassembly, preferred_date, preferred_time_slot, additional_notes
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

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

  return (
    <Card style={styles.card}>
      <Card.Content>
        <View style={styles.header}>
          <MaterialCommunityIcons name="package-variant" size={24} color="#26a69a" />
          <Text variant="titleMedium" style={styles.title}>Taşınma Detayları</Text>
        </View>
        <Divider style={styles.divider} />

        {/* Ev Tipi */}
        {homeTypeLabel && (
          <View style={styles.row}>
            <Text style={styles.label}>Ev Tipi:</Text>
            <Text style={styles.value}>{homeTypeLabel}</Text>
          </View>
        )}

        {/* Tercih edilen tarih ve saat */}
        {preferredDate && (
          <View style={styles.row}>
            <Text style={styles.label}>Tercih Edilen Tarih:</Text>
            <Text style={styles.value}>{preferredDate}</Text>
          </View>
        )}

        {preferredTimeSlot && (
          <View style={styles.row}>
            <Text style={styles.label}>Tercih Edilen Saat:</Text>
            <Text style={styles.value}>{TIME_SLOT_LABELS[preferredTimeSlot] || preferredTimeSlot}</Text>
          </View>
        )}

        {/* Özel Durumlar - Chip'ler */}
        <View style={styles.chipsContainer}>
          {hasLargeItems && (
            <Chip icon="sofa" style={styles.chip} textStyle={styles.chipText}>
              Büyük Eşya Var
            </Chip>
          )}
          {hasFragileItems && (
            <Chip icon="glass-fragile" style={styles.chipWarning} textStyle={styles.chipText}>
              Kırılacak Eşya
            </Chip>
          )}
        </View>

        {/* Fiyatı Artıracak İşler */}
        {(needsPacking || needsDisassembly) && (
          <View style={styles.extraServicesBox}>
            <View style={styles.extraServicesHeader}>
              <MaterialCommunityIcons name="currency-try" size={18} color="#e65100" />
              <Text style={styles.extraServicesTitle}>Fiyatı Artıracak İşler</Text>
            </View>
            {needsPacking && (
              <View style={styles.extraServiceRow}>
                <MaterialCommunityIcons name="package-variant-closed" size={18} color="#e65100" />
                <Text style={styles.extraServiceText}>Paketleme İsteniyor</Text>
              </View>
            )}
            {needsDisassembly && (
              <View style={styles.extraServiceRow}>
                <MaterialCommunityIcons name="wrench" size={18} color="#e65100" />
                <Text style={styles.extraServiceText}>Demontaj İsteniyor</Text>
              </View>
            )}
          </View>
        )}

        {/* Büyük eşya notu */}
        {hasLargeItems && largeItemsNote && (
          <View style={styles.noteBox}>
            <Text style={styles.noteLabel}>Büyük Eşya Detayı:</Text>
            <Text style={styles.noteText}>{largeItemsNote}</Text>
          </View>
        )}

        {/* Ek notlar */}
        {additionalNotes && (
          <View style={styles.notesContainer}>
            <Text style={styles.label}>Müşteri Notu:</Text>
            <Text style={styles.notesText}>{additionalNotes}</Text>
          </View>
        )}

        {/* Müşteriye uzaklık */}
        {distanceToPickup !== null && distanceToPickup !== undefined && (
          <View style={styles.distanceRow}>
            <MaterialCommunityIcons name="map-marker-distance" size={20} color="#666" />
            <Text style={styles.distanceText}>
              Müşteriye uzaklığınız: {distanceToPickup.toFixed(1)} km
            </Text>
          </View>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  title: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#333',
  },
  divider: {
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
  },
  label: {
    fontSize: 14,
    color: '#666',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
    color: '#333',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
    gap: 8,
  },
  chip: {
    backgroundColor: '#e8f5e9',
  },
  chipWarning: {
    backgroundColor: '#fff3e0',
  },
  chipText: {
    fontSize: 12,
  },
  extraServicesBox: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#fff3e0',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ffe0b2',
  },
  extraServicesHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    gap: 6,
  },
  extraServicesTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#e65100',
  },
  extraServiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 8,
  },
  extraServiceText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#bf360c',
  },
  noteBox: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#e3f2fd',
    borderRadius: 8,
  },
  noteLabel: {
    fontSize: 12,
    color: '#1976d2',
    fontWeight: '600',
  },
  noteText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  notesContainer: {
    marginTop: 12,
    padding: 10,
    backgroundColor: '#fff8e1',
    borderRadius: 8,
  },
  notesText: {
    fontSize: 14,
    color: '#333',
    marginTop: 4,
  },
  distanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  distanceText: {
    marginLeft: 8,
    fontSize: 14,
    color: '#666',
  },
});

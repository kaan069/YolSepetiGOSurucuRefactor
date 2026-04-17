// Problem detayları kartı
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Card, Text, Divider } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { getProblemLabel, getProblemIcon, getVehicleTypeLabel } from '../constants';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface ProblemDetailsCardProps {
  vehicleType?: string;
  problemTypes?: string[];
  problemDescription?: string;
  additionalNotes?: string;
}

export default function ProblemDetailsCard({
  vehicleType,
  problemTypes,
  problemDescription,
  additionalNotes,
}: ProblemDetailsCardProps) {
  const { isDarkMode, appColors } = useAppTheme();

  const chipBg = isDarkMode ? '#2a1f0e' : '#FFF3E0';
  const chipTextColor = isDarkMode ? '#FFB74D' : '#e65100';
  const descriptionBg = isDarkMode ? '#2a2a2a' : '#f9f9f9';

  return (
    <Card style={styles.card}>
      <Card.Title
        title="Problem Detayları"
        subtitle="Müşterinin bildirdiği sorun"
        left={() => <MaterialCommunityIcons name="car-wrench" size={24} color="#f44336" />}
      />
      <Card.Content>
        {/* Araç Tipi */}
        {vehicleType && (
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Araç Tipi:</Text>
              <Text style={[styles.value, { color: appColors.text.primary }]}>{getVehicleTypeLabel(vehicleType)}</Text>
            </View>
            <Divider style={styles.divider} />
          </>
        )}

        {/* Problem Tipleri */}
        <View style={styles.row}>
          <Text style={[styles.label, { color: appColors.text.secondary }]}>Sorun Türü:</Text>
        </View>
        <View style={styles.chipsContainer}>
          {problemTypes && problemTypes.length > 0 ? (
            problemTypes.map((type, index) => (
              <View key={index} style={[styles.chip, { backgroundColor: chipBg }]}>
                <MaterialCommunityIcons
                  name={getProblemIcon(type) as any}
                  size={16}
                  color="#f57c00"
                />
                <Text style={[styles.chipText, { color: chipTextColor }]}>{getProblemLabel(type)}</Text>
              </View>
            ))
          ) : (
            <Text style={[styles.emptyText, { color: appColors.text.disabled }]}>Belirtilmemiş</Text>
          )}
        </View>
        <Divider style={styles.divider} />

        {/* Problem Açıklaması */}
        {problemDescription && (
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Açıklama:</Text>
            </View>
            <Text style={[styles.description, { color: appColors.text.primary, backgroundColor: descriptionBg }]}>{problemDescription}</Text>
            <Divider style={styles.divider} />
          </>
        )}

        {/* Ek Notlar */}
        {additionalNotes && (
          <>
            <View style={styles.row}>
              <Text style={[styles.label, { color: appColors.text.secondary }]}>Ek Notlar:</Text>
            </View>
            <Text style={[styles.description, { color: appColors.text.primary, backgroundColor: descriptionBg }]}>{additionalNotes}</Text>
          </>
        )}
      </Card.Content>
    </Card>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: 16,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
  },
  value: {
    fontSize: 14,
    fontWeight: '500',
  },
  divider: {
    marginVertical: 12,
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginTop: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 20,
    gap: 6,
    borderWidth: 1,
    borderColor: '#f57c00',
  },
  chipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  emptyText: {
    fontSize: 14,
    fontStyle: 'italic',
  },
  description: {
    fontSize: 14,
    lineHeight: 20,
    marginTop: 4,
    padding: 12,
    borderRadius: 8,
  },
});

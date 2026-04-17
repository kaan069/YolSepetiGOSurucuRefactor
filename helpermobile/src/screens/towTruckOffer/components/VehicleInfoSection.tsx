/**
 * VehicleInfoSection Component
 *
 * Çekilecek aracın bilgilerini gösteren bileşen.
 * Araç tipi (otomobil, SUV, kamyon vb.) gösterilir.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface VehicleInfoSectionProps {
  /** Araç tipi (car, suv, truck, motorcycle vb.) */
  vehicleType: string;
}

// Araç tipi İngilizce -> Türkçe çevirisi
const vehicleTypeMap: Record<string, string> = {
  car: 'Otomobil',
  suv: 'SUV',
  truck: 'Kamyon',
  motorcycle: 'Motosiklet',
  string: 'Belirtilmemiş',
};

export default function VehicleInfoSection({ vehicleType }: VehicleInfoSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();

  const displayType = vehicleTypeMap[vehicleType] || vehicleType;
  const iconCircleBg = isDarkMode ? '#2a2a2a' : '#F5F5F5';
  const borderColor = isDarkMode ? '#333' : '#F0F0F0';

  return (
    <View style={[styles.section, { backgroundColor: cardBg }]}>
      {/* Section Header */}
      <View style={[styles.sectionHeader, { borderBottomColor: borderColor }]}>
        <MaterialCommunityIcons name="car-info" size={20} color="#26a69a" />
        <Text style={[styles.sectionTitle, { color: appColors.text.primary }]}>Araç Bilgileri</Text>
      </View>

      {/* Section Content */}
      <View style={styles.sectionContent}>
        <View style={styles.infoRow}>
          <View style={[styles.iconCircle, { backgroundColor: iconCircleBg }]}>
            <MaterialCommunityIcons name="car" size={18} color="#26a69a" />
          </View>
          <View style={styles.infoTextContainer}>
            <Text style={[styles.infoLabel, { color: appColors.text.disabled }]}>Araç Tipi</Text>
            <Text style={[styles.infoValue, { color: appColors.text.primary }]}>{displayType}</Text>
          </View>
        </View>
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
  infoRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  iconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  infoTextContainer: {
    flex: 1,
  },
  infoLabel: {
    fontSize: 12,
    marginBottom: 4,
    textTransform: 'uppercase',
  },
  infoValue: {
    fontSize: 15,
    fontWeight: '500',
    lineHeight: 20,
  },
});

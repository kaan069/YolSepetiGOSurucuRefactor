import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ServiceFilterType } from '../hooks/useOrdersData';
import { useSyncedBlink } from '../../../hooks/useSyncedBlink';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { SERVICE_ICON } from '../../../constants/serviceTypeUI';
import { colors, radius, spacing } from '../../../theme/design';

interface ServiceTypeTabsProps {
  serviceTypes: ServiceFilterType[];
  selectedType: ServiceFilterType;
  onTypeChange: (type: ServiceFilterType) => void;
  hasActiveJobs?: boolean; // Seçili buton için pulse animasyonu
}

const SERVICE_INFO: Record<ServiceFilterType, { label: string; icon: string }> = {
  tow: { label: 'Çekici', icon: SERVICE_ICON.towTruck },
  crane: { label: 'Vinç', icon: SERVICE_ICON.crane },
  roadAssistance: { label: 'Yol Yardım', icon: SERVICE_ICON.roadAssistance },
  nakliye: { label: 'Nakliye', icon: SERVICE_ICON.nakliye },
  transfer: { label: 'Transfer', icon: SERVICE_ICON.transfer },
};

/** Hizmet türü filtre çipleri (müşteri uygulamasındaki filtre çipleri). */
export default function ServiceTypeTabs({
  serviceTypes,
  selectedType,
  onTypeChange,
  hasActiveJobs = false,
}: ServiceTypeTabsProps) {
  const { isDarkMode } = useAppTheme();
  // Global senkronize animasyon
  const blinkAnim = useSyncedBlink(hasActiveJobs);

  if (serviceTypes.length <= 1) {
    return null;
  }

  // Seçili çip, aktif iş varken açık ↔ koyu ana renk arasında nabız atar
  const selectedBgColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: [colors.primary[300], colors.primary[500]],
  });

  const idleBg = isDarkMode ? '#2C2C2C' : colors.neutral[100];
  const idleText = isDarkMode ? '#E0E0E0' : colors.neutral[700];

  return (
    <ScrollView
      horizontal
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.container}
    >
      {serviceTypes.map((type) => {
        const info = SERVICE_INFO[type] || { label: type, icon: 'help-circle' };
        const isSelected = selectedType === type;

        return (
          <TouchableOpacity key={type} onPress={() => onTypeChange(type)} activeOpacity={0.7}>
            <Animated.View
              style={[
                styles.chip,
                { backgroundColor: idleBg },
                isSelected && { backgroundColor: hasActiveJobs ? selectedBgColor : colors.primary[500] },
              ]}
            >
              <MaterialCommunityIcons
                name={info.icon}
                size={18}
                color={isSelected ? colors.white : colors.primary[500]}
              />
              <Animated.Text style={[styles.chipText, { color: isSelected ? colors.white : idleText }]}>
                {info.label}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    gap: spacing.sm,
    paddingVertical: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: radius.full,
    gap: 6,
  },
  chipText: {
    fontSize: 13,
    fontWeight: '600',
  },
});

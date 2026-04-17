import React from 'react';
import { StyleSheet, View, TouchableOpacity, Animated } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ServiceFilterType } from '../hooks/useOrdersData';
import { useSyncedBlink } from '../../../hooks/useSyncedBlink';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface ServiceTypeTabsProps {
  serviceTypes: ServiceFilterType[];
  selectedType: ServiceFilterType;
  onTypeChange: (type: ServiceFilterType) => void;
  hasActiveJobs?: boolean; // Seçili buton için pulse animasyonu
}

const SERVICE_INFO: Record<ServiceFilterType, { label: string; icon: string }> = {
  tow: { label: 'Çekici', icon: 'tow-truck' },
  crane: { label: 'Vinç', icon: 'crane' },
  roadAssistance: { label: 'Yol Yardım', icon: 'car-wrench' },
  nakliye: { label: 'Nakliye', icon: 'truck-delivery' },
  transfer: { label: 'Transfer', icon: 'bus' },
};

export default function ServiceTypeTabs({
  serviceTypes,
  selectedType,
  onTypeChange,
  hasActiveJobs = false,
}: ServiceTypeTabsProps) {
  const { isDarkMode, appColors } = useAppTheme();
  // Global senkronize animasyon
  const blinkAnim = useSyncedBlink(hasActiveJobs);

  if (serviceTypes.length <= 1) {
    return null;
  }

  // Seçili buton için arka plan rengi interpolasyonu
  // Normal: transparent -> Seçili: #26a69a (yeşil)
  // Pulse modunda: açık yeşil <-> koyu yeşil arası gidip gelir
  const selectedBgColor = blinkAnim.interpolate({
    inputRange: [0.3, 1],
    outputRange: ['rgba(38, 166, 154, 0.5)', '#26a69a'],
  });

  return (
    <View style={[styles.container, { backgroundColor: isDarkMode ? '#1a2e2c' : '#e0f2f1' }]}>
      {serviceTypes.map((type) => {
        const info = SERVICE_INFO[type] || { label: type, icon: 'help-circle' };
        const isSelected = selectedType === type;

        return (
          <TouchableOpacity
            key={type}
            style={styles.tab}
            onPress={() => onTypeChange(type)}
            activeOpacity={0.7}
          >
            <Animated.View
              style={[
                styles.tabInner,
                isSelected && hasActiveJobs && { backgroundColor: selectedBgColor },
                isSelected && !hasActiveJobs && styles.tabSelected,
              ]}
            >
              <MaterialCommunityIcons
                name={info.icon}
                size={20}
                color={isSelected ? '#fff' : isDarkMode ? '#80cbc4' : '#26a69a'}
              />
              <Animated.Text
                style={[
                  styles.tabText,
                  { color: isDarkMode ? '#80cbc4' : '#26a69a' },
                  isSelected && styles.tabTextSelected,
                ]}
              >
                {info.label}
              </Animated.Text>
            </Animated.View>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    marginTop: 8,
    marginBottom: 8,
    borderRadius: 12,
    padding: 4,
  },
  tab: {
    flex: 1,
  },
  tabInner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    gap: 6,
  },
  tabSelected: {
    backgroundColor: '#26a69a',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3,
  },
  tabText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#26a69a',
  },
  tabTextSelected: {
    color: '#fff',
  },
});

import React from 'react';
import { View, StyleSheet, TouchableOpacity, Linking, Platform, Alert } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TowTruckRequestDetail } from '../../../api';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface QuickActionsProps {
  towTruckRequest: TowTruckRequestDetail;
  visible: boolean;
  onNavigatePickup: () => void;
  onNavigateDropoff: () => void;
}

export default function QuickActions({
  towTruckRequest,
  visible,
  onNavigatePickup,
  onNavigateDropoff,
}: QuickActionsProps) {
  const { isDarkMode, cardBg } = useAppTheme();

  if (!visible) return null;

  const handleCall = async () => {
    if (!towTruckRequest.requestOwnerPhone) return;

    try {
      const cleanPhone = towTruckRequest.requestOwnerPhone.replace(/[^0-9+]/g, '');
      const phoneUrl = `tel:${cleanPhone}`;

      // Platform kontrolü - iOS simülatörde çalışmaz
      if (Platform.OS === 'ios' && !Platform.isPad && Platform.isTVOS === false) {
        const supported = await Linking.canOpenURL(phoneUrl);
        if (!supported) {
          Alert.alert(
            'Uyarı',
            'Telefon araması bu cihazda desteklenmiyor. iOS simülatörde telefon araması yapılamaz.',
            [{ text: 'Tamam' }]
          );
          return;
        }
      }

      await Linking.openURL(phoneUrl);
    } catch (error) {
      console.error('Telefon arama hatası:', error);
      Alert.alert(
        'Hata',
        'Telefon uygulaması açılamadı. Lütfen telefon numarasını manuel olarak arayın: ' + towTruckRequest.requestOwnerPhone,
        [{ text: 'Tamam' }]
      );
    }
  };

  const buttonBg = isDarkMode ? '#2a2a2a' : '#f5f5f5';
  const textColor = isDarkMode ? '#e0e0e0' : '#333';

  return (
    <View style={[styles.quickActions, { backgroundColor: cardBg }]}>
      {towTruckRequest.requestOwnerPhone && (
        <TouchableOpacity style={[styles.actionButton, { backgroundColor: buttonBg }]} onPress={handleCall}>
          <MaterialCommunityIcons name="phone" size={24} color="#4CAF50" />
          <Text style={[styles.actionButtonText, { color: textColor }]}>Ara</Text>
        </TouchableOpacity>
      )}
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: buttonBg }]} onPress={onNavigatePickup}>
        <MaterialCommunityIcons name="navigation" size={24} color="#26a69a" />
        <Text style={[styles.actionButtonText, { color: textColor }]}>Müşteri Konumu</Text>
      </TouchableOpacity>
      <TouchableOpacity style={[styles.actionButton, { backgroundColor: buttonBg }]} onPress={onNavigateDropoff}>
        <MaterialCommunityIcons name="map-marker-check" size={24} color="#FF9800" />
        <Text style={[styles.actionButtonText, { color: textColor }]}>Teslim</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  quickActions: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    marginBottom: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    borderRadius: 12,
    gap: 4,
  },
  actionButtonText: {
    fontSize: 12,
    fontWeight: '600',
    marginTop: 4,
  },
});

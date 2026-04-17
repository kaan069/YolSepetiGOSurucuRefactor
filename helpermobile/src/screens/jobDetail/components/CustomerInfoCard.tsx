import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { TowTruckRequestDetail } from '../../../api';
import CollapsibleCard from '../../../components/common/CollapsibleCard';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface CustomerInfoCardProps {
  towTruckRequest: TowTruckRequestDetail;
  visible: boolean;
}

export default function CustomerInfoCard({ towTruckRequest, visible }: CustomerInfoCardProps) {
  const { appColors } = useAppTheme();

  if (!visible) return null;
  if (!towTruckRequest.requestOwnerNameSurname && !towTruckRequest.requestOwnerPhone) return null;

  return (
    <CollapsibleCard
      title="Müşteri Bilgileri"
      icon="account"
      iconColor="#4CAF50"
      defaultExpanded={false}
    >
      {towTruckRequest.requestOwnerNameSurname && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="account-circle" size={20} color="#666" />
          <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>İsim:</Text>
          <Text style={[styles.infoValue, { color: appColors.text.primary }]}>{towTruckRequest.requestOwnerNameSurname}</Text>
        </View>
      )}
      {towTruckRequest.requestOwnerPhone && (
        <View style={styles.infoRow}>
          <MaterialCommunityIcons name="phone" size={20} color="#666" />
          <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>Telefon:</Text>
          <Text style={[styles.infoValue, { color: appColors.text.primary }]}>{towTruckRequest.requestOwnerPhone}</Text>
        </View>
      )}
    </CollapsibleCard>
  );
}

const styles = StyleSheet.create({
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    gap: 12,
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '600',
    minWidth: 80,
  },
  infoValue: {
    fontSize: 14,
    flex: 1,
  },
});

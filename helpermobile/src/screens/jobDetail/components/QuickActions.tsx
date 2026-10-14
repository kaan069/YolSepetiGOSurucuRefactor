import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { TowTruckRequestDetail } from '../../../api';
import { FkCard, FkIconChip } from '../../../components/fk';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { callPhone } from '../../../utils/contactActions';
import { ColorScale, spacing } from '../../../theme/design';

interface QuickActionsProps {
  towTruckRequest: TowTruckRequestDetail;
  visible: boolean;
  onNavigatePickup: () => void;
  onNavigateDropoff: () => void;
}

/** Hızlı aksiyonlar: müşteriyi ara, alış ve teslim noktasına yol tarifi. */
export default function QuickActions({ towTruckRequest, visible, onNavigatePickup, onNavigateDropoff }: QuickActionsProps) {
  const { appColors } = useAppTheme();
  if (!visible) return null;

  const action = (icon: string, label: string, color: ColorScale, onPress: () => void) => (
    <TouchableOpacity style={styles.action} onPress={onPress} activeOpacity={0.7}>
      <FkIconChip icon={icon} color={color} size={48} shape="circle" />
      <Text style={[styles.label, { color: appColors.text.primary }]} numberOfLines={1}>
        {label}
      </Text>
    </TouchableOpacity>
  );

  return (
    <FkCard style={styles.card}>
      <View style={styles.row}>
        {towTruckRequest.requestOwnerPhone
          ? action('phone', 'Ara', 'success', () => callPhone(towTruckRequest.requestOwnerPhone))
          : null}
        {action('navigation-variant-outline', 'Müşteri Konumu', 'primary', onNavigatePickup)}
        {action('map-marker-check-outline', 'Teslim', 'danger', onNavigateDropoff)}
      </View>
    </FkCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  action: {
    flex: 1,
    alignItems: 'center',
    gap: 6,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
  },
});

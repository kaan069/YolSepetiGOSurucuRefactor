/**
 * VehicleStatusChip
 *
 * Araç onay durumunu gösteren chip + opsiyonel red sebebi notu.
 * Backend `verification_status` alanı: 'pending' | 'approved' | 'rejected'
 * Alan yoksa (undefined/null) hiçbir şey render edilmez — eski araçlar veya
 * status alanı dönmeyen endpoint'ler için sessiz davranır.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Chip, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export type VehicleVerificationStatus = 'pending' | 'approved' | 'rejected';

interface Props {
  status?: VehicleVerificationStatus | null;
  rejectionReason?: string | null;
  /** Chip'i daha küçük göster (vehicle list satırında) */
  compact?: boolean;
}

const CONFIG: Record<VehicleVerificationStatus, {
  label: string;
  icon: string;
  bg: string;
  fg: string;
  border: string;
}> = {
  approved: {
    label: 'Onaylandı',
    icon: 'check-circle',
    bg: '#e8f5e9',
    fg: '#2e7d32',
    border: '#a5d6a7',
  },
  pending: {
    label: 'Onay Bekliyor',
    icon: 'clock-outline',
    bg: '#fff8e1',
    fg: '#ef6c00',
    border: '#ffcc80',
  },
  rejected: {
    label: 'Reddedildi',
    icon: 'close-circle',
    bg: '#ffebee',
    fg: '#c62828',
    border: '#ef9a9a',
  },
};

export default function VehicleStatusChip({ status, rejectionReason, compact = true }: Props) {
  if (!status) return null;
  const cfg = CONFIG[status];
  if (!cfg) return null;

  return (
    <View style={styles.container}>
      <Chip
        compact={compact}
        icon={() => <MaterialCommunityIcons name={cfg.icon} size={14} color={cfg.fg} />}
        style={[styles.chip, { backgroundColor: cfg.bg, borderColor: cfg.border, borderWidth: 1 }]}
        textStyle={[styles.chipText, { color: cfg.fg }]}
      >
        {cfg.label}
      </Chip>
      {status === 'rejected' && !!rejectionReason && (
        <Text style={styles.reasonText} numberOfLines={2}>
          Red sebebi: {rejectionReason}
        </Text>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginTop: 6,
    flexDirection: 'column',
    alignItems: 'flex-start',
  },
  chip: {
    alignSelf: 'flex-start',
  },
  chipText: {
    fontSize: 11,
    fontWeight: '600',
    marginVertical: -2,
  },
  reasonText: {
    fontSize: 11,
    color: '#c62828',
    fontStyle: 'italic',
    marginTop: 4,
    paddingLeft: 4,
  },
});

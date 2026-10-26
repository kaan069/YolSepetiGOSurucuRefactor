/**
 * Ana ekranda talep özeti: açık talepler, müşteri onayı bekleyen teklifler ve randevulu işler.
 * Sayılar /requests/all-counts/ (useJobCountsStore) — iş kutusu yenilenirken gelir, ek istek yok.
 * Yalnızca sürücünün verdiği hizmetler toplanır.
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { useJobCountsStore } from '../../store/useJobCountsStore';
import { SCHEDULABLE_SERVICES } from '../../screens/orders/hooks/useUserServiceTypes';
import type { ServiceFilterType } from '../../screens/orders/hooks/useOrdersData';
import { colors, radius, shadows, spacing, text } from '../../theme/design';

type CountKey = 'pending' | 'awaiting_approval' | 'scheduled';

interface Props {
  /** Sürücünün hizmetleri (boşsa hepsi sayılır) */
  services: ServiceFilterType[];
  /** Sayılar en az bir kez geldi mi (gelmediyse "–") */
  ready: boolean;
  onOpenOrders: (serviceFilter: ServiceFilterType, filter: 'pending' | 'awaiting_approval') => void;
  onOpenScheduled: () => void;
}

const ALL_SERVICES: ServiceFilterType[] = ['tow', 'crane', 'nakliye', 'roadAssistance', 'transfer'];

export default function RequestSummary({ services, ready, onOpenOrders, onOpenScheduled }: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const serviceCounts = useJobCountsStore((s) => s.serviceCounts);
  const scheduledSupported = useJobCountsStore((s) => s.scheduledSupported);

  const scope = services.length > 0 ? services : ALL_SERVICES;
  const total = (key: CountKey) => scope.reduce((sum, service) => sum + (serviceCounts[service][key] ?? 0), 0);
  // Dokununca sayısı olan ilk hizmetin sekmesi açılır
  const serviceWith = (key: CountKey) => scope.find((service) => (serviceCounts[service][key] ?? 0) > 0) ?? scope[0];
  const showScheduled = scheduledSupported && scope.some((service) => SCHEDULABLE_SERVICES.includes(service));

  const tiles: { key: CountKey; label: string; icon: string; onPress: () => void }[] = [
    { key: 'pending', label: 'Açık talep', icon: 'bell-ring-outline', onPress: () => onOpenOrders(serviceWith('pending'), 'pending') },
    {
      key: 'awaiting_approval',
      label: 'Onay bekleyen teklif',
      icon: 'timer-sand',
      onPress: () => onOpenOrders(serviceWith('awaiting_approval'), 'awaiting_approval'),
    },
  ];
  if (showScheduled) {
    tiles.push({ key: 'scheduled', label: 'Randevulu iş', icon: 'calendar-clock', onPress: onOpenScheduled });
  }

  return (
    <View style={styles.row}>
      {tiles.map((tile) => {
        const value = ready ? total(tile.key) : null;
        const highlighted = !!value;
        return (
          <TouchableOpacity
            key={tile.key}
            style={[styles.tile, { backgroundColor: tokens.colors.cardBg, borderColor: tokens.colors.border }]}
            activeOpacity={0.8}
            onPress={tile.onPress}
            accessibilityRole="button"
            accessibilityLabel={`${tile.label}: ${value ?? 'yükleniyor'}`}
          >
            <MaterialCommunityIcons
              name={tile.icon}
              size={18}
              color={highlighted ? colors.primary[isDarkMode ? 400 : 500] : tokens.colors.textSecondary}
            />
            <Text style={[styles.value, { color: highlighted ? tokens.colors.textPrimary : tokens.colors.textSecondary }]}>
              {value ?? '–'}
            </Text>
            <Text style={[styles.label, { color: tokens.colors.textSecondary }]} numberOfLines={2}>
              {tile.label}
            </Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  tile: {
    flex: 1,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm + 4,
    ...shadows.sm,
  },
  value: {
    ...text.title,
    marginTop: spacing.xs,
  },
  label: {
    ...text.caption,
    marginTop: 2,
  },
});

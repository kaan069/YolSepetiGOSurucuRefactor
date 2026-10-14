import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, radius, spacing } from '../../theme/design';

export interface OfferChecklistItem {
  done: boolean;
  label: string;
  /** Tamamlandıysa / eksikse gösterilecek açıklama */
  detail?: string;
}

interface Props {
  title?: string;
  items: OfferChecklistItem[];
  /** Hepsi tamamsa bileşeni gizle (varsayılan true) */
  hideWhenComplete?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Teklif göndermeden önce eksikleri gösteren kontrol listesi (emoji yerine ikon). */
export default function OfferChecklist({
  title = 'Teklif göndermek için',
  items,
  hideWhenComplete = true,
  style,
}: Props) {
  if (hideWhenComplete && items.every((i) => i.done)) return null;

  return (
    <View style={[styles.box, style]}>
      <View style={styles.header}>
        <MaterialCommunityIcons name="clipboard-check-outline" size={20} color={colors.warning[500]} />
        <Text style={styles.title}>{title}</Text>
      </View>
      {items.map((item) => (
        <View key={item.label} style={styles.item}>
          <View
            style={[
              styles.circle,
              { backgroundColor: item.done ? colors.success[100] : colors.warning[100] },
            ]}
          >
            <MaterialCommunityIcons
              name={item.done ? 'check' : 'exclamation'}
              size={14}
              color={item.done ? colors.success[700] : colors.warning[700]}
            />
          </View>
          <Text style={styles.itemText}>
            <Text style={styles.itemLabel}>{item.label}</Text>
            {item.detail ? ` — ${item.detail}` : ''}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.warning[50],
    borderColor: colors.warning[200],
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.warning[800],
  },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  circle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    flex: 1,
    fontSize: 13,
    color: colors.warning[800],
    lineHeight: 18,
  },
  itemLabel: {
    fontWeight: '600',
  },
});

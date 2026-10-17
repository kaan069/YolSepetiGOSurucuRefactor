import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../../navigation';
import { selectScheduledTotal, useJobCountsStore } from '../../../store/useJobCountsStore';
import { colors, radius, spacing } from '../../../theme/design';

/**
 * İşler başlığındaki "Randevu" butonu: Randevulu İşlerim ekranını açar.
 * Randevulu iş varsa dolu renk ve sayı gösterir.
 */
export default function ScheduledJobsButton() {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const count = useJobCountsStore(selectScheduledTotal);
  const active = count > 0;

  return (
    <Pressable
      onPress={() => navigation.navigate('ScheduledJobs')}
      style={({ pressed }) => [
        styles.button,
        active ? styles.buttonActive : styles.buttonIdle,
        pressed && styles.pressed,
      ]}
      accessibilityRole="button"
      accessibilityLabel={active ? `Randevulu işler, ${count} iş` : 'Randevulu işler'}
      hitSlop={6}
    >
      <MaterialCommunityIcons
        name="calendar-clock"
        size={18}
        color={active ? colors.white : colors.primary[600]}
      />
      <Text style={[styles.label, { color: active ? colors.white : colors.primary[700] }]}>Randevu</Text>
      {active ? (
        <View style={styles.count}>
          <Text style={styles.countText}>{count > 99 ? '99+' : count}</Text>
        </View>
      ) : null}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: spacing.sm + 4,
    paddingVertical: spacing.sm,
    borderRadius: radius.sm + 2,
    borderWidth: 1,
  },
  buttonIdle: {
    backgroundColor: colors.primary[50],
    borderColor: colors.primary[200],
  },
  buttonActive: {
    backgroundColor: colors.primary[500],
    borderColor: colors.primary[500],
  },
  pressed: {
    opacity: 0.8,
  },
  label: {
    fontSize: 14,
    fontWeight: '700',
  },
  count: {
    minWidth: 20,
    height: 20,
    paddingHorizontal: 5,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.white,
  },
  countText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.primary[700],
  },
});

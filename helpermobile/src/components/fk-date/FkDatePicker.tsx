import React, { useCallback, useMemo, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, View, ViewStyle } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkButton from '../fk-ui/FkButton';
import FkFormError from '../fk-ui/FkFormError';
import FkLabel from '../fk-ui/FkLabel';
import FkModal from '../fk-ui/FkModal';

interface Props {
  value: Date | null;
  onChange: (date: Date) => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  minYear?: number;
  maxYear?: number;
  containerStyle?: ViewStyle;
  testID?: string;
}

const MONTHS_TR = [
  'Ocak', 'Şubat', 'Mart', 'Nisan', 'Mayıs', 'Haziran',
  'Temmuz', 'Ağustos', 'Eylül', 'Ekim', 'Kasım', 'Aralık',
];

const formatTr = (d: Date | null) => {
  if (!d) return '';
  return `${String(d.getDate()).padStart(2, '0')}.${String(d.getMonth() + 1).padStart(2, '0')}.${d.getFullYear()}`;
};

const daysInMonth = (year: number, month: number) => new Date(year, month + 1, 0).getDate();

export default function FkDatePicker({
  value,
  onChange,
  label,
  placeholder = 'Tarih seçin',
  required,
  disabled,
  error,
  helperText,
  minYear = 1950,
  maxYear = new Date().getFullYear(),
  containerStyle,
  testID,
}: Props) {
  const { tokens } = useFkTokens();
  const [open, setOpen] = useState(false);

  const initial = value ?? new Date(maxYear, 0, 1);
  const [year, setYear] = useState<number>(initial.getFullYear());
  const [month, setMonth] = useState<number>(initial.getMonth());
  const [day, setDay] = useState<number>(initial.getDate());

  const years = useMemo(() => {
    const arr: number[] = [];
    for (let y = maxYear; y >= minYear; y--) arr.push(y);
    return arr;
  }, [minYear, maxYear]);

  const days = useMemo(() => Array.from({ length: daysInMonth(year, month) }, (_, i) => i + 1), [year, month]);

  const handleConfirm = useCallback(() => {
    onChange(new Date(year, month, Math.min(day, daysInMonth(year, month))));
    setOpen(false);
  }, [year, month, day, onChange]);

  return (
    <View style={[{ marginBottom: tokens.spacing.md }, containerStyle]} testID={testID}>
      {label ? <FkLabel required={required} disabled={disabled}>{label}</FkLabel> : null}

      <Pressable
        onPress={() => !disabled && setOpen(true)}
        disabled={disabled}
        style={[
          styles.trigger,
          {
            backgroundColor: tokens.colors.cardBg,
            borderColor: error ? tokens.colors.error : tokens.colors.border,
            borderRadius: tokens.radius.md,
            opacity: disabled ? 0.6 : 1,
          },
        ]}
      >
        <MaterialCommunityIcons name="calendar" size={20} color={tokens.colors.textSecondary} />
        <Text
          style={[
            styles.text,
            { color: value ? tokens.colors.textPrimary : tokens.colors.textHint },
          ]}
        >
          {value ? formatTr(value) : placeholder}
        </Text>
        <MaterialCommunityIcons name="chevron-down" size={20} color={tokens.colors.textSecondary} />
      </Pressable>

      <FkFormError error={error} helperText={helperText} />

      <FkModal
        visible={open}
        onDismiss={() => setOpen(false)}
        title={label || 'Tarih Seçin'}
        variant="bottom"
        maxHeightRatio={0.75}
      >
        <View style={styles.cols}>
          <View style={styles.col}>
            <Text style={[styles.colHead, { color: tokens.colors.textSecondary }]}>Gün</Text>
            <ScrollView style={styles.colList} showsVerticalScrollIndicator={false}>
              {days.map((d) => (
                <Pressable
                  key={d}
                  onPress={() => setDay(d)}
                  style={[
                    styles.cell,
                    d === day && { backgroundColor: tokens.colors.successSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: d === day ? tokens.colors.primary : tokens.colors.textPrimary },
                    ]}
                  >
                    {d}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.col}>
            <Text style={[styles.colHead, { color: tokens.colors.textSecondary }]}>Ay</Text>
            <ScrollView style={styles.colList} showsVerticalScrollIndicator={false}>
              {MONTHS_TR.map((name, idx) => (
                <Pressable
                  key={name}
                  onPress={() => setMonth(idx)}
                  style={[
                    styles.cell,
                    idx === month && { backgroundColor: tokens.colors.successSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: idx === month ? tokens.colors.primary : tokens.colors.textPrimary },
                    ]}
                  >
                    {name}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>

          <View style={styles.col}>
            <Text style={[styles.colHead, { color: tokens.colors.textSecondary }]}>Yıl</Text>
            <ScrollView style={styles.colList} showsVerticalScrollIndicator={false}>
              {years.map((y) => (
                <Pressable
                  key={y}
                  onPress={() => setYear(y)}
                  style={[
                    styles.cell,
                    y === year && { backgroundColor: tokens.colors.successSoft },
                  ]}
                >
                  <Text
                    style={[
                      styles.cellText,
                      { color: y === year ? tokens.colors.primary : tokens.colors.textPrimary },
                    ]}
                  >
                    {y}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </View>

        <View style={{ padding: tokens.spacing.lg }}>
          <FkButton onPress={handleConfirm} fullWidth>
            Onayla
          </FkButton>
        </View>
      </FkModal>
    </View>
  );
}

const styles = StyleSheet.create({
  trigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 14,
    minHeight: 52,
    gap: 10,
  },
  text: { flex: 1, fontSize: 16 },
  cols: { flexDirection: 'row', paddingHorizontal: 16, paddingTop: 12, gap: 8 },
  col: { flex: 1 },
  colHead: { fontSize: 12, fontWeight: '600', textAlign: 'center', marginBottom: 4 },
  colList: { height: 240 },
  cell: { paddingVertical: 10, alignItems: 'center', borderRadius: 8 },
  cellText: { fontSize: 15 },
});

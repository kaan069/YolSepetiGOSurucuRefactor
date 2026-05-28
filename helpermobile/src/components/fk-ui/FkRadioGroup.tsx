import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { RadioButton } from 'react-native-paper';
import { useFkTokens } from '../../hooks/useFkTokens';

export interface FkRadioOption<T extends string = string> {
  value: T;
  label: string;
  description?: string;
}

interface Props<T extends string = string> {
  value: T | null;
  onChange: (value: T) => void;
  options: FkRadioOption<T>[];
  orientation?: 'vertical' | 'horizontal';
  disabled?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export default function FkRadioGroup<T extends string = string>({
  value,
  onChange,
  options,
  orientation = 'vertical',
  disabled,
  style,
  testID,
}: Props<T>) {
  const { tokens } = useFkTokens();

  return (
    <View
      style={[
        orientation === 'horizontal' ? styles.horizontal : styles.vertical,
        style,
      ]}
      testID={testID}
    >
      {options.map((opt) => {
        const selected = opt.value === value;
        return (
          <Pressable
            key={opt.value}
            onPress={() => !disabled && onChange(opt.value)}
            disabled={disabled}
            style={[
              styles.item,
              {
                backgroundColor: selected ? tokens.colors.successSoft : tokens.colors.surfaceMuted,
                borderColor: selected ? tokens.colors.primary : tokens.colors.border,
                borderRadius: tokens.radius.lg,
                padding: tokens.spacing.md,
                opacity: disabled ? 0.5 : 1,
              },
            ]}
          >
            <RadioButton
              value={opt.value}
              status={selected ? 'checked' : 'unchecked'}
              onPress={() => !disabled && onChange(opt.value)}
              color={tokens.colors.primary}
            />
            <View style={{ flex: 1 }}>
              <Text style={[styles.label, { color: tokens.colors.textPrimary }]}>{opt.label}</Text>
              {opt.description ? (
                <Text style={[styles.desc, { color: tokens.colors.textSecondary }]}>{opt.description}</Text>
              ) : null}
            </View>
          </Pressable>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  vertical: { gap: 8 },
  horizontal: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  item: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    minWidth: 120,
    flex: 1,
  },
  label: { fontSize: 15, fontWeight: '500' },
  desc: { fontSize: 12, marginTop: 2 },
});

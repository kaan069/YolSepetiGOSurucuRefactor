import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Checkbox as PaperCheckbox } from 'react-native-paper';
import { useFkTokens } from '../../hooks/useFkTokens';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string | React.ReactNode;
  description?: string;
  disabled?: boolean;
  variant?: 'plain' | 'card';
  rightSlot?: React.ReactNode;
  style?: ViewStyle;
  testID?: string;
}

export default function FkCheckbox({
  value,
  onChange,
  label,
  description,
  disabled,
  variant = 'plain',
  rightSlot,
  style,
  testID,
}: Props) {
  const { tokens } = useFkTokens();
  const toggle = () => !disabled && onChange(!value);

  const wrapStyle = variant === 'card'
    ? [
        styles.card,
        {
          backgroundColor: value ? tokens.colors.successSoft : tokens.colors.surfaceMuted,
          borderColor: value ? tokens.colors.success : tokens.colors.border,
          borderRadius: tokens.radius.lg,
          padding: tokens.spacing.md,
        },
      ]
    : [styles.row];

  return (
    <Pressable onPress={toggle} disabled={disabled} style={[wrapStyle, style]} testID={testID}>
      <PaperCheckbox
        status={value ? 'checked' : 'unchecked'}
        onPress={toggle}
        disabled={disabled}
        color={tokens.colors.primary}
      />
      <View style={styles.textCol}>
        {typeof label === 'string' ? (
          <Text style={[styles.label, { color: tokens.colors.textPrimary }]}>{label}</Text>
        ) : (
          label
        )}
        {description ? (
          <Text style={[styles.desc, { color: tokens.colors.textSecondary }]}>{description}</Text>
        ) : null}
      </View>
      {rightSlot}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    marginBottom: 8,
  },
  textCol: { flex: 1, marginLeft: 4 },
  label: { fontSize: 15, fontWeight: '500' },
  desc: { fontSize: 12, marginTop: 2 },
});

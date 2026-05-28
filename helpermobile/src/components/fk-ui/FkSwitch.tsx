import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { Switch as PaperSwitch } from 'react-native-paper';
import { useFkTokens } from '../../hooks/useFkTokens';

interface Props {
  value: boolean;
  onChange: (value: boolean) => void;
  label?: string;
  description?: string;
  disabled?: boolean;
  inverted?: boolean;
  style?: ViewStyle;
  testID?: string;
}

export default function FkSwitch({
  value,
  onChange,
  label,
  description,
  disabled,
  inverted,
  style,
  testID,
}: Props) {
  const { tokens } = useFkTokens();

  const handleToggle = () => {
    if (!disabled) onChange(!value);
  };

  return (
    <Pressable
      onPress={handleToggle}
      disabled={disabled}
      style={[
        styles.row,
        inverted ? styles.rowInverted : null,
        { opacity: disabled ? 0.5 : 1 },
        style,
      ]}
      testID={testID}
    >
      <View style={styles.textCol}>
        {label ? (
          <Text style={[styles.label, { color: tokens.colors.textPrimary }]}>{label}</Text>
        ) : null}
        {description ? (
          <Text style={[styles.desc, { color: tokens.colors.textSecondary }]}>{description}</Text>
        ) : null}
      </View>
      <PaperSwitch
        value={value}
        onValueChange={onChange}
        disabled={disabled}
        color={tokens.colors.primary}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 8,
    gap: 12,
  },
  rowInverted: { flexDirection: 'row-reverse' },
  textCol: { flex: 1 },
  label: { fontSize: 15, fontWeight: '500' },
  desc: { fontSize: 12, marginTop: 2 },
});

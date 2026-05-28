import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { useFkTokens } from '../../hooks/useFkTokens';

interface Props {
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  style?: TextStyle;
}

export default function FkLabel({ children, required, disabled, style }: Props) {
  const { tokens } = useFkTokens();
  return (
    <Text
      style={[
        styles.label,
        {
          color: disabled ? tokens.colors.textDisabled : tokens.colors.textSecondary,
          marginBottom: tokens.spacing.sm,
        },
        style,
      ]}
    >
      {children}
      {required ? (
        <Text style={{ color: tokens.colors.error }}> *</Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 12,
    fontWeight: '500',
    marginLeft: 4,
  },
});

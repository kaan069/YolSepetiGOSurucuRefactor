import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors } from '../../theme/design';
import { getFieldLabelColor } from '../fk-form/fieldStyles';

interface Props {
  children: React.ReactNode;
  required?: boolean;
  disabled?: boolean;
  style?: TextStyle;
}

export default function FkLabel({ children, required, disabled, style }: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  return (
    <Text
      style={[
        styles.label,
        {
          color: getFieldLabelColor(tokens.colors, isDarkMode, disabled),
        },
        style,
      ]}
    >
      {children}
      {required ? (
        <Text style={{ color: colors.danger[500] }}> *</Text>
      ) : null}
    </Text>
  );
}

const styles = StyleSheet.create({
  label: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 6,
    marginLeft: 2,
  },
});

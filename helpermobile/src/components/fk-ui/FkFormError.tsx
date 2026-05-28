import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';

interface Props {
  error?: string | null;
  helperText?: string;
  helperColor?: string;
  withIcon?: boolean;
  style?: ViewStyle;
}

export default function FkFormError({ error, helperText, helperColor, withIcon, style }: Props) {
  const { tokens } = useFkTokens();

  if (!error && !helperText) return null;

  if (error) {
    return (
      <View style={[styles.row, style]}>
        {withIcon ? (
          <MaterialCommunityIcons name="alert-circle" size={14} color={tokens.colors.error} />
        ) : null}
        <Text
          style={[
            styles.text,
            { color: tokens.colors.error, marginLeft: withIcon ? tokens.spacing.xs : 0 },
          ]}
        >
          {error}
        </Text>
      </View>
    );
  }

  return (
    <View style={[styles.row, style]}>
      <Text style={[styles.text, { color: helperColor || tokens.colors.textSecondary }]}>
        {helperText}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    marginLeft: 4,
    minHeight: 16,
  },
  text: {
    fontSize: 12,
    fontWeight: '500',
  },
});

import React, { useCallback, useEffect } from 'react';
import {
  StyleSheet,
  TextInput as RNTextInput,
  View,
  ViewStyle,
} from 'react-native';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkFormError from '../fk-ui/FkFormError';

interface Props {
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  length?: number;
  error?: string | null;
  autoFocus?: boolean;
  disabled?: boolean;
  containerStyle?: ViewStyle;
  testID?: string;
}

export default function FkOTPInput({
  value,
  onChange,
  onComplete,
  length = 6,
  error,
  autoFocus = true,
  disabled,
  containerStyle,
  testID,
}: Props) {
  const { tokens } = useFkTokens();

  useEffect(() => {
    if (value.length === length) {
      onComplete?.(value);
    }
  }, [value, length, onComplete]);

  const handleChange = useCallback(
    (text: string) => {
      const clean = text.replace(/\D/g, '').slice(0, length);
      onChange(clean);
    },
    [length, onChange],
  );

  const filled = value.length === length;
  const borderColor = error
    ? tokens.colors.error
    : filled
    ? tokens.colors.primary
    : tokens.colors.border;
  const bgColor = error
    ? tokens.colors.errorSoft
    : filled
    ? tokens.colors.successSoft
    : tokens.colors.surfaceMuted;

  return (
    <View style={containerStyle} testID={testID}>
      <RNTextInput
        value={value}
        onChangeText={handleChange}
        keyboardType="number-pad"
        maxLength={length}
        autoFocus={autoFocus}
        textContentType="oneTimeCode"
        autoComplete="sms-otp"
        editable={!disabled}
        selectionColor={tokens.colors.primary}
        style={[
          styles.input,
          {
            borderColor,
            backgroundColor: bgColor,
            color: tokens.colors.textPrimary,
            borderRadius: tokens.radius.lg,
          },
        ]}
      />
      <FkFormError error={error} withIcon style={styles.error} />
    </View>
  );
}

const styles = StyleSheet.create({
  input: {
    height: 64,
    borderWidth: 2,
    textAlign: 'center',
    fontSize: 28,
    fontWeight: 'bold',
    letterSpacing: 12,
    paddingHorizontal: 16,
  },
  error: { justifyContent: 'center', marginTop: 12, marginLeft: 0 },
});

import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { TextInput as PaperTextInput } from 'react-native-paper';
import type { TextInputProps as PaperTextInputProps } from 'react-native-paper';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkFormError from '../fk-ui/FkFormError';

export interface FkTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  helperText?: string;
  helperColor?: string;
  keyboardType?: PaperTextInputProps['keyboardType'];
  autoCapitalize?: PaperTextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  secureTextEntry?: boolean;
  leftIcon?: string;
  rightIcon?: React.ReactNode;
  leftAffix?: string;
  mode?: 'flat' | 'outlined';
  containerStyle?: ViewStyle;
  dense?: boolean;
  textContentType?: PaperTextInputProps['textContentType'];
  autoComplete?: PaperTextInputProps['autoComplete'];
  onPress?: () => void;
  editable?: boolean;
  testID?: string;
}

export default function FkTextInput({
  value,
  onChange,
  onBlur,
  label,
  placeholder,
  required,
  disabled,
  error,
  helperText,
  helperColor,
  keyboardType,
  autoCapitalize,
  autoCorrect,
  multiline,
  numberOfLines,
  maxLength,
  secureTextEntry,
  leftIcon,
  rightIcon,
  leftAffix,
  mode = 'flat',
  containerStyle,
  dense,
  textContentType,
  autoComplete,
  onPress,
  editable,
  testID,
}: FkTextInputProps) {
  const { tokens } = useFkTokens();
  const hasError = !!error;

  const displayLabel = label
    ? required
      ? `${label} *`
      : label
    : undefined;

  return (
    <View style={[styles.container, { marginBottom: tokens.spacing.md }, containerStyle]}>
      <PaperTextInput
        mode={mode}
        label={displayLabel}
        value={value}
        onChangeText={onChange}
        onBlur={onBlur}
        placeholder={placeholder}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        disabled={disabled}
        error={hasError}
        dense={dense}
        textContentType={textContentType}
        autoComplete={autoComplete}
        editable={editable}
        onPressIn={onPress}
        left={
          leftIcon ? (
            <PaperTextInput.Icon icon={leftIcon} />
          ) : leftAffix ? (
            <PaperTextInput.Affix text={leftAffix} />
          ) : undefined
        }
        right={rightIcon as any}
        style={styles.input}
        testID={testID}
      />
      <FkFormError error={error} helperText={helperText} helperColor={helperColor} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {},
  input: {},
});

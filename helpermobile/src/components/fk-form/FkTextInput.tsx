import React, { useState } from 'react';
import { Pressable, StyleProp, StyleSheet, Text, TextInput, TextInputProps, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import FkFormError from '../fk-ui/FkFormError';
import { colors } from '../../theme/design';
import { fieldStyles, getFieldBoxStyle, getFieldLabelColor } from './fieldStyles';

export interface FkTextInputProps {
  value: string;
  onChange: (value: string) => void;
  onBlur?: () => void;
  onFocus?: () => void;
  label?: string;
  placeholder?: string;
  required?: boolean;
  disabled?: boolean;
  error?: string | null;
  /** Mesaj göstermeden yalnızca hata çerçevesi (mesaj başka yerde gösteriliyorsa) */
  invalid?: boolean;
  helperText?: string;
  helperColor?: string;
  keyboardType?: TextInputProps['keyboardType'];
  autoCapitalize?: TextInputProps['autoCapitalize'];
  autoCorrect?: boolean;
  multiline?: boolean;
  numberOfLines?: number;
  maxLength?: number;
  secureTextEntry?: boolean;
  /** MaterialCommunityIcons adı */
  leftIcon?: string;
  rightIcon?: React.ReactNode;
  leftAffix?: string;
  /** Eski Paper modu — görünüm artık her iki modda aynıdır */
  mode?: 'flat' | 'outlined';
  containerStyle?: StyleProp<ViewStyle>;
  dense?: boolean;
  textContentType?: TextInputProps['textContentType'];
  autoComplete?: TextInputProps['autoComplete'];
  onPress?: () => void;
  editable?: boolean;
  testID?: string;
}

/** Metin girişi — müşteri uygulamasındaki input: etiket üstte, açık zeminli 16 köşeli kutu. */
export default function FkTextInput({
  value,
  onChange,
  onBlur,
  onFocus,
  label,
  placeholder,
  required,
  disabled,
  error,
  invalid,
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
  containerStyle,
  dense,
  textContentType,
  autoComplete,
  onPress,
  editable,
  testID,
}: FkTextInputProps) {
  const { tokens, isDarkMode } = useFkTokens();
  const c = tokens.colors;
  const [focused, setFocused] = useState(false);
  const hasError = !!error || !!invalid;

  const box = (
    <View
      style={[
        fieldStyles.box,
        getFieldBoxStyle(c, isDarkMode, { focused, error: hasError, disabled }),
        dense ? styles.dense : null,
        multiline ? styles.multilineBox : null,
      ]}
    >
      {leftIcon ? (
        <MaterialCommunityIcons
          name={leftIcon}
          size={20}
          color={focused ? c.primary : colors.neutral[400]}
          style={[styles.leftIcon, multiline ? styles.topAligned : null]}
        />
      ) : leftAffix ? (
        <Text style={[styles.affix, { color: c.textSecondary }]}>{leftAffix}</Text>
      ) : null}
      <TextInput
        value={value}
        onChangeText={onChange}
        onFocus={() => {
          setFocused(true);
          onFocus?.();
        }}
        onBlur={() => {
          setFocused(false);
          onBlur?.();
        }}
        placeholder={placeholder}
        placeholderTextColor={colors.neutral[400]}
        keyboardType={keyboardType}
        autoCapitalize={autoCapitalize}
        autoCorrect={autoCorrect}
        multiline={multiline}
        numberOfLines={numberOfLines}
        maxLength={maxLength}
        secureTextEntry={secureTextEntry}
        editable={disabled ? false : editable}
        textContentType={textContentType}
        autoComplete={autoComplete}
        onPressIn={onPress}
        selectionColor={c.primary}
        style={[
          fieldStyles.input,
          { color: c.textPrimary },
          dense ? styles.denseInput : null,
          multiline ? fieldStyles.multiline : null,
        ]}
        testID={testID}
      />
      {rightIcon ? <View style={styles.right}>{rightIcon}</View> : null}
    </View>
  );

  return (
    <View style={[fieldStyles.container, containerStyle]}>
      {label ? (
        <Text style={[fieldStyles.label, { color: getFieldLabelColor(c, isDarkMode, disabled) }]}>
          {label}
          {required ? <Text style={{ color: colors.danger[500] }}> *</Text> : null}
        </Text>
      ) : null}
      {onPress && editable === false ? (
        <Pressable onPress={disabled ? undefined : onPress}>{box}</Pressable>
      ) : (
        box
      )}
      <FkFormError error={error} helperText={helperText} helperColor={helperColor} />
    </View>
  );
}

/** Input'un sağına konan dokunulabilir ikon (ör. şifre göster/gizle). */
export function FkInputIconButton({
  icon,
  onPress,
  color,
}: {
  icon: string;
  onPress?: () => void;
  color?: string;
}) {
  return (
    <Pressable onPress={onPress} hitSlop={10} accessibilityRole="button">
      <MaterialCommunityIcons name={icon} size={20} color={color || colors.neutral[500]} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  leftIcon: {
    marginRight: 10,
  },
  topAligned: {
    alignSelf: 'flex-start',
    marginTop: 14,
  },
  affix: {
    fontSize: 16,
    marginRight: 6,
  },
  right: {
    marginLeft: 8,
  },
  dense: {
    minHeight: 44,
  },
  denseInput: {
    paddingVertical: 9,
  },
  multilineBox: {
    alignItems: 'flex-start',
  },
});

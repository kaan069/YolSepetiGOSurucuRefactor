import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextStyle,
  TouchableOpacity,
  View,
  ViewStyle,
} from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, radius } from '../../theme/design';

export type FkButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: FkButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  /** MaterialCommunityIcons adı */
  icon?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  textStyle?: TextStyle;
  iconPosition?: 'left' | 'right';
  testID?: string;
}

const SIZES = {
  sm: { paddingVertical: 8, paddingHorizontal: 12, fontSize: 14, icon: 16 },
  md: { paddingVertical: 13, paddingHorizontal: 16, fontSize: 16, icon: 18 },
  lg: { paddingVertical: 16, paddingHorizontal: 24, fontSize: 17, icon: 20 },
} as const;

/**
 * Müşteri uygulamasındaki ModernButton görünümü:
 * primary/danger/success → dolu, secondary → çerçeveli, ghost → sadece metin. Köşe 16.
 */
export default function FkButton({
  children,
  onPress,
  variant = 'primary',
  loading,
  disabled,
  icon,
  fullWidth,
  size = 'md',
  style,
  contentStyle,
  textStyle,
  iconPosition = 'left',
  testID,
}: Props) {
  const { tokens } = useFkTokens();
  const sz = SIZES[size];
  const isDisabled = !!disabled || !!loading;

  const mainColor =
    variant === 'danger'
      ? colors.danger[500]
      : variant === 'success'
      ? colors.success[600]
      : tokens.colors.primary;

  const filled = variant === 'primary' || variant === 'danger' || variant === 'success';

  const containerStyle: ViewStyle = filled
    ? { backgroundColor: disabled ? colors.neutral[300] : mainColor }
    : variant === 'secondary'
    ? { borderWidth: 2, borderColor: disabled ? colors.neutral[300] : mainColor }
    : {};

  const labelColor = filled ? colors.white : disabled ? colors.neutral[400] : mainColor;

  const iconNode = icon ? (
    <MaterialCommunityIcons name={icon} size={sz.icon} color={labelColor} />
  ) : null;

  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.7}
      accessibilityRole="button"
      accessibilityState={{ disabled: isDisabled, busy: !!loading }}
      testID={testID}
      style={[
        styles.button,
        { paddingVertical: sz.paddingVertical, paddingHorizontal: sz.paddingHorizontal },
        containerStyle,
        fullWidth ? styles.full : null,
        style,
      ]}
    >
      {loading ? (
        <ActivityIndicator size="small" color={labelColor} />
      ) : (
        <View style={[styles.content, iconPosition === 'right' ? styles.iconRight : null, contentStyle]}>
          {iconNode}
          {typeof children === 'string' || typeof children === 'number' ? (
            <Text
              style={[styles.text, { color: labelColor, fontSize: sz.fontSize }, textStyle]}
              numberOfLines={2}
            >
              {children}
            </Text>
          ) : (
            children
          )}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    borderRadius: radius.lg,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  full: { width: '100%' },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  iconRight: { flexDirection: 'row-reverse' },
  text: {
    fontWeight: '600',
    textAlign: 'center',
  },
});

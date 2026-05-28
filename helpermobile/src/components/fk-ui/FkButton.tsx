import React from 'react';
import { StyleSheet, ViewStyle } from 'react-native';
import { Button as PaperButton } from 'react-native-paper';
import { useFkTokens } from '../../hooks/useFkTokens';

export type FkButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'success';

interface Props {
  children: React.ReactNode;
  onPress?: () => void;
  variant?: FkButtonVariant;
  loading?: boolean;
  disabled?: boolean;
  icon?: string;
  fullWidth?: boolean;
  size?: 'sm' | 'md' | 'lg';
  style?: ViewStyle;
  contentStyle?: ViewStyle;
  iconPosition?: 'left' | 'right';
  testID?: string;
}

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
  iconPosition = 'left',
  testID,
}: Props) {
  const { tokens } = useFkTokens();

  const verticalPadding = size === 'sm' ? 2 : size === 'lg' ? 12 : 8;

  const mode: React.ComponentProps<typeof PaperButton>['mode'] =
    variant === 'primary' || variant === 'danger' || variant === 'success'
      ? 'contained'
      : variant === 'secondary'
      ? 'outlined'
      : 'text';

  const buttonColor =
    variant === 'primary'
      ? tokens.colors.primary
      : variant === 'danger'
      ? tokens.colors.error
      : variant === 'success'
      ? tokens.colors.success
      : undefined;

  const textColor =
    variant === 'secondary'
      ? tokens.colors.primary
      : variant === 'ghost'
      ? tokens.colors.primary
      : undefined;

  return (
    <PaperButton
      mode={mode}
      onPress={onPress}
      loading={loading}
      disabled={disabled || loading}
      icon={icon}
      buttonColor={buttonColor}
      textColor={textColor}
      style={[
        styles.button,
        { borderRadius: tokens.radius.lg },
        fullWidth ? styles.full : null,
        style,
      ]}
      contentStyle={[
        { paddingVertical: verticalPadding },
        iconPosition === 'right' ? styles.iconRight : null,
        contentStyle,
      ]}
      testID={testID}
    >
      {children}
    </PaperButton>
  );
}

const styles = StyleSheet.create({
  button: {},
  full: { width: '100%' },
  iconRight: { flexDirection: 'row-reverse' },
});

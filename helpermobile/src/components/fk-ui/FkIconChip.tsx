import React from 'react';
import { StyleProp, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, ColorScale, radius, tint } from '../../theme/design';

interface Props {
  /** MaterialCommunityIcons adı */
  icon: string;
  color?: ColorScale;
  /** Kutu boyutu (px); ikon yaklaşık yarısı */
  size?: number;
  /** 'tinted' = X[50] zemin + X[500] ikon, 'solid' = X[500] zemin + beyaz ikon */
  variant?: 'tinted' | 'solid';
  shape?: 'rounded' | 'circle';
  iconColor?: string;
  backgroundColor?: string;
  style?: StyleProp<ViewStyle>;
}

/** Renkli kutu içinde ikon (müşteri uygulamasındaki ikon kutusu kalıbı). */
export default function FkIconChip({
  icon,
  color = 'primary',
  size = 40,
  variant = 'tinted',
  shape = 'rounded',
  iconColor,
  backgroundColor,
  style,
}: Props) {
  const t = tint(color);
  const bg = backgroundColor ?? (variant === 'solid' ? t.solid : t.bg);
  const fg = iconColor ?? (variant === 'solid' ? colors.white : t.icon);
  const borderRadius = shape === 'circle' ? size / 2 : size >= 48 ? radius.lg : radius.md;

  return (
    <View
      style={[
        { width: size, height: size, borderRadius, backgroundColor: bg, alignItems: 'center', justifyContent: 'center' },
        style,
      ]}
    >
      <MaterialCommunityIcons name={icon} size={Math.round(size * 0.52)} color={fg} />
    </View>
  );
}

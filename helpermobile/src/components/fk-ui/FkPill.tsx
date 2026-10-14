import React from 'react';
import { StyleProp, StyleSheet, Text, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { colors, ColorScale, radius, tint } from '../../theme/design';

interface Props {
  label: string;
  /** Renk ölçeği (tinted varyantta X[50] zemin + X[700] metin) */
  color?: ColorScale;
  /** 'tinted' = açık zemin, 'solid' = dolu zemin + beyaz metin */
  variant?: 'tinted' | 'solid';
  /** MaterialCommunityIcons adı */
  icon?: string;
  size?: 'sm' | 'md';
  /** Özel renkler (ör. durum renkleri) — color'ı ezer */
  bg?: string;
  fg?: string;
  style?: StyleProp<ViewStyle>;
}

/** Hap şeklinde küçük rozet (müşteri uygulamasındaki tinted / solid pill). */
export default function FkPill({
  label,
  color = 'primary',
  variant = 'tinted',
  icon,
  size = 'md',
  bg,
  fg,
  style,
}: Props) {
  const t = tint(color);
  const background = bg ?? (variant === 'solid' ? t.solid : t.bg);
  const foreground = fg ?? (variant === 'solid' ? colors.white : t.text);
  const fontSize = size === 'sm' ? 11 : 12;

  return (
    <View
      style={[
        styles.pill,
        size === 'sm' ? styles.sm : styles.md,
        { backgroundColor: background },
        style,
      ]}
    >
      {icon ? <MaterialCommunityIcons name={icon} size={fontSize + 2} color={foreground} /> : null}
      <Text style={[styles.text, { color: foreground, fontSize }]} numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    borderRadius: radius.full,
    gap: 4,
  },
  sm: { paddingHorizontal: 8, paddingVertical: 2 },
  md: { paddingHorizontal: 10, paddingVertical: 4 },
  text: {
    fontWeight: '600',
  },
});

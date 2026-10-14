import React from 'react';
import { StyleProp, StyleSheet, Text, TouchableOpacity, View, ViewStyle } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { ColorScale, radius, spacing, tint } from '../../theme/design';

export type FkInfoBannerType = 'info' | 'warning' | 'success' | 'danger' | 'neutral';

interface Props {
  message?: string;
  title?: string;
  type?: FkInfoBannerType;
  /** Varsayılan ikonu değiştirir (MaterialCommunityIcons adı) */
  icon?: string;
  /** Mesajın altına ek içerik (buton vb.) */
  children?: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
}

const CONFIG: Record<FkInfoBannerType, { scale: ColorScale; icon: string }> = {
  info: { scale: 'primary', icon: 'information' },
  warning: { scale: 'warning', icon: 'alert' },
  success: { scale: 'success', icon: 'check-circle' },
  danger: { scale: 'danger', icon: 'alert-circle' },
  neutral: { scale: 'neutral', icon: 'information-outline' },
};

/**
 * Renkli bilgi kutusu (müşteri InfoBox): X[50] zemin, X[200] kenarlık, X[700] metin, X[500] ikon.
 */
export default function FkInfoBanner({ message, title, type = 'info', icon, children, onPress, style }: Props) {
  const cfg = CONFIG[type];
  const t = tint(cfg.scale);
  const content = (
    <View style={[styles.container, { backgroundColor: t.bg, borderColor: t.border }, style]}>
      <MaterialCommunityIcons name={icon || cfg.icon} size={20} color={t.icon} style={styles.icon} />
      <View style={styles.body}>
        {title ? <Text style={[styles.title, { color: t.text }]}>{title}</Text> : null}
        {message ? <Text style={[styles.text, { color: t.text }]}>{message}</Text> : null}
        {children}
      </View>
    </View>
  );

  if (onPress) {
    return (
      <TouchableOpacity activeOpacity={0.8} onPress={onPress}>
        {content}
      </TouchableOpacity>
    );
  }
  return content;
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  icon: {
    marginTop: 1,
  },
  body: {
    flex: 1,
    marginLeft: spacing.sm,
    gap: 2,
  },
  title: {
    fontSize: 14,
    fontWeight: '700',
  },
  text: {
    fontSize: 13,
    lineHeight: 18,
  },
});

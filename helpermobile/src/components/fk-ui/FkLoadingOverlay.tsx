import React from 'react';
import { Modal, StyleSheet, Text, View } from 'react-native';
import LoadingSpinner from '../LoadingSpinner';
import { useFkTokens } from '../../hooks/useFkTokens';
import { radius, shadows, spacing, text } from '../../theme/design';

interface Props {
  /**
   * Verilirse tam ekran Modal olarak çalışır (görünürlüğü bu prop yönetir).
   * Verilmezse ekranın üstüne mutlak konumlu katman olarak çizilir (koşullu render edilir).
   */
  visible?: boolean;
  title?: string;
  subtitle?: string;
}

/** Tam ekran yükleme katmanı — dönen logo + başlık (eskiden servis başına 5+ kopya). */
export default function FkLoadingOverlay({
  visible,
  title = 'Teklif gönderiliyor...',
  subtitle = 'Lütfen bekleyiniz',
}: Props) {
  const { tokens } = useFkTokens();

  const content = (
    <View style={styles.overlay}>
      <View style={[styles.card, { backgroundColor: tokens.colors.cardBg }]}>
        <LoadingSpinner size={88} />
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>{title}</Text>
        {subtitle ? <Text style={[styles.subtitle, { color: tokens.colors.textSecondary }]}>{subtitle}</Text> : null}
      </View>
    </View>
  );

  if (visible === undefined) {
    return <View style={styles.absolute}>{content}</View>;
  }

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      {content}
    </Modal>
  );
}

const styles = StyleSheet.create({
  absolute: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9999,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.6)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
  },
  card: {
    borderRadius: radius.xl,
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.xl,
    alignItems: 'center',
    minWidth: 240,
    ...shadows.lg,
  },
  title: {
    ...text.header,
    marginTop: spacing.md + 4,
    textAlign: 'center',
  },
  subtitle: {
    ...text.body,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});

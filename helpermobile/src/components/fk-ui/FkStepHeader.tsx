import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing, text } from '../../theme/design';

interface Props {
  title?: string;
  /** 0–1 arası ilerleme */
  progress?: number;
  /** Sağ üstte küçük adım metni (ör. "Adım 2/4") */
  stepLabel?: string;
  onBack?: () => void;
  /** Üst güvenli alan payını bu bileşen eklesin mi (ekran zaten SafeAreaView top kullanıyorsa false) */
  safeTop?: boolean;
}

/**
 * Çok adımlı akışların üst başlığı (müşteri uygulamasındaki talep formu başlığı):
 * beyaz bar, geri oku, ortalanmış başlık, altında 4 px ilerleme çubuğu.
 */
export default function FkStepHeader({ title, progress, stepLabel, onBack, safeTop = true }: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const insets = useSafeAreaInsets();
  const pct = typeof progress === 'number' ? Math.max(0, Math.min(1, progress)) : null;

  return (
    <View
      style={[
        styles.container,
        {
          paddingTop: (safeTop ? insets.top : 0) + spacing.sm,
          backgroundColor: tokens.colors.cardBg,
          borderBottomColor: tokens.colors.border,
        },
      ]}
    >
      <View style={styles.row}>
        {onBack ? (
          <Pressable onPress={onBack} hitSlop={10} style={styles.side} accessibilityRole="button" accessibilityLabel="Geri">
            <MaterialCommunityIcons name="arrow-left" size={24} color={isDarkMode ? tokens.colors.textPrimary : colors.neutral[700]} />
          </Pressable>
        ) : (
          <View style={styles.side} />
        )}
        <Text style={[styles.title, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
          {title ?? ''}
        </Text>
        <View style={styles.side} />
      </View>

      {pct !== null ? (
        <View style={styles.progressWrap}>
          <View style={[styles.track, { backgroundColor: isDarkMode ? tokens.colors.border : colors.neutral[100] }]}>
            <View style={[styles.fill, { width: `${pct * 100}%`, backgroundColor: tokens.colors.primary }]} />
          </View>
          {stepLabel ? <Text style={[styles.stepLabel, { color: tokens.colors.textSecondary }]}>{stepLabel}</Text> : null}
        </View>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.sm + 4,
    borderBottomWidth: 1,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 40,
  },
  side: {
    width: 32,
  },
  title: {
    ...text.header,
    flex: 1,
    textAlign: 'center',
  },
  progressWrap: {
    marginTop: spacing.sm,
  },
  track: {
    height: 4,
    borderRadius: 2,
    overflow: 'hidden',
  },
  fill: {
    height: 4,
    borderRadius: 2,
  },
  stepLabel: {
    ...text.caption,
    textAlign: 'right',
    marginTop: 4,
  },
});

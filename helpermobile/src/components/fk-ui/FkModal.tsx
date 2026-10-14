import React from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
  ViewStyle,
} from 'react-native';
import { Text } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, radius, spacing } from '../../theme/design';

export type FkModalVariant = 'bottom' | 'center';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: FkModalVariant;
  scrollable?: boolean;
  /** Pencerenin ekran yüksekliğine oranla en fazla boyu (varsayılan 0.92) */
  maxHeightRatio?: number;
  /**
   * Pencere içerikten bağımsız olarak maxHeightRatio boyuna sabitlenir ve içerik alanı flex:1 olur.
   * İçinde flex:1 liste (FlatList vb.) olan pencereler için kullanın; aksi halde liste 0 yüksekliğe çöker.
   */
  fill?: boolean;
  contentStyle?: ViewStyle;
  showHandle?: boolean;
  showClose?: boolean;
}

/**
 * Alttan açılan pencere (üst köşeler 24) veya ortada dialog (köşe 24) — müşteri uygulaması görünümü.
 * İçerik, pencerenin üst sınırına göre küçülür (flexShrink); uzun içerikte `scrollable` kullanın.
 */
export default function FkModal({
  visible,
  onDismiss,
  title,
  children,
  variant = 'bottom',
  scrollable = false,
  maxHeightRatio = 0.92,
  fill = false,
  contentStyle,
  showHandle = true,
  showClose = true,
}: Props) {
  const { tokens, isDarkMode } = useFkTokens();
  const heightPct = `${Math.round(maxHeightRatio * 100)}%` as `${number}%`;
  const isBottom = variant === 'bottom';

  const containerStyle: ViewStyle[] = [
    isBottom ? styles.bottomContainer : styles.centerContainer,
    {
      backgroundColor: tokens.colors.cardBg,
      maxHeight: heightPct,
    },
    fill ? { height: heightPct } : {},
  ];

  const body = (
    <SafeAreaView
      edges={isBottom ? ['bottom'] : []}
      style={[styles.body, fill ? styles.fill : null, contentStyle]}
    >
      {isBottom && showHandle ? (
        <View style={[styles.handle, { backgroundColor: isDarkMode ? tokens.colors.border : colors.neutral[300] }]} />
      ) : null}
      {(title || showClose) && (
        <View style={styles.header}>
          {title ? (
            <Text style={[styles.title, { color: tokens.colors.textPrimary }]} numberOfLines={2}>
              {title}
            </Text>
          ) : (
            <View style={styles.flex} />
          )}
          {showClose ? (
            <Pressable
              onPress={onDismiss}
              style={[styles.closeBtn, { backgroundColor: tokens.colors.surfaceMuted }]}
              hitSlop={8}
              accessibilityRole="button"
              accessibilityLabel="Kapat"
            >
              <MaterialCommunityIcons name="close" size={20} color={tokens.colors.textSecondary} />
            </Pressable>
          ) : null}
        </View>
      )}
      {scrollable ? (
        <ScrollView
          style={styles.shrink}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: spacing.lg }}
        >
          {children}
        </ScrollView>
      ) : (
        <View style={fill ? styles.fill : styles.shrink}>{children}</View>
      )}
    </SafeAreaView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={isBottom ? 'slide' : 'fade'}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kbWrapper}
      >
        <Pressable
          style={[styles.overlay, isBottom ? styles.overlayBottom : styles.overlayCenter]}
          onPress={onDismiss}
        >
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[isBottom ? styles.kbBottom : styles.kbCenter, containerStyle]}
          >
            {body}
          </Pressable>
        </Pressable>
      </KeyboardAvoidingView>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: colors.overlay,
  },
  overlayBottom: { justifyContent: 'flex-end' },
  overlayCenter: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  kbWrapper: { flex: 1 },
  kbBottom: { width: '100%' },
  kbCenter: { width: '100%', maxWidth: 420 },
  bottomContainer: {
    overflow: 'hidden',
    borderTopLeftRadius: radius.xl,
    borderTopRightRadius: radius.xl,
  },
  centerContainer: {
    width: '100%',
    overflow: 'hidden',
    borderRadius: radius.xl,
  },
  body: {
    flexShrink: 1,
  },
  flex: { flex: 1 },
  fill: { flex: 1 },
  shrink: { flexShrink: 1 },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginTop: 10,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
    gap: spacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    flex: 1,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
});

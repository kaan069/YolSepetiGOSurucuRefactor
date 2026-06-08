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

export type FkModalVariant = 'bottom' | 'center';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  title?: string;
  children: React.ReactNode;
  variant?: FkModalVariant;
  scrollable?: boolean;
  maxHeightRatio?: number;
  contentStyle?: ViewStyle;
  showHandle?: boolean;
  showClose?: boolean;
}

export default function FkModal({
  visible,
  onDismiss,
  title,
  children,
  variant = 'bottom',
  scrollable = false,
  maxHeightRatio = 0.92,
  contentStyle,
  showHandle = true,
  showClose = true,
}: Props) {
  const { tokens, isDarkMode } = useFkTokens();

  const containerStyle =
    variant === 'bottom'
      ? [
          styles.bottomContainer,
          {
            backgroundColor: tokens.colors.cardBg,
            borderTopLeftRadius: tokens.radius.xl,
            borderTopRightRadius: tokens.radius.xl,
            maxHeight: `${Math.round(maxHeightRatio * 100)}%` as `${number}%`,
          },
        ]
      : [
          styles.centerContainer,
          {
            backgroundColor: tokens.colors.cardBg,
            borderRadius: tokens.radius.xl,
            maxHeight: `${Math.round(maxHeightRatio * 100)}%` as `${number}%`,
          },
        ];

  const overlayStyle =
    variant === 'bottom' ? styles.overlayBottom : styles.overlayCenter;

  const body = (
    <SafeAreaView edges={variant === 'bottom' ? ['bottom'] : []} style={contentStyle}>
      {(title || showClose) && (
        <View
          style={[
            styles.header,
            { borderBottomColor: tokens.colors.border, paddingHorizontal: tokens.spacing.lg, paddingVertical: tokens.spacing.lg },
          ]}
        >
          {variant === 'bottom' && showHandle ? (
            <View style={[styles.handle, { backgroundColor: tokens.colors.border }]} />
          ) : null}
          <View style={styles.headerRow}>
            {title ? (
              <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>{title}</Text>
            ) : (
              <View style={{ flex: 1 }} />
            )}
            {showClose ? (
              <Pressable
                onPress={onDismiss}
                style={[
                  styles.closeBtn,
                  { backgroundColor: isDarkMode ? '#2C2C2C' : '#f5f5f5' },
                ]}
                hitSlop={8}
              >
                <MaterialCommunityIcons
                  name="close"
                  size={20}
                  color={tokens.colors.textPrimary}
                />
              </Pressable>
            ) : null}
          </View>
        </View>
      )}
      {scrollable ? (
        <ScrollView
          style={{ maxHeight: 480 }}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={{ paddingBottom: tokens.spacing.lg }}
        >
          {children}
        </ScrollView>
      ) : (
        <View>{children}</View>
      )}
    </SafeAreaView>
  );

  return (
    <Modal
      visible={visible}
      transparent
      animationType={variant === 'bottom' ? 'slide' : 'fade'}
      onRequestClose={onDismiss}
      statusBarTranslucent
    >
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.kbWrapper}
      >
        <Pressable style={[styles.overlay, overlayStyle]} onPress={onDismiss}>
          <Pressable
            onPress={(e) => e.stopPropagation()}
            style={[
              variant === 'bottom' ? styles.kbBottom : styles.kbCenter,
              containerStyle,
            ]}
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
    backgroundColor: 'rgba(0,0,0,0.5)',
  },
  overlayBottom: { justifyContent: 'flex-end' },
  overlayCenter: { justifyContent: 'center', alignItems: 'center', padding: 20 },
  kbWrapper: { flex: 1 },
  kbBottom: { width: '100%' },
  kbCenter: { width: '100%', maxWidth: 460 },
  bottomContainer: { overflow: 'hidden' },
  centerContainer: { width: '100%', overflow: 'hidden' },
  header: {
    borderBottomWidth: 1,
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    marginBottom: 8,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
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

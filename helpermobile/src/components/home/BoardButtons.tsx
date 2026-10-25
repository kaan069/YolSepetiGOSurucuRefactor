/**
 * Ana ekranın alt butonları (ekranın %15'i): her biri bir pano içeriğinin detayını açar.
 * Tek satır, eşit genişlik; en fazla 4 buton (useDriverBoard sınırlar).
 */
import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import type { BoardButton } from '../../api/driverBoard';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, radius, shadows, spacing, text } from '../../theme/design';

const DEFAULT_ICON = 'bullhorn-outline';

interface Props {
  buttons: BoardButton[];
  onPress: (button: BoardButton) => void;
}

export default function BoardButtons({ buttons, onPress }: Props) {
  const { tokens, isDarkMode } = useFkTokens();

  return (
    <View style={styles.row}>
      {buttons.map((button) => (
        <TouchableOpacity
          key={button.id}
          style={[styles.button, { backgroundColor: tokens.colors.cardBg, borderColor: tokens.colors.border }]}
          activeOpacity={0.8}
          onPress={() => onPress(button)}
          accessibilityRole="button"
          accessibilityLabel={button.label}
        >
          <MaterialCommunityIcons
            // Admin'de yanlış yazılmış ikon adında "?" yerine varsayılan ikon
            name={button.icon && MaterialCommunityIcons.hasIcon(button.icon) ? button.icon : DEFAULT_ICON}
            size={22}
            color={colors.primary[isDarkMode ? 400 : 500]}
          />
          <Text style={[styles.label, { color: tokens.colors.textPrimary }]} numberOfLines={2}>
            {button.label}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  button: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingHorizontal: spacing.xs,
    borderRadius: radius.md,
    borderWidth: 1,
    ...shadows.sm,
  },
  label: {
    ...text.captionStrong,
    textAlign: 'center',
  },
});

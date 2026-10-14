import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { Appbar } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFkTokens } from '../../hooks/useFkTokens';
import { colors, spacing, text } from '../../theme/design';

interface AppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
  /**
   * 'default' = ortalanmış başlıklı üst bar (18/600, alt kenarlık)
   * 'large'   = sekme kökü ekranları için sola dayalı büyük başlık (26/700)
   */
  variant?: 'default' | 'large';
  /** Büyük başlığın altındaki açıklama (sadece variant="large") */
  subtitle?: string;
}

/**
 * Ortak AppBar komponenti - Tüm ekranlarda kullanılabilir
 *
 * @param title - AppBar başlığı
 * @param showBackButton - Geri tuşunu göster/gizle (varsayılan: true)
 * @param onBackPress - Geri tuşuna basıldığında çağrılacak özel fonksiyon (opsiyonel)
 * @param rightActions - AppBar'ın sağ tarafına eklenecek özel aksiyonlar (opsiyonel)
 *
 * @example
 * // Basit kullanım
 * <AppBar title="Profil" />
 *
 * @example
 * // Geri tuşu olmadan
 * <AppBar title="Ana Sayfa" showBackButton={false} />
 *
 * @example
 * // Özel geri tuşu fonksiyonu ile
 * <AppBar
 *   title="Düzenle"
 *   onBackPress={() => {
 *     // Değişiklikleri kaydet
 *     saveChanges();
 *     navigation.goBack();
 *   }}
 * />
 *
 * @example
 * // Sağ tarafta aksiyonlar ile
 * <AppBar
 *   title="Ayarlar"
 *   rightActions={
 *     <Appbar.Action icon="content-save" onPress={handleSave} />
 *   }
 * />
 */
export default function AppBar({
  title,
  showBackButton = true,
  onBackPress,
  rightActions,
  variant = 'default',
  subtitle,
}: AppBarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { tokens, isDarkMode } = useFkTokens();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  const iconColor = isDarkMode ? tokens.colors.textPrimary : colors.neutral[700];

  if (variant === 'large') {
    return (
      <View
        style={[
          styles.large,
          { paddingTop: insets.top + spacing.md, backgroundColor: tokens.colors.cardBg },
        ]}
      >
        <View style={styles.largeRow}>
          {showBackButton ? (
            <Appbar.Action icon="arrow-left" size={24} color={iconColor} onPress={handleGoBack} style={styles.largeBack} />
          ) : null}
          <View style={styles.largeTitles}>
            <Text style={[styles.largeTitle, { color: tokens.colors.textPrimary }]} numberOfLines={1}>
              {title}
            </Text>
            {subtitle ? (
              <Text style={[styles.largeSubtitle, { color: tokens.colors.textSecondary }]}>{subtitle}</Text>
            ) : null}
          </View>
          {rightActions ? <View style={styles.largeActions}>{rightActions}</View> : null}
        </View>
      </View>
    );
  }

  return (
    <Appbar.Header
      mode="center-aligned"
      statusBarHeight={insets.top}
      elevated={false}
      style={[
        styles.header,
        { backgroundColor: tokens.colors.cardBg, borderBottomColor: tokens.colors.border },
      ]}
    >
      {showBackButton ? (
        <Appbar.Action icon="arrow-left" size={24} color={iconColor} onPress={handleGoBack} />
      ) : null}
      <Appbar.Content
        title={title}
        titleStyle={[styles.title, { color: tokens.colors.textPrimary }]}
      />
      {rightActions}
    </Appbar.Header>
  );
}

const styles = StyleSheet.create({
  header: {
    elevation: 0,
    borderBottomWidth: 1,
  },
  title: {
    ...text.header,
  },
  large: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.md,
  },
  largeRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  largeBack: {
    marginLeft: -8,
    marginRight: 4,
  },
  largeTitles: {
    flex: 1,
  },
  largeTitle: {
    ...text.largeTitle,
  },
  largeSubtitle: {
    ...text.body,
    marginTop: 2,
  },
  largeActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

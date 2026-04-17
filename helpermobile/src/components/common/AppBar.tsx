import React from 'react';
import { Appbar, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

interface AppBarProps {
  title: string;
  showBackButton?: boolean;
  onBackPress?: () => void;
  rightActions?: React.ReactNode;
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
  rightActions
}: AppBarProps) {
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const theme = useTheme();
  const insets = useSafeAreaInsets();

  const handleGoBack = () => {
    if (onBackPress) {
      onBackPress();
    } else {
      navigation.goBack();
    }
  };

  return (
    <Appbar.Header
      statusBarHeight={insets.top}
      style={{
        backgroundColor: theme.colors.surface,
        elevation: 2,
      }}
    >
      {showBackButton && (
        <Appbar.BackAction onPress={handleGoBack} />
      )}
      <Appbar.Content title={title} titleStyle={{ fontWeight: '600' }} />
      {rightActions}
    </Appbar.Header>
  );
}

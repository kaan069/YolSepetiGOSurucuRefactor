import React, { useEffect } from 'react';
import { StyleSheet } from 'react-native';
import { Banner, useTheme } from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';

interface Props {
  visible: boolean;
  onDismiss: () => void;
}

type NavigationProps = NativeStackNavigationProp<RootStackParamList>;

export default function NewJobNotification({ visible, onDismiss }: Props) {
  const theme = useTheme();
  const navigation = useNavigation<NavigationProps>();

  useEffect(() => {
    // Hide the banner automatically after a few seconds
    if (visible) {
      const timer = setTimeout(() => {
        onDismiss();
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [visible, onDismiss]);

  return (
    <Banner
      visible={visible}
      actions={[
        {
          label: 'İşleri Gör',
          onPress: () => {
            onDismiss();
            navigation.navigate('Tabs', { screen: 'OrdersTab' });
          },
        },
        { label: 'Kapat', onPress: onDismiss },
      ]}
      icon="bell-ring"
      style={[styles.banner, { backgroundColor: theme.colors.primaryContainer }]}
    >
      Yakınınızda yeni bir yardım talebi var!
    </Banner>
  );
}

const styles = StyleSheet.create({
  banner: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    zIndex: 100, // Ensure it's on top
  },
});

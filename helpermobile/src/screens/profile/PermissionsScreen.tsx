import React, { useState, useCallback, useEffect } from 'react';
import { View, TouchableOpacity, Linking, Platform, AppState, AppStateStatus, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as IntentLauncher from 'expo-intent-launcher';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { useAppTheme } from '../../hooks/useAppTheme';
import AppBar from '../../components/common/AppBar';

type Props = NativeStackScreenProps<RootStackParamList, 'Permissions'>;

interface PermissionItemData {
  key: string;
  title: string;
  subtitle: string;
  icon: string;
  granted: boolean | null;
  onPress: () => void;
}

export default function PermissionsScreen({ navigation }: Props) {
  const { spacing, moderateScale } = useResponsive();
  const { appColors, screenBg, cardBg } = useAppTheme();
  const [bgLocationGranted, setBgLocationGranted] = useState<boolean | null>(null);
  const [notificationGranted, setNotificationGranted] = useState<boolean | null>(null);

  const checkPermissions = useCallback(async () => {
    try {
      const { status: bgStatus } = await Location.getBackgroundPermissionsAsync();
      setBgLocationGranted(bgStatus === 'granted');
    } catch {
      setBgLocationGranted(false);
    }

    try {
      const { status: notifStatus } = await Notifications.getPermissionsAsync();
      setNotificationGranted(notifStatus === 'granted');
    } catch {
      setNotificationGranted(false);
    }
  }, []);

  useEffect(() => {
    checkPermissions();

    const subscription = AppState.addEventListener('change', (nextState: AppStateStatus) => {
      if (nextState === 'active') {
        checkPermissions();
      }
    });

    return () => subscription.remove();
  }, [checkPermissions]);

  const handleOpenLocationSettings = async () => {
    if (Platform.OS === 'android') {
      try {
        await IntentLauncher.startActivityAsync(
          IntentLauncher.ActivityAction.APPLICATION_DETAILS_SETTINGS,
          { data: 'package:com.yolsepeti.mobile' }
        );
      } catch {
        await Linking.openSettings();
      }
    } else {
      await Linking.openSettings();
    }
  };

  const handleOpenNotificationSettings = async () => {
    await Linking.openSettings();
  };

  const permissionItems: PermissionItemData[] = [
    {
      key: 'background_location',
      title: 'Arka Plan Konum İzni',
      subtitle: 'Aktif iş sırasında konum paylaşımı için gerekli',
      icon: 'map-marker',
      granted: bgLocationGranted,
      onPress: handleOpenLocationSettings,
    },
    {
      key: 'notification',
      title: 'Bildirim İzni',
      subtitle: 'Yeni iş bildirimleri almak için gerekli',
      icon: 'bell',
      granted: notificationGranted,
      onPress: handleOpenNotificationSettings,
    },
  ];

  const renderPermissionItem = (item: PermissionItemData) => (
    <TouchableOpacity
      key={item.key}
      onPress={item.onPress}
      style={{ marginBottom: spacing.sm }}
    >
      <Card mode="outlined" style={{ backgroundColor: cardBg }}>
        <Card.Content style={{
          flexDirection: 'row',
          alignItems: 'center',
          paddingVertical: spacing.md,
        }}>
          <View style={{
            width: moderateScale(44),
            height: moderateScale(44),
            borderRadius: moderateScale(22),
            backgroundColor: appColors.primary[50],
            justifyContent: 'center',
            alignItems: 'center',
            marginRight: spacing.md,
          }}>
            <MaterialCommunityIcons
              name={item.icon}
              size={moderateScale(24)}
              color={appColors.primary[400]}
            />
          </View>

          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 2 }}>
              {item.title}
            </Text>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
              {item.subtitle}
            </Text>
          </View>

          {item.granted === null ? (
            <ActivityIndicator size="small" color={appColors.primary[400]} />
          ) : (
            <MaterialCommunityIcons
              name={item.granted ? 'check-circle' : 'close-circle'}
              size={moderateScale(28)}
              color={item.granted ? appColors.success : appColors.error}
            />
          )}
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }} edges={["bottom"]}>
      <AppBar title="İzinler" />
      <ScrollView style={{ flex: 1, padding: spacing.md }}>
        <Card mode="outlined" style={{ backgroundColor: cardBg, marginBottom: spacing.lg }}>
          <Card.Content style={{ alignItems: 'center', paddingVertical: spacing.lg }}>
            <MaterialCommunityIcons
              name="shield-check-outline"
              size={moderateScale(48)}
              color={appColors.primary[400]}
              style={{ marginBottom: spacing.md }}
            />
            <Text variant="titleMedium" style={{
              fontWeight: 'bold',
              textAlign: 'center',
              marginBottom: spacing.sm
            }}>
              Uygulama İzinleri
            </Text>
            <Text variant="bodyMedium" style={{
              color: appColors.text.secondary,
              textAlign: 'center',
              lineHeight: 22
            }}>
              Uygulamanın düzgün çalışması için aşağıdaki izinlerin verilmesi gerekmektedir. Bir izne dokunarak ayarlar ekranına gidebilirsiniz.
            </Text>
          </Card.Content>
        </Card>

        {permissionItems.map(renderPermissionItem)}
      </ScrollView>
    </SafeAreaView>
  );
}

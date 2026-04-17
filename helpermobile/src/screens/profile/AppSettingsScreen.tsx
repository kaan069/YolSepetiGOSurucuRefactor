import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Switch, List, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useThemeStore } from '../../store/useThemeStore';
import { useGuideStore } from '../../store/useGuideStore';

type Props = NativeStackScreenProps<RootStackParamList, 'AppSettings'>;

export default function AppSettingsScreen({ navigation }: Props) {
  const [pushNotifications, setPushNotifications] = React.useState(true);
  const [soundEnabled, setSoundEnabled] = React.useState(true);
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const paperTheme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]} edges={["bottom"]}>
      <AppBar title="Uygulama Ayarları" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        <Card style={styles.card}>
          <Card.Title title="Bildirimler" />
          <Card.Content>
            <View style={styles.settingRow}>
              <Text variant="bodyLarge">Push Bildirimleri</Text>
              <Switch value={pushNotifications} onValueChange={setPushNotifications} />
            </View>
            <View style={styles.settingRow}>
              <Text variant="bodyLarge">Ses Bildirimleri</Text>
              <Switch value={soundEnabled} onValueChange={setSoundEnabled} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Görünüm" />
          <Card.Content>
            <View style={styles.settingRow}>
              <Text variant="bodyLarge">Karanlık Mod</Text>
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Dil ve Bölge" />
          <Card.Content>
            <List.Item
              title="Dil Seçimi"
              description="Türkçe"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Rehber" />
          <Card.Content>
            <List.Item
              title="Tanıtım Slaytları"
              description="Uygulama tanıtım slaytlarını tekrar izleyin"
              left={(props) => <List.Icon {...props} icon="play-circle-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => navigation.navigate('Onboarding', { isModal: true })}
            />
            <List.Item
              title="Uygulama Rehberi"
              description="Ekran üzerinde adım adım rehberlik"
              left={(props) => <List.Icon {...props} icon="compass-outline" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
              onPress={() => {
                navigation.navigate('Tabs');
                setTimeout(() => {
                  useGuideStore.getState().startGuide();
                }, 500);
              }}
            />
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Title title="Hakkında" />
          <Card.Content>
            <List.Item
              title="Uygulama Sürümü"
              description="v1.0.0"
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="Geri Bildirim Gönder"
              left={(props) => <List.Icon {...props} icon="email" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </Card.Content>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20,
  },
  settingRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
});
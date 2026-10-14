import React from 'react';
import { StyleSheet, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, Switch, List, useTheme } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useThemeStore } from '../../store/useThemeStore';
import { useGuideStore } from '../../store/useGuideStore';
import { APP_VERSION } from '../../constants/appVersion';
import { colors } from '../../theme/design';
import { JobSection } from '../../components/job';

type Props = NativeStackScreenProps<RootStackParamList, 'AppSettings'>;

export default function AppSettingsScreen({ navigation }: Props) {
  const { isDarkMode, toggleDarkMode } = useThemeStore();
  const paperTheme = useTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: paperTheme.colors.background }]} edges={["bottom"]}>
      <AppBar title="Uygulama Ayarları" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        <JobSection title="Görünüm" icon="palette-outline" style={styles.card}>
            <View style={styles.settingRow}>
              <Text variant="bodyLarge">Karanlık Mod</Text>
              <Switch value={isDarkMode} onValueChange={toggleDarkMode} />
            </View>
          </JobSection>

        <JobSection title="Dil ve Bölge" icon="translate" style={styles.card}>
            <List.Item
              title="Dil Seçimi"
              description="Türkçe"
              left={(props) => <List.Icon {...props} icon="translate" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </JobSection>

        <JobSection title="Rehber" icon="map-legend" style={styles.card}>
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
          </JobSection>

        <JobSection title="Hakkında" icon="information-outline" style={styles.card}>
            <List.Item
              title="Uygulama Sürümü"
              description={`v${APP_VERSION}`}
              left={(props) => <List.Icon {...props} icon="information" />}
            />
            <List.Item
              title="Geri Bildirim Gönder"
              left={(props) => <List.Icon {...props} icon="email" />}
              right={(props) => <List.Icon {...props} icon="chevron-right" />}
            />
          </JobSection>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
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
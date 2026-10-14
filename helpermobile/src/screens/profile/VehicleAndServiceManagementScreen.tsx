import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FkMenuGroup, FkMenuItem } from '../../components/fk';
import { spacing } from '../../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleAndServiceManagement'>;

export default function VehicleAndServiceManagementScreen({ navigation }: Props) {
  const { screenBg } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Araç Yönetimi" />

      <ScrollView contentContainerStyle={styles.content}>
        <FkMenuGroup>
          <FkMenuItem
            icon="truck-outline"
            title="Araçlar"
            subtitle="Çekici, vinç, nakliye ve yol yardım araçlarım"
            onPress={() => navigation.navigate('VehiclesScreen')}
          />
        </FkMenuGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
});

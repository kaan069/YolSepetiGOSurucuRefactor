import React from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { FkMenuGroup, FkMenuItem } from '../../components/fk';
import { spacing } from '../../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentsAndContracts'>;

export default function DocumentsAndContractsScreen({ navigation }: Props) {
  const { screenBg } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Belgeler ve Sözleşmeler" />

      <ScrollView contentContainerStyle={styles.content}>
        <FkMenuGroup>
          <FkMenuItem
            icon="file-document-outline"
            title="Evraklarım"
            subtitle="Vergi levhası, ehliyet, araç fotoğrafı"
            onPress={() => navigation.navigate('DocumentsScreen')}
          />
          <FkMenuItem
            icon="file-sign"
            title="Sözleşmelerim"
            subtitle="Hizmet sözleşmesi, gizlilik politikası"
            onPress={() => navigation.navigate('ContractsScreen')}
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

import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentsAndContracts'>;

export default function DocumentsAndContractsScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();

  const menuItems = [
    {
      title: 'Evraklarım',
      subtitle: 'Vergi levhası, ehliyet, araç fotoğrafı',
      icon: 'file-document',
      onPress: () => navigation.navigate('DocumentsScreen'),
    },
    {
      title: 'Sözleşmelerim',
      subtitle: 'Hizmet sözleşmesi, gizlilik politikası',
      icon: 'file-contract',
      onPress: () => navigation.navigate('ContractsScreen'),
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Belgeler Ve Sözleşmeler" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} onPress={item.onPress} style={styles.menuItem}>
            <Card mode="outlined" style={[styles.menuCard, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.menuContent}>
                <MaterialCommunityIcons name={item.icon} size={24} color="#26a69a" style={styles.menuIcon} />
                <View style={styles.menuTextContainer}>
                  <Text variant="titleMedium" style={styles.menuTitle}>{item.title}</Text>
                  <Text variant="bodySmall" style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
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
  contentContainer: {
    paddingTop: 1,
  },
  header: {
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  menuItem: {
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#fff',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    color: '#666',
  },
});
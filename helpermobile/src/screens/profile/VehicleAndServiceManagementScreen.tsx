import React from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleAndServiceManagement'>;

export default function VehicleAndServiceManagementScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Araç Yönetimi" />

      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer}>
        <TouchableOpacity onPress={() => navigation.navigate('VehiclesScreen')} style={styles.menuItem}>
          <Card mode="outlined" style={[styles.menuCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.menuContent}>
              <MaterialCommunityIcons name="truck-outline" size={24} color="#26a69a" style={styles.menuIcon} />
              <View style={styles.menuTextContainer}>
                <Text variant="titleMedium" style={styles.menuTitle}>Araçlar</Text>
                <Text variant="bodySmall" style={styles.menuSubtitle}>Çekici, vinç, nakliye ve yol yardım araçlarım</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
            </Card.Content>
          </Card>
        </TouchableOpacity>
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
    marginBottom: 16,
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
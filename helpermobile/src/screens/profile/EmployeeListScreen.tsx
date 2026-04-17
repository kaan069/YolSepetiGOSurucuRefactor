import React, { useCallback, useState } from 'react';
import { View, FlatList, StyleSheet, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, FAB, IconButton, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useFocusEffect } from '@react-navigation/native';
import { AppBar } from '../../components/common';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { Employee } from '../../api/types';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeList'>;

export default function EmployeeListScreen({ navigation }: Props) {
  const { employees, loading, fetchEmployees, deleteEmployee } = useEmployeeStore();
  const { appColors, screenBg, cardBg, isDarkMode } = useAppTheme();
  const { spacing, moderateScale } = useResponsive();
  const [deleting, setDeleting] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchEmployees().catch(() => {});
    }, [])
  );

  const handleDelete = (employee: Employee) => {
    Alert.alert(
      'Eleman Sil',
      `${employee.first_name} ${employee.last_name} isimli elemanı silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            try {
              setDeleting(employee.id);
              await deleteEmployee(employee.id);
            } catch (error: any) {
              Alert.alert('Hata', 'Eleman silinirken bir hata oluştu.');
            } finally {
              setDeleting(null);
            }
          },
        },
      ]
    );
  };

  // TC numarasını maskele: 123****789
  const maskTC = (tc: string) => {
    if (!tc || tc.length < 6) return tc;
    return tc.substring(0, 3) + '****' + tc.substring(tc.length - 3);
  };

  const renderEmployee = ({ item }: { item: Employee }) => (
    <Card
      mode="outlined"
      style={[styles.card, { backgroundColor: cardBg }]}
    >
      <Card.Content style={styles.cardContent}>
        <View style={{ position: 'relative' }}>
          <View style={[styles.avatar, { backgroundColor: isDarkMode ? '#1a3a2a' : '#E8F5E9' }]}>
            <MaterialCommunityIcons
              name="account"
              size={moderateScale(24)}
              color={appColors.primary[400]}
            />
          </View>
          {item.user_is_online !== undefined && (
            <View style={{
              position: 'absolute',
              bottom: 0,
              right: 0,
              width: 12,
              height: 12,
              borderRadius: 6,
              backgroundColor: item.user_is_online ? '#4CAF50' : '#9E9E9E',
              borderWidth: 2,
              borderColor: cardBg,
            }} />
          )}
        </View>
        <View style={styles.info}>
          <Text variant="titleMedium" style={{ fontWeight: '600' }}>
            {item.first_name} {item.last_name}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, gap: 8 }}>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>
              {item.phone_number}
            </Text>
            {item.is_available !== undefined && (
              <View style={{
                backgroundColor: item.is_available ? '#E8F5E9' : '#FFF3E0',
                paddingHorizontal: 6,
                paddingVertical: 1,
                borderRadius: 4,
              }}>
                <Text style={{
                  fontSize: 10,
                  fontWeight: '600',
                  color: item.is_available ? '#2E7D32' : '#E65100',
                }}>
                  {item.is_available ? 'Müsait' : 'İşte'}
                </Text>
              </View>
            )}
          </View>
          <Text variant="bodySmall" style={{ color: appColors.text.secondary, marginTop: 1 }}>
            TC: {maskTC(item.tc_no)}
          </Text>
        </View>
        <View style={styles.actions}>
          <IconButton
            icon="pencil"
            size={20}
            onPress={() => navigation.navigate('EmployeeForm', { employeeId: item.id })}
          />
          <IconButton
            icon="delete"
            size={20}
            iconColor="#EF4444"
            onPress={() => handleDelete(item)}
            disabled={deleting === item.id}
          />
        </View>
      </Card.Content>
    </Card>
  );

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialCommunityIcons
        name="account-group-outline"
        size={moderateScale(64)}
        color={appColors.text.disabled}
      />
      <Text variant="titleMedium" style={{ color: appColors.text.secondary, marginTop: spacing.md }}>
        Henüz eleman eklenmemiş
      </Text>
      <Text variant="bodySmall" style={{ color: appColors.text.disabled, marginTop: spacing.xs, textAlign: 'center' }}>
        Sağ alttaki + butonuna tıklayarak yeni eleman ekleyebilirsiniz
      </Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Eleman Yönetimi" />

      {loading && employees.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={appColors.primary[400]} />
          <Text style={{ color: appColors.text.secondary, marginTop: spacing.md }}>
            Elemanlar yükleniyor...
          </Text>
        </View>
      ) : (
        <FlatList
          data={employees}
          keyExtractor={(item, index) => (item.id?.toString() ?? index.toString())}
          renderItem={renderEmployee}
          ListEmptyComponent={renderEmpty}
          contentContainerStyle={[
            styles.listContent,
            { padding: spacing.md },
            employees.length === 0 && styles.emptyList,
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}

      <FAB
        icon="plus"
        style={[styles.fab, { backgroundColor: appColors.primary[400] }]}
        color="#fff"
        onPress={() => navigation.navigate('EmployeeForm')}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContent: {
    paddingBottom: 80,
  },
  emptyList: {
    flex: 1,
    justifyContent: 'center',
  },
  card: {
    marginBottom: 12,
    borderRadius: 12,
  },
  cardContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  info: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  fab: {
    position: 'absolute',
    right: 16,
    bottom: 16,
    borderRadius: 28,
  },
});

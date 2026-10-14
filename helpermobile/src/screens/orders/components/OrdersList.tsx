import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import OrderCard from '../../../components/OrderCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyOrdersState from './EmptyOrdersState';
import { OrderStatus } from '../../../lib/types';
import { useAppTheme } from '../../../hooks/useAppTheme';
import { OrdersJob } from '../types';
import { FkInfoBanner } from '../../../components/fk';
import { colors, spacing } from '../../../theme/design';

interface OrdersListProps {
  jobs: OrdersJob[];
  loading: boolean;
  refreshing: boolean;
  filter: OrderStatus;
  onRefresh: () => void;
  onJobPress: (jobId: string, status: OrderStatus, movingType?: 'homeMoving' | 'cityMoving') => void;
}

export default function OrdersList({
  jobs,
  loading,
  refreshing,
  filter,
  onRefresh,
  onJobPress,
}: OrdersListProps) {
  const { appColors } = useAppTheme();

  if (loading && !refreshing) {
    return (
      <View style={styles.loadingContainer}>
        <LoadingSpinner size={80} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Talepler yükleniyor...</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={jobs}
      keyExtractor={(item) => {
        // Nakliye için movingType prefix ekle (evden eve ve şehirler arası aynı ID'ye sahip olabilir)
        if (item.movingType) {
          return `${item.movingType}-${item.id}`;
        }
        return `${item.serviceType}-${item.id}`;
      }}
      renderItem={({ item }) => (
        <OrderCard item={item} onPress={() => onJobPress(item.id, item.status, item.movingType)} />
      )}
      contentContainerStyle={styles.listContent}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={[colors.primary[500]]}
          tintColor={colors.primary[500]}
        />
      }
      ListHeaderComponent={
        filter === 'in_progress' && jobs.length > 0 ? (
          <FkInfoBanner
            type="warning"
            style={styles.infoBanner}
            message="Uygulamayı arka planda veya açık şekilde kullanın, aksi takdirde müşteriye konumunuz gitmez. İptal durumlarında ücret iadesi sözleşmedeki şartlara göre yapılır."
          />
        ) : null
      }
      ListEmptyComponent={<EmptyOrdersState filter={filter} />}
    />
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  loadingText: {
    marginTop: spacing.sm + 4,
    fontSize: 15,
  },
  listContent: {
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    flexGrow: 1,
  },
  infoBanner: {
    marginBottom: spacing.xs,
  },
});

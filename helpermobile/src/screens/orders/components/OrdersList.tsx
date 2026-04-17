import React from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import OrderCard from '../../../components/OrderCard';
import LoadingSpinner from '../../../components/LoadingSpinner';
import EmptyOrdersState from './EmptyOrdersState';
import { OrderStatus } from '../../../lib/types';
import { useAppTheme } from '../../../hooks/useAppTheme';

interface Job {
  id: string;
  serviceType: 'crane' | 'tow' | 'transport' | 'nakliye' | 'roadAssistance' | 'transfer';
  vehicleType: string;
  movingType?: 'homeMoving' | 'cityMoving'; // Nakliye için hangi tür olduğunu belirtir
  from: {
    lat: number;
    lng: number;
    address: string;
  };
  to: {
    lat: number;
    lng: number;
    address: string;
  };
  distance: number;
  estimatedPrice: number;
  status: OrderStatus;
  createdAt: Date;
  description: string;
}

interface OrdersListProps {
  jobs: Job[];
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
  const { isDarkMode, appColors } = useAppTheme();

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
          colors={['#26a69a']}
          tintColor="#26a69a"
        />
      }
      ListHeaderComponent={
        filter === 'in_progress' && jobs.length > 0 ? (
          <View style={[styles.infoBanner, {
            backgroundColor: isDarkMode ? '#3e2e00' : '#FFF3E0',
            borderColor: '#FFB74D',
          }]}>
            <Text style={[styles.infoBannerText, { color: isDarkMode ? '#FFB74D' : '#E65100' }]}>
              ℹ️ Uygulamayı arka planda veya açık şekilde kullanın, aksi takdirde müşteriye konumunuz gitmez. İptal durumlarında ücret iadesi sözleşmedeki şartlara göre yapılır.
            </Text>
          </View>
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
    marginTop: 8,
    fontSize: 16,
  },
  listContent: {
    paddingBottom: 8,
  },
  infoBanner: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
  },
  infoBannerText: {
    fontSize: 13,
    lineHeight: 18,
  },
});

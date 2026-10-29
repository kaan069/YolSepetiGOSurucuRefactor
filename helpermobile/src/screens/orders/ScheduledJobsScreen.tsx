/**
 * Randevulu İşlerim
 *
 * Teklifi kabul edilmiş (ödeme bekleyen / devam eden), henüz yola çıkılmamış randevulu işler;
 * çekici, vinç, evden eve, şehirden şehire ve transfer tek listede, randevu tarihine göre sıralı.
 * Bu işler devam eden listelerinde görünmez; sürücü yola çıkınca (detaydaki "Yola Çık")
 * buradan çıkıp hizmetin devam eden listesine geçer.
 */
import React, { useCallback, useMemo, useState } from 'react';
import { FlatList, RefreshControl, StyleSheet, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { requestsAPI } from '../../api';
import type { ScheduledJob } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import LoadingSpinner from '../../components/LoadingSpinner';
import OrderCard from '../../components/OrderCard';
import { FkEmptyState } from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useJobCountsStore } from '../../store/useJobCountsStore';
import { logger } from '../../utils/logger';
import { colors, spacing } from '../../theme/design';
import { OrdersJob } from './types';
import { scheduledJobToJob } from './jobMappers';

type Props = NativeStackScreenProps<RootStackParamList, 'ScheduledJobs'>;

interface ScheduledListItem {
  job: OrdersJob;
  source: ScheduledJob;
}

function toListItem(source: ScheduledJob): ScheduledListItem | null {
  const job = scheduledJobToJob(source);
  return job ? { job, source } : null;
}

export default function ScheduledJobsScreen({ navigation }: Props) {
  const { screenBg } = useAppTheme();
  const [items, setItems] = useState<ScheduledListItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [failed, setFailed] = useState(false);

  const load = useCallback(async () => {
    try {
      const jobs = await requestsAPI.getScheduledJobs();
      const list = jobs.map(toListItem).filter((i): i is ScheduledListItem => i !== null);
      setItems(list);
      setFailed(false);
      // Siparişler'deki Randevu butonunun sayısı listeyle tutarlı kalsın
      const count = (types: string[]) => jobs.filter((j) => types.includes(j.serviceType)).length;
      useJobCountsStore.getState().setScheduledCounts({
        tow: count(['tow']),
        crane: count(['crane']),
        nakliye: count(['home_moving', 'city_moving']),
        transfer: count(['transfer']),
      });
    } catch (error: any) {
      logger.error('orders', 'ScheduledJobs.load failure', { status: error?.response?.status });
      setFailed(true);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  // Detaydan (ör. yola çıkış) dönünce liste yenilensin
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load]),
  );

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  const openJob = useCallback(
    ({ job, source }: ScheduledListItem) => {
      switch (source.serviceType) {
        case 'tow':
          navigation.navigate('JobDetail', { jobId: job.id });
          break;
        case 'crane':
          navigation.navigate('CraneJobDetail', { jobId: job.id });
          break;
        case 'home_moving':
          navigation.navigate('NakliyeJobDetail', { jobId: job.id, movingType: 'home' });
          break;
        case 'city_moving':
          navigation.navigate('NakliyeJobDetail', { jobId: job.id, movingType: 'city' });
          break;
        case 'transfer':
          navigation.navigate('TransferJobDetail', { jobId: job.id });
          break;
      }
    },
    [navigation],
  );

  const empty = useMemo(() => {
    if (failed) {
      return (
        <FkEmptyState
          icon="wifi-off"
          title="Randevulu işler yüklenemedi"
          message="İnternet bağlantınızı kontrol edip tekrar deneyin."
          actionLabel="Tekrar Dene"
          onAction={onRefresh}
          actionVariant="secondary"
        />
      );
    }
    return (
      <FkEmptyState
        icon="calendar-blank-outline"
        title="Randevulu işiniz yok"
        message="Teklifi kabul edilen randevulu işleriniz burada tarih sırasıyla görünür."
      />
    );
  }, [failed, onRefresh]);

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title="Randevulu İşlerim" />
      {loading ? (
        <View style={styles.center}>
          <LoadingSpinner size={80} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => `${item.source.serviceType}-${item.job.id}`}
          renderItem={({ item }) => <OrderCard item={item.job} onPress={() => openJob(item)} />}
          contentContainerStyle={[styles.list, items.length === 0 && styles.emptyList]}
          ListEmptyComponent={empty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={[colors.primary[500]]}
              tintColor={colors.primary[500]}
            />
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  list: { padding: spacing.md - 4, paddingBottom: spacing.xl },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
});

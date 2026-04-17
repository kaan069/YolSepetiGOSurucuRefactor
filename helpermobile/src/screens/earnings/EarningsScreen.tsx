import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import LoadingSpinner from '../../components/LoadingSpinner';
import useEarnings from './hooks/useEarnings';
import TotalEarningsCard from './components/TotalEarningsCard';
import PeriodSelector from './components/PeriodSelector';
import ServiceTypeFilter from './components/ServiceTypeFilter';
import PeriodStatsCard from './components/PeriodStatsCard';
import JobHistorySection from './components/JobHistorySection';

import { CompletedJob } from './constants';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'EarningsTab'>;

export default function EarningsScreen({ navigation }: Props) {
  const { screenBg } = useAppTheme();
  const {
    range,
    setRange,
    selectedServiceTypes,
    userServiceTypes,
    totalEarnings,
    earningsLoading,
    periodEarnings,
    periodLoading,
    earningsList,
    earningsListTotal,
    hasMoreEarnings,
    loadingMore,
    listLoading,
    formattedJobs,
    toggleServiceTypeFilter,
    clearFilters,
    loadMoreEarnings,
  } = useEarnings();

  // İşe tıklandığında doğru detay ekranına git
  const handleJobPress = (job: CompletedJob) => {
    switch (job.serviceType) {
      case 'towTruck':
        navigation.navigate('JobDetail', { jobId: job.id, fromScreen: 'Earnings' });
        break;
      case 'crane':
        navigation.navigate('CraneJobDetail', { jobId: job.id });
        break;
      case 'roadAssistance':
        navigation.navigate('RoadAssistanceJobDetail', { jobId: job.id });
        break;
      case 'homeMoving':
      case 'homeToHomeMoving':
        navigation.navigate('NakliyeJobDetail', { jobId: job.id, movingType: 'home' });
        break;
      case 'cityMoving':
      case 'cityToCity':
        navigation.navigate('NakliyeJobDetail', { jobId: job.id, movingType: 'city' });
        break;
    }
  };

  if (listLoading && earningsList.length === 0) {
    return (
      <SafeAreaView style={[{ flex: 1, backgroundColor: screenBg }, styles.centered]} edges={['top', 'left', 'right']}>
        <LoadingSpinner size={80} />
        <Text style={{ marginTop: 16 }}>Kazanç listesi yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: screenBg }} edges={['top', 'left', 'right']}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <TotalEarningsCard totalEarnings={totalEarnings} loading={earningsLoading} />

        <PeriodSelector range={range} onRangeChange={setRange} />

        <ServiceTypeFilter
          selectedServiceTypes={selectedServiceTypes}
          userServiceTypes={userServiceTypes}
          onToggle={toggleServiceTypeFilter}
          onClear={clearFilters}
        />

        <PeriodStatsCard
          periodEarnings={periodEarnings}
          periodLoading={periodLoading}
          userServiceTypes={userServiceTypes}
        />

        <JobHistorySection
          jobs={formattedJobs}
          listLoading={listLoading}
          hasMore={hasMoreEarnings}
          loadingMore={loadingMore}
          totalCount={earningsListTotal}
          currentCount={earningsList.length}
          selectedServiceTypes={selectedServiceTypes}
          onJobPress={handleJobPress}
          onLoadMore={loadMoreEarnings}
          onClearFilters={clearFilters}
        />


      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  centered: { justifyContent: 'center', alignItems: 'center' },
  scrollView: { flex: 1 },
  scrollContent: { padding: 16, paddingBottom: 40 },
});

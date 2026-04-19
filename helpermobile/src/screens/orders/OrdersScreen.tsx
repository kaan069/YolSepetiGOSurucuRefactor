import React, { useEffect, useCallback, useRef } from 'react';
import { StyleSheet, View, Vibration } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRoute } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { OrderStatus } from '../../lib/types';
import { useResponsive } from '../../hooks/useResponsive';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useJobsWebSocket } from '../../hooks/useJobsWebSocket';
import { ServiceType } from '../../constants/serviceTypes';
import { useCancellationEventStore } from '../../store/useCancellationEventStore';
import { useJobUpdateEventStore } from '../../store/useJobUpdateEventStore';
import { useJobCountsStore } from '../../store/useJobCountsStore';
import { useAuthStore } from '../../store/authStore';

// Components
import ServiceTypeTabs from './components/ServiceTypeTabs';
import OrdersTabs from './components/OrdersTabs';
import MyJobsTabs from './components/MyJobsTabs';
import OrdersList from './components/OrdersList';

// Hooks
import { useOrdersFilters } from './hooks/useOrdersFilters';
import { useOrdersData, ServiceFilterType } from './hooks/useOrdersData';

// Canonical ServiceType -> Screen service filter mapping
const wsServiceToFilter: Record<ServiceType, ServiceFilterType> = {
  towTruck: 'tow',
  crane: 'crane',
  homeToHomeMoving: 'nakliye',
  cityToCity: 'nakliye',
  roadAssistance: 'roadAssistance',
  transfer: 'transfer',
};

// Status -> mainTab ve filter mapping
const getTabAndFilterForStatus = (status?: string): { mainTab: 'incoming' | 'my_jobs'; filter: OrderStatus } => {
  switch (status) {
    case 'pending':
      return { mainTab: 'incoming', filter: 'pending' };
    case 'accepted':
    case 'awaiting_approval':
      return { mainTab: 'my_jobs', filter: 'awaiting_approval' };
    case 'awaiting_payment':
      return { mainTab: 'my_jobs', filter: 'awaiting_payment' };
    case 'in_progress':
      return { mainTab: 'my_jobs', filter: 'in_progress' };
    case 'completed':
      return { mainTab: 'my_jobs', filter: 'completed' };
    case 'cancelled':
      return { mainTab: 'incoming', filter: 'pending' };
    default:
      return { mainTab: 'incoming', filter: 'pending' };
  }
};

const validCountStatuses = ['pending', 'awaiting_approval', 'awaiting_payment', 'in_progress'];

import { useUserServiceTypes } from './hooks/useUserServiceTypes';
import { useOrdersNavigation } from './hooks/useOrdersNavigation';

type RouteType = NativeStackScreenProps<RootStackParamList, 'Orders'>['route'];

export default function OrdersScreen() {
  const route = useRoute<RouteType>();
  const { spacing } = useResponsive();
  const { screenBg } = useAppTheme();

  // Filter state management (useReducer - atomik state geçişi)
  const {
    mainTab,
    filter,
    serviceFilter,
    handleMainTabChange,
    handleFilterChange,
    handleServiceFilterChange,
    setAllFilters,
    setFilter,
    setServiceFilter,
    setMainTab,
  } = useOrdersFilters();

  // Data fetching
  const {
    filteredJobs,
    loading,
    refreshing,
    onRefresh,
    fetchCraneRequests,
    fetchTowTruckRequests,
    fetchNakliyeRequests,
    fetchRoadAssistanceRequests,
    fetchTransferRequests,
    fetchAllServicesJobCounts,
    jobCounts,
  } = useOrdersData({ serviceFilter, filter });

  // User service types
  const { userServiceTypes } = useUserServiceTypes(handleServiceFilterChange);

  // Navigation
  const { navigateToJob } = useOrdersNavigation(serviceFilter);

  // WebSocket refresh helper
  const refreshByServiceType = useCallback((serviceType: ServiceType) => {
    if (serviceType === 'towTruck') {
      fetchTowTruckRequests();
    } else if (serviceType === 'crane') {
      fetchCraneRequests();
    } else if (serviceType === 'homeToHomeMoving' || serviceType === 'cityToCity') {
      fetchNakliyeRequests();
    } else if (serviceType === 'roadAssistance') {
      fetchRoadAssistanceRequests();
    } else if (serviceType === 'transfer') {
      fetchTransferRequests();
    }
  }, [fetchTowTruckRequests, fetchCraneRequests, fetchNakliyeRequests, fetchRoadAssistanceRequests, fetchTransferRequests]);

  // WebSocket'ten gelen iş için otomatik sekme değişimi
  const autoNavigateToJob = useCallback((serviceType: ServiceType, status?: string) => {
    const targetServiceFilter = wsServiceToFilter[serviceType];
    const { mainTab: targetMainTab, filter: targetFilter } = getTabAndFilterForStatus(status);
    setAllFilters(targetMainTab, targetFilter, targetServiceFilter);
  }, [setAllFilters]);

  // Real-time job notifications via WebSocket
  useJobsWebSocket({
    onNewJob: useCallback((serviceType: ServiceType, _data: any) => {
      Vibration.vibrate(200);
      const storeKey = wsServiceToFilter[serviceType];
      // Backend'den counts geldiyse direkt kullan
      if (_data?.counts) {
        useJobCountsStore.getState().updateServiceCounts(storeKey, _data.counts);
      } else {
        useJobCountsStore.getState().incrementCount(storeKey, 'pending');
      }
      autoNavigateToJob(serviceType, 'pending');
      refreshByServiceType(serviceType);
    }, [autoNavigateToJob, refreshByServiceType]),
    onJobUpdated: useCallback((serviceType: ServiceType, data: any) => {
      const newStatus = data?.status;
      const oldStatus = data?.old_status;
      const jobId = data?.job?.id || data?.job_id || data?.id;
      const acceptedDriverId = data?.accepted_driver_id;
      const storeKey = wsServiceToFilter[serviceType];

      // accepted_driver_id kontrolü: başka sürücü kabul edildiyse sadece listeyi yenile
      const myUserId = useAuthStore.getState().currentUser?.id;
      if (acceptedDriverId !== null && acceptedDriverId !== undefined && myUserId) {
        const myId = typeof myUserId === 'string' ? parseInt(myUserId) : myUserId;
        if (acceptedDriverId !== myId) {
          // Başka sürücü kabul edildi - sayıları güncelle ve listeyi yenile
          if (oldStatus && validCountStatuses.includes(oldStatus)) {
            useJobCountsStore.getState().decrementCount(storeKey, oldStatus as any);
          }
          refreshByServiceType(serviceType);
          fetchAllServicesJobCounts();
          return; // Benim işim değil, sekme değiştirme
        }
      }

      // İş detay ekranına event gönder (ödeme yapıldığında vs. otomatik güncelleme)
      if (jobId) {
        useJobUpdateEventStore.getState().setJobUpdated(jobId, newStatus);
      }

      // Sayıları güncelle
      if (oldStatus && validCountStatuses.includes(oldStatus)) {
        useJobCountsStore.getState().decrementCount(storeKey, oldStatus as any);
      }
      if (newStatus && validCountStatuses.includes(newStatus)) {
        useJobCountsStore.getState().incrementCount(storeKey, newStatus as any);
      }

      // Backend'den counts geldiyse direkt kullan (en doğru değer)
      if (data?.counts) {
        useJobCountsStore.getState().updateServiceCounts(storeKey, data.counts);
      }

      if (newStatus) {
        autoNavigateToJob(serviceType, newStatus);
      }
      refreshByServiceType(serviceType);
      if (newStatus === 'completed' || newStatus === 'cancelled') {
        fetchAllServicesJobCounts();
      }
    }, [autoNavigateToJob, refreshByServiceType, fetchAllServicesJobCounts]),
    onJobCancelled: useCallback((serviceType: ServiceType, data: any) => {
      const storeKey = wsServiceToFilter[serviceType];

      // Backend'den counts geldiyse direkt kullan
      if (data?.counts) {
        useJobCountsStore.getState().updateServiceCounts(storeKey, data.counts);
      } else {
        const cancelledFromStatus = data?.old_status || data?.status;
        if (cancelledFromStatus && validCountStatuses.includes(cancelledFromStatus)) {
          useJobCountsStore.getState().decrementCount(storeKey, cancelledFromStatus as any);
        }
        fetchAllServicesJobCounts();
      }

      refreshByServiceType(serviceType);
      if (data?.job_id) {
        useCancellationEventStore.getState().setCancelledJob(data.job_id, serviceType);
      }
    }, [refreshByServiceType, fetchAllServicesJobCounts]),
    enabled: true,
  });

  // İlk yükleme flag'i - sadece bir kez veri çekilsin
  const initialLoadDone = useRef(false);

  // Route params'dan gelen filtre ayarlarını uygula (atomik)
  useEffect(() => {
    const paramServiceFilter = route.params?.serviceFilter as ServiceFilterType | undefined;
    const paramFilter = route.params?.filter as OrderStatus | undefined;

    if (paramServiceFilter && paramFilter) {
      const targetMainTab = paramFilter === 'pending' ? 'incoming' as const : 'my_jobs' as const;
      setAllFilters(targetMainTab, paramFilter, paramServiceFilter);
    } else if (paramServiceFilter) {
      setServiceFilter(paramServiceFilter);
    } else if (paramFilter) {
      setFilter(paramFilter);
      setMainTab(paramFilter === 'pending' ? 'incoming' : 'my_jobs');
    }
  }, [route.params?.serviceFilter, route.params?.filter, route.params?.timestamp, setAllFilters, setServiceFilter, setFilter, setMainTab]);

  // İlk yüklemede verileri çek (sadece bir kez)
  useEffect(() => {
    if (!initialLoadDone.current) {
      fetchCraneRequests();
      fetchTowTruckRequests();
      fetchNakliyeRequests();
      fetchRoadAssistanceRequests();
      fetchTransferRequests();
      initialLoadDone.current = true;
    }
  }, [fetchCraneRequests, fetchTowTruckRequests, fetchNakliyeRequests, fetchRoadAssistanceRequests, fetchTransferRequests]);

  // Handle job card press
  const handleCardPress = useCallback(
    (jobId: string, status: OrderStatus, movingType?: 'homeMoving' | 'cityMoving') => {
      navigateToJob(jobId, status, movingType);
    },
    [navigateToJob]
  );

  const dynamicStyles = {
    container: {
      flex: 1,
      paddingHorizontal: spacing.sm,
    },
  };

  return (
    <View style={[styles.flexContainer, { backgroundColor: screenBg }]}>
      <SafeAreaView style={dynamicStyles.container} edges={['top', 'left', 'right']}>
        {/* Hizmet Türü Butonları */}
        <ServiceTypeTabs
          serviceTypes={userServiceTypes}
          selectedType={serviceFilter}
          onTypeChange={handleServiceFilterChange}
          hasActiveJobs={jobCounts.awaiting_approval + jobCounts.awaiting_payment + jobCounts.in_progress > 0}
        />

        {/* Ana Tab Butonları (Gelen İşler / Benim İşlerim) */}
        <OrdersTabs
          mainTab={mainTab}
          onMainTabChange={handleMainTabChange}
          hasIncoming={jobCounts.pending > 0}
          hasInProgress={jobCounts.in_progress > 0}
          incomingCount={jobCounts.pending}
          hasActiveJobs={jobCounts.awaiting_approval + jobCounts.awaiting_payment + jobCounts.in_progress > 0}
        />

        {/* Alt Tab Butonları (Benim İşlerim sekmesinde görünür) */}
        <MyJobsTabs
          filter={filter}
          onFilterChange={handleFilterChange}
          visible={mainTab === 'my_jobs'}
          hasAwaitingApproval={jobCounts.awaiting_approval > 0}
          hasAwaitingPayment={jobCounts.awaiting_payment > 0}
          hasInProgress={jobCounts.in_progress > 0}
          serviceFilter={serviceFilter}
        />

        {/* İş Listesi */}
        <OrdersList
          jobs={filteredJobs}
          loading={loading}
          refreshing={refreshing}
          filter={filter}
          onRefresh={onRefresh}
          onJobPress={handleCardPress}
        />
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
});

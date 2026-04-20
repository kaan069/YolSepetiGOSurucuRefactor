import { useState, useEffect, useCallback, useMemo } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { requestsAPI, authAPI, PeriodEarningsResponse, EarningsListItem, EarningsServiceType } from '../../../api';
import { PeriodRange, CompletedJob, PAGE_SIZE } from '../constants';
import { logger } from '../../../utils/logger';

// Backend user_type → EarningsServiceType mapping
const USER_TYPE_TO_EARNINGS: Record<string, EarningsServiceType[]> = {
  towTruck: ['towTruck'],
  crane: ['crane'],
  roadAssistance: ['roadAssistance'],
  homeToHomeMoving: ['homeToHomeMoving'],
  cityToCity: ['cityToCity'],
  transfer: ['transfer'],
};

export default function useEarnings() {
  const [range, setRange] = useState<PeriodRange>('month');
  const [selectedServiceTypes, setSelectedServiceTypes] = useState<EarningsServiceType[]>([]);
  const [userServiceTypes, setUserServiceTypes] = useState<EarningsServiceType[]>([]);
  const [totalEarnings, setTotalEarnings] = useState(0);
  const [earningsLoading, setEarningsLoading] = useState(false);
  const [periodEarnings, setPeriodEarnings] = useState<PeriodEarningsResponse | null>(null);
  const [periodLoading, setPeriodLoading] = useState(false);
  const [earningsList, setEarningsList] = useState<EarningsListItem[]>([]);
  const [earningsListPage, setEarningsListPage] = useState(1);
  const [earningsListTotal, setEarningsListTotal] = useState(0);
  const [hasMoreEarnings, setHasMoreEarnings] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [listLoading, setListLoading] = useState(false);

  const loadTotalEarnings = async () => {
    try {
      setEarningsLoading(true);
      const result = await requestsAPI.getTotalEarnings();
      setTotalEarnings(parseFloat(result.total_earnings) || 0);
    } catch (error) {
      logger.error('orders', 'Toplam kazan yklenirken hata');
      setTotalEarnings(0);
    } finally {
      setEarningsLoading(false);
    }
  };

  const loadPeriodEarnings = async () => {
    try {
      setPeriodLoading(true);
      const serviceTypes = selectedServiceTypes.length > 0 ? selectedServiceTypes : undefined;
      const result = await requestsAPI.getPeriodEarnings(range, undefined, undefined, serviceTypes);
      setPeriodEarnings(result);
    } catch (error) {
      logger.error('orders', 'Dnemsel kazan yklenirken hata');
      setPeriodEarnings(null);
    } finally {
      setPeriodLoading(false);
    }
  };

  const loadEarningsList = async (page: number = 1, append: boolean = false) => {
    try {
      if (page === 1) setListLoading(true);
      else setLoadingMore(true);

      const serviceTypeParam = selectedServiceTypes.length > 0
        ? selectedServiceTypes.join(',')
        : undefined;

      const result = await requestsAPI.getEarningsList({
        page,
        page_size: PAGE_SIZE,
        period: range,
        service_type: serviceTypeParam,
      });

      if (append) {
        setEarningsList(prev => [...prev, ...result.results]);
      } else {
        setEarningsList(result.results);
      }

      setEarningsListTotal(result.count);
      setEarningsListPage(page);
      setHasMoreEarnings(result.next !== null);
    } catch (error: any) {
      logger.error('orders', 'Kazan listesi yklenirken hata');
      if (error?.response?.status !== 401) {
        Alert.alert('Hata', 'Kazanç listesi yüklenirken bir hata oluştu.');
      }
    } finally {
      setListLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMoreEarnings = () => {
    if (hasMoreEarnings && !loadingMore) {
      loadEarningsList(earningsListPage + 1, true);
    }
  };

  const toggleServiceTypeFilter = (serviceType: EarningsServiceType) => {
    setSelectedServiceTypes(prev =>
      prev.includes(serviceType)
        ? prev.filter(t => t !== serviceType)
        : [...prev, serviceType]
    );
  };

  // Nakliye filtresi (evden eve + şehirler arası birlikte toggle)
  const toggleNakliyeFilter = () => {
    const hasHome = selectedServiceTypes.includes('homeToHomeMoving');
    const hasCity = selectedServiceTypes.includes('cityToCity');
    if (hasHome && hasCity) {
      setSelectedServiceTypes(prev => prev.filter(t => t !== 'homeToHomeMoving' && t !== 'cityToCity'));
    } else {
      setSelectedServiceTypes(prev => {
        const filtered = prev.filter(t => t !== 'homeToHomeMoving' && t !== 'cityToCity');
        return [...filtered, 'homeToHomeMoving', 'cityToCity'];
      });
    }
  };

  const clearFilters = () => setSelectedServiceTypes([]);

  // Kullanıcının hizmet tiplerini yükle
  const loadUserServiceTypes = async () => {
    try {
      const user = await authAPI.getUser();
      if (user?.user_type && Array.isArray(user.user_type)) {
        const types: EarningsServiceType[] = [];
        user.user_type.forEach((t: string) => {
          const mapped = USER_TYPE_TO_EARNINGS[t];
          if (mapped) {
            mapped.forEach(m => { if (!types.includes(m)) types.push(m); });
          }
        });
        setUserServiceTypes(types);
      }
    } catch (error) {
      logger.error('orders', 'Kullanc hizmet tipleri yklenemedi');
    }
  };

  // Ekran focus olduğunda yükle
  useFocusEffect(
    useCallback(() => {
      loadUserServiceTypes();
      loadTotalEarnings();
      loadPeriodEarnings();
      loadEarningsList(1, false);
    }, [])
  );

  // Range veya filtre değiştiğinde yeniden yükle
  useEffect(() => {
    loadPeriodEarnings();
    loadEarningsList(1, false);
  }, [range, selectedServiceTypes]);

  // Formatlanmış iş listesi
  const formattedJobs: CompletedJob[] = useMemo(() => {
    return earningsList.map(item => ({
      id: item.request_id.toString(),
      finishedAt: item.earned_at,
      amount: parseFloat(item.net_amount) || 0,
      distanceKm: 0,
      pickupAddress: '',
      dropoffAddress: '',
      serviceType: item.service_type,
    }));
  }, [earningsList]);

  return {
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
    toggleNakliyeFilter,
    clearFilters,
    loadMoreEarnings,
  };
}

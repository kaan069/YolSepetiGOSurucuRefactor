// This screen displays a list of jobs, filterable by status (pending, accepted).
// Bu ekran, işlerin durumlarına göre (bekleyen, kabul edilen) filtrelenebilen bir listesini görüntüler.
import React, { useMemo, useState, useEffect, useCallback } from 'react';
import { FlatList, StyleSheet, View, RefreshControl, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, SegmentedButtons, ActivityIndicator } from 'react-native-paper';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { NativeStackNavigationProp, NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import OrderCard from '../components/OrderCard';
import { OrderStatus } from '../lib/types';
import { requestsAPI, CraneRequest, TowTruckRequestDetail, authAPI } from '../api';
import * as Location from 'expo-location';
import { useResponsive } from '../hooks/useResponsive';
import { useAppTheme } from '../hooks/useAppTheme';

// Navigation type for stack navigation
// Stack navigation için navigation type
type NavigationType = NativeStackNavigationProp<RootStackParamList>;
type RouteType = NativeStackScreenProps<RootStackParamList, 'Orders'>['route'];

// Tab navigator için props
// Props for tab navigator
type Props = {};

export default function OrdersScreen({ }: Props) {
  // Get navigation from hook
  // Navigation'ı hook'tan al
  const navigation = useNavigation<NavigationType>();
  const route = useRoute<RouteType>();
  const { spacing, fontSize } = useResponsive();
  const { screenBg, isDarkMode, appColors } = useAppTheme();

  // Store artık kullanılmıyor - sadece backend data
  // const { dismissedJobIds, dismissJob, undoDismiss} = useJobStore();

  // State to manage main tab (incoming vs my_jobs)
  // Ana sekme durumunu yönetmek için state (gelen işler vs benim işlerim)
  const [mainTab, setMainTab] = useState<'incoming' | 'my_jobs'>('incoming');
  // State to manage the current job status filter.
  // Mevcut iş durumu filtresini yönetmek için state.
  const [filter, setFilter] = useState<OrderStatus>('pending');
  // State to manage the service type filter (tow/crane/transport)
  // Hizmet türü filtresini yönetmek için state (çekici/vinç/nakliye)
  const [serviceFilter, setServiceFilter] = useState<'tow' | 'crane' | 'transport'>('tow');
  // State for crane requests from backend
  // Backend'den gelen vinç talepleri için state
  const [craneRequests, setCraneRequests] = useState<CraneRequest[]>([]);
  // State for tow truck requests from backend
  // Backend'den gelen çekici talepleri için state
  const [towTruckRequests, setTowTruckRequests] = useState<TowTruckRequestDetail[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  // State for requests with resolved addresses
  // Adresleri çözümlenmiş talepler için state
  const [requestsWithAddresses, setRequestsWithAddresses] = useState<{
    crane: CraneRequest[],
    tow: TowTruckRequestDetail[]
  }>({ crane: [], tow: [] });
  // State for user's service types from backend
  // Backend'den gelen kullanıcının hizmet türleri için state
  const [userServiceTypes, setUserServiceTypes] = useState<('tow' | 'crane' | 'transport')[]>([]);

  // Helper function to reverse geocode coordinates to address
  // Koordinatları adrese çeviren yardımcı fonksiyon
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result && result.length > 0) {
        const location = result[0];
        // Format: Street Name, District, City
        const parts = [
          location.street,
          location.district,
          location.city
        ].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    // Fallback to coordinates if geocoding fails
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  // Fetch user's service types from backend on mount
  // Mount'ta backend'den kullanıcının hizmet türlerini çek
  useEffect(() => {
    const fetchUserServiceTypes = async () => {
      try {
        const user = await authAPI.getUser();
        if (user && user.user_type && Array.isArray(user.user_type)) {
          // Map backend values to filter values: "towTruck" -> "tow", "crane" -> "crane"
          // Backend değerlerini filtre değerlerine dönüştür
          const mappedTypes = user.user_type.map((type: string) => {
            if (type === 'towTruck') return 'tow';
            if (type === 'crane') return 'crane';
            if (type === 'transport') return 'transport';
            return null;
          }).filter((type): type is 'tow' | 'crane' | 'transport' => type !== null);

          setUserServiceTypes(mappedTypes);

          // Set initial serviceFilter to user's first registered service
          // İlk kayıtlı servisi serviceFilter'a ayarla
          if (mappedTypes.length > 0) {
            setServiceFilter(mappedTypes[0]);
          }

          console.log('✅ User service types loaded from backend:', mappedTypes);
        }
      } catch (error) {
        console.error('❌ Failed to fetch user service types:', error);
      }
    };

    fetchUserServiceTypes();
  }, []);

  // Route params'dan gelen filtre ayarlarını uygula (iş kabul edildikten sonra)
  // Apply filter settings from route params (after accepting a job)
  useEffect(() => {
    let shouldRefresh = false;

    if (route.params?.serviceFilter) {
      console.log('📍 Route params ile servis filtresi ayarlanıyor:', route.params.serviceFilter);
      setServiceFilter(route.params.serviceFilter as 'tow' | 'crane' | 'transport');
      shouldRefresh = true;
    }
    if (route.params?.filter) {
      console.log('📍 Route params ile durum filtresi ayarlanıyor:', route.params.filter);
      setFilter(route.params.filter as OrderStatus);
      shouldRefresh = true;
    }

    // Params geldiğinde listeyi yenile (iş kabul edildikten sonra)
    if (shouldRefresh) {
      console.log('🔄 Params değişti, liste yenileniyor...');
      // State temizle
      setCraneRequests([]);
      setTowTruckRequests([]);
      setRequestsWithAddresses({ crane: [], tow: [] });

      // Yeni data çek (filter ve serviceFilter state'i güncellendiği için otomatik çekilecek)
      // useEffect [filter, serviceFilter] zaten tetiklenecek
    }
  }, [route.params?.serviceFilter, route.params?.filter]);

  // Fetch crane requests from backend
  // Backend'den vinç taleplerini çek
  const fetchCraneRequests = useCallback(async () => {
    // Fetch pending crane requests
    // Bekleyen vinç taleplerini çek
    if (serviceFilter === 'crane' && filter === 'pending') {
      try {
        setLoading(true);
        console.log('🔵 VINÇ BEKLEYEN ENDPOINT ÇAĞRILIYOR: /requests/crane/pending/');
        const requests = await requestsAPI.getPendingCraneRequests();
        console.log('🟢 VINÇ BEKLEYEN RESPONSE:');
        console.log(JSON.stringify(requests, null, 2));
        console.log(`📊 Toplam: ${requests.length} iş`);
        setCraneRequests(requests);
      } catch (error) {
        console.error('❌ VINÇ BEKLEYEN HATA:', error);
      } finally {
        setLoading(false);
      }
    }
    // Fetch in-progress crane requests
    // Devam eden vinç taleplerini çek
    else if (serviceFilter === 'crane' && filter === 'in_progress') {
      try {
        setLoading(true);
        console.log('🔵 VINÇ DEVAM EDEN ENDPOINT ÇAĞRILIYOR: /requests/crane/in-progress/');
        const requests = await requestsAPI.getInProgressCraneRequests();
        console.log('🟢 VINÇ DEVAM EDEN RESPONSE:');
        console.log(JSON.stringify(requests, null, 2));
        console.log(`📊 Toplam: ${requests.length} iş`);
        setCraneRequests(requests);
      } catch (error) {
        console.error('❌ VINÇ DEVAM EDEN HATA:', error);
      } finally {
        setLoading(false);
      }
    }
    // Fetch awaiting approval crane requests
    // Onay bekleyen vinç taleplerini çek
    else if (serviceFilter === 'crane' && filter === 'awaiting_approval') {
      try {
        setLoading(true);
        console.log('🔵 VINÇ ONAY BEKLEYEN ENDPOINT ÇAĞRILIYOR: /requests/crane/awaiting-approval/');
        const requests = await requestsAPI.getAwaitingApprovalCraneRequests();
        console.log('🟢 VINÇ ONAY BEKLEYEN RESPONSE:');
        console.log(JSON.stringify(requests, null, 2));
        console.log(`📊 Toplam: ${requests.length} iş`);
        setCraneRequests(requests);
      } catch (error) {
        console.error('❌ VINÇ ONAY BEKLEYEN HATA:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [filter, serviceFilter]);

  // Sekme değiştiğinde önce temizle, sonra yeni data çek
  useEffect(() => {
    setCraneRequests([]);
    setTowTruckRequests([]);
    setRequestsWithAddresses({ crane: [], tow: [] });

    fetchCraneRequests();
    fetchTowTruckRequests();
  }, [filter, serviceFilter]);

  // Resolve addresses for crane requests using reverse geocoding
  // Vinç talepleri için reverse geocoding kullanarak adresleri çözümle
  useEffect(() => {
    const resolveAddresses = async () => {
      if (craneRequests.length === 0) {
        setRequestsWithAddresses(prev => ({ ...prev, crane: [] }));
        return;
      }

      // ✅ PERFORMANS İYİLEŞTİRME: Sadece geçersiz adresleri çözümle
      const needsResolving = craneRequests.filter(request => {
        const looksLikeCoords = /^[\d\.\-\s,]+$/.test(request.address || '');
        return !request.address || request.address === 'Adres belirtilmemiş' || looksLikeCoords;
      });

      if (needsResolving.length === 0) {
        // Tüm adresler zaten geçerli
        setRequestsWithAddresses(prev => ({ ...prev, crane: craneRequests }));
        return;
      }

      // ✅ PERFORMANS İYİLEŞTİRME: Sadece ihtiyaç olanları çözümle
      const resolved = await Promise.all(
        craneRequests.map(async (request) => {
          // Check if address looks like coordinates (contains comma and numbers)
          const looksLikeCoords = /^[\d\.\-\s,]+$/.test(request.address || '');

          if (!request.address || request.address === 'Adres belirtilmemiş' || looksLikeCoords) {
            const lat = parseFloat(request.latitude || '0');
            const lng = parseFloat(request.longitude || '0');
            if (lat !== 0 && lng !== 0) {
              try {
                const resolvedAddress = await reverseGeocode(lat, lng);
                return { ...request, address: resolvedAddress };
              } catch (error) {
                console.error('Adres çözümleme hatası:', error);
                return request; // Hata durumunda orijinal adresi koru
              }
            }
          }
          return request;
        })
      );

      setRequestsWithAddresses(prev => ({ ...prev, crane: resolved }));
    };

    resolveAddresses();
  }, [craneRequests]);

  // Fetch tow truck requests from backend
  // Backend'den çekici taleplerini çek
  const fetchTowTruckRequests = useCallback(async () => {
    // Fetch pending tow truck requests
    // Bekleyen çekici taleplerini çek
    if (serviceFilter === 'tow' && filter === 'pending') {
      try {
        setLoading(true);
        console.log('🔵 ÇEKİCİ BEKLEYEN ENDPOINT ÇAĞRILIYOR: /requests/tow-truck/pending/');
        const requests = await requestsAPI.getPendingTowTruckRequests();
        console.log('🟢 ÇEKİCİ BEKLEYEN RESPONSE:');
        console.log(JSON.stringify(requests, null, 2));
        console.log(`📊 Toplam: ${requests.length} iş`);
        setTowTruckRequests(requests);
      } catch (error) {
        console.error('❌ ÇEKİCİ BEKLEYEN HATA:', error);
      } finally {
        setLoading(false);
      }
    }
    // Fetch in-progress tow truck requests
    // Devam eden çekici taleplerini çek
    else if (serviceFilter === 'tow' && filter === 'in_progress') {
      try {
        setLoading(true);
        console.log('🔵 ÇEKİCİ DEVAM EDEN ENDPOINT ÇAĞRILIYOR: /requests/tow-truck/in-progress/');
        const requests = await requestsAPI.getInProgressTowTruckRequests();
        console.log('🟢 ÇEKİCİ DEVAM EDEN RESPONSE:');
        console.log(JSON.stringify(requests, null, 2));
        console.log(`📊 Toplam: ${requests.length} iş`);
        setTowTruckRequests(requests);
      } catch (error) {
        console.error('❌ ÇEKİCİ DEVAM EDEN HATA:', error);
      } finally {
        setLoading(false);
      }
    }
    // Fetch awaiting approval tow truck requests
    // Onay bekleyen çekici taleplerini çek
    else if (serviceFilter === 'tow' && filter === 'awaiting_approval') {
      try {
        setLoading(true);
        console.log('🔵 ÇEKİCİ ONAY BEKLEYEN ENDPOINT ÇAĞRILIYOR: /requests/tow-truck/awaiting-approval/');
        const requests = await requestsAPI.getAwaitingApprovalTowTruckRequests();
        console.log('🟢 ÇEKİCİ ONAY BEKLEYEN RESPONSE:');
        console.log(JSON.stringify(requests, null, 2));
        console.log(`📊 Toplam: ${requests.length} iş`);
        setTowTruckRequests(requests);
      } catch (error) {
        console.error('❌ ÇEKİCİ ONAY BEKLEYEN HATA:', error);
      } finally {
        setLoading(false);
      }
    }
  }, [filter, serviceFilter]);


  // Resolve addresses for tow truck requests using reverse geocoding
  // Çekici talepleri için reverse geocoding kullanarak adresleri çözümle
  useEffect(() => {
    const resolveAddresses = async () => {
      if (towTruckRequests.length === 0) {
        setRequestsWithAddresses(prev => ({ ...prev, tow: [] }));
        return;
      }

      // ✅ PERFORMANS İYİLEŞTİRME: Sadece geçersiz adresleri çözümle
      const needsResolving = towTruckRequests.some(request => {
        const pickupLooksLikeCoords = /^[\d\.\-\s,]+$/.test(request.pickup_address || '');
        const dropoffLooksLikeCoords = /^[\d\.\-\s,]+$/.test(request.dropoff_address || '');
        const needsPickup = !request.pickup_address || request.pickup_address === 'Alınacak konum' || pickupLooksLikeCoords;
        const needsDropoff = !request.dropoff_address || request.dropoff_address === 'Bırakılacak konum' || dropoffLooksLikeCoords;
        return needsPickup || needsDropoff;
      });

      if (!needsResolving) {
        // Tüm adresler zaten geçerli
        setRequestsWithAddresses(prev => ({ ...prev, tow: towTruckRequests }));
        return;
      }

      // ✅ PERFORMANS İYİLEŞTİRME: Sadece ihtiyaç olanları çözümle
      const resolved = await Promise.all(
        towTruckRequests.map(async (request) => {
          let resolvedPickupAddress = request.pickup_address;
          let resolvedDropoffAddress = request.dropoff_address;

          // Check if pickup address looks like coordinates or is empty
          const pickupLooksLikeCoords = /^[\d\.\-\s,]+$/.test(request.pickup_address || '');
          if (!request.pickup_address || request.pickup_address === 'Alınacak konum' || pickupLooksLikeCoords) {
            const lat = parseFloat(request.pickup_latitude || '0');
            const lng = parseFloat(request.pickup_longitude || '0');
            if (lat !== 0 && lng !== 0) {
              try {
                resolvedPickupAddress = await reverseGeocode(lat, lng);
              } catch (error) {
                console.error('Alış adresi çözümleme hatası:', error);
              }
            }
          }

          // Check if dropoff address looks like coordinates or is empty
          const dropoffLooksLikeCoords = /^[\d\.\-\s,]+$/.test(request.dropoff_address || '');
          if (!request.dropoff_address || request.dropoff_address === 'Bırakılacak konum' || dropoffLooksLikeCoords) {
            const lat = parseFloat(request.dropoff_latitude || '0');
            const lng = parseFloat(request.dropoff_longitude || '0');
            if (lat !== 0 && lng !== 0) {
              try {
                resolvedDropoffAddress = await reverseGeocode(lat, lng);
              } catch (error) {
                console.error('Teslim adresi çözümleme hatası:', error);
              }
            }
          }

          return {
            ...request,
            pickup_address: resolvedPickupAddress,
            dropoff_address: resolvedDropoffAddress
          };
        })
      );

      setRequestsWithAddresses(prev => ({ ...prev, tow: resolved }));
    };

    resolveAddresses();
  }, [towTruckRequests]);

  // Convert crane requests to job format
  // Vinç taleplerini job formatına çevir
  const craneRequestsAsJobs = useMemo(() => {
    // Use resolved addresses if available, otherwise use original requests
    const requests = requestsWithAddresses.crane.length > 0 ? requestsWithAddresses.crane : craneRequests;

    return requests
      .filter(request => request && request.latitude && request.longitude) // Filter out invalid requests
      .map(request => {
        // Devam eden ve tamamlanan işlerde backend'den gelen fiyatı göster
        // Bekleyen işlerde teklif verilecek (0)
        const price = filter === 'pending' ? 0 : (request.final_price || 0);

        return {
          id: request.id.toString(),
          serviceType: 'crane' as const,
          vehicleType: `Vinç - ${request.load_type || '?'}`,
          from: {
            lat: parseFloat(request.latitude || '0'),
            lng: parseFloat(request.longitude || '0'),
            address: request.address || 'Adres belirtilmemiş',
          },
          to: {
            lat: parseFloat(request.latitude || '0'),
            lng: parseFloat(request.longitude || '0'),
            address: request.address || 'Adres belirtilmemiş', // Vinç işi için tek konum
          },
          distance: 0,
          estimatedPrice: price,
          status: filter as OrderStatus, // Backend zaten doğru endpoint'ten gönderiyor
          createdAt: new Date(request.created_at),
          description: `Yük: ${request.load_weight || '?'} kg | Yükseklik: ${request.lift_height || '?'}m | Kat: ${request.floor || '?'}${request.has_obstacles ? ' | Engel var' : ''}`,
        };
      });
  }, [craneRequests, requestsWithAddresses.crane, filter]);

  // Convert tow truck requests to job format
  // Çekici taleplerini job formatına çevir
  const towTruckRequestsAsJobs = useMemo(() => {
    // Use resolved addresses if available, otherwise use original requests
    const requests = requestsWithAddresses.tow.length > 0 ? requestsWithAddresses.tow : towTruckRequests;

    return requests
      .filter(request => request && request.pickup_latitude && request.pickup_longitude)
      .map(request => {
        // Devam eden ve tamamlanan işlerde backend'den gelen fiyatı göster
        // Bekleyen işlerde teklif verilecek (0)
        const price = filter === 'pending' ? 0 : (request.final_price || 0);

        return {
          id: request.id.toString(),
          serviceType: 'tow' as const,
          vehicleType: `Çekici - ${request.vehicle_type}`,
          from: {
            lat: parseFloat(request.pickup_latitude || '0'),
            lng: parseFloat(request.pickup_longitude || '0'),
            address: request.pickup_address || 'Alınacak konum',
          },
          to: {
            lat: parseFloat(request.dropoff_latitude || '0'),
            lng: parseFloat(request.dropoff_longitude || '0'),
            address: request.dropoff_address || 'Bırakılacak konum',
          },
          distance: request.estimated_km || 0,
          estimatedPrice: price,
          status: filter as OrderStatus, // Backend zaten doğru endpoint'ten gönderiyor
          createdAt: new Date(request.created_at),
          description: `Mesafe: ${request.route_distance} | Süre: ${request.route_duration}`,
        };
      });
  }, [towTruckRequests, requestsWithAddresses.tow, filter]);

  // Backend'den gelen veriyi OLDUĞU GİBİ göster
  const filteredJobs = useMemo(() => {
    if (serviceFilter === 'crane') {
      return craneRequestsAsJobs;
    }
    if (serviceFilter === 'tow') {
      return towTruckRequestsAsJobs;
    }
    return [];
  }, [serviceFilter, craneRequestsAsJobs, towTruckRequestsAsJobs]);

  // Handles navigation when a job card is pressed.
  // Bir iş kartına basıldığında navigasyonu yönetir.
  const handleCardPress = (jobId: string, status: OrderStatus) => {
    if (status === 'pending') {
      // Navigate to service-specific offer screen for pending jobs.
      // Bekleyen işler için hizmet tipine özel teklif ekranına git.
      if (serviceFilter === 'crane') {
        navigation.navigate('CraneOffer', { orderId: jobId });
      } else if (serviceFilter === 'tow') {
        navigation.navigate('TowTruckOffer', { orderId: jobId });
      } else {
        // For other service types, use generic offer screen
        navigation.navigate('Offer', { orderId: jobId });
      }
    } else {
      // Navigate to service-specific detail screen for awaiting_approval, in_progress, and completed jobs.
      // Onay bekleyen, devam eden ve tamamlanmış işler için hizmet tipine özel detay ekranına git.
      if (serviceFilter === 'crane') {
        navigation.navigate('CraneJobDetail', { jobId: jobId });
      } else if (serviceFilter === 'tow') {
        navigation.navigate('JobDetail', { jobId: jobId });
      } else {
        // For other service types, use generic detail screen
        navigation.navigate('JobDetail', { jobId: jobId });
      }
    }
  };

  // Handle pull-to-refresh
  // Aşağı çekerek yenileme işlemi
  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      // Clear cached state first (including resolved addresses)
      // Önce cache'lenmiş state'i temizle (çözümlenmiş adresler dahil)
      setCraneRequests([]);
      setTowTruckRequests([]);
      setRequestsWithAddresses({ crane: [], tow: [] });

      // Fetch both crane and tow truck requests
      await Promise.all([
        fetchCraneRequests(),
        fetchTowTruckRequests()
      ]);
      console.log('✅ Liste yenilendi');
    } catch (error) {
      console.error('❌ Yenileme hatası:', error);
    } finally {
      setRefreshing(false);
    }
  }, [fetchCraneRequests, fetchTowTruckRequests]);

  // Refresh when screen comes into focus (after accepting a job)
  // Ekran focus olduğunda yenile (iş kabul edildikten sonra)
  useFocusEffect(
    useCallback(() => {
      console.log('📱 OrdersScreen focused - refreshing data');
      fetchCraneRequests();
      fetchTowTruckRequests();
    }, [fetchCraneRequests, fetchTowTruckRequests])
  );

  // Responsive styles içinde component
  const dynamicStyles = {
    container: {
      flex: 1,
      paddingHorizontal: spacing.sm,
    },
    serviceButtons: {
      marginTop: spacing.sm,
      marginBottom: spacing.xs,
    },
    buttons: {
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      width: '100%' as const,
    },
    tabContainer: {
      flexDirection: 'row' as const,
      marginTop: spacing.xs,
      marginBottom: spacing.sm,
      backgroundColor: isDarkMode ? '#333333' : '#E0E0E0',
      borderRadius: 8,
      padding: 4,
      gap: 4,
    },
    tabButton: {
      flex: 1,
      paddingVertical: 10,
      paddingHorizontal: 12,
      borderRadius: 6,
      alignItems: 'center' as const,
      justifyContent: 'center' as const,
      backgroundColor: 'transparent',
    },
    tabButtonActive: {
      backgroundColor: isDarkMode ? appColors.primary[400] : '#6750A4',
    },
    tabButtonText: {
      fontSize: 14,
      fontWeight: '500' as const,
      color: appColors.text.primary,
    },
    tabButtonTextActive: {
      color: '#FFF',
      fontWeight: '600' as const,
    },
    listContent: {
      paddingBottom: spacing.sm,
    },
    emptyText: {
      textAlign: 'center' as const,
      marginTop: spacing.xl,
      fontSize: fontSize.lg,
      color: appColors.text.secondary,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center' as const,
      alignItems: 'center' as const,
      marginTop: spacing.xl,
    },
    loadingText: {
      marginTop: spacing.sm,
      fontSize: fontSize.lg,
      color: appColors.text.secondary,
    },
  };

  return (
    <View style={[styles.flexContainer, { backgroundColor: screenBg }]}>
      <SafeAreaView style={dynamicStyles.container} edges={['top', 'left', 'right']}>
        {/* Hizmet Türü Butonları (Üstte - opsiyonel) */}
        {userServiceTypes.length > 1 && (
          <SegmentedButtons
            value={serviceFilter}
            onValueChange={(value) => setServiceFilter(value as 'tow' | 'crane' | 'transport')}
            buttons={userServiceTypes.map(type => ({
              value: type,
              label: type === 'tow' ? '🚛 Çekici' : type === 'crane' ? '🏗️ Vinç' : '🚚 Nakliye',
            }))}
            style={dynamicStyles.serviceButtons}
          />
        )}

        {/* Ana Tab Butonları (Gelen İşler / Benim İşlerim) */}
        <SegmentedButtons
          value={mainTab}
          onValueChange={(value) => {
            setMainTab(value as 'incoming' | 'my_jobs');
            // Ana tab değiştiğinde filter'ı reset et
            if (value === 'incoming') {
              setFilter('pending');
            } else {
              setFilter('awaiting_approval');
            }
          }}
          buttons={[
            { value: 'incoming', label: '📥 Gelen İşler' },
            { value: 'my_jobs', label: '📋 Benim İşlerim' },
          ]}
          style={dynamicStyles.buttons}
        />

        {/* Alt Tab Butonları (mainTab'a göre değişir) */}
        {mainTab === 'my_jobs' && (
          <View style={dynamicStyles.tabContainer}>
            <TouchableOpacity
              style={[
                dynamicStyles.tabButton,
                filter === 'awaiting_approval' && dynamicStyles.tabButtonActive,
              ]}
              onPress={() => setFilter('awaiting_approval')}
            >
              <Text
                style={[
                  dynamicStyles.tabButtonText,
                  filter === 'awaiting_approval' && dynamicStyles.tabButtonTextActive,
                ]}
              >
                Onay Bekleyen
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                dynamicStyles.tabButton,
                filter === 'in_progress' && dynamicStyles.tabButtonActive,
              ]}
              onPress={() => setFilter('in_progress')}
            >
              <Text
                style={[
                  dynamicStyles.tabButtonText,
                  filter === 'in_progress' && dynamicStyles.tabButtonTextActive,
                ]}
              >
                Devam Eden
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {loading && !refreshing ? (
          <View style={dynamicStyles.loadingContainer}>
            <ActivityIndicator size="large" />
            <Text style={dynamicStyles.loadingText}>Talepler yükleniyor...</Text>
          </View>
        ) : (
          <FlatList
            data={filteredJobs}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => (
              <OrderCard
                item={item}
                onPress={() => handleCardPress(item.id, item.status)}
              />
            )}
            contentContainerStyle={dynamicStyles.listContent}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                colors={['#26a69a']}
                tintColor="#26a69a"
              />
            }
            ListEmptyComponent={
              <Text style={dynamicStyles.emptyText}>
                {filter === 'pending' && 'Bekleyen iş bulunmuyor.'}
                {filter === 'awaiting_approval' && 'Onay bekleyen iş bulunmuyor.'}
                {filter === 'in_progress' && 'Devam eden iş bulunmuyor.'}
              </Text>
            }
          />
        )}
      </SafeAreaView>
    </View>
  );
}

// Static styles - değişmeyen
const styles = StyleSheet.create({
  flexContainer: {
    flex: 1,
  },
});

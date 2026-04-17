import { useState, useCallback, useEffect, useMemo } from 'react';
import { requestsAPI, CraneRequest, TowTruckRequestDetail } from '../../../api';
import type { MovingRequest, RoadAssistanceRequest, TransferRequest } from '../../../api/types';
import * as Location from 'expo-location';
import { OrderStatus } from '../../../lib/types';
import { useActiveJobStore } from '../../../store/useActiveJobStore';
import { useJobCountsStore } from '../../../store/useJobCountsStore';
import { OrdersJob } from '../types';

// Service filter types - artık yol yardım ve nakliye de destekleniyor
// nakliye = evden eve + şehirler arası (birleşik olarak gösterilir)
export type ServiceFilterType = 'tow' | 'crane' | 'roadAssistance' | 'nakliye' | 'transfer';

interface UseOrdersDataProps {
  serviceFilter: ServiceFilterType;
  filter: OrderStatus;
}

export function useOrdersData({ serviceFilter, filter }: UseOrdersDataProps) {
  const [craneRequests, setCraneRequests] = useState<CraneRequest[]>([]);
  const [towTruckRequests, setTowTruckRequests] = useState<TowTruckRequestDetail[]>([]);
  const [nakliyeRequests, setNakliyeRequests] = useState<MovingRequest[]>([]); // Evden eve + şehirler arası birleşik
  const [roadAssistanceRequests, setRoadAssistanceRequests] = useState<RoadAssistanceRequest[]>([]); // Yol yardım
  const [transferRequests, setTransferRequests] = useState<TransferRequest[]>([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestsWithAddresses, setRequestsWithAddresses] = useState<{
    crane: CraneRequest[];
    tow: TowTruckRequestDetail[];
    nakliye: MovingRequest[];
    roadAssistance: RoadAssistanceRequest[];
    transfer: TransferRequest[];
  }>({ crane: [], tow: [], nakliye: [], roadAssistance: [], transfer: [] });
  // Sayıları global store'dan oku (all-counts endpoint ile doldurulur, WebSocket ile güncellenir)
  const jobCounts = useJobCountsStore(state => state.serviceCounts[serviceFilter]) || { pending: 0, awaiting_approval: 0, awaiting_payment: 0, in_progress: 0 };

  // Aktif iş store'u - WebSocket konum paylaşımı için
  const setActiveJob = useActiveJobStore((state) => state.setActiveJob);

  // Global job counts store - İşler sekmesi yanıp sönmesi için
  const updateServiceCounts = useJobCountsStore((state) => state.updateServiceCounts);


  // Helper function to reverse geocode coordinates to address
  const reverseGeocode = async (lat: number, lng: number): Promise<string> => {
    try {
      const result = await Location.reverseGeocodeAsync({ latitude: lat, longitude: lng });
      if (result && result.length > 0) {
        const location = result[0];
        const parts = [location.street, location.district, location.city].filter(Boolean);
        return parts.length > 0 ? parts.join(', ') : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      }
    } catch (error) {
      console.error('Reverse geocoding failed:', error);
    }
    return `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
  };

  // Fetch crane requests from backend
  const fetchCraneRequests = useCallback(async () => {
    if (serviceFilter !== 'crane') return;

    try {
      setLoading(true);
      let requests: CraneRequest[] = [];

      switch (filter) {
        case 'pending':
          requests = await requestsAPI.getAvailableCraneRequests();
          break;
        case 'awaiting_approval':
          requests = await requestsAPI.getAwaitingApprovalCraneRequests();
          break;
        case 'awaiting_payment':
          requests = await requestsAPI.getAwaitingPaymentCraneRequests();
          break;
        case 'in_progress':
          requests = await requestsAPI.getInProgressCraneRequests();
          break;
        case 'completed':
          requests = await requestsAPI.getCompletedCraneRequests();
          break;
      }

      setCraneRequests(requests);
    } catch (error) {
      console.error('❌ VINÇ TALEPLERİ HATA:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, serviceFilter]);

  // Fetch tow truck requests from backend
  const fetchTowTruckRequests = useCallback(async () => {
    if (serviceFilter !== 'tow') return;

    try {
      setLoading(true);
      let requests: TowTruckRequestDetail[] = [];

      switch (filter) {
        case 'pending':
          requests = await requestsAPI.getAvailableTowTruckRequests();
          break;
        case 'awaiting_approval':
          requests = await requestsAPI.getAwaitingApprovalTowTruckRequests();
          break;
        case 'awaiting_payment':
          // Çekici için müşteri ödeme yapacak - sürücü bekleyecek
          requests = await requestsAPI.getAwaitingPaymentTowTruckRequests().catch(() => []);
          break;
        case 'in_progress':
          requests = await requestsAPI.getInProgressTowTruckRequests();
          break;
        case 'completed':
          requests = await requestsAPI.getCompletedTowTruckRequests();
          break;
      }

      setTowTruckRequests(requests);
    } catch (error) {
      console.error('❌ ÇEKİCİ TALEPLERİ HATA:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, serviceFilter]);

  // Fetch nakliye requests from backend (Evden Eve + Şehirler Arası BİRLEŞİK)
  const fetchNakliyeRequests = useCallback(async () => {
    if (serviceFilter !== 'nakliye') return;

    try {
      setLoading(true);
      let homeMovingRequests: MovingRequest[] = [];
      let cityMovingRequests: MovingRequest[] = [];

      switch (filter) {
        case 'pending':
          [homeMovingRequests, cityMovingRequests] = await Promise.all([
            requestsAPI.getPendingHomeMovingRequests().catch(() => []),
            requestsAPI.getPendingCityMovingRequests().catch(() => []),
          ]);
          break;
        case 'awaiting_approval':
          [homeMovingRequests, cityMovingRequests] = await Promise.all([
            requestsAPI.getAwaitingApprovalHomeMovingRequests().catch(() => []),
            requestsAPI.getAwaitingApprovalCityMovingRequests().catch(() => []),
          ]);
          break;
        case 'awaiting_payment':
          // Nakliyede müşteri sürücüye ödeme yapacak
          [homeMovingRequests, cityMovingRequests] = await Promise.all([
            requestsAPI.getAwaitingPaymentHomeMovingRequests().catch(() => []),
            requestsAPI.getAwaitingPaymentCityMovingRequests().catch(() => []),
          ]);
          break;
        case 'in_progress':
          [homeMovingRequests, cityMovingRequests] = await Promise.all([
            requestsAPI.getInProgressHomeMovingRequests().catch(() => []),
            requestsAPI.getInProgressCityMovingRequests().catch(() => []),
          ]);
          break;
        case 'completed':
          [homeMovingRequests, cityMovingRequests] = await Promise.all([
            requestsAPI.getCompletedHomeMovingRequests().catch(() => []),
            requestsAPI.getCompletedCityMovingRequests().catch(() => []),
          ]);
          break;
      }

      // Her isteğe tip ekle (iş detayında hangisi olduğu belli olsun)
      const homeWithType: MovingRequest[] = homeMovingRequests.map((r) => ({ ...r, movingType: 'homeMoving' as const }));
      const cityWithType: MovingRequest[] = cityMovingRequests.map((r) => ({ ...r, movingType: 'cityMoving' as const }));

      // Birleştir
      const combined: MovingRequest[] = [...homeWithType, ...cityWithType];
      setNakliyeRequests(combined);
    } catch (error) {
      console.error('❌ NAKLİYE TALEPLERİ HATA:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, serviceFilter]);

  // Fetch road assistance requests from backend
  const fetchRoadAssistanceRequests = useCallback(async () => {
    if (serviceFilter !== 'roadAssistance') return;

    try {
      setLoading(true);
      let requests: RoadAssistanceRequest[] = [];

      switch (filter) {
        case 'pending':
          requests = await requestsAPI.getAvailableRoadAssistanceRequests().catch(() => []);
          break;
        case 'awaiting_approval':
          requests = await requestsAPI.getAwaitingApprovalRoadAssistanceRequests().catch(() => []);
          break;
        case 'awaiting_payment':
          // Yol yardımda müşteri sürücüye ödeme yapacak
          requests = await requestsAPI.getAwaitingPaymentRoadAssistanceRequests().catch(() => []);
          break;
        case 'in_progress':
          requests = await requestsAPI.getInProgressRoadAssistanceRequests().catch(() => []);
          break;
        case 'completed':
          requests = await requestsAPI.getCompletedRoadAssistanceRequests().catch(() => []);
          break;
      }

      setRoadAssistanceRequests(requests);
    } catch (error) {
      console.error('❌ YOL YARDIM TALEPLERİ HATA:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, serviceFilter]);

  // Fetch transfer requests from backend
  const fetchTransferRequests = useCallback(async () => {
    if (serviceFilter !== 'transfer') return;

    try {
      setLoading(true);
      let requests: TransferRequest[] = [];

      switch (filter) {
        case 'pending':
          requests = await requestsAPI.getAvailableTransferRequests().catch(() => []);
          break;
        case 'awaiting_approval':
          requests = await requestsAPI.getAwaitingApprovalTransferRequests().catch(() => []);
          break;
        case 'awaiting_payment':
          requests = await requestsAPI.getAwaitingPaymentTransferRequests().catch(() => []);
          break;
        case 'in_progress':
          requests = await requestsAPI.getInProgressTransferRequests().catch(() => []);
          break;
        case 'completed':
          requests = await requestsAPI.getCompletedTransferRequests().catch(() => []);
          break;
      }

      setTransferRequests(requests);
    } catch (error) {
      console.error('❌ TRANSFER TALEPLERİ HATA:', error);
    } finally {
      setLoading(false);
    }
  }, [filter, serviceFilter]);

  // Tüm statuslardaki iş sayılarını çek (yanıp sönme için)
  // ⚠️ OPTİMİZASYON: Sadece gerekli endpoint'leri çağır
  // TÜM servisler için iş sayılarını çek (İşler sekmesi yanıp sönmesi için)
  // Bu fonksiyon sadece bir kez çağrılır (ilk yüklemede) - tek API çağrısı ile
  const fetchAllServicesJobCounts = useCallback(async () => {
    try {
      const allCounts = await requestsAPI.getAllServicesCounts();
      const zeroCounts = { pending: 0, awaiting_approval: 0, awaiting_payment: 0, in_progress: 0 };

      // Backend key'lerini store key'lerine map et
      updateServiceCounts('tow', allCounts['tow-truck'] || zeroCounts);
      updateServiceCounts('crane', allCounts['crane'] || zeroCounts);

      // Nakliye = home-moving + city-moving birleşik
      const homeCounts = allCounts['home-moving'] || zeroCounts;
      const cityCounts = allCounts['city-moving'] || zeroCounts;
      updateServiceCounts('nakliye', {
        pending: homeCounts.pending + cityCounts.pending,
        awaiting_approval: homeCounts.awaiting_approval + cityCounts.awaiting_approval,
        awaiting_payment: homeCounts.awaiting_payment + cityCounts.awaiting_payment,
        in_progress: homeCounts.in_progress + cityCounts.in_progress,
      });

      updateServiceCounts('roadAssistance', allCounts['road-assistance'] || zeroCounts);
      updateServiceCounts('transfer', allCounts['transfer'] || zeroCounts);
    } catch (error) {
      console.error('❌ Tüm servislerin iş sayıları alınamadı:', error);
    }
  }, [updateServiceCounts]);

  // İlk yüklemede tüm servislerin sayılarını çek
  useEffect(() => {
    fetchAllServicesJobCounts();
  }, [fetchAllServicesJobCounts]);

  // Sekme değiştiğinde sadece aktif servisin verisini çek
  useEffect(() => {
    if (serviceFilter === 'crane') {
      setCraneRequests([]);
      setRequestsWithAddresses(prev => ({ ...prev, crane: [] }));
      fetchCraneRequests();
    } else if (serviceFilter === 'tow') {
      setTowTruckRequests([]);
      setRequestsWithAddresses(prev => ({ ...prev, tow: [] }));
      fetchTowTruckRequests();
    } else if (serviceFilter === 'nakliye') {
      setNakliyeRequests([]);
      setRequestsWithAddresses(prev => ({ ...prev, nakliye: [] }));
      fetchNakliyeRequests();
    } else if (serviceFilter === 'roadAssistance') {
      setRoadAssistanceRequests([]);
      setRequestsWithAddresses(prev => ({ ...prev, roadAssistance: [] }));
      fetchRoadAssistanceRequests();
    } else if (serviceFilter === 'transfer') {
      setTransferRequests([]);
      setRequestsWithAddresses(prev => ({ ...prev, transfer: [] }));
      fetchTransferRequests();
    }
  }, [filter, serviceFilter, fetchCraneRequests, fetchTowTruckRequests, fetchNakliyeRequests, fetchRoadAssistanceRequests, fetchTransferRequests]);

  // Auto-refresh KALDIRILDI - WebSocket ile real-time güncelleme yapılıyor
  // Kullanıcı manuel yenileme (pull-to-refresh) yapabilir

  // Resolve addresses for crane requests
  useEffect(() => {
    const resolveAddresses = async () => {
      if (craneRequests.length === 0) return;

      const resolved = await Promise.all(
        craneRequests.map(async (request) => {
          const looksLikeCoords = /^[\d\.\-\s,]+$/.test(request.address || '');
          if (!request.address || request.address === 'Adres belirtilmemiş' || looksLikeCoords) {
            const lat = parseFloat(request.latitude || '0');
            const lng = parseFloat(request.longitude || '0');
            if (lat !== 0 && lng !== 0) {
              const resolvedAddress = await reverseGeocode(lat, lng);
              return { ...request, address: resolvedAddress };
            }
          }
          return request;
        })
      );

      setRequestsWithAddresses((prev) => ({ ...prev, crane: resolved }));
    };

    resolveAddresses();
  }, [craneRequests]);

  // Resolve addresses for tow truck requests
  useEffect(() => {
    const resolveAddresses = async () => {
      if (towTruckRequests.length === 0) return;

      const resolved = await Promise.all(
        towTruckRequests.map(async (request) => {
          let resolvedPickupAddress = request.pickup_address;
          let resolvedDropoffAddress = request.dropoff_address;

          const pickupLooksLikeCoords = /^[\d\.\-\s,]+$/.test(request.pickup_address || '');
          if (!request.pickup_address || request.pickup_address === 'Alınacak konum' || pickupLooksLikeCoords) {
            const lat = parseFloat(request.pickup_latitude || '0');
            const lng = parseFloat(request.pickup_longitude || '0');
            if (lat !== 0 && lng !== 0) {
              resolvedPickupAddress = await reverseGeocode(lat, lng);
            }
          }

          const dropoffLooksLikeCoords = /^[\d\.\-\s,]+$/.test(request.dropoff_address || '');
          if (!request.dropoff_address || request.dropoff_address === 'Bırakılacak konum' || dropoffLooksLikeCoords) {
            const lat = parseFloat(request.dropoff_latitude || '0');
            const lng = parseFloat(request.dropoff_longitude || '0');
            if (lat !== 0 && lng !== 0) {
              resolvedDropoffAddress = await reverseGeocode(lat, lng);
            }
          }

          return {
            ...request,
            pickup_address: resolvedPickupAddress,
            dropoff_address: resolvedDropoffAddress,
          };
        })
      );

      setRequestsWithAddresses((prev) => ({ ...prev, tow: resolved }));
    };

    resolveAddresses();
  }, [towTruckRequests]);

  // Resolve addresses for nakliye requests
  useEffect(() => {
    const resolveAddresses = async () => {
      if (nakliyeRequests.length === 0) return;

      const resolved = await Promise.all(
        nakliyeRequests.map(async (request) => {
          let resolvedFromAddress = request.from_address || request.pickup_address;
          let resolvedToAddress = request.to_address || request.dropoff_address;

          // From address
          const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
          const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
          if ((!resolvedFromAddress || /^[\d\.\-\s,]+$/.test(resolvedFromAddress)) && fromLat !== 0 && fromLng !== 0) {
            resolvedFromAddress = await reverseGeocode(fromLat, fromLng);
          }

          // To address
          const toLat = parseFloat(request.to_latitude || request.dropoff_latitude || '0');
          const toLng = parseFloat(request.to_longitude || request.dropoff_longitude || '0');
          if ((!resolvedToAddress || /^[\d\.\-\s,]+$/.test(resolvedToAddress)) && toLat !== 0 && toLng !== 0) {
            resolvedToAddress = await reverseGeocode(toLat, toLng);
          }

          return {
            ...request,
            from_address: resolvedFromAddress,
            to_address: resolvedToAddress,
          };
        })
      );

      setRequestsWithAddresses((prev) => ({ ...prev, nakliye: resolved }));
    };

    resolveAddresses();
  }, [nakliyeRequests]);

  // Resolve addresses for road assistance requests
  useEffect(() => {
    const resolveAddresses = async () => {
      if (roadAssistanceRequests.length === 0) return;

      const resolved = await Promise.all(
        roadAssistanceRequests.map(async (request) => {
          let resolvedAddress = request.address || request.location_address;

          const lat = parseFloat(request.latitude || request.location_latitude || '0');
          const lng = parseFloat(request.longitude || request.location_longitude || '0');
          if ((!resolvedAddress || /^[\d\.\-\s,]+$/.test(resolvedAddress)) && lat !== 0 && lng !== 0) {
            resolvedAddress = await reverseGeocode(lat, lng);
          }

          return {
            ...request,
            address: resolvedAddress,
          };
        })
      );

      setRequestsWithAddresses((prev) => ({ ...prev, roadAssistance: resolved }));
    };

    resolveAddresses();
  }, [roadAssistanceRequests]);

  // Convert crane requests to job format
  const craneRequestsAsJobs = useMemo(() => {
    const requests = requestsWithAddresses.crane.length > 0 ? requestsWithAddresses.crane : craneRequests;

    return requests
      .filter((request) => request && request.latitude && request.longitude)
      .map((request): OrdersJob => {
        const price = request.final_price || 0;

        return {
          id: request.id.toString(),
          serviceType: 'crane',
          vehicleType: `Vinç - ${request.load_type || '?'}`,
          from: {
            lat: parseFloat(request.latitude || '0'),
            lng: parseFloat(request.longitude || '0'),
            address: request.address || 'Adres belirtilmemiş',
          },
          to: {
            lat: parseFloat(request.latitude || '0'),
            lng: parseFloat(request.longitude || '0'),
            address: request.address || 'Adres belirtilmemiş',
          },
          distance: 0,
          estimatedPrice: price,
          status: filter as OrderStatus,
          createdAt: new Date(request.created_at),
          description: `Yük: ${request.load_weight || '?'} kg | Yükseklik: ${request.lift_height || '?'}m | Kat: ${request.floor || '?'}${request.has_obstacles ? ' | Engel var' : ''}`,
        };
      });
  }, [craneRequests, requestsWithAddresses.crane, filter]);

  // Convert tow truck requests to job format
  const towTruckRequestsAsJobs = useMemo(() => {
    const requests = requestsWithAddresses.tow.length > 0 ? requestsWithAddresses.tow : towTruckRequests;

    return requests
      .filter((request) => request && request.pickup_latitude && request.pickup_longitude)
      .map((request): OrdersJob => {
        const price = request.final_price || 0;

        return {
          id: request.id.toString(),
          serviceType: 'tow',
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
          status: filter as OrderStatus,
          createdAt: new Date(request.created_at),
          description: `Mesafe: ${request.route_distance} | Süre: ${request.route_duration}`,
        };
      });
  }, [towTruckRequests, requestsWithAddresses.tow, filter]);

  // Convert nakliye requests to job format (birleşik evden eve + şehirler arası)
  const nakliyeRequestsAsJobs = useMemo(() => {
    const requests = requestsWithAddresses.nakliye.length > 0 ? requestsWithAddresses.nakliye : nakliyeRequests;

    return requests.map((request): OrdersJob => {
      const price = request.final_price || request.estimated_price || 0;
      const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
      const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
      const toLat = parseFloat(request.to_latitude || request.dropoff_latitude || '0');
      const toLng = parseFloat(request.to_longitude || request.dropoff_longitude || '0');

      // İş tipine göre label belirle
      const isHomeMoving = request.movingType === 'homeMoving';
      const typeLabel = isHomeMoving ? 'Evden Eve Nakliye' : 'Şehirler Arası Nakliye';

      // Description oluştur
      let description = '';
      if (isHomeMoving) {
        description = `${request.floor_from ? `Kat: ${request.floor_from}` : ''} ${request.has_elevator ? '| Asansör var' : ''} ${request.room_count ? `| ${request.room_count} oda` : ''}`.trim() || 'Evden eve nakliye talebi';
      } else {
        description = `${request.from_city || ''} → ${request.to_city || ''} ${request.load_weight ? `| ${request.load_weight} kg` : ''}`.trim() || 'Şehirler arası nakliye talebi';
      }

      return {
        id: request.id.toString(),
        serviceType: 'transport', // OrdersJob tipine uygun - App.tsx'te otomatik konum paylaşımı hariç tutuluyor
        vehicleType: typeLabel,
        movingType: request.movingType as OrdersJob['movingType'], // homeMoving veya cityMoving - teklif ekranına yönlendirme için
        from: {
          lat: fromLat,
          lng: fromLng,
          address: request.from_address || request.pickup_address || request.from_city || 'Alınacak adres',
        },
        to: {
          lat: toLat,
          lng: toLng,
          address: request.to_address || request.dropoff_address || request.to_city || 'Bırakılacak adres',
        },
        distance: request.estimated_km || request.distance_km || 0,
        estimatedPrice: typeof price === 'string' ? parseFloat(price) : price,
        status: filter as OrderStatus,
        createdAt: new Date(request.created_at),
        description,
        trackingToken: request.trackingToken || request.tracking_token,
        preferredDate: request.preferred_date, // Nakliye için tercih edilen tarih
      };
    });
  }, [nakliyeRequests, requestsWithAddresses.nakliye, filter]);

  // Convert road assistance requests to job format
  const roadAssistanceRequestsAsJobs = useMemo(() => {
    const requests = requestsWithAddresses.roadAssistance.length > 0 ? requestsWithAddresses.roadAssistance : roadAssistanceRequests;

    return requests.map((request): OrdersJob => {
      const price = request.final_price || request.estimated_price || 0;
      const lat = parseFloat(request.latitude || request.location_latitude || '0');
      const lng = parseFloat(request.longitude || request.location_longitude || '0');

      // Yol yardım tipi
      const serviceTypeLabel = request.service_type || request.assistance_type || 'Yol Yardım';

      return {
        id: request.id.toString(),
        serviceType: 'roadAssistance',
        vehicleType: `Yol Yardım - ${serviceTypeLabel}`,
        from: {
          lat,
          lng,
          address: request.address || request.location_address || 'Konum belirtilmemiş',
        },
        to: {
          lat,
          lng,
          address: request.address || request.location_address || 'Konum belirtilmemiş',
        },
        distance: 0,
        estimatedPrice: typeof price === 'string' ? parseFloat(price) : price,
        status: filter as OrderStatus,
        createdAt: new Date(request.created_at),
        description: request.description || request.problem_description || 'Yol yardım talebi',
        trackingToken: request.trackingToken || request.tracking_token,
      };
    });
  }, [roadAssistanceRequests, requestsWithAddresses.roadAssistance, filter]);

  // Convert transfer requests to job format
  const transferRequestsAsJobs = useMemo(() => {
    const requests = requestsWithAddresses.transfer.length > 0 ? requestsWithAddresses.transfer : transferRequests;

    return requests.map((request): OrdersJob => {
      const price = request.final_price || request.estimated_price || 0;
      const lat = parseFloat(request.pickup_latitude || request.latitude || '0');
      const lng = parseFloat(request.pickup_longitude || request.longitude || '0');

      // Transfer tipi ve yolcu bilgisi
      const transferTypeLabel = request.transfer_type || 'Transfer';
      const passengerInfo = request.passenger_count ? `${request.passenger_count} yolcu` : '';
      const scheduleInfo = request.scheduled_date ? `${request.scheduled_date}${request.scheduled_time ? ' ' + request.scheduled_time : ''}` : '';

      const descriptionParts = [transferTypeLabel, passengerInfo, scheduleInfo].filter(Boolean);
      const description = descriptionParts.join(' | ') || 'Transfer talebi';

      return {
        id: request.id.toString(),
        serviceType: 'transfer',
        vehicleType: `Transfer - ${transferTypeLabel}`,
        from: {
          lat,
          lng,
          address: request.pickup_address || request.address || 'Alınacak konum',
        },
        to: {
          lat: parseFloat(request.dropoff_latitude || request.destination_latitude || '0'),
          lng: parseFloat(request.dropoff_longitude || request.destination_longitude || '0'),
          address: request.dropoff_address || request.destination_address || 'Bırakılacak konum',
        },
        distance: request.estimated_km || request.distance_km || 0,
        estimatedPrice: typeof price === 'string' ? parseFloat(price) : price,
        status: filter as OrderStatus,
        createdAt: new Date(request.created_at),
        description,
        trackingToken: request.trackingToken || request.tracking_token,
      };
    });
  }, [transferRequests, requestsWithAddresses.transfer, filter]);

  // Backend'den gelen veriyi OLDUĞU GİBİ göster
  const filteredJobs = useMemo(() => {
    if (serviceFilter === 'crane') {
      return craneRequestsAsJobs;
    }
    if (serviceFilter === 'tow') {
      return towTruckRequestsAsJobs;
    }
    if (serviceFilter === 'nakliye') {
      return nakliyeRequestsAsJobs;
    }
    if (serviceFilter === 'roadAssistance') {
      return roadAssistanceRequestsAsJobs;
    }
    if (serviceFilter === 'transfer') {
      return transferRequestsAsJobs;
    }
    return [];
  }, [serviceFilter, craneRequestsAsJobs, towTruckRequestsAsJobs, nakliyeRequestsAsJobs, roadAssistanceRequestsAsJobs, transferRequestsAsJobs]);

  // in_progress işi varsa aktif iş store'unu güncelle (WebSocket konum paylaşımı için)
  useEffect(() => {
    // Sadece in_progress durumundaki işler için WebSocket aktif olmalı
    const inProgressJob = filteredJobs.find((job) => job.status === 'in_progress');

    if (inProgressJob) {
      let trackingToken: string | undefined = inProgressJob.trackingToken;

      // trackingToken yoksa backend verilerinden bul
      if (!trackingToken) {
        if (serviceFilter === 'tow') {
          const towRequest = towTruckRequests.find(r => r.id.toString() === inProgressJob.id);
          trackingToken = towRequest?.trackingToken;
        } else if (serviceFilter === 'crane') {
          const craneRequest = craneRequests.find(r => r.id.toString() === inProgressJob.id);
          trackingToken = craneRequest?.trackingToken;
        } else if (serviceFilter === 'nakliye') {
          const nakliyeRequest = nakliyeRequests.find(r => r.id.toString() === inProgressJob.id);
          trackingToken = nakliyeRequest?.trackingToken || nakliyeRequest?.tracking_token;
        } else if (serviceFilter === 'roadAssistance') {
          const roadAssistanceRequest = roadAssistanceRequests.find(r => r.id.toString() === inProgressJob.id);
          trackingToken = roadAssistanceRequest?.trackingToken || roadAssistanceRequest?.tracking_token;
        } else if (serviceFilter === 'transfer') {
          const transferRequest = transferRequests.find(r => r.id.toString() === inProgressJob.id);
          trackingToken = transferRequest?.trackingToken || transferRequest?.tracking_token;
        }
      }

      // trackingToken varsa aktif iş olarak set et
      if (trackingToken) {
        const jobServiceType = inProgressJob.serviceType === 'transport' ? 'transport' : serviceFilter;
        setActiveJob(inProgressJob.id, trackingToken, jobServiceType as any);
      }
    }
  }, [filteredJobs, serviceFilter, towTruckRequests, craneRequests, nakliyeRequests, roadAssistanceRequests, transferRequests, setActiveJob]);

  // filter veya serviceFilter değiştiğinde otomatik veri çek
  useEffect(() => {
    if (serviceFilter === 'crane') fetchCraneRequests();
    else if (serviceFilter === 'tow') fetchTowTruckRequests();
    else if (serviceFilter === 'nakliye') fetchNakliyeRequests();
    else if (serviceFilter === 'roadAssistance') fetchRoadAssistanceRequests();
    else if (serviceFilter === 'transfer') fetchTransferRequests();
  }, [filter, serviceFilter, fetchCraneRequests, fetchTowTruckRequests, fetchNakliyeRequests, fetchRoadAssistanceRequests, fetchTransferRequests]);

  // Handle pull-to-refresh
  const onRefresh = useCallback(async () => {
    setCraneRequests([]);
    setTowTruckRequests([]);
    setNakliyeRequests([]);
    setRoadAssistanceRequests([]);
    setTransferRequests([]);
    setRequestsWithAddresses({ crane: [], tow: [], nakliye: [], roadAssistance: [], transfer: [] });

    setLoading(true);
    setRefreshing(true);

    try {
      if (serviceFilter === 'crane') {
        await fetchCraneRequests();
      } else if (serviceFilter === 'tow') {
        await fetchTowTruckRequests();
      } else if (serviceFilter === 'nakliye') {
        await fetchNakliyeRequests();
      } else if (serviceFilter === 'roadAssistance') {
        await fetchRoadAssistanceRequests();
      } else if (serviceFilter === 'transfer') {
        await fetchTransferRequests();
      }

    } catch (error) {
      console.error('❌ Yenileme hatası:', error);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [fetchCraneRequests, fetchTowTruckRequests, fetchNakliyeRequests, fetchRoadAssistanceRequests, fetchTransferRequests, serviceFilter]);

  return {
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
  };
}

/**
 * useTowTruckRequest Hook
 *
 * Çekici talebini backend'den çeken ve yöneten hook.
 * Önce direkt ID ile, bulunamazsa tüm listelerde arayarak talebi bulur.
 *
 * @param orderId - Route'dan gelen talep ID'si
 * @returns {
 *   request: Talep detayları
 *   loading: Yükleme durumu
 *   error: Hata mesajı
 * }
 */
import { useState, useEffect } from 'react';
import { requestsAPI, TowTruckRequestDetail } from '../../../api';

interface UseTowTruckRequestReturn {
  request: TowTruckRequestDetail | null;
  loading: boolean;
  error: string | null;
}

export function useTowTruckRequest(orderId: string): UseTowTruckRequestReturn {
  const [request, setRequest] = useState<TowTruckRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        setError(null);

        console.log('═══════════════════════════════════════════════');
        console.log('📍 TOW TRUCK OFFER - API İSTEĞİ BAŞLIYOR');
        console.log('═══════════════════════════════════════════════');
        console.log('🔑 orderId:', orderId);

        let fetchedRequest: TowTruckRequestDetail;

        try {
          // Önce direkt ID ile dene (request_details_id olabilir)
          console.log('📡 Deneme 1: /requests/tow-truck/details/' + parseInt(orderId) + '/');
          fetchedRequest = await requestsAPI.getTowTruckRequestDetail(parseInt(orderId));
          console.log('✅ Direkt ID ile bulundu');
        } catch (firstError: any) {
          console.warn('⚠️ Direkt ID ile bulunamadı:', firstError?.response?.status);
          console.log('🔄 Deneme 2: Tüm listelerden arama yapılıyor...');

          // Tüm job listelerini çek
          const [pendingJobs, awaitingJobs, inProgressJobs] = await Promise.all([
            requestsAPI.getPendingTowTruckRequests().catch(() => []),
            requestsAPI.getAwaitingApprovalTowTruckRequests().catch(() => []),
            requestsAPI.getInProgressTowTruckRequests().catch(() => []),
          ]);

          const allJobs = [...pendingJobs, ...awaitingJobs, ...inProgressJobs];
          console.log('📋 Toplam job sayısı:', allJobs.length);

          // request_id ile eşleşen job'ı bul
          const matchedJob = allJobs.find((job: any) => {
            const jobRequestId = typeof job.request_id === 'object' ? job.request_id?.id : job.request_id;
            return jobRequestId === parseInt(orderId);
          });

          if (matchedJob) {
            console.log('✅ Job bulundu! Details_id:', matchedJob.id);
            fetchedRequest = await requestsAPI.getTowTruckRequestDetail(matchedJob.id);
          } else {
            throw new Error('İş talebi bulunamadı');
          }
        }

        console.log('✅ Talep yüklendi:', fetchedRequest.id);
        setRequest(fetchedRequest);
      } catch (err: any) {
        console.error('❌ Talep yükleme hatası:', err);
        setError(err?.message || 'Talep detayları yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [orderId]);

  return { request, loading, error };
}

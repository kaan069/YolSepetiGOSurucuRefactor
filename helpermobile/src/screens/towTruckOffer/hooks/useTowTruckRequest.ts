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
import { logger } from '../../../utils/logger';

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

        let fetchedRequest: TowTruckRequestDetail;

        try {
          // Önce direkt ID ile dene (request_details_id olabilir)
          fetchedRequest = await requestsAPI.getTowTruckRequestDetail(parseInt(orderId));
        } catch (firstError: any) {
          logger.warn('orders', 'useTowTruckRequest direct-id miss, falling back to list scan', {
            status: firstError?.response?.status,
          });

          // Tüm job listelerini çek
          const [pendingJobs, awaitingJobs, inProgressJobs] = await Promise.all([
            requestsAPI.getPendingTowTruckRequests().catch(() => []),
            requestsAPI.getAwaitingApprovalTowTruckRequests().catch(() => []),
            requestsAPI.getInProgressTowTruckRequests().catch(() => []),
          ]);

          const allJobs = [...pendingJobs, ...awaitingJobs, ...inProgressJobs];

          // request_id ile eşleşen job'ı bul
          const matchedJob = allJobs.find((job: any) => {
            const jobRequestId = typeof job.request_id === 'object' ? job.request_id?.id : job.request_id;
            return jobRequestId === parseInt(orderId);
          });

          if (matchedJob) {
            fetchedRequest = await requestsAPI.getTowTruckRequestDetail(matchedJob.id);
          } else {
            throw new Error('İş talebi bulunamadı');
          }
        }

        setRequest(fetchedRequest);
      } catch (err: any) {
        logger.error('orders', 'useTowTruckRequest.fetch failure', { status: err?.response?.status });
        setError(err?.message || 'Talep detayları yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [orderId]);

  return { request, loading, error };
}

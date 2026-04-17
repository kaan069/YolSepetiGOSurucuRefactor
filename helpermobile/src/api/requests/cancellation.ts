/**
 * Job Cancellation API
 * Tüm servis tipleri için ortak iptal API metodları
 */
import { axiosInstance } from './base';
import { CanCancelResponse, CancelJobResponse, CancelServiceType } from '../types';

class CancellationAPI {
  /**
   * İptal edilebilirlik kontrolü
   * GET /requests/<service>/<tracking_token>/can-cancel/
   */
  async canCancel(
    serviceType: CancelServiceType,
    trackingToken: string
  ): Promise<CanCancelResponse> {
    const response = await axiosInstance.get<CanCancelResponse>(
      `/requests/${serviceType}/${trackingToken}/can-cancel/`
    );
    return response.data;
  }

  /**
   * İşi iptal et
   * POST /requests/<service>/<tracking_token>/cancel/
   */
  async cancelJob(
    serviceType: CancelServiceType,
    trackingToken: string,
    reason?: string
  ): Promise<CancelJobResponse> {
    const response = await axiosInstance.post<CancelJobResponse>(
      `/requests/${serviceType}/${trackingToken}/cancel/`,
      reason ? { reason } : {}
    );
    return response.data;
  }
}

export const cancellationAPI = new CancellationAPI();
export default cancellationAPI;

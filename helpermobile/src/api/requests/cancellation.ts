/**
 * Job Cancellation API
 * Tüm servis tipleri için ortak iptal API metodları.
 *
 * Canonical `ServiceType` alır, backend URL segment'ine `SERVICE_CANCEL_PATH`
 * üzerinden çevirir. Böylece call-site'lar canonical formu taşır,
 * kebab-case URL detayı tek noktada izole kalır.
 */
import { axiosInstance } from './base';
import { CanCancelResponse, CancelJobResponse } from '../types';
import { ServiceType, SERVICE_CANCEL_PATH } from '../../constants/serviceTypes';

class CancellationAPI {
  /**
   * İptal edilebilirlik kontrolü
   * GET /requests/<service>/<tracking_token>/can-cancel/
   */
  async canCancel(
    serviceType: ServiceType,
    trackingToken: string
  ): Promise<CanCancelResponse> {
    const pathSegment = SERVICE_CANCEL_PATH[serviceType];
    const response = await axiosInstance.get<CanCancelResponse>(
      `/requests/${pathSegment}/${trackingToken}/can-cancel/`
    );
    return response.data;
  }

  /**
   * İşi iptal et
   * POST /requests/<service>/<tracking_token>/cancel/
   */
  async cancelJob(
    serviceType: ServiceType,
    trackingToken: string,
    reason?: string
  ): Promise<CancelJobResponse> {
    const pathSegment = SERVICE_CANCEL_PATH[serviceType];
    const response = await axiosInstance.post<CancelJobResponse>(
      `/requests/${pathSegment}/${trackingToken}/cancel/`,
      reason ? { reason } : {}
    );
    return response.data;
  }
}

export const cancellationAPI = new CancellationAPI();
export default cancellationAPI;

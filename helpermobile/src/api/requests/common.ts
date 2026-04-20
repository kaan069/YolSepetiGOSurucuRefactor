/**
 * Common API
 * Ortak API metodları (earnings, customer işlemleri, komisyon ödemeleri)
 */
import { axiosInstance } from './base';
import {
  EarningsPeriod,
  PeriodEarningsResponse,
  TotalEarningsResponse,
  EarningsListResponse,
  EarningsListParams,
  EarningsServiceType,
  JobCountsResponse,
  RequestPhoto,
} from '../types';
import { getMimeTypeFromUri } from '../vehicles';
import { logOrdersError } from './_helpers';

class CommonAPI {
  // ==================== SÜRÜCÜ FOTOĞRAF YÜKLEME ====================

  async uploadDriverPhotos(requestId: number, photoUris: string[], description?: string): Promise<{
    message: string;
    total_driver_photos: number;
    photos: RequestPhoto[];
  }> {
    try {
      const formData = new FormData();
      photoUris.forEach(uri => {
        const { filename, mimeType } = getMimeTypeFromUri(uri);
        formData.append('photos', { uri, name: filename, type: mimeType } as any);
      });
      if (description) {
        formData.append('description', description);
      }
      const response = await axiosInstance.post(
        `/requests/driver-photos/${requestId}/`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' }, timeout: 60000 }
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('common.uploadDriverPhotos', error);
      throw error;
    }
  }

  // ==================== KAZANÇ (EARNINGS) ====================

  // Toplam kazanç getir
  async getTotalEarnings(): Promise<TotalEarningsResponse> {
    try {
      const response = await axiosInstance.get<TotalEarningsResponse>('/summary/earnings/total/');
      return response.data;
    } catch (error: any) {
      logOrdersError('common.getTotalEarnings', error);
      throw error;
    }
  }

  // Dönemsel kazanç getir (servis tipi filtresi destekli)
  async getPeriodEarnings(
    period?: EarningsPeriod,
    startDate?: string,
    endDate?: string,
    serviceTypes?: EarningsServiceType[]
  ): Promise<PeriodEarningsResponse> {
    try {
      const params = new URLSearchParams();

      if (period) {
        params.append('period', period);
      } else if (startDate && endDate) {
        params.append('start_date', startDate);
        params.append('end_date', endDate);
      }

      // Servis tipi filtresi
      if (serviceTypes && serviceTypes.length > 0) {
        params.append('service_type', serviceTypes.join(','));
      }

      const url = '/summary/earnings/period/' + (params.toString() ? `?${params.toString()}` : '');
      const response = await axiosInstance.get<PeriodEarningsResponse>(url);

      return response.data;
    } catch (error: any) {
      logOrdersError('common.getPeriodEarnings', error);
      throw error;
    }
  }

  // Kazanç listesi getir (pagination destekli)
  async getEarningsList(params?: EarningsListParams): Promise<EarningsListResponse> {
    try {
      const urlParams = new URLSearchParams();

      if (params?.page) {
        urlParams.append('page', params.page.toString());
      }
      if (params?.page_size) {
        urlParams.append('page_size', params.page_size.toString());
      }
      if (params?.service_type) {
        urlParams.append('service_type', params.service_type);
      }
      if (params?.period) {
        urlParams.append('period', params.period);
      }
      if (params?.start_date) {
        urlParams.append('start_date', params.start_date);
      }
      if (params?.end_date) {
        urlParams.append('end_date', params.end_date);
      }

      const queryString = urlParams.toString();
      const url = '/summary/earnings/list/' + (queryString ? `?${queryString}` : '');

      const response = await axiosInstance.get<EarningsListResponse>(url);

      return response.data;
    } catch (error: any) {
      logOrdersError('common.getEarningsList', error);
      throw error;
    }
  }

  // ==================== MÜŞTERİ İŞLEMLERİ (CUSTOMER OPERATIONS) ====================

  // Müşteri işi tamamlar
  async completeJobByCustomer(token: string): Promise<{
    message: string;
    request_id: number;
    status: string;
    estimated_price: number;
  }> {
    try {
      const response = await axiosInstance.post(`/request/location/${token}/complete/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('common.completeJobByCustomer', error);
      throw error;
    }
  }

  // Müşteri teklifi onaylar
  async approveRequestByCustomer(token: string): Promise<{
    message: string;
    request_id: number;
    status: string;
    driver_name: string;
    estimated_price: string;
  }> {
    try {
      const response = await axiosInstance.post(`/request/location/${token}/approve/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('common.approveRequestByCustomer', error);
      throw error;
    }
  }

  // Müşteri teklifi reddeder
  async rejectRequestByCustomer(token: string, reason?: string): Promise<{
    message: string;
    request_id: number;
    status: string;
  }> {
    try {
      const response = await axiosInstance.post(`/request/location/${token}/reject/`, {
        reason: reason || 'Müşteri teklifi reddetti'
      });
      return response.data;
    } catch (error: any) {
      logOrdersError('common.rejectRequestByCustomer', error);
      throw error;
    }
  }

  // ==================== KOMİSYON ÖDEME (COMMISSION PAYMENT) ====================

  // Vinç komisyon ödemesi
  async payCraneCommission(requestId: number): Promise<{
    success: boolean;
    message: string;
    request_id: number;
    status: string;
    payment_amount: string;
    transaction_id?: string;
  }> {
    try {
      const response = await axiosInstance.post(`/payment/requests/${requestId}/pay-commission/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('common.payCraneCommission', error);
      throw error;
    }
  }

  // Çekici işi tamamla
  async completeTowTruckRequest(requestId: number): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/tow-truck/${requestId}/complete/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('common.completeTowTruckRequest', error);
      throw error;
    }
  }

  // Vinç işi tamamla
  async completeCraneRequest(requestId: number): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/crane/${requestId}/complete/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('common.completeCraneRequest', error);
      throw error;
    }
  }

  // ==================== İŞ SAYILARI (JOB COUNTS) ====================

  // Tüm servislerin iş sayılarını getir (tek çağrı)
  async getAllServicesCounts(): Promise<Record<string, JobCountsResponse>> {
    try {
      const response = await axiosInstance.get<Record<string, JobCountsResponse>>('/requests/all-counts/');
      return response.data;
    } catch (error: any) {
      logOrdersError('common.getAllServicesCounts', error);
      throw error;
    }
  }

  // Tekil servis iş sayılarını getir
  async getServiceCounts(serviceType: string): Promise<JobCountsResponse> {
    try {
      const response = await axiosInstance.get<JobCountsResponse>(`/requests/${serviceType}/counts/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('common.getServiceCounts', error);
      throw error;
    }
  }

}

export const commonAPI = new CommonAPI();
export default commonAPI;

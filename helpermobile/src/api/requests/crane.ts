/**
 * Crane (Vinç) API
 * Vinç talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';
import {
  CraneRequest,
  CraneListResponse,
} from '../types';
import { logOrdersError } from './_helpers';

class CraneAPI {
  // Bekleyen vinç taleplerini getir
  async getPendingRequests(): Promise<CraneRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<CraneRequest>>(
        '/requests/crane/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('crane.getPendingRequests', error);
      throw error;
    }
  }

  // Müsait vinç taleplerini getir (pending + awaiting_approval - kendi tekliflerim)
  async getAvailableRequests(): Promise<CraneRequest[]> {
    try {
      const [allDetailsResponse, myAwaitingResponse] = await Promise.all([
        axiosInstance.get<CraneRequest[]>('/requests/crane/details/'),
        axiosInstance.get<PaginatedResponse<CraneRequest>>(
          '/requests/crane/awaiting-approval/?page_size=50'
        ).catch(() => ({ data: { results: [] } }))
      ]);

      const allDetails = allDetailsResponse.data;
      const availableStatusRequests = allDetails.filter(
        r => r.status === 'pending' || r.status === 'awaiting_approval'
      );

      const myAwaitingRequests = myAwaitingResponse.data.results;
      const myAwaitingIds = new Set(myAwaitingRequests.map(r => r.id));
      const availableRequests = availableStatusRequests.filter(r => !myAwaitingIds.has(r.id));

      return availableRequests;
    } catch (error) {
      logOrdersError('crane.getAvailableRequests', error);
      throw error;
    }
  }

  // Onay bekleyen vinç taleplerini getir
  async getAwaitingApprovalRequests(): Promise<CraneRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<CraneRequest>>(
        '/requests/crane/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('crane.getAwaitingApprovalRequests', error);
      throw error;
    }
  }

  // Ödeme bekleyen vinç taleplerini getir
  async getAwaitingPaymentRequests(): Promise<CraneRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<CraneRequest>>(
        '/requests/crane/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('crane.getAwaitingPaymentRequests', error);
      throw error;
    }
  }

  // Devam eden vinç taleplerini getir
  async getInProgressRequests(): Promise<CraneRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<CraneRequest>>(
        '/requests/crane/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('crane.getInProgressRequests', error);
      throw error;
    }
  }

  // Tamamlanan vinç taleplerini getir
  async getCompletedRequests(): Promise<CraneRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<CraneRequest>>(
        '/summary/completed/crane/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('crane.getCompletedRequests', error);
      throw error;
    }
  }

  // Vinç talebi detayını getir
  async getRequestDetail(id: number): Promise<CraneRequest> {
    try {
      const response = await axiosInstance.get<CraneRequest>(`/requests/crane/details/${id}/`);
      return response.data;
    } catch (error) {
      logOrdersError('crane.getRequestDetail', error);
      throw error;
    }
  }

  // ServiceRequest ID ile vinç detayı bul (kazanç ekranından gelen ID'ler için)
  async findByServiceRequestId(serviceRequestId: number): Promise<CraneRequest | null> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<CraneRequest>>(
        '/summary/completed/crane/?page_size=100'
      );
      const match = response.data.results.find((r) => {
        const reqId = typeof r.request_id === 'object' ? r.request_id?.id : r.request_id;
        return reqId === serviceRequestId;
      });
      return match || null;
    } catch (error) {
      logOrdersError('crane.findByServiceRequestId', error);
      return null;
    }
  }

  // Kullanıcının vinçlerini listele
  async getMyCranes(): Promise<CraneListResponse> {
    try {
      const response = await axiosInstance.get<CraneListResponse>('/requests/crane/my-cranes/');
      return response.data;
    } catch (error) {
      logOrdersError('crane.getMyCranes', error);
      throw error;
    }
  }

  // Teklif gönder (manuel fiyat teklifi sistemi)
  async submitOffer(
    trackingToken: string,
    vehicleId: number,
    distanceToLocationKm: number,
    estimatedDurationHours: number,
    offerPrice: number,
    employeeId?: number
  ): Promise<any> {
    try {
      const payload: any = {
        vehicle_id: vehicleId,
        distance_to_location_km: distanceToLocationKm,
        estimated_duration_hours: estimatedDurationHours,
        proposed_price: offerPrice
      };
      if (employeeId) {
        payload.employee_id = employeeId;
      }
      const response = await axiosInstance.post(`/requests/crane/${trackingToken}/submit-offer/`, payload);
      return response.data;
    } catch (error: any) {
      logOrdersError('crane.submitOffer', error);
      throw error;
    }
  }

  // İşi tamamla
  async completeRequest(requestId: number): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/crane/${requestId}/complete/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('crane.completeRequest', error);
      throw error;
    }
  }

  // Komisyon öde
  async payCommission(requestId: number): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/crane/${requestId}/pay-commission/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('crane.payCommission', error);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.delete(`/requests/crane/${trackingToken}/withdraw-offer/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('crane.withdrawOffer', error);
      throw error;
    }
  }
}

export const craneAPI = new CraneAPI();
export default craneAPI;

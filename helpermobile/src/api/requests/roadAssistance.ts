/**
 * Road Assistance (Yol Yardım) API
 * Yol yardım talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';
import type {
  RoadAssistanceRequest,
  RoadAssistanceRequestDetail,
  RoadAssistanceOfferPayload,
  RoadAssistanceActionResponse,
} from '../types';
import { logOrdersError } from './_helpers';

class RoadAssistanceAPI {
  // Bekleyen yol yardım taleplerini getir
  async getPendingRequests(): Promise<RoadAssistanceRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<RoadAssistanceRequest>>(
        '/requests/road-assistance/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('roadAssistance.getPendingRequests', error);
      return [];
    }
  }

  // Müsait yol yardım taleplerini getir (pending + awaiting_approval - kendi tekliflerim)
  async getAvailableRequests(): Promise<RoadAssistanceRequest[]> {
    try {
      const [allDetailsResponse, myAwaitingResponse] = await Promise.all([
        axiosInstance.get<RoadAssistanceRequest[]>('/requests/road-assistance/details/').catch(() => ({ data: [] as RoadAssistanceRequest[] })),
        axiosInstance.get<PaginatedResponse<RoadAssistanceRequest>>(
          '/requests/road-assistance/awaiting-approval/?page_size=50'
        ).catch(() => ({ data: { results: [] as RoadAssistanceRequest[] } }))
      ]);

      const allDetails = allDetailsResponse.data || [];
      const availableStatusRequests = allDetails.filter(
        (r) => r.status === 'pending' || r.status === 'awaiting_approval'
      );

      const myAwaitingRequests = myAwaitingResponse.data.results || [];
      const myAwaitingIds = new Set(myAwaitingRequests.map((r) => r.id));
      const availableRequests = availableStatusRequests.filter((r) => !myAwaitingIds.has(r.id));

      return availableRequests;
    } catch (error) {
      logOrdersError('roadAssistance.getAvailableRequests', error);
      return [];
    }
  }

  // Onay bekleyen yol yardım taleplerini getir
  async getAwaitingApprovalRequests(): Promise<RoadAssistanceRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<RoadAssistanceRequest>>(
        '/requests/road-assistance/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('roadAssistance.getAwaitingApprovalRequests', error);
      return [];
    }
  }

  // Ödeme bekleyen yol yardım taleplerini getir
  async getAwaitingPaymentRequests(): Promise<RoadAssistanceRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<RoadAssistanceRequest>>(
        '/requests/road-assistance/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('roadAssistance.getAwaitingPaymentRequests', error);
      return [];
    }
  }

  // Devam eden yol yardım taleplerini getir
  async getInProgressRequests(): Promise<RoadAssistanceRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<RoadAssistanceRequest>>(
        '/requests/road-assistance/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('roadAssistance.getInProgressRequests', error);
      return [];
    }
  }

  // Tamamlanan yol yardım taleplerini getir
  async getCompletedRequests(): Promise<RoadAssistanceRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<RoadAssistanceRequest>>(
        '/summary/completed/road-assistance/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('roadAssistance.getCompletedRequests', error);
      return [];
    }
  }

  // Yol yardım talebi detayını getir
  async getRequestDetail(id: number): Promise<RoadAssistanceRequestDetail> {
    try {
      const response = await axiosInstance.get<RoadAssistanceRequestDetail>(
        `/requests/road-assistance/details/${id}/`
      );
      return response.data;
    } catch (error) {
      logOrdersError('roadAssistance.getRequestDetail', error);
      throw error;
    }
  }

  // Teklif gönder
  async submitOffer(
    trackingToken: string,
    proposedPrice: number,
    distanceToLocationKm: number,
    vehicleId?: number,
    employeeId?: number
  ): Promise<RoadAssistanceActionResponse> {
    try {
      const payload: RoadAssistanceOfferPayload = {
        proposed_price: proposedPrice,
        distance_to_location_km: distanceToLocationKm,
      };

      // vehicle_id varsa ekle
      if (vehicleId) {
        payload.vehicle_id = vehicleId;
      }
      if (employeeId) {
        payload.employee_id = employeeId;
      }

      const response = await axiosInstance.post<RoadAssistanceActionResponse>(
        `/requests/road-assistance/${trackingToken}/submit-offer/`,
        payload
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('roadAssistance.submitOffer', error);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<RoadAssistanceActionResponse> {
    try {
      const response = await axiosInstance.delete<RoadAssistanceActionResponse>(
        `/requests/road-assistance/${trackingToken}/withdraw-offer/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('roadAssistance.withdrawOffer', error);
      throw error;
    }
  }
}

export const roadAssistanceAPI = new RoadAssistanceAPI();
export default roadAssistanceAPI;

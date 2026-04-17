/**
 * Transfer API
 * Transfer talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';
import {
  TransferRequest,
} from '../types';

class TransferAPI {
  // Bekleyen transfer taleplerini getir
  async getPendingRequests(): Promise<TransferRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TransferRequest>>(
        '/requests/transfer/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get pending transfer requests error:', error);
      throw error;
    }
  }

  // Müsait transfer taleplerini getir (pending + awaiting_approval - kendi tekliflerim)
  async getAvailableRequests(): Promise<TransferRequest[]> {
    try {
      const [allDetailsResponse, myAwaitingResponse] = await Promise.all([
        axiosInstance.get<TransferRequest[]>('/requests/transfer/details/'),
        axiosInstance.get<PaginatedResponse<TransferRequest>>(
          '/requests/transfer/awaiting-approval/?page_size=50'
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
      console.error('❌ Get available transfer requests error:', error);
      throw error;
    }
  }

  // Onay bekleyen transfer taleplerini getir
  async getAwaitingApprovalRequests(): Promise<TransferRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TransferRequest>>(
        '/requests/transfer/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get awaiting approval transfer requests error:', error);
      throw error;
    }
  }

  // Ödeme bekleyen transfer taleplerini getir
  async getAwaitingPaymentRequests(): Promise<TransferRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TransferRequest>>(
        '/requests/transfer/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get awaiting payment transfer requests error:', error);
      throw error;
    }
  }

  // Devam eden transfer taleplerini getir
  async getInProgressRequests(): Promise<TransferRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TransferRequest>>(
        '/requests/transfer/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get in progress transfer requests error:', error);
      throw error;
    }
  }

  // Tamamlanan transfer taleplerini getir
  async getCompletedRequests(): Promise<TransferRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TransferRequest>>(
        '/requests/transfer/completed/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get completed transfer requests error:', error);
      throw error;
    }
  }

  // Transfer talebi detayını getir
  async getRequestDetail(id: number): Promise<TransferRequest> {
    try {
      const response = await axiosInstance.get<TransferRequest>(`/requests/transfer/details/${id}/`);
      return response.data;
    } catch (error) {
      console.error('Get transfer request detail error:', error);
      throw error;
    }
  }

  // Teklif gönder
  async submitOffer(
    trackingToken: string,
    data: {
      proposed_price: number;
      vehicle_id: number;
      employee_id?: number;
    }
  ): Promise<any> {
    try {
      const response = await axiosInstance.post(
        `/requests/transfer/${trackingToken}/submit-offer/`,
        data
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Transfer teklif gönderme hatası:', error?.response?.data);
      throw error;
    }
  }

  // Teklifi geri çek
  async withdrawOffer(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.delete(
        `/requests/transfer/${trackingToken}/withdraw-offer/`
      );
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Transfer teklif geri çekme hatası:', error?.response?.data);
      throw error;
    }
  }
  // Yola çıkış bildir
  async depart(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/transfer/${trackingToken}/depart/`);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Transfer yola çıkış hatası:', error?.response?.data);
      throw error;
    }
  }
}

export const transferAPI = new TransferAPI();
export default transferAPI;

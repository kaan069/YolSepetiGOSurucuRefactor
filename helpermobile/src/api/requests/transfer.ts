/**
 * Transfer API
 * Transfer talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';
import type {
  TransferRequest,
  TransferRequestDetail,
  TransferOfferPayload,
  TransferActionResponse,
} from '../types';
import { logOrdersError } from './_helpers';

class TransferAPI {
  // Bekleyen transfer taleplerini getir
  async getPendingRequests(): Promise<TransferRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TransferRequest>>(
        '/requests/transfer/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('transfer.getPendingRequests', error);
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
        ).catch(() => ({ data: { results: [] as TransferRequest[] } }))
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
      logOrdersError('transfer.getAvailableRequests', error);
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
      logOrdersError('transfer.getAwaitingApprovalRequests', error);
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
      logOrdersError('transfer.getAwaitingPaymentRequests', error);
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
      logOrdersError('transfer.getInProgressRequests', error);
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
      logOrdersError('transfer.getCompletedRequests', error);
      throw error;
    }
  }

  // Transfer talebi detayını getir
  async getRequestDetail(id: number): Promise<TransferRequestDetail> {
    try {
      const response = await axiosInstance.get<TransferRequestDetail>(
        `/requests/transfer/details/${id}/`
      );
      return response.data;
    } catch (error) {
      logOrdersError('transfer.getRequestDetail', error);
      throw error;
    }
  }

  // Teklif gönder
  async submitOffer(
    trackingToken: string,
    data: TransferOfferPayload
  ): Promise<TransferActionResponse> {
    try {
      const response = await axiosInstance.post<TransferActionResponse>(
        `/requests/transfer/${trackingToken}/submit-offer/`,
        data
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('transfer.submitOffer', error);
      throw error;
    }
  }

  // Teklifi geri çek
  async withdrawOffer(trackingToken: string): Promise<TransferActionResponse> {
    try {
      const response = await axiosInstance.delete<TransferActionResponse>(
        `/requests/transfer/${trackingToken}/withdraw-offer/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('transfer.withdrawOffer', error);
      throw error;
    }
  }

  // Yola çıkış bildir
  async depart(trackingToken: string): Promise<TransferActionResponse> {
    try {
      const response = await axiosInstance.post<TransferActionResponse>(
        `/requests/transfer/${trackingToken}/depart/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('transfer.depart', error);
      throw error;
    }
  }
}

export const transferAPI = new TransferAPI();
export default transferAPI;

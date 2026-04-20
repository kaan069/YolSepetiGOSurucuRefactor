/**
 * Nakliye (Moving) API
 * Evden Eve ve Şehirler Arası Nakliye talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';
import type {
  MovingRequest,
  MovingRequestDetail,
  MovingOfferPayload,
  MovingActionResponse,
} from '../types';
import { logOrdersError } from './_helpers';

// ==================== EVDEN EVE NAKLİYE (HOME MOVING) ====================

class HomeMovingAPI {
  // Bekleyen evden eve nakliye taleplerini getir
  async getPendingRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/home-moving/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('homeMoving.getPendingRequests', error);
      throw error;
    }
  }

  // Onay bekleyen evden eve nakliye taleplerini getir
  async getAwaitingApprovalRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/home-moving/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('homeMoving.getAwaitingApprovalRequests', error);
      throw error;
    }
  }

  // Ödeme bekleyen evden eve nakliye taleplerini getir
  async getAwaitingPaymentRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/home-moving/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('homeMoving.getAwaitingPaymentRequests', error);
      return [];
    }
  }

  // Devam eden evden eve nakliye taleplerini getir
  async getInProgressRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/home-moving/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('homeMoving.getInProgressRequests', error);
      throw error;
    }
  }

  // Tamamlanan evden eve nakliye taleplerini getir
  async getCompletedRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/summary/completed/home-moving/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('homeMoving.getCompletedRequests', error);
      throw error;
    }
  }

  // Evden eve nakliye talebi detayını getir
  async getRequestDetail(id: number): Promise<MovingRequestDetail> {
    try {
      const response = await axiosInstance.get<MovingRequestDetail>(`/requests/home-moving/details/${id}/`);
      return response.data;
    } catch (error) {
      logOrdersError('homeMoving.getRequestDetail', error);
      throw error;
    }
  }

  // Teklif gönder
  async submitOffer(
    trackingToken: string,
    proposedPrice: number,
    totalDistanceKm: number,
    vehicleId?: number,
    employeeId?: number
  ): Promise<MovingActionResponse> {
    try {
      const payload: MovingOfferPayload = {
        proposed_price: proposedPrice,
        total_distance_km: totalDistanceKm,
      };

      // vehicle_id varsa ekle
      if (vehicleId) {
        payload.vehicle_id = vehicleId;
      }
      if (employeeId) {
        payload.employee_id = employeeId;
      }

      const response = await axiosInstance.post<MovingActionResponse>(
        `/requests/home-moving/${trackingToken}/submit-offer/`,
        payload
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('homeMoving.submitOffer', error);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<MovingActionResponse> {
    try {
      const response = await axiosInstance.delete<MovingActionResponse>(
        `/requests/home-moving/${trackingToken}/withdraw-offer/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('homeMoving.withdrawOffer', error);
      throw error;
    }
  }

  async depart(trackingToken: string): Promise<MovingActionResponse> {
    try {
      const response = await axiosInstance.post<MovingActionResponse>(
        `/requests/home-moving/${trackingToken}/depart/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('homeMoving.depart', error);
      throw error;
    }
  }
}

// ==================== ŞEHİRLER ARASI NAKLİYE (CITY MOVING) ====================

class CityMovingAPI {
  // Bekleyen şehirler arası nakliye taleplerini getir
  async getPendingRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/city-moving/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('cityMoving.getPendingRequests', error);
      throw error;
    }
  }

  // Onay bekleyen şehirler arası nakliye taleplerini getir
  async getAwaitingApprovalRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/city-moving/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('cityMoving.getAwaitingApprovalRequests', error);
      throw error;
    }
  }

  // Ödeme bekleyen şehirler arası nakliye taleplerini getir
  async getAwaitingPaymentRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/city-moving/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('cityMoving.getAwaitingPaymentRequests', error);
      return [];
    }
  }

  // Devam eden şehirler arası nakliye taleplerini getir
  async getInProgressRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/requests/city-moving/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('cityMoving.getInProgressRequests', error);
      throw error;
    }
  }

  // Tamamlanan şehirler arası nakliye taleplerini getir
  async getCompletedRequests(): Promise<MovingRequest[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<MovingRequest>>(
        '/summary/completed/city-moving/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('cityMoving.getCompletedRequests', error);
      throw error;
    }
  }

  // Şehirler arası nakliye talebi detayını getir
  async getRequestDetail(id: number): Promise<MovingRequestDetail> {
    try {
      const response = await axiosInstance.get<MovingRequestDetail>(`/requests/city-moving/details/${id}/`);
      return response.data;
    } catch (error) {
      logOrdersError('cityMoving.getRequestDetail', error);
      throw error;
    }
  }

  // Teklif gönder
  async submitOffer(
    trackingToken: string,
    proposedPrice: number,
    totalDistanceKm: number,
    vehicleId?: number,
    employeeId?: number
  ): Promise<MovingActionResponse> {
    try {
      const payload: MovingOfferPayload = {
        proposed_price: proposedPrice,
        total_distance_km: totalDistanceKm,
      };

      // vehicle_id varsa ekle
      if (vehicleId) {
        payload.vehicle_id = vehicleId;
      }
      if (employeeId) {
        payload.employee_id = employeeId;
      }

      const response = await axiosInstance.post<MovingActionResponse>(
        `/requests/city-moving/${trackingToken}/submit-offer/`,
        payload
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('cityMoving.submitOffer', error);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<MovingActionResponse> {
    try {
      const response = await axiosInstance.delete<MovingActionResponse>(
        `/requests/city-moving/${trackingToken}/withdraw-offer/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('cityMoving.withdrawOffer', error);
      throw error;
    }
  }

  async depart(trackingToken: string): Promise<MovingActionResponse> {
    try {
      const response = await axiosInstance.post<MovingActionResponse>(
        `/requests/city-moving/${trackingToken}/depart/`
      );
      return response.data;
    } catch (error: any) {
      logOrdersError('cityMoving.depart', error);
      throw error;
    }
  }
}

export const homeMovingAPI = new HomeMovingAPI();
export const cityMovingAPI = new CityMovingAPI();

// Birleşik nakliye API'si
export const nakliyeAPI = {
  homeMoving: homeMovingAPI,
  cityMoving: cityMovingAPI
};

export default nakliyeAPI;

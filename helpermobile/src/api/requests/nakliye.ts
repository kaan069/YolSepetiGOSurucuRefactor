/**
 * Nakliye (Moving) API
 * Evden Eve ve Şehirler Arası Nakliye talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';

// ==================== EVDEN EVE NAKLİYE (HOME MOVING) ====================

class HomeMovingAPI {
  // Bekleyen evden eve nakliye taleplerini getir
  async getPendingRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/home-moving/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get pending home moving requests error:', error);
      throw error;
    }
  }

  // Onay bekleyen evden eve nakliye taleplerini getir
  async getAwaitingApprovalRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/home-moving/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get awaiting approval home moving requests error:', error);
      throw error;
    }
  }

  // Ödeme bekleyen evden eve nakliye taleplerini getir
  async getAwaitingPaymentRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/home-moving/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get awaiting payment home moving requests error:', error);
      return [];
    }
  }

  // Devam eden evden eve nakliye taleplerini getir
  async getInProgressRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/home-moving/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get in-progress home moving requests error:', error);
      throw error;
    }
  }

  // Tamamlanan evden eve nakliye taleplerini getir
  async getCompletedRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/summary/completed/home-moving/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get completed home moving requests error:', error);
      throw error;
    }
  }

  // Evden eve nakliye talebi detayını getir
  async getRequestDetail(id: number): Promise<any> {
    try {
      const response = await axiosInstance.get<any>(`/requests/home-moving/details/${id}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Get home moving request detail error:', error);
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
  ): Promise<any> {
    try {
      const payload: any = {
        proposed_price: proposedPrice,
        total_distance_km: totalDistanceKm
      };

      // vehicle_id varsa ekle
      if (vehicleId) {
        payload.vehicle_id = vehicleId;
      }
      if (employeeId) {
        payload.employee_id = employeeId;
      }

      const response = await axiosInstance.post(`/requests/home-moving/${trackingToken}/submit-offer/`, payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ Submit home moving offer error:', error?.response?.data);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.delete(`/requests/home-moving/${trackingToken}/withdraw-offer/`);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Evden eve nakliye teklif geri çekme hatası:', error?.response?.data);
      throw error;
    }
  }

  async depart(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/home-moving/${trackingToken}/depart/`);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Evden eve nakliye yola çıkış hatası:', error?.response?.data);
      throw error;
    }
  }
}

// ==================== ŞEHİRLER ARASI NAKLİYE (CITY MOVING) ====================

class CityMovingAPI {
  // Bekleyen şehirler arası nakliye taleplerini getir
  async getPendingRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/city-moving/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get pending city moving requests error:', error);
      throw error;
    }
  }

  // Onay bekleyen şehirler arası nakliye taleplerini getir
  async getAwaitingApprovalRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/city-moving/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get awaiting approval city moving requests error:', error);
      throw error;
    }
  }

  // Ödeme bekleyen şehirler arası nakliye taleplerini getir
  async getAwaitingPaymentRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/city-moving/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get awaiting payment city moving requests error:', error);
      return [];
    }
  }

  // Devam eden şehirler arası nakliye taleplerini getir
  async getInProgressRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/requests/city-moving/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get in-progress city moving requests error:', error);
      throw error;
    }
  }

  // Tamamlanan şehirler arası nakliye taleplerini getir
  async getCompletedRequests(): Promise<any[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<any>>(
        '/summary/completed/city-moving/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      console.error('❌ Get completed city moving requests error:', error);
      throw error;
    }
  }

  // Şehirler arası nakliye talebi detayını getir
  async getRequestDetail(id: number): Promise<any> {
    try {
      const response = await axiosInstance.get<any>(`/requests/city-moving/details/${id}/`);
      return response.data;
    } catch (error) {
      console.error('❌ Get city moving request detail error:', error);
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
  ): Promise<any> {
    try {
      const payload: any = {
        proposed_price: proposedPrice,
        total_distance_km: totalDistanceKm
      };

      // vehicle_id varsa ekle
      if (vehicleId) {
        payload.vehicle_id = vehicleId;
      }
      if (employeeId) {
        payload.employee_id = employeeId;
      }

      const response = await axiosInstance.post(`/requests/city-moving/${trackingToken}/submit-offer/`, payload);
      return response.data;
    } catch (error: any) {
      console.error('❌ Submit city moving offer error:', error?.response?.data);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.delete(`/requests/city-moving/${trackingToken}/withdraw-offer/`);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Şehirler arası nakliye teklif geri çekme hatası:', error?.response?.data);
      throw error;
    }
  }

  async depart(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.post(`/requests/city-moving/${trackingToken}/depart/`);
      return response.data;
    } catch (error: any) {
      console.error('❌ API: Şehirler arası nakliye yola çıkış hatası:', error?.response?.data);
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

/**
 * Tow Truck (Çekici) API
 * Çekici talepleri için API metodları
 */
import { axiosInstance, PaginatedResponse } from './base';
import { TowTruckRequestDetail, AcceptTowTruckResponse } from '../types';
import { logOrdersError } from './_helpers';

class TowTruckAPI {
  // Bekleyen çekici taleplerini getir
  async getPendingRequests(): Promise<TowTruckRequestDetail[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TowTruckRequestDetail>>(
        '/requests/tow-truck/pending/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('towTruck.getPendingRequests', error);
      throw error;
    }
  }

  // Müsait çekici taleplerini getir (pending + awaiting_approval - kendi tekliflerim)
  async getAvailableRequests(): Promise<TowTruckRequestDetail[]> {
    try {
      const [allDetailsResponse, myAwaitingResponse] = await Promise.all([
        axiosInstance.get<TowTruckRequestDetail[]>('/requests/tow-truck/details/'),
        axiosInstance.get<PaginatedResponse<TowTruckRequestDetail>>(
          '/requests/tow-truck/awaiting-approval/?page_size=50'
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
      logOrdersError('towTruck.getAvailableRequests', error);
      throw error;
    }
  }

  // Onay bekleyen çekici taleplerini getir
  async getAwaitingApprovalRequests(): Promise<TowTruckRequestDetail[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TowTruckRequestDetail>>(
        '/requests/tow-truck/awaiting-approval/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('towTruck.getAwaitingApprovalRequests', error);
      throw error;
    }
  }

  // Ödeme bekleyen çekici taleplerini getir
  async getAwaitingPaymentRequests(): Promise<TowTruckRequestDetail[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TowTruckRequestDetail>>(
        '/requests/tow-truck/awaiting-payment/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('towTruck.getAwaitingPaymentRequests', error);
      return [];
    }
  }

  // Devam eden çekici taleplerini getir
  async getInProgressRequests(): Promise<TowTruckRequestDetail[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TowTruckRequestDetail>>(
        '/requests/tow-truck/in-progress/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('towTruck.getInProgressRequests', error);
      throw error;
    }
  }

  // Tamamlanan çekici taleplerini getir
  async getCompletedRequests(): Promise<TowTruckRequestDetail[]> {
    try {
      const response = await axiosInstance.get<PaginatedResponse<TowTruckRequestDetail>>(
        '/summary/completed/tow-truck/?page_size=15'
      );
      return response.data.results;
    } catch (error) {
      logOrdersError('towTruck.getCompletedRequests', error);
      throw error;
    }
  }

  // Çekici talebi detayını getir
  async getRequestDetail(id: number): Promise<TowTruckRequestDetail> {
    try {
      const response = await axiosInstance.get<TowTruckRequestDetail>(`/requests/tow-truck/details/${id}/`);
      return response.data;
    } catch (error) {
      logOrdersError('towTruck.getRequestDetail', error);
      throw error;
    }
  }

  // Fiyat hesapla
  async calculatePrice(
    trackingToken: string,
    totalDistanceKm: number,
    vehicleCondition: {
      isOnRoad?: boolean;
      isGearStuck?: boolean;
      isTireLocked?: boolean;
      isStuck?: boolean;
      isVehicleOperational?: boolean;
      hasExtraAttachments?: boolean;
    }
  ): Promise<any> {
    try {
      const requestBody = {
        totalDistanceKm,
        isOnRoad: vehicleCondition.isOnRoad,
        isGearStuck: vehicleCondition.isGearStuck,
        isTireLocked: vehicleCondition.isTireLocked ?? false,
        isStuck: vehicleCondition.isStuck,
        isVehicleOperational: vehicleCondition.isVehicleOperational,
        hasExtraAttachments: vehicleCondition.hasExtraAttachments
      };

      const response = await axiosInstance.post(`/requests/tow-truck/${trackingToken}/calculate-price/`, requestBody);
      return response.data;
    } catch (error: any) {
      logOrdersError('towTruck.calculatePrice', error);
      throw error;
    }
  }

  // Talebi kabul et (eski sistem)
  async acceptRequest(
    trackingToken: string,
    vehicleId: number,
    totalDistanceKm: number,
    driverLatitude: number,
    driverLongitude: number
  ): Promise<AcceptTowTruckResponse> {
    try {
      const response = await axiosInstance.post(`/requests/tow-truck/${trackingToken}/accept/`, {
        vehicleId,
        totalDistanceKm,
        driverLatitude,
        driverLongitude
      });
      return response.data;
    } catch (error: any) {
      logOrdersError('towTruck.acceptRequest', error);
      throw error;
    }
  }

  // Teklif gönder (yeni multi-offer sistem)
  async submitOffer(
    trackingToken: string,
    vehicleId: number,
    totalDistanceKm: number,
    proposedPrice: number,
    isGearStuck?: boolean,
    isStuck?: boolean,
    isVehicleOperational?: boolean,
    hasExtraAttachments?: boolean,
    attachmentTypes?: string[],
    employeeId?: number
  ): Promise<any> {
    try {
      const payload: any = {
        vehicle_id: vehicleId,
        total_distance_km: totalDistanceKm,
        proposed_price: proposedPrice,
        is_gear_stuck: isGearStuck || false,
        is_stuck: isStuck || false,
        is_vehicle_operational: isVehicleOperational !== undefined ? isVehicleOperational : true,
        has_extra_attachments: hasExtraAttachments || false,
        attachment_types: attachmentTypes || []
      };
      if (employeeId) {
        payload.employee_id = employeeId;
      }
      const response = await axiosInstance.post(`/requests/tow-truck/${trackingToken}/submit-offer/`, payload);
      return response.data;
    } catch (error: any) {
      logOrdersError('towTruck.submitOffer', error);
      throw error;
    }
  }

  async withdrawOffer(trackingToken: string): Promise<any> {
    try {
      const response = await axiosInstance.delete(`/requests/tow-truck/${trackingToken}/withdraw-offer/`);
      return response.data;
    } catch (error: any) {
      logOrdersError('towTruck.withdrawOffer', error);
      throw error;
    }
  }
}

export const towTruckAPI = new TowTruckAPI();
export default towTruckAPI;

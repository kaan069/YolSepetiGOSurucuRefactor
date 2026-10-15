import axiosInstance from './axiosConfig';
import { logger } from '../utils/logger';

/**
 * Acente doğrudan ataması (sürücü tarafı).
 *
 * Acente talebi havuzundaki bir sürücüye atar; sürücü mevcut teklif ekranından
 * teklif vererek kabul eder (ayrı bir kabul ucu yok). Atama varsayılan 180 sn sürer.
 */
export interface DriverAgencyAssignment {
    id: number;
    request_id: number;
    service_type: 'tow' | 'crane' | 'home_moving' | 'city_moving' | 'road_assistance' | 'transfer';
    agency_name: string;
    /** ISO UTC */
    expires_at: string;
    created_at: string;
    customer_location: { latitude: number; longitude: number } | null;
}

/** Atama uçlarındaki hata gövdesi: { error, error_code } */
export type AgencyAssignmentErrorCode = 'ASSIGNMENT_NOT_PENDING' | 'ASSIGNMENT_NOT_FOUND' | string;

class AgencyAssignmentsAPI {
    // Bekleyen (süresi dolmamış) atamalarım
    async list(): Promise<DriverAgencyAssignment[]> {
        const response = await axiosInstance.get<{ count: number; results: DriverAgencyAssignment[] }>(
            '/requests/agency-assignments/',
        );
        return response.data.results ?? [];
    }

    // Atamayı reddet
    async decline(assignmentId: number): Promise<{ message: string; status: string }> {
        try {
            const response = await axiosInstance.post<{ message: string; status: string }>(
                `/requests/agency-assignments/${assignmentId}/decline/`,
            );
            return response.data;
        } catch (error: any) {
            logger.error('orders', 'agencyAssignments.decline failed', { status: error?.response?.status });
            throw error;
        }
    }

    /**
     * Boştaki çevrimiçi sürücünün konum bildirimi (acente haritası için).
     * Backend sınırı dakikada 12 istek; 3-5 dakikada bir çağrılmalı.
     */
    async heartbeat(latitude: number, longitude: number): Promise<void> {
        await axiosInstance.post('/vehicles/location/heartbeat/', { latitude, longitude });
    }
}

export default new AgencyAssignmentsAPI();

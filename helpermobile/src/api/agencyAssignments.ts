import axiosInstance from './axiosConfig';
import { logger } from '../utils/logger';
import type { PayerFields } from './types';

/**
 * Acente doğrudan ataması (sürücü tarafı).
 *
 * Acente talebi havuzundaki bir sürücüye atar ya da tüm havuza gönderir (toplu davet).
 * Sürücü mevcut teklif ucuyla kabul eder (ayrı bir kabul ucu yok). Tekil atama varsayılan
 * 180 sn sürer; toplu davet süresizdir (expires_at null).
 * Acente ödemeli işte (payer != customer) fiyat sabittir: uç hemen in_progress döner.
 */
export interface DriverAgencyAssignment extends PayerFields {
    id: number;
    request_id: number;
    service_type: 'tow' | 'crane' | 'home_moving' | 'city_moving' | 'road_assistance' | 'transfer';
    agency_name: string;
    /** single: tekil atama (süreli), broadcast: toplu davet (süresiz) */
    mode?: 'single' | 'broadcast';
    /** ISO UTC; toplu davette null */
    expires_at: string | null;
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
}

export default new AgencyAssignmentsAPI();

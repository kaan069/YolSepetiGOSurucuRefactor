/**
 * Employee Panel API
 * Eleman olarak giriş yapan kullanıcılar için API metodları
 * (Dashboard, İşler, İş Detayı)
 */
import { axiosInstance } from './base';
import {
    EmployeeDashboardResponse,
    EmployeeJobsResponse,
    EmployeeJobDetail,
} from '../types';

interface GetJobsParams {
    status?: 'active' | 'completed';
    page?: number;
    page_size?: number;
}

class EmployeePanelAPI {
    // Dashboard bilgilerini getir
    async getDashboard(): Promise<EmployeeDashboardResponse> {
        try {
            const response = await axiosInstance.get<EmployeeDashboardResponse>('/employee/dashboard/');
            return response.data;
        } catch (error: any) {
            console.error('Get employee dashboard error:', error?.response?.data);
            throw error;
        }
    }

    // İş listesini getir (pagination destekli)
    async getJobs(params?: GetJobsParams): Promise<EmployeeJobsResponse> {
        try {
            console.log('📋 [EmployeePanel] İşler isteniyor, params:', params);
            const response = await axiosInstance.get<EmployeeJobsResponse>('/employee/jobs/', { params });
            console.log('📋 [EmployeePanel] İşler cevabı:', JSON.stringify(response.data, null, 2));
            return response.data;
        } catch (error: any) {
            console.error('Get employee jobs error:', error?.response?.data);
            throw error;
        }
    }

    // İş detayını getir
    async getJobDetail(requestId: number): Promise<EmployeeJobDetail> {
        try {
            const response = await axiosInstance.get<EmployeeJobDetail>(`/employee/jobs/${requestId}/`);
            return response.data;
        } catch (error: any) {
            console.error('Get employee job detail error:', error?.response?.data);
            throw error;
        }
    }
}

export const employeePanelAPI = new EmployeePanelAPI();
export default employeePanelAPI;

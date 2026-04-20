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
import { logOrdersError } from './_helpers';

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
            logOrdersError('employeePanel.getDashboard', error);
            throw error;
        }
    }

    // İş listesini getir (pagination destekli)
    async getJobs(params?: GetJobsParams): Promise<EmployeeJobsResponse> {
        try {
            const response = await axiosInstance.get<EmployeeJobsResponse>('/employee/jobs/', { params });
            return response.data;
        } catch (error: any) {
            logOrdersError('employeePanel.getJobs', error);
            throw error;
        }
    }

    // İş detayını getir
    async getJobDetail(requestId: number): Promise<EmployeeJobDetail> {
        try {
            const response = await axiosInstance.get<EmployeeJobDetail>(`/employee/jobs/${requestId}/`);
            return response.data;
        } catch (error: any) {
            logOrdersError('employeePanel.getJobDetail', error);
            throw error;
        }
    }
}

export const employeePanelAPI = new EmployeePanelAPI();
export default employeePanelAPI;

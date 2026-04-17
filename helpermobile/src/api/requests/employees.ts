/**
 * Employee (Eleman) API
 * Firma sahiplerinin eleman yönetimi için API metodları
 */
import { axiosInstance } from './base';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';

class EmployeeAPI {
    // Eleman listesini getir
    async getEmployees(): Promise<Employee[]> {
        try {
            const response = await axiosInstance.get<Employee[]>('/employee/employees/');
            return response.data;
        } catch (error: any) {
            console.error('Get employees error:', error?.response?.data);
            throw error;
        }
    }

    // Yeni eleman ekle
    async createEmployee(data: CreateEmployeeRequest): Promise<Employee> {
        try {
            const response = await axiosInstance.post('/employee/employees/create/', data);
            // Backend wrapped response: { message, employee: {...} }
            return response.data.employee || response.data;
        } catch (error: any) {
            console.error('Create employee error:', error?.response?.data);
            throw error;
        }
    }

    // Eleman bilgilerini güncelle
    async updateEmployee(id: number, data: UpdateEmployeeRequest): Promise<Employee> {
        try {
            const response = await axiosInstance.patch(`/employee/employees/${id}/update/`, data);
            // Backend wrapped response: { message, employee: {...} }
            return response.data.employee || response.data;
        } catch (error: any) {
            console.error('Update employee error:', error?.response?.data);
            throw error;
        }
    }

    // Eleman sil (varsayılan: soft delete, hardDelete=true ile kalıcı silme)
    async deleteEmployee(id: number, hardDelete?: boolean): Promise<void> {
        try {
            const url = hardDelete
                ? `/employee/employees/${id}/delete/?hard_delete=true`
                : `/employee/employees/${id}/delete/`;
            await axiosInstance.delete(url);
        } catch (error: any) {
            console.error('Delete employee error:', error?.response?.data);
            throw error;
        }
    }

    // Eleman detay
    async getEmployee(id: number): Promise<Employee> {
        try {
            const response = await axiosInstance.get<Employee>(`/employee/employees/${id}/`);
            return response.data;
        } catch (error: any) {
            console.error('Get employee detail error:', error?.response?.data);
            throw error;
        }
    }
}

export const employeeAPI = new EmployeeAPI();
export default employeeAPI;

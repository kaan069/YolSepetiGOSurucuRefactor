/**
 * Employee (Eleman) API
 * Firma sahiplerinin eleman yönetimi için API metodları
 */
import { axiosInstance } from './base';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../types';
import { logOrdersError } from './_helpers';

class EmployeeAPI {
    // Eleman listesini getir
    async getEmployees(): Promise<Employee[]> {
        try {
            const response = await axiosInstance.get<Employee[]>('/employee/employees/');
            return response.data;
        } catch (error: any) {
            logOrdersError('employees.getEmployees', error);
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
            logOrdersError('employees.createEmployee', error);
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
            logOrdersError('employees.updateEmployee', error);
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
            logOrdersError('employees.deleteEmployee', error);
            throw error;
        }
    }

    // Eleman detay
    async getEmployee(id: number): Promise<Employee> {
        try {
            const response = await axiosInstance.get<Employee>(`/employee/employees/${id}/`);
            return response.data;
        } catch (error: any) {
            logOrdersError('employees.getEmployee', error);
            throw error;
        }
    }
}

export const employeeAPI = new EmployeeAPI();
export default employeeAPI;

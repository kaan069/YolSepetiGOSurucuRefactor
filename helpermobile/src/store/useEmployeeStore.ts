import { create } from 'zustand';
import { Employee, CreateEmployeeRequest, UpdateEmployeeRequest } from '../api/types';
import { employeeAPI } from '../api/requests/employees';

interface EmployeeStore {
    employees: Employee[];
    loading: boolean;
    error: string | null;

    fetchEmployees: () => Promise<void>;
    addEmployee: (data: CreateEmployeeRequest) => Promise<Employee>;
    updateEmployee: (id: number, data: UpdateEmployeeRequest) => Promise<void>;
    deleteEmployee: (id: number, hardDelete?: boolean) => Promise<void>;
    clearEmployees: () => void;
}

export const useEmployeeStore = create<EmployeeStore>((set, get) => ({
    employees: [],
    loading: false,
    error: null,

    fetchEmployees: async () => {
        set({ loading: true, error: null });
        try {
            const employees = await employeeAPI.getEmployees();
            set({ employees, loading: false });
        } catch (error: any) {
            set({ error: error?.message || 'Eleman listesi yüklenemedi', loading: false });
            throw error;
        }
    },

    addEmployee: async (data) => {
        const employee = await employeeAPI.createEmployee(data);
        set({ employees: [...get().employees, employee] });
        return employee;
    },

    updateEmployee: async (id, data) => {
        const updated = await employeeAPI.updateEmployee(id, data);
        set({ employees: get().employees.map(e => e.id === id ? updated : e) });
    },

    deleteEmployee: async (id, hardDelete) => {
        await employeeAPI.deleteEmployee(id, hardDelete);
        if (hardDelete) {
            // Kalıcı silme: listeden çıkar
            set({ employees: get().employees.filter(e => e.id !== id) });
        } else {
            // Soft delete: deaktive et, listeden çıkar (UI'dan kaldır)
            set({ employees: get().employees.filter(e => e.id !== id) });
        }
    },

    clearEmployees: () => set({ employees: [], error: null, loading: false }),
}));

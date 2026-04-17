import { create } from 'zustand';
import {
    EmployeeDashboardResponse,
    EmployeeJob,
    EmployeeJobDetail,
} from '../api/types';
import { employeePanelAPI } from '../api/requests/employeePanel';

interface EmployeePanelStore {
    // State
    dashboard: EmployeeDashboardResponse | null;
    jobs: EmployeeJob[];
    jobDetail: EmployeeJobDetail | null;
    loading: boolean;
    jobsLoading: boolean;
    detailLoading: boolean;
    error: string | null;

    // Pagination
    currentPage: number;
    totalPages: number;

    // Actions
    fetchDashboard: () => Promise<void>;
    fetchJobs: (filter?: 'active' | 'completed', page?: number) => Promise<void>;
    loadMoreJobs: () => Promise<void>;
    fetchJobDetail: (requestId: number) => Promise<void>;
    clearJobDetail: () => void;
    clearAll: () => void;
}

export const useEmployeePanelStore = create<EmployeePanelStore>((set, get) => ({
    dashboard: null,
    jobs: [],
    jobDetail: null,
    loading: false,
    jobsLoading: false,
    detailLoading: false,
    error: null,
    currentPage: 1,
    totalPages: 1,

    fetchDashboard: async () => {
        set({ loading: true, error: null });
        try {
            const dashboard = await employeePanelAPI.getDashboard();
            set({ dashboard, loading: false });
        } catch (error: any) {
            set({ error: error?.message || 'Dashboard yüklenemedi', loading: false });
            throw error;
        }
    },

    fetchJobs: async (filter = 'active', page = 1) => {
        const activeFilter = filter;
        set({ jobsLoading: true, error: null });
        try {
            const response = await employeePanelAPI.getJobs({
                status: activeFilter,
                page,
                page_size: 20,
            });
            set({
                jobs: page === 1 ? response.results : [...get().jobs, ...response.results],
                currentPage: response.page,
                totalPages: response.total_pages,
                jobsLoading: false,
            });
        } catch (error: any) {
            set({ error: error?.message || 'İşler yüklenemedi', jobsLoading: false });
            throw error;
        }
    },

    loadMoreJobs: async () => {
        const { currentPage, totalPages } = get();
        if (currentPage >= totalPages) return;
        await get().fetchJobs('active', currentPage + 1);
    },

    fetchJobDetail: async (requestId) => {
        set({ detailLoading: true, error: null });
        try {
            const jobDetail = await employeePanelAPI.getJobDetail(requestId);
            set({ jobDetail, detailLoading: false });
        } catch (error: any) {
            set({ error: error?.message || 'İş detayı yüklenemedi', detailLoading: false });
            throw error;
        }
    },

    clearJobDetail: () => set({ jobDetail: null }),
    clearAll: () => set({
        dashboard: null,
        jobs: [],
        jobDetail: null,
        loading: false,
        jobsLoading: false,
        detailLoading: false,
        error: null,
        currentPage: 1,
        totalPages: 1,
    }),
}));

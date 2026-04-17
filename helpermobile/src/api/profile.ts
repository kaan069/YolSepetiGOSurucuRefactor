import axiosInstance from './axiosConfig';
import {
    CompanyInfo,
    CreateCompanyInfoRequest,
    UpdateCompanyInfoRequest,
    PaymentMethod,
    CreatePaymentMethodRequest,
    UpdatePaymentMethodRequest,
} from './types';

class ProfileAPI {
    // ==================== Şirket Bilgileri (Company Info) ====================

    // Şirket bilgilerini getir
    async getCompanyInfo(): Promise<CompanyInfo | null> {
        try {
            const response = await axiosInstance.get<CompanyInfo>('/profile/company-info/');
            return response.data;
        } catch (error: any) {
            console.error('Get company info error:', error);
            // Tüm hataları fırlat (404 dahil), UI'da yakalanacak
            throw error;
        }
    }

    // Şirket bilgisi oluştur
    async createCompanyInfo(data: CreateCompanyInfoRequest): Promise<CompanyInfo> {
        try {
            const response = await axiosInstance.post<CompanyInfo>('/profile/company-info/create/', data);
            return response.data;
        } catch (error) {
            console.error('Create company info error:', error);
            throw error;
        }
    }

    // Şirket bilgisini güncelle
    async updateCompanyInfo(data: UpdateCompanyInfoRequest): Promise<CompanyInfo> {
        try {
            const response = await axiosInstance.patch<CompanyInfo>('/profile/company-info/update/', data);
            return response.data;
        } catch (error) {
            console.error('Update company info error:', error);
            throw error;
        }
    }

    // Şirket bilgisini sil
    async deleteCompanyInfo(): Promise<void> {
        try {
            await axiosInstance.delete('/profile/company-info/delete/');
        } catch (error) {
            console.error('Delete company info error:', error);
            throw error;
        }
    }

    // ==================== Ödeme Yöntemi (Payment Method) ====================

    // Ödeme yöntemini getir
    async getPaymentMethod(): Promise<PaymentMethod | null> {
        try {
            const response = await axiosInstance.get<PaymentMethod>('/profile/payment-method/');
            return response.data;
        } catch (error: any) {
            console.error('Get payment method error:', error);
            // Tüm hataları fırlat (404 dahil), UI'da yakalanacak
            throw error;
        }
    }

    // Ödeme yöntemi oluştur
    async createPaymentMethod(data: CreatePaymentMethodRequest): Promise<PaymentMethod> {
        try {
            const response = await axiosInstance.post<PaymentMethod>('/profile/payment-method/create/', data);
            return response.data;
        } catch (error) {
            console.error('Create payment method error:', error);
            throw error;
        }
    }

    // Ödeme yöntemini güncelle
    async updatePaymentMethod(data: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
        try {
            const response = await axiosInstance.patch<PaymentMethod>('/profile/payment-method/update/', data);
            return response.data;
        } catch (error) {
            console.error('Update payment method error:', error);
            throw error;
        }
    }

    // Ödeme yöntemini sil
    async deletePaymentMethod(): Promise<void> {
        try {
            await axiosInstance.delete('/profile/payment-method/delete/');
        } catch (error) {
            console.error('Delete payment method error:', error);
            throw error;
        }
    }
}

export default new ProfileAPI();

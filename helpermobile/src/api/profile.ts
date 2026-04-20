import axiosInstance from './axiosConfig';
import {
    CompanyInfo,
    CreateCompanyInfoRequest,
    UpdateCompanyInfoRequest,
    PaymentMethod,
    CreatePaymentMethodRequest,
    UpdatePaymentMethodRequest,
} from './types';
import { logger } from '../utils/logger';

// Profile katmanı için güvenli error sanitizer.
// Backend error response body'sini ASLA loglamaz. Bu katmandaki istek gövdeleri
// yüksek hassasiyetli alanlar taşır (şirket adı, vergi numarası, adres, IBAN,
// banka adı, hesap sahibi). Validation hatalarında backend bu alanları echo
// edebildiği için error objesinin tamamı loglanmaz — sadece HTTP status ve
// statik action adı loglanır.
// Kategori: `auth` — profile/company/payment-method akışı sürücü onboarding
// (kimlik tamamlama) kapsamında; kart transaction'larına özel `payment`
// kategorisinden ayrı tutulur (bkz. payment.ts helper pattern).
const logProfileError = (action: string, error: any): void => {
    const status = error?.response?.status;
    logger.error('auth', `${action} failed`, status ? { status } : undefined);
};

class ProfileAPI {
    // ==================== Şirket Bilgileri (Company Info) ====================

    // Şirket bilgilerini getir
    async getCompanyInfo(): Promise<CompanyInfo | null> {
        try {
            const response = await axiosInstance.get<CompanyInfo>('/profile/company-info/');
            return response.data;
        } catch (error: any) {
            logProfileError('getCompanyInfo', error);
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
            logProfileError('createCompanyInfo', error);
            throw error;
        }
    }

    // Şirket bilgisini güncelle
    async updateCompanyInfo(data: UpdateCompanyInfoRequest): Promise<CompanyInfo> {
        try {
            const response = await axiosInstance.patch<CompanyInfo>('/profile/company-info/update/', data);
            return response.data;
        } catch (error) {
            logProfileError('updateCompanyInfo', error);
            throw error;
        }
    }

    // Şirket bilgisini sil
    async deleteCompanyInfo(): Promise<void> {
        try {
            await axiosInstance.delete('/profile/company-info/delete/');
        } catch (error) {
            logProfileError('deleteCompanyInfo', error);
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
            logProfileError('getPaymentMethod', error);
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
            logProfileError('createPaymentMethod', error);
            throw error;
        }
    }

    // Ödeme yöntemini güncelle
    async updatePaymentMethod(data: UpdatePaymentMethodRequest): Promise<PaymentMethod> {
        try {
            const response = await axiosInstance.patch<PaymentMethod>('/profile/payment-method/update/', data);
            return response.data;
        } catch (error) {
            logProfileError('updatePaymentMethod', error);
            throw error;
        }
    }

    // Ödeme yöntemini sil
    async deletePaymentMethod(): Promise<void> {
        try {
            await axiosInstance.delete('/profile/payment-method/delete/');
        } catch (error) {
            logProfileError('deletePaymentMethod', error);
            throw error;
        }
    }
}

export default new ProfileAPI();

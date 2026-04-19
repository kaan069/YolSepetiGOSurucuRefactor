import axiosInstance from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, RegisterRequest, LoginRequest, SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse, AccountReadinessResponse } from './types';
import { logger } from '../utils/logger';

class AuthAPI {
    // ==================== OTP İşlemleri ====================

    /**
     * OTP Gönder - Kayıt için telefon doğrulama kodu gönderir
     * @param phoneNumber - Telefon numarası (+905551234567 formatında)
     */
    async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
        try {
            logger.debug('auth', 'Sending OTP');

            // Telefon numarasını temizle (sadece rakamlar)
            let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

            // Başındaki 90'ı kaldır (eğer varsa)
            if (cleanNumber.startsWith('90') && cleanNumber.length > 10) {
                cleanNumber = cleanNumber.substring(2);
            }

            // Başındaki 0'ı kaldır
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }

            // +90 ile birleştir (backend bu formatı bekliyor)
            const fullNumber = `+90${cleanNumber}`;

            const response = await axiosInstance.post<SendOTPResponse>('/api/otp/send/', {
                phoneNumber: fullNumber,
            });

            logger.debug('auth', 'OTP sent');
            return response.data;
        } catch (error: any) {
            logger.error('auth', 'OTP send failed', error);
            throw error;
        }
    }

    /**
     * OTP Doğrula - Girilen kodu doğrular ve verification_token döndürür
     * @param phoneNumber - Telefon numarası
     * @param otpCode - 6 haneli doğrulama kodu
     */
    async verifyOTP(phoneNumber: string, otpCode: string): Promise<VerifyOTPResponse> {
        try {
            logger.debug('auth', 'Verifying OTP');

            // Telefon numarasını temizle
            let cleanNumber = phoneNumber.replace(/[^0-9]/g, '');

            if (cleanNumber.startsWith('90') && cleanNumber.length > 10) {
                cleanNumber = cleanNumber.substring(2);
            }

            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }

            // +90 ile birleştir (backend bu formatı bekliyor)
            const fullNumber = `+90${cleanNumber}`;

            const response = await axiosInstance.post<VerifyOTPResponse>('/api/otp/verify/', {
                phoneNumber: fullNumber,
                otpCode: otpCode,
            });

            logger.info('auth', 'OTP verified');

            return response.data;
        } catch (error: any) {
            logger.error('auth', 'OTP verify failed', error);
            throw error;
        }
    }

    // ==================== Auth İşlemleri ====================

    // Kullanıcı kaydı
    async register(data: RegisterRequest): Promise<AuthResponse> {
        try {
            logger.debug('auth', 'Register API call');

            // Telefon numarasını normalize et (OTP verify ile aynı formatta olmalı)
            let cleanNumber = data.phone_number.replace(/[^0-9]/g, '');

            // Başındaki 90'ı kaldır (eğer varsa)
            if (cleanNumber.startsWith('90') && cleanNumber.length > 10) {
                cleanNumber = cleanNumber.substring(2);
            }

            // Başındaki 0'ı kaldır
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }

            // +90 ile birleştir (backend bu formatı bekliyor - OTP verify ile aynı)
            const normalizedPhone = `+90${cleanNumber}`;

            // Request verisini hazırla
            const requestData = {
                ...data,
                phone_number: normalizedPhone,
            };

            const response = await axiosInstance.post<AuthResponse>('/auth/register/', requestData, {
                timeout: 120000  // 120 saniye (2 dakika) - kayıt işlemi backend'de çok uzun sürebilir
            });
            logger.debug('auth', 'Register response received');

            // Token'ları kaydet - AsyncStorage hatası kaydı engellemez
            try {
                if (response.data.tokens) {
                    await AsyncStorage.setItem('access_token', response.data.tokens.access);
                    await AsyncStorage.setItem('refresh_token', response.data.tokens.refresh);
                }
            } catch (storageError) {
                logger.warn('auth', 'Token storage failed (register)', storageError);
                // Storage hatası kaydı engellemez
            }

            // Kullanıcı bilgilerini kaydet - AsyncStorage hatası kaydı engellemez
            try {
                if (response.data.user) {
                    const userString = JSON.stringify(response.data.user);
                    await AsyncStorage.setItem('user', userString);
                }
            } catch (storageError) {
                logger.warn('auth', 'User storage failed (register)', storageError);
                // Storage hatası kaydı engellemez
            }

            logger.info('auth', 'Register completed');
            return response.data;
        } catch (error) {
            logger.error('auth', 'Register failed', error);
            throw error;
        }
    }

    // Kullanıcı girişi
    async login(data: LoginRequest): Promise<AuthResponse> {
        let response;

        try {
            logger.debug('auth', 'Login starting');

            response = await axiosInstance.post<AuthResponse>('/auth/login/', data);

            logger.debug('auth', 'Login response received', { status: response.status });
        } catch (error: any) {
            logger.error('auth', 'Login failed', {
                message: error?.message,
                status: error?.response?.status,
            });

            throw error;
        }

        // Token'ları kaydet
        if (response.data.tokens) {
            try {
                await AsyncStorage.setItem('access_token', response.data.tokens.access);
                await AsyncStorage.setItem('refresh_token', response.data.tokens.refresh);
            } catch (storageError) {
                logger.warn('auth', 'Token storage failed (login)', storageError);
                // Storage hatası login'i engellemez
            }
        }

        // Kullanıcı bilgilerini kaydet
        if (response.data.user) {
            try {
                const userString = JSON.stringify(response.data.user);
                await AsyncStorage.setItem('user', userString);
            } catch (storageError) {
                logger.warn('auth', 'User storage failed (login)', storageError);
                // Storage hatası login'i engellemez
            }
        }

        logger.info('auth', 'Login completed');
        return response.data;
    }

    // Token yenileme
    async refreshToken(): Promise<{ access: string }> {
        try {
            const refreshToken = await AsyncStorage.getItem('refresh_token');

            if (!refreshToken) {
                throw new Error('No refresh token available');
            }

            const response = await axiosInstance.post<{ access: string }>('/auth/token/refresh/', {
                refresh: refreshToken,
            });

            await AsyncStorage.setItem('access_token', response.data.access);

            return response.data;
        } catch (error) {
            logger.error('auth', 'Refresh token failed', error);
            await this.logout();
            throw error;
        }
    }

    // Çıkış
    async logout(): Promise<void> {
        await AsyncStorage.removeItem('access_token');
        await AsyncStorage.removeItem('refresh_token');
        await AsyncStorage.removeItem('user');
    }

    // Kullanıcı bilgilerini al (AsyncStorage'dan)
    async getUser(): Promise<AuthResponse['user'] | null> {
        try {
            const userString = await AsyncStorage.getItem('user');
            return userString ? JSON.parse(userString) : null;
        } catch (error) {
            logger.error('auth', 'Get user failed', error);
            return null;
        }
    }

    // Kullanıcı profil bilgilerini API'den al
    async getProfile(): Promise<{ user: AuthResponse['user'] }> {
        try {
            const response = await axiosInstance.get<{ user: AuthResponse['user'] }>('/auth/profile/');

            // API'den gelen güncel bilgiyi AsyncStorage'a kaydet
            if (response.data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error) {
            logger.error('auth', 'Get profile failed', error);
            throw error;
        }
    }

    // Kullanıcı profil bilgilerini güncelle
    async updateProfile(data: Partial<{
        first_name: string;
        last_name: string;
        email: string;
        phone_number: string;
        tc_no: string;
        birth_date: string;
        business_address: string;
        business_address_il: string;
        business_address_ilce: string;
        user_type: string[];
    }>): Promise<{ user: AuthResponse['user'] }> {
        try {
            const response = await axiosInstance.patch<{ user: AuthResponse['user'] }>('/auth/profile/', data);

            // Güncellenen bilgiyi AsyncStorage'a kaydet
            if (response.data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error) {
            logger.error('auth', 'Update profile failed', error);
            throw error;
        }
    }

    // Kullanıcı servis tipini güncelle (PATCH)
    async updateUserType(userTypes: string[]): Promise<{ user: AuthResponse['user'] }> {
        try {
            const response = await axiosInstance.patch<{ user: AuthResponse['user'] }>('/auth/profile/', {
                user_type: userTypes
            });

            // Güncellenen bilgiyi AsyncStorage'a kaydet
            if (response.data.user) {
                await AsyncStorage.setItem('user', JSON.stringify(response.data.user));
            }

            return response.data;
        } catch (error) {
            logger.error('auth', 'Update user type failed', error);
            throw error;
        }
    }

    // Token kontrolü
    async isAuthenticated(): Promise<boolean> {
        const token = await AsyncStorage.getItem('access_token');
        return !!token;
    }

    // Şifremi unuttum - yeni şifre SMS ile gönderilir
    async forgotPassword(phoneNumber: string): Promise<{ message: string }> {
        try {
            logger.debug('auth', 'Forgot password request');

            // Boşlukları kaldır
            let cleanNumber = phoneNumber.replace(/\s/g, '');

            // Başındaki 0'ı kaldır
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }

            // +90 ile birleştir
            const fullNumber = `+90${cleanNumber}`;

            const response = await axiosInstance.post<{ message: string }>('/auth/forgot-password/', {
                phone_number: fullNumber,
            });

            logger.info('auth', 'Forgot password sent');
            return response.data;
        } catch (error: any) {
            logger.error('auth', 'Forgot password failed', error);
            throw error;
        }
    }

    // Online status'u getir
    async getOnlineStatus(): Promise<{ user_is_online: boolean; status_text: string }> {
        try {
            const response = await axiosInstance.get<{ user_is_online: boolean; status_text: string }>('/auth/status/online/');
            return response.data;
        } catch (error) {
            logger.error('auth', 'Get online status failed', error);
            throw error;
        }
    }

    // Hesap hazırlık durumunu kontrol et
    async checkAccountReadiness(): Promise<AccountReadinessResponse> {
        try {
            const response = await axiosInstance.get<AccountReadinessResponse>('/auth/account-ready/');
            return response.data;
        } catch (error) {
            logger.error('auth', 'Account readiness check failed', error);
            throw error;
        }
    }

    // Online status'u güncelle
    async updateOnlineStatus(isOnline: boolean): Promise<{ message: string; user_is_online: boolean }> {
        try {
            const response = await axiosInstance.put<{ message: string; user_is_online: boolean }>('/auth/status/online/', {
                user_is_online: isOnline,
            });
            return response.data;
        } catch (error) {
            logger.error('auth', 'Update online status failed', error);
            throw error;
        }
    }

    // ==================== FCM Token Management (Multi-Device Support) ====================

    /**
     * FCM Token kaydet/güncelle - Multi-device desteği ile
     * Her cihaz için ayrı token kaydedilir
     */
    async registerFCMToken(data: {
        fcm_token: string;
        device_id?: string;
        device_type?: 'ios' | 'android' | 'web';
    }): Promise<{
        message: string;
        fcm_token: string;
        device_id: string;
        created: boolean;
    }> {
        try {
            const response = await axiosInstance.put('/auth/notifications/update/', data);

            return response.data;
        } catch (error: any) {
            // 500 IntegrityError - Backend duplicate key hatası (ignore et)
            if (error?.response?.status === 500 && error?.response?.data?.includes?.('IntegrityError')) {
                logger.warn('fcm', 'FCM token already registered (IntegrityError)');
                return {
                    message: 'Token already registered',
                    fcm_token: data.fcm_token,
                    device_id: data.device_id || 'default',
                    created: false,
                };
            }

            logger.error('fcm', 'FCM token register failed', error);
            throw error;
        }
    }

    /**
     * FCM Token sil - Logout sırasında kullanılır
     * Sadece belirtilen cihazın token'ı silinir, diğerleri etkilenmez
     */
    async deleteFCMToken(deviceId?: string): Promise<{
        message: string;
        device_id: string;
    }> {
        try {
            const response = await axiosInstance.delete('/auth/notifications/logout/', {
                data: { device_id: deviceId }
            });

            return response.data;
        } catch (error: any) {
            // 404 hatası token bulunamadı demektir, bu normal (sessizce handle et)
            if (error?.response?.status === 404) {
                logger.info('fcm', 'FCM token already deleted');
                return {
                    message: 'Token bulunamadı',
                    device_id: deviceId || 'default'
                };
            }

            logger.error('fcm', 'FCM token delete failed', error);
            throw error;
        }
    }
}

export default new AuthAPI();

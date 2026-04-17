import axiosInstance from './axiosConfig';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { AuthResponse, RegisterRequest, LoginRequest, SendOTPRequest, SendOTPResponse, VerifyOTPRequest, VerifyOTPResponse, AccountReadinessResponse } from './types';

class AuthAPI {
    // ==================== OTP İşlemleri ====================

    /**
     * OTP Gönder - Kayıt için telefon doğrulama kodu gönderir
     * @param phoneNumber - Telefon numarası (+905551234567 formatında)
     */
    async sendOTP(phoneNumber: string): Promise<SendOTPResponse> {
        try {
            console.log('📱 OTP gönderiliyor...');

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
            console.log('📱 Gönderilen numara:', fullNumber);

            const response = await axiosInstance.post<SendOTPResponse>('/api/otp/send/', {
                phoneNumber: fullNumber,
            });

            console.log('✅ OTP başarıyla gönderildi');
            return response.data;
        } catch (error: any) {
            console.error('❌ OTP gönderme hatası:', error);
            console.error('❌ Error response:', error?.response?.data);
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
            console.log('🔐 OTP doğrulanıyor...');

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

            console.log('✅ OTP doğrulandı');
            console.log('📦 OTP Verify Response:', JSON.stringify(response.data, null, 2));
            console.log('🔑 verification_token var mı?', !!response.data.verification_token);

            return response.data;
        } catch (error: any) {
            console.error('❌ OTP doğrulama hatası:', error);
            console.error('❌ Error response:', error?.response?.data);
            throw error;
        }
    }

    // ==================== Auth İşlemleri ====================

    // Kullanıcı kaydı
    async register(data: RegisterRequest): Promise<AuthResponse> {
        try {
            console.log('📝 Register API çağrısı yapılıyor...');

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
            console.log('📱 Register - Normalize edilmiş numara:', normalizedPhone);

            // Request verisini hazırla
            const requestData = {
                ...data,
                phone_number: normalizedPhone,
            };

            const response = await axiosInstance.post<AuthResponse>('/auth/register/', requestData, {
                timeout: 120000  // 120 saniye (2 dakika) - kayıt işlemi backend'de çok uzun sürebilir
            });
            console.log('✅ Register API yanıtı alındı');

            // Token'ları kaydet - AsyncStorage hatası kaydı engellemez
            try {
                if (response.data.tokens) {
                    console.log('💾 Token\'lar AsyncStorage\'a kaydediliyor...');
                    await AsyncStorage.setItem('access_token', response.data.tokens.access);
                    await AsyncStorage.setItem('refresh_token', response.data.tokens.refresh);
                    console.log('✅ Token\'lar kaydedildi');
                }
            } catch (storageError) {
                console.error('⚠️ Token kaydetme hatası (devam ediliyor):', storageError);
                // Storage hatası kaydı engellemez
            }

            // Kullanıcı bilgilerini kaydet - AsyncStorage hatası kaydı engellemez
            try {
                if (response.data.user) {
                    console.log('💾 User bilgisi AsyncStorage\'a kaydediliyor...');
                    const userString = JSON.stringify(response.data.user);
                    await AsyncStorage.setItem('user', userString);
                    console.log('✅ User bilgisi kaydedildi');
                }
            } catch (storageError) {
                console.error('⚠️ User kaydetme hatası (devam ediliyor):', storageError);
                // Storage hatası kaydı engellemez
            }

            console.log('✅ Register işlemi tamamlandı');
            return response.data;
        } catch (error) {
            console.error('❌ Register error:', error);
            throw error;
        }
    }

    // Kullanıcı girişi
    async login(data: LoginRequest): Promise<AuthResponse> {
        let response;

        try {
            console.log('🔐 [authAPI] Login başlıyor...');

            try {
                console.log('🔐 [authAPI] Request data stringify yapılıyor...');
                const dataStr = JSON.stringify(data);
                console.log('🔐 [authAPI] Request data:', dataStr);
            } catch (strErr) {
                console.error('⚠️ [authAPI] JSON.stringify hatası:', strErr);
            }

            console.log('🔐 [authAPI] Axios POST çağrısı yapılıyor...');
            response = await axiosInstance.post<AuthResponse>('/auth/login/', data);

            console.log('✅ [authAPI] API yanıtı alındı');
            console.log('✅ [authAPI] Response status:', response.status);
        } catch (error: any) {
            console.error('❌ [authAPI] API çağrısı başarısız');
            console.error('❌ [authAPI] Error message:', error?.message || 'Yok');
            console.error('❌ [authAPI] Error response status:', error?.response?.status || 'Yok');

            // Hata detaylarını güvenli şekilde logla
            try {
                if (error?.response?.data) {
                    const errorData = JSON.stringify(error.response.data);
                    console.error('❌ [authAPI] Error response data:', errorData);
                }
            } catch (logErr) {
                console.error('⚠️ [authAPI] Error logging hatası');
            }

            throw error;
        }

        // Token'ları kaydet
        if (response.data.tokens) {
            try {
                console.log('💾 [authAPI] Token kaydetme başlıyor...');
                await AsyncStorage.setItem('access_token', response.data.tokens.access);
                console.log('✅ [authAPI] Access token kaydedildi');

                await AsyncStorage.setItem('refresh_token', response.data.tokens.refresh);
                console.log('✅ [authAPI] Refresh token kaydedildi');
            } catch (storageError) {
                console.error('⚠️ [authAPI] Token kaydetme hatası:', storageError);
                // Storage hatası login'i engellemez
            }
        }

        // Kullanıcı bilgilerini kaydet
        if (response.data.user) {
            try {
                console.log('💾 [authAPI] User kaydı başlıyor...');
                const userString = JSON.stringify(response.data.user);
                console.log('💾 [authAPI] User stringify yapıldı, uzunluk:', userString.length);

                await AsyncStorage.setItem('user', userString);
                console.log('✅ [authAPI] User AsyncStorage\'a kaydedildi');
            } catch (storageError) {
                console.error('⚠️ [authAPI] User kaydetme hatası:', storageError);
                // Storage hatası login'i engellemez
            }
        }

        console.log('✅ [authAPI] Login tamamlandı, response döndürülüyor');
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
            console.error('Refresh token error:', error);
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
            console.error('Get user error:', error);
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
            console.error('Get profile error:', error);
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
            console.error('Update profile error:', error);
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
            console.error('Update user type error:', error);
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
            console.log('🔑 Şifremi unuttum isteği gönderiliyor...');

            // Boşlukları kaldır
            let cleanNumber = phoneNumber.replace(/\s/g, '');

            // Başındaki 0'ı kaldır
            if (cleanNumber.startsWith('0')) {
                cleanNumber = cleanNumber.substring(1);
            }

            // +90 ile birleştir
            const fullNumber = `+90${cleanNumber}`;
            console.log('📱 Gönderilen numara:', fullNumber);

            const response = await axiosInstance.post<{ message: string }>('/auth/forgot-password/', {
                phone_number: fullNumber,
            });

            console.log('✅ Şifremi unuttum başarılı');
            return response.data;
        } catch (error: any) {
            console.error('❌ Şifremi unuttum hatası:', error);
            throw error;
        }
    }

    // Online status'u getir
    async getOnlineStatus(): Promise<{ user_is_online: boolean; status_text: string }> {
        try {
            const response = await axiosInstance.get<{ user_is_online: boolean; status_text: string }>('/auth/status/online/');
            return response.data;
        } catch (error) {
            console.error('Get online status error:', error);
            throw error;
        }
    }

    // Hesap hazırlık durumunu kontrol et
    async checkAccountReadiness(): Promise<AccountReadinessResponse> {
        try {
            const response = await axiosInstance.get<AccountReadinessResponse>('/auth/account-ready/');
            return response.data;
        } catch (error) {
            console.error('Check account readiness error:', error);
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
            console.error('Update online status error:', error);
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
            console.log('🔔 FCM Token kaydediliyor...');
            console.log('   • Device ID:', data.device_id || 'default');
            console.log('   • Device Type:', data.device_type || 'unknown');

            const response = await axiosInstance.put('/auth/notifications/update/', data);

            console.log('✅ FCM Token başarıyla kaydedildi');
            console.log('   • Created:', response.data.created ? 'Yeni cihaz' : 'Güncellendi');

            return response.data;
        } catch (error: any) {
            console.error('❌ FCM Token kaydetme hatası:', error);

            // 500 IntegrityError - Backend duplicate key hatası (ignore et)
            if (error?.response?.status === 500 && error?.response?.data?.includes?.('IntegrityError')) {
                console.warn('⚠️ FCM Token zaten kayıtlı (IntegrityError), devam ediliyor...');
                return {
                    message: 'Token already registered',
                    fcm_token: data.fcm_token,
                    device_id: data.device_id || 'default',
                    created: false,
                };
            }

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
            console.log('🗑️ FCM Token siliniyor...');
            console.log('   • Device ID:', deviceId || 'default');

            const response = await axiosInstance.delete('/auth/notifications/logout/', {
                data: { device_id: deviceId }
            });

            console.log('✅ FCM Token başarıyla silindi');
            return response.data;
        } catch (error: any) {
            // 404 hatası token bulunamadı demektir, bu normal (sessizce handle et)
            if (error?.response?.status === 404) {
                console.log('ℹ️  FCM Token zaten silinmiş');
                return {
                    message: 'Token bulunamadı',
                    device_id: deviceId || 'default'
                };
            }

            console.error('❌ FCM Token silme hatası:', error);
            throw error;
        }
    }
}

export default new AuthAPI();

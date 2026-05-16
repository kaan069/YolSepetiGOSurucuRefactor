import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/network";
import { APP_VERSION, APP_CLIENT, APP_PLATFORM } from "../constants/appVersion";
import { useUpgradeStore } from "../store/useUpgradeStore";
import { logger } from "../utils/logger";

// Logout durumunu takip et - logout sırasında 401 bildirimleri gösterme
let isLoggingOut = false;

export const setLoggingOut = (value: boolean) => {
    isLoggingOut = value;
};

// Axios instance oluştur
const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    timeout: 30000,
    headers: {
        "Content-Type": "application/json",
    },
});

// Request interceptor - Performans için loglar azaltıldı
axiosInstance.interceptors.request.use(
    async (config: InternalAxiosRequestConfig) => {
        try {
            // Zorunlu versiyon kontrolü için backend her isteğe 3 header bekliyor.
            // Eksikse backend bypass eder (curl/server-to-server için) ama biz her
            // request'te göndererek `426 Upgrade Required` filtresinin çalışmasını sağlıyoruz.
            if (config.headers) {
                config.headers['X-App-Version'] = APP_VERSION;
                config.headers['X-App-Platform'] = APP_PLATFORM;
                config.headers['X-App-Client'] = APP_CLIENT;
            }

            let token = null;
            try {
                token = await AsyncStorage.getItem("access_token");
            } catch (storageError) {
                logger.warn('network', 'Token read from storage failed', storageError);
                // Storage hatası request'i engellemez
            }

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        } catch (err: any) {
            // Interceptor-internal try/catch — ham `err` axios config/XHR referansı
            // içerebilir (header/url leak). Sadece mesajı logla.
            logger.error('network', 'Request interceptor failure', {
                message: err?.message,
            });
            return config; // Hata olsa bile request'i gönder
        }
    },
    (error: AxiosError) => {
        // Request gönderilmeden önce oluşan hata — axios instance ham error
        // objesi tüm request config'ini (url/header) barındırabilir. Sanitize.
        logger.error('network', 'Request error', {
            message: error?.message,
            method: error?.config?.method,
            url: error?.config?.url,
        });
        return Promise.reject(error);
    }
);

// Response interceptor - Performans için loglar azaltıldı
axiosInstance.interceptors.response.use(
    (response: AxiosResponse) => {
        return response;
    },
    async (error: AxiosError) => {
        try {
            if (error.response) {
                // 426 Upgrade Required — backend istemci versiyonu min'den düşük olduğunda döner.
                // Kullanıcıyı kalıcı bir UpgradeRequiredGate ile kilitleyip mağazaya yönlendiriyoruz.
                // Bu kontrol diğer status handler'larından (401, 404 vs.) ÖNCE gelmeli.
                if (error.response.status === 426) {
                    const data = (error.response.data ?? {}) as Record<string, any>;
                    useUpgradeStore.getState().setUpgradeRequired({
                        messageTr: data.message_tr || 'Lütfen uygulamayı güncelleyin.',
                        messageEn: data.message_en || 'Please update the app.',
                        minVersion: data.min_version || '',
                        currentVersion: data.current_version || '',
                        updateUrl: data.update_url || '',
                    });
                    return Promise.reject(error);
                }

                // 404 hatalarını sessizce yönet (araç fotoğrafları ve FCM token silme)
                const isPhotoEndpoint = error.config?.url?.includes('/vehicles/documents/');
                const isFCMLogout = error.config?.url?.includes('/auth/notifications/logout/');
                const is404 = error.response.status === 404;

                // Photo endpoint veya FCM logout endpoint'inde 404 varsa log'lama
                if (!(is404 && (isPhotoEndpoint || isFCMLogout))) {
                    // Response body'yi logla(ma) — sadece status + endpoint (PII/secret sızıntısı önlemi)
                    logger.error('network', 'API error', {
                        status: error.response.status,
                        method: error.config?.method,
                        url: error.config?.url,
                    });
                    // Bildirim kaldırıldı - sadece logger
                }

                if (error.response.status === 401) {
                    try {
                        // Eğer logout işlemi sırasındaysak, bildirim gösterme
                        if (isLoggingOut) {
                            logger.debug('network', '401 during logout, suppressed');
                            return Promise.reject(error);
                        }

                        await AsyncStorage.removeItem("access_token");
                        await AsyncStorage.removeItem("refresh_token");
                    } catch (storageError) {
                        logger.warn('network', 'Token removal failed (401 handler)', storageError);
                    }
                }
            } else if (error.request) {
                // error.request tüm XHR objesini içerir (header/url leak) —
                // sadece güvenli minimum context logla.
                logger.warn('network', 'No response from server', {
                    method: error.config?.method,
                    url: error.config?.url,
                });
            } else {
                logger.error('network', 'Request setup error', error.message);
            }

            return Promise.reject(error);
        } catch (err: any) {
            // Response interceptor-internal try/catch — ham `err` axios response
            // objesi (data/headers) referansı tutabilir. Sadece mesajı logla.
            logger.error('network', 'Response interceptor failure', {
                message: err?.message,
            });
            return Promise.reject(error);
        }
    }
);

export default axiosInstance;

import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/network";
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
        } catch (err) {
            logger.error('network', 'Request interceptor failure', err);
            return config; // Hata olsa bile request'i gönder
        }
    },
    (error: AxiosError) => {
        logger.error('network', 'Request error', error);
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
        } catch (err) {
            logger.error('network', 'Response interceptor failure', err);
            return Promise.reject(error);
        }
    }
);

export default axiosInstance;

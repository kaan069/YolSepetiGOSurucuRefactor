import axios, {
    AxiosError,
    InternalAxiosRequestConfig,
    AxiosResponse,
} from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { API_BASE_URL } from "../constants/network";

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
                console.error('⚠️ [AXIOS] AsyncStorage.getItem hatası:', storageError);
                // Storage hatası request'i engellemez
            }

            if (token && config.headers) {
                config.headers.Authorization = `Bearer ${token}`;
            }

            return config;
        } catch (err) {
            console.error('❌ [AXIOS] Request interceptor hatası:', err);
            return config; // Hata olsa bile request'i gönder
        }
    },
    (error: AxiosError) => {
        console.error("❌ [AXIOS] Request Error:", error);
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
                    console.error(
                        `❌ [AXIOS] API Error ${error.response.status}:`,
                        error.response.data
                    );
                    // Bildirim kaldırıldı - sadece console log
                }

                if (error.response.status === 401) {
                    try {
                        // Eğer logout işlemi sırasındaysak, bildirim gösterme
                        if (isLoggingOut) {
                            console.log('🔕 [AXIOS] 401 - Logout sırasında');
                            return Promise.reject(error);
                        }

                        console.log('🗑️ [AXIOS] 401 - Token siliniyor...');
                        await AsyncStorage.removeItem("access_token");
                        await AsyncStorage.removeItem("refresh_token");
                        console.log('✅ [AXIOS] Token silindi');

                        // Local bildirim kaldırıldı - sadece console log
                        console.log('🔒 [AXIOS] Oturum süresi doldu');
                    } catch (storageError) {
                        console.error('⚠️ [AXIOS] Token silme hatası:', storageError);
                    }
                }
            } else if (error.request) {
                console.error("❌ [AXIOS] No Response:", error.request);

                // Local bildirim kaldırıldı - sadece console log
                console.log('🌐 [AXIOS] Sunucuya bağlanılamadı');
            } else {
                console.error("❌ [AXIOS] Request Setup Error:", error.message);
            }

            return Promise.reject(error);
        } catch (err) {
            console.error('❌ [AXIOS] Response interceptor hatası:', err);
            return Promise.reject(error);
        }
    }
);

export default axiosInstance;

import axios from 'axios';
import { API_BASE_URL } from '../constants/network';
import { logger } from '../utils/logger';

/**
 * Public `GET /app-version/` — splash kontrolü için.
 * Header check whitelist'inde; token gerektirmez.
 * Backend driver + customer için ayrı min versiyon ve update_url döner.
 *
 * NOT: Bu çağrı için ana `axiosInstance` kullanılmaz — interceptor'larla
 * bağımlı olmayan minimal raw axios kullanıyoruz; böylece splash öncesi
 * AsyncStorage token okuma vs. side-effect'leri tetiklenmez.
 */
export interface AppVersionPlatformConfig {
  android: string;
  ios: string;
  web: string;
}

export interface AppVersionClientConfig {
  min_versions: AppVersionPlatformConfig;
  update_urls: AppVersionPlatformConfig;
}

export interface AppVersionResponse {
  driver: AppVersionClientConfig;
  customer: AppVersionClientConfig;
  update_message_tr: string;
  update_message_en: string;
}

export async function fetchAppVersionConfig(): Promise<AppVersionResponse | null> {
  try {
    const response = await axios.get<AppVersionResponse>(`${API_BASE_URL}/app-version/`, {
      timeout: 8000,
    });
    return response.data;
  } catch (error: any) {
    // Splash kontrolü kritik değil — başarısız olursa request interceptor + 426
    // fallback'i devreye girer. Offline durumda app çökmesin.
    logger.warn('network', 'fetchAppVersionConfig failed (non-blocking)', {
      status: error?.response?.status,
    });
    return null;
  }
}

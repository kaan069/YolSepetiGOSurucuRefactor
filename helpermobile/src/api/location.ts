import axiosInstance from './axiosConfig';

export type AppPingTrigger = 'app_open' | 'foreground' | 'online' | 'periodic';

class LocationAPI {
    /**
     * Uygulamanın konum bildirimi (acente haritası: sürücü iş adresi yerine gerçek yerinde görünsün).
     * POST /vehicles/location/app-ping/ → 200 { status: 'ok', updated_at }
     * 429 (hız sınırı) ve 403 (sürücü olmayan hesap) sessizce yok sayılır.
     */
    async appPing(latitude: number, longitude: number, trigger: AppPingTrigger, accuracy?: number): Promise<void> {
        await axiosInstance.post('/vehicles/location/app-ping/', {
            latitude,
            longitude,
            trigger,
            ...(accuracy != null ? { accuracy } : {}),
        });
    }
}

export default new LocationAPI();

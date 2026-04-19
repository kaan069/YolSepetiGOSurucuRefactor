/**
 * usePricing Hook
 *
 * Fiyat hesaplama hook'u.
 * Mesafe ve araç durumuna göre backend'den fiyat hesaplar.
 *
 * @param trackingToken - Talep tracking token'ı
 * @param totalDistance - Toplam mesafe (km)
 * @param vehicleConditions - Araç durumu (isOnRoad, isGearStuck vb.)
 *
 * @returns {
 *   pricing: Fiyat bilgisi
 *   loading: Fiyat hesaplanıyor mu?
 *   error: Hata mesajı
 * }
 */
import { useState, useEffect } from 'react';
import { requestsAPI } from '../../../api';

interface VehicleConditions {
  isOnRoad?: boolean;
  isGearStuck?: boolean;
  isStuck?: boolean;
  isVehicleOperational?: boolean;
  hasExtraAttachments?: boolean;
}

interface PricingResult {
  driverEarnings: number;
  customerTotalPrice: number;
  platformCommission?: number;
  basePrice?: number;
  breakdown?: {
    surcharges?: Array<{
      question: string;
      answer: string;
      amount: number;
    }>;
    total_surcharge?: number;
  };
}

interface UsePricingReturn {
  pricing: PricingResult | null;
  loading: boolean;
  error: string | null;
}

export function usePricing(
  trackingToken: string | null | undefined,
  totalDistance: number | null,
  vehicleConditions: VehicleConditions
): UsePricingReturn {
  const [pricing, setPricing] = useState<PricingResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Gerekli bilgiler yoksa hesaplama
    if (!trackingToken || totalDistance === null) {
      return;
    }

    // Debounce için timeout
    const timeoutId = setTimeout(async () => {
      try {
        setLoading(true);
        setError(null);

        const result = await requestsAPI.calculateTowTruckPrice(
          trackingToken,
          parseFloat(totalDistance.toFixed(2)),
          {
            isOnRoad: vehicleConditions.isOnRoad || false,
            isGearStuck: vehicleConditions.isGearStuck || false,
            isTireLocked: false,
            isStuck: vehicleConditions.isStuck || false,
            isVehicleOperational: vehicleConditions.isVehicleOperational || true,
            hasExtraAttachments: vehicleConditions.hasExtraAttachments || false,
          }
        );

        setPricing(result);
      } catch (err: any) {
        console.error('❌ Fiyat hesaplama hatası:', err);
        setError(err?.response?.data?.error || err?.message || 'Fiyat hesaplanamadı');
      } finally {
        setLoading(false);
      }
    }, 500); // 500ms debounce

    return () => clearTimeout(timeoutId);
  }, [trackingToken, totalDistance, vehicleConditions]);

  return { pricing, loading, error };
}

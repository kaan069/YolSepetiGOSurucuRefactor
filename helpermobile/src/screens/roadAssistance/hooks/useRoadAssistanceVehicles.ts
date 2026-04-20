/**
 * useRoadAssistanceVehicles Hook
 *
 * Kullanıcının yol yardım araçlarını yönetir.
 */
import { useState, useEffect } from 'react';
import { vehiclesAPI, RoadAssistanceVehicle } from '../../../api';
import { logger } from '../../../utils/logger';

export function useRoadAssistanceVehicles() {
  const [vehicles, setVehicles] = useState<RoadAssistanceVehicle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await vehiclesAPI.getMyRoadAssistanceVehicles();

        // Araçları normalize et - verification_status yoksa veya farklı alanda ise kontrol et
        const normalizedData = data.map((v: any) => {
          // Backend'den gelen olası farklı alan isimleri
          let verificationStatus = v.verification_status
            || v.verificationStatus
            || v.status
            || (v.is_verified === true ? 'approved' : v.is_verified === false ? 'pending' : undefined);

          // Eğer hiç verification bilgisi yoksa, varsayılan olarak approved kabul et
          if (!verificationStatus) {
            verificationStatus = 'approved';
          }

          return {
            ...v,
            verification_status: verificationStatus
          };
        });

        // Sadece onaylı araçları filtrele
        const approvedVehicles = normalizedData.filter((v: any) => v.verification_status === 'approved');

        setVehicles(normalizedData); // Normalize edilmiş araçları göster

        // İlk onaylı aracı otomatik seç
        if (approvedVehicles.length > 0 && !selectedId) {
          setSelectedId(approvedVehicles[0].id);
        }
      } catch (err: any) {
        logger.error('vehicles', 'useRoadAssistanceVehicles.fetch failure', { status: err?.response?.status });
        setError(err?.message || 'Araçlar yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchVehicles();
  }, []);

  return {
    vehicles,
    selectedId,
    setSelectedId,
    loading,
    error,
    approvedCount: vehicles.filter(v => v.verification_status === 'approved').length,
  };
}

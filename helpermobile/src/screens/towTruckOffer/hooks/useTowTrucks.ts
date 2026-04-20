/**
 * useTowTrucks Hook
 *
 * Kullanıcının kayıtlı çekicilerini getiren hook.
 * İlk çekiciyi otomatik olarak seçer.
 *
 * @returns {
 *   towTrucks: Çekici listesi
 *   selectedId: Seçili çekici ID'si
 *   setSelectedId: Seçili ID'yi değiştirme fonksiyonu
 *   loading: Yükleme durumu
 *   error: Hata mesajı
 * }
 */
import { useState, useEffect } from 'react';
import { vehiclesAPI, TowTruck } from '../../../api';
import { logger } from '../../../utils/logger';

interface UseTowTrucksReturn {
  towTrucks: TowTruck[];
  selectedId: number | null;
  setSelectedId: (id: number) => void;
  loading: boolean;
  error: string | null;
}

export function useTowTrucks(): UseTowTrucksReturn {
  const [towTrucks, setTowTrucks] = useState<TowTruck[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTowTrucks = async () => {
      try {
        setLoading(true);
        setError(null);

        const trucks = await vehiclesAPI.getMyTowTrucks();
        setTowTrucks(trucks);

        // İlk çekiciyi otomatik seç
        if (trucks.length > 0) {
          setSelectedId(trucks[0].id ?? null);
        }

        logger.debug('orders', 'Kullancnn ekicileri yklendi');
      } catch (err: any) {
        logger.error('orders', 'ekici listesi yklenemedi');
        setError('Çekici listesi yüklenemedi');
      } finally {
        setLoading(false);
      }
    };

    fetchTowTrucks();
  }, []);

  return { towTrucks, selectedId, setSelectedId, loading, error };
}

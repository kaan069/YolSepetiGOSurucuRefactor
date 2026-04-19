/**
 * useNakliyeVehicles Hook
 *
 * Kullanıcının nakliye araçlarını yönetir.
 */
import { useState, useEffect } from 'react';
import { vehiclesAPI, NakliyeVehicle } from '../../../api';

export function useNakliyeVehicles() {
  const [vehicles, setVehicles] = useState<NakliyeVehicle[]>([]);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchVehicles = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await vehiclesAPI.getMyNakliyeVehicles();

        console.log('═══════════════════════════════════════════════════');
        console.log('🚛 NAKLİYE ARAÇLARI - API RESPONSE:');
        console.log('═══════════════════════════════════════════════════');
        console.log('Toplam araç sayısı:', data.length);
        data.forEach((v: any, i: number) => {
          console.log(`\n📍 Araç ${i + 1}:`);
          console.log('   ID:', v.id);
          console.log('   Marka/Model:', v.brand, v.model);
          console.log('   Plaka:', v.plate_number);
          console.log('   verification_status:', v.verification_status);
          console.log('   is_verified:', v.is_verified);
          console.log('   status:', v.status);
        });
        console.log('═══════════════════════════════════════════════════');

        // Araçları normalize et - verification_status yoksa veya farklı alanda ise kontrol et
        const normalizedData = data.map((v: any) => {
          // Backend'den gelen olası farklı alan isimleri
          let verificationStatus = v.verification_status
            || v.verificationStatus
            || v.status
            || (v.is_verified === true ? 'approved' : v.is_verified === false ? 'pending' : undefined);

          // Eğer hiç verification bilgisi yoksa, varsayılan olarak approved kabul et
          if (!verificationStatus) {
            console.log(`⚠️ Araç ${v.id} için verification_status bulunamadı, approved kabul ediliyor`);
            verificationStatus = 'approved';
          }

          return {
            ...v,
            verification_status: verificationStatus
          };
        });

        // Sadece onaylı araçları filtrele
        const approvedVehicles = normalizedData.filter((v: any) => v.verification_status === 'approved');
        console.log('✅ Onaylı araç sayısı:', approvedVehicles.length);

        setVehicles(normalizedData); // Normalize edilmiş araçları göster

        // İlk onaylı aracı otomatik seç
        if (approvedVehicles.length > 0 && !selectedId) {
          console.log('🎯 Otomatik seçilen araç ID:', approvedVehicles[0].id);
          setSelectedId(approvedVehicles[0].id);
        }
      } catch (err: any) {
        console.error('❌ Nakliye araçları yüklenemedi:', err);
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

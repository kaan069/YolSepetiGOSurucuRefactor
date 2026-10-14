/**
 * VehicleSelector Component
 *
 * Tüm servis tipleri için ortak araç seçici component.
 * Çekici, Vinç, Nakliye ve Yol Yardım araçları için kullanılabilir.
 */
import React, { useMemo } from 'react';
import { StyleSheet } from 'react-native';
import { JobSection } from '../job';
import { FkButton, FkInfoBanner } from '../fk';
import FkSelect from '../fk-select/FkSelect';
import type { FkSelectOption } from '../fk-select/types';
import { SERVICE_ICON } from '../../constants/serviceTypeUI';
import { spacing } from '../../theme/design';

// Araç tipi - tüm servisler için ortak
export interface Vehicle {
  id?: number;  // TowTruck için opsiyonel
  brand: string;
  model: string;
  plate_number?: string;  // Bazı servisler için opsiyonel (CraneListItem)
  year?: number;
  color?: string;
  verification_status?: 'pending' | 'approved' | 'rejected';
  // Nakliye araçları için
  capacity_type?: 'small' | 'medium' | 'large';
  max_volume?: number;
  max_weight?: number;
  has_helper?: boolean;
  // Çekici araçları için
  availibility_vehicles_types?: string[];
  // Vinç araçları için
  max_height?: number;
}

// Servis tipi
export type VehicleServiceType = 'towTruck' | 'crane' | 'nakliye' | 'roadAssistance' | 'transfer';

interface VehicleSelectorProps {
  vehicles: Vehicle[];
  selectedId: number | null;
  onSelect: (id: number) => void;
  serviceType: VehicleServiceType;
  title?: string;
  emptyMessage?: string;
  primaryColor?: string;
  loading?: boolean;
  onAddVehicle?: () => void;
}

// Servis tipine göre ikon ve başlık
const SERVICE_CONFIG: Record<VehicleServiceType, { icon: string; title: string }> = {
  towTruck: { icon: SERVICE_ICON.towTruck, title: 'Çekici Seçin' },
  crane: { icon: SERVICE_ICON.crane, title: 'Vinç Seçin' },
  nakliye: { icon: SERVICE_ICON.nakliye, title: 'Araç Seçin' },
  roadAssistance: { icon: SERVICE_ICON.roadAssistance, title: 'Araç Seçin' },
  transfer: { icon: SERVICE_ICON.transfer, title: 'Transfer Aracı Seçin' },
};


/**
 * Araç seçici: başlıklı kart + FkSelect (alttan açılan liste). Onaysız araçlar listede pasif görünür.
 */
export default function VehicleSelector({
  vehicles,
  selectedId,
  onSelect,
  serviceType,
  title,
  emptyMessage = 'Kayıtlı aracınız bulunmuyor',
  loading = false,
  onAddVehicle,
}: VehicleSelectorProps) {
  const config = SERVICE_CONFIG[serviceType];
  const displayTitle = title || config.title;

  // Onaylı araç sayısı - verification_status yoksa approved kabul et
  const approvedCount = useMemo(
    () => vehicles.filter((v) => !v.verification_status || v.verification_status === 'approved').length,
    [vehicles]
  );

  const options = useMemo<FkSelectOption<number>[]>(
    () =>
      vehicles
        .filter((v) => v.id !== undefined)
        .map((v) => {
          const isApproved = !v.verification_status || v.verification_status === 'approved';
          const meta = [v.plate_number, !isApproved ? 'Onay bekliyor' : null].filter(Boolean).join(' · ');
          return {
            value: v.id as number,
            label: `${v.brand} ${v.model}`,
            description: meta || undefined,
            disabled: !isApproved,
          };
        }),
    [vehicles]
  );

  if (loading) {
    return (
      <JobSection title={displayTitle} icon={config.icon}>
        <FkInfoBanner type="neutral" icon="timer-sand" message="Araçlar yükleniyor..." />
      </JobSection>
    );
  }

  // Boş durum
  if (vehicles.length === 0 || approvedCount === 0) {
    return (
      <JobSection title={displayTitle} icon={config.icon}>
        <FkInfoBanner
          type="warning"
          title={vehicles.length === 0 ? emptyMessage : 'Onaylı aracınız bulunmuyor'}
          message={vehicles.length === 0 ? 'Profil ayarlarından araç ekleyebilirsiniz' : 'Araçlarınız onay sürecinde'}
        >
          {onAddVehicle ? (
            <FkButton size="sm" icon="plus" onPress={onAddVehicle} style={styles.addButton}>
              Araç Ekle
            </FkButton>
          ) : null}
        </FkInfoBanner>
      </JobSection>
    );
  }

  return (
    <JobSection title={displayTitle} icon={config.icon}>
      <FkSelect<number>
        value={selectedId}
        onChange={onSelect}
        options={options}
        placeholder="Araç seçin..."
        modalTitle={displayTitle}
        containerStyle={styles.select}
      />
    </JobSection>
  );
}

const styles = StyleSheet.create({
  select: {
    marginBottom: 0,
  },
  addButton: {
    alignSelf: 'flex-start',
    marginTop: spacing.sm,
  },
});

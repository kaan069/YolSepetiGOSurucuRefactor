/**
 * VehicleInfoSection Component
 *
 * Çekilecek aracın bilgilerini gösteren bileşen (araç tipi).
 */
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';
import { vehicleTypeLabel } from '../../../constants/backendLabels';

interface VehicleInfoSectionProps {
  /** Araç tipi (car, suv, truck, motorcycle vb.) */
  vehicleType: string;
}

export default function VehicleInfoSection({ vehicleType }: VehicleInfoSectionProps) {
  const displayType = vehicleTypeLabel(vehicleType);
  return (
    <JobSection title="Araç Bilgileri" icon="car-info">
      <InfoRow icon="car-outline" label="Araç Tipi" value={displayType} />
    </JobSection>
  );
}

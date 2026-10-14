/**
 * VehicleInfoSection Component
 *
 * Çekilecek aracın bilgilerini gösteren bileşen (araç tipi).
 */
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';

interface VehicleInfoSectionProps {
  /** Araç tipi (car, suv, truck, motorcycle vb.) */
  vehicleType: string;
}

// Araç tipi İngilizce -> Türkçe çevirisi
const vehicleTypeMap: Record<string, string> = {
  car: 'Otomobil',
  suv: 'SUV',
  truck: 'Kamyon',
  motorcycle: 'Motosiklet',
  string: 'Belirtilmemiş',
};

export default function VehicleInfoSection({ vehicleType }: VehicleInfoSectionProps) {
  const displayType = vehicleTypeMap[vehicleType] || vehicleType;
  return (
    <JobSection title="Araç Bilgileri" icon="car-info">
      <InfoRow icon="car-outline" label="Araç Tipi" value={displayType} />
    </JobSection>
  );
}

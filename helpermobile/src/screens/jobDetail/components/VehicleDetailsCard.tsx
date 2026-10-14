import React from 'react';
import { TowTruckRequestDetail } from '../../../api';
import { InfoRow, JobSection } from '../../../components/job';

// Araç tipi Türkçe çeviriler
const vehicleTypeLabels: Record<string, string> = {
  'car': 'Otomobil',
  'motorcycle': 'Motosiklet',
  'suv': 'SUV/Arazi Aracı',
  'commercial': 'Ticari Araç',
  'minibus': 'Minibüs',
  'truck': 'Kamyon/TIR',
  'tractor': 'Traktör',
};

interface VehicleDetailsCardProps {
  towTruckRequest: TowTruckRequestDetail;
  towTruckDetails?: {
    vehicleType?: string;
    licensePlate?: string;
  };
}

export default function VehicleDetailsCard({ towTruckRequest, towTruckDetails }: VehicleDetailsCardProps) {
  const vehicleType = towTruckDetails?.vehicleType || towTruckRequest.vehicle_type || '';
  const vehicleTypeLabel = vehicleTypeLabels[vehicleType] || vehicleType || 'Belirtilmemiş';
  const licensePlate = towTruckDetails?.licensePlate || towTruckRequest.license_plate || towTruckRequest.vehicle_plate || '';
  const showKm = towTruckRequest.estimated_km > 0;

  return (
    <JobSection title="Araç Detayları" icon="car-info">
      <InfoRow icon="car-outline" label="Araç Tipi" value={vehicleTypeLabel} divider />
      <InfoRow icon="card-text-outline" label="Plaka" value={licensePlate || 'Belirtilmemiş'} divider={showKm} />
      {showKm && <InfoRow icon="map-marker-path" label="Çekim Mesafesi" value={`${towTruckRequest.estimated_km} km`} />}
    </JobSection>
  );
}

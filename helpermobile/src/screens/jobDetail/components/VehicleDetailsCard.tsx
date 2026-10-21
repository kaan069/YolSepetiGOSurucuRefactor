import React from 'react';
import { TowTruckRequestDetail } from '../../../api';
import { InfoRow, JobSection } from '../../../components/job';
import { vehicleTypeLabel } from '../../../constants/backendLabels';

interface VehicleDetailsCardProps {
  towTruckRequest: TowTruckRequestDetail;
  towTruckDetails?: {
    vehicleType?: string;
    licensePlate?: string;
  };
}

export default function VehicleDetailsCard({ towTruckRequest, towTruckDetails }: VehicleDetailsCardProps) {
  const vehicleType = towTruckDetails?.vehicleType || towTruckRequest.vehicle_type || '';
  const vehicleTypeText = vehicleTypeLabel(vehicleType);
  const licensePlate = towTruckDetails?.licensePlate || towTruckRequest.license_plate || towTruckRequest.vehicle_plate || '';
  const showKm = towTruckRequest.estimated_km > 0;

  return (
    <JobSection title="Araç Detayları" icon="car-info">
      <InfoRow icon="car-outline" label="Araç Tipi" value={vehicleTypeText} divider />
      <InfoRow icon="card-text-outline" label="Plaka" value={licensePlate || 'Belirtilmemiş'} divider={showKm} />
      {showKm && <InfoRow icon="map-marker-path" label="Çekim Mesafesi" value={`${towTruckRequest.estimated_km} km`} />}
    </JobSection>
  );
}

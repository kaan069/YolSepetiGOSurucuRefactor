import React from 'react';
import { TowTruckRequestDetail } from '../../../api';
import { JobLocationCard } from '../../../components/job';
import { vehicleTypeLabel } from '../../../constants/backendLabels';

interface LocationInfoCardProps {
  towTruckRequest: TowTruckRequestDetail;
}

export default function LocationInfoCard({ towTruckRequest }: LocationInfoCardProps) {
  return (
    <JobLocationCard
      title="Konum Bilgileri"
      points={[
        {
          type: 'pickup',
          label: 'Alış Noktası',
          address: towTruckRequest.pickup_address,
          detail: towTruckRequest.vehicle_type ? `Araç: ${vehicleTypeLabel(towTruckRequest.vehicle_type)}` : undefined,
        },
        {
          type: 'dropoff',
          label: 'Teslim Noktası',
          address: towTruckRequest.dropoff_address,
          detail: towTruckRequest.estimated_km ? `Mesafe: ${towTruckRequest.estimated_km} km` : undefined,
        },
      ]}
    />
  );
}

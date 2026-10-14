// Müşteri konum kartı - Vinç
import React from 'react';
import { JobLocationCard } from '../../../components/job';

interface LocationCardProps {
  address: string;
  latitude: number;
  longitude: number;
}

export default function LocationCard({ address, latitude, longitude }: LocationCardProps) {
  return (
    <JobLocationCard
      title="Müşteri Konumu"
      points={[
        {
          type: 'single',
          address,
          latitude,
          longitude,
          directionsLabel: 'Yol Tarifi Al',
        },
      ]}
    />
  );
}

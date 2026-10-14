// Rota bilgileri kartı - Nakliye (alış-bırakış konumları)
import React from 'react';
import { InfoRow, JobLocationCard } from '../../../components/job';
import { spacing } from '../../../theme/design';

interface RouteInfoCardProps {
  fromAddress: string;
  toAddress: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  totalDistance?: number | null;
  isCity?: boolean; // true = şehirler arası, false = evden eve
}

export default function RouteInfoCard({
  fromAddress,
  toAddress,
  fromLat,
  fromLng,
  toLat,
  toLng,
  totalDistance,
  isCity = false,
}: RouteInfoCardProps) {
  const showDistance = totalDistance !== null && totalDistance !== undefined && totalDistance > 0;
  return (
    <JobLocationCard
      title="Rota Bilgileri"
      icon="truck-delivery-outline"
      points={[
        {
          type: 'pickup',
          label: isCity ? 'Alınacak Şehir' : 'Alınacak Adres',
          address: fromAddress,
          latitude: fromLat,
          longitude: fromLng,
          directionsLabel: fromLat && fromLng ? 'Yol Tarifi' : undefined,
        },
        {
          type: 'dropoff',
          label: isCity ? 'Bırakılacak Şehir' : 'Bırakılacak Adres',
          address: toAddress,
          latitude: toLat,
          longitude: toLng,
          directionsLabel: toLat && toLng ? 'Yol Tarifi' : undefined,
        },
      ]}
    >
      {showDistance ? (
        <InfoRow
          icon="map-marker-path"
          label="Toplam mesafe"
          value={`${totalDistance!.toFixed(0)} km`}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </JobLocationCard>
  );
}

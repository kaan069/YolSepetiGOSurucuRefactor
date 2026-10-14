// Adres bilgileri kartı - Evden eve nakliye
import React from 'react';
import { InfoRow, JobLocationCard } from '../../../components/job';
import { spacing } from '../../../theme/design';

interface AddressInfoCardProps {
  fromAddress: string;
  toAddress: string;
  fromLat?: number;
  fromLng?: number;
  toLat?: number;
  toLng?: number;
  totalDistance?: number | null;
  floorFrom?: number | null;
  floorTo?: number | null;
  hasElevatorFrom?: boolean;
  hasElevatorTo?: boolean;
}

const floorDetail = (floor?: number | null, hasElevator?: boolean) =>
  floor !== undefined && floor !== null
    ? `Kat: ${floor} · ${hasElevator ? 'Asansör var' : 'Asansör yok'}`
    : undefined;

export default function AddressInfoCard({
  fromAddress,
  toAddress,
  fromLat,
  fromLng,
  toLat,
  toLng,
  totalDistance,
  floorFrom,
  floorTo,
  hasElevatorFrom,
  hasElevatorTo,
}: AddressInfoCardProps) {
  const showDistance = totalDistance !== null && totalDistance !== undefined && totalDistance > 0;
  return (
    <JobLocationCard
      title="Adres Bilgileri"
      points={[
        {
          type: 'pickup',
          label: 'Alınacak Adres',
          address: fromAddress,
          latitude: fromLat,
          longitude: fromLng,
          detail: floorDetail(floorFrom, hasElevatorFrom),
        },
        {
          type: 'dropoff',
          label: 'Bırakılacak Adres',
          address: toAddress,
          latitude: toLat,
          longitude: toLng,
          detail: floorDetail(floorTo, hasElevatorTo),
        },
      ]}
    >
      {showDistance ? (
        <InfoRow
          icon="map-marker-path"
          label="Toplam mesafe"
          value={`${totalDistance!.toFixed(1)} km`}
          style={{ marginTop: spacing.sm }}
        />
      ) : null}
    </JobLocationCard>
  );
}

// Mesafe bilgisi kartı - Nakliye iş detayı
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';

interface DistanceInfoCardProps {
  distanceToPickup: number | null;
  totalDistance: number | null;
  visible: boolean;
}

export default function DistanceInfoCard({ distanceToPickup, totalDistance, visible }: DistanceInfoCardProps) {
  if (!visible || (distanceToPickup === null && totalDistance === null)) return null;
  return (
    <JobSection title="Mesafe Bilgisi" icon="map-marker-distance">
      {distanceToPickup !== null && (
        <InfoRow
          icon="crosshairs-gps"
          label="Alış noktasına"
          value={`${distanceToPickup.toFixed(1)} km`}
          divider={totalDistance !== null}
        />
      )}
      {totalDistance !== null && (
        <InfoRow icon="map-marker-path" label="Alış → Teslim" value={`${totalDistance.toFixed(1)} km`} />
      )}
    </JobSection>
  );
}

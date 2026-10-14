// Mesafe bilgisi kartı - Vinç
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';

interface DistanceCardProps {
  distance: number;
}

export default function DistanceCard({ distance }: DistanceCardProps) {
  return (
    <JobSection title="Mesafe Bilgisi" icon="map-marker-distance">
      <InfoRow label="Sizin konumunuz → Müşteri" value={`${distance.toFixed(1)} km`} emphasize />
    </JobSection>
  );
}

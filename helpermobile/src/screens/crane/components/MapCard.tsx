// Talep bilgileri kartı - Mesafe ve süre
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';
import { colors } from '../../../theme/design';

interface MapCardProps {
  latitude: number;
  longitude: number;
  address: string;
  distance?: number | null;
  estimatedDuration?: number | null;
}

export default function MapCard({ distance, estimatedDuration }: MapCardProps) {
  const hasDistance = distance !== null && distance !== undefined;
  const hasDuration = estimatedDuration !== null && estimatedDuration !== undefined;
  if (!hasDistance && !hasDuration) return null;
  return (
    <JobSection title="Talep Bilgileri" icon="information-outline">
      {hasDistance && (
        <InfoRow
          icon="map-marker-distance"
          label="Müşteriye uzaklık"
          value={`${distance} km`}
          valueColor={colors.primary[600]}
          divider={hasDuration}
        />
      )}
      {hasDuration && (
        <InfoRow icon="timer-outline" label="Tahmini iş süresi" value={`${estimatedDuration} saat`} />
      )}
    </JobSection>
  );
}

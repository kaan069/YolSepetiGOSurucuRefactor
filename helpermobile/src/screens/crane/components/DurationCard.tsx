// Tahmini iş süresi kartı - Vinç
import React from 'react';
import { InfoRow, JobSection } from '../../../components/job';

interface DurationCardProps {
  hours: number;
}

export default function DurationCard({ hours }: DurationCardProps) {
  return (
    <JobSection>
      <InfoRow icon="timer-outline" label="Tahmini İş Süresi" value={`${hours} saat`} emphasize />
    </JobSection>
  );
}

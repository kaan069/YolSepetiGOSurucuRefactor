// Kazanç kartı - Nakliye iş detayı
import React from 'react';
import { JobEarningsCard } from '../../../components/job';

interface EarningsCardProps {
  finalPrice: number;
  status: 'awaiting_approval' | 'in_progress' | 'completed';
}

export default function EarningsCard({ finalPrice, status }: EarningsCardProps) {
  if (!finalPrice) return null;
  return <JobEarningsCard amount={finalPrice} status={status} />;
}

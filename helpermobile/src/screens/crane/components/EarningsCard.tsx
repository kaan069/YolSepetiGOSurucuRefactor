// Kazanç kartı - Vinç
import React from 'react';
import { JobEarningsCard } from '../../../components/job';

interface EarningsCardProps {
  amount: number | string;
  status: 'awaiting_approval' | 'in_progress' | 'completed';
}

export default function EarningsCard({ amount, status }: EarningsCardProps) {
  return <JobEarningsCard amount={amount} status={status} />;
}

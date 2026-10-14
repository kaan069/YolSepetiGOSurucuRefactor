// Status banner - Onay bekliyor durumu için
import React from 'react';
import { JobAwaitingApprovalBanner } from '../../../components/job';

interface StatusBannerProps {
  type: 'awaiting_approval';
}

export default function StatusBanner({ type }: StatusBannerProps) {
  if (type === 'awaiting_approval') {
    return <JobAwaitingApprovalBanner />;
  }
  return null;
}

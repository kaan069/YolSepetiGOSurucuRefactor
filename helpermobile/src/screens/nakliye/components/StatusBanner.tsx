// Onay bekliyor banner - Nakliye iş detayı
import React from 'react';
import { JobAwaitingApprovalBanner } from '../../../components/job';

interface StatusBannerProps {
  visible: boolean;
}

export default function StatusBanner({ visible }: StatusBannerProps) {
  if (!visible) return null;
  return <JobAwaitingApprovalBanner showTrackingNote={false} />;
}

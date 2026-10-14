import React from 'react';
import { JobAwaitingApprovalBanner } from '../../../components/job';

interface AwaitingApprovalBannerProps {
  visible: boolean;
}

export default function AwaitingApprovalBanner({ visible }: AwaitingApprovalBannerProps) {
  if (!visible) return null;
  return <JobAwaitingApprovalBanner />;
}

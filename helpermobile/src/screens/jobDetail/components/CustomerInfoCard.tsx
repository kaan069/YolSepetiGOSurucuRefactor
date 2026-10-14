import React from 'react';
import { TowTruckRequestDetail } from '../../../api';
import { JobCustomerCard } from '../../../components/job';

interface CustomerInfoCardProps {
  towTruckRequest: TowTruckRequestDetail;
  visible: boolean;
}

export default function CustomerInfoCard({ towTruckRequest, visible }: CustomerInfoCardProps) {
  if (!visible) return null;
  return (
    <JobCustomerCard
      name={towTruckRequest.requestOwnerNameSurname}
      phone={towTruckRequest.requestOwnerPhone}
    />
  );
}

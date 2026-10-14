// Müşteri bilgileri kartı - Yol Yardım
import React from 'react';
import { JobCustomerCard } from '../../../components/job';

interface CustomerInfoCardProps {
  name?: string;
  phone?: string;
}

export default function CustomerInfoCard({ name, phone }: CustomerInfoCardProps) {
  return <JobCustomerCard name={name} phone={phone} showCallButton />;
}

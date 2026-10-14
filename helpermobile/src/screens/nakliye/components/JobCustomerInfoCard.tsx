// Müşteri bilgileri kartı - Nakliye iş detayı (devam eden işler için)
import React from 'react';
import { JobCustomerCard } from '../../../components/job';

interface JobCustomerInfoCardProps {
  name?: string;
  phone?: string;
  visible: boolean;
}

export default function JobCustomerInfoCard({ name, phone, visible }: JobCustomerInfoCardProps) {
  if (!visible) return null;
  return <JobCustomerCard name={name} phone={phone} showCallButton />;
}

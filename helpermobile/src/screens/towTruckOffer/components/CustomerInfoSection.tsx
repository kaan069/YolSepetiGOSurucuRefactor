/**
 * CustomerInfoSection Component
 *
 * Müşteri bilgileri (ortak JobCustomerCard).
 * NOT: Bu bileşen sadece iş kabul edildikten sonra (status !== 'pending') gösterilir.
 */
import React from 'react';
import { JobCustomerCard } from '../../../components/job';

interface CustomerInfoSectionProps {
  /** Müşteri adı soyadı */
  customerName?: string;
  /** Müşteri telefon numarası */
  customerPhone?: string;
}

export default function CustomerInfoSection({ customerName, customerPhone }: CustomerInfoSectionProps) {
  return <JobCustomerCard name={customerName} phone={customerPhone} showCallButton />;
}

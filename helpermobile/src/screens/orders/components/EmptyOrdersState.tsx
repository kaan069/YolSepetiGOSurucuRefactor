import React from 'react';
import { OrderStatus } from '../../../lib/types';
import { FkEmptyState } from '../../../components/fk';

interface EmptyOrdersStateProps {
  filter: OrderStatus;
}

const EMPTY: Partial<Record<OrderStatus, { icon: string; title: string; message: string }>> = {
  pending: {
    icon: 'inbox-outline',
    title: 'Bekleyen iş bulunmuyor',
    message: 'Yeni talepler geldiğinde burada görünecek.',
  },
  awaiting_approval: {
    icon: 'account-clock-outline',
    title: 'Onay bekleyen iş bulunmuyor',
    message: 'Teklif verdiğiniz ve müşterinin onayını bekleyen işler burada listelenir.',
  },
  awaiting_payment: {
    icon: 'credit-card-clock-outline',
    title: 'Ödeme bekleyen iş bulunmuyor',
    message: 'Müşterinin onayladığı ve ödeme bekleyen işler burada listelenir.',
  },
  in_progress: {
    icon: 'truck-fast-outline',
    title: 'Devam eden iş bulunmuyor',
    message: 'Başlayan işleriniz burada görünecek.',
  },
  completed: {
    icon: 'check-circle-outline',
    title: 'Tamamlanmış iş bulunmuyor',
    message: 'Bitirdiğiniz işler burada listelenir.',
  },
};

export default function EmptyOrdersState({ filter }: EmptyOrdersStateProps) {
  const cfg = EMPTY[filter] || { icon: 'inbox-outline', title: 'İş bulunmuyor', message: '' };
  return <FkEmptyState icon={cfg.icon} title={cfg.title} message={cfg.message || undefined} />;
}

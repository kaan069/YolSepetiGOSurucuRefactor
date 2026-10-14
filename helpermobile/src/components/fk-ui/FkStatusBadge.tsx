import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import FkPill from './FkPill';
import { getStatusStyle } from '../../theme/design';
import { STATUS_LABELS } from '../../constants/orderStatus';
import type { OrderStatus } from '../../lib/types';

interface Props {
  status?: string | null;
  /** Varsayılan Türkçe etiket yerine özel metin */
  label?: string;
  size?: 'sm' | 'md';
  showIcon?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Sipariş durumu rozeti — tüm uygulamada tek renk eşlemesi (design.statusColors). */
export default function FkStatusBadge({ status, label, size = 'md', showIcon = true, style }: Props) {
  const s = getStatusStyle(status);
  const text = label ?? (status ? STATUS_LABELS[status as OrderStatus] ?? status : '');
  return (
    <FkPill
      label={text}
      bg={s.bg}
      fg={s.text}
      icon={showIcon ? s.icon : undefined}
      size={size}
      style={style}
    />
  );
}

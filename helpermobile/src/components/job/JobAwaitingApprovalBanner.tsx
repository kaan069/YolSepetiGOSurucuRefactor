import React from 'react';
import { StyleProp, ViewStyle } from 'react-native';
import { FkInfoBanner } from '../fk';
import { spacing } from '../../theme/design';

interface Props {
  /** Varsayılan açıklamanın yerine geçer */
  message?: string;
  /** Takip linki notunu göster */
  showTrackingNote?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** "Müşteri onayı bekleniyor" bandı — tüm servislerde tek bileşen (eskiden 4 kopya). */
export default function JobAwaitingApprovalBanner({ message, showTrackingNote = true, style }: Props) {
  const base =
    message ??
    'Teklifiniz müşteriye iletildi. Müşteri teklifi onayladığında iş başlayacak ve siz bilgilendirileceksiniz.';
  return (
    <FkInfoBanner
      type="warning"
      icon="clock-alert-outline"
      title="Müşteri Onayı Bekleniyor"
      message={showTrackingNote ? `${base} Müşteri onayını takip linki üzerinden verecektir.` : base}
      style={[{ marginBottom: spacing.md }, style]}
    />
  );
}

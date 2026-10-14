/**
 * AcceptButton Component
 *
 * Teklif gönderme butonu — ekranın altında sabit alanda (FkStickyFooter).
 * Çekici seçilmediğinde veya fiyat hesaplanmadığında disabled olur.
 */
import React from 'react';
import { FkButton, FkStickyFooter } from '../../../components/fk';

interface AcceptButtonProps {
  /** Butona tıklandığında çağrılacak fonksiyon */
  onPress: () => void;
  /** Yükleme durumu */
  loading: boolean;
  /** Çekici sayısı (0 ise buton disabled) */
  towTruckCount: number;
  /** Fiyat hesaplandı mı? */
  hasPricing: boolean;
}

export default function AcceptButton({ onPress, loading, towTruckCount, hasPricing }: AcceptButtonProps) {
  const isDisabled = loading || towTruckCount === 0 || !hasPricing;
  const buttonText = towTruckCount === 0 ? 'Kayıtlı Çekici Yok' : 'Teklif Gönder';
  return (
    <FkStickyFooter safeArea={false}>
      <FkButton onPress={onPress} loading={loading} disabled={isDisabled} icon="send-check-outline" size="lg" fullWidth>
        {buttonText}
      </FkButton>
    </FkStickyFooter>
  );
}

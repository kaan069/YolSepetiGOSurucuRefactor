// Teklif gereksinimleri kartı - Vinç (eksik bilgi uyarısı)
import React from 'react';
import OfferChecklist from '../../../components/offer/OfferChecklist';

interface RequirementsCardProps {
  selectedCraneId: number | null;
  distance: number | null;
  offerPrice: string;
}

export default function RequirementsCard({ selectedCraneId, distance, offerPrice }: RequirementsCardProps) {
  const hasValidPrice = offerPrice.trim() !== '' && parseFloat(offerPrice) > 0;
  return (
    <OfferChecklist
      items={[
        {
          done: !!selectedCraneId,
          label: 'Vinç seçimi',
          detail: selectedCraneId ? 'Seçildi' : 'Lütfen yukarıdan bir vinç seçin',
        },
        {
          done: !!distance,
          label: 'Mesafe',
          detail: distance ? `${distance.toFixed(1)} km` : 'GPS izni verdiğinizden emin olun',
        },
        {
          done: hasValidPrice,
          label: 'Fiyat teklifi',
          detail: hasValidPrice ? `${parseInt(offerPrice, 10).toLocaleString('tr-TR')} TL` : 'Lütfen bir fiyat teklifi girin',
        },
      ]}
    />
  );
}

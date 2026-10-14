// Fiyat teklif kartı - Vinç (Manuel teklif girişi)
import React from 'react';
import PriceOfferSection, { PriceOfferInfoRow } from '../../../components/offer/PriceOfferSection';

interface PricingCardProps {
  offerPrice: string;
  onOfferPriceChange: (value: string) => void;
  distance: number | null;
  estimatedDuration: number | null;
}

export default function PricingCard({
  offerPrice,
  onOfferPriceChange,
  distance,
  estimatedDuration,
}: PricingCardProps) {
  const infoRows: PriceOfferInfoRow[] = [];
  if (distance !== null) infoRows.push({ label: 'Mesafe', value: `${distance.toFixed(1)} km`, icon: 'map-marker-distance' });
  if (estimatedDuration !== null) infoRows.push({ label: 'Tahmini Süre', value: `${estimatedDuration} saat`, icon: 'timer-outline' });

  return (
    <PriceOfferSection
      value={offerPrice}
      onChange={onOfferPriceChange}
      infoRows={infoRows}
      hint="Müşteriye gösterilecek toplam fiyatı girin. Platform komisyonu düşüldükten sonra kalan tutar size ödenecektir."
    />
  );
}

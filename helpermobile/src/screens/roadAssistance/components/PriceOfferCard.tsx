// Fiyat teklifi kartı - Yol Yardım
import React from 'react';
import PriceOfferSection from '../../../components/offer/PriceOfferSection';

interface PriceOfferCardProps {
  price: string;
  onPriceChange: (value: string) => void;
  error?: string;
}

export default function PriceOfferCard({ price, onPriceChange, error }: PriceOfferCardProps) {
  return (
    <PriceOfferSection
      value={price}
      onChange={onPriceChange}
      error={error}
      hint="Yol yardım hizmeti için teklif edeceğiniz fiyatı girin. Müşteri teklifinizi değerlendirecektir."
    />
  );
}

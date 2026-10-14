// Fiyat teklifi kartı - Nakliye
import React from 'react';
import PriceOfferSection from '../../../components/offer/PriceOfferSection';

interface PriceOfferCardProps {
  price: string;
  onPriceChange: (value: string) => void;
  error?: string;
  hint?: string;
  placeholder?: string;
}

export default function PriceOfferCard({
  price,
  onPriceChange,
  error,
  hint = 'Nakliye için teklif edeceğiniz fiyatı girin. Müşteri teklifinizi değerlendirecektir.',
  placeholder,
}: PriceOfferCardProps) {
  return (
    <PriceOfferSection value={price} onChange={onPriceChange} error={error} hint={hint} placeholder={placeholder} />
  );
}

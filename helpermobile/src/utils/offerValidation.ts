import { MIN_OFFER_PRICE, DEV_OVERRIDE_MIN_OFFER_PRICE } from '../constants/offer';

export function getMinOfferPrice(overrideActive: boolean): number {
  return overrideActive ? DEV_OVERRIDE_MIN_OFFER_PRICE : MIN_OFFER_PRICE;
}

export interface OfferValidationResult {
  valid: boolean;
  error?: string;
  price?: number;
}

// Sürücünün girdiği ham fiyat string'ini doğrular. 6 teklif ekranında ortak
// kullanılır — her ekran kendi mevcut hata gösterim pattern'iyle (Alert /
// inline state / notification) bu sonucu kullanıcıya iletir.
export function validateOfferPrice(
  raw: string,
  overrideActive: boolean,
): OfferValidationResult {
  const price = parseFloat(raw);
  if (!raw || isNaN(price) || price <= 0) {
    return { valid: false, error: 'Lütfen geçerli bir fiyat girin.' };
  }
  const minPrice = getMinOfferPrice(overrideActive);
  if (price < minPrice) {
    return {
      valid: false,
      error: `Minimum ${minPrice.toLocaleString('tr-TR')} TL teklif verebilirsiniz.`,
    };
  }
  return { valid: true, price };
}

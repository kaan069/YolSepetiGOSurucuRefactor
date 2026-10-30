/**
 * Acente ödemeli iş: payer 'customer' dışındaysa sürücü teklif vermez, acentenin
 * sabit ücretini (agreed_price) görüp Kabul eder ya da Reddeder.
 * 'agency' ve 'agency_package' sürücü açısından aynıdır.
 */
import type { PayerFields } from '../api/types';

export function isAgencyPaid(payer: unknown): boolean {
  return typeof payer === 'string' && payer !== '' && payer !== 'customer';
}

/** "1850.00" → "1.850 TL" */
export function formatAgreedPrice(price: string | number | null | undefined): string {
  const value = Number(price);
  if (price == null || price === '' || !Number.isFinite(value)) return '';
  return `${value.toLocaleString('tr-TR', { maximumFractionDigits: 2 })} TL`;
}

/** Kart metni: "Acente öder · 1.850 TL" */
export function agencyPaidLabel(price: string | number | null | undefined): string {
  const formatted = formatAgreedPrice(price);
  return formatted ? `Acente öder · ${formatted}` : 'Acente öder';
}

/** Liste/detay satırından kart metni; müşteri ödemeli işte null. */
export function agencyPaidLabelOf(row: PayerFields | null | undefined): string | null {
  return isAgencyPaid(row?.payer) ? agencyPaidLabel(row?.agreed_price) : null;
}

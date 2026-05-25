/**
 * Tam adresi yaklasik bolgeye (ilce, il) maskele.
 * Turk adres formati: "Mahalle, Sokak, No, Ilce, Il" — son 2 parcayi alir.
 * Surucuye gelen is kartlarinda musterinin tam adresini sizdirmamak icin kullanilir.
 *
 * Ornek:
 *   "Maltepe Mah. Ataturk Cad. No:12, Kadikoy, Istanbul" → "Kadikoy, Istanbul"
 *   "Kadikoy" → "Kadikoy"
 *   null/undefined → "Bolge belirtilmemis"
 */
export function maskAddressToArea(address: string | null | undefined): string {
  if (!address) return 'Bölge belirtilmemiş';
  const parts = address.split(/[,\/]/);
  if (parts.length >= 2) {
    return parts.slice(-2).join(', ').trim();
  }
  return address.length > 30 ? address.substring(0, 30) + '...' : address;
}

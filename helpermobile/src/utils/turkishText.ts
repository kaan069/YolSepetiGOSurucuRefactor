/**
 * Türkçe metin folding yardımcıları.
 *
 * `foldTr`, backend `apps/request/services/city_utils.normalize_city` ile
 * BYTE-İDENTİK çıktı üretir — şehir adlarının karşılaştırılması/eşleştirilmesi
 * ve arama filtrelemesi için kullanılır, GÖSTERİM için DEĞİL.
 *
 * Backend ile aynı sıra: trim → fold (char map) → lowerCase → boşluk daraltma.
 * Türkçe büyük harfler (`İ`, `I`, `Ş`, `Ğ`, `Ü`, `Ö`, `Ç`) `toLowerCase()`'ten
 * ÖNCE foldlandığı için Hermes'in eksik ICU davranışı (`"İ".toLowerCase()` →
 * `"i̇"` combining-dot sorunu) hiç tetiklenmez. Intl/locale bağımlılığı yoktur.
 *
 * Örnek: "ISTANBUL", "istanbul", "İstanbul", " İSTANBUL " → hepsi "istanbul".
 */

const FOLD_MAP: Record<string, string> = {
  'İ': 'i', 'I': 'i', 'ı': 'i',
  'Ş': 's', 'ş': 's',
  'Ğ': 'g', 'ğ': 'g',
  'Ü': 'u', 'ü': 'u',
  'Ö': 'o', 'ö': 'o',
  'Ç': 'c', 'ç': 'c',
};

/**
 * Bir string'i backend `normalize_city` ile birebir aynı normalize-key'e çevirir.
 * Karşılaştırma/arama için; sonuç kullanıcıya gösterilmemelidir.
 */
export function foldTr(s: string): string {
  if (!s) return '';
  let out = '';
  for (const ch of s.trim()) out += FOLD_MAP[ch] ?? ch;
  return out.toLowerCase().replace(/\s+/g, ' ');
}

/**
 * İki şehir listesini normalize-key set'i olarak karşılaştırır.
 * Sıra, biçim (canonical vs folded) ve duplicate önemsizdir — yalnızca
 * "aynı şehir kümesi mi?" sorusunu yanıtlar.
 */
export function sameCitySet(a: string[], b: string[]): boolean {
  const sa = new Set(a.map(foldTr));
  const sb = new Set(b.map(foldTr));
  if (sa.size !== sb.size) return false;
  for (const k of sa) if (!sb.has(k)) return false;
  return true;
}

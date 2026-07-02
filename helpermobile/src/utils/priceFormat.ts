/**
 * Fiyat/tutar girişleri için Türkçe binlik ayraç yardımcıları.
 *
 * Kural: state HAM rakam string'i tutar ("1000"); input formatlı GÖSTERİR ("1.000").
 * `onChangeText` MUTLAKA `digitsOnly` ile temizlenmelidir — aksi halde binlik ayracı
 * state'e sızar ve `parseFloat("1.000")` = 1 olur (ciddi fiyat bug'ı).
 */

/** Ham rakam string'ini Türkçe binlik ayraçlı gösterime çevirir ("1000" → "1.000", boş → ""). */
export const formatThousands = (value: string): string => {
  const digits = String(value ?? '').replace(/[^0-9]/g, '');
  return digits ? parseInt(digits, 10).toLocaleString('tr-TR') : '';
};

/** Kullanıcı girişinden yalnızca rakamları alır (binlik ayraç/nokta/harf temizlenir). */
export const digitsOnly = (text: string): string => text.replace(/[^0-9]/g, '');

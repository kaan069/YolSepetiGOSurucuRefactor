/**
 * TowTruckOffer Utility Functions
 *
 * Çekici teklif ekranında kullanılan yardımcı fonksiyonlar.
 */

/**
 * İki koordinat arasındaki mesafeyi hesaplar (Haversine formülü)
 * @param lat1 - Başlangıç enlem
 * @param lon1 - Başlangıç boylam
 * @param lat2 - Bitiş enlem
 * @param lon2 - Bitiş boylam
 * @returns Mesafe (km)
 */
export const calculateDistance = (
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number => {
  const R = 6371; // Dünya'nın yarıçapı (km)
  const dLat = ((lat2 - lat1) * Math.PI) / 180;
  const dLon = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos((lat1 * Math.PI) / 180) *
      Math.cos((lat2 * Math.PI) / 180) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
};

/**
 * Sayıyı Türkçe formatla (binlik ayracı ile)
 * @param num - Formatlanacak sayı
 * @returns Formatlanmış string (örn: "1.234,56")
 */
export const formatNumber = (num: number): string => {
  return num.toLocaleString('tr-TR', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
};

/**
 * Mesafeyi formatla (binlik ayracı olmadan, max 1 ondalık)
 * @param num - Formatlanacak mesafe
 * @returns Formatlanmış string (örn: "12.5")
 */
export const formatDistance = (num: number): string => {
  return num.toFixed(1).replace('.0', '');
};

/**
 * route_distance string'ini (örn: "1.6 km" veya "1,590 km") sayıya çevirir
 * Türkçe ve İngilizce formatları destekler
 * @param routeDistance - Backend'den gelen mesafe string'i
 * @returns Mesafe (km) sayı olarak
 */
export const parseRouteDistance = (routeDistance: string): number => {
  if (!routeDistance) return 0;

  // " km" son ekini kaldır
  let clean = routeDistance.replace(' km', '').replace('km', '').trim();

  // Format tespiti:
  // "1,590" -> Türkçe binlik ayraç (virgül) = 1590
  // "1.590" -> Türkçe binlik ayraç (nokta) = 1590
  // "1,5" -> Türkçe ondalık (virgül) = 1.5
  // "1.5" -> İngilizce ondalık (nokta) = 1.5

  const hasComma = clean.includes(',');
  const hasDot = clean.includes('.');

  if (hasComma && hasDot) {
    // Hem virgül hem nokta var: "1.590,5" veya "1,590.5"
    // Hangisi sonra geliyorsa o ondalık ayracı
    const commaIndex = clean.lastIndexOf(',');
    const dotIndex = clean.lastIndexOf('.');

    if (commaIndex > dotIndex) {
      // Virgül sonra: "1.590,5" -> Türkçe format
      clean = clean.replace(/\./g, '').replace(',', '.');
    } else {
      // Nokta sonra: "1,590.5" -> İngilizce format
      clean = clean.replace(/,/g, '');
    }
  } else if (hasComma) {
    // Sadece virgül var
    const parts = clean.split(',');
    if (parts.length === 2 && parts[1].length === 3) {
      // "1,590" -> binlik ayraç, 1590
      clean = clean.replace(',', '');
    } else {
      // "1,5" -> ondalık, 1.5
      clean = clean.replace(',', '.');
    }
  } else if (hasDot) {
    // Sadece nokta var
    const parts = clean.split('.');
    if (parts.length === 2 && parts[1].length === 3) {
      // "1.590" -> binlik ayraç, 1590
      clean = clean.replace('.', '');
    }
    // else: "1.5" -> ondalık, olduğu gibi bırak
  }

  return parseFloat(clean) || 0;
};

/**
 * Request ID'yi al - hem object hem number formatını destekler
 * @param request - Talep objesi
 * @returns Request ID (number)
 */
export const getRequestId = (request: any): number => {
  if (!request?.request_id) {
    console.error('❌ getRequestId: request_id is null or undefined');
    return 0;
  }

  // Object formatı: { id: 123 }
  if (typeof request.request_id === 'object' && request.request_id !== null) {
    return request.request_id.id;
  }

  // Number formatı
  return request.request_id as number;
};

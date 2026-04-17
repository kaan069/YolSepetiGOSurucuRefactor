// Nakliye (şehirler arası + evden eve) sabitleri ve yardımcı fonksiyonlar

// Mesafe hesaplama (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Sayı formatlama (binlik ayracı)
export const formatNumber = (num: number): string => {
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Yük tipi çevirisi
export const LOAD_TYPE_LABELS: Record<string, string> = {
  'furniture': 'Mobilya',
  'electronics': 'Elektronik',
  'fragile': 'Kırılabilir',
  'clothes': 'Giysi',
  'boxes': 'Kutular',
  'appliances': 'Beyaz Eşya',
  'other': 'Diğer',
};

// Oda tipi çevirisi
export const ROOM_TYPE_LABELS: Record<string, string> = {
  '1+0': 'Stüdyo (1+0)',
  '1+1': '1+1',
  '2+1': '2+1',
  '3+1': '3+1',
  '4+1': '4+1',
  '5+1': '5+1 ve üzeri',
};

// Status helper
export const getStatus = (request: any): string => {
  return request?.status || 'unknown';
};

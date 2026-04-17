import { EarningsServiceType } from '../../api';

export type PeriodRange = 'today' | 'week' | 'month' | 'year';

export type ServiceTypeConfig = {
  value: EarningsServiceType;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
};

// Tamamlanmış iş tipi
export type CompletedJob = {
  id: string;
  finishedAt: string;
  amount: number;
  distanceKm: number;
  pickupAddress: string;
  dropoffAddress: string;
  serviceType: 'towTruck' | 'crane' | 'roadAssistance' | 'homeMoving' | 'cityMoving' | 'homeToHomeMoving' | 'cityToCity' | 'transfer';
};

// Hizmet tipi konfigürasyonları - tek yerden yönetim
export const SERVICE_TYPES: ServiceTypeConfig[] = [
  { value: 'towTruck', label: 'Çekici', emoji: '🚗', color: '#1976D2', bgColor: '#E3F2FD' },
  { value: 'crane', label: 'Vinç', emoji: '🏗️', color: '#F57C00', bgColor: '#FFF3E0' },
  { value: 'roadAssistance', label: 'Yol Yardım', emoji: '🔧', color: '#388E3C', bgColor: '#E8F5E9' },
  { value: 'homeToHomeMoving', label: 'Evden Eve', emoji: '🏠', color: '#7B1FA2', bgColor: '#F3E5F5' },
  { value: 'cityToCity', label: 'Şehirler Arası', emoji: '🚚', color: '#9C27B0', bgColor: '#F3E5F5' },
  { value: 'transfer', label: 'Transfer', emoji: '🚐', color: '#5C6BC0', bgColor: '#E8EAF6' },
];

// Hizmet tipi etiketleri (emoji'li)
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  towTruck: '🚗 Çekici',
  crane: '🏗️ Vinç',
  roadAssistance: '🔧 Yol Yardım',
  homeMoving: '🏠 Evden Eve',
  homeToHomeMoving: '🏠 Evden Eve',
  cityMoving: '🚚 Şehirler Arası',
  cityToCity: '🚚 Şehirler Arası',
  transfer: '🚐 Transfer',
};

// Hizmet tipi etiketleri (düz metin - rapor için)
export const SERVICE_TYPE_LABELS_PLAIN: Record<string, string> = {
  towTruck: 'Cekici',
  crane: 'Vinc',
  roadAssistance: 'Yol Yardim',
  homeMoving: 'Evden Eve',
  homeToHomeMoving: 'Evden Eve',
  cityMoving: 'Sehirler Arasi',
  cityToCity: 'Sehirler Arasi',
  transfer: 'Transfer',
};

// Dönem etiketleri
export const PERIOD_LABELS: Record<string, string> = {
  today: 'Bugun',
  week: 'Bu Hafta',
  month: 'Bu Ay',
  year: 'Bu Yil',
};

// İstatistik kartları konfigürasyonu (nakliye birleşik)
export const STAT_CARDS = [
  { key: 'towTruck', serviceTypes: ['towTruck'] as EarningsServiceType[], label: 'Çekici', emoji: '🚗', color: '#1976D2', bgColor: '#E3F2FD' },
  { key: 'crane', serviceTypes: ['crane'] as EarningsServiceType[], label: 'Vinç', emoji: '🏗️', color: '#F57C00', bgColor: '#FFF3E0' },
  { key: 'roadAssistance', serviceTypes: ['roadAssistance'] as EarningsServiceType[], label: 'Yol Yardım', emoji: '🔧', color: '#388E3C', bgColor: '#E8F5E9' },
  { key: 'nakliye', serviceTypes: ['homeToHomeMoving', 'cityToCity'] as EarningsServiceType[], label: 'Nakliye', emoji: '🚚', color: '#7B1FA2', bgColor: '#F3E5F5' },
  { key: 'transfer', serviceTypes: ['transfer'] as EarningsServiceType[], label: 'Transfer', emoji: '🚐', color: '#5C6BC0', bgColor: '#E8EAF6' },
];

export const PAGE_SIZE = 20;

// Para formatlama
export const formatMoney = (amount: number) => {
  return amount.toLocaleString('en-US', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

// Tarih formatlama
export const formatDate = (iso: string) => {
  if (!iso) return '-';
  const dt = new Date(iso);
  return dt.toLocaleDateString('tr-TR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

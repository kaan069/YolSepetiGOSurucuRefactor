import { EarningsServiceType } from '../../api';
import {
  SERVICE_GROUP_MEMBERS,
  type ServiceType,
} from '../../constants/serviceTypes';
import {
  SERVICE_LABEL,
  SERVICE_EMOJI,
  SERVICE_COLOR,
  SERVICE_BG_COLOR,
} from '../../constants/serviceTypeUI';

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

// Earnings ekranı için gösterilen atomik servis tipleri (nakliye group'u
// STAT_CARDS üzerinden ayrıca handle edilir). Sıra mevcut UI sırasıyla korunur.
const EARNINGS_ATOMIC_ORDER: readonly ServiceType[] = [
  'towTruck',
  'crane',
  'roadAssistance',
  'homeToHomeMoving',
  'cityToCity',
  'transfer',
];

// Hizmet tipi konfigürasyonları - canonical UI map'lerinden türetilir
export const SERVICE_TYPES: ServiceTypeConfig[] = EARNINGS_ATOMIC_ORDER.map((value) => ({
  value: value as EarningsServiceType,
  label: SERVICE_LABEL[value],
  emoji: SERVICE_EMOJI[value],
  color: SERVICE_COLOR[value],
  bgColor: SERVICE_BG_COLOR[value],
}));

// Hizmet tipi etiketleri (emoji'li).
// Canonical atomik key'lerin yanı sıra geriye-dönük uyumluluk için legacy
// `homeMoving` / `cityMoving` alias'ları korunur — CompletedJob.serviceType
// union'u bu literal'ları hâlâ içeriyor (geçmiş kayıtlar).
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  towTruck: `${SERVICE_EMOJI.towTruck} ${SERVICE_LABEL.towTruck}`,
  crane: `${SERVICE_EMOJI.crane} ${SERVICE_LABEL.crane}`,
  roadAssistance: `${SERVICE_EMOJI.roadAssistance} ${SERVICE_LABEL.roadAssistance}`,
  homeToHomeMoving: `${SERVICE_EMOJI.homeToHomeMoving} ${SERVICE_LABEL.homeToHomeMoving}`,
  cityToCity: `${SERVICE_EMOJI.cityToCity} ${SERVICE_LABEL.cityToCity}`,
  transfer: `${SERVICE_EMOJI.transfer} ${SERVICE_LABEL.transfer}`,
  // legacy aliases
  homeMoving: `${SERVICE_EMOJI.homeToHomeMoving} ${SERVICE_LABEL.homeToHomeMoving}`,
  cityMoving: `${SERVICE_EMOJI.cityToCity} ${SERVICE_LABEL.cityToCity}`,
};

// Hizmet tipi etiketleri (düz metin, diakritiksiz - TR rapor uyumluluğu için).
// Canonical SERVICE_LABEL diakritik içerdiğinden ASCII eşlenik burada yerel
// tanımlanır (rapor çıktısı bu formda kalmalı).
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

// İstatistik kartları konfigürasyonu (nakliye birleşik).
// key + serviceTypes pairing mevcut STAT_CARDS davranışıyla birebir eşleşir,
// label/emoji/color/bgColor canonical UI map'lerinden türetilir.
type StatCardKey = 'towTruck' | 'crane' | 'roadAssistance' | 'nakliye' | 'transfer';

type StatCardConfig = {
  key: StatCardKey;
  serviceTypes: EarningsServiceType[];
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
};

const STAT_CARD_KEYS: readonly StatCardKey[] = [
  'towTruck',
  'crane',
  'roadAssistance',
  'nakliye',
  'transfer',
];

export const STAT_CARDS: StatCardConfig[] = STAT_CARD_KEYS.map((key) => ({
  key,
  serviceTypes: [...SERVICE_GROUP_MEMBERS[key]] as EarningsServiceType[],
  label: SERVICE_LABEL[key],
  emoji: SERVICE_EMOJI[key],
  color: SERVICE_COLOR[key],
  bgColor: SERVICE_BG_COLOR[key],
}));

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

/**
 * Backend'in gönderdiği kod değerlerinin Türkçe karşılıkları (tek kaynak).
 *
 * Değerler müşteri mobil / web uygulamaları ve acente panelinin talep formlarından gelir
 * (ör. yol yardımda müşteri `battery_jump`, acente `battery_boost` gönderir). Backend bu
 * alanları serbest metin olarak saklar; eski kayıtlar ve büyük harfli / boşluklu
 * yazımlar da tanınır. Bilinmeyen değer olduğu gibi gösterilir (çoğu zaman zaten
 * Türkçe serbest metindir).
 */

type LabelMap = Record<string, string>;

/** "Battery Boost", "BATTERY_BOOST", "battery-boost" → "battery_boost" */
function normalizeCode(value: string): string {
  return value.trim().toLowerCase().replace(/[\s-]+/g, '_');
}

function lookup(map: LabelMap, value: unknown, fallback: string): string {
  if (value === null || value === undefined) return fallback;
  const raw = String(value).trim();
  if (!raw) return fallback;
  return map[normalizeCode(raw)] ?? raw;
}

const UNSPECIFIED = 'Belirtilmemiş';

// ---------------------------------------------------------------------------
// Müşterinin aracı (çekici ve yol yardım talebi)
// ---------------------------------------------------------------------------

const VEHICLE_TYPE: LabelMap = {
  car: 'Otomobil',
  motorcycle: 'Motosiklet',
  suv: 'Arazi Aracı / SUV',
  offroad: 'Arazi Aracı / SUV',
  off_road: 'Arazi Aracı / SUV',
  commercial: 'Ticari Araç',
  minibus: 'Minibüs',
  truck: 'Kamyon / Tır',
  tractor: 'Traktör',
  traktor: 'Traktör',
  // Eski / acentenin tanımadığı kodlar (backend 'car' olarak da kaydedebilir)
  pickup: 'Pikap',
  van: 'Panelvan',
  minivan: 'Minivan',
  bus: 'Otobüs',
  other: 'Diğer',
  // Hatalı istemci kaydı
  string: UNSPECIFIED,
};

export const vehicleTypeLabel = (value: unknown): string => lookup(VEHICLE_TYPE, value, UNSPECIFIED);

// ---------------------------------------------------------------------------
// Yol yardım: sorun tipleri (talep) ve araç hizmetleri (yol yardım aracı)
// ---------------------------------------------------------------------------

const ROAD_PROBLEM: LabelMap = {
  // Müşteri mobil / web
  tire_change: 'Lastik Değişimi',
  battery_jump: 'Akü Takviyesi',
  fuel: 'Yakıt Bitti',
  lockout: 'Anahtar İçeride Kaldı',
  other: 'Diğer',
  // Acente paneli
  battery_boost: 'Akü Takviyesi',
  fuel_delivery: 'Yakıt İkmali',
  minor_repair: 'Küçük Onarım',
  // Eski ve farklı yazımlar
  flat_tire: 'Lastik Patlaması',
  battery: 'Akü Bitti',
  dead_battery: 'Akü Bitti',
  jump_start: 'Akü Takviyesi',
  out_of_fuel: 'Yakıt Bitti',
  locked_out: 'Anahtar İçeride Kaldı',
  key_locked: 'Anahtar İçeride Kaldı',
  locksmith: 'Çilingir',
  engine: 'Motor Arızası',
  engine_failure: 'Motor Arızası',
  overheating: 'Motor Hararet Yaptı',
  brake: 'Fren Arızası',
  transmission: 'Şanzıman Arızası',
  electrical: 'Elektrik Arızası',
  starter: 'Marş Arızası',
  alternator: 'Şarj Dinamosu Arızası',
  cooling: 'Soğutma Sistemi Arızası',
  suspension: 'Süspansiyon Arızası',
  steering: 'Direksiyon Arızası',
  exhaust: 'Egzoz Arızası',
  clutch: 'Debriyaj Arızası',
  accident: 'Kaza',
  towing: 'Çekici Gerekli',
  winch: 'Vinçle Kurtarma',
};

export const roadProblemLabel = (value: unknown): string => lookup(ROAD_PROBLEM, value, UNSPECIFIED);

/** Yol yardım aracının verdiği hizmetler (available_services): kodlar aynı, hizmet diliyle */
const ROAD_SERVICE: LabelMap = {
  ...ROAD_PROBLEM,
  lockout: 'Kilitli Araç Açma',
  locked_out: 'Kilitli Araç Açma',
  key_locked: 'Kilitli Araç Açma',
  fuel: 'Yakıt İkmali',
  battery: 'Akü Takviyesi',
};

export const roadServiceLabel = (value: unknown): string => lookup(ROAD_SERVICE, value, UNSPECIFIED);

/** ['battery_boost', 'tire_change'] → "Akü Takviyesi, Lastik Değişimi" */
export const roadProblemListLabel = (values: unknown): string => {
  if (!Array.isArray(values) || values.length === 0) return UNSPECIFIED;
  return values.map(roadProblemLabel).join(', ');
};

// ---------------------------------------------------------------------------
// Nakliye
// ---------------------------------------------------------------------------

const HOME_TYPE: LabelMap = {
  studio: 'Stüdyo',
  '1+0': '1+0',
  '1+1': '1+1',
  '2+1': '2+1',
  '3+1': '3+1',
  '4+1': '4+1',
  '5+1': '5+1 ve üzeri',
  villa: 'Villa',
  office: 'Ofis',
  apartment: 'Daire',
  house: 'Müstakil Ev',
  other: 'Diğer',
};

export const homeTypeLabel = (value: unknown): string => lookup(HOME_TYPE, value, UNSPECIFIED);

// Randevulu vinç de aynı aralıkları kullanır (backend services/scheduling.TIME_SLOTS)
const TIME_SLOT: LabelMap = {
  morning: 'Sabah (08:00–12:00)',
  afternoon: 'Öğleden Sonra (12:00–17:00)',
  evening: 'Akşam (17:00–21:00)',
  flexible: 'Esnek',
  anytime: 'Gün İçinde Esnek',
};

export const timeSlotLabel = (value: unknown): string => lookup(TIME_SLOT, value, UNSPECIFIED);

// ---------------------------------------------------------------------------
// Transfer
// ---------------------------------------------------------------------------

const TRANSFER_TYPE: LabelMap = {
  organization: 'Organizasyon Transferi',
  vip: 'VIP Transfer',
};

export const transferTypeLabel = (value: unknown): string => lookup(TRANSFER_TYPE, value, 'Transfer');

// Müşterinin araç tercihi (vehicle_preference) ve sürücünün araç sınıfı (vehicle_class)
const TRANSFER_VEHICLE: LabelMap = {
  sedan: 'Sedan',
  vip_car: 'VIP Araç',
  minibus: 'Minibüs',
  midibus: 'Midibüs',
  bus: 'Otobüs',
};

export const transferVehicleLabel = (value: unknown): string => lookup(TRANSFER_VEHICLE, value, UNSPECIFIED);

// ---------------------------------------------------------------------------
// Hizmet tipi ve talep durumu
// ---------------------------------------------------------------------------

// Backend uçlara göre model kodu (towTruck), wire kodu (tow) ya da kanal adı gönderir
const SERVICE_TYPE: LabelMap = {
  towtruck: 'Çekici',
  tow: 'Çekici',
  tow_truck: 'Çekici',
  crane: 'Vinç',
  vinc: 'Vinç',
  roadassistance: 'Yol Yardım',
  road_assistance: 'Yol Yardım',
  hometohomemoving: 'Evden Eve Nakliye',
  home_moving: 'Evden Eve Nakliye',
  homemoving: 'Evden Eve Nakliye',
  citytocity: 'Şehirler Arası Nakliye',
  city_moving: 'Şehirler Arası Nakliye',
  citymoving: 'Şehirler Arası Nakliye',
  transfer: 'Transfer',
};

export const serviceTypeLabel = (value: unknown): string => lookup(SERVICE_TYPE, value, 'Hizmet');

const REQUEST_STATUS: LabelMap = {
  pending_location: 'Konum Bekleniyor',
  pending: 'Bekliyor',
  accepted: 'Kabul Edildi',
  awaiting_approval: 'Onay Bekleniyor',
  awaiting_payment: 'Ödeme Bekleniyor',
  in_progress: 'Devam Ediyor',
  completed: 'Tamamlandı',
  cancelled: 'İptal Edildi',
  canceled: 'İptal Edildi',
};

export const requestStatusLabel = (value: unknown): string => lookup(REQUEST_STATUS, value, UNSPECIFIED);

// ---------------------------------------------------------------------------
// Tarih
// ---------------------------------------------------------------------------

/** "2026-10-20" (ya da ISO tarih-saat) → "20 Ekim 2026"; okunamazsa olduğu gibi */
export const dateLabel = (value: unknown): string => {
  if (typeof value !== 'string' || !value.trim()) return UNSPECIFIED;
  const m = value.trim().match(/^(\d{4})-(\d{2})-(\d{2})/);
  // Yalnız tarihte yerel gün kullanılır (UTC gece yarısı kayması olmasın)
  const date = m && value.trim().length === 10
    ? new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]))
    : new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString('tr-TR', { day: 'numeric', month: 'long', year: 'numeric' });
};

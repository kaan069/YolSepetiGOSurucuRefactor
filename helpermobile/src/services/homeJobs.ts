/**
 * Ana ekrandaki iş kısayolu için sürücünün işleri (bütün hizmetler): gelen yeni talepler
 * (Gelen İşler, yalnızca sürücünün hizmetleri), teklifi müşteri onayı bekleyen, ödeme bekleyen,
 * devam eden ve yola çıkılmamış randevulu işler.
 *
 * Önce tek çağrıyla sayılar alınır (/requests/all-counts/, useJobCountsStore'a da yazılır);
 * yalnızca işi olan hizmetin listesi çekilir. Kimlikler ve detay yönlendirmesi Siparişler / Randevulu İşlerim ile aynıdır.
 */
import { requestsAPI } from '../api';
import type { ScheduledJob, ScheduledJobServiceType } from '../api/types';
import type { ServiceGroup } from '../constants/serviceTypes';
import { getScheduleInfo, ScheduleInfo } from '../utils/schedule';
import { scheduledJobRequestId } from '../screens/orders/jobMappers';
import { useJobCountsStore } from '../store/useJobCountsStore';
import { agencyPaidLabelOf } from '../utils/agencyPaid';

export type HomeJobService = Exclude<ServiceGroup, 'nakliye'>;
/** Hangi listeden geldiği */
export type HomeJobKind = 'pending' | 'awaiting_approval' | 'awaiting_payment' | 'in_progress' | 'scheduled';
/** Talebin gerçek durumu (randevulu liste ödeme bekleyen ve devam eden işleri birlikte döner) */
export type HomeJobStatus = 'pending' | 'awaiting_approval' | 'awaiting_payment' | 'in_progress';
type ListKind = Exclude<HomeJobKind, 'scheduled'>;

export interface HomeJobPlace {
  lat: number;
  lng: number;
  address: string | null;
}

export interface HomeJob {
  /** Listede tekil: hizmet + talep kimliği */
  key: string;
  service: HomeJobService;
  /** Detay ekranının açıldığı kimlik */
  jobId: string;
  kind: HomeJobKind;
  status: HomeJobStatus;
  /** Sürücünün teklifindeki kazancı (my_offer.driver_earnings); yoksa null */
  earnings: number | null;
  /** Acente ödemeli işte "Acente öder · 1.850 TL"; müşteri ödemeli işte null */
  agencyPaidLabel: string | null;
  customerName: string | null;
  /** Backend yalnızca iş devam ederken / tamamlanınca gönderir; gizliyken null */
  customerPhone: string | null;
  /** Gizliyken gösterim için '+905*****' */
  customerPhoneMasked: string | null;
  /**
   * Ad, telefon, açık adres ve tam konum açık mı (iş devam ediyor). Ödeme bekleyen işte
   * backend adresi "İlçe, İl"e, koordinatı ~100 m'ye yuvarlar: konum butonları gösterilmez.
   */
  contactsVisible: boolean;
  pickup: HomeJobPlace | null;
  /** Tek konumlu hizmetlerde (vinç, yol yardım) null */
  dropoff: HomeJobPlace | null;
  schedule: ScheduleInfo;
  createdAt: number;
}

type ListFetcher = () => Promise<any[]>;

// pending: Gelen İşler'deki uçlar (Siparişler / useOrdersData ile aynı)
const SERVICES: Record<HomeJobService, { countsKey: string } & Record<ListKind, ListFetcher>> = {
  towTruck: {
    countsKey: 'tow-truck',
    pending: requestsAPI.getAvailableTowTruckRequests,
    awaiting_approval: requestsAPI.getAwaitingApprovalTowTruckRequests,
    awaiting_payment: requestsAPI.getAwaitingPaymentTowTruckRequests,
    in_progress: requestsAPI.getInProgressTowTruckRequests,
  },
  crane: {
    countsKey: 'crane',
    pending: requestsAPI.getAvailableCraneRequests,
    awaiting_approval: requestsAPI.getAwaitingApprovalCraneRequests,
    awaiting_payment: requestsAPI.getAwaitingPaymentCraneRequests,
    in_progress: requestsAPI.getInProgressCraneRequests,
  },
  homeToHomeMoving: {
    countsKey: 'home-moving',
    pending: requestsAPI.getPendingHomeMovingRequests,
    awaiting_approval: requestsAPI.getAwaitingApprovalHomeMovingRequests,
    awaiting_payment: requestsAPI.getAwaitingPaymentHomeMovingRequests,
    in_progress: requestsAPI.getInProgressHomeMovingRequests,
  },
  cityToCity: {
    countsKey: 'city-moving',
    pending: requestsAPI.getPendingCityMovingRequests,
    awaiting_approval: requestsAPI.getAwaitingApprovalCityMovingRequests,
    awaiting_payment: requestsAPI.getAwaitingPaymentCityMovingRequests,
    in_progress: requestsAPI.getInProgressCityMovingRequests,
  },
  roadAssistance: {
    countsKey: 'road-assistance',
    pending: requestsAPI.getAvailableRoadAssistanceRequests,
    awaiting_approval: requestsAPI.getAwaitingApprovalRoadAssistanceRequests,
    awaiting_payment: requestsAPI.getAwaitingPaymentRoadAssistanceRequests,
    in_progress: requestsAPI.getInProgressRoadAssistanceRequests,
  },
  transfer: {
    countsKey: 'transfer',
    pending: requestsAPI.getAvailableTransferRequests,
    awaiting_approval: requestsAPI.getAwaitingApprovalTransferRequests,
    awaiting_payment: requestsAPI.getAwaitingPaymentTransferRequests,
    in_progress: requestsAPI.getInProgressTransferRequests,
  },
};

const LIST_KINDS: ListKind[] = ['pending', 'awaiting_approval', 'awaiting_payment', 'in_progress'];
/** Ana ekranda gösterilen en fazla yeni talep (en yeniler); tamamı Gelen İşler'de */
const MAX_PENDING = 5;

const SCHEDULED_SERVICE: Record<ScheduledJobServiceType, HomeJobService> = {
  tow: 'towTruck',
  crane: 'crane',
  home_moving: 'homeToHomeMoving',
  city_moving: 'cityToCity',
  transfer: 'transfer',
};

// Önce sürücünün yapacağı işler: devam eden, yeni talepler (teklif bekliyor), ödeme bekleyen,
// randevulu; müşteri kararı bekleyen teklifler en sonda
const KIND_ORDER: Record<HomeJobKind, number> = {
  in_progress: 0,
  pending: 1,
  awaiting_payment: 2,
  scheduled: 3,
  awaiting_approval: 4,
};

const text = (...values: unknown[]): string | null => {
  for (const value of values) {
    if (typeof value === 'string' && value.trim()) return value.trim();
  }
  return null;
};

function place(lat: unknown, lng: unknown, address: unknown): HomeJobPlace | null {
  const latitude = parseFloat(String(lat ?? ''));
  const longitude = parseFloat(String(lng ?? ''));
  if (!Number.isFinite(latitude) || !Number.isFinite(longitude) || (latitude === 0 && longitude === 0)) return null;
  return { lat: latitude, lng: longitude, address: text(address) };
}

const amount = (value: unknown): number | null => {
  const n = parseFloat(String(value ?? ''));
  return Number.isFinite(n) ? n : null;
};

/** Hizmete göre alış / bırakış konumu (alan adları Siparişler'deki dönüştürücülerle aynı) */
function places(service: HomeJobService, r: any): { pickup: HomeJobPlace | null; dropoff: HomeJobPlace | null } {
  switch (service) {
    case 'towTruck':
      return {
        pickup: place(r.pickup_latitude, r.pickup_longitude, r.pickup_address),
        dropoff: place(r.dropoff_latitude, r.dropoff_longitude, r.dropoff_address),
      };
    case 'crane':
      return { pickup: place(r.latitude, r.longitude, r.address), dropoff: null };
    case 'roadAssistance':
      return {
        pickup: place(r.latitude ?? r.location_latitude, r.longitude ?? r.location_longitude, r.address ?? r.location_address),
        dropoff: null,
      };
    case 'homeToHomeMoving':
    case 'cityToCity':
      return {
        pickup: place(r.from_latitude ?? r.pickup_latitude, r.from_longitude ?? r.pickup_longitude, r.from_address ?? r.pickup_address ?? r.from_city),
        dropoff: place(r.to_latitude ?? r.dropoff_latitude, r.to_longitude ?? r.dropoff_longitude, r.to_address ?? r.dropoff_address ?? r.to_city),
      };
    case 'transfer':
      return {
        pickup: place(r.pickup_latitude ?? r.latitude, r.pickup_longitude ?? r.longitude, r.pickup_address ?? r.address),
        dropoff: place(
          r.dropoff_latitude ?? r.destination_latitude,
          r.dropoff_longitude ?? r.destination_longitude,
          r.dropoff_address ?? r.destination_address,
        ),
      };
  }
}

function toHomeJob(service: HomeJobService, kind: HomeJobKind, raw: any, jobId: string): HomeJob {
  const owner = raw.request_id && typeof raw.request_id === 'object' ? raw.request_id : {};
  // Randevulu liste hem ödeme bekleyen hem devam eden işleri döner
  const status: HomeJobStatus =
    kind !== 'scheduled' ? kind : (raw.status ?? owner.status) === 'awaiting_payment' ? 'awaiting_payment' : 'in_progress';
  return {
    // Randevulu liste detay nesnesi döner; tekilleştirme talep kimliğiyle
    key: `${service}-${scheduledJobRequestId(raw)}`,
    service,
    jobId,
    kind,
    status,
    earnings: amount(raw.my_offer?.driver_earnings),
    agencyPaidLabel: agencyPaidLabelOf(raw.payer ? raw : owner),
    customerName: text(
      raw.requestOwnerNameSurname,
      raw.request_owner_name_surname,
      raw.request_owner_name,
      owner.requestOwnerNameSurname,
      owner.request_owner_name_surname,
    ),
    customerPhone: text(raw.requestOwnerPhone, raw.request_owner_phone, owner.request_owner_phone),
    customerPhoneMasked: text(raw.requestOwnerPhoneMasked, owner.requestOwnerPhoneMasked),
    contactsVisible: status === 'in_progress',
    ...places(service, raw),
    schedule: getScheduleInfo(raw),
    createdAt: new Date(raw.created_at).getTime() || 0,
  };
}

async function loadList(service: HomeJobService, kind: ListKind): Promise<HomeJob[]> {
  const list = (await SERVICES[service][kind]()) ?? [];
  return list.filter(Boolean).map((raw) => toHomeJob(service, kind, raw, String(raw.id)));
}

async function loadScheduled(): Promise<HomeJob[]> {
  const list: ScheduledJob[] = await requestsAPI.getScheduledJobs();
  return list
    .filter((raw) => SCHEDULED_SERVICE[raw.serviceType])
    .map((raw) => toHomeJob(SCHEDULED_SERVICE[raw.serviceType], 'scheduled', raw, scheduledJobRequestId(raw)));
}

function compareJobs(a: HomeJob, b: HomeJob): number {
  if (a.kind !== b.kind) return KIND_ORDER[a.kind] - KIND_ORDER[b.kind];
  if (a.kind === 'scheduled') {
    return (a.schedule.scheduledAt?.getTime() ?? Infinity) - (b.schedule.scheduledAt?.getTime() ?? Infinity);
  }
  return b.createdAt - a.createdAt;
}

/**
 * Sayılar alınamazsa hata fırlatır (çağıran eski listeyi korur). Tek bir liste
 * alınamazsa o liste atlanır, diğerleri gösterilir.
 *
 * @param offeredServices sürücünün hizmetleri (user.user_type). Yeni talepler yalnızca bunlar
 *   için çekilir: sayaçlar hizmete göre süzülmez, çekiciciye vinç talebi gösterilmesin.
 */
export async function fetchHomeJobs(offeredServices: string[]): Promise<HomeJob[]> {
  const counts = await requestsAPI.getAllServicesCounts();
  // Ana ekrandaki talep özeti ve İşler sekmesinin yanıp sönmesi aynı sayıları kullanır
  useJobCountsStore.getState().applyAllServicesCounts(counts ?? {});

  const tasks: Promise<HomeJob[]>[] = [];
  (Object.keys(SERVICES) as HomeJobService[]).forEach((service) => {
    const c = counts?.[SERVICES[service].countsKey];
    if (!c) return;
    LIST_KINDS.forEach((kind) => {
      if (c[kind] <= 0) return;
      if (kind === 'pending' && !offeredServices.includes(service)) return;
      tasks.push(loadList(service, kind));
    });
  });
  const scheduledTotal = Object.values(counts ?? {}).reduce((sum, c) => sum + (c?.scheduled ?? 0), 0);
  if (scheduledTotal > 0) tasks.push(loadScheduled());

  const results = await Promise.allSettled(tasks);
  const byKey = new Map<string, HomeJob>();
  results.forEach((result) => {
    if (result.status !== 'fulfilled') return;
    result.value.forEach((job) => {
      // Aynı iş iki listede gelirse randevulu hali (tarih bilgisiyle) kalır
      const existing = byKey.get(job.key);
      if (!existing || job.kind === 'scheduled') byKey.set(job.key, job);
    });
  });
  const sorted = Array.from(byKey.values()).sort(compareJobs);
  let pendingShown = 0;
  return sorted.filter((job) => job.kind !== 'pending' || ++pendingShown <= MAX_PENDING);
}

/**
 * Ana ekrandaki iş kısayolu için sürücünün üzerindeki işler:
 * devam eden, ödeme bekleyen ve yola çıkılmamış randevulu işler (bütün hizmetler).
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

export type HomeJobService = Exclude<ServiceGroup, 'nakliye'>;
export type HomeJobKind = 'in_progress' | 'awaiting_payment' | 'scheduled';

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

const SERVICES: Record<HomeJobService, { countsKey: string; inProgress: ListFetcher; awaitingPayment: ListFetcher }> = {
  towTruck: {
    countsKey: 'tow-truck',
    inProgress: requestsAPI.getInProgressTowTruckRequests,
    awaitingPayment: requestsAPI.getAwaitingPaymentTowTruckRequests,
  },
  crane: {
    countsKey: 'crane',
    inProgress: requestsAPI.getInProgressCraneRequests,
    awaitingPayment: requestsAPI.getAwaitingPaymentCraneRequests,
  },
  homeToHomeMoving: {
    countsKey: 'home-moving',
    inProgress: requestsAPI.getInProgressHomeMovingRequests,
    awaitingPayment: requestsAPI.getAwaitingPaymentHomeMovingRequests,
  },
  cityToCity: {
    countsKey: 'city-moving',
    inProgress: requestsAPI.getInProgressCityMovingRequests,
    awaitingPayment: requestsAPI.getAwaitingPaymentCityMovingRequests,
  },
  roadAssistance: {
    countsKey: 'road-assistance',
    inProgress: requestsAPI.getInProgressRoadAssistanceRequests,
    awaitingPayment: requestsAPI.getAwaitingPaymentRoadAssistanceRequests,
  },
  transfer: {
    countsKey: 'transfer',
    inProgress: requestsAPI.getInProgressTransferRequests,
    awaitingPayment: requestsAPI.getAwaitingPaymentTransferRequests,
  },
};

const SCHEDULED_SERVICE: Record<ScheduledJobServiceType, HomeJobService> = {
  crane: 'crane',
  home_moving: 'homeToHomeMoving',
  city_moving: 'cityToCity',
  transfer: 'transfer',
};

const KIND_ORDER: Record<HomeJobKind, number> = { in_progress: 0, awaiting_payment: 1, scheduled: 2 };

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
  const status = kind === 'scheduled' ? raw.status ?? owner.status : kind;
  return {
    // Randevulu liste detay nesnesi döner; tekilleştirme talep kimliğiyle
    key: `${service}-${scheduledJobRequestId(raw)}`,
    service,
    jobId,
    kind,
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

async function loadList(service: HomeJobService, kind: 'in_progress' | 'awaiting_payment'): Promise<HomeJob[]> {
  const fetcher = kind === 'in_progress' ? SERVICES[service].inProgress : SERVICES[service].awaitingPayment;
  const list = (await fetcher()) ?? [];
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
 */
export async function fetchHomeJobs(): Promise<HomeJob[]> {
  const counts = await requestsAPI.getAllServicesCounts();
  // Ana ekrandaki talep özeti ve İşler sekmesinin yanıp sönmesi aynı sayıları kullanır
  useJobCountsStore.getState().applyAllServicesCounts(counts ?? {});

  const tasks: Promise<HomeJob[]>[] = [];
  (Object.keys(SERVICES) as HomeJobService[]).forEach((service) => {
    const c = counts?.[SERVICES[service].countsKey];
    if (!c) return;
    if (c.in_progress > 0) tasks.push(loadList(service, 'in_progress'));
    if (c.awaiting_payment > 0) tasks.push(loadList(service, 'awaiting_payment'));
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
  return Array.from(byKey.values()).sort(compareJobs);
}

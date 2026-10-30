/**
 * Backend iş nesnesi → OrderCard'ın kullandığı OrdersJob.
 * İşler listesi (useOrdersData) ve Randevulu İşlerim aynı dönüşümü kullanır.
 */
import type { CraneRequest, MovingRequest, ScheduledJob, TowTruckRequestDetail, TransferRequest } from '../../api/types';
import { OrderStatus } from '../../lib/types';
import { getScheduleInfo } from '../../utils/schedule';
import { OrdersJob } from './types';
import { dateLabel, transferTypeLabel, transferVehicleLabel, vehicleTypeLabel } from '../../constants/backendLabels';
import { agencyPaidLabelOf } from '../../utils/agencyPaid';

export function towTruckRequestToJob(request: TowTruckRequestDetail, status: OrderStatus): OrdersJob {
  const price = request.final_price || 0;

  return {
    id: request.id.toString(),
    serviceType: 'towTruck',
    vehicleType: `Çekici - ${vehicleTypeLabel(request.vehicle_type)}`,
    from: {
      lat: parseFloat(request.pickup_latitude || '0'),
      lng: parseFloat(request.pickup_longitude || '0'),
      address: request.pickup_address || 'Alınacak konum',
    },
    to: {
      lat: parseFloat(request.dropoff_latitude || '0'),
      lng: parseFloat(request.dropoff_longitude || '0'),
      address: request.dropoff_address || 'Bırakılacak konum',
    },
    distance: request.estimated_km || 0,
    estimatedPrice: price,
    agencyPaidLabel: agencyPaidLabelOf(request),
    status,
    createdAt: new Date(request.created_at),
    description: `Mesafe: ${request.route_distance} | Süre: ${request.route_duration}`,
    schedule: getScheduleInfo(request),
  };
}

export function craneRequestToJob(request: CraneRequest, status: OrderStatus): OrdersJob {
  const price = request.final_price || 0;

  return {
    id: request.id.toString(),
    serviceType: 'crane',
    vehicleType: `Vinç - ${request.load_type || '?'}`,
    from: {
      lat: parseFloat(request.latitude || '0'),
      lng: parseFloat(request.longitude || '0'),
      address: request.address || 'Adres belirtilmemiş',
    },
    to: {
      lat: parseFloat(request.latitude || '0'),
      lng: parseFloat(request.longitude || '0'),
      address: request.address || 'Adres belirtilmemiş',
    },
    distance: 0,
    estimatedPrice: price,
    agencyPaidLabel: agencyPaidLabelOf(request),
    status,
    createdAt: new Date(request.created_at),
    description: `Yük: ${request.load_weight || '?'} kg | Yükseklik: ${request.lift_height || '?'}m | Kat: ${request.floor || '?'}${request.has_obstacles ? ' | Engel var' : ''}`,
    schedule: getScheduleInfo(request),
  };
}

// Evden eve + şehirler arası birleşik; request.movingType listeyi çeken taraf ekler
export function nakliyeRequestToJob(request: MovingRequest, status: OrderStatus): OrdersJob {
  const price = request.final_price || request.estimated_price || 0;
  const fromLat = parseFloat(request.from_latitude || request.pickup_latitude || '0');
  const fromLng = parseFloat(request.from_longitude || request.pickup_longitude || '0');
  const toLat = parseFloat(request.to_latitude || request.dropoff_latitude || '0');
  const toLng = parseFloat(request.to_longitude || request.dropoff_longitude || '0');

  // İş tipine göre label belirle
  const isHomeMoving = request.movingType === 'homeMoving';
  const typeLabel = isHomeMoving ? 'Evden Eve Nakliye' : 'Şehirler Arası Nakliye';

  // Description oluştur
  let description = '';
  if (isHomeMoving) {
    description = `${request.floor_from ? `Kat: ${request.floor_from}` : ''} ${request.has_elevator ? '| Asansör var' : ''} ${request.room_count ? `| ${request.room_count} oda` : ''}`.trim() || 'Evden eve nakliye talebi';
  } else {
    description = `${request.from_city || ''} → ${request.to_city || ''} ${request.load_weight ? `| ${request.load_weight} kg` : ''}`.trim() || 'Şehirler arası nakliye talebi';
  }

  return {
    id: request.id.toString(),
    // UI-level `ServiceGroup` — birleşik "Nakliye" kartı; atomik ayrım
    // `movingType` üzerinden yapılır (navigation + setActiveJob).
    serviceType: 'nakliye',
    vehicleType: typeLabel,
    movingType: request.movingType as OrdersJob['movingType'], // homeMoving veya cityMoving - teklif ekranına yönlendirme için
    from: {
      lat: fromLat,
      lng: fromLng,
      address: request.from_address || request.pickup_address || request.from_city || 'Alınacak adres',
    },
    to: {
      lat: toLat,
      lng: toLng,
      address: request.to_address || request.dropoff_address || request.to_city || 'Bırakılacak adres',
    },
    distance: request.estimated_km || request.distance_km || 0,
    estimatedPrice: typeof price === 'string' ? parseFloat(price) : price,
    agencyPaidLabel: agencyPaidLabelOf(request),
    status,
    createdAt: new Date(request.created_at),
    description,
    trackingToken: request.trackingToken || request.tracking_token,
    preferredDate: request.preferred_date, // Nakliye için tercih edilen tarih
    schedule: getScheduleInfo(request),
  };
}

export function transferRequestToJob(request: TransferRequest, status: OrderStatus): OrdersJob {
  const price = request.final_price || request.estimated_price || 0;
  const lat = parseFloat(request.pickup_latitude || request.latitude || '0');
  const lng = parseFloat(request.pickup_longitude || request.longitude || '0');

  // Transfer tipi, araç tercihi, yolcu ve tarih bilgisi (kodlar backendLabels ile Türkçeleşir)
  const typeLabel = transferTypeLabel(request.transfer_type);
  const vehicleInfo = request.vehicle_preference ? transferVehicleLabel(request.vehicle_preference) : '';
  const passengerInfo = request.passenger_count ? `${request.passenger_count} yolcu` : '';
  const scheduleInfo = request.scheduled_date
    ? `${dateLabel(request.scheduled_date)}${request.scheduled_time ? ' ' + String(request.scheduled_time).slice(0, 5) : ''}`
    : '';

  const descriptionParts = [vehicleInfo, passengerInfo, scheduleInfo].filter(Boolean);
  const description = descriptionParts.join(' | ') || 'Transfer talebi';

  return {
    id: request.id.toString(),
    serviceType: 'transfer',
    vehicleType: typeLabel,
    from: {
      lat,
      lng,
      address: request.pickup_address || request.address || 'Alınacak konum',
    },
    to: {
      lat: parseFloat(request.dropoff_latitude || request.destination_latitude || '0'),
      lng: parseFloat(request.dropoff_longitude || request.destination_longitude || '0'),
      address: request.dropoff_address || request.destination_address || 'Bırakılacak konum',
    },
    distance: request.estimated_km || request.distance_km || 0,
    estimatedPrice: typeof price === 'string' ? parseFloat(price) : price,
    agencyPaidLabel: agencyPaidLabelOf(request),
    status,
    createdAt: new Date(request.created_at),
    description,
    trackingToken: request.trackingToken || request.tracking_token,
    schedule: getScheduleInfo(request),
  };
}

// ==================== Randevulu İşlerim ====================

/** Detay ekranları talep (VehicleRequest) kimliğiyle açılır; detay nesnesinin kendi id'si değil. */
export function scheduledJobRequestId(job: ScheduledJob): string {
  const rid = job.request_id;
  if (rid && typeof rid === 'object' && rid.id != null) return String(rid.id);
  if (typeof rid === 'number' || typeof rid === 'string') return String(rid);
  return String(job.id);
}

/** Liste sadece kabul edilmiş işleri döner: ödeme bekleyen ya da devam eden */
function scheduledJobStatus(job: ScheduledJob): OrderStatus {
  const status = job.status ?? job.request_id?.status;
  return status === 'awaiting_payment' ? 'awaiting_payment' : 'in_progress';
}

/** GET /requests/scheduled/my-jobs/ öğesi → kart; bilinmeyen hizmette null */
export function scheduledJobToJob(source: ScheduledJob): OrdersJob | null {
  const status = scheduledJobStatus(source);
  let job: OrdersJob;
  switch (source.serviceType) {
    case 'tow':
      job = towTruckRequestToJob(source as unknown as TowTruckRequestDetail, status);
      break;
    case 'crane':
      job = craneRequestToJob(source as unknown as CraneRequest, status);
      break;
    case 'home_moving':
      job = nakliyeRequestToJob({ ...source, movingType: 'homeMoving' } as unknown as MovingRequest, status);
      break;
    case 'city_moving':
      job = nakliyeRequestToJob({ ...source, movingType: 'cityMoving' } as unknown as MovingRequest, status);
      break;
    case 'transfer':
      job = transferRequestToJob(source as unknown as TransferRequest, status);
      break;
    default:
      return null;
  }
  return { ...job, id: scheduledJobRequestId(source) };
}

/**
 * Randevulu talep (vinç, evden eve, şehirden şehire, transfer).
 *
 * Backend iş listelerinde/detaylarında camelCase (bookingType, scheduledAt, scheduledTimeSlot,
 * departedAt), WebSocket new_job yayınında snake_case gönderir; ikisi de okunur.
 * scheduledAt saat aralığında aralığın başlangıcıdır (sabah → 08:00).
 */

export type BookingType = 'instant' | 'scheduled';
export type TimeSlot = 'morning' | 'afternoon' | 'evening';

export interface ScheduleInfo {
  isScheduled: boolean;
  /** Randevu başlangıcı (aralıkta aralığın başı, transferde kesin saat) */
  scheduledAt: Date | null;
  timeSlot: TimeSlot | null;
  /** Sürücü yola çıktı mı (depart çağrıldı) */
  departedAt: Date | null;
}

const SLOTS: Record<TimeSlot, { label: string; range: string; endHour: number }> = {
  morning: { label: 'Sabah', range: '08:00–12:00', endHour: 12 },
  afternoon: { label: 'Öğleden sonra', range: '12:00–17:00', endHour: 17 },
  evening: { label: 'Akşam', range: '17:00–21:00', endHour: 21 },
};

function parseDate(value: unknown): Date | null {
  if (typeof value !== 'string' || !value) return null;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function isTimeSlot(value: unknown): value is TimeSlot {
  return value === 'morning' || value === 'afternoon' || value === 'evening';
}

/** İş nesnesinden randevu bilgisi (alan yoksa anlık iş sayılır). */
export function getScheduleInfo(source: unknown): ScheduleInfo {
  const o = (source ?? {}) as Record<string, unknown>;
  const bookingType = o.bookingType ?? o.booking_type;
  const scheduledAt = parseDate(o.scheduledAt ?? o.scheduled_at);
  const timeSlot = o.scheduledTimeSlot ?? o.scheduled_time_slot;
  return {
    isScheduled: bookingType === 'scheduled',
    scheduledAt,
    timeSlot: isTimeSlot(timeSlot) ? timeSlot : null,
    departedAt: parseDate(o.departedAt ?? o.departed_at),
  };
}

/** Randevunun bittiği an: aralıkta aralığın sonu, transferde kesin saat. */
function scheduleEnd(info: ScheduleInfo): Date | null {
  if (!info.scheduledAt) return null;
  if (!info.timeSlot) return info.scheduledAt;
  const end = new Date(info.scheduledAt);
  end.setHours(SLOTS[info.timeSlot].endHour, 0, 0, 0);
  return end;
}

/** "Sabah 08:00–12:00" ya da transferde "14:30" */
export function formatScheduleTime(info: ScheduleInfo): string {
  if (info.timeSlot) return `${SLOTS[info.timeSlot].label} ${SLOTS[info.timeSlot].range}`;
  if (!info.scheduledAt) return '';
  return info.scheduledAt.toLocaleTimeString('tr-TR', { hour: '2-digit', minute: '2-digit' });
}

/** "20 Eki Pzt" */
export function formatScheduleDate(info: ScheduleInfo, long = false): string {
  if (!info.scheduledAt) return '';
  return info.scheduledAt.toLocaleDateString(
    'tr-TR',
    long
      ? { day: 'numeric', month: 'long', weekday: 'long' }
      : { day: 'numeric', month: 'short', weekday: 'short' },
  );
}

/** "20 Eki Pzt · Sabah 08:00–12:00" */
export function formatSchedule(info: ScheduleInfo, long = false): string {
  return [formatScheduleDate(info, long), formatScheduleTime(info)].filter(Boolean).join(' · ');
}

export type ScheduleState = 'departed' | 'late' | 'now' | 'today' | 'tomorrow' | 'upcoming';

/**
 * Randevunun şimdiye göre durumu.
 * late: aralık (transferde saat) geçti ama yola çıkılmadı; departed: yola çıkıldı.
 */
export function getScheduleState(info: ScheduleInfo, now = new Date()): { state: ScheduleState; label: string } | null {
  if (!info.isScheduled || !info.scheduledAt) return null;
  if (info.departedAt) return { state: 'departed', label: 'Yola çıkıldı' };
  const end = scheduleEnd(info) ?? info.scheduledAt;
  if (end.getTime() < now.getTime()) return { state: 'late', label: 'Gecikti' };
  if (info.scheduledAt.getTime() <= now.getTime() && now.getTime() <= end.getTime()) {
    return { state: 'now', label: 'Randevu saatinde' };
  }

  const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime();
  const days = Math.round((startOfDay(info.scheduledAt) - startOfDay(now)) / (24 * 60 * 60 * 1000));
  if (days <= 0) return { state: 'today', label: 'Bugün' };
  if (days === 1) return { state: 'tomorrow', label: 'Yarın' };
  return { state: 'upcoming', label: `${days} gün sonra` };
}

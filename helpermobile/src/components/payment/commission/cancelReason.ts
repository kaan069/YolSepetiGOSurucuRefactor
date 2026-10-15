/**
 * Komisyon ödemesi sırasında talep iptali / işin sürücüden alınması.
 *
 * Backend her kanalda aynı sebep kodlarını kullanır (bkz. CommissionCancelCode).
 * "Müşteri talebi iptal etti" yalnızca REQUEST_CANCELLED için gösterilir;
 * diğer kodlarda backend'in gönderdiği mesaj olduğu gibi gösterilir.
 */
import type { CommissionCancelCode } from '../../../api/payment';
import type { DetailCancelInfo } from '../../../api/types';

export interface CommissionCancel {
  code: CommissionCancelCode;
  message: string;
}

const CANCEL_TEXTS: Record<CommissionCancelCode, { title: string; message: string }> = {
  REQUEST_CANCELLED: {
    title: 'Talep İptal Edildi',
    message: 'Müşteri talebi iptal etti. Bu iş için ödeme alınmadı.',
  },
  REQUEST_CLOSED: {
    title: 'Talep İptal Edildi',
    message: 'Talep iptal edildi, ödeme alınmadı.',
  },
  JOB_REASSIGNED: {
    title: 'İş Size Atanmış Değil',
    message: 'Bu iş artık size atanmış değil, ödeme alınmadı.',
  },
  ALREADY_ACTIVE: {
    title: 'Ödeme Zaten İşlenmiş',
    message: 'Bu iş için ödeme zaten işlenmiş, yeni ödeme alınmadı.',
  },
  PAYMENT_NOT_ACTIVE: {
    title: 'Ödeme Geçersiz',
    message: 'Bu ödeme işlemi artık geçerli değil, ödeme alınmadı. Lütfen tekrar deneyin.',
  },
};

export function isCommissionCancelCode(value: unknown): value is CommissionCancelCode {
  return typeof value === 'string' && value in CANCEL_TEXTS;
}

/** Bilinen bir sebep kodu ise iptal bilgisini döner, değilse null. */
export function toCommissionCancel(code: unknown, message?: string | null): CommissionCancel | null {
  if (!isCommissionCancelCode(code)) return null;
  return { code, message: message || CANCEL_TEXTS[code].message };
}

export function getCancelAlertTitle(code: CommissionCancelCode): string {
  return CANCEL_TEXTS[code].title;
}

/** REQUEST_CANCELLED için sabit popup metni, diğer kodlarda backend mesajı. */
export function getCancelAlertMessage(cancel: CommissionCancel): string {
  return cancel.code === 'REQUEST_CANCELLED' ? CANCEL_TEXTS.REQUEST_CANCELLED.message : cancel.message;
}

/**
 * WebSocket job_cancelled / FCM request_cancelled sebebi -> sebep kodu.
 * - customer_cancelled -> müşteri iptali
 * - reassigned         -> iş yönetici tarafından bu sürücüden geri alındı
 * - diğerleri (admin_cancelled, agency_cancelled, driver_cancelled, payment_timeout,
 *   expired, sebep gelmeyen eski payload) -> genel "Talep iptal edildi"
 *   (acente iptali de müşteri iptali sayılmaz; FCM'de cancelled_by: 'agency')
 */
export function cancelFromEventReason(reason?: string | null): CommissionCancel {
  const code: CommissionCancelCode =
    reason === 'customer_cancelled' ? 'REQUEST_CANCELLED'
    : reason === 'reassigned' ? 'JOB_REASSIGNED'
    : 'REQUEST_CLOSED';
  return { code, message: CANCEL_TEXTS[code].message };
}

/**
 * Tekil iş detayı yanıtındaki cancelReason / cancelMessage alanlarından iptal bilgisi.
 * Alan yoksa (eski backend) ve iş iptal edilmişse yönetici/sistem iptali sayılır.
 */
export function cancelFromDetail(
  detail: DetailCancelInfo | null | undefined,
  status?: string | null,
): CommissionCancel | null {
  const fromDetail = toCommissionCancel(detail?.cancelReason, detail?.cancelMessage);
  if (fromDetail) return fromDetail;
  return status === 'cancelled' ? toCommissionCancel('REQUEST_CLOSED') : null;
}

/** URL query parametresini okur (backend urlencode boşlukları '+' ile kodlar). */
export function getUrlParam(url: string, name: string): string | null {
  const match = url.match(new RegExp(`[?&]${name}=([^&#]*)`));
  if (!match) return null;
  try {
    return decodeURIComponent(match[1].replace(/\+/g, ' '));
  } catch {
    return match[1];
  }
}

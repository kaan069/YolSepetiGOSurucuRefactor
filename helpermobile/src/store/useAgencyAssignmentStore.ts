/**
 * Agency Assignment Store
 * Acentenin sürücüye doğrudan atadığı işleri (push / açılış senkronu) teklif
 * ekranlarına ve global atama kartına ileten köprü store.
 * useCancellationEventStore kalıbıyla: bildirim katmanı yazar, ekranlar dinler.
 */
import { create } from 'zustand';
import agencyAssignmentsAPI, { DriverAgencyAssignment } from '../api/agencyAssignments';
import { logger } from '../utils/logger';

export interface AgencyAssignmentInfo {
  assignmentId: number;
  agencyName: string;
  /** ISO UTC; toplu davette null (süresiz) */
  expiresAt: string | null;
  /** Bildirimdeki service_type (navigateByRequestStatus için) */
  serviceType?: string;
  /** single: tekil atama, broadcast: toplu davet (ilk kabul eden alır) */
  mode?: 'single' | 'broadcast';
  /** Ödeyen taraf: customer dışındaysa acente ödemeli iş */
  payer?: string | null;
  /** Acentenin sabit ücreti (metin, örn. "1850.00") */
  agreedPrice?: string | null;
}

export type AgencyAssignmentClosedType = 'expired' | 'cancelled';

interface AgencyAssignmentState {
  // request_id -> atama
  active: Record<number, AgencyAssignmentInfo>;
  // Ekranın kapanması için son kapanan atama
  lastClosed: { requestId: number; type: AgencyAssignmentClosedType; reason?: string; at: number } | null;
  // Şu an teklif ekranı açık olan talep (global atama kartı bu talep için gösterilmez)
  viewingRequestId: number | null;
  setAssignment: (requestId: number, a: AgencyAssignmentInfo) => void;
  clearAssignment: (requestId: number) => void;
  /** Backend listesiyle eşitle (liste sadece süresi dolmamış atamaları döner) */
  replaceAll: (list: DriverAgencyAssignment[]) => void;
  setClosed: (requestId: number, type: AgencyAssignmentClosedType, reason?: string) => void;
  setViewing: (requestId: number | null) => void;
  reset: () => void;
}

export const useAgencyAssignmentStore = create<AgencyAssignmentState>((set) => ({
  active: {},
  lastClosed: null,
  viewingRequestId: null,
  setAssignment: (requestId, a) => set((s) => ({ active: { ...s.active, [requestId]: a } })),
  clearAssignment: (requestId) =>
    set((s) => {
      if (!(requestId in s.active)) return s;
      const { [requestId]: _removed, ...rest } = s.active;
      return { active: rest };
    }),
  replaceAll: (list) =>
    set({
      active: Object.fromEntries(
        list.map((a) => [
          a.request_id,
          {
            assignmentId: a.id,
            agencyName: a.agency_name,
            expiresAt: a.expires_at,
            serviceType: a.service_type,
            mode: a.mode,
            payer: a.payer,
            agreedPrice: a.agreed_price,
          },
        ]),
      ),
    }),
  setClosed: (requestId, type, reason) => set({ lastClosed: { requestId, type, reason, at: Date.now() } }),
  setViewing: (requestId) => set({ viewingRequestId: requestId }),
  reset: () => set({ active: {}, lastClosed: null, viewingRequestId: null }),
}));

// ---------------------------------------------------------------------------
// Yardımcılar
// ---------------------------------------------------------------------------

export const AGENCY_ASSIGNMENT_TYPES = [
  'agency_assignment',
  'agency_assignment_expired',
  'agency_assignment_cancelled',
] as const;

/** Atamanın kapandığını bildiren push türü mü? (dokununca Siparişler sekmesine gidilir) */
export function isAgencyAssignmentClosedType(type: unknown): boolean {
  return type === 'agency_assignment_expired' || type === 'agency_assignment_cancelled';
}

let syncInFlight: Promise<void> | null = null;

/** Bekleyen atamaları backend'den çekip store'a yazar. Eşzamanlı çağrılar tek isteğe düşer. */
export function syncAgencyAssignments(): Promise<void> {
  if (syncInFlight) return syncInFlight;
  syncInFlight = agencyAssignmentsAPI
    .list()
    .then((list) => useAgencyAssignmentStore.getState().replaceAll(list))
    .catch((error: any) => {
      // 401 (çıkış) / ağ hatası: mevcut durumu koru, bir sonraki senkronu bekle
      logger.debug('orders', 'agencyAssignments.sync failed', { status: error?.response?.status });
    })
    .finally(() => {
      syncInFlight = null;
    });
  return syncInFlight;
}

/**
 * Push verisini store'a uygular (ön plan onMessage ve bildirime dokunma).
 * data alanlarının hepsi string gelir.
 */
export function applyAgencyAssignmentNotification(data: Record<string, unknown> | undefined): void {
  if (!data) return;
  const type = data.type;
  const requestId = Number(data.request_id);
  if (!requestId) return;
  const store = useAgencyAssignmentStore.getState();

  if (type === 'agency_assignment') {
    const assignmentId = Number(data.assignment_id);
    if (!assignmentId) return;
    // Toplu davette expires_at gelmez (süresiz)
    const expiresAt = typeof data.expires_at === 'string' && data.expires_at ? data.expires_at : null;
    store.setAssignment(requestId, {
      assignmentId,
      agencyName: typeof data.agency_name === 'string' && data.agency_name ? data.agency_name : 'Acente',
      expiresAt,
      serviceType: typeof data.service_type === 'string' ? data.service_type : undefined,
      mode: data.assignment_mode === 'broadcast' ? 'broadcast' : 'single',
      payer: typeof data.payer === 'string' ? data.payer : null,
      agreedPrice: typeof data.agreed_price === 'string' ? data.agreed_price : null,
    });
    return;
  }

  if (isAgencyAssignmentClosedType(type)) {
    store.clearAssignment(requestId);
    store.setClosed(
      requestId,
      type === 'agency_assignment_expired' ? 'expired' : 'cancelled',
      typeof data.reason === 'string' ? data.reason : undefined,
    );
  }
}

/** Kapanan atama için kullanıcıya gösterilecek başlık ve metin. */
export function getAgencyClosedText(
  type: AgencyAssignmentClosedType,
  reason?: string,
): { title: string; message: string } {
  if (type === 'expired' || reason === 'timeout') {
    return { title: 'Atamanın Süresi Doldu', message: 'Yanıt süresi dolduğu için bu iş artık size atanmış değil.' };
  }
  switch (reason) {
    case 'reassigned':
      return { title: 'Atama Geri Alındı', message: 'Acente bu işi başka bir sürücüye atadı.' };
    case 'other_selected':
      return { title: 'İş Başka Sürücüye Verildi', message: 'Bu iş başka bir sürücüye verildi.' };
    case 'agency_cancelled':
      return { title: 'Atama Geri Alındı', message: 'Acente bu atamayı iptal etti.' };
    case 'driver_removed':
      return { title: 'Atama Geri Alındı', message: 'Acente sizi sürücü listesinden çıkardı.' };
    case 'request_cancelled':
      return { title: 'Talep İptal Edildi', message: 'Bu talep iptal edildi.' };
    case 'admin_reverted':
      return { title: 'Atama Geri Alındı', message: 'Yönetici talebin durumunu geri aldı.' };
    default:
      return { title: 'Atama Geri Alındı', message: 'Bu iş artık size atanmış değil.' };
  }
}

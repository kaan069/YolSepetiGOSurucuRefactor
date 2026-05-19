/**
 * Notification Navigation Helper
 * Bildirim tıklamalarında doğru ekrana yönlendirme mantığı
 *
 * Tüm servis tiplerini destekler:
 * - Tow Truck (Çekici)
 * - Crane (Vinç)
 * - Home Moving (Evden Eve Nakliye)
 * - City Moving (Şehirler Arası Nakliye)
 * - Road Assistance (Yol Yardım)
 * - Transfer
 *
 * Bu dosya notification zincirindeki tüm FCM `service_type` alias çözümlerini
 * merkezi olarak tutar. Backend çeşitli alias'lar gönderebilir
 * (`vinc_request`, `evden_eve`, `yol_yardim` vb.) — inline çift-literal
 * kontroller yerine `resolveOfferServiceKey()` / `resolveServiceType()`
 * helper'ları kullanılır.
 */

import { Alert } from 'react-native';
import { logger } from './logger';

// ---------------------------------------------------------------------------
// Stale notification kontrolü
// ---------------------------------------------------------------------------

/**
 * Bildirimin "eski" sayılma eşiği — bu kadar saatten daha önce gönderilmiş
 * bildirimler stale kabul edilir. iOS notification center'da uzun süre
 * bekleyen bildirimlere tıklandığında ilgili request'in çoktan başka sürücüye
 * atanmış olması yaygın bir senaryodur; OfferScreen'e yönlenip 404 görmek
 * yerine kullanıcı doğrudan OrdersTab'a alınır.
 */
const STALE_NOTIFICATION_HOURS = 24;
const STALE_NOTIFICATION_MS = STALE_NOTIFICATION_HOURS * 60 * 60 * 1000;

/**
 * Bildirim gönderim zamanını belirlemek için sırayla kontrol edilir:
 *  1. Firebase RemoteMessage.sentTime (ms epoch) — onMessage / opened / killed state
 *  2. Expo Notification.date (sec epoch) — foreground banner
 *  3. data.created_at / data.createdAt / data.sent_at — backend payload alanları
 *  Hiçbiri yoksa: `null` döner → caller stale değil sayar (false negative emniyetli).
 */
function extractNotificationSentMs(source: any): number | null {
    if (!source) return null;

    // Firebase RemoteMessage
    if (typeof source.sentTime === 'number' && source.sentTime > 0) {
        return source.sentTime;
    }

    // Expo Notifications — Notification.date saniyedir
    if (typeof source.date === 'number' && source.date > 0) {
        return source.date > 1e12 ? source.date : source.date * 1000;
    }

    // Backend data alanı (string ISO veya number epoch)
    const data = source.data ?? source.request?.content?.data ?? source;
    const candidate =
        data?.created_at ?? data?.createdAt ?? data?.sent_at ?? data?.sentAt;
    if (typeof candidate === 'string') {
        const t = Date.parse(candidate);
        return Number.isFinite(t) ? t : null;
    }
    if (typeof candidate === 'number' && candidate > 0) {
        return candidate > 1e12 ? candidate : candidate * 1000;
    }

    return null;
}

/**
 * Bildirim STALE_NOTIFICATION_HOURS'tan eskiyse `true` döner. Gönderim
 * zamanı tespit edilemiyorsa konservatif olarak `false` döner (kullanıcı
 * deneyimini yanlışlıkla bloke etmemek için).
 */
export function isStaleNotification(source: any): boolean {
    const sentMs = extractNotificationSentMs(source);
    if (sentMs === null) return false;
    return Date.now() - sentMs > STALE_NOTIFICATION_MS;
}

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

/**
 * Onaylanan iş akışında kullanılan resolve tipi.
 * Offer/teklif akışındaki `transfer` burada yer almaz çünkü `navigateToAcceptedJob`
 * fetch path'i şu an transfer'i desteklemiyor (backend endpoint yok).
 */
type ResolvedServiceType = 'tow' | 'crane' | 'home_moving' | 'city_moving' | 'road_assistance';

/**
 * Teklif (offer) ekranı yönlendirmesi için kullanılan resolve tipi.
 * `ResolvedServiceType` + `transfer` ile genişletilmiştir.
 */
type OfferServiceKey = ResolvedServiceType | 'transfer';

// ---------------------------------------------------------------------------
// Alias resolve map'leri
// ---------------------------------------------------------------------------

/**
 * Inbound FCM alias → offer service key.
 * Backend push payload'ındaki `service_type` birden fazla alias ile gelebilir.
 * Bu map tek noktada tüm kabul edilen alias'ları tutar.
 *
 * NOT: Bu map inbound/parser'dır. Outbound default alias için
 * `SERVICE_FCM` (`constants/serviceTypes.ts`) kullanılır.
 */
const ALIAS_TO_OFFER_SERVICE: Record<string, OfferServiceKey> = {
    // Crane
    crane: 'crane',
    vinc_request: 'crane',
    // Home moving
    home_moving: 'home_moving',
    evden_eve: 'home_moving',
    // City moving
    city_moving: 'city_moving',
    sehirler_arasi: 'city_moving',
    // Road assistance
    road_assistance: 'road_assistance',
    road_assistance_request: 'road_assistance',
    yol_yardim: 'road_assistance',
    // Transfer
    transfer: 'transfer',
    transfer_request: 'transfer',
    // Tow truck
    tow: 'tow',
    tow_truck: 'tow',
};

// ---------------------------------------------------------------------------
// Public resolve helpers
// ---------------------------------------------------------------------------

/**
 * FCM alias → `OfferServiceKey`. Bilinmeyen/eksik alias için `'tow'` döner
 * (önceki inline davranışla birebir — unknown alias TowTruckOffer fallback'i).
 *
 * Kullanıldığı yerler:
 *   - App.tsx (foreground banner onPress)
 *   - useNotifications.ts (background / killed state offer navigation)
 */
export function resolveOfferServiceKey(rawServiceType: unknown): OfferServiceKey {
    if (typeof rawServiceType !== 'string') return 'tow';
    return ALIAS_TO_OFFER_SERVICE[rawServiceType] ?? 'tow';
}

/**
 * FCM alias → `ResolvedServiceType` (accepted job fetch path).
 * `transfer` bu scope'ta desteklenmez — `transfer` alias gelirse `'tow'`
 * fallback'ine düşer (önceki davranışla birebir).
 */
function resolveServiceType(rawServiceType: unknown): ResolvedServiceType {
    const key = resolveOfferServiceKey(rawServiceType);
    if (key === 'transfer') return 'tow';
    return key;
}

// ---------------------------------------------------------------------------
// Offer navigation
// ---------------------------------------------------------------------------

type OfferScreenName =
    | 'TowTruckOffer'
    | 'CraneOffer'
    | 'HomeMovingOffer'
    | 'CityMovingOffer'
    | 'RoadAssistanceOffer'
    | 'TransferOffer';

const OFFER_SCREEN_MAP: Record<OfferServiceKey, OfferScreenName> = {
    tow: 'TowTruckOffer',
    crane: 'CraneOffer',
    home_moving: 'HomeMovingOffer',
    city_moving: 'CityMovingOffer',
    road_assistance: 'RoadAssistanceOffer',
    transfer: 'TransferOffer',
};

type NavigationRefLike = {
    current: {
        navigate: (name: string, params?: Record<string, unknown>) => void;
    } | null;
};

/**
 * Teklif bildiriminden uygun Offer ekranına yönlendirir. Tüm inline alias
 * kontrollerinin yerini alır. Runtime davranış önceki if/else zinciriyle
 * birebir aynıdır — bilinmeyen alias için `TowTruckOffer` fallback.
 */
export function navigateToOfferScreen(
    navigationRef: NavigationRefLike | undefined,
    orderId: unknown,
    rawServiceType: unknown
): void {
    if (!navigationRef?.current) return;
    const key = resolveOfferServiceKey(rawServiceType);
    const screen = OFFER_SCREEN_MAP[key];
    navigationRef.current.navigate(screen, { orderId: String(orderId) });
}

// ---------------------------------------------------------------------------
// Accepted job navigation
// ---------------------------------------------------------------------------

async function fetchJobsByServiceType(
    requestsAPI: any,
    serviceType: ResolvedServiceType
): Promise<any[]> {
    let inProgress: Promise<any[]>;
    let awaitingPayment: Promise<any[]>;
    let awaitingApproval: Promise<any[]>;

    switch (serviceType) {
        case 'crane':
            inProgress = requestsAPI.getInProgressCraneRequests().catch(() => []);
            awaitingPayment = requestsAPI.getAwaitingPaymentCraneRequests().catch(() => []);
            awaitingApproval = requestsAPI.getAwaitingApprovalCraneRequests().catch(() => []);
            break;
        case 'home_moving':
            inProgress = requestsAPI.getInProgressHomeMovingRequests().catch(() => []);
            awaitingPayment = requestsAPI.getAwaitingPaymentHomeMovingRequests().catch(() => []);
            awaitingApproval = requestsAPI.getAwaitingApprovalHomeMovingRequests().catch(() => []);
            break;
        case 'city_moving':
            inProgress = requestsAPI.getInProgressCityMovingRequests().catch(() => []);
            awaitingPayment = requestsAPI.getAwaitingPaymentCityMovingRequests().catch(() => []);
            awaitingApproval = requestsAPI.getAwaitingApprovalCityMovingRequests().catch(() => []);
            break;
        case 'road_assistance':
            inProgress = requestsAPI.getInProgressRoadAssistanceRequests().catch(() => []);
            awaitingPayment = requestsAPI.getAwaitingPaymentRoadAssistanceRequests().catch(() => []);
            awaitingApproval = requestsAPI.getAwaitingApprovalRoadAssistanceRequests().catch(() => []);
            break;
        case 'tow':
        default:
            inProgress = requestsAPI.getInProgressTowTruckRequests().catch(() => []);
            awaitingPayment = requestsAPI.getAwaitingPaymentTowTruckRequests().catch(() => []);
            awaitingApproval = requestsAPI.getAwaitingApprovalTowTruckRequests().catch(() => []);
            break;
    }

    const [ip, ap, aa] = await Promise.all([inProgress, awaitingPayment, awaitingApproval]);
    return [...ip, ...ap, ...aa];
}

function getJobDetailTarget(
    jobId: string,
    serviceType: ResolvedServiceType
): { screen: string; params: Record<string, any> } {
    switch (serviceType) {
        case 'crane':
            return { screen: 'CraneJobDetail', params: { jobId } };
        case 'home_moving':
            return { screen: 'NakliyeJobDetail', params: { jobId, movingType: 'home' } };
        case 'city_moving':
            return { screen: 'NakliyeJobDetail', params: { jobId, movingType: 'city' } };
        case 'road_assistance':
            return { screen: 'RoadAssistanceJobDetail', params: { jobId } };
        case 'tow':
        default:
            return { screen: 'JobDetail', params: { jobId, fromScreen: 'Notification' } };
    }
}

// ---------------------------------------------------------------------------
// Status-based navigation (yeni master)
// ---------------------------------------------------------------------------

/**
 * Servise göre uygun detail endpoint'ini çağırır.
 * Backend: `/requests/{service}/details/{pk}/` — sürücü tüm status'ler için erişebilir.
 */
async function fetchRequestDetail(
    requestsAPI: any,
    serviceType: OfferServiceKey,
    orderId: string | number
): Promise<any> {
    const id = typeof orderId === 'string' ? parseInt(orderId, 10) : orderId;
    switch (serviceType) {
        case 'crane': return requestsAPI.getCraneRequestDetail(id);
        case 'home_moving': return requestsAPI.getHomeMovingRequestDetail(id);
        case 'city_moving': return requestsAPI.getCityMovingRequestDetail(id);
        case 'road_assistance': return requestsAPI.getRoadAssistanceRequestDetail(id);
        case 'transfer': return requestsAPI.getTransferRequestDetail(id);
        case 'tow':
        default: return requestsAPI.getTowTruckRequestDetail(id);
    }
}

/**
 * Status'e göre JobDetail ekranı + navigation params'ı belirler.
 *
 * KRİTİK: `jobId` parametresi backend'in `request_id` (yani orderId) ile aynı.
 * JobDetailScreen mount olduğunda `getXxxRequestDetail(parseInt(jobId))` çağırıyor
 * ve bu endpoint backend tarafında `request_id__pk = jobId` ile sorgu yapıyor.
 * useOrdersNavigation.ts pattern'i de aynı şekilde `orderId` değerini `jobId`
 * olarak geçiriyor. Bu yüzden burada `detail.id` (driver kaydı id'si) DEĞİL,
 * `orderId` kullanılır — yanlış id verilirse JobDetail fetch 404 alır.
 */
function getJobDetailNavigation(
    serviceType: OfferServiceKey,
    orderId: string | number
): { screen: string; params: Record<string, any> } {
    const jobId = String(orderId);
    switch (serviceType) {
        case 'crane':
            return { screen: 'CraneJobDetail', params: { jobId } };
        case 'home_moving':
            return { screen: 'NakliyeJobDetail', params: { jobId, movingType: 'home' } };
        case 'city_moving':
            return { screen: 'NakliyeJobDetail', params: { jobId, movingType: 'city' } };
        case 'road_assistance':
            return { screen: 'RoadAssistanceJobDetail', params: { jobId } };
        case 'transfer':
            return { screen: 'TransferJobDetail', params: { jobId } };
        case 'tow':
        default:
            return { screen: 'JobDetail', params: { jobId, fromScreen: 'Notification' } };
    }
}

/**
 * Master bildirim yönlendirme fonksiyonu — talebin gerçek statüsünü backend'den
 * çekip uygun ekrana yönlendirir.
 *
 * - `pending`               → OfferScreen (mevcut `navigateToOfferScreen`)
 * - `awaiting_approval`     → JobDetail (servise göre)
 * - `awaiting_payment`      → JobDetail
 * - `in_progress`           → JobDetail
 * - `completed`             → OrdersTab `filter: completed`
 * - `cancelled`             → OrdersTab + "iptal edilmiş" alert
 * - bilinmeyen / boş        → OrdersTab fallback
 *
 * Hata (404 / network / vb.): kullanıcıya kısa Alert + OrdersTab.
 *
 * Kullanıldığı yerler:
 *   - App.tsx (foreground banner onPress)
 *   - useNotifications.ts (background state handler)
 *   - useNotifications.ts (killed state handler)
 */
/**
 * Bildirim payload'ından gelen `orderId` farklı şekillerde gelebiliyor:
 *  - "123" / 123                 → düz id
 *  - { id: 123, ... }            → object (backend bazen request_id'yi obj olarak gönderiyor)
 *  - null / undefined / "" / {}  → geçersiz
 *
 * Geçerli bir number/string id varsa onu döner; yoksa null.
 */
function normalizeOrderId(raw: any): string | number | null {
    if (raw === null || raw === undefined || raw === '') return null;
    if (typeof raw === 'object') {
        const inner = (raw as any).id;
        if (typeof inner === 'number' || typeof inner === 'string') return inner;
        return null;
    }
    if (typeof raw === 'number' || typeof raw === 'string') return raw;
    return null;
}

/** navigate() çağrısını fırlatmayacak şekilde sarar — bilinmeyen screen / params durumunda sessizce log atar. */
function safeNavigate(navigationRef: any, name: string, params?: Record<string, any>, logPrefix: string = ''): void {
    try {
        navigationRef?.current?.navigate(name, params);
    } catch (e: any) {
        logger.error('navigation', `${logPrefix} safeNavigate failed`, { name, message: e?.message });
    }
}

export async function navigateByRequestStatus(
    navigationRef: any,
    orderId: any,
    rawServiceType: any,
    logPrefix: string = ''
): Promise<void> {
    try {
        if (!navigationRef?.current) {
            logger.warn('navigation', `${logPrefix} no navigationRef, abort`);
            return;
        }

        const normalizedOrderId = normalizeOrderId(orderId);
        if (!normalizedOrderId) {
            logger.warn('navigation', `${logPrefix} invalid orderId, fallback OrdersTab`, { raw: orderId });
            safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
            return;
        }

        const serviceType = resolveOfferServiceKey(rawServiceType);
        logger.info('navigation', `${logPrefix} start`, { orderId: normalizedOrderId, serviceType });

        try {
            const apiModule = await import('../api');
            const requestsAPI = (apiModule as any)?.requestsAPI;
            if (!requestsAPI) {
                logger.error('navigation', `${logPrefix} requestsAPI undefined after dynamic import`);
                safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
                return;
            }

            const detail = await fetchRequestDetail(requestsAPI, serviceType, normalizedOrderId);

            const status: string | undefined =
                detail?.status || detail?.request_id?.status;

            logger.info('navigation', `${logPrefix} detail fetched`, { serviceType, status });

            if (!status) {
                safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
                return;
            }

            if (status === 'pending') {
                navigateToOfferScreen(navigationRef, normalizedOrderId, rawServiceType);
                return;
            }

            if (status === 'cancelled') {
                safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
                Alert.alert('Bilgi', 'Bu talep iptal edilmiş.');
                return;
            }

            if (status === 'completed') {
                safeNavigate(navigationRef, 'Tabs', {
                    screen: 'OrdersTab',
                    params: { filter: 'completed' },
                }, logPrefix);
                return;
            }

            if (
                status === 'awaiting_approval' ||
                status === 'awaiting_payment' ||
                status === 'in_progress'
            ) {
                // jobId = orderId (request_id) — JobDetailScreen mount olunca bu değeri
                // doğrudan getXxxRequestDetail()'e geçiriyor; detail.id (driver kaydı)
                // değil request_id geçilmesi şart, aksi halde JobDetail 404 alır.
                const target = getJobDetailNavigation(serviceType, normalizedOrderId);
                if (!target.params.jobId) {
                    safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
                    return;
                }
                logger.info('navigation', `${logPrefix} navigate JobDetail`, { screen: target.screen });
                safeNavigate(navigationRef, target.screen, target.params, logPrefix);
                return;
            }

            // Bilinmeyen status — fallback
            logger.warn('navigation', `${logPrefix} unknown status, fallback OrdersTab`, { status });
            safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
        } catch (err: any) {
            const httpStatus = err?.response?.status;
            logger.error('navigation', `${logPrefix} fetch/route failed`, {
                status: httpStatus,
                message: err?.message,
            });
            const is404 = httpStatus === 404;
            Alert.alert(
                'Hata',
                is404
                    ? 'Talep artık mevcut değil veya size erişim yok.'
                    : 'Talep yüklenemedi. Lütfen İşlerim sekmesinden tekrar deneyin.'
            );
            safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
        }
    } catch (fatal: any) {
        // Top-level catch — hiçbir şart altında native crash olmasın
        logger.error('navigation', `${logPrefix} FATAL`, { message: fatal?.message });
        safeNavigate(navigationRef, 'Tabs', { screen: 'OrdersTab' }, logPrefix);
    }
}

/**
 * Onaylanan iş bildiriminde doğru iş detay ekranına yönlendirir.
 *
 * @deprecated Yeni bildirim akışında `navigateByRequestStatus` kullanılır.
 * Bu fonksiyon geriye uyum için korunmuştur; başka bir yerde import edilebilir.
 *
 * Kullanıldığı yerler:
 *   - App.tsx (foreground banner onPress)
 *   - useNotifications.ts (background state handler)
 *   - useNotifications.ts (killed state handler)
 */
export async function navigateToAcceptedJob(
    navigationRef: any,
    orderId: any,
    rawServiceType: any,
    logPrefix: string = ''
): Promise<void> {
    try {
        const { requestsAPI } = await import('../api');

        const serviceType = resolveServiceType(rawServiceType);
        logger.info('navigation', `${logPrefix} Resolved serviceType`, serviceType);

        const allJobs = await fetchJobsByServiceType(requestsAPI, serviceType);

        const matchedJob = allJobs.find((job: any) => {
            const jobRequestId =
                typeof job.request_id === 'object' ? job.request_id?.id : job.request_id;
            return jobRequestId === parseInt(String(orderId));
        });

        if (matchedJob) {
            const target = getJobDetailTarget(String(matchedJob.id), serviceType);
            logger.info('navigation', `${logPrefix} Navigating to ${target.screen}`, target.params);
            navigationRef.current?.navigate(target.screen, target.params);
        } else {
            logger.warn(
                'navigation',
                `${logPrefix} Job not found for orderId ${orderId}, serviceType ${serviceType}. Falling back to OrdersTab.`
            );
            navigationRef.current?.navigate('Tabs', {
                screen: 'OrdersTab',
                params: { filter: 'awaiting_payment' },
            });
        }
    } catch (error) {
        logger.error('navigation', `${logPrefix} API hatası`, error);
        navigationRef.current?.navigate('Tabs', {
            screen: 'OrdersTab',
            params: { filter: 'awaiting_payment' },
        });
    }
}

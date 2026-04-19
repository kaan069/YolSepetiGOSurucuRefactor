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

import { logger } from './logger';

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

/**
 * Onaylanan iş bildiriminde doğru iş detay ekranına yönlendirir.
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

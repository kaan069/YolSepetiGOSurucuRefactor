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
 */

type ResolvedServiceType = 'tow' | 'crane' | 'home_moving' | 'city_moving' | 'road_assistance';

function resolveServiceType(rawServiceType: any): ResolvedServiceType {
  if (typeof rawServiceType !== 'string') return 'tow';
  if (rawServiceType === 'crane' || rawServiceType === 'vinc_request') {
    return 'crane';
  }
  if (rawServiceType === 'home_moving' || rawServiceType === 'evden_eve') {
    return 'home_moving';
  }
  if (rawServiceType === 'city_moving' || rawServiceType === 'sehirler_arasi') {
    return 'city_moving';
  }
  if (
    rawServiceType === 'road_assistance' ||
    rawServiceType === 'yol_yardim' ||
    rawServiceType === 'road_assistance_request'
  ) {
    return 'road_assistance';
  }
  return 'tow';
}

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
    console.log(`🔔 ${logPrefix} Resolved serviceType:`, serviceType);

    const allJobs = await fetchJobsByServiceType(requestsAPI, serviceType);

    const matchedJob = allJobs.find((job: any) => {
      const jobRequestId =
        typeof job.request_id === 'object' ? job.request_id?.id : job.request_id;
      return jobRequestId === parseInt(String(orderId));
    });

    if (matchedJob) {
      const target = getJobDetailTarget(String(matchedJob.id), serviceType);
      console.log(`✅ ${logPrefix} Navigating to ${target.screen}`, target.params);
      navigationRef.current?.navigate(target.screen, target.params);
    } else {
      console.warn(`⚠️ ${logPrefix} Job not found for orderId ${orderId}, serviceType ${serviceType}. Falling back to OrdersTab.`);
      navigationRef.current?.navigate('Tabs', {
        screen: 'OrdersTab',
        params: { filter: 'awaiting_payment' },
      });
    }
  } catch (error) {
    console.error(`❌ ${logPrefix} API hatası:`, error);
    navigationRef.current?.navigate('Tabs', {
      screen: 'OrdersTab',
      params: { filter: 'awaiting_payment' },
    });
  }
}

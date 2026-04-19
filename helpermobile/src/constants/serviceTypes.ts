/**
 * Canonical ServiceType definitions + backend boundary mappings.
 *
 * Bu dosya, projedeki 5+ dağınık `ServiceType` tanımının (ör. useRegistrationDataStore,
 * useActiveJobStore, jobsWebSocket, notifications, PaymentConfirmationModal) tek bir
 * canonical kaynağa bağlanması için oluşturulmuştur. Faz 1 (bu PR) sadece altyapıyı
 * ekler — runtime davranışa DOKUNMAZ. Mevcut tanımlar ilerideki faz'larda aşağıdaki
 * canonical yapıya ve boundary map'lerine tek tek migrate edilecektir.
 *
 * Canonical form seçimi ("en az dokunuş" prensibi):
 *   `useRegistrationDataStore.ServiceType` authoritative kabul edildi çünkü:
 *     (a) Kullanıcı kayıt sırasında backend'e bu formu self-identify olarak gönderir
 *         (api/types.ts -> RegisterRequest.user_type / vehicleTypes).
 *     (b) Earnings API response'u (ByServiceTypeEarnings) aynı form'u kullanır
 *         — `homeToHomeMoving`, `cityToCity` literal'leri backend'de yerleşiktir.
 *     (c) Bu form korunduğu için migration'da AsyncStorage persist rewrite gerekmez.
 *
 * Boundary map'ler, canonical literal'ı backend-facing varyantlara çevirir:
 *   - SERVICE_WS_CHANNEL:   WebSocket URL segment  (`/ws/jobs/<channel>/`)
 *   - SERVICE_CANCEL_PATH:  REST URL segment       (`/requests/<segment>/...`)
 *   - SERVICE_FCM:          FCM data payload alias (push notification `service_type`)
 *   - SERVICE_EARNINGS_KEY: `ByServiceTypeEarnings` property key
 *
 * UI grouping (label/icon/color) için bkz. `./serviceTypeUI.ts`.
 *
 * Usage (gelecekteki migration'larda):
 *   import { ServiceType, SERVICE_WS_CHANNEL } from '@/constants/serviceTypes';
 *   const channel = SERVICE_WS_CHANNEL.towTruck; // 'tow_truck'
 */

import type { ByServiceTypeEarnings } from '../api/types';

// ---------------------------------------------------------------------------
// Canonical atomic ServiceType
// ---------------------------------------------------------------------------

/**
 * Canonical, atomik servis tipleri — tek bir fiziksel hizmet birimini temsil eder.
 * Bu liste backend'e register sırasında gönderilen `vehicleTypes` / `user_type`
 * literal'ları ile birebir örtüşür.
 */
export const SERVICE_TYPES = [
  'towTruck',
  'crane',
  'roadAssistance',
  'homeToHomeMoving',
  'cityToCity',
  'transfer',
] as const;

export type ServiceType = (typeof SERVICE_TYPES)[number];

// ---------------------------------------------------------------------------
// ServiceGroup (UI-level grouping)
// ---------------------------------------------------------------------------

/**
 * UI tarafında birden fazla atomik service tipi birleşik bir kart / tab olarak
 * gösterilebilir (ör. Earnings ekranındaki "Nakliye" kartı = Evden Eve + Şehirler
 * Arası). `ServiceGroup`, `ServiceType` union'ını bu UI birleşimleri ile
 * genişletir.
 *
 * `nakliye` mevcut `STAT_CARDS` (screens/earnings/constants.ts:71) ve
 * `useOrdersData.ServiceFilterType` (screens/orders/hooks/useOrdersData.tsx:12)
 * davranışını yansıtır.
 */
export const SERVICE_GROUPS = [...SERVICE_TYPES, 'nakliye'] as const;

export type ServiceGroup = (typeof SERVICE_GROUPS)[number];

/**
 * Bir `ServiceGroup`'u oluşturan canonical atomik tipler.
 * Atomik `ServiceType`'lar için liste tek elemanlıdır (self-mapping).
 * UI group'ları (şu an sadece `nakliye`) birden fazla atomik tipe bağlanır.
 */
export const SERVICE_GROUP_MEMBERS: Record<ServiceGroup, readonly ServiceType[]> = {
  towTruck: ['towTruck'],
  crane: ['crane'],
  roadAssistance: ['roadAssistance'],
  homeToHomeMoving: ['homeToHomeMoving'],
  cityToCity: ['cityToCity'],
  transfer: ['transfer'],
  nakliye: ['homeToHomeMoving', 'cityToCity'],
} as const;

// ---------------------------------------------------------------------------
// Backend boundary maps
// ---------------------------------------------------------------------------

/**
 * WebSocket channel segment — `{WS_BASE_URL}/ws/jobs/<channel>/?auth=<jwt>`.
 * Kaynak: `src/services/jobsWebSocket.ts` (header docstring + `ServiceType` union).
 */
export const SERVICE_WS_CHANNEL: Record<ServiceType, string> = {
  towTruck: 'tow_truck',
  crane: 'crane',
  roadAssistance: 'road_assistance',
  homeToHomeMoving: 'home_moving',
  cityToCity: 'city_moving',
  transfer: 'transfer',
};

/**
 * REST API path segment — `/requests/<segment>/<tracking_token>/(can-)?cancel/`.
 * Kaynak: `src/api/types.ts` -> `CancelServiceType` union + cancellation.ts kullanımı.
 */
export const SERVICE_CANCEL_PATH: Record<ServiceType, string> = {
  towTruck: 'tow-truck',
  crane: 'crane',
  roadAssistance: 'road-assistance',
  homeToHomeMoving: 'home-moving',
  cityToCity: 'city-moving',
  transfer: 'transfer',
};

/**
 * FCM data payload `service_type` alias — backend push notification'larında
 * aynı hizmet için birden fazla alias gönderilebilir (ör. `vinc_request` | `crane`).
 * Bu map CANONICAL -> backend'in "authoritative" gönderdiği Türkçe alias'ı verir.
 * Parser tarafında tam alias listesi için `resolveServiceType()`
 * (`src/utils/notificationNavigation.ts`) fonksiyonuna bakılmalı —
 * bu map yalnızca outbound/default alias içindir.
 *
 * Kaynak: `src/utils/notificationNavigation.ts` (satır 17-33 alias mapping'i).
 */
export const SERVICE_FCM: Record<ServiceType, string> = {
  towTruck: 'tow_truck',
  crane: 'vinc_request',
  roadAssistance: 'yol_yardim',
  homeToHomeMoving: 'evden_eve',
  cityToCity: 'sehirler_arasi',
  transfer: 'transfer',
};

/**
 * `ByServiceTypeEarnings` interface'indeki property key'i.
 * Mevcut earnings API'si zaten canonical form'la örtüştüğü için identity-map
 * gibi görünüyor; map yine de explicit yazılmıştır çünkü:
 *   (a) Backend gelecekte earnings key'lerini değiştirirse tek noktadan güncelleme.
 *   (b) `transfer` alanı `ByServiceTypeEarnings` içinde opsiyoneldir, tip
 *       sistemi `keyof` üzerinden yakalar.
 *
 * Kaynak: `src/api/types.ts` -> `ByServiceTypeEarnings`, `EarningsServiceType`.
 */
export const SERVICE_EARNINGS_KEY: Record<ServiceType, keyof ByServiceTypeEarnings> = {
  towTruck: 'towTruck',
  crane: 'crane',
  roadAssistance: 'roadAssistance',
  homeToHomeMoving: 'homeToHomeMoving',
  cityToCity: 'cityToCity',
  transfer: 'transfer',
};

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Runtime type guard — bilinmeyen string'in canonical `ServiceType` olup olmadığı. */
export function isServiceType(value: unknown): value is ServiceType {
  return typeof value === 'string' && (SERVICE_TYPES as readonly string[]).includes(value);
}

/** Runtime type guard — bilinmeyen string'in `ServiceGroup` olup olmadığı. */
export function isServiceGroup(value: unknown): value is ServiceGroup {
  return typeof value === 'string' && (SERVICE_GROUPS as readonly string[]).includes(value);
}

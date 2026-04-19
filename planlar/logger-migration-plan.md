# Logger Migration Plan

Bu doküman, `src/utils/logger.ts` altyapısının eklenmesinin ardından
mevcut `console.*` çağrılarının kademeli olarak logger API'sine
taşınması için rehberdir.

## Hedef

- Production'da gürültülü/PII riskli debug log'larını susturmak.
- `warn` / `error` akışlarını korumak (future crash reporter hook'u için).
- Grep-friendly kategori prefix'i (`[fcm] ...`, `[payment] ...`) ile
  sahada log okunabilirliğini artırmak.

## Kapsam dışı (bu plan körlemesine migration YAPMAZ)

- Sentry/Bugsnag entegrasyonu (ayrı PR).
- Test log'ları ve dev-only debug'ların tamamen silinmesi.
- Log içeriğinin refactor'u — sadece `console.*` → `logger.*` çağrı dönüşümü.

## Logger API özeti

```ts
logger.debug(category, message, extra?)  // __DEV__ only
logger.info(category, message, extra?)   // __DEV__ only
logger.warn(category, message, extra?)   // her zaman console.warn
logger.error(category, message, extra?)  // her zaman console.error
```

Category union: `auth | fcm | network | payment | websocket | location | orders | vehicles | navigation | general`

## Fazlar

### Faz 0 — Foundation (TAMAMLANDI)

- `src/utils/logger.ts` eklendi
- `src/utils/notificationNavigation.ts` — 4 çağrı migrate edildi (pilot)
- `src/hooks/useNotifications.ts` — 5 `error` çağrısı migrate edildi

### Faz 1 — Güvenlik riski potansiyeli yüksek `error` log'ları (P0)

**Hedef**: Crash reporter hook'u için zemin. Her dosyada `console.error` →
`logger.error(<category>, msg, err)` dönüşümü. Mesaj içeriğine dokunma;
sadece sarmala.

Öncelik sırası (batch 1 — ~10 dosya, ~60 `console.error`):

- `src/api/auth.ts` (51 log)
- `src/api/vehicles.ts` (114 log)
- `src/api/axiosConfig.ts` (10 log)
- `src/api/payment.ts` (12 log)
- `src/api/profile.ts` (8 log)
- `src/api/documents.ts` (11 log)
- `src/api/requests/common.ts` (12 log)
- `src/api/requests/towTruck.ts` (11 log)
- `src/api/requests/crane.ts` (13 log)
- `src/api/requests/nakliye.ts` (18 log)

Kategori mapping:
- `api/auth.ts` → `auth`
- `api/vehicles.ts` → `vehicles`
- `api/payment.ts` → `payment`
- `api/requests/*` → `orders`
- `api/axiosConfig.ts` → `network`
- Diğer → `network`

### Faz 2 — Service ve Hook katmanları (P0)

Batch 2 — ~10 dosya:

- `src/services/fcmService.ts` (32) → `fcm`
- `src/services/jobsWebSocket.ts` (5) → `websocket`
- `src/services/locationWebSocket.ts` (9) → `websocket`
- `src/services/backgroundLocationService.ts` (15) → `location`
- `src/services/deviceService.ts` (7) → `general`
- `src/tasks/backgroundLocation.ts` (12) → `location`
- `src/hooks/useLocationTracking.ts` (3) → `location`
- `src/hooks/useLocationWebSocket.ts` (4) → `websocket`
- `src/hooks/useJobsWebSocket.ts` (2) → `websocket`
- `src/lib/notifications.ts` (9) → `fcm`

### Faz 3 — Store ve util'ler (P1)

Batch 3 — ~8 dosya:

- `src/store/authStore.ts` (18) → `auth`
- `src/store/notificationStore.ts` (4) → `fcm`
- `src/store/useRegistrationDataStore.ts` (8) → `auth`
- `src/store/driverStore.ts` (3) → `auth`
- `src/store/useActiveJobStore.ts` (2) → `orders`
- `src/store/useOnboardingStore.ts` (1) → `auth`
- `src/utils/locationPermission.ts` (4) → `location`
- `src/types/notifications.ts` (4) → `fcm`

### Faz 4 — Ekranlar: iş akışı kritikleri (P1)

Batch 4 — yüksek log yoğunluğu olan ekranlar:

- `src/screens/profile/VehiclesScreen.tsx` (43) → `vehicles`
- `src/screens/profile/DocumentsScreen.tsx` (33) → `auth`
- `src/screens/nakliye/hooks/useNakliyeVehicles.ts` (16) → `vehicles`
- `src/screens/roadAssistance/hooks/useRoadAssistanceVehicles.ts` (16) → `vehicles`
- `src/screens/profile/ReportsAndHistoryScreen.tsx` (15) → `orders`
- `src/screens/towTruckOffer/hooks/useTowTruckRequest.ts` (12) → `orders`
- `src/screens/towTruckOffer/TowTruckOfferScreen.tsx` (5) → `orders`
- `src/screens/auth/PersonalInfoNewScreen.tsx` (10) → `auth`
- `src/screens/auth/PhoneAuthScreen.tsx` (7) → `auth`
- `src/screens/auth/OTPVerificationScreen.tsx` (5) → `auth`

### Faz 5 — Kalan ekranlar (P2)

Batch 5+ — 10-20 dosya / PR. Her PR sonunda:
- `npx tsc --noEmit` → 0 hata
- İlgili akış manuel smoke (opsiyonel)
- PR başlığı: `chore(logger): migrate <alan> logs to logger API`

## Migration checklist (her dosya için)

- [ ] `import { logger } from '<path>/utils/logger';` eklendi
- [ ] `console.log` → `logger.debug` veya `logger.info` (tercih: `info`)
- [ ] `console.warn` → `logger.warn`
- [ ] `console.error` → `logger.error`
- [ ] Emoji/prefix mesajı korundu (mesaj içeriği değişmesin)
- [ ] **Güvenlik**: token/şifre/tam payload logu görürseniz log'u silin veya
      sanitize edin — körlemesine logger'a taşımayın
- [ ] `npx tsc --noEmit` → 0 hata

## Kabul kriterleri (bu plan tamamlanınca)

- `grep -r "console\." src/` sayısı <50 (sadece test / lint-disable / özel
  durumlar)
- Production build'de `[category]` prefix'li info log'ları görünmüyor
- `warn` / `error` akışları canlı
- `logger.setRemoteReporter` hook'u için interface hazır

## Risk notları

- `console.*` doğrudan çağrısı hiçbir zaman otomatik `sed`/`rg --replace`
  ile toplu değiştirilmedi — her dosya elle gözden geçirilecek (çünkü
  bazı log'lar sensitive payload içeriyor).
- Migration sırasında davranış asla değişmez; sadece `__DEV__=false`
  ortamında `debug`/`info` çıktıları susar — bu zaten hedef.

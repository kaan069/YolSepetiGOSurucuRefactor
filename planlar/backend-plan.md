# Backend Entegrasyon Refactor Planı

> Amaç: API, WebSocket ve Ödeme entegrasyonlarını temiz, modüler, bağımsız test edilebilir klasörlere ayırmak.
> UI katmanına dokunmadan backend'i baştan kurmak; sonra UI'ı yeni yapıya bağlamak.
> Strateji: Eski kod kırılmasın, yeni yapı paralelde oluşsun, migration kademeli.

---

## 1. HEDEFLER

**Ana hedefler:**
1. Tek `src/backend/` çatısı altında tüm dış sistem entegrasyonları.
2. Her domain (API, WS, Payment) bağımsız klasör, bağımsız types, bağımsız error'lar.
3. Merkezi shared infra: HTTP client, logger, storage, config, errors.
4. Tutarlı error handling (AppError class, error code'lar).
5. Type safety: strict TS + runtime validation (zod).
6. Test edilebilir: her modül unit test'le kapatılabilir.
7. UI bağımsız: backend modülleri React/RN import etmez (hook'lar hariç).

**Hedef olmayan (bu fazda):**
- UI refactor (sonraki faz).
- Store consolidation (sonraki faz).
- Yeni ekran/özellik.
- Fatura entegrasyonu (şimdilik ertelendi).

---

## 2. YENİ KLASÖR YAPISI

```
helpermobile/src/backend/
│
├── core/                      # Shared infra — tüm modüller kullanır
│   ├── http/
│   │   ├── client.ts          # Axios instance
│   │   ├── interceptors.ts    # Auth, 401, 404, retry, logger
│   │   ├── retry.ts           # Exponential backoff policy
│   │   └── types.ts           # HttpError, ApiResponse, Pagination
│   │
│   ├── ws/
│   │   ├── BaseWebSocket.ts   # Abstract base class (reconnect, heartbeat, internet monitor)
│   │   ├── WebSocketManager.ts # Singleton registry (tüm WS bağlantılarını yönet)
│   │   └── types.ts           # WSEvent, WSState, WSConfig
│   │
│   ├── config/
│   │   ├── env.ts             # API_BASE_URL, WS_BASE_URL, env okuma
│   │   ├── endpoints.ts       # Tüm endpoint string'leri merkezi
│   │   └── constants.ts       # Timeout, retry, polling interval
│   │
│   ├── logger/
│   │   ├── Logger.ts          # Class (debug/info/warn/error, prod'da sessiz)
│   │   └── index.ts           # Singleton export
│   │
│   ├── errors/
│   │   ├── AppError.ts        # Base error class (code, message, retry?, userMessage)
│   │   ├── NetworkError.ts    # İnternet yok
│   │   ├── AuthError.ts       # 401, token expired
│   │   ├── ValidationError.ts # Zod parse fail
│   │   ├── BusinessError.ts   # Backend business rule fail
│   │   └── errorCodes.ts      # Tüm kodlar tek yerde
│   │
│   ├── storage/
│   │   ├── secureStorage.ts   # expo-secure-store wrapper (token)
│   │   ├── storage.ts         # AsyncStorage wrapper (non-sensitive)
│   │   └── keys.ts            # Storage key sabitleri
│   │
│   └── types/
│       ├── common.ts          # ID, Timestamp, Money, Paginated<T>
│       └── index.ts
│
├── api/                       # REST API — her domain kendi klasörü
│   │
│   ├── auth/
│   │   ├── authApi.ts         # login, register, OTP, logout, refresh
│   │   ├── tokenManager.ts    # Access/refresh token yaşam döngüsü
│   │   ├── types.ts           # User, AuthResponse, OTPRequest
│   │   ├── schemas.ts         # zod şemaları
│   │   └── index.ts
│   │
│   ├── profile/
│   │   ├── profileApi.ts      # getProfile, updateProfile, company info
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   └── index.ts
│   │
│   ├── vehicles/
│   │   ├── vehiclesApi.ts     # CRUD, loadAll
│   │   ├── photoUpload.ts     # Fotoğraf yükleme helper (ortak)
│   │   ├── types.ts           # Vehicle<Type> union
│   │   ├── schemas.ts
│   │   └── index.ts
│   │
│   ├── documents/
│   │   ├── documentsApi.ts    # Ehliyet, vergi levhası, K belgesi
│   │   ├── types.ts
│   │   ├── schemas.ts
│   │   └── index.ts
│   │
│   ├── ratings/
│   │   ├── ratingsApi.ts
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── earnings/
│   │   ├── earningsApi.ts     # Kazanç, iş geçmişi, pagination
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── employees/
│   │   ├── employeesApi.ts    # Firma sahibi için eleman CRUD
│   │   ├── employeePanelApi.ts # Eleman için dashboard/jobs
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── cancellation/
│   │   ├── cancellationApi.ts # canCancel, cancelJob (tüm servisler ortak)
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── requests/              # İş talepleri — servis tipi başına
│       ├── base/
│       │   ├── RequestApiBase.ts # Abstract base class (CRUD pattern)
│       │   └── types.ts          # BaseRequest, RequestStatus
│       │
│       ├── towTruck/
│       │   ├── towTruckApi.ts
│       │   ├── types.ts
│       │   └── schemas.ts
│       │
│       ├── crane/
│       │   ├── craneApi.ts
│       │   ├── types.ts
│       │   └── schemas.ts
│       │
│       ├── transfer/
│       │   ├── transferApi.ts
│       │   ├── types.ts
│       │   └── schemas.ts
│       │
│       ├── nakliye/
│       │   ├── homeMovingApi.ts
│       │   ├── cityMovingApi.ts
│       │   ├── types.ts
│       │   └── schemas.ts
│       │
│       ├── roadAssistance/
│       │   ├── roadAssistanceApi.ts
│       │   ├── types.ts
│       │   └── schemas.ts
│       │
│       └── index.ts           # Tüm servisleri export
│
├── websocket/
│   ├── jobs/
│   │   ├── JobsWebSocket.ts   # BaseWebSocket extend
│   │   ├── types.ts           # NewJobEvent, JobUpdatedEvent, JobCancelledEvent
│   │   └── index.ts
│   │
│   ├── location/
│   │   ├── LocationWebSocket.ts # Tracking token bazlı
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   └── index.ts               # wsManager singleton export
│
├── payment/
│   ├── base/
│   │   ├── PaymentProcessor.ts # Abstract class (validate, process, result)
│   │   ├── types.ts            # PaymentMethod, PaymentResult, PaymentError
│   │   └── errors.ts
│   │
│   ├── iyzico/                # 3DS kart ödemesi
│   │   ├── IyzicoProcessor.ts
│   │   ├── threeDSHandler.ts  # WebView callback yakala
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── nfc/                   # SoftPOS NFC (Android-only)
│   │   ├── NFCProcessor.ts
│   │   ├── nfcReader.ts       # react-native-nfc-manager wrapper
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── qr/
│   │   ├── QRProcessor.ts
│   │   ├── qrPolling.ts       # Ödeme durum polling
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── paypos/                # PayPOS App2App deeplink
│   │   ├── PayPOSProcessor.ts
│   │   ├── deeplinkHandler.ts # AppState + deeplink
│   │   ├── types.ts
│   │   └── index.ts
│   │
│   ├── cards/                 # Kayıtlı kart yönetimi
│   │   ├── cardsApi.ts        # CRUD, setDefault, updateAlias
│   │   ├── cardValidation.ts  # Luhn, expiry, CVC
│   │   ├── types.ts           # SavedCard, CardBrand
│   │   └── index.ts
│   │
│   ├── PaymentFactory.ts      # Method'a göre processor üretir
│   └── index.ts
│
└── index.ts                   # Backend public API barrel
```

---

## 3. TASARIM KURALLARI

### 3.1 Her Modül İçin Standart Dosya Şablonu
```
<module>/
├── <module>Api.ts        # HTTP çağrıları (sınıf veya object)
├── types.ts              # Sadece bu modülün tipleri
├── schemas.ts            # Zod runtime validation
├── errors.ts             # Modüle özel error class'ları (opsiyonel)
├── index.ts              # Public export (barrel)
└── __tests__/            # Test klasörü
    └── <module>Api.test.ts
```

### 3.2 Dependency Kuralları (Katmanlı)
```
UI ──► hooks ──► backend/api/<module>
                       │
                       ▼
                 backend/core/http
                       │
                       ▼
                 backend/core/{logger, errors, storage}
```

- `core/` → hiçbir modüle import etmez (yaprak).
- `api/<module>` → sadece `core/` import eder.
- `websocket/<module>` → sadece `core/` import eder.
- `payment/<module>` → `core/` + `payment/base/` + `api/` (token için).
- **Modüller arası direkt import YOK.** (Örn: `auth/` → `vehicles/` import edemez.)

### 3.3 Public API Kuralı
Her modülün `index.ts`'i dışarıya sadece kullanılacak şeyleri export eder. Internal helper'lar export edilmez.

```ts
// backend/api/auth/index.ts
export { authApi } from './authApi';
export { tokenManager } from './tokenManager';
export type { User, AuthResponse } from './types';
// schemas.ts, helpers export edilmez (internal)
```

### 3.4 Error Handling Standardı
Tüm API çağrıları error'u `AppError`'a dönüştürür:
```ts
try {
  const res = await httpClient.get('/api/...');
  return AuthSchema.parse(res.data); // zod validation
} catch (e) {
  throw AppError.from(e); // axios/zod/network → AppError
}
```

UI her zaman `AppError` bekler, `error.code` ile switch yapar, `error.userMessage` gösterir.

### 3.5 Type Safety
- `any` yasak (ESLint rule).
- Tüm response'lar zod ile parse.
- Discriminated union'lar: `type Result = { ok: true; data: T } | { ok: false; error: AppError }` (opsiyonel pattern).

### 3.6 İsimlendirme
- Dosya: `camelCase.ts` (class ise `PascalCase.ts`)
- Class: `PascalCase`
- Instance/function: `camelCase`
- Type/interface: `PascalCase`
- Sabit: `SCREAMING_SNAKE_CASE`
- Zod şema: `<Type>Schema` (örn: `UserSchema`)

### 3.7 Config / Env
- Hardcoded URL YOK.
- `core/config/env.ts` tüm env değişkenlerini okur, validate eder, export eder.
- `react-native-dotenv` veya Expo config kullanılır.

### 3.8 Logger
- `console.log` yasak (ESLint rule + `no-console`).
- Her yerden `logger.debug/info/warn/error`.
- Prod'da sadece `error` seviyesi aktif (telemetri opsiyonel).

---

## 4. UYGULAMA FAZLARI

### Phase 0 — Hazırlık (½ gün)
**Amaç:** Yeni klasör iskeleti, temel config, linter kuralları.

Görevler:
1. `src/backend/` klasör ağacını boş dosyalarla oluştur.
2. `react-native-dotenv` kurulumu, `.env.example` oluştur.
3. ESLint kuralları: `no-console: error`, `no-restricted-imports` (core modülleri UI'dan direkt import etmesin).
4. `tsconfig.json` path alias: `@backend/*` → `src/backend/*`.
5. `core/config/env.ts` — API_BASE_URL, WS_BASE_URL, GOOGLE_MAPS_KEY.
6. `core/config/endpoints.ts` — Tüm endpoint string'lerini mevcut koddan topla.

**Çıktı:** İskelet + config hazır. Hiçbir şey kırılmaz.

---

### Phase 1 — Core Infrastructure (1 gün)
**Amaç:** HTTP client, logger, error, storage katmanları.

Görevler:
1. **Logger** — `core/logger/Logger.ts`. Level bazlı, prod'da sessiz.
2. **Error classes** — `AppError`, `NetworkError`, `AuthError`, `ValidationError`, `BusinessError`. `AppError.from(unknown)` factory.
3. **Secure storage** — `expo-secure-store` kurulumu + wrapper. Key sabitleri.
4. **HTTP client** — `core/http/client.ts`:
   - Axios instance, baseURL env'den.
   - Interceptor'lar: auth header (token inject), 401 handler (refresh try, yoksa logout event), 404 soft handling, network error → `NetworkError`, response validation.
   - Retry policy (sadece idempotent GET, max 2 deneme, exponential).
   - Request/response logger (sadece dev).
5. **Token manager** — Access/refresh token yaşam döngüsü. Refresh mutex (aynı anda tek refresh).
6. **Types** — `Paginated<T>`, `ApiResponse<T>`, `Money`.

**Çıktı:** `httpClient` kullanıma hazır, tüm modüller bunu kullanacak.

---

### Phase 2 — API Modülleri (3-4 gün)
**Amaç:** Her REST domain için ayrı modül, mevcut `src/api/`'deki mantığı taşı.

Sıra (önem önceliğine göre):
1. `auth/` — en kritik, diğerleri token ister.
2. `profile/`
3. `vehicles/` + `photoUpload.ts` ortak helper.
4. `documents/`
5. `ratings/`
6. `earnings/`
7. `cancellation/`
8. `employees/` + `employeePanelApi.ts`
9. `requests/` — `base/` class oluştur, 5 servis tipi bunu extend etsin.
   - `towTruck/`, `crane/`, `transfer/`, `roadAssistance/` — aynı pattern.
   - `nakliye/` — iki alt dosya (home, city).

**Her modül için yapılacaklar:**
- `<module>Api.ts` — mevcut API metotlarını taşı, `httpClient` kullan.
- `types.ts` — type'ları bu modüle özel ayır (mevcut 916 satırlık `types.ts`'ten parçala).
- `schemas.ts` — kritik response'lar için zod şemaları.
- `index.ts` — public export.

**Önemli:**
- Mevcut `src/api/`'yi SİLME. Paralel dur. UI hâlâ eskiyi kullanır.
- Backward-compat wrapper (`requestsAPI`) yeni yapıda KURULMAZ.
- `loadUserVehicles` gibi cross-domain operasyonlar `vehicles/` içinde kalır.

**Çıktı:** `@backend/api/*` üzerinden tüm REST erişilebilir.

---

### Phase 3 — WebSocket Core (1 gün)
**Amaç:** WS bağlantıları için ortak base + manager.

Görevler:
1. **`BaseWebSocket.ts`** — Abstract class:
   - Connection lifecycle (connect/disconnect/reconnect).
   - Exponential backoff (1s, 2s, 4s, 8s, max 30s).
   - Heartbeat/ping (opsiyonel).
   - İnternet monitoring (NetInfo).
   - Bounce detection (<2s reconnect bekle).
   - Event emitter pattern (on/off/emit).
   - Auth token header.
2. **`WebSocketManager.ts`** — Singleton:
   - Registry: tüm aktif WS bağlantıları.
   - Logout'ta hepsini kapat.
   - Network değişiminde hepsini yönet.

**Çıktı:** Yeni WS'ler `BaseWebSocket` extend ederek kolayca eklenebilir.

---

### Phase 4 — WebSocket Modülleri (1 gün)
**Amaç:** Jobs ve Location WS'lerini yeni mimaride yaz.

Görevler:
1. **`websocket/jobs/JobsWebSocket.ts`**
   - Service type başına ayrı bağlantı.
   - Event'ler: `new_job`, `job_updated`, `job_cancelled`, `connection_established`.
   - Typed event payload'ları (zod parse).
2. **`websocket/location/LocationWebSocket.ts`**
   - Tracking token bazlı.
   - Event'ler: `connection_established`, `location_update`, `request_accepted/approved/rejected`, `status_update`.
   - Location send (5 sn interval).

**Çıktı:** UI sadece `jobsWS.on('new_job', handler)` gibi basit API kullanır.

---

### Phase 5 — Payment Core + Modülleri (2-3 gün)
**Amaç:** Ödeme yöntemlerini unified interface altında topla.

Görevler:
1. **`payment/base/PaymentProcessor.ts`** — Abstract class:
   ```ts
   abstract class PaymentProcessor {
     abstract validate(input: PaymentInput): Promise<void>;
     abstract process(input: PaymentInput): Promise<PaymentResult>;
     abstract cancel?(): Promise<void>;
   }
   ```
2. **`payment/base/types.ts`**:
   ```ts
   type PaymentMethod = 'iyzico_card' | 'nfc' | 'qr' | 'paypos' | 'saved_card';
   type PaymentResult = { ok: true; transactionId: string } | { ok: false; error: PaymentError };
   ```
3. **`payment/iyzico/`**:
   - `IyzicoProcessor.ts` — 3DS başlat, backend'den HTML al, WebView callback yakala.
   - `threeDSHandler.ts` — URL parse + status çıkar.
4. **`payment/nfc/`**:
   - `NFCProcessor.ts` — state machine (idle→checking→waiting_card→reading→processing→success/error).
   - `nfcReader.ts` — NfcManager wrapper, tag okuma.
5. **`payment/qr/`**:
   - `QRProcessor.ts` — QR oluştur, polling başlat.
   - `qrPolling.ts` — 5 sn interval, 5 dk timeout.
6. **`payment/paypos/`**:
   - `PayPOSProcessor.ts` — deeplink aç, AppState listener, polling.
   - `deeplinkHandler.ts`.
7. **`payment/cards/`**:
   - `cardsApi.ts` — CRUD (list, add, delete, setDefault, updateAlias).
   - `cardValidation.ts` — Luhn, expiry, CVC validation (pure functions).
8. **`payment/PaymentFactory.ts`**:
   ```ts
   export const createPayment = (method: PaymentMethod): PaymentProcessor => {
     switch (method) { ... }
   }
   ```

**Önemli notlar:**
- State machine'ler (NFC/QR/PayPOS) processor içinde, UI sadece state dinler.
- UI (`NFCPaymentModal` vb.) sadece görselleştirme yapar, logic processor'da.
- Animasyonlar UI katmanında kalır.

**Çıktı:** UI `const processor = createPayment('nfc'); await processor.process({...})` kadar basit kullanır.

---

### Phase 6 — Migration Planı (UI Bağlama)
**Amaç:** UI'ı yavaş yavaş yeni backend'e geçir.

**Strateji:** Ekran ekran.

Öncelik sırası (risk × etki):
1. **Düşük riskli, yüksek etki**: ProfileMenuScreen, EarningsScreen, RatingsAndReviewsScreen, AppSettingsScreen.
2. **Orta**: HomeScreen, OrdersScreen, ContractsListScreen.
3. **Yüksek riskli, kritik**: PaymentModal'lar, JobDetailScreen'ler (5 servis tipi), Offer ekranları (7 tip).
4. **En son**: PersonalInfoNewScreen, EditVehicleScreen (kayıt akışı — tamamen test).

Her ekran için:
- Önceki import'ları (`src/api/...`) yenileriyle (`@backend/api/...`) değiştir.
- Hook'ları gözden geçir — business logic hook'a taşı.
- UI değişmez, sadece backend referansları.

**Bir ekran geçince:**
- Test et (manuel + otomatik).
- Commit et (tek ekran = tek commit).

**Tüm ekranlar geçince:**
- `src/api/` klasörünü sil.
- `src/lib/api.ts` sil (legacy).
- Duplicate `notificationStore` vs `useNotificationStore` consolide et.
- Eski store'ları yeni yapıya göre temizle.

---

## 5. MILESTONE'LAR VE TAHMİNİ SÜRE

| Faz | Süre | Bitti kriteri |
|---|---|---|
| Phase 0 — Hazırlık | ½ gün | İskelet + env + lint kuralları hazır |
| Phase 1 — Core | 1 gün | httpClient, logger, errors, storage çalışır |
| Phase 2 — API modülleri | 3-4 gün | 10 modül, tüm endpoint'ler yeni yapıda |
| Phase 3 — WS core | 1 gün | BaseWebSocket + Manager |
| Phase 4 — WS modülleri | 1 gün | Jobs + Location WS yeni yapıda |
| Phase 5 — Payment | 2-3 gün | 4 processor + cards + factory |
| Phase 6 — Migration | 3-5 gün | Tüm UI yeni backend'de |

**Toplam: ~2 hafta** (tek kişi, tam zamanlı).

---

## 6. BAŞLANGIÇ KARARLARI (ÖNCE NETLEŞTİRMELİ)

Uygulamaya başlamadan önce kullanıcıyla netleşecek sorular:

1. **Env yönetimi:** `react-native-dotenv` mı, `expo-constants` mı, `EAS secrets` mi?
2. **Validation:** Zod her yerde mi, sadece kritik endpoint'lerde mi?
3. **State management:** Backend call'ları React Query'ye mi sarılacak, direkt mi kullanılacak? (Önerim: şimdilik direkt, sonra React Query.)
4. **Secure storage geçişi:** Mevcut AsyncStorage'daki token'lar migrate mi edilecek?
5. **Test:** Jest kurulumu bu fazda yapılsın mı, sonraya mı bırakılsın?
6. **Backward-compat wrapper:** Migration sırasında UI'ın her iki API'yi de kullanabilmesi için wrapper gerekli mi?
7. **Backend kodu:** Kullanıcı backend kodunu sağlayacak — endpoint'ler ve şemalar oradan doğrulanacak.

---

## 7. ESKI → YENİ MAPPING TABLOSU

Migration sırasında nereyi nereye taşıyacağının hızlı referansı:

| Eski yol | Yeni yol |
|---|---|
| `src/api/axiosConfig.ts` | `src/backend/core/http/client.ts` + `interceptors.ts` |
| `src/api/auth.ts` | `src/backend/api/auth/authApi.ts` |
| `src/api/vehicles.ts` | `src/backend/api/vehicles/vehiclesApi.ts` + `photoUpload.ts` |
| `src/api/documents.ts` | `src/backend/api/documents/documentsApi.ts` |
| `src/api/profile.ts` | `src/backend/api/profile/profileApi.ts` |
| `src/api/payment.ts` | `src/backend/payment/cards/cardsApi.ts` |
| `src/api/ratings.ts` | `src/backend/api/ratings/ratingsApi.ts` |
| `src/api/types.ts` (916 satır) | Her modülün kendi `types.ts`'ine parçalanır |
| `src/api/requests/towTruck.ts` | `src/backend/api/requests/towTruck/towTruckApi.ts` |
| `src/api/requests/crane.ts` | `src/backend/api/requests/crane/craneApi.ts` |
| `src/api/requests/nakliye.ts` | `src/backend/api/requests/nakliye/{home,city}MovingApi.ts` |
| `src/api/requests/transfer.ts` | `src/backend/api/requests/transfer/transferApi.ts` |
| `src/api/requests/roadAssistance.ts` | `src/backend/api/requests/roadAssistance/roadAssistanceApi.ts` |
| `src/api/requests/cancellation.ts` | `src/backend/api/cancellation/cancellationApi.ts` |
| `src/api/requests/employees.ts` | `src/backend/api/employees/employeesApi.ts` |
| `src/api/requests/employeePanel.ts` | `src/backend/api/employees/employeePanelApi.ts` |
| `src/api/requests/common.ts` | Earnings → `earnings/`, photo upload → `vehicles/`, NFC → `payment/nfc/` |
| `src/services/jobsWebSocket.ts` | `src/backend/websocket/jobs/JobsWebSocket.ts` |
| `src/services/locationWebSocket.ts` | `src/backend/websocket/location/LocationWebSocket.ts` |
| `src/services/fcmService.ts` | `src/backend/core/notifications/` (ayrı tartışma) |
| `src/services/deviceService.ts` | `src/backend/core/device/` (ayrı tartışma) |
| `src/components/payment/NFCPaymentModal.tsx` (logic) | `src/backend/payment/nfc/NFCProcessor.ts` |
| `src/components/payment/QRPaymentModal.tsx` (logic) | `src/backend/payment/qr/QRProcessor.ts` |
| `src/components/payment/PayPOSPaymentModal.tsx` (logic) | `src/backend/payment/paypos/PayPOSProcessor.ts` |
| `src/components/payment/CreditCardSection.tsx` (3DS logic) | `src/backend/payment/iyzico/IyzicoProcessor.ts` |
| `src/lib/api.ts` | **Sil** — duplicate, `src/backend/` ile birleşti |
| `src/lib/notifications.ts` | `src/backend/core/notifications/` |
| `src/tasks/backgroundLocation.ts` | `src/backend/websocket/location/` altına veya ayrı `backgroundTask/` modülü |

---

## 8. RISK YÖNETIMI

| Risk | Önlem |
|---|---|
| Eski kod kırılır | Paralel geliştir, eskiyi silme, UI yavaş geçir |
| Token refresh breaking change | Tek mutex, fallback logout |
| WS reconnect storm | Exponential backoff + max retry |
| Payment flow kırılır | NFC/QR/PayPOS her birini ayrı ayrı test et (real device) |
| Env değişkenleri eksik | `env.ts` içinde validation (uygulama açılışında fail) |
| Migration uzun sürer | Ekran ekran commit, her zaman yayına hazır branch |

---

## 9. BAŞLANGIÇ KONTROL LİSTESİ

Bu plan onaylanırsa, ilk somut adımlar:

- [ ] Kullanıcı: 6. bölümdeki kararlar netleştirilir (env, validation, React Query, vb.).
- [ ] Kullanıcı: Backend kodunu paylaşır, endpoint/şema cross-check edilir.
- [ ] Branch: `refactor/backend-foundation` oluşturulur.
- [ ] Phase 0 — iskelet + env + lint.
- [ ] Phase 1 — core (HTTP, logger, errors, storage).
- [ ] Phase 2 — ilk pilot modül: `auth/` (bitince pattern kesinleşir).
- [ ] Review/feedback, sonra diğer API modülleri.

---

**İlgili dosyalar:**
- [backend-inventory.md](backend-inventory.md) — Mevcut koddaki tüm endpoint/WS/payment noktaları.
- [refactor.md](refactor.md) — Tüm kod tabanı envanteri ve genel refactor hedefleri.

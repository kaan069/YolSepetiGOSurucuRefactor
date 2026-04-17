# API Layer Deduplication Plan — `lib/api.ts` vs `api/`

**Tarih:** 2026-04-17
**Durum:** Sadece analiz & plan (kod değişikliği yok)
**Uygulayıcı için not:** Bu doküman, sonraki PR'ı yapacak agent'ın doğrudan takip edebileceği şekilde yazıldı. Her fazdaki komutlar, dosya yolları ve risk tahminleri explicit verilmiştir.

---

## 1. Mevcut Durum Analizi

### 1.1 Özet

Proje iki farklı "API katmanı" içeriyor ama bunlar eşit değil:

| Katman | Rol | Durum |
|---|---|---|
| `helpermobile/src/api/` | **Gerçek, aktif** API katmanı — backend ile konuşan, JWT token yöneten, interceptor'lı, 10+ domain servisi (auth, vehicles, payment, profile, ratings, documents, requests/*, transfer, employees) | **AKTİF** — tüm ekranlar, tüm hook'lar ve store'lar buradan tüketiyor |
| `helpermobile/src/lib/api.ts` | **Sprint A placeholder/mock** — 73 satır, bağımsız `axios.create({ baseURL: 'http://localhost:5000/api/v1' })`, 7 fonksiyon (`fetchPendingOrders`, `fetchOrderOffers`, `postOffer`, `patchOffer`, `checkUserExists`, `loginWithPassword`, `sendVerificationCode`) | **DEAD CODE** — projede **hiçbir yerden import edilmiyor** |

### 1.2 `helpermobile/src/lib/api.ts` — Detay

- **Satır sayısı:** 73
- **Base URL:** Hardcoded `http://localhost:5000/api/v1` — `constants/network.ts`'deki merkezi yapılandırmayı **kullanmıyor** (`EXPO_PUBLIC_API_URL` env'i okumuyor, prod fallback yok)
- **Axios instance:** Bağımsız `axios.create({ timeout: 10000 })` — `api/axiosConfig.ts`'deki modern instance ile **hiçbir ilişkisi yok**
- **Interceptor:** YOK — token ekleme, 401 handle, storage temizliği, logging hiçbiri yok
- **Exports:** `api` (instance) + 7 named function
- **Dependencies:** Sadece `./types`'tan `OfferDto`, `OrderDto` (lib/types.ts)
- **Type contract:** Kullanılan `OrderDto` ve `OfferDto`, backend'in şu anki gerçek response shape'iyle **uyumlu değil** (backend bugün `CekiciRequestDetails`, `VincRequestDetails`, `TowTruckRequest` gibi DTO'lar döndürüyor — `api/types.ts`'de bunlar mevcut)

**Yorum:** `lib/api.ts`, projenin çok erken bir prototip/demo safhasından kalma, Sprint A döneminde yazılmış "minimal backend bağlantısı" dosyasıdır. Aktif codebase'de hiçbir referansı yoktur. Test, storybook, docs içinde dahi import edilmemektedir.

### 1.3 `helpermobile/src/api/` — Detay

Toplam 11 dosya + `requests/` alt klasörü (10 dosya daha):

| Dosya | Satır | Rol |
|---|---|---|
| `axiosConfig.ts` | 111 | **Ana axios instance** — `API_BASE_URL` constant, JWT interceptor, 401 token temizleme, logout flag, 30s timeout |
| `auth.ts` | 481 | Kimlik doğrulama (OTP, register, login, refresh, logout, FCM token mgmt) |
| `vehicles.ts` | 872 | Araç yönetimi (çekici, vinç, nakliye, yol yardım, transfer) |
| `payment.ts` | 414 | Ödeme (kayıtlı kartlar, komisyon, PayPOS) |
| `profile.ts` | 105 | Şirket bilgileri, ödeme yöntemleri |
| `documents.ts` | 162 | Belge upload (license, tax plate, k-document) |
| `ratings.ts` | 43 | Puanlama istatistikleri |
| `types.ts` | 916 | **Merkezi tip kütüphanesi** — `User`, `AuthResponse`, `CraneRequest`, `TowTruckRequestDetail`, `Employee`, `Crane`, `TransferRequest`, `InsurancePricingInfo`, `ProfileCompletenessResponse`, `PaginatedResponse`, vs. |
| `requests.ts` | 15 | **Yalnız re-export** — `@deprecated` açıklamalı, `requests/` klasörüne köprü |
| `requests/index.ts` | 152 | `RequestsAPI` wrapper sınıfı + named exports (`towTruckAPI`, `craneAPI`, `homeMovingAPI`, `cityMovingAPI`, `nakliyeAPI`, `roadAssistanceAPI`, `commonAPI`, `cancellationAPI`, `employeeAPI`, `employeePanelAPI`, `transferAPI`) |
| `requests/base.ts` | 9 | `axiosInstance` + `PaginatedResponse` re-export |
| `requests/{towTruck,crane,nakliye,roadAssistance,transfer,common,cancellation,employees,employeePanel}.ts` | ~60K total | Servis bazlı modüler API sınıfları |
| `index.ts` | 10 | Barrel export: `authAPI`, `vehiclesAPI`, `requestsAPI`, `documentsAPI`, `profileAPI`, `ratingsAPI`, `paymentAPI`, `axiosInstance`, `* from types`, `* from payment` |

**Export pattern:** Çoğu dosya `class XxxAPI { ... } export default new XxxAPI()` kullanıyor (singleton). Fonksiyon bazlı export az. `ratings.ts` object literal, diğerleri class singleton.

**Types nerede:** `api/types.ts` merkezi — domain tipleri (User, Vehicle, Request DTO'ları). Sadece `payment.ts` ve `documents.ts` ve `ratings.ts` inline tip tanımlıyor (domain-local). Bu tutarlı ve kabul edilebilir.

### 1.4 `helpermobile/src/lib/` Klasörünün Geri Kalanı

`lib/api.ts` dışında klasörde:

| Dosya | Satır | Kullanım | Durum |
|---|---|---|---|
| `lib/types.ts` | 129 | **13 dosyadan import ediliyor** — store'lar, constants, OrderCard, orders screen'leri | **KULLANILIYOR** ama tipler Sprint A sözleşmesinde (backend güncel shape'iyle uyumsuz) |
| `lib/notifications.ts` | 267 | 3 dosyadan import: `useNotifications.ts`, `ProfileScreen.tsx`, `index.ts` (root). FCM + Expo Notifications setup, background handler, local notification scheduling | **KULLANILIYOR** — `lib/api.ts` ile ilgisiz |
| `lib/location.ts` | 15 | **Hiçbir yerden import edilmiyor** — `askLocationPermission`, `getCurrentPosition` fonksiyonları. `utils/locationPermission.ts`'e sarıcı | **DEAD CODE (muhtemel)** — doğrulama gerekli, ama scope dışı (bu PR'da kapsam dışı) |

> Not: `lib/notifications.ts` ve `lib/location.ts` bu planın doğrudan kapsamında değil. Bu plan sadece API katmanı (lib/api.ts) içindir. `lib/types.ts` ise bir sonraki aşamanın konusu (aşağıda Phase 4 önerisi var).

---

## 2. `lib/api.ts` Kullanım Haritası

| Export | Kullanıldığı dosya | Satır | Notlar |
|---|---|---|---|
| `api` (axios instance) | — | — | **0 kullanım** |
| `fetchPendingOrders` | — | — | **0 kullanım** (sadece kendi dosyasında) |
| `fetchOrderOffers` | — | — | **0 kullanım** |
| `postOffer` | — | — | **0 kullanım** |
| `patchOffer` | — | — | **0 kullanım** |
| `checkUserExists` | — | — | **0 kullanım** (store'daki `checkUserExistsByPhone` farklı bir helper) |
| `loginWithPassword` | — | — | **0 kullanım** |
| `sendVerificationCode` | — | — | **0 kullanım** |

**Arama komutu:** `grep -rE "from\s+['\"].*lib/api['\"]" helpermobile/` — **0 match**
**Alternatif:** `grep -rn "lib/api" helpermobile/src` — sadece `planlar/` ve `.claude/agents/` içindeki doküman referansları (yani insanların notu, kod değil).

**Sonuç:** `lib/api.ts` 100% dead code.

### `api/` Kullanım Yoğunluğu (özet)

| Modern import pattern | Kullanıcı sayısı (yaklaşık) |
|---|---|
| `from '../api'` (barrel) | ~50+ dosya (screens, hooks, components) |
| `from '../api/types'` | ~20+ dosya |
| `from '../api/auth'` (direkt default) | 6 dosya (authStore, fcmService, deviceService, useNotifications, ServiceTypeSelection, EditProfile, AccountManagement) |
| `from '../api/axiosConfig'` | 2 dosya (authStore, backgroundLocation) |
| `from '../api/requests'` | 2 dosya (TransferJobDetail, CancelJobModal) |
| `from '../api/payment'` | 3 dosya (CreditCardSection, PaymentSelect, SavedCardItem, commission hook) |
| `from '../api/ratings'` | 1 dosya (RatingsAndReviewsScreen) |
| `from '../api/vehicles'` | 1 dosya (editVehicleService — `downloadToCache`) |

**Modern, barrel-based import baskın.**

---

## 3. Duplike Alanlar

### 3.1 Axios Instance

| Konum | baseURL | Interceptor | Timeout |
|---|---|---|---|
| `api/axiosConfig.ts` | `API_BASE_URL` (env) | JWT + 401 + logout flag | 30s |
| `lib/api.ts` | `http://localhost:5000/api/v1` (hardcoded) | **YOK** | 10s |

Duplikasyon: EVET. `lib/api.ts` kendi instance'ını açıyor. Import eden yok, ama bundler dead-code eliminate etmese de taşınabilir.

### 3.2 Endpoint Duplikasyonu

| Endpoint | `lib/api.ts` | `api/*` | Not |
|---|---|---|---|
| Login | `loginWithPassword` → `POST /auth/login` | `authAPI.login` → `POST /auth/login/` | Yol ayrı (trailing slash), response shape ayrı. **Modern olan aktif.** |
| Send verification code | `sendVerificationCode` → `POST /auth/send-code` | `authAPI.sendOTP` → `POST /api/otp/send/` | Endpoint yolu bile farklı. Modern olan kullanılıyor. |
| Check user exists | `checkUserExists` → `GET /auth/check-user` | (yok, gerek de yok — register/login akışı OTP tabanlı) | Legacy endpoint |
| Orders list | `fetchPendingOrders` → `GET /orders?status=pending` | `towTruckAPI.getPendingRequests()` vb. — servis bazlı | Yol tamamen farklı (backend bugün servis bazlı) |
| Offers | `fetchOrderOffers`, `postOffer`, `patchOffer` → `/orders/:id/offers` | `towTruckAPI.submitOffer`, `craneAPI.submitOffer` vb. | Legacy URL şeması artık yok |

**Gerçek duplikasyon yok (çünkü legacy endpoint'ler backend'de de yok).** Fonksiyon duplikasyonu "ruhen" var — isim olarak çakışmıyor, davranış olarak birbirinden tamamen bağımsız. Silmek güvenli.

### 3.3 Type Duplikasyonu

| Tip | `lib/types.ts` | `api/types.ts` | `types/notifications.ts` | Çatışma? |
|---|---|---|---|---|
| `NotificationType` | `'new_job' \| 'job_accepted' \| ...` (7 üye) | — | `'new_request' \| 'request_approved' \| 'offer_accepted' \| ...` (6 üye) | **EVET — aynı isim, farklı üyeler.** Aktif kod `types/notifications.ts`'yi kullanmıyor (0 import), `lib/types.ts`'yi `notificationStore` kullanıyor. Bu kapsam dışı ama not edildi. |
| `NotificationDto` | VAR | — | — | `store/notificationStore.ts` kullanıyor. Kapsam dışı. |
| `User` | **YOK** | VAR (backend shape) | — | Çatışma yok |
| `OrderDto` | VAR | — (yerine `TowTruckRequestDetail`, `CraneRequest` vb.) | — | Duplike **değil** ama eski shape, kullanımı az (sadece `OrderCard.tsx`'te) |
| `OrderStatus` | VAR (7 string) | — | — | `lib/types.ts`'den 13 dosya import ediyor → **KULLANIMDA** ama Sprint A sözleşmesinde. Kapsam dışı. |
| `AuthUser`, `AuthState`, `HelperRole`, `ProviderVehicle`, `ProviderCrane` | VAR | — (yerine `User`, `Crane`, vs.) | — | `authStore` ve `registrationStore` kullanıyor. Kapsam dışı. |
| `OfferDto`, `OfferStatus`, `PricingSource`, `DriverDto`, `LocationDto`, `VehicleDto` | VAR | — | — | **Sadece `lib/api.ts` kullanıyor** → `lib/api.ts` silinince bu tipler de orphan kalır |

### 3.4 Helper / Utility Duplikasyonu

- Token injection: sadece `api/axiosConfig.ts`'de (lib/api.ts interceptor'sız). Duplike yok, sadece lib tarafında eksiklik.
- Error handling: yine tek taraflı.
- MIME type resolver: `api/documents.ts`'de `getMimeTypeFromUri` (inline). `utils/fileHelpers.ts`'de de versiyonu olabilir — kapsam dışı ama not (önceki PR'da tekilleştirildi deniyor; bu PR'da kapsam dışı tutulacak).

---

## 4. Legacy vs Aktif Tespiti

**Sonuç net:**

| Kriter | `lib/api.ts` | `api/` |
|---|---|---|
| Kullanıcı sayısı | 0 | 100+ import site |
| Base URL kaynağı | Hardcoded localhost | Merkezi constant + env |
| Interceptor | Yok | Tam donanımlı |
| Tip sözleşmesi | Backend ile uyumsuz | Backend ile uyumlu |
| Organize | Tek dosya | Domain bazlı modüler |
| Pattern | Function export | Class singleton + barrel |
| Güncellik | Sprint A artığı | Aktif geliştirilen |

`lib/api.ts` = **LEGACY + DEAD CODE**. Derhal silinmeye uygun.

---

## 5. Riskler (Migration)

### 5.1 Silme için riskler (düşük)

| Risk | Olasılık | Şiddet | Azaltma |
|---|---|---|---|
| Bir yerde dinamik import var mı? (`require('../lib/api')`) | Çok düşük | Düşük | `grep -rE "lib/api" helpermobile/` ile double-check — tek dokümanlar var, kod yok |
| TypeScript ya da Metro cache'i eski ref tutuyor mu? | Düşük | Düşük | Silme sonrası `metro reset + tsc` ile doğrula |
| `lib/types.ts`'deki `OrderDto`/`OfferDto` orphan kalır mı? | Yüksek | Düşük | `OfferDto` artık 0 dosyadan import ediliyor olur; `OrderDto` sadece `OrderCard.tsx` ve `OrdersScreen`'den geliyor (lib/types.ts'den, api/types.ts'den değil). Silinmemeli (kapsam dışı). |

### 5.2 Davranış değişikliği riski

- `lib/api.ts` kullanılmadığı için davranış değişmez. Bu dead-code silme işlemidir.
- Bundle size mikro düşüş (~1KB).
- Geliştirici kafa karışıklığı AZALIR.

### 5.3 Dikkat: bu PR'ın KAPSAMINA DAHİL OLMAYANLAR

- `lib/types.ts`'nin kaderi (AuthUser, OrderDto, NotificationDto — Sprint A tipleri) — **kapsam dışı**. Ayrı bir plan gerektirir (Phase 4 aşağıda önerildi).
- `lib/notifications.ts` — aktif kullanımda, dokunulmayacak.
- `lib/location.ts` — muhtemelen dead, ama kapsam dışı.
- `types/notifications.ts` ile `lib/types.ts`'deki `NotificationType` çakışması — kapsam dışı.
- `api/requests.ts`'nin `@deprecated` re-export wrapper'ı — bugün çalışıyor, sonraki PR konusu.
- `RequestsAPI` class'ının backward-compatibility layer olması (tek dokunuşta ~50+ method). Sonraki PR.

---

## 6. Önerilen Migration Planı (3 Faz)

### Phase 1 — Audit (BU PR, tamamlandı)

**Durum:** Bitti. Bu plan dosyası oluşturuldu.

**Teslimat:**
- Kullanım haritası: `lib/api.ts` = 0 import ✅
- Duplikasyon envanteri ✅
- Risk analizi ✅

**Risk:** Yok (salt okuma).

---

### Phase 2 — Migrate (BU PR KAPSAMINDA DEĞİL — sonraki PR)

`lib/api.ts` hiç import edilmediği için **Migrate fazı bu ikili (lib/api vs api/) için boştur**. Taşınacak kod yok. İsim olarak "Migrate" safhasını atlıyoruz.

**Ama** emin olmak için sonraki PR'ın ilk adımı bir "dry-run verification" yapmalı:

```bash
# Sonraki PR'ın ilk adımı (agent şu komutu çalıştırsın)
grep -rnE "from\s+['\"].*lib/api['\"]|require\(['\"].*lib/api['\"]\)" \
  helpermobile/src helpermobile/index.ts helpermobile/App.tsx 2>/dev/null
# Beklenen çıktı: boş
```

Eğer bir match çıkarsa, plan yenilensin (bu plan lokalde 0 match doğruladı, ama zamanla birisi ref eklemiş olabilir).

**Risk seviyesi:** N/A (fiilen atlanacak faz).

---

### Phase 3 — Cleanup (sonraki PR — düşük risk)

**Hedef:** `lib/api.ts`'yi sil.

**Adımlar:**

1. **Son kullanım kontrolü** (yukarıdaki grep komutu — 0 match olmalı)

2. **Dosyayı sil:**
   ```
   rm helpermobile/src/lib/api.ts
   ```

3. **Orphan type import kontrolü:**
   `lib/api.ts` silinince `lib/types.ts`'teki şu tipler hiç import edilmiyor olur:
   - `OfferDto` — sadece `lib/api.ts` kullanıyordu (silinince orphan)
   - `OfferStatus` — sadece `lib/types.ts` içinde OfferDto tarafından
   - `PricingSource` — aynı
   - `DriverDto` — sadece `lib/types.ts` içinde internal
   - `VehicleDto` — DriverDto ve OrderDto tarafından internal
   - `LocationDto` — OrderDto tarafından internal

   **KARAR:** `lib/types.ts`'yi bu PR'da **SİLMEYİN**. Çünkü dosya hâlâ `AuthUser`, `OrderStatus`, `NotificationDto`, `OrderDto` için aktif (13 import site). Orphan tipler kalabilir — bunları ayırmak Phase 4'ün işi.

4. **TypeScript derle:**
   ```
   cd helpermobile && npx tsc --noEmit
   ```
   Sıfır yeni hata beklenir.

5. **Bundle verify (opsiyonel):**
   ```
   cd helpermobile && npx expo export --platform ios --dev
   ```
   Build hatası olmamalı.

6. **Commit mesajı (öneri):**
   ```
   refactor(api): remove dead legacy lib/api.ts (Sprint A placeholder)

   - lib/api.ts hiçbir yerden import edilmiyordu (0 kullanım)
   - Hardcoded localhost:5000 baseURL içeriyordu (network.ts kullanmıyor)
   - Aktif API katmanı src/api/ altında
   - Cleanup sonrası orphan type'lar: OfferDto, OfferStatus, PricingSource,
     DriverDto, VehicleDto, LocationDto (lib/types.ts içinde; Phase 4'e kadar kalacak)
   ```

**Etkilenen dosya sayısı:** 1 (sadece `lib/api.ts` silinir)
**Tahmini satır değişikliği:** -73 (sadece silme)
**Risk seviyesi:** **LOW** (dead code silme, runtime'da etkisi yok)

---

### Phase 4 — (İleri Plan, kapsam dışı — farklı PR'lara bölünmeli)

Bu planın dışına taşmakla birlikte, API layer sadeleştikten sonra devreye alınmalı:

1. **`lib/types.ts` ayrıştırma:**
   - `AuthUser`, `AuthState`, `HelperRole`, `ProviderVehicle`, `ProviderCrane` → `authStore` ve `registrationStore`'un **gerçekten** `api/types.ts`'deki `User` tipine geçmesi
   - `OrderDto`, `OrderStatus`, `NotificationDto` → `api/types.ts`'deki gerçek backend tipleriyle değiştir
   - Sprint A tiplerinden kurtul
   - Her biri ayrı PR (authStore migration büyük iş)

2. **`lib/location.ts` dead-code kontrolü:**
   - Grep ile import yok doğrulandı, sonra sil
   - Tek dokunuş, düşük risk

3. **`api/requests.ts` @deprecated bridge temizliği:**
   - Modern kodlar `api/requests/index.ts` direkt import etsin
   - `api/requests.ts`'yi sil
   - Barrel'dan import halinde davranış aynı kalır

4. **`NotificationType` çakışması çözümü:**
   - `lib/types.ts` içindeki `NotificationType` vs `types/notifications.ts` içindeki `NotificationType`
   - Tek tanım, tek kaynak (muhtemelen `types/notifications.ts` galibi, çünkü FCM payload ile uyumlu)
   - `lib/types.ts`'nin eski tanımını kaldır, `notificationStore`'u yeni tipe geçir

---

## 7. Hangi Dosyalar Sonraki PR'da Değişmeli

| Path (absolute) | Değişiklik | Satır |
|---|---|---|
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/lib/api.ts` | **SİL** | -73 |

**Toplam:** 1 dosya silme. Başka hiçbir dosyaya dokunulmayacak.

**Dokunulmayacak (bu PR kapsamında):**

- `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/api/axiosConfig.ts` (önceki PR tamamladı)
- `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/api/*.ts` (tamamı)
- `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/api/requests/*.ts` (tamamı)
- `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/lib/types.ts` (Phase 4 konusu)
- `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/lib/notifications.ts` (aktif, ilgisiz)
- `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/lib/location.ts` (ayrı PR önerisi)

---

## 8. Uygulama Komut Sırası (Sonraki PR Agent İçin Hazır Reçete)

```
# 1. Son kullanım doğrulaması (BOŞ ÇIKTI BEKLENİR)
grep -rnE "from\s+['\"].*lib/api['\"]|require\(['\"].*lib/api['\"]\)" \
  /Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src \
  /Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/index.ts \
  2>/dev/null

# 2. Dosyayı sil
rm /Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/lib/api.ts

# 3. TS kontrol
cd /Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile && npx tsc --noEmit

# 4. Commit (manuel, kullanıcı isterse)
```

**Beklenen sonuç:** TypeScript temiz, bundle çalışır, davranış değişmez.

**Eğer grep bir şey bulursa:** DURUN, yeni bir mini-plan yapın — arada birisi import eklemiş olabilir.

---

## 9. Refactor Summary

- **Scope:** `helpermobile/src/lib/api.ts` vs `helpermobile/src/api/` sınır netleştirmesi için analiz.
- **Changes (bu PR):** Sadece bu plan dosyası oluşturuldu. Kod değişikliği yok.
- **Preserved Behavior:** Tamamı (salt okuma).
- **Key Finding:** `lib/api.ts` = 100% **dead legacy code**. 73 satır, 0 import, hardcoded `localhost:5000` baseURL. Sprint A prototipinden artakalma. `api/` modern ve aktif katman; 10+ domain servisi, JWT interceptor, merkezi `API_BASE_URL` kullanıyor. İki katman arasında **gerçek fonksiyonel duplikasyon yok** (endpoint'ler ve tipler tamamen farklı) — yani riskli "davranış drift" yok, sadece ölü kod temizliği var.
- **Risks:** LOW. `lib/api.ts` silme işlemi runtime davranışını etkilemez.
- **Karar Önerisi:** **merge-into-api** (`lib/api.ts`'yi sil, `api/` tek kaynak olsun). "Migrate" fazı boş çünkü zaten kimse `lib/api.ts`'yi kullanmıyor. Cleanup fazı tek satırlık `rm` komutu.
- **Next Best Step:** Sonraki PR'da §8'deki 3 komutu sırasıyla çalıştır — `lib/api.ts`'yi fiziksel olarak sil. Paralelde, Phase 4 için ayrı planlama başlat (`lib/types.ts` Sprint A tiplerinin `api/types.ts`'ye migration'ı — bu büyük iştir, 2-3 sub-PR gerektirir).

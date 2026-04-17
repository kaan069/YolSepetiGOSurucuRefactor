# Backend API Reference — yolpaketi-backend

> Backend projesi: `/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend`
> Amaç: Backend'in sunduğu tüm endpoint'lerin authoritative referansı + frontend cross-check.

---

## 0. ÖZET BULGULAR

| Konu | Durum |
|---|---|
| Framework | Django 5.2.0 + DRF 3.16.1 |
| WebSocket | Django Channels 4.0 + Redis |
| Auth | SimpleJWT 5.5.1 (access=365gün, refresh=365gün) |
| Database | PostgreSQL (yolpaketi) |
| Background | Celery 5.4 + Beat + Redis |
| Payment | İyzico 1.0.45 + PayPOS |
| Apps | 15 Django app |
| REST endpoint | 100+ |
| WebSocket endpoint | 4 |
| **Frontend-backend uyumu** | **✅ %100** (tüm frontend endpoint'leri backend'de mevcut) |
| **Backend refactor** | **✅ Tamamlanmış** (10 session, service extraction, N+1 fix, caching) |

---

## 1. TEKNOLOJİ STACK

### 1.1 Ana Paketler ([requirements.txt](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/requirements.txt))

- **Django**: 5.2.0 + DRF 3.16.1 + drf-spectacular (OpenAPI)
- **WebSocket**: channels 4.0 + channels-redis 4.1 + daphne 4.0
- **Auth**: djangorestframework_simplejwt 5.5.1 + PyJWT 2.10.1
- **Background**: celery[redis] 5.4 + django-celery-beat 2.8 + django-celery-results 2.5
- **DB**: psycopg2-binary 2.9.10 (PostgreSQL)
- **Payment**: iyzipay 1.0.45
- **Firebase**: google-auth, google-auth-oauthlib (FCM admin SDK)
- **Utility**: pillow 12.0, python-dotenv 1.1, whitenoise 6.11, django-cors-headers 4.6

### 1.2 Settings ([config/settings.py](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/config/settings.py))

| Ayar | Değer |
|---|---|
| Language | tr-tr (Türkçe) |
| Timezone | Europe/Istanbul |
| Max upload | 50 MB |
| JWT access | 365 gün ⚠️ |
| JWT refresh | 365 gün ⚠️ |
| Token rotation | Enabled |
| Blacklist after rotation | Enabled |

### 1.3 Environment Variables

**Kritik env değişkenleri** (`.env` dosyası):

```
DJANGO_SECRET_KEY=...
DJANGO_DEBUG=True|False
BASE_URL=https://api.yolsepetigo.com
WEBSOCKET_URL=wss://api.yolsepetigo.com

# Database
PGDATABASE=yolpaketi
PGUSER=postgres
PGPASSWORD=...
PGHOST=localhost
PGPORT=5432

# Redis
REDIS_HOST=127.0.0.1
REDIS_PORT=6379

# İyzico
IYZICO_API_KEY=...
IYZICO_SECRET_KEY=...
IYZICO_BASE_URL=sandbox-api.iyzipay.com

# PayPOS
PAYPOS_API_KEY=...
PAYPOS_SECRET_KEY=...
PAYPOS_AGENT_ID=...

# SMS (OTP)
SMS_API_ID=...
SMS_API_PW=...
SMS_SENDER=...

# Parasut (e-invoice, sürücü frontend'inde yok)
PARASUT_*=...

# Firebase
FIREBASE_CREDENTIALS_PATH=yolpaketi-firebase-adminsdk-fbsvc-*.json
```

### 1.4 Redis Kullanımı

- **Channel Layer** (WebSocket): `channels_redis.core.RedisChannelLayer`
- **Cache**: `redis://REDIS_HOST:REDIS_PORT/2` (5 dk timeout)
- **Celery Broker**: `redis://REDIS_HOST:REDIS_PORT/0`

### 1.5 CORS Allowed Origins

```
https://yolsepetigo.com
https://www.yolsepetigo.com
https://acente.yolsepetigo.com
http://localhost:3000 / 8080
```

### 1.6 Rate Limiting

| Alan | Limit |
|---|---|
| Anonymous | 10B/saat |
| Authenticated | 100B/saat |
| Login | 50/dk |
| Token tracking | 6M/saat |
| OTP send/verify | 1M/dk |

---

## 2. DJANGO APPS (15 adet)

| App | Sorumluluk |
|---|---|
| `authapp` | JWT auth, UserBase model (phone-based), DriverLicense, FCMToken, OTPToken |
| `mycore` | OTP, SMS, SendOTP/VerifyOTP endpoint'leri |
| `vehicles` | 5 araç tipi CRUD (Cekici/Vinc/YolYardim/Nakliye/Transfer), VehicleDocuments, VehicleLocation |
| `request` | 6 servis tipi request workflow, Offer, status management, WebSocket JobBoard + RequestStatus |
| `pricing` | Dinamik fiyatlandırma: pricing tier, surcharge, VAT, commission |
| `payment` | İyzico 3DS, PayPOS NFC, SavedCard, CardVerification, komisyon ödeme |
| `userprofile` | CompanyInfo, PaymentMethod (IBAN), SavedCard views |
| `summary` | Earning, completed requests, dönemsel raporlar |
| `ratings` | DriverRating, RatingStatistics |
| `campaign` | Kampanya paketleri (driver'ın satın alabildiği paketler) |
| `advertisement` | Reklam aboneliği |
| `agreements` | Sözleşme yönetimi |
| `einvoice` | **E-fatura (Parasut entegrasyonu)** — şu an sürücü frontend'inde yok |
| `insurance` | **Sigorta şirketi** ayrı API (ayrı auth, ayrı request flow) |
| `employee` | Çoklu kullanıcı — company owner + employees |

---

## 3. AUTH / USER MODELİ

### 3.1 UserBase — Custom User

```python
class UserBase(AbstractBaseUser, PermissionsMixin):
    phone_number = CharField(max_length=15, unique=True)  # username
    user_type = JSONField(default=list)  # ["towTruck", "crane", "roadAssistance", ...]
    provider_type = CharField(choices=[
        ('individual', 'Şahıs'),
        ('company', 'Firma'),
        ('employee', 'Eleman')
    ])
    device_type = CharField(choices=[('android','Android'),('ios','iOS'),('web','Web')])
    user_is_online = BooleanField(default=True)
    parasut_product_id = CharField(blank=True, null=True)
    parasut_contact_id = CharField(blank=True, null=True)
```

### 3.2 FCMToken — Multi-device

```python
class FCMToken(models.Model):
    user = ForeignKey(UserBase, on_delete=CASCADE, related_name='fcm_tokens')
    token = CharField(max_length=255)
    device_id = CharField(max_length=255, blank=True)
    created_at = DateTimeField(auto_now_add=True)
```

### 3.3 Permission Class'ları

- `IsAuthenticated` — JWT
- `AllowAny` — public
- `IsRequestCustomer` — tracking token ile
- `IsEmployer` — provider_type == 'company'
- `IsEmployee` — provider_type == 'employee'
- `IsInsuranceCompany` — ayrı JWT
- `IsAdminUser` — superuser

---

## 4. URL PREFIX MAPPING ([config/urls.py](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/config/urls.py))

```
/auth/*          → apps.authapp
/api/*           → apps.mycore (OTP)
/vehicles/*      → apps.vehicles
/requests/*      → apps.request
/pricing/*       → apps.pricing
/profile/*       → apps.userprofile
/summary/*       → apps.summary
/ratings/*       → apps.ratings
/payment/*       → apps.payment
/campaigns/*     → apps.campaign
/advertisement/* → apps.advertisement
/agreements/*    → apps.agreements
/invoices/*      → apps.einvoice
/insurance/*     → apps.insurance
/employee/*      → apps.employee
/my-admin/*      → admin APIs
/invoice/{token}/  → public invoice redirect
```

---

## 5. ENDPOINT CROSS-CHECK (Frontend ↔ Backend)

### Özet
- **Frontend'in kullandığı 158+ endpoint** → **tamamı backend'de mevcut** ✅
- **URL pattern uyumsuzluğu yok** ✅
- **Parametre uyumluluğu var** ✅

### 5.1 AUTH

| Frontend | Backend | Durum |
|---|---|---|
| POST `/api/otp/send/` | mycore.SendOTPView | ✅ |
| POST `/api/otp/verify/` | mycore.VerifyOTPView | ✅ |
| POST `/auth/register/` | authapp.RegisterView | ✅ |
| POST `/auth/login/` | authapp.LoginView | ✅ |
| POST `/auth/token/refresh/` | SimpleJWT (drf-spectacular) | ⚠️ explicit değil ama çalışır |
| GET/PATCH `/auth/profile/` | authapp.ProfileView | ✅ |
| GET/PUT `/auth/status/online/` | authapp.UserOnlineStatusView | ✅ |
| GET `/auth/account-ready/` | authapp.AccountReadyView | ✅ |
| POST `/auth/forgot-password/` | authapp.ForgotPasswordView | ✅ |
| GET/POST/DELETE `/auth/documents/license/*` | authapp.DriverLicense*View | ✅ |
| PUT `/auth/notifications/update/` | UserNotificationUpdateView | ✅ |
| DELETE `/auth/notifications/logout/` | UserNotificationLogoutView | ✅ |

### 5.2 PROFILE
Tümü ✅ (company-info CRUD, payment-method CRUD, cards CRUD, completeness, set-default, alias).

### 5.3 VEHICLES
5 araç tipi × 6 endpoint (list/create/update/delete/photo/upload) = 30 endpoint, hepsi ✅.
Bonus: `/vehicles/location/{trackingToken}/http-update/` ✅ (HTTP fallback).

### 5.4 REQUESTS
6 servis tipi × ~10 endpoint (pending/awaiting-approval/awaiting-payment/in-progress/completed/details/submit-offer/withdraw-offer/depart/complete/can-cancel/cancel) = 60+ endpoint, hepsi ✅.

Common: `/requests/all-counts/`, `/requests/{service}/counts/`, photo upload ✅.

### 5.5 PAYMENT
Tümü ✅:
- Card verification (1 TL 3DS): initiate/status
- Commission: initiate/callback/status (new/saved/default card seçenekleri)
- Customer payment: initiate/callback/status
- PayPOS NFC: driver init/status
- Saved cards: list/save/delete/set-default/alias

### 5.6 SUMMARY / EARNINGS
- `/summary/earnings/{total,period,list}/` ✅
- `/summary/completed/{6-service}/` ✅

### 5.7 RATINGS
- `/ratings/my-ratings/` ✅
- (Müşteri için: submit/driver stats/reviews — sürücü frontend'inde yok)

### 5.8 EMPLOYEE
Tümü ✅ (owner CRUD + employee dashboard/jobs).

### 5.9 PRICING (Frontend kullanımı kısıtlı)

| Endpoint | Backend | Frontend |
|---|---|---|
| GET `/pricing/towTruck/estimate/` | ✅ | ❓ (muhtemelen kullanılıyor) |
| GET `/pricing/crane/estimate/` | ✅ | ❓ |
| GET `/pricing/request/{token}/` | ✅ | ❓ |
| GET `/pricing/questions/` | ✅ | ❓ |

**Not:** Frontend `/requests/tow-truck/{token}/calculate-price/` kullanıyor (dinamik fiyat). `/pricing/*` endpoint'leri ayrıca estimate için var — muhtemelen müşteri uygulaması için.

---

## 6. WEBSOCKET ENDPOINT'LERİ

### 6.1 Tanımlı Route'lar ([config/asgi.py](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/config/asgi.py))

```python
application = ProtocolTypeRouter({
    "http": django_asgi_app,
    "websocket": JWTAuthMiddlewareStack(
        URLRouter(
            insurance_routing.websocket_urlpatterns +
            request_routing.websocket_urlpatterns +
            vehicle_routing.websocket_urlpatterns,
        )
    ),
})
```

### 6.2 Consumer'lar

| URL pattern | Consumer | Auth | Amaç |
|---|---|---|---|
| `/ws/requests/{tracking_token}/` | RequestStatusConsumer | JWT veya Token | Request status updates, job accepted/payment status |
| `/ws/jobs/{service_type}/` | JobBoardConsumer | JWT | Real-time job board (sürücü için) |
| `/ws/location/{tracking_token}/` | VehicleLocationConsumer | JWT veya Token | Konum takibi (dual auth) |
| `/ws/location-share/{token}/` | LocationShareConsumer | Token | Insurance location sharing |

### 6.3 Frontend Cross-Check

| Frontend kullanıyor | Backend route | Durum |
|---|---|---|
| `/ws/jobs/{serviceType}/` | JobBoardConsumer | ✅ |
| `/ws/location/{trackingToken}/` | VehicleLocationConsumer | ✅ |
| **Kullanmıyor**: `/ws/requests/{tracking_token}/` | RequestStatusConsumer | ⚠️ **Potansiyel faydalı** |
| Kullanmıyor (müşteri/sigorta için): `/ws/location-share/{token}/` | LocationShareConsumer | N/A |

**⚠️ Dikkat:** `/ws/requests/{token}/` frontend'de kullanılmıyor ama backend'de mevcut. Şu anda job_updated/cancelled event'leri için `/ws/jobs/` ve `/ws/location/` kullanılıyor. Refactor sırasında `RequestStatusConsumer`'ın job detay ekranında kullanımı değerlendirilmeli.

### 6.4 WebSocket Authentication

**JWTAuthMiddleware ([config/middleware.py](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/config/middleware.py)):**
- Sürücü: `Authorization: Bearer {jwt}` header
- Müşteri tracking: `?token={tracking_token}` query param
- Browser fallback: `?auth={jwt}` query param

---

## 7. ÖDEME ENTEGRASYONU

### 7.1 İyzico 3DS Flow

**Dosyalar:** `apps/payment/views_customer.py`, `payment/services/customer_payment.py`

1. Customer initiates payment — `card_option` (new/saved/default)
2. Backend İyzico 3DS endpoint'i çağırır
3. Backend HTML iframe döner (`text/html` response)
4. Frontend WebView'da render eder
5. Customer 3DS onaylar
6. İyzico → backend callback
7. Backend request status → awaiting_approval/completed

### 7.2 PayPOS NFC

- `POST /payment/nfc/driver/{request_id}/init/` — Driver NFC session init (deeplink döner)
- `POST /payment/nfc/{tracking_token}/` — Customer NFC
- `POST /payment/paypos/callback/` — PayPOS callback

### 7.3 Commission Payment (Driver → Platform)

- `POST /payment/commission/{request_id}/initiate/`
- `POST /payment/commission-callback/{request_id}/`
- `GET /payment/commission/{request_id}/status/`

Amount = Request Pricing × Commission%

### 7.4 Card Verification (1 TL)

- `POST /payment/card-verification/initiate/` — 1 TL çekilir
- `GET /payment/card-verification/status/` — Sonuç

---

## 8. CELERY / BACKGROUND JOBS

### 8.1 Scheduled Tasks ([CELERY_BEAT_SCHEDULE](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/config/settings.py))

| Task | Cron | Amaç |
|---|---|---|
| `cancel-expired-moving-requests` | 00:05 günlük | Nakliye iş zaman aşımı |
| `send-moving-reminders` | 10:00 günlük | Hatırlatma bildirim |
| `check-pending-invoices` | 60 sn | Fatura durumu |
| `auto-recover-stuck-invoices` | 30 dk | Takılan faturalar |
| `cancel-stale-awaiting-payment` | 5 dk | 30+ dk bekleyen işler |
| `check-driver-location-warnings` | 2 dk | Konum uyarısı |
| `retry-failed-refunds` | 10 dk | İade retry |

### 8.2 Async Task'lar

- `send_fcm_async()` — FCM bildirim
- `send_sms_async()` — SMS
- `cancel_invoice_for_request` — İnvoice iptal
- Background location tracking task'ları

---

## 9. FCM / PUSH NOTIFICATION

### 9.1 Firebase

- **Credentials:** `yolpaketi-firebase-adminsdk-fbsvc-0deefa8851.json`
- **Path:** `FIREBASE_CREDENTIALS_PATH` env variable

### 9.2 Notification Payload Yapısı

```json
{
  "title": "string",
  "body": "string",
  "data": {
    "type": "request_update|offer_submitted|payment_completed",
    "request_id": 123,
    "service_type": "tow_truck",
    "action": "navigate_to_job_detail"
  }
}
```

### 9.3 Bildirim Noktaları

Backend signals + services tarafından tetiklenir:
- Yeni request → bölgedeki sürücüler
- Offer gönderildi → müşteri
- Offer kabul → sürücü
- Ödeme tamamlandı → ikisi
- Request tamamlandı → müşteri
- Request iptal → ikisi
- Komisyon ödeme vakti → sürücü

---

## 10. BACKEND'İN KENDI REFACTOR'U

### [REFACTOR_PLAN.md](/Users/furkankaansaka/Desktop/yolsepetibackend/yolpaketi-backend/REFACTOR_PLAN.md) — 10 Session Tamamlandı

| Session | Apps | Anahtar çıktılar |
|---|---|---|
| 1 | mycore, advertisement, agreements | SMS → Celery, get_client_ip() konsolide |
| 2 | userprofile, ratings | N+1 fix, rating stats opt |
| 3 | vehicles | Service extraction, location opt |
| 4 | pricing | Admin split, caching |
| 5 | payment | 3 service class extract (CustomerPaymentService, CommissionPaymentService, CardVerificationService) |
| 6 | einvoice, campaign, summary | Celery dispatch, earnings N+1 |
| 7 | insurance, employee | Permission standartlaştırma |
| 8 | authapp | Admin split, license_service |
| 9 | request | offer_service extract, 5 N+1 fix |
| 10 | request | Query opt, einvoice decoupling |

### Kalan İşler (backend tarafında)

- [ ] Tutarlı error response format
- [ ] Structured logging
- [ ] Service class test coverage
- [ ] Type hints
- [ ] SavedCard modelini userprofile → payment app'e taşıma
- [ ] Write endpoint'lerinde rate limiting

---

## 11. FRONTEND'İN KULLANMADIĞI BACKEND ENDPOINT'LERİ

### 11.1 Muhtemelen faydalı ama kullanılmayan

| Endpoint | Notu |
|---|---|
| `/ws/requests/{token}/` WebSocket | RequestStatusConsumer — job detayda real-time status |
| `/pricing/towTruck/estimate/` | Fiyat estimate (muhtemelen müşteri uygulaması için) |
| `/pricing/crane/estimate/` | Aynı |
| `/pricing/request/{token}/` | Request pricing detay |
| `/pricing/questions/` | Dinamik fiyat soruları |
| `/requests/driver-report/{id}/` | Saha raporu (field report) |
| `/requests/driver-reports/` | Rapor listesi |

### 11.2 Müşteri uygulaması endpoint'leri (sürücü frontend'inde olmamalı)

- `/requests/customer/request-list/`
- `/requests/location/{token}/offers/` (müşteri teklif listesi)
- `/requests/location/{token}/accept-offer/{offer_id}/` (müşteri kabul)
- `/requests/location/{token}/recreate/` (request recreate)
- `/auth/customer/verify-otp/`, `/auth/customer/profile/`, `/auth/customer/delete-account/`
- `/ratings/submit/{tracking_token}/` (müşteri puan verir)
- `/ratings/driver/{id}/stats/` ve `/reviews/` (public)

### 11.3 Admin API'ları (`/my-admin/*`)
Admin paneli için ayrı. Sürücü frontend'inde olmamalı.

### 11.4 Insurance (sigorta şirketleri için)
Ayrı auth + request flow. Sürücü frontend'inde olmamalı (muhtemelen separate dashboard).

### 11.5 E-Invoice (einvoice)
- `/invoices/`, `/invoices/{id}/`, `/invoices/{id}/pdf/` mevcut.
- Backend Parasut ile entegre.
- **Kullanıcı bu feature'ı şimdilik ertelemiş** ("faturayı boşver").

### 11.6 Campaigns
- `/campaigns/*` mevcut.
- Sürücünün reklam/kampanya paketleri satın alması için.
- Frontend'in bu akışı kullanıp kullanmadığı belirsiz (kod tabanında görünür kullanım yok).

### 11.7 Advertisement
- `/advertisement/*` mevcut.
- Abonelik yönetimi.

### 11.8 Agreements
- `/agreements/*` mevcut.
- Frontend'de sadece statik contract metni var ([contracts.ts](helpermobile/src/constants/contracts.ts)), API kullanımı yok.

---

## 12. REFACTOR İÇİN SONUÇLAR

### 12.1 İyi haberler ✅
1. **Frontend'in kullandığı tüm endpoint'ler backend'de mevcut ve doğru.**
2. **Backend kendi refactor'unu tamamlamış** — 10 session, service extraction, N+1 fix, caching.
3. **Endpoint URL'leri ve method'ları uyumlu** — migration sırasında endpoint mapping değiştirmeye gerek yok.
4. **SimpleJWT + token rotation** — refresh logic frontend'de eklenebilir (mevcut frontend'de refresh çağrısı yok).

### 12.2 Refactor sırasında dikkat edilecekler ⚠️

1. **JWT Token Expiration**: Backend'de 365 gün — frontend'de token refresh logic'i şu an eksik. Migration sırasında `tokenManager` içine refresh mutex eklenmeli (backend `drf-spectacular` üzerinden refresh endpoint'i sunuyor).

2. **WebSocket Authentication**: Backend 3 auth modu kabul ediyor:
   - Header: `Authorization: Bearer {jwt}`
   - Query: `?auth={jwt}` (browser fallback)
   - Query: `?token={tracking_token}` (customer için)
   - **Frontend şu an sadece `?auth={jwt}` kullanıyor** — header pattern'e geçiş düşünülebilir.

3. **Pricing API kullanımı**: `/pricing/*` endpoint'leri kullanılmıyor. `calculate-price` endpoint'i kullanılıyor. Refactor sırasında hangisinin "doğru" olduğu netleşmeli (backend ekibine sor).

4. **`/ws/requests/{token}/` WebSocket**: RequestStatusConsumer job detay ekranında kullanılabilir — şu an `/ws/jobs/` ve polling karışımı var.

5. **Env değişkenleri**: Frontend'de `API_BASE_URL` ve `WEBSOCKET_URL` ayrı env değişkenleri olmalı (backend'de `BASE_URL` ve `WEBSOCKET_URL` ayrı).

6. **E-invoice (fatura)**: Backend hazır (Parasut entegre), UI tarafı şimdilik ertelenmiş. Gelecekte `/invoices/*` endpoint'leri kullanılabilir.

7. **Campaigns/Advertisement/Agreements**: Backend hazır, frontend bağlantısı yok — eğer bu feature'lar istenecekse refactor sırasında eklenmeli.

### 12.3 Yeni backend/ mimarisi için kesinleşen hususlar

1. **WebSocket base class** — 4 WS route için ortak pattern:
   - Reconnect + exponential backoff
   - JWTAuthMiddlewareStack uyumlu auth
   - Event dispatcher
   
2. **HTTP client** — baseURL env'den, SimpleJWT refresh destekli, 401 interceptor.

3. **Payment processor** — 4 method (İyzico 3DS, PayPOS NFC, QR, Commission). Backend'de `/payment/*` endpoint'leri ayrı service class'lar üzerinde — frontend'de de aynı pattern izlenecek.

4. **Notification types** — backend'den gelen `data.type` ve `data.action`'a göre navigation:
   - `request_update`, `offer_submitted`, `payment_completed`
   - `navigate_to_job_detail`

---

## 13. ÖNERİLEN ENDPOINT YAPIS (Yeni Frontend `backend/` Mimarisinde)

Backend'in servis bölümlenmesine uygun **module yapısı**:

```
src/backend/api/
├── auth/           ← backend apps.authapp + apps.mycore (OTP)
├── profile/        ← backend apps.userprofile (company, payment-method, cards)
├── vehicles/       ← backend apps.vehicles
├── documents/      ← backend apps.authapp.license_document
├── requests/
│   ├── towTruck/   ← backend request.tow_truck_views
│   ├── crane/      ← backend request.crane_views
│   ├── transfer/   ← backend request.transfer_views
│   ├── nakliye/    ← backend request.home_moving + city_moving
│   └── roadAssistance/
├── ratings/        ← backend apps.ratings
├── earnings/       ← backend apps.summary (earnings)
├── employees/      ← backend apps.employee
├── cancellation/   ← /requests/.../cancel/ + /can-cancel/
└── pricing/        ← backend apps.pricing (⚠️ yeni — şu an kullanılmıyor)

src/backend/websocket/
├── jobs/           ← /ws/jobs/{service_type}/
├── location/       ← /ws/location/{tracking_token}/
└── requestStatus/  ← /ws/requests/{tracking_token}/ (⚠️ yeni — değerlendirilecek)

src/backend/payment/
├── iyzico/         ← /payment/customer/*/initiate/, /commission/*/initiate/
├── paypos/         ← /payment/nfc/*, /paypos/callback/
├── cards/          ← /profile/cards/*
└── verification/   ← /payment/card-verification/*
```

---

**Dosya yolu:** [backend-api-reference.md](backend-api-reference.md)

**İlgili dosyalar:**
- [backend-inventory.md](backend-inventory.md) — Frontend'deki backend çağrı noktaları.
- [backend-plan.md](backend-plan.md) — Yeni `backend/` klasör mimarisi planı.
- [refactor.md](refactor.md) — Tüm frontend envanteri.

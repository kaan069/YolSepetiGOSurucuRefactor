# Backend Entegrasyon Envanteri

> Mevcut koddaki tüm backend entegrasyon noktalarının tek merkezli referansı.
> Refactor öncesi "neyimiz var" sorusunu net cevaplamak için.

---

## ÖZET

| Kategori | Sayı |
|---|---|
| HTTP endpoint | **158+** |
| WebSocket bağlantısı | **7** (jobs × 6 servis + location) |
| Ödeme yöntemi | **4** (Iyzico 3DS, NFC/PayPOS, QR placeholder, Commission) |
| AsyncStorage key | **18+** |
| Background task | **1** (background-location-task) |
| Hardcoded URL noktası | **7** |

---

## 1. HTTP / REST API

### 1.1 Authentication

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| POST | `/api/otp/send/` | [auth.ts:33](helpermobile/src/api/auth.ts#L33) | Kayıt için SMS OTP |
| POST | `/api/otp/verify/` | [auth.ts:69](helpermobile/src/api/auth.ts#L69) | OTP doğrula, verification_token |
| POST | `/auth/register/` | [auth.ts:116](helpermobile/src/api/auth.ts#L116) | Yeni sürücü kaydı (2dk timeout) |
| POST | `/auth/login/` | [auth.ts:171](helpermobile/src/api/auth.ts#L171) | Giriş |
| POST | `/auth/token/refresh/` | [auth.ts:236](helpermobile/src/api/auth.ts#L236) | Access token yenile |
| GET | `/auth/profile/` | [auth.ts:271](helpermobile/src/api/auth.ts#L271) | Profil getir |
| PATCH | `/auth/profile/` | [auth.ts:299](helpermobile/src/api/auth.ts#L299) | Profil güncelle |
| PATCH | `/auth/profile/` | [auth.ts:316](helpermobile/src/api/auth.ts#L316) | User type güncelle |
| GET | `/auth/status/online/` | [auth.ts:370](helpermobile/src/api/auth.ts#L370) | Online status |
| PUT | `/auth/status/online/` | [auth.ts:392](helpermobile/src/api/auth.ts#L392) | Online status güncelle |
| GET | `/auth/account-ready/` | [auth.ts:381](helpermobile/src/api/auth.ts#L381) | Hesap hazırlık kontrolü |
| POST | `/auth/forgot-password/` | [auth.ts:355](helpermobile/src/api/auth.ts#L355) | Şifre sıfırlama |
| PUT | `/auth/notifications/update/` | [auth.ts:423](helpermobile/src/api/auth.ts#L423) | FCM token kaydet (multi-device) |
| DELETE | `/auth/notifications/logout/` | [auth.ts:459](helpermobile/src/api/auth.ts#L459) | FCM token sil |

### 1.2 Profile

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/profile/company-info/` | [profile.ts:17](helpermobile/src/api/profile.ts#L17) | Şirket bilgisi |
| POST | `/profile/company-info/create/` | [profile.ts:29](helpermobile/src/api/profile.ts#L29) | Oluştur |
| PATCH | `/profile/company-info/update/` | [profile.ts:40](helpermobile/src/api/profile.ts#L40) | Güncelle |
| DELETE | `/profile/company-info/delete/` | [profile.ts:51](helpermobile/src/api/profile.ts#L51) | Sil |
| GET | `/profile/payment-method/` | [profile.ts:63](helpermobile/src/api/profile.ts#L63) | Ödeme yöntemi (IBAN) |
| POST | `/profile/payment-method/create/` | [profile.ts:75](helpermobile/src/api/profile.ts#L75) | Oluştur |
| PATCH | `/profile/payment-method/update/` | [profile.ts:86](helpermobile/src/api/profile.ts#L86) | Güncelle |
| DELETE | `/profile/payment-method/delete/` | [profile.ts:97](helpermobile/src/api/profile.ts#L97) | Sil |

### 1.3 Vehicles

**Pattern:** Her araç tipi için 6 endpoint — list/create/update/delete + photo get/upload. `loadUserVehicles()` hepsini tek seferde çeker.

| Tip | List | CRUD base | Photo | Kaynak |
|---|---|---|---|---|
| Tow Truck | `/vehicles/my-cekici/` | `/vehicles/cekici/{create,update,delete}/` | `/vehicles/documents/cekici/{id}/{upload}` | [vehicles.ts:56-194](helpermobile/src/api/vehicles.ts#L56) |
| Crane | `/vehicles/my-vinc/` | `/vehicles/vinc/{create,update,delete}/` | `/vehicles/documents/vinc/{id}/{upload}` | [vehicles.ts:101-264](helpermobile/src/api/vehicles.ts#L101) |
| Nakliye | `/vehicles/my-nakliye/` | `/vehicles/nakliye/{create,update,delete}/` | `/vehicles/documents/nakliye/{id}/{upload}` | [vehicles.ts:327-406](helpermobile/src/api/vehicles.ts#L327) |
| Road Assistance | `/vehicles/my-yol-yardim/` | `/vehicles/yol-yardim/{create,update,delete}/` | `/vehicles/documents/yol-yardim/{id}/{upload}` | [vehicles.ts:441-520](helpermobile/src/api/vehicles.ts#L441) |
| Transfer | `/vehicles/my-transfer/` | `/vehicles/transfer/{create,update,delete}/` | `/vehicles/documents/transfer/{id}/{upload}` | [vehicles.ts:563-646](helpermobile/src/api/vehicles.ts#L563) |

**Global:** `loadUserVehicles()` [vehicles.ts:658](helpermobile/src/api/vehicles.ts#L658) — 5 tipi paralel çeker, useVehicleStore'a yazar.

**Fotoğraf yükleme:** multipart/form-data, `vehicle_photo` + `insurance_photo` + iç fotoğraflar (4 adet).

### 1.4 Documents

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/auth/documents/license/` | [documents.ts:51](helpermobile/src/api/documents.ts#L51) | Ehliyet/vergi/K belgesi |
| POST | `/auth/documents/license/upload/` | [documents.ts:95](helpermobile/src/api/documents.ts#L95) | Yükle (multipart, 5MB max/her dosya) |
| DELETE | `/auth/documents/license/delete/` | [documents.ts:115](helpermobile/src/api/documents.ts#L115) | Sil |
| GET | `/profile/completeness/` | [documents.ts:153](helpermobile/src/api/documents.ts#L153) | Profil tamamlama % |

**Form fields:** `license_photo`, `tax_plate_photo`, `k_document_photo` (opsiyonel).

### 1.5 Payment — Kart Yönetimi

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/profile/cards/` | [payment.ts:136](helpermobile/src/api/payment.ts#L136) | Kayıtlı kartları listele |
| GET | `/profile/cards/{id}/` | [payment.ts:151](helpermobile/src/api/payment.ts#L151) | Detay |
| POST | `/profile/cards/save/` | [payment.ts:121](helpermobile/src/api/payment.ts#L121) | Kart kaydet (eski sistem) |
| DELETE | `/profile/cards/{id}/delete/` | [payment.ts:166](helpermobile/src/api/payment.ts#L166) | Sil |
| POST | `/profile/cards/{id}/set-default/` | [payment.ts:181](helpermobile/src/api/payment.ts#L181) | Varsayılan yap |
| PATCH | `/profile/cards/{id}/alias/` | [payment.ts:196](helpermobile/src/api/payment.ts#L196) | Alias güncelle |

### 1.6 Payment — 3DS Doğrulama ve Komisyon

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| POST | `/payment/card-verification/initiate/` | [payment.ts:216](helpermobile/src/api/payment.ts#L216) | 1 TL 3DS başlat → HTML |
| GET | `/payment/card-verification/status/` | [payment.ts:235](helpermobile/src/api/payment.ts#L235) | Doğrulama durumu |
| POST | `/payment/commission/{requestId}/initiate/` | [payment.ts:292](helpermobile/src/api/payment.ts#L292) | Komisyon öde (yeni kart) |
| POST | `/payment/commission/{requestId}/initiate/` | [payment.ts:315](helpermobile/src/api/payment.ts#L315) | Komisyon öde (kayıtlı kart ID) |
| POST | `/payment/commission/{requestId}/initiate/` | [payment.ts:335](helpermobile/src/api/payment.ts#L335) | Komisyon öde (default kart) |
| GET | `/payment/commission/{requestId}/status/` | [payment.ts:354](helpermobile/src/api/payment.ts#L354) | Komisyon ödeme durumu |

**3DS response:** Backend direkt HTML string döner (`text/html`), WebView'da render edilir, callback URL yakalanır.

**Commission state machine:** `pending → processing → completed | failed`

### 1.7 Payment — PayPOS NFC (Driver)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| POST | `/payment/nfc/driver/{requestId}/init/` | [common.ts:262](helpermobile/src/api/requests/common.ts#L262) | PayPOS NFC başlat → deeplink |
| GET | `/payment/nfc/driver/{requestId}/status/` | [common.ts:283](helpermobile/src/api/requests/common.ts#L283) | Ödeme durumu |

**Platform:** Android-only. `checkPayPOSInstalled()` ile yüklü mü kontrol. `Linking.openURL(deeplink)` ile PayPOS açılır, AppState listener + polling ile sonuç alınır.

### 1.8 Ratings

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/ratings/my-ratings/` | [ratings.ts:38](helpermobile/src/api/ratings.ts#L38) | Puan istatistiği + yorumlar |

### 1.9 Requests — Tow Truck (Çekici)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/tow-truck/pending/?page_size=15` | [towTruck.ts:12](helpermobile/src/api/requests/towTruck.ts#L12) | Bekleyen |
| GET | `/requests/tow-truck/details/` | [towTruck.ts:26](helpermobile/src/api/requests/towTruck.ts#L26) | Müsait |
| GET | `/requests/tow-truck/awaiting-approval/?page_size=15` | [towTruck.ts:51](helpermobile/src/api/requests/towTruck.ts#L51) | Onay bekleyen |
| GET | `/requests/tow-truck/awaiting-payment/?page_size=15` | [towTruck.ts:64](helpermobile/src/api/requests/towTruck.ts#L64) | Ödeme bekleyen |
| GET | `/requests/tow-truck/in-progress/?page_size=15` | [towTruck.ts:77](helpermobile/src/api/requests/towTruck.ts#L77) | Devam eden |
| GET | `/summary/completed/tow-truck/?page_size=15` | [towTruck.ts:91](helpermobile/src/api/requests/towTruck.ts#L91) | Tamamlanan |
| GET | `/requests/tow-truck/details/{id}/` | [towTruck.ts:103](helpermobile/src/api/requests/towTruck.ts#L103) | Detay |
| POST | `/requests/tow-truck/{token}/calculate-price/` | [towTruck.ts:135](helpermobile/src/api/requests/towTruck.ts#L135) | Fiyat hesapla |
| POST | `/requests/tow-truck/{token}/accept/` | [towTruck.ts:152](helpermobile/src/api/requests/towTruck.ts#L152) | Kabul (eski) |
| POST | `/requests/tow-truck/{token}/submit-offer/` | [towTruck.ts:193](helpermobile/src/api/requests/towTruck.ts#L193) | Teklif gönder |
| DELETE | `/requests/tow-truck/{token}/withdraw-offer/` | [towTruck.ts:200](helpermobile/src/api/requests/towTruck.ts#L200) | Teklif geri çek |
| POST | `/requests/tow-truck/{id}/complete/` | [common.ts:203](helpermobile/src/api/requests/common.ts#L203) | Tamamla |

### 1.10 Requests — Crane (Vinç)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/crane/pending/?page_size=15` | [crane.ts:15](helpermobile/src/api/requests/crane.ts#L15) | Bekleyen |
| GET | `/requests/crane/details/` | [crane.ts:29](helpermobile/src/api/requests/crane.ts#L29) | Müsait |
| GET | `/requests/crane/awaiting-approval/?page_size=15` | [crane.ts:54](helpermobile/src/api/requests/crane.ts#L54) | Onay bekleyen |
| GET | `/requests/crane/awaiting-payment/?page_size=15` | [crane.ts:67](helpermobile/src/api/requests/crane.ts#L67) | Ödeme bekleyen |
| GET | `/requests/crane/in-progress/?page_size=15` | [crane.ts:81](helpermobile/src/api/requests/crane.ts#L81) | Devam eden |
| GET | `/summary/completed/crane/?page_size=15` | [crane.ts:94](helpermobile/src/api/requests/crane.ts#L94) | Tamamlanan |
| GET | `/requests/crane/details/{id}/` | [crane.ts:106](helpermobile/src/api/requests/crane.ts#L106) | Detay |
| GET | `/requests/crane/my-cranes/` | [crane.ts:134](helpermobile/src/api/requests/crane.ts#L134) | Kendi vinçlerim |
| POST | `/requests/crane/{token}/submit-offer/` | [crane.ts:161](helpermobile/src/api/requests/crane.ts#L161) | Teklif gönder |
| DELETE | `/requests/crane/{token}/withdraw-offer/` | [crane.ts:193](helpermobile/src/api/requests/crane.ts#L193) | Teklif geri çek |
| POST | `/requests/crane/{id}/complete/` | [crane.ts:172](helpermobile/src/api/requests/crane.ts#L172) | Tamamla |
| POST | `/requests/crane/{id}/pay-commission/` | [crane.ts:183](helpermobile/src/api/requests/crane.ts#L183) | Komisyon öde |

### 1.11 Requests — Home Moving (Evden Eve)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/home-moving/pending/?page_size=15` | [nakliye.ts:13](helpermobile/src/api/requests/nakliye.ts#L13) | Bekleyen |
| GET | `/requests/home-moving/awaiting-approval/?page_size=15` | [nakliye.ts:26](helpermobile/src/api/requests/nakliye.ts#L26) | Onay bekleyen |
| GET | `/requests/home-moving/awaiting-payment/?page_size=15` | [nakliye.ts:39](helpermobile/src/api/requests/nakliye.ts#L39) | Ödeme bekleyen |
| GET | `/requests/home-moving/in-progress/?page_size=15` | [nakliye.ts:52](helpermobile/src/api/requests/nakliye.ts#L52) | Devam eden |
| GET | `/summary/completed/home-moving/?page_size=15` | [nakliye.ts:65](helpermobile/src/api/requests/nakliye.ts#L65) | Tamamlanan |
| GET | `/requests/home-moving/details/{id}/` | [nakliye.ts:77](helpermobile/src/api/requests/nakliye.ts#L77) | Detay |
| POST | `/requests/home-moving/{token}/submit-offer/` | [nakliye.ts:108](helpermobile/src/api/requests/nakliye.ts#L108) | Teklif gönder |
| DELETE | `/requests/home-moving/{token}/withdraw-offer/` | [nakliye.ts:117](helpermobile/src/api/requests/nakliye.ts#L117) | Teklif geri çek |
| POST | `/requests/home-moving/{token}/depart/` | [nakliye.ts:127](helpermobile/src/api/requests/nakliye.ts#L127) | Yola çık |

### 1.12 Requests — City Moving (Şehirlerarası)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/city-moving/pending/?page_size=15` | [nakliye.ts:143](helpermobile/src/api/requests/nakliye.ts#L143) | Bekleyen |
| GET | `/requests/city-moving/awaiting-approval/?page_size=15` | [nakliye.ts:156](helpermobile/src/api/requests/nakliye.ts#L156) | Onay bekleyen |
| GET | `/requests/city-moving/awaiting-payment/?page_size=15` | [nakliye.ts:169](helpermobile/src/api/requests/nakliye.ts#L169) | Ödeme bekleyen |
| GET | `/requests/city-moving/in-progress/?page_size=15` | [nakliye.ts:182](helpermobile/src/api/requests/nakliye.ts#L182) | Devam eden |
| GET | `/summary/completed/city-moving/?page_size=15` | [nakliye.ts:195](helpermobile/src/api/requests/nakliye.ts#L195) | Tamamlanan |
| GET | `/requests/city-moving/details/{id}/` | [nakliye.ts:207](helpermobile/src/api/requests/nakliye.ts#L207) | Detay |
| POST | `/requests/city-moving/{token}/submit-offer/` | [nakliye.ts:237](helpermobile/src/api/requests/nakliye.ts#L237) | Teklif gönder |
| DELETE | `/requests/city-moving/{token}/withdraw-offer/` | [nakliye.ts:246](helpermobile/src/api/requests/nakliye.ts#L246) | Teklif geri çek |
| POST | `/requests/city-moving/{token}/depart/` | [nakliye.ts:256](helpermobile/src/api/requests/nakliye.ts#L256) | Yola çık |

### 1.13 Requests — Transfer

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/transfer/pending/?page_size=15` | [transfer.ts:14](helpermobile/src/api/requests/transfer.ts#L14) | Bekleyen |
| GET | `/requests/transfer/details/` | [transfer.ts:28](helpermobile/src/api/requests/transfer.ts#L28) | Müsait |
| GET | `/requests/transfer/awaiting-approval/?page_size=15` | [transfer.ts:53](helpermobile/src/api/requests/transfer.ts#L53) | Onay bekleyen |
| GET | `/requests/transfer/awaiting-payment/?page_size=15` | [transfer.ts:65](helpermobile/src/api/requests/transfer.ts#L65) | Ödeme bekleyen |
| GET | `/requests/transfer/in-progress/?page_size=15` | [transfer.ts:79](helpermobile/src/api/requests/transfer.ts#L79) | Devam eden |
| GET | `/requests/transfer/completed/?page_size=15` | [transfer.ts:93](helpermobile/src/api/requests/transfer.ts#L93) | Tamamlanan |
| GET | `/requests/transfer/details/{id}/` | [transfer.ts:105](helpermobile/src/api/requests/transfer.ts#L105) | Detay |
| POST | `/requests/transfer/{token}/submit-offer/` | [transfer.ts:123](helpermobile/src/api/requests/transfer.ts#L123) | Teklif gönder |
| DELETE | `/requests/transfer/{token}/withdraw-offer/` | [transfer.ts:137](helpermobile/src/api/requests/transfer.ts#L137) | Teklif geri çek |
| POST | `/requests/transfer/{token}/depart/` | [transfer.ts:148](helpermobile/src/api/requests/transfer.ts#L148) | Yola çık |

### 1.14 Requests — Road Assistance (Yol Yardım)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/road-assistance/pending/?page_size=15` | [roadAssistance.ts:11](helpermobile/src/api/requests/roadAssistance.ts#L11) | Bekleyen |
| GET | `/requests/road-assistance/details/` | [roadAssistance.ts:25](helpermobile/src/api/requests/roadAssistance.ts#L25) | Müsait |
| GET | `/requests/road-assistance/awaiting-approval/?page_size=15` | [roadAssistance.ts:50](helpermobile/src/api/requests/roadAssistance.ts#L50) | Onay bekleyen |
| GET | `/requests/road-assistance/awaiting-payment/?page_size=15` | [roadAssistance.ts:63](helpermobile/src/api/requests/roadAssistance.ts#L63) | Ödeme bekleyen |
| GET | `/requests/road-assistance/in-progress/?page_size=15` | [roadAssistance.ts:76](helpermobile/src/api/requests/roadAssistance.ts#L76) | Devam eden |
| GET | `/summary/completed/road-assistance/?page_size=15` | [roadAssistance.ts:89](helpermobile/src/api/requests/roadAssistance.ts#L89) | Tamamlanan |
| GET | `/requests/road-assistance/details/{id}/` | [roadAssistance.ts:102](helpermobile/src/api/requests/roadAssistance.ts#L102) | Detay |
| POST | `/requests/road-assistance/{token}/submit-offer/` | [roadAssistance.ts:126](helpermobile/src/api/requests/roadAssistance.ts#L126) | Teklif gönder |
| DELETE | `/requests/road-assistance/{token}/withdraw-offer/` | [roadAssistance.ts:135](helpermobile/src/api/requests/roadAssistance.ts#L135) | Teklif geri çek |

### 1.15 Requests — Common (Ortak)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| POST | `/requests/driver-photos/{requestId}/` | [common.ts:35](helpermobile/src/api/requests/common.ts#L35) | Sürücü fotoğrafları (multipart, 60s) |
| GET | `/summary/earnings/total/` | [common.ts:52](helpermobile/src/api/requests/common.ts#L52) | Toplam kazanç |
| GET | `/summary/earnings/period/` | [common.ts:83](helpermobile/src/api/requests/common.ts#L83) | Dönemsel (filtre: week/month/year/custom) |
| GET | `/summary/earnings/list/` | [common.ts:118](helpermobile/src/api/requests/common.ts#L118) | Liste (pagination) |
| POST | `/request/location/{token}/complete/` | [common.ts:138](helpermobile/src/api/requests/common.ts#L138) | Müşteri tamamlar |
| POST | `/request/location/{token}/approve/` | [common.ts:155](helpermobile/src/api/requests/common.ts#L155) | Müşteri onaylar |
| POST | `/request/location/{token}/reject/` | [common.ts:170](helpermobile/src/api/requests/common.ts#L170) | Müşteri reddeder |
| POST | `/payment/requests/{requestId}/pay-commission/` | [common.ts:192](helpermobile/src/api/requests/common.ts#L192) | Komisyon öde |
| GET | `/requests/all-counts/` | [common.ts:227](helpermobile/src/api/requests/common.ts#L227) | Tüm servis sayıları |
| GET | `/requests/{service}/counts/` | [common.ts:237](helpermobile/src/api/requests/common.ts#L237) | Servis sayıları |

### 1.16 Cancellation (İptal)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/requests/{service}/{token}/can-cancel/` | [cancellation.ts:17](helpermobile/src/api/requests/cancellation.ts#L17) | İptal edilebilir mi? |
| POST | `/requests/{service}/{token}/cancel/` | [cancellation.ts:32](helpermobile/src/api/requests/cancellation.ts#L32) | İptal et |

**Services:** `tow_truck`, `crane`, `home_moving`, `city_moving`, `road_assistance`, `transfer`.

### 1.17 Employee (Firma sahibi için)

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| GET | `/employee/employees/` | [employees.ts:12](helpermobile/src/api/requests/employees.ts#L12) | Liste |
| GET | `/employee/employees/{id}/` | [employees.ts:59](helpermobile/src/api/requests/employees.ts#L59) | Detay |
| POST | `/employee/employees/create/` | [employees.ts:22](helpermobile/src/api/requests/employees.ts#L22) | Oluştur |
| PATCH | `/employee/employees/{id}/update/` | [employees.ts:34](helpermobile/src/api/requests/employees.ts#L34) | Güncelle |
| DELETE | `/employee/employees/{id}/delete/` | [employees.ts:49](helpermobile/src/api/requests/employees.ts#L49) | Sil (soft/hard) |

### 1.18 Employee Panel (Eleman için)

`employeePanel.ts` — dashboard, jobs list (pagination), job detail endpoint'leri. Detay için [employeePanel.ts](helpermobile/src/api/requests/employeePanel.ts).

### 1.19 Background Location

| Method | Path | Kaynak | Açıklama |
|---|---|---|---|
| POST | `/vehicles/location/{token}/http-update/` | [backgroundLocation.ts:26](helpermobile/src/tasks/backgroundLocation.ts#L26) | HTTP fallback konum gönderimi |
| POST | `/vehicles/location/{token}/http-update/` | [backgroundLocation.ts:60](helpermobile/src/tasks/backgroundLocation.ts#L60) | Queue'yu boşalt |

---

## 2. WEBSOCKET BAĞLANTILARI

### 2.1 Jobs WebSocket — 6 servis için paralel bağlantı

**Kaynak:** [jobsWebSocket.ts](helpermobile/src/services/jobsWebSocket.ts), hook: [useJobsWebSocket.ts](helpermobile/src/hooks/useJobsWebSocket.ts)

**URL pattern:**
```
wss://api.yolsepetigo.com/ws/jobs/{serviceType}/?auth={jwt}
```

| Servis tipi | Bağlantı |
|---|---|
| `tow_truck` | 1 |
| `crane` | 1 |
| `home_moving` | 1 |
| `city_moving` | 1 |
| `road_assistance` | 1 |
| `transfer` | 1 |

**Toplam:** Kullanıcının servis tiplerine göre 1-6 paralel bağlantı.

**Message tipleri (gelen):**
- `new_job` — yeni talep geldi
- `job_updated` — durum değişti
- `job_cancelled` — iş iptal edildi
- `connection_established` — bağlantı onayı

**Callbacks:**
- `onNewJob(serviceType, data)`
- `onJobUpdated(serviceType, data)`
- `onJobCancelled(serviceType, data)`
- `onConnected(serviceType)`
- `onDisconnected(serviceType)`
- `onError(serviceType, error)`

**Reconnect:** Exponential backoff (1s, 2s, 4s, 8s, max 30s), max 5 attempt. NetInfo ile internet monitoring.

### 2.2 Location WebSocket — Tek bağlantı, tracking token bazlı

**Kaynak:** [locationWebSocket.ts](helpermobile/src/services/locationWebSocket.ts), hook: [useLocationWebSocket.ts](helpermobile/src/hooks/useLocationWebSocket.ts)

**URL:**
```
wss://api.yolsepetigo.com/ws/location/{trackingToken}/?auth={jwt}
```

**Gönderilen:** `{ latitude, longitude }` — 5 saniye aralıkla.

**Alınan message tipleri:**
- `connection_established`
- `location_update`
- `request_accepted` — sürücü teklif kabul etti
- `request_approved` — müşteri onayladı
- `request_rejected` — müşteri reddetti
- `status_update` — genel durum değişikliği

**Callbacks:**
- `onConnected`, `onDisconnected`, `onError`
- `onLocationUpdate`
- `onRequestAccepted/Approved/Rejected`
- `onStatusUpdate`
- `onInternetDisconnected/Reconnected`

**Özel özellikler:**
- **Bounce detection** — 2 sn'den kısa bağlantıda reconnect yapmaz.
- Tracking token expire olursa yenilemek zor — backend ile koordine.

**İki WS arasındaki duplicate logic:** İkisi de NetInfo dinleme, exponential backoff, token inject — `BaseWebSocket` abstraction'a ihtiyaç var.

---

## 3. ÖDEME ENTEGRASYONLARI

### 3.1 Iyzico 3DS (Kart)

| Alan | Değer |
|---|---|
| Kaynak API | [payment.ts](helpermobile/src/api/payment.ts) |
| UI | [CreditCardSection.tsx](helpermobile/src/components/payment/CreditCardSection.tsx) (1148 satır) + commission/ |
| Endpoint | `/payment/card-verification/initiate/` + `/payment/commission/{id}/initiate/` |
| Response | `text/html` — 3DS iframe HTML |
| UI flow | WebView'da HTML yükle → user 3DS onayla → callback URL yakala (`card-verification?status=success/failed`) |
| State machine | `idle → processing → (success \| error)` |
| Platform | iOS + Android |

### 3.2 PayPOS NFC (App2App)

| Alan | Değer |
|---|---|
| Kaynak API | [common.ts:262-304](helpermobile/src/api/requests/common.ts#L262) |
| UI | [PayPOSPaymentModal.tsx](helpermobile/src/components/payment/PayPOSPaymentModal.tsx) (937 satır) |
| Endpoint | `/payment/nfc/driver/{id}/init/` + `/status/` |
| Response | `{ deeplink_url, payment_session_id, amount, reference_no }` |
| UI flow | Deeplink'i `Linking.openURL` → PayPOS uygulaması açılır → müşteri kart yaklaştırır → AppState listener background→active → polling `/status/` |
| State machine | `idle → initiating → waiting_paypos → polling → (success \| error)` |
| Platform | **Android-only** (iOS'ta uyarı) |
| Servis kısıtı | **Sadece çekici (tow truck)** |
| Bağımlılık | `checkPayPOSInstalled()` + Play Store link fallback |

### 3.3 NFC SoftPOS (Sürücü kart okuma)

| Alan | Değer |
|---|---|
| UI | [NFCPaymentModal.tsx](helpermobile/src/components/payment/NFCPaymentModal.tsx) (1041 satır) |
| Paket | `react-native-nfc-manager` |
| State machine | `idle → checking_nfc → waiting_card → reading → processing → (success \| error)` |
| Platform | **Android-only** (Apple NFC payment forbidden) |
| Durum | **JobDetailScreen'de iptal edilmiş** — yorum satırı (mevcutta aktif kullanım yok) |

### 3.4 QR Kod Ödeme

| Alan | Değer |
|---|---|
| UI | [QRPaymentModal.tsx](helpermobile/src/components/payment/QRPaymentModal.tsx) (1040 satır) |
| State machine | `idle → generating → waiting_payment → checking → (success \| error \| expired)` |
| Timing | 5 dakika QR geçerlilik (300 sn), 5 sn polling interval |
| QR kaynak | Demo: `api.qrserver.com` (backend implementasyonu tamamlanmamış) |
| Durum | **JobDetailScreen'de iptal edilmiş** — yorum satırı |

### 3.5 Komisyon Ödemesi (generic)

| Alan | Değer |
|---|---|
| Kaynak API | [payment.ts:287-370](helpermobile/src/api/payment.ts#L287) |
| UI | [PaymentConfirmationModal.tsx](helpermobile/src/components/payment/PaymentConfirmationModal.tsx) (697 satır) + [CommissionPaymentModal.tsx](helpermobile/src/components/payment/CommissionPaymentModal.tsx) (150 satır) |
| Hook | [useCommissionPayment.ts](helpermobile/src/components/payment/commission/useCommissionPayment.ts) |
| Ödeme seçenekleri | yeni kart / kayıtlı kart ID / default kart |
| Flow | Initiate → 3DS HTML → WebView → callback → getStatus polling |

---

## 4. AUTH / TOKEN FLOW

### 4.1 Token yaşam döngüsü

```
OTP send → OTP verify (verification_token)
        ↓
     Register / Login (access_token + refresh_token alınır)
        ↓
     AsyncStorage.setItem('access_token', 'refresh_token', 'user')
        ↓
     Axios request interceptor: `Authorization: Bearer {access_token}`
        ↓
     401 → Token sil → Logout eventi
```

### 4.2 Axios Interceptors

**Request** ([axiosConfig.ts](helpermobile/src/api/axiosConfig.ts)):
- AsyncStorage'dan `access_token` oku, `Authorization` header'a ekle.

**Response:**
- 401 → `access_token` + `refresh_token` sil. Eğer `isLoggingOut` true ise sessiz geç.
- 404 (photo endpoints, FCM logout endpoint) → sessiz geç.
- Diğer hatalar → caller'a bubble up.

**Refresh logic:** Yok! Sadece silme var. Token expire olunca user yeniden login olmak zorunda.

### 4.3 Logout Cleanup Sırası

[authStore.ts](helpermobile/src/store/authStore.ts) logout fonksiyonu:
1. `setLoggingOut(true)` — 401 sustur.
2. FCM token sil (`deleteFCMToken`).
3. AsyncStorage sil: `access_token`, `refresh_token`, `user`.
4. Background location task durdur.
5. Active job temizle.
6. WebSocket'leri kapat (jobs + location).
7. Store'ları temizle (employee, employeePanel, notification, nakliye location).
8. `setLoggingOut(false)`.

---

## 5. FCM / PUSH NOTIFICATION

### 5.1 Initialization sırası

```
index.ts (App render öncesi):
  1. Firebase initialize
  2. setupBackgroundNotificationHandler()       ← lib/notifications.ts
  3. TaskManager.defineTask('background-location-task')   ← tasks/backgroundLocation.ts
  4. registerRootComponent(App)

App.tsx (mount sırasında):
  5. requestPermissions()
  6. getFCMToken()
  7. registerFCMToken(backend'e kaydet)
  8. setupTokenRefreshListener()
  9. setupNotificationHandlers()
```

### 5.2 Handler'lar

| Event | Kaynak | Ne yapar |
|---|---|---|
| Foreground mesaj | [fcmService.ts:144](helpermobile/src/services/fcmService.ts#L144) | In-app banner göster |
| Background mesaj | [fcmService.ts:162](helpermobile/src/services/fcmService.ts#L162) | OS notification render |
| Notification tap (background) | [fcmService.ts:171](helpermobile/src/services/fcmService.ts#L171) | Navigate to job detail |
| Notification tap (quit state) | [fcmService.ts:181](helpermobile/src/services/fcmService.ts#L181) | AsyncStorage'a pending nav kaydet, App mount'unda oku |

### 5.3 Notification Data Payload

Backend'den gelen data (type-safe: [types/notifications.ts](helpermobile/src/types/notifications.ts)):

| Alan | Değer |
|---|---|
| `type` | `new_request` / `request_approved` / `offer_accepted` / `request_cancelled` / `payment_received` / `system_message` |
| `service_type` | `tow` / `crane` / `home_moving` / `city_moving` / `road_assistance` |
| `request_details_id` | ID (detay çekmek için) |
| `tracking_token` | Location WS için |
| `click_action` | `OPEN_REQUEST_DETAILS` / `OPEN_JOB_DETAILS` / `OPEN_EARNINGS` / `NONE` |

### 5.4 Navigation Logic

[notificationNavigation.ts](helpermobile/src/utils/notificationNavigation.ts):
- `resolveServiceType()` — backend string → UI tipi normalize
- `fetchJobsByServiceType()` — servis tipine göre iş listesi
- `navigateToAcceptedJob()` — doğru JobDetail ekranına yönlendir

---

## 6. BACKGROUND TASKS

### Background Location Task

**Task ID:** `background-location-task`
**Kaynak:** [backgroundLocation.ts](helpermobile/src/tasks/backgroundLocation.ts)
**Kayıt:** [index.ts:4](helpermobile/index.ts#L4) — App render öncesi
**Başlat/durdur:** [useLocationTracking.ts](helpermobile/src/hooks/useLocationTracking.ts) — sadece aktif iş varsa
**Manager:** [backgroundLocationService.ts](helpermobile/src/services/backgroundLocationService.ts) — ref-counting ile birden fazla consumer

**Konum gönderim akışı:**
```
1. WebSocket bağlıysa → WS üzerinden gönder (hızlı)
2. WebSocket kapalıysa → HTTP POST /vehicles/location/{token}/http-update/
3. HTTP başarısızsa → AsyncStorage queue'ya ekle (max 50)
4. Sonraki denemede queue'yu boşalt
5. 10 başarısız sonra task durdur
6. Aktif iş yoksa task durdur
```

**Config:** BestForNavigation accuracy, 10m distance, 5s deferred interval, AutomotiveNavigation activity type, Foreground service notification.

---

## 7. ASYNCSTORAGE — DEPOLANAN ANAHTARLAR

| Key | Ne | Hassas mı? |
|---|---|---|
| `access_token` | JWT | **EVET** (plain) |
| `refresh_token` | JWT | **EVET** (plain) |
| `user` | Giriş yapan kullanıcı JSON | **EVET** (plain) |
| `device_id` | Cihaz benzersiz ID | Düşük |
| `@device_id` | Alternatif device key | Düşük |
| `ONBOARDING_COMPLETE` | Onboarding gösterildi mi | Hayır |
| `GUIDE_SHOWN` | Rehber gösterildi mi | Hayır |
| `THEME_PREFERENCE` | Tema tercihi | Hayır |
| `pending_notification_navigation` | Quit state nav | Orta |
| `active-job-storage` | Aktif iş (Zustand) | Orta |
| `bg-location-reconnect-fails` | WS fail counter | Hayır |
| `bg-location-queue` | Offline konum kuyruğu | Orta |
| `profile_incomplete` | Bool | Hayır |
| `profile_completion_percentage` | Sayı | Hayır |
| `profile_missing_fields` | JSON | Hayır |
| `paypos_installed_key` | Bool | Hayır |

**Güvenlik:** Plain AsyncStorage. Token'lar için `expo-secure-store` migration gerekli.

---

## 8. HARDCODED URL'LER — GREP SONUCU

| URL | Kaynak | Kullanım |
|---|---|---|
| `https://api.yolsepetigo.com` | [axiosConfig.ts:9](helpermobile/src/api/axiosConfig.ts#L9) | Ana API base |
| `http://192.168.1.100:8000` | [axiosConfig.ts:10](helpermobile/src/api/axiosConfig.ts#L10) | DEV (yorum satırı) |
| `http://localhost:5000/api/v1` | [lib/api.ts:9](helpermobile/src/lib/api.ts#L9) | **Duplicate/Legacy** API |
| `wss://api.yolsepetigo.com/ws/jobs/{type}/...` | [jobsWebSocket.ts:137](helpermobile/src/services/jobsWebSocket.ts#L137) | Jobs WS |
| `wss://api.yolsepetigo.com/ws/location/{token}/...` | [locationWebSocket.ts:144](helpermobile/src/services/locationWebSocket.ts#L144) | Location WS |
| `https://api.yolsepetigo.com{url}` | [EditVehicleScreen.tsx:28](helpermobile/src/screens/auth/EditVehicleScreen.tsx#L28) | Fotoğraf URL builder |
| `https://api.yolsepetigo.com{url}` | [DocumentsScreen.tsx:31](helpermobile/src/screens/profile/DocumentsScreen.tsx#L31) | Belge URL builder |

---

## 9. KONFİGÜRASYON

### 9.1 app.json

- **Google Maps API Key:** `AIzaSyBXlSJ8uEIz0Uw44CYzJVZQJhjUpLPRErI` ⚠️ plain text, public risk
- **Firebase config:** `GoogleService-Info.plist` (iOS) + `google-services.json` (Android)
- **Plugins:** expo-font, expo-location (background), expo-notifications, @react-native-firebase/app

### 9.2 Permissions

**iOS:**
- NSLocationAlways/WhenInUse/Camera/PhotoLibrary
- UIBackgroundModes: `location`, `fetch`, `remote-notification`

**Android:**
- ACCESS_FINE/COARSE_LOCATION, ACCESS_BACKGROUND_LOCATION
- FOREGROUND_SERVICE, FOREGROUND_SERVICE_LOCATION
- CAMERA, READ_EXTERNAL_STORAGE, READ_MEDIA_IMAGES
- POST_NOTIFICATIONS, REQUEST_IGNORE_BATTERY_OPTIMIZATIONS

### 9.3 appConfig.ts

[appConfig.ts](helpermobile/src/constants/appConfig.ts):
- `REQUIRE_BACKGROUND_RUNNING_PERMISSION: true`
- `REQUIRE_BATTERY_OPTIMIZATION_CHECK: true`
- `REQUIRE_ACCOUNT_READINESS: true`

---

## 10. SERVİS BAŞINA ENDPOINT SAYISI (GRAND TOTAL)

| Servis | HTTP Endpoint |
|---|---|
| Authentication | 14 |
| Profile | 8 |
| Vehicles (5 tip × ~6 endpoint) | 32 |
| Documents | 4 |
| Payment (Cards + 3DS + Commission + PayPOS) | 14 |
| Ratings | 1 |
| Requests — Tow Truck | 12 |
| Requests — Crane | 12 |
| Requests — Home Moving | 9 |
| Requests — City Moving | 9 |
| Requests — Transfer | 10 |
| Requests — Road Assistance | 9 |
| Requests — Common | 10 |
| Cancellation | 2 |
| Employee | 5 |
| Employee Panel | 3-4 |
| Background Location | 2 |
| **TOPLAM** | **~158** |

---

## 11. DUPLIKASYON VE SORUN NOKTALARI

1. **`src/lib/api.ts` vs `src/api/axiosConfig.ts`** — iki ayrı HTTP layer, baseURL farklı. `lib/api.ts` legacy (`localhost:5000`).
2. **`src/store/notificationStore.ts` vs `src/store/useNotificationStore.ts`** — aynı isim çakışması, içerik farklı.
3. **Backward-compat wrapper** (`requestsAPI`) ve modular (`craneAPI`, `towTruckAPI`, ...) ikisi de aktif kullanımda.
4. **`calculateDistance`/`getAddressDetails`/`getStatus`** — 4+ dosyada duplicate (crane/constants, nakliye/constants, roadAssistance/constants, jobDetail/utils).
5. **Vehicle photo upload** — 5 araç tipi için neredeyse aynı metot tekrar yazılmış.
6. **MIME type tespit** — `vehicles.ts` + `documents.ts` duplicate.
7. **WebSocket reconnect/internet monitoring** — jobs ve location WS'te aynı kod tekrar yazılmış (base class yok).
8. **6 servis × ~8 request status endpoint** — abstract base class yok, tekrar tekrar aynı pattern yazılmış.
9. **Hardcoded base URL** — 5+ yerde.

---

## 12. SONRAKİ ADIM

Bu envanter + kullanıcının sağlayacağı **backend kodunun** birleştirilmiş analizi ile:
- Endpoint'lerin backend'deki router'ları doğrulanacak.
- Request/response şemaları netleşecek (zod schema için).
- Eksik endpoint varsa eklenecek.
- 158 HTTP + 7 WS'in yeni `backend/` mimarisine nasıl oturtulacağı netleşecek.

---

**Dosya yolu:** [backend-inventory.md](backend-inventory.md)

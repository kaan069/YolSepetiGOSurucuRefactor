# YolSepetiGO Sürücü — Mimari ve Sistem Analizi Raporu

*Şirket sunumu için hazırlanmış teknik genel bakış — React Native + Expo mobil sürücü/filo platformu*

---

## 1. Yönetici Özeti

**YolSepetiGO Sürücü**, tek bir mobil uygulamada beş ayrı hizmet tipini yöneten çok servisli bir sürücü/filo platformudur. Sürücüler telefon + OTP ile giriş yapar, kendilerine gelen iş taleplerini gerçek zamanlı olarak görür, teklif verir, işi üstlenir, konumlarını canlı olarak müşteriyle paylaşır ve komisyonlarını uygulama içinden öderler. Şirket sahibi sürücüler ayrıca kendi çalışanlarını (filo) yönetip onlara iş atayabilir.

### Ne Yapar?

- **Telefon + OTP + PIN** ile kimlik doğrulama ve çok adımlı kayıt sihirbazı
- **Gerçek zamanlı iş keşfi** (WebSocket) — beş hizmet tipinde gelen talepler
- **Serbest/manuel fiyat teklifi** — sürücü kendi fiyatını girer, müşteri onaylar
- **Canlı konum takibi** — arka planda çalışan foreground service ile kesintisiz
- **FCM push bildirim** — talebin gerçek durumuna göre doğru ekrana yönlendirme
- **Komisyon ödeme** — iyzico + 3DS ile kredi kartı üzerinden
- **Çalışan/filo yönetimi** — B2B kurumsal segment
- **Kazanç raporları** — dönemsel, servis tipi kırılımlı, referans/davet sistemi
- **Kendi "Fk" tasarım sistemi** — ~25 bileşenli iç UI kütüphanesi

### Ölçek

| Metrik | Değer |
|---|---|
| Toplam kod satırı | ~65.500 satır TypeScript |
| Analiz edilen alt sistem | 19 |
| Hizmet tipi | 5 (Yol Yardım, Çekici, Vinç, Nakliye, Transfer) |
| Zustand state store'u | 19 (ortak index'siz, dağıtık) |
| Fk tasarım bileşeni | ~25 |
| WebSocket kanalı | 2 tip (iş bildirimi + konum yayını) |
| En büyük ekran | `TransferJobDetailScreen.tsx` (~1114 satır) |
| Uygulama sürümü | 1.1.2 (`com.devkaans.yolpaketi`) |

### Teknoloji Yığını

| Katman | Teknoloji | Rol |
|---|---|---|
| Çatı (framework) | React Native + Expo | Cross-platform mobil |
| Dil | TypeScript | Tip güvenliği (1256 satırlık merkezi tip sözlüğü) |
| Navigasyon | React Navigation | Dört yollu koşullu stack + bottom-tab |
| State yönetimi | Zustand (+ persist middleware) | 19 bağımsız store, AsyncStorage kalıcılığı |
| Ağ katmanı | Axios (tek instance + interceptor) | Merkezi HTTP, token/versiyon enjeksiyonu |
| Gerçek zamanlı | WebSocket (JWT auth) | İş bildirimi + konum yayını |
| Push bildirim | Firebase Cloud Messaging (FCM) | Foreground/background/killed state |
| Konum | expo-location + expo-task-manager | Arka plan foreground service |
| UI tabanı | react-native-paper (Material Design 3) | "Fk" tasarım sisteminin altyapısı |
| Ödeme | iyzico + 3DS (WebView) | Kart saklama + komisyon tahsilatı |
| Form doğrulama | Zod (hazır, henüz bağlanmamış) | Türkçe mesajlı validasyon altyapısı |
| Yerel depolama | AsyncStorage | Token, oturum, taslak, kalıcı state |

---

## 2. Mimari Genel Bakış

### Klasör Yapısı Ne Anlatır?

Uygulama, `src/` altında **sorumluluk bazlı katmanlara** ayrılmıştır. Klasör yapısı hem servis tipini hem de teknik katmanı yansıtır:

| Klasör | Katman | Ne İçerir |
|---|---|---|
| `src/screens/` | Sunum (ekranlar) | Servis tipine göre alt klasörler (crane, towTruck, nakliye, transfer, roadAssistance) + auth, profile, earnings, employee, orders |
| `src/store/` | Global state | 19 Zustand store (kimlik, araç, aktif iş, bildirim, event-bus) |
| `src/api/` | Ağ / veri | Servise göre sınıf-tabanlı API modülleri + merkezi tip sözlüğü |
| `src/services/` | Altyapı servisleri | WebSocket (jobs/location), arka plan konum, cihaz, FCM |
| `src/hooks/` | İş mantığı hook'ları | Konum takibi, WebSocket, bildirim, token yönetimi |
| `src/components/` | Paylaşılan bileşenler | Fk tasarım sistemi (`fk/`), ödeme, iptal, ortak bileşenler |
| `src/theme/` + `src/constants/` | Tasarım + sabitler | Renk paleti, token'lar, canonical servis tipleri |
| `src/tasks/` | Arka plan görevleri | expo-task-manager konum task tanımı |
| `src/utils/` + `src/lib/` | Yardımcılar | Doğrulama, bildirim yönlendirme, konum köprüsü |

### Katmanlar ve Veri Akışının Genel Resmi

Uygulama **katmanlı bir mimari** izler: Ekranlar yalnızca sunum yapar; iş mantığı hook'lara, veri erişimi API sınıflarına, global durum Zustand store'larına, gerçek zamanlı akış WebSocket servislerine ayrılmıştır. Ağ katmanı tek bir axios instance üzerinden geçtiği için kimlik doğrulama, sürüm kontrolü ve hata yönetimi tek noktada merkezileştirilmiştir.

```
┌──────────────────────────────────────────────────────────────┐
│                       KULLANICI (Sürücü)                      │
└──────────────────────────────┬───────────────────────────────┘
                               │
┌──────────────────────────────▼───────────────────────────────┐
│  SUNUM KATMANI (src/screens + src/components/fk)              │
│  OrdersScreen · OfferScreen · JobDetail · Earnings · Profile │
│  "Fk" Tasarım Sistemi (buton, input, modal, select, upload)  │
└───────────┬──────────────────────────────────┬───────────────┘
            │                                  │
┌───────────▼───────────┐        ┌─────────────▼────────────────┐
│  İŞ MANTIĞI (hooks)   │        │  GLOBAL STATE (19 Zustand)   │
│  useOrdersData        │◄──────►│  authStore · activeJobStore  │
│  useLocationWebSocket │        │  jobCountsStore · event-bus  │
│  useNotifications     │        │  (persist: AsyncStorage)     │
└───────────┬───────────┘        └─────────────┬────────────────┘
            │                                  │
┌───────────▼──────────────────────────────────▼───────────────┐
│  AĞ / GERÇEK ZAMANLI KATMAN                                   │
│  ┌────────────────────┐   ┌──────────────────────────────┐   │
│  │ Axios (tek instance)│   │ WebSocket (2 kanal tipi)     │   │
│  │ + interceptor'lar   │   │ jobsWS  · locationWS         │   │
│  │ (token/versiyon/hata)│   │ + FCM Push + Arka Plan Task │   │
│  └─────────┬──────────┘   └───────────────┬──────────────┘   │
└────────────┼──────────────────────────────┼─────────────────┘
             │                              │
┌────────────▼──────────────────────────────▼─────────────────┐
│              BACKEND (api.yolsepetigo.com)                    │
│   REST endpoint'leri · WebSocket sunucusu · iyzico · FCM     │
└──────────────────────────────────────────────────────────────┘
```

**Temel veri akışı:** Kullanıcı bir ekranda işlem yapar → ekran bir hook çağırır → hook ilgili API sınıfını (axios instance üzerinden) veya WebSocket servisini kullanır → sonuç Zustand store'a yazılır → store'u dinleyen tüm ekranlar otomatik güncellenir. Gerçek zamanlı olaylar (yeni iş, iptal, ödeme) WebSocket üzerinden gelir ve React ağacı dışından store'ları tetikleyerek ekranları anlık tazeler.

---

## 3. Ana Kullanıcı Akışları

### 3.1 Kayıt / Giriş

**Giriş (mevcut sürücü):**
1. `LoginScreen` — karşılama ekranı ("Giriş Yap" / "Kayıt Ol" / "Nasıl Çalışır?")
2. `PhoneAuthScreen` — telefon + 6 haneli PIN → `authAPI.login` → token'lar AsyncStorage'a → oturum açılır

**Kayıt (yeni sürücü — çok adımlı sihirbaz):**
1. `PhoneNumberScreen` — telefon + hizmet seçimi + opsiyonel referans kodu. OTP göndermeden önce numara kontrolü yapılır (SMS israfını önlemek için); zaten kayıtlıysa `AlreadyRegisteredModal` açılır.
2. `OTPVerificationScreen` — 6 haneli SMS kodu → `verification_token` (JWT) alınır, 60 sn cooldown ile yeniden gönderme
3. `PersonalInfoNewScreen` — ad/soyad, TC, adres, sözleşme onayı, PIN → **asıl `register` API çağrısı burada** (120 sn timeout, timeout'ta login fallback)
4. `VehicleTypeSelectionScreen` — Bireysel/Şirket seçimi, ilk araç detay ekranına yönlendirme
5. **Araç detay ekranları** (ör. `CityToCityDetailsScreen`) — seçilen her hizmet için araç eklenir; zincirin sonunda oturum açılır
6. `OnboardingScreen` — 5 slaytlık tanıtım

Navigasyon **dört yollu koşullu render** ile yönetilir: `!isAuthenticated → Auth`, `!hasSeenOnboarding → Onboarding`, `provider_type === 'employee' → EmployeeApp`, aksi halde `App`.

### 3.2 İş Keşfi

- `OrdersScreen` — sürücünün ana iş keşif ekranı. Üç eksenli filtreleme:
  1. **Servis tipi sekmesi** (yalnızca kayıtlı hizmetler görünür)
  2. **Ana sekme** (Gelen İşler / Benim İşlerim)
  3. **Durum alt sekmesi** (Onay Bekleyen / Ödeme Bekl. / Devam Eden)
- WebSocket ile yeni iş geldiğinde titreşim + sayaç artışı + otomatik sekme geçişi
- Her talep bir `OrderCard` ile gösterilir (pending'de maskeli adres, in_progress'te tam adres)

### 3.3 Teklif Verme

1. Sürücü karta tıklar → duruma göre ilgili **Offer ekranı** açılır (`CraneOffer`, `TowTruckOffer`, `HomeMovingOffer` vb.)
2. Cihaz GPS'i alınır, müşteriye Haversine mesafesi hesaplanır
3. Onaylı araç seçilir (şirket ise çalışan da seçilir)
4. **Serbest fiyat** girilir (platform komisyonu bu tutara dahildir)
5. Gönderim öncesi: profil tamlık kontrolü + minimum fiyat doğrulaması
6. Başarıda talep `awaiting_approval` durumuna geçer → "Benim İşlerim" sekmesine yönlendirme

### 3.4 Aktif İş

1. Müşteri teklifi onaylar → `awaiting_payment`
2. Sürücü **komisyonu öder** (KDV dahil, 3DS ile) → `in_progress`
3. Müşteri bilgileri + tam konum açılır
4. `JobDetailScreen` — harita, müşteriyi arama, yol tarifi, canlı konum paylaşımı
5. Aktif iş bilgisi `useActiveJobStore`'a yazılır → arka plan konum task'i devreye girer

### 3.5 İş Tamamlama

- **Kritik iş kuralı:** Sürücü işi tek taraflı tamamlayamaz.
- "İşi Tamamla" butonu yalnız bir bilgilendirme uyarısı açar
- Gerçek tamamlanma, **müşterinin takip linkinden onay vermesiyle** backend'de olur
- WebSocket `request_completed` olayı → ekran `completed` durumuna geçer → aktif iş temizlenir → `EarningsTab`'e yönlendirme

---

## 4. Servis Modülleri

Beş hizmet tipi ortak bir mimari desen izler: her biri kendi API sınıfına, teklif ekranına, iş detay ekranına ve (araç gerektiriyorsa) araç tanımlama ekranına sahiptir. Fiyatlandırma modeli tümünde **serbest/manuel teklif**'tir — sürücü toplam fiyatı girer, platform komisyonu bu tutarın içindedir.

### 4.1 Yol Yardım (Road Assistance)

Yolda kalan araç sahiplerinin yardım taleplerini karşılar (lastik, akü, yakıt, çilingir, arıza, çekme halatı).

- **Ne yapar:** Sürücü onaylı yol yardım aracını (ve şirketse çalışanını) seçip serbest fiyat teklifi verir.
- **Önemli ekranlar:**
  - `src/screens/roadAssistance/RoadAssistanceDetailsScreen.tsx` — araç kaydı (plaka + foto + sigorta)
  - `src/screens/roadAssistance/RoadAssistanceOfferScreen.tsx` — teklif verme
  - `src/screens/RoadAssistanceJobDetailScreen.tsx` — iş yaşam döngüsü (723 satır)
  - `src/api/requests/roadAssistance.ts` — API katmanı

### 4.2 Çekici (Tow Truck)

Araç çekme/kurtarma taleplerini karşılar.

- **Ne yapar:** Konum bazlı fiyatlandırma — toplam mesafe = sürücü→alış (Haversine) + müşterinin güzergahı. Backend tavsiye kazanç önerir; sürücü kendi fiyatını girer.
- **Önemli ekranlar:**
  - `src/screens/towTruck/TowTruckDetailsScreen.tsx` — araç kaydı (çekebileceği araç türleri dahil)
  - `src/screens/towTruckOffer/TowTruckOfferScreen.tsx` — teklif verme (541 satır)
  - `src/screens/jobDetail/JobDetailScreen.tsx` — aktif iş yönetimi (~500 satır)
  - `src/api/requests/towTruck.ts` — API katmanı

### 4.3 Vinç (Crane)

Yük kaldırma/taşıma taleplerini karşılar (yük tipi, ağırlık, kaldırma yüksekliği, kat, engel durumu).

- **Ne yapar:** Sürücü vinç aracını (maksimum yükseklik dahil) kaydeder, gelen talebe manuel teklif verir; kabul sonrası komisyon ödeme + takip yaşam döngüsünü yönetir.
- **Önemli ekranlar:**
  - `src/screens/crane/CraneDetailsScreen.tsx` — araç kaydı (403 satır)
  - `src/screens/crane/CraneOfferScreen.tsx` — teklif verme (411 satır)
  - `src/screens/crane/CraneJobDetailScreen.tsx` — iş detayı (508 satır)
  - `src/api/requests/crane.ts` — API katmanı

### 4.4 Nakliye (Evden Eve + Şehirler Arası)

İki alt tip içerir: evden eve taşımacılık (kat/asansör detaylı) ve şehirler arası nakliyat (yük tipi/ağırlık/hacim/güzergah).

- **Ne yapar:** İki iş tipi neredeyse simetrik API/UI ile yönetilir; tek "Nakliye" sekmesi altında birleşir, tıklamada `movingType`'a göre doğru ekrana ayrışır. Kabul edilen işte "Yola Çık" ile müşteriye SMS gönderilir ve canlı konum paylaşımı başlar.
- **Önemli ekranlar:**
  - `src/screens/nakliye/HomeMovingOfferScreen.tsx` — evden eve teklif (368 satır)
  - `src/screens/nakliye/CityMovingOfferScreen.tsx` — şehirler arası teklif (329 satır)
  - `src/screens/nakliye/NakliyeJobDetailScreen.tsx` — ortak iş detayı (576 satır)
  - `src/screens/nakliye/HomeMovingDetailsScreen.tsx` — araç kaydı
  - `src/api/requests/nakliye.ts` — HomeMovingAPI + CityMovingAPI

### 4.5 Transfer (Yolcu Transferi)

VIP (özel/lüks) ve Organizasyon (servis/toplu) planlı yolcu transferlerini karşılar.

- **Ne yapar:** VIP ve Organizasyon için farklı zorunlu yasal belge setleri (D2 yetki, SRC, psikoteknik, S plaka, güzergah izni vb.). Planlı transfere özgü sabit tarih/saat ve gidiş-dönüş rota desteği içerir.
- **Önemli ekranlar:**
  - `src/screens/transfer/TransferVehicleScreen.tsx` — araç + belge kaydı (739 satır)
  - `src/screens/transfer/TransferOfferScreen.tsx` — teklif verme (728 satır)
  - `src/screens/transfer/TransferJobDetailScreen.tsx` — **uygulamanın en büyük ekranı** (1114 satır)
  - `src/api/requests/transfer.ts` — API katmanı

---

## 5. Öne Çıkan / Teknik Açıdan Etkileyici Bölümler

Bu bölüm, sunumda "wow" dedirtecek, teknik derinliği ve iş değeri yüksek noktaları içerir.

### 5.1 Çift Katmanlı Canlı Konum Takibi & WebSocket Altyapısı

En etkileyici mühendislik çalışması burada. Sürücünün konumu, uygulama kapalı olsa bile müşteriye kesintisiz ulaşır:

- **İki bağımsız WebSocket kanalı:** biri iş bildirimlerini dinler (`jobsWebSocket`), diğeri konumu müşteriye yayınlar (`locationWebSocket`)
- **Arka plan foreground service:** `expo-task-manager` sayesinde uygulama arka plandayken bile OS konum güncellemelerini iletir; kalıcı bildirim ile OS uygulamayı öldürmez
- **Üç kademeli dayanıklılık:** WebSocket başarısız olursa → HTTP fallback → o da olmazsa yerel kuyruk (max 50, FIFO); internet gelince kuyruk toplu gönderilir. **Hiçbir konum kaybolmaz.**
- **Akıllı bağlantı yönetimi:** exponential backoff reconnect, bounce koruması (2 sn altı bağlantılarda reconnect fırtınası engellenir), özel close kodları (4001 JWT expired, 4003 sahiplik hatası)
- **Ref-counting:** aktif iş + nakliye aynı anda konum paylaşabildiğinden tek OS task'i birden fazla tüketici tarafından güvenle paylaşılır
- İlgili dosyalar: `src/services/backgroundLocationService.ts`, `src/services/locationWebSocket.ts`, `src/tasks/backgroundLocation.ts`, `src/hooks/useLocationWebSocket.ts`

### 5.2 Durum-Sürücülü Bildirim Yönlendirme

FCM push bildirimi sistemi sabit ekran açmaz — **talebin gerçek backend durumunu çekip** doğru ekrana yönlendirir:

- pending → Offer ekranı, in_progress/awaiting → JobDetail, completed → OrdersTab, cancelled → OrdersTab + uyarı
- **Yanlış service_type'a dayanıklılık:** payload'daki servis tipi hatalıysa 6 servisi sırayla dener, 404'leri atlar, doğru servisi bulur
- **Üç bildirim state'i tam kapsanır:** foreground (in-app banner), background, killed (uygulama kapalıyken açılış)
- **Stale koruma:** 24 saatten eski bildirime tıklayınca 404 yerine doğrudan OrdersTab'e yönlendirir
- **Multi-device:** her cihaz benzersiz `device_id` ile kaydedilir; logout yalnız o cihazın token'ını siler
- İlgili dosyalar: `src/hooks/useNotifications.ts`, `src/utils/notificationNavigation.ts`

### 5.3 Çalışan / Filo Yönetimi Paneli (B2B)

Tek bir sürücü hesabını, altında ekip çalıştıran bir **işletme** hesabına dönüştürür — platformu kurumsal segmente açar:

- İki farklı rol/deneyim: **işveren** (çalışan CRUD + iş atama) ve **çalışan** (ayrı navigatör, sadece kendi işlerini görür)
- **Yetki ayrımı sağlam:** çalışan fiyat/kazanç görmez, müşteri bilgisi sadece iş aktifken açılır
- İşe atama ayrı endpoint değil — teklif payload'ına `employee_id` eklenerek yapılır (5 hizmet tipine entegre)
- Çalışan işi başlattığında konumu otomatik canlı paylaşılır
- İlgili dosyalar: `src/store/useEmployeeStore.ts`, `src/store/useEmployeePanelStore.ts`, `src/screens/employee/`, `src/components/common/EmployeeSelector.tsx`

### 5.4 Kendi "Fk" Tasarım Sistemi

react-native-paper (Material Design 3) üzerine kurulu, tamamen tema/token tabanlı iç UI kütüphanesi:

- ~25 bileşen tek barrel'dan (`src/components/fk`) import edilir — buton, input ailesi, modal, select, tarih, konum, dosya yükleme
- **Token tabanlı mimari:** `theme.ts` (marka paleti) → `tokens.ts` (semantik token) → `useFkTokens` hook. Hiçbir renk hardcode değil.
- **Tam karanlık mod** desteği — tek `isDarkMode` bayrağıyla tüm uygulamaya yayılır
- **Türkiye'ye özel akıllı bileşenler:** canlı TR telefon formatlama + 29 ülke kodu, Türk plaka sanitize, Türkçe 3-kolon tarih seçici, il/ilçe kaskad konum girişi
- İlgili dosyalar: `src/theme/tokens.ts`, `src/components/fk/index.ts`, `src/hooks/useFkTokens.ts`

### 5.5 Çok Servisli Araç Mimarisi

Altı farklı araç tipi (çekici, vinç, nakliye, yol yardım, transfer, legacy transport) tek modülde yönetilir:

- Her tip **ayrı veri modeli + ayrı endpoint + ayrı store dizisi** ile kategorize edilir; her tip kendi teknik alanlarına sahip
- **Backend = source of truth:** her ekran açılışında store temizlenir + yeniden çekilir; local store yalnız cache
- **Onay iş akışı:** yönetici onayından geçen araçlar düzenlenemez (pending/approved/rejected)
- Servis tipi eşleştirmesi **3 katmanlı**: canonical tipler + UI gruplama (nakliye = evden eve + şehirler arası) + backend boundary map'ler (WS kanalı, iptal yolu, FCM alias)
- İlgili dosyalar: `src/store/useVehicleStore.ts`, `src/api/vehicles.ts` (758 satır), `src/data/vehicleData.ts` (890 satır katalog)

### 5.6 Güvenlik-Öncelikli Mühendislik (Ek Vurgu)

- **PII sızıntısı önlemi:** tüm API katmanları backend error body'sini asla loglamaz — yalnız HTTP status. TC, OTP, IBAN, token, müşteri adı hiçbir zaman log'a yazılmaz
- **PCI uyumu:** kart bilgisi cihazda saklanmaz; tokenizasyon iyzico'da, frontend yalnız maskeli veri görür
- **Race condition çözümü:** ödeme başarısından sonra backend'in işi gerçekten güncellediği polling ile doğrulanır (WebSocket event'inin transaction commit öncesi atılma sorununu önler)
- **Zorunlu sürüm kontrolü:** her istekte sürüm header'ları gönderilir; backend 426 dönerse kullanıcı kalıcı bir "güncelleme gerekli" ekranıyla kilitlenir

---

## 6. "Nerede Ne Var" Hızlı Referans Tablosu

Sunum sırasında dosya açmak isterseniz buraya bakın.

| Konu | Ana Dosya / Klasör Yolu |
|---|---|
| **Uygulama giriş noktası** | `index.ts` |
| **Kök bileşen (auth + orkestrasyon)** | `src/App.tsx` |
| **Navigasyon (dört yollu render)** | `src/navigation/index.tsx` |
| **Kimlik doğrulama store** | `src/store/authStore.ts` |
| **Giriş ekranı** | `src/screens/auth/PhoneAuthScreen.tsx` |
| **Kayıt adım 1 (telefon+hizmet)** | `src/screens/auth/PhoneNumberScreen.tsx` |
| **OTP doğrulama** | `src/screens/auth/OTPVerificationScreen.tsx` |
| **Kayıt kişisel bilgi (register API)** | `src/screens/auth/PersonalInfoNewScreen.tsx` |
| **Kayıt sihirbazı state** | `src/store/useRegistrationDataStore.ts` |
| **Onboarding slaytları** | `src/screens/onboarding/OnboardingScreen.tsx` |
| **İş keşif ana ekranı** | `src/screens/orders/OrdersScreen.tsx` |
| **İş verisi hook (5 servis fetch)** | `src/screens/orders/hooks/useOrdersData.tsx` |
| **İş kartı bileşeni** | `src/components/OrderCard.tsx` |
| **Global iş sayaçları** | `src/store/useJobCountsStore.ts` |
| **Aktif iş store (konum için)** | `src/store/useActiveJobStore.ts` |
| **Yol Yardım teklif / detay** | `src/screens/roadAssistance/RoadAssistanceOfferScreen.tsx` · `src/screens/RoadAssistanceJobDetailScreen.tsx` |
| **Çekici teklif / detay** | `src/screens/towTruckOffer/TowTruckOfferScreen.tsx` · `src/screens/jobDetail/JobDetailScreen.tsx` |
| **Vinç teklif / detay** | `src/screens/crane/CraneOfferScreen.tsx` · `src/screens/crane/CraneJobDetailScreen.tsx` |
| **Nakliye teklif / detay** | `src/screens/nakliye/HomeMovingOfferScreen.tsx` · `src/screens/nakliye/NakliyeJobDetailScreen.tsx` |
| **Transfer teklif / detay (en büyük)** | `src/screens/transfer/TransferOfferScreen.tsx` · `src/screens/transfer/TransferJobDetailScreen.tsx` |
| **İptal akışı modal'ı** | `src/components/cancellation/CancelJobModal.tsx` |
| **Kazanç ana ekranı** | `src/screens/earnings/EarningsScreen.tsx` |
| **Kazanç iş mantığı hook** | `src/screens/earnings/hooks/useEarnings.ts` |
| **Profil ana menü** | `src/screens/profile/ProfileMenuScreen.tsx` |
| **Belge yükleme** | `src/screens/profile/DocumentsScreen.tsx` |
| **Şirket/ödeme bilgisi** | `src/screens/profile/CompanyInfoScreen.tsx` |
| **Hizmet şehri seçimi** | `src/screens/profile/ServiceCityScreen.tsx` |
| **Değerlendirmeler** | `src/screens/profile/RatingsAndReviewsScreen.tsx` |
| **Referans/davet sistemi** | `src/screens/profile/ReferralCodeScreen.tsx` |
| **Çalışan listesi (işveren)** | `src/screens/profile/EmployeeListScreen.tsx` |
| **Çalışan dashboard (eleman)** | `src/screens/employee/EmployeeDashboardScreen.tsx` |
| **Çalışan seçici (teklif atama)** | `src/components/common/EmployeeSelector.tsx` |
| **Kredi kartı yönetimi** | `src/screens/profile/CreditCardInfoScreen.tsx` · `src/components/payment/CreditCardSection.tsx` |
| **Komisyon ödeme modal'ı** | `src/components/payment/CommissionPaymentModal.tsx` |
| **Komisyon ödeme mantığı** | `src/components/payment/commission/useCommissionPayment.ts` |
| **Ödeme API katmanı** | `src/api/payment.ts` |
| **İş bildirimi WebSocket** | `src/services/jobsWebSocket.ts` |
| **Konum yayını WebSocket** | `src/services/locationWebSocket.ts` |
| **Arka plan konum servisi** | `src/services/backgroundLocationService.ts` |
| **Arka plan konum task'i** | `src/tasks/backgroundLocation.ts` |
| **FCM bildirim hook** | `src/hooks/useNotifications.ts` |
| **Bildirim yönlendirme motoru** | `src/utils/notificationNavigation.ts` |
| **Ağ katmanı (axios + interceptor)** | `src/api/axiosConfig.ts` |
| **Merkezi tip sözlüğü** | `src/api/types.ts` (1256 satır) |
| **Network yapılandırması** | `src/constants/network.ts` |
| **Canonical servis tipleri** | `src/constants/serviceTypes.ts` |
| **Araç yönetimi store** | `src/store/useVehicleStore.ts` |
| **Araç API + fotoğraf yükleme** | `src/api/vehicles.ts` |
| **Marka-model kataloğu** | `src/data/vehicleData.ts` |
| **Fk tasarım sistemi giriş** | `src/components/fk/index.ts` |
| **Tema/token tanımı** | `src/theme/theme.ts` · `src/theme/tokens.ts` |
| **Zorunlu güncelleme store** | `src/store/useUpgradeStore.ts` |
| **Expo yapılandırması** | `app.json` |

---

## 7. Sunum İçin Konuşma Noktaları

İş değeri odaklı, sunum akışında kullanabileceğiniz vurgu maddeleri:

1. **Tek uygulama, beş gelir kanalı.** YolSepetiGO Sürücü, Yol Yardım, Çekici, Vinç, Nakliye ve Transfer'i tek bir kod tabanında yönetir. Yeni bir hizmet tipi eklemek, mevcut mimariyi bozmadan ortak deseni takip etmekle mümkündür — bu, platformun **ölçeklenebilir bir gelir motoru** olduğunu gösterir.

2. **Serbest pazar / teklif modeli rekabeti körükler.** Sabit tarife yerine sürücüler kendi fiyatlarını girer, müşteri en uygun teklifi seçer. Bu, hem sürücü memnuniyetini hem de müşteri için fiyat rekabetini artırır; platform komisyonu her teklife otomatik gömülüdür.

3. **Müşteri güveni canlı konum takibiyle kazanılıyor.** Sürücünün konumu, uygulama kapalı olsa bile üç kademeli dayanıklılıkla (WebSocket → HTTP → yerel kuyruk) kesintisiz müşteriye ulaşır. "Aracınız yolda ve haritada görebiliyorsunuz" deneyimi, platformun **en güçlü güven unsurudur** — ve hiçbir konum verisi kaybolmaz.

4. **B2B/filo yönetimi kurumsal segmenti açıyor.** Tek sürücüden, altında ekip çalıştıran işletmeye kadar aynı uygulama hizmet verir. İşveren çalışan ekler, iş atar; çalışan sınırlı görünürlükle çalışır. Bu, **bireysel sürücüden kurumsal filoya** doğru büyüme yolunu tek üründe sunar.

5. **Kendi tasarım sistemimiz hız ve tutarlılık sağlıyor.** "Fk" bileşen kütüphanesi (~25 bileşen, tam karanlık mod, Türkiye'ye özel akıllı alanlar) sayesinde yeni ekranlar hızlı ve marka-tutarlı geliştirilir. Bu, **geliştirme maliyetini düşüren ve ürün kalitesini yükselten** bir yatırımdır.

6. **Güvenlik ve gizlilik mühendislik seviyesinde.** Kart bilgisi cihazda tutulmaz (PCI uyumu, iyzico tokenizasyonu); TC/OTP/IBAN gibi hassas veriler asla loglanmaz; ödeme sonrası durum çift-doğrulama ile teyit edilir. Bu, **regülasyon uyumu ve marka itibarı** açısından kritik bir olgunluk göstergesidir.

7. **Gerçek zamanlı deneyim rakiplerden ayrıştırıyor.** İşler polling ile değil, WebSocket ile anlık gelir; bildirimler talebin gerçek durumuna göre doğru ekrana yönlendirir. Sürücü asla eskimiş veya yanlış bir ekranla karşılaşmaz — bu, **hızlı iş kabulü ve yüksek dönüşüm** demektir.

8. **Üretime hazır olgunluk.** Sayfalı listeler, pull-to-refresh, offline dayanıklılık, zorunlu sürüm kontrolü, çok-cihaz token yönetimi ve kapsamlı hata yönetimi mevcuttur. Uygulama bir prototip değil, **sahada çalışan ölgün bir üründür** (v1.1.2).

---

*Not: Rapor sırasında değinilebilecek bilinen teknik borç noktaları — eski `ReportsAndHistoryScreen` ile yeni `EarningsScreen` paralel duruyor; `CreditCardInfoScreen` ile `CreditCardSection` büyük oranda kod tekrarı içeriyor; `react-native-nfc-manager` bağımlılığı linkli ancak aktif kullanımda değil; Zod doğrulama altyapısı hazır fakat henüz hiçbir forma bağlanmamış. Bunlar acil risk değil, planlı iyileştirme fırsatlarıdır.*
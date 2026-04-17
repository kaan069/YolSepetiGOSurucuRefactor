# OrderDto Migration Plan

Tarih: 2026-04-17
Owner: kaansaka069@gmail.com
Scope: `helpermobile/src/lib/types.ts` içindeki `OrderDto` (ve onunla bağlı `LocationDto`, `VehicleDto`, `VehicleType`) tipinin kaldırılması.

> Not: Bu belge SADECE analiz ve plan içerir. Hiçbir kod değişikliği yapılmadı.

---

## 1. OrderDto kullanım haritası

`OrderDto` tipi (3 dosya): **tanım dahil aktif 2 tüketici vardır; biri ise orphan (dead) dosyadır.**

| Dosya | Import türü | Okunan alanlar | Kritiklik | Notlar |
|---|---|---|---|---|
| `helpermobile/src/lib/types.ts` | tanım | — | — | Source of truth |
| `helpermobile/src/components/OrderCard.tsx` | `import { OrderDto }` + `Props.item: OrderDto` | `item.id`, `item.status`, `item.pickupLocation?.address`, `item.dropoffLocation?.address`, `item.vehicle?.type` — ayrıca `(item as any).from?.address`, `(item as any).to?.address`, `(item as any).vehicleType`, `(item as any).distance`, `(item as any).description`, `(item as any).preferredDate` | **Yüksek** | "Support both old and new formats" comment'i var. Yani prop tipi `OrderDto` olsa da component zaten yeni shape'i (`from`/`to`/`vehicleType`/`description`/`preferredDate`/`movingType`) bekliyor ve `OrderDto` fieldlarına fallback olarak düşüyor. Gerçekte `any`-cast üzerinden çalışıyor. |
| `helpermobile/src/screens/orders/hooks/useOrdersData.tsx` | `OrderStatus` import (dosya başında) — `OrderDto`’yu doğrudan import etmiyor, ama grep match’i dosyanın `OrderDto tipine uygun` yorumunda. `serviceType: 'transport' as const, // OrderDto tipine uygun` | — | Düşük | Sadece yorum bilgisi; type import yok. |

Ek olarak `screens/OrdersScreen.tsx` (eski 724-satırlık dosya) `OrderStatus` import ediyor **ama dosya projenin herhangi bir yerinden import EDİLMİYOR** (navigation `screens/orders/` folder’ı kullanıyor). Yani **orphan/dead code** — `OrderDto` migrasyonu fırsatıyla aynı sprintte silinmesi önerilir.

### LocationDto / VehicleDto kullanım haritası

| Dosya | Import | Notlar |
|---|---|---|
| `helpermobile/src/lib/types.ts` | tanım | `OrderDto` dışında kimse bu iki tipe bakmıyor. |

`LocationDto` ve `VehicleDto` **hiçbir dosya tarafından import edilmiyor.** Sadece `OrderDto.pickupLocation`, `OrderDto.dropoffLocation`, `OrderDto.vehicle` alanlarında structural olarak kullanılıyorlar. `OrderDto` silindiğinde bu iki tip de ölü hale gelir.

### OrderStatus kullanım haritası (migrasyon kapsamı DIŞI — silinmez)

`OrderStatus` aktif ve yaygın olarak kullanılıyor. `OrderDto` silinirken dokunulmamalıdır. 10 dosyada import ediliyor:

| Dosya | Kullanım |
|---|---|
| `helpermobile/src/lib/types.ts` | tanım |
| `helpermobile/src/constants/orderStatus.ts` | `Record<OrderStatus, string>` (LABELS/COLORS/ICONS) |
| `helpermobile/src/screens/orders/OrdersScreen.tsx` | state tipi, `handleCardPress` parametresi |
| `helpermobile/src/screens/orders/hooks/useOrdersData.tsx` | `filter: OrderStatus`, `status: filter as OrderStatus` |
| `helpermobile/src/screens/orders/hooks/useOrdersFilters.tsx` | reducer state filter |
| `helpermobile/src/screens/orders/hooks/useOrdersNavigation.ts` | status param |
| `helpermobile/src/screens/orders/components/OrdersList.tsx` | `Job.status`, prop |
| `helpermobile/src/screens/orders/components/MyJobsTabs.tsx` | filter prop |
| `helpermobile/src/screens/orders/components/EmptyOrdersState.tsx` | filter prop |
| `helpermobile/src/screens/OrdersScreen.tsx` | **orphan**; silinince düşer |

**Karar:** `OrderStatus` kalır, `OrderDto` / `LocationDto` / `VehicleDto` / `VehicleType` gider.

---

## 2. Kullanılan alanlar listesi (OrderDto shape ↔ gerçek UI)

`OrderDto` tanımında 13 alan var. Bunlardan UI’nin **gerçekte okuduğu** alanlar yalnızca 3 tane, geri kalan 10 alan hiçbir yerden okunmuyor.

| Alan | Tip | Opt | UI’de okunuyor mu? |
|---|---|---|---|
| `id` | string | — | **Evet** (`OrderCard`: `item.id.toString().slice(-2)`) |
| `userId` | string | — | Hayır (dead) |
| `pickupLocation` | `LocationDto` | — | Kısmen: `pickupLocation?.address` (fallback) |
| `dropoffLocation` | `LocationDto` | — | Kısmen: `dropoffLocation?.address` (fallback) |
| `vehicle` | `VehicleDto` | — | Kısmen: `vehicle?.type` (fallback) |
| `status` | `OrderStatus` | — | **Evet** (`OrderCard.getStatusInfo()`) |
| `price` | number | — | Hayır (dead) |
| `createdAt` | string | — | Hayır (dead) |
| `updatedAt` | string | — | Hayır (dead) |
| `driverId` | string\|null | Yes | Hayır (dead) |
| `estimatedTime` | number\|null | Yes | Hayır (dead) |
| `serviceType` | `'tow' \| 'crane' \| 'transport'` | — | Hayır (dead) |
| `trackingToken` | string | Yes | Hayır (dead) |

### Nested LocationDto alanları

| Alan | UI’de okunuyor mu? |
|---|---|
| `id` | Hayır |
| `address` | Evet — fallback olarak `OrderCard` |
| `latitude` | Hayır |
| `longitude` | Hayır |
| `title` | Hayır |

### Nested VehicleDto alanları

| Alan | UI’de okunuyor mu? |
|---|---|
| `id` | Hayır |
| `type` | Evet — fallback olarak `OrderCard` |
| `model` | Hayır |
| `plate` | Hayır |
| `color` | Hayır |
| `year` | Hayır |

**Sonuç:** `OrderDto` pratikte dead bir API kontratıdır. Gerçek UI, `OrdersList` içindeki `Job` interface’ini (`from`, `to`, `vehicleType`, `distance`, `estimatedPrice`, `status`, `createdAt`, `description`, `serviceType`, `movingType?`, `trackingToken?`, `preferredDate?`) bekliyor; `OrderCard` de aslında bu shape’i kullanıyor ama type olarak `OrderDto` etiketli olduğu için `(item as any)` cast'ları ile çalışıyor.

---

## 3. Gerçek backend tipleri envanteri

Dosya: `helpermobile/src/api/types.ts`

Order/request ile doğrudan ilgili tipler:

| Tip | Servis/Endpoint | Primary API | Temel alanlar |
|---|---|---|---|
| `TowTruckRequestDetail` | Çekici | `towTruckAPI` | `id:number`, `status?:string`, `pickup_address:string`, `pickup_latitude:string`, `pickup_longitude:string`, `dropoff_address:string`, `dropoff_latitude:string`, `dropoff_longitude:string`, `vehicle_type:string`, `vehicle_model?`, `vehicle_plate?`, `route_distance:string`, `route_duration:string`, `estimated_km:number`, `final_price?:number`, `trackingToken?`, `my_offer?:DriverOffer`, `question_answers?`, `photos?`, `created_at`, `updated_at` |
| `TowTruckRequestSummary` | Çekici (list) | `towTruckAPI.getPendingRequests` | `id`, `requested_service_type`, `request_owner_phone`, `estimated_price`, `status`, `created_at`, `updated_at` |
| `CraneRequest` | Vinç | `craneAPI` | `id:number`, `status?:string`, `address:string`, `latitude:string`, `longitude:string`, `load_type:string`, `load_weight:string`, `lift_height:string`, `floor:string`, `has_obstacles:boolean`, `trackingToken?`, `my_offer?:DriverOffer`, `final_price?`, `distance_to_location_km?`, `estimated_duration_hours?`, `photos?`, `created_at`, `updated_at` |
| `TransferRequest` | Transfer | `transferAPI` | `id:number`, `transfer_type`, `pickup_address`, `pickup_latitude`, `pickup_longitude`, `dropoff_address`, `dropoff_latitude`, `dropoff_longitude`, `passenger_count?`, `vehicle_preference?`, `scheduled_date`, `scheduled_time`, `is_round_trip`, `return_*`, `trackingToken?`, `my_offer?`, `status?`, `created_at`, `updated_at` |
| `EmployeeJobDetail` | Eleman paneli | `employeePanelAPI` | Kapsayıcı farklı shape. OrderDto migrasyonuna dahil DEĞİL. |
| (nakliye için **isimli tip YOK**) | Evden Eve / Şehirler Arası Nakliye | `homeMovingAPI`, `cityMovingAPI` | Backend response'u `useOrdersData.tsx` içinde `any[]` olarak tutuluyor. Snake_case dinamik alanlar: `from_address`, `to_address`, `from_latitude`, `from_longitude`, `to_latitude`, `to_longitude`, `pickup_address`, `dropoff_address`, `pickup_latitude`, `pickup_longitude`, `estimated_km`, `estimated_price`, `from_city`, `to_city`, `floor_from`, `has_elevator`, `room_count`, `load_weight`, `preferred_date`, `trackingToken`/`tracking_token`, `movingType` (client side eklenir). |
| (road assistance için **isimli tip YOK**) | Yol Yardım | `roadAssistanceAPI` | Aynı şekilde `any[]`. Alanlar: `latitude`/`location_latitude`, `longitude`/`location_longitude`, `address`/`location_address`, `service_type`/`assistance_type`, `description`/`problem_description`, `estimated_price`, `final_price`, `trackingToken`/`tracking_token`, `created_at`. |

### Ortak alanlar (hepsi taşıyor)

- `id: number`
- `created_at: string`
- `updated_at: string`
- `status?: string`
- `trackingToken?` (string, camelCase, opsiyonel — bazı response’larda `tracking_token` snake_case alt formda)
- `my_offer?: DriverOffer`
- `final_price?: number`

### Servis × endpoint × tip matrisi

| Servis | Tip | Endpoint örneği |
|---|---|---|
| Tow | `TowTruckRequestDetail` | `GET /requests/tow-truck/pending/` |
| Crane | `CraneRequest` | `GET /requests/crane/pending/` |
| Transfer | `TransferRequest` | `GET /requests/transfer/available/` |
| HomeMoving | `any` | `GET /requests/home-moving/pending/` |
| CityMoving | `any` | `GET /requests/city-moving/pending/` |
| RoadAssistance | `any` | `GET /requests/road-assistance/available/` |

### src/types/ klasörü incelemesi

Tek dosya: `helpermobile/src/types/notifications.ts`. Bu NOTIFICATION scope dışındadır, order/request tipi içermiyor. Projede **UI-side dedicated order/job tipi yok**; `OrdersList.tsx` içinde inline `interface Job` var (en yakın UI modeli).

### Adlandırma konvansiyonu

Projede 3 farklı etiket paralel kullanılıyor:
- `order` (legacy; `OrderDto`, `OrderCard`, `OrdersScreen`, `orderStatus.ts`)
- `request` (backend-native; `TowTruckRequestDetail`, `CraneRequest`, `requestsAPI`)
- `job` (UI runtime; `Job` interface, `jobId`, `JobDetailScreen`, `jobCounts`)

---

## 4. Fark analizi (OrderDto ↔ Backend types ↔ UI Job)

### Top-level field mapping

| OrderDto alanı | TowTruckRequestDetail | CraneRequest | TransferRequest | HomeMoving (any) | RoadAssistance (any) | UI Job (OrdersList) |
|---|---|---|---|---|---|---|
| `id: string` | `id: number` | `id: number` | `id: number` | `id: number` | `id: number` | `id: string` (toString) |
| `userId: string` | — | — | — | — | — | — (UI kullanmıyor) |
| `pickupLocation: LocationDto` | `pickup_address/latitude/longitude` (flat, string) | `address/latitude/longitude` (tek konum) | `pickup_*` | `from_*` veya `pickup_*` | `latitude/longitude/address` | `from: {lat, lng, address}` |
| `dropoffLocation: LocationDto` | `dropoff_*` | (crane tek noktalı) | `dropoff_*` | `to_*` veya `dropoff_*` | (tek nokta) | `to: {lat, lng, address}` |
| `vehicle: VehicleDto` | `vehicle_type/model/plate/color/year` | — | `vehicle_preference` | — | — | `vehicleType: string` (etiket) |
| `status: OrderStatus` | `status?: string` | `status?: string` | `status?: string` | `status` | `status` | `status: OrderStatus` |
| `price: number` | `final_price?/estimated_price` | `final_price?` | `final_price?/estimated_price` | `final_price/estimated_price` | `final_price/estimated_price` | `estimatedPrice: number` |
| `createdAt: string` | `created_at: string` | `created_at: string` | `created_at: string` | `created_at` | `created_at` | `createdAt: Date` |
| `updatedAt: string` | `updated_at: string` | `updated_at: string` | `updated_at: string` | `updated_at` | `updated_at` | — |
| `driverId?` | `my_offer.vehicle_id` ve auth içinden türetiliyor | benzer | benzer | benzer | benzer | — |
| `estimatedTime?` | `route_duration: string` | `estimated_duration_hours?` | — | — | — | — |
| `serviceType: 'tow'\|'crane'\|'transport'` | `requested_service_type` (flat string) | — (türü zaten crane) | `transfer_type` | — | — | `serviceType: 'crane'\|'tow'\|'transport'\|'nakliye'\|'roadAssistance'\|'transfer'` |
| `trackingToken?` | `trackingToken?` (camelCase) | `trackingToken?` | `trackingToken?` | `trackingToken?`/`tracking_token` | aynı | `trackingToken?` |

### Açık farklar ve tuzaklar

1. **Case/style farkı:** `OrderDto` **camelCase**, backend tipleri **snake_case** (bazı alanlar mixed camelCase: `requestOwnerNameSurname`, `trackingToken`). Mapper yazılmazsa her tüketici `request.pickup_latitude` gibi alanları kendisi okumak zorunda.
2. **Tip farkı:** `OrderDto.id` string; backend’de `id: number`. UI zaten `.toString()` ile dönüşüm yapıyor.
3. **Tip farkı:** Backend lat/lng **string** (`"41.0082"`), `OrderDto.LocationDto.latitude/longitude` **number**. UI `parseFloat` ediyor.
4. **Alan kaybı riski yok:** `OrderDto`'nun taşıdığı fakat backend'de olmayan hiçbir alan **UI tarafından okunmuyor** — dolayısıyla `OrderDto` silinince bilgi kaybı yoktur.
5. **UI'nin gerçekten kullandığı alanlar (`OrdersList.Job`) `OrderDto`'dan çok daha zengin:** `distance`, `description`, `movingType`, `preferredDate`. Bunlar zaten UI-only computed alanlardır; backend'den dümdüz gelmez, `useOrdersData` içinde kuruluyor.
6. **Union karmaşıklığı:** 5+ backend tipi var (+ 2 tanesi hâlâ `any`). `OrderCard`'ın tek bir tip bekliyor olması artık pratik bir kısıt değil çünkü `Job` zaten normalized intermediate bir shape.
7. **Status enum farkı:** `OrderStatus` (lib/types) 7 değerli sabit union; backend `status` alanı genel `string`. UI `filter as OrderStatus` cast'ı ile köprülüyor.

---

## 5. Önerilen migration yaklaşımı

### Karar: **Seçenek B-light (minimal normalize) — ancak YENİ DOSYA AÇMA**

Gerekçe:
- `useOrdersData.tsx` **zaten** beş farklı backend shape’i tek bir intermediate `{ id, serviceType, vehicleType, from, to, distance, estimatedPrice, status, createdAt, description, movingType?, trackingToken?, preferredDate? }` shape’e indirgiyor — yani mapper fiilen **var**.
- `OrdersList.tsx` içinde zaten bu shape için inline `interface Job` tanımlı.
- `OrderCard` hâlâ `OrderDto` etiketi taşıyor ama `(item as any)` ile bu shape’i okuyor.

Yani projede Seçenek B’nin kodu **zaten yazılmış**; eksik olan tek şey bu intermediate shape’e **resmi bir isim vermek** ve `OrderCard`'a onu tüketttirmek.

**Fiili plan:**
- Yeni mapper dosyası AÇMA: mevcut `useOrdersData.tsx` içindeki `craneRequestsAsJobs/...` blokları zaten mapper görevini görüyor. Bunları "normalizer" olarak bırak.
- Hafif bir tip tanımı `src/screens/orders/types.ts` dosyasına çıkar (inline `Job` buraya taşınır; UI-only olduğu için `src/types/` yerine feature folder’da durması mevcut feature-based konvansiyona uyar).
- `OrderCard`'ın prop’u `OrderDto` yerine bu yeni `OrdersJob` (ya da isim tercihin: `UiOrder`) tipini bekler.
- Mevcut `OrderCard` fallback’ları kaldırılır (`item.pickupLocation?.address` dalları; çünkü yeni tipte bu alanlar yok — her çağıran zaten `from`/`to` veriyor).

Seçenek A (doğrudan backend union) tercih edilmedi çünkü:
- 3 backend tipi (`TowTruckRequestDetail | CraneRequest | TransferRequest`) + 2 `any` ile union kurulsa bile `OrderCard` yine 5 farklı yol için discriminated union’lara girmek zorunda kalır. Bugünkü tek normalized shape daha sade.

**Önerilen tip adları:**
- Feature-local: `OrdersJob` (en düşük isim çakışması) veya `UiOrder`.
- Konum: `helpermobile/src/screens/orders/types.ts` (tek tip için yeni klasör kurmaya değmez; dosya 20–30 satır kalır).

**Mapper tek dosyaya çıkartma (opsiyonel, P2):** `useOrdersData.tsx` şu an 751 satır; içindeki beş adet `*AsJobs` useMemo bloğu ileride `src/screens/orders/mappers/{crane,tow,nakliye,roadAssistance,transfer}ToOrdersJob.ts` altına çıkarılabilir — ama bu migrasyon scope’una girmeyecek; `OrderDto` silindikten sonra ayrı bir P2 refactor olarak yapılır.

---

## 6. Riskler

| Risk | Seviye | Mitigasyon |
|---|---|---|
| `OrderCard`'ın fallback cast’leri (`(item as any).from` vs `item.pickupLocation`) kaldırıldığında bir caller'ın eski shape göndermesi | Düşük | Aktif tek caller `OrdersList.tsx` — yeni `OrdersJob` tipine migre edilecek. Başka caller yok. |
| `OrderStatus`’ün yanlışlıkla silinmesi | Orta | **SİLİNMEMELİ**. Plan’da explicit kalıyor. 10 aktif tüketici var. |
| `screens/OrdersScreen.tsx` dead dosyasının silinmesi başka yerden kırılma yaratır mı? | Düşük | Grep sonucu: hiçbir import yok. Güvenle silinebilir. Navigation `screens/orders/` klasörünü kullanıyor. |
| `VehicleType` silinmesi diğer ekranlarda çakışır mı? | Yok | Diğer ekranlardaki `VehicleType` kendi local tanımları (`MovingVehicleType`, `HelperVehicleType` vb.). `lib/types.VehicleType`'ın dışardan tek import’u **yok** (grep: 0). |
| snake_case → camelCase mapping’de alan eksik kalır | Düşük | `OrderCard`'ın okuduğu alanlar zaten 3 tane (`id`, `status`, `from/to.address`, `vehicleType`). Mapping `useOrdersData` içinde zaten mevcut. |
| Nakliye + RoadAssistance `any[]` halde kalırsa tip güvenliği artmaz | Orta (out-of-scope) | Bu migrasyonla ilgili değil. Ayrı bir P1: `HomeMovingRequest`, `CityMovingRequest`, `RoadAssistanceRequest` tiplerinin yazılması. Planda out-of-scope. |
| `OrderDto` import edilen bir başka branch/PR açıkken merge edilmesi durumunda breaking | Orta | PR açılır açılmaz kısa bir grep (CI'da veya manuel) `from '../lib/types'` üzerinde `OrderDto` arar. |
| `OrderCard` prop tipi değişince useOrdersData'nın output shape'i prop interface’i ile tam uyuşmalı | Orta | `OrdersJob` tipi tek source olarak kullanılmalı; `useOrdersData`’daki `*AsJobs` memolarının dönüş tipi `OrdersJob` olarak annotate edilmeli (implicit değil, explicit). |

---

## 7. Migration planı — fazlara bölünmüş

### Faz 0 — Dead code temizliği (bağımsız yapılabilir)

| Dosya | Değişiklik | Tahmini diff |
|---|---|---|
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/screens/OrdersScreen.tsx` | SİL (orphan, 724 satır, kimse import etmiyor) | -724 satır |

Risk: **Düşük**. Grep doğruladı, import yok.

### Faz 1 — UI tip tanımı

| Dosya | Değişiklik | Tahmini diff |
|---|---|---|
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/screens/orders/types.ts` | **YENİ** — `export interface OrdersJob { ... }` (mevcut `OrdersList.tsx` içindeki `Job`’u buraya taşı; fields: `id`, `serviceType`, `vehicleType`, `movingType?`, `from`, `to`, `distance`, `estimatedPrice`, `status: OrderStatus`, `createdAt: Date`, `description`, `trackingToken?`, `preferredDate?`) | +~30 satır |
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/screens/orders/components/OrdersList.tsx` | Inline `Job` interface’ini sil, yerine `import { OrdersJob } from '../types'` | -20 / +2 satır |

Risk: **Düşük**. `OrderStatus` kullanımı zaten kuruluyor.

### Faz 2 — OrderCard'ı yeni tipe geçir

| Dosya | Değişiklik | Tahmini diff |
|---|---|---|
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/components/OrderCard.tsx` | `import { OrderDto } from '../lib/types'` → `import { OrdersJob } from '../screens/orders/types'`. `Props.item: OrderDto` → `Props.item: OrdersJob`. `(item as any).*` cast’lerini kaldır; `item.from.address`, `item.to.address`, `item.vehicleType`, `item.description`, `item.preferredDate`, `item.movingType` olarak doğrudan oku. `item.pickupLocation`, `item.dropoffLocation`, `item.vehicle` fallback dallarını sil. `item.id.toString().slice(-2)` bölümü `OrdersJob.id` zaten string olduğu için olduğu gibi kalır. | -30 / +5 satır |

Risk: **Orta**. Component davranışı birebir korunur çünkü zaten yeni shape'i okuyordu. Ama cast kaldırılınca eski shape gelirse TS fail eder → güvenlik artar.

Opsiyonel olarak `components/OrderCard.tsx` → `screens/orders/components/OrderCard.tsx` taşınabilir (feature-based konvansiyon). Bu taşıma scope’u genişletir; **aynı PR’da yapılması önerilmez** (Faz 2.1 ayrı mini-PR).

### Faz 3 — useOrdersData output tipini annotate et

| Dosya | Değişiklik | Tahmini diff |
|---|---|---|
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/screens/orders/hooks/useOrdersData.tsx` | `craneRequestsAsJobs`, `towTruckRequestsAsJobs`, `nakliyeRequestsAsJobs`, `roadAssistanceRequestsAsJobs`, `transferRequestsAsJobs` return tiplerini explicit olarak `OrdersJob[]` yap. `import { OrdersJob } from '../types'` ekle. (İsteğe bağlı) `serviceType: 'transport' as const // OrderDto tipine uygun` yorumunu güncelle. | +5 / -1 satır |

Risk: **Düşük**. Runtime davranış değişmez; sadece tip uyumu kontrolü sıkılaşır.

### Faz 4 — lib/types.ts temizliği (final adım)

| Dosya | Değişiklik | Tahmini diff |
|---|---|---|
| `/Users/furkankaansaka/Desktop/YolSepetiGOSurucuRefactor/helpermobile/src/lib/types.ts` | `VehicleType` (3. satır), `LocationDto` (46–52), `VehicleDto` (54–61), `OrderDto` (63–77) sil. `OrderStatus` kalır. Diğer tipler (`ProviderVehicle`, `ProviderCrane`, `AuthUser`, `AuthState`, `HelperRole`, `NotificationDto`, `NotificationType`) kalır. | -~30 satır |

Risk: **Düşük** (diğer fazlar bittikten sonra). Bu adımdan önce `OrderDto` / `LocationDto` / `VehicleDto` / `VehicleType` import’u yok: grep’te doğrulandı, yalnızca `OrderCard.tsx` (Faz 2’de taşınacak) kaldı.

**CI check (insan eliyle grep yeterli):**
```
grep -R "OrderDto\|LocationDto\b\|VehicleDto\b" helpermobile/src | grep -v "lib/types.ts"
```
Boş dönmeli.

### Fazların bağımlılığı

```
Faz 0  (bağımsız; ayrı PR)
Faz 1  ->  Faz 2  ->  Faz 3  ->  Faz 4
```

Her faz **tek PR** olabilir (toplam 4–5 küçük PR). Davranış değişmediği için her PR tek başına güvenli merge edilebilir.

### Önerilen PR sırası

| # | PR adı | Fazlar | Tahmini satır değişikliği | Risk |
|---|---|---|---|---|
| 1 | chore(orders): remove orphan OrdersScreen legacy file | Faz 0 | -724 | Düşük |
| 2 | refactor(orders): introduce OrdersJob type | Faz 1 | +32 / -22 | Düşük |
| 3 | refactor(OrderCard): consume OrdersJob instead of OrderDto | Faz 2 | -35 / +10 | Orta (test odaklı) |
| 4 | chore(orders): annotate useOrdersData return types | Faz 3 | +5 / -1 | Düşük |
| 5 | chore(types): remove OrderDto, LocationDto, VehicleDto, VehicleType | Faz 4 | -32 | Düşük |

---

## Refactor Summary

- **Scope:** `helpermobile/src/lib/types.ts` içindeki legacy `OrderDto`, `LocationDto`, `VehicleDto`, `VehicleType` tiplerinin güvenli kaldırılması; `OrderStatus` korunuyor.
- **Karar:** Seçenek B-light — yeni `OrdersJob` adıyla feature-local UI tipi (`src/screens/orders/types.ts`). Ayrı mapper dosyası AÇILMIYOR çünkü `useOrdersData` içindeki beş `*AsJobs` memo bloğu fiilen mapper görevini görüyor; sadece explicit return type annotation ekleniyor.
- **Küçük iş:** Faz 0 (orphan `screens/OrdersScreen.tsx` silme) ve Faz 4 (lib/types temizliği) mekanik, birer saatlik işler.
- **Büyük iş:** Faz 2 (`OrderCard` prop migrasyonu) — 30–50 satır ama component davranışı ve snapshot testi (varsa) gözden geçirilmeli; bu migrasyonun davranışsal riski buradadır.
- **Out-of-scope (ayrı P1 önerisi):** Nakliye ve RoadAssistance backend response tipleri hâlâ `any[]`. Bu migrasyondan sonra ayrı bir tip yazımı önerilir (`HomeMovingRequest`, `CityMovingRequest`, `RoadAssistanceRequest`), ama OrderDto migrasyonunu bloklamaz.
- **Next Best Step:** Faz 0 (orphan silme) hemen ayrı bir PR olarak yapılabilir — diğer fazlardan bağımsız ve sıfır risk.

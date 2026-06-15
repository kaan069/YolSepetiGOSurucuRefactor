# Backend Görev: Bildirim Payload'ında `service_type` Alanı

Selam Dalyarak Bey,

## Bağlam

Sürücü mobil uygulaması bildirim/banner ile sürücüyü ilgili iş detayına yönlendiriyor (yeni talep, onay sonucu, ödeme tamamlanma vb.). Yönlendirme için frontend, payload'taki iş ID'sine göre **doğru servisin** detail endpoint'ini çağırması gerekir:

```
GET /requests/tow-truck/details/<id>/
GET /requests/crane/details/<id>/
GET /requests/home-moving/details/<id>/
GET /requests/city-moving/details/<id>/
GET /requests/road-assistance/details/<id>/
GET /requests/transfer/details/<id>/
```

Her hizmetin **ayrı tablosu + ayrı ID dizisi** var → aynı ID birden fazla hizmette bulunabilir.

## Sorun

Şu an bildirim payload'unda gelen `service_type` alanı **ya yok ya yanlış**. Frontend kodunda açık not var ([helpermobile/src/utils/notificationNavigation.ts:374-380](helpermobile/src/utils/notificationNavigation.ts)):

```ts
/**
 * Bildirim payload'ından gelen `service_type` field'ı yanlış / eksik olabiliyor (örn.
 * tüm servislerin tow olarak resolve olması). Bu yüzden detail endpoint çağrısı önce
 * belirlenen servisle yapılır; 404 alınırsa diğer servisler sırayla denenir.
 */
```

Bu yüzden frontend her bildirimde **defansif fallback** yapıyor — 6 endpoint'i sırayla deniyor:

```
GET /requests/tow-truck/details/173/   → 404
GET /requests/crane/details/173/       → 404
GET /requests/home-moving/details/173/ → 404
GET /requests/city-moving/details/173/ → 200 ✅ ("matched alternate service")
```

Görünürde işlev çalışıyor (sonunda doğru iş açılıyor) ama 4 ciddi risk var:

### Risk 1 — Yanlış iş açılması (sessiz bug) 🔴

Her hizmet ayrı tablo + ayrı ID dizisi kullandığı için **ID 173** hem `city_moving`'de hem `tow_truck`'ta var olabilir. Frontend "ilk 200 OK döneni" alıyor → sürücüye **yanlış müşterinin işini açabilir**. Yanlış adrese gider, yanlış müşteriyi arar. Test ortamında ID çakışması az olduğu için fark edilmez, üretimde sessiz bug.

### Risk 2 — Yeni hizmet eklenince sessiz arıza 🔴

Yarın 7. servis eklenirse (örn. kurye), frontend fallback listesinde olmadığı sürece o servisin banner'ı **hiçbir endpoint'i bulamaz**. Sürücü bildirime basar, hiçbir şey olmaz. Kod review'da gözden kaçar.

### Risk 3 — Backend yükü ve rate limit 🟡

Her bildirim = 4-6 gereksiz HTTP isteği. 1000 aktif sürücü × günde 5 bildirim ≈ günde 30.000 gereksiz 404 isteği. Backend'e rate limit konulursa, gerçek istekler bu gürültüde rate limit'e takılabilir.

### Risk 4 — Monitoring/log spam 🟡

Frontend `logger.error` çağırdığı için bu 404'lar Sentry/Crashlytics gibi monitoring araçlarına **gerçek hata olarak** akıyor. Gerçek bug'lar bu gürültüde kaybolur.

## Beklenen Davranış

Bildirim ve WebSocket event payload'larında `service_type` alanı **doğru** dönsün — frontend tek istekte doğru endpoint'i çağırabilsin.

### Geçerli `service_type` değerleri

Frontend'in beklediği literal değerler (`OfferServiceKey` union, [notificationNavigation.ts:380](helpermobile/src/utils/notificationNavigation.ts)):

```
'tow' | 'crane' | 'home_moving' | 'city_moving' | 'road_assistance' | 'transfer'
```

⚠️ Backend tarafında bazı servisler farklı isim kullanıyor olabilir (`tow_truck`, `home_to_home_moving`, `city_to_city` vb.). Payload'a yazılan değer **yukarıdaki literal'lardan biri** olmalı; backend dahili adlandırması farklıysa serializer / notification layer'da mapping yapılsın.

### Etkilenen kanallar

Aynı sorun her iki kanalda da var olabilir; her ikisinin de düzeltilmesi gerekiyor:

1. **Push notification payload** (FCM / APNS)
   - `data` payload'ında `service_type` alanı
2. **WebSocket event payload**
   - `job_update`, `new_job`, `payment_completed` gibi event'lerin body'sinde `service_type` alanı
3. **Banner / status endpoint dönüşleri** (varsa)
   - Bildirim sonrası açılan endpoint'lerin response shape'inde `service_type` alanı

Backend ekibi hangi katmanda eksik gönderdiğini teşhis etsin ve her birinde düzeltsin.

## Payload Örnekleri

### Push notification (FCM data payload)

**Mevcut (eksik):**
```json
{
  "type": "new_job",
  "request_id": 173,
  "title": "Yeni Talep",
  "body": "..."
}
```

**Beklenen:**
```json
{
  "type": "new_job",
  "request_id": 173,
  "service_type": "city_moving",
  "title": "Yeni Talep",
  "body": "..."
}
```

### WebSocket event

**Mevcut (yanlış — tüm servisler "tow" dönüyor):**
```json
{
  "type": "job_update",
  "request_id": 173,
  "service_type": "tow",
  "status": "awaiting_payment"
}
```

**Beklenen (doğru tip):**
```json
{
  "type": "job_update",
  "request_id": 173,
  "service_type": "city_moving",
  "status": "awaiting_payment"
}
```

## Test Senaryosu

1. `city_moving` (şehirler arası nakliye) türünde yeni bir talep oluştur.
2. Sürücüye `new_job` bildirimi gönder (FCM + WebSocket).
3. Sürücü cihazının log'larına bak:
   ```
   [navigation] [Banner] received notification { service_type: 'city_moving', request_id: 173 }
   ```
4. Tek bir HTTP isteği görülmeli:
   ```
   GET /requests/city-moving/details/173/ → 200
   ```
5. Şu log'lar **görülmemeli**:
   ```
   ❌ [Banner] matched alternate service
   ❌ ERROR /requests/tow-truck/details/173/ → 404
   ❌ ERROR /requests/crane/details/173/ → 404
   ```

Tüm 6 servis için bu test tekrarlanmalı (tow, crane, home_moving, city_moving, road_assistance, transfer).

## Frontend Tarafında Sonraki Adım

Backend payload düzeltilip yayına alındıktan sonra mobil tarafta ayrı bir görev olarak:

- `findRequestDetail()` fonksiyonundaki fallback for-loop **kaldırılacak**.
- Sadece payload'taki `service_type` ile **tek istek** atılacak.
- 404 alınırsa "iş bulunamadı" hatası kullanıcıya gösterilecek (artık sessizce başka servisi denemeyecek).
- Sentry'deki 404 spam'i kalkacak.

Backend yayına aldığında haber verin, frontend tarafında refactor edip yeni release ile yayına alacağız.

## Soru / Geri Bildirim

- Mevcutta `service_type` payload'da hangi katmanda boş bırakılıyor / hard-coded "tow" yazılıyor? (Notification serializer? WebSocket consumer? Signal handler?)
- Yukarıdaki literal değerler (tow, crane, home_moving, …) backend için sorun yaratıyor mu, mapping katmanı eklemek mantıklı mı?
- Geri dönüş için: `@kaan` veya issue tracker.

# Backend Görev: Admin Manuel Status Değişimi — Sürücü Atama Temizliği (Transition Logic)

Selam Dalyarak Bey,

## Bağlam

Admin panelden bir işin status'u manuel olarak değiştirildiğinde, sürücü mobil uygulamasında **status'a göre asimetrik davranış** gözlemleniyor:

| Admin değişim | Sürücüde görünür mü? | Hangi sekme |
|---|---|---|
| `→ pending` | ❌ Hayır | "Gelen İşler" badge artıyor ama liste boş |
| `→ awaiting_approval` | ❌ Hayır | "Onay Bekleyen" boş |
| `→ awaiting_payment` | ✅ Evet | "Ödeme Bekleniyor" sekmesinde görünüyor |
| `→ in_progress` | ✅ Evet | "Devam Eden" sekmesinde görünüyor |

## Sorun ve Root Cause

Frontend her sekme için farklı endpoint çağırıyor:

| Sekme | Endpoint | Backend filter (tahmin) |
|---|---|---|
| Gelen İşler (pending) | `GET /requests/<service>/details/` | `assigned_driver_id IS NULL` + driver-fit filter |
| Onay Bekleyen | `GET /requests/<service>/details/` (frontend `status==='awaiting_approval'` filter) | Aynı yukarıdaki |
| Ödeme Bekleniyor | `GET /requests/<service>/awaiting-payment/` | **Sürücüye atanmış** işler |
| Devam Eden | `GET /requests/<service>/in-progress/` | **Sürücüye atanmış** işler |

**Net tanı:** Admin işi `awaiting_payment` veya `in_progress`'ten geri `pending`/`awaiting_approval`'a çevirdiğinde, backend tarafında **sürücü atama kaydı (assignment) temizlenmiyor**. İş hala "bu sürücüye atanmış" olarak işaretli. Bu yüzden:

- `awaiting_payment` / `in_progress` endpoint'leri → atanmış işleri döndüğü için iş görünüyor ✅
- `/details/` endpoint'i → "atanmamış müsait işler" döndüğü için iş gözükmüyor ❌

WebSocket `new_job` count event'i kanal-bazlı geldiği için badge artıyor ama liste boş — frontend için cidden kafa karıştırıcı.

Bu pattern **dört hizmet türünde de aynı**: towTruck, crane, transfer, roadAssistance. Nakliye için dedicated `/pending/` endpoint'i var ama büyük ihtimal aynı root cause orada da geçerli.

## Beklenen Davranış

Admin status değişimi sırasında **transition logic** çalışmalı: önceki status'taki sürücü-iş ilişkileri (atama, teklif, ödeme, başlangıç) yeni status'a uygun şekilde **temizlenmeli veya korunmalı**.

### Transition Matrix

| Eski Status | Yeni Status | Yapılması Gerekenler |
|---|---|---|
| `awaiting_payment` | `pending` | `assigned_driver_id = NULL`, `driver_vehicle_id = NULL`, ilgili `driver_offer` kaydını sil, payment kaydını rollback, **`new_job` WebSocket event'i** tetikle (uygun sürücülere) |
| `in_progress` | `pending` | Yukarıdakilere ek olarak: `job_started_at = NULL`, tracking session'ı kapat, location WebSocket'ini force-close (sürücü tarafı) |
| `awaiting_payment` | `awaiting_approval` | Payment kaydını rollback (varsa), `assigned_driver_id` koru, `driver_offer.status = 'awaiting_approval'` koru |
| `in_progress` | `awaiting_approval` | `job_started_at = NULL`, tracking session'ı kapat, payment kaydını rollback (varsa), atama/teklif kayıtlarını koru |
| `in_progress` | `awaiting_payment` | `job_started_at = NULL`, tracking session'ı kapat, payment kaydını rollback (varsa), atama koru |
| `completed` | herhangi | Special case — ödeme tamamlanmışsa rollback dikkatli yapılmalı (muhasebe etkisi) |

### Forward transition'lar (normal akış zaten çalışıyor)

`pending → awaiting_approval → awaiting_payment → in_progress → completed` ileri yönde sıkıntı yok; bu doküman sadece **geri çevirme** durumları için.

## Etkilenen Servisler ve Tablolar

Frontend 6 hizmet türü için ayrı endpoint setleri kullanıyor:

| Hizmet | API namespace | Tahmini ilgili tablolar |
|---|---|---|
| Çekici (tow) | `/requests/tow-truck/...` | `tow_truck_request`, `tow_truck_offer` |
| Vinç (crane) | `/requests/crane/...` | `crane_request`, `crane_offer` |
| Evden Eve | `/requests/home-moving/...` | `home_moving_request`, `home_moving_offer` |
| Şehirler Arası | `/requests/city-moving/...` | `city_moving_request`, `city_moving_offer` |
| Yol Yardımı | `/requests/road-assistance/...` | `road_assistance_request`, `road_assistance_offer` |
| Transfer (servis+vip) | `/requests/transfer/...` | `transfer_request`, `transfer_offer` |

Transition logic her hizmetin Django model'inde / signal'ında ortak bir helper olarak yazılabilir (örn. `apps/<service>/services/status_transition.py`).

## Test Senaryosu (Backend için)

Aşağıdaki **16 senaryo**nun her birini ayrı bir admin manuel değişim ile test et. Her senaryoda sürücü mobil tarafında **ilgili sekmede iş görünmeli**.

### Çekici (tow_truck)
1. awaiting_payment → pending: "Gelen İşler"de görünmeli
2. awaiting_payment → awaiting_approval: "Onay Bekleyen"de görünmeli
3. in_progress → pending: "Gelen İşler"de görünmeli
4. in_progress → awaiting_approval: "Onay Bekleyen"de görünmeli

### Vinç (crane), Transfer, Yol Yardımı: Aynı 4 senaryo tekrarlanır

Toplam: 4 hizmet × 4 transition = **16 senaryo**.

Nakliye (evden eve + şehirler arası) için ayrıca aynı 4 senaryo test edilebilir = +8 senaryo (toplam 24).

## Beklenen Frontend Sonucu (transition logic eklendikten sonra)

Frontend tarafında log'da bekleniyor:

```
[orders] [diagnostic] getAvailableTowTruckRequests {
  allDetailsCount: 12,
  pendingOrAwaitingCount: 3,
  myAwaitingIdsCount: 0,         ← Önceki testte 1'di; admin transition sonrası temiz
  returnedCount: 3,              ← İş artık listede
  pendingIds: [173, ...],        ← Geri çevrilen iş burada
  myAwaitingIds: []              ← Sürücünün eski awaiting kaydı temizlendi
}
```

Backend yayına aldıktan sonra mobil tarafta bu diagnostic log'lar kaldırılacak.

## Sorular / Geri Bildirim

Backend ekibi yanıtlasın:

1. **`/requests/<service>/details/` endpoint'inin tam filter'ı nedir?** Hangi koşullar atanmamış sayılıyor (assigned_driver_id IS NULL? driver_offer kaydı yok? hizmet alanı içi?)
2. **Admin panel** status değişikliği hangi Django view/serializer üzerinden geçiyor? (Status field doğrudan edit mi, action button mu?)
3. Transition logic ortak bir **signal** veya **service method** olarak yazılabilir mi (her status değişimini intercept ederek)?
4. `completed` durumdan rollback — muhasebe/raporlama açısından kritik mi? (Bu admin için tehlikeli bir aksiyon olabilir; UI'da onay diyaloğu eklenebilir.)
5. WebSocket event'leri: `new_job` event'i atılırken hedef sürücüler nasıl belirleniyor (kanal vs sürücü-spesifik filter)?

## Geçici Workaround (Backend yayına alınana kadar)

Admin tarafından manuel status değişimi yapılacaksa, **yalnızca `awaiting_payment` ve `in_progress`'e çevirmek güvenli** — mobil tarafta sekmede iş görünür. `pending` veya `awaiting_approval`'a çevrilen işler şu an mobil sürücü ekranında görünmüyor (badge yanıp sönüyor ama liste boş).

Acil bir test ihtiyacı varsa kullanıcı bu kısıtla çalışmak zorunda kalır; backend transition logic eklendikten sonra tüm transition'lar düzgün çalışacak.

## Geri Dönüş

- Geri bildirim için: `@kaan` veya issue tracker.
- Yayına alındığında haber verin — mobil tarafta cihaz testi + diagnostic log temizliği yapılır.

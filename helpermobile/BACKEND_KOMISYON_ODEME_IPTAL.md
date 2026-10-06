# Backend Görev: Komisyon Ödemesi Sırasında Müşteri İptali — Sözleşme Netleştirme

Selam Dalyarak Bey,

## Bağlam

Sürücü uygulamasında komisyon ödeme modalı (kart seçimi → 3DS → sonuç) açıkken müşteri talebi iptal ederse, modal artık bunu anında algılayıp kapanıyor ve sürücüye **"Müşteri talebi iptal etti. Bu iş için ödeme alınmadı."** uyarısı gösteriyor.

Frontend iptali 5 kanaldan yakalıyor:

| # | Kanal | Frontend neye bakıyor |
|---|-------|------------------------|
| 1 | WebSocket `job_cancelled` | `data.job_id` (servis tipi WS bağlantısından) |
| 2 | FCM (uygulama ön plandayken) | `data.type` ∈ `request_cancelled`, `request_auto_cancelled` + `data.request_id` |
| 3 | Ödeme başlatma hatası | `error.code === 'REQUEST_CANCELLED'` |
| 4 | 3DS banka dönüş URL'i | URL içinde `reason=REQUEST_CANCELLED` |
| 5 | `GET /payment/commission/<id>/status/` | `status === 'cancelled'` veya `cancel_reason === 'REQUEST_CANCELLED'` |

Ek olarak WebSocket bağlı değilse, modal açıkken 5 saniyede bir iş detayı sorgulanıyor; iş `cancelled` ya da `awaiting_approval` durumuna geçmişse iptal sayılıyor.

Frontend bu alanların bir kısmını **varsayımla** yazdı. Aşağıdaki maddelerde backend'in onayına / düzeltmesine ihtiyacımız var.

---

## 1. İptal bildirimlerinde `service_type` eksik 🔴

Her hizmetin ayrı tablosu ve ayrı ID dizisi var (bkz. `BACKEND_NOTIFICATION_SERVICE_TYPE.md`). Frontend şu an iptali **sadece ID ile** eşleştiriyor.

**Sorun senaryosu:** Sürücü transfer #42'nin komisyonunu öderken, başka bir hizmetteki #42 iptal edilir → modal yanlışlıkla kapanır, sürücüye "müşteri iptal etti" denir, ödeme yarıda kalır.

**İstek:**
- FCM `request_cancelled` ve `request_auto_cancelled` `data` payload'ına `service_type` eklensin (değerler: `tow | crane | home_moving | city_moving | road_assistance | transfer`).
- WebSocket `job_cancelled` event'i sadece **ilgili servisin** kanalına mı gidiyor? Onaylarsanız WS tarafı için ek alan gerekmez; değilse oraya da `service_type` eklensin.

## 2. Komisyon ödeme durumu: iptal nasıl dönüyor? 🟠

`GET /payment/commission/<request_id>/status/` için frontend'deki tip şu an:

```ts
status: 'pending' | 'processing' | 'completed' | 'failed'
```

Ama kod pratikte `no_payment` ve `initiated` değerlerini de karşılıyor, iptal için de `cancelled` / `cancel_reason` bekliyor.

**Soru:** Talep iptal edildiğinde bu endpoint ne dönüyor? Tam liste ile birlikte netleştirelim:
- `status` alabileceği tüm değerler
- İptalde `status: 'cancelled'` mı, `cancel_reason: 'REQUEST_CANCELLED'` mı, ikisi birden mi?

## 3. Ödeme başlatma hatasının gövdesi 🟡

İptal edilmiş iş için ödeme başlatılırsa frontend şu gövdeyi bekliyor (HTTP kodu fark etmez):

```json
{ "error": { "code": "REQUEST_CANCELLED", "message": "..." } }
```

**Soru:** Bu format doğru mu? HTTP kodu nedir (400 / 409)?

## 4. 3DS sırasında iptal: para çekiliyor mu? 🔴

En kritik madde bu. Sürücü 3DS ekranındayken müşteri iptal ederse ve banka onay verirse:

- Backend tahsilatı **tamamlamıyor / iptal-iade ediyor** mu?
- Banka dönüş URL'ine `reason=REQUEST_CANCELLED` parametresi gerçekten ekleniyor mu?

Frontend bu durumda sürücüye "ödeme alınmadı" diyor. Para çekiliyorsa mesaj yanlış olur ve destek talebi doğar; bunu kesinleştirmemiz lazım.

## 5. `awaiting_approval` = iptal mi? 🟡

Ödeme beklerken iş tekrar `awaiting_approval` durumuna dönerse (örn. sürücü işten kaldırıldı), frontend bunu da "müşteri iptal etti" olarak gösteriyor. Bu durumda mesaj yanıltıcı oluyor.

**İstek:** İş detayına iptal/geri dönüş sebebi eklensin (örn. `cancel_reason: 'customer_cancelled' | 'auto_cancelled' | 'driver_removed'`). Frontend her sebep için doğru mesajı göstersin.

---

## Özet

| # | Konu | Tip | Öncelik |
|---|------|-----|---------|
| 1 | İptal FCM/WS payload'ına `service_type` | Geliştirme | 🔴 |
| 2 | Ödeme durumu endpoint'inin `status` değerleri | Onay + doküman | 🟠 |
| 3 | `REQUEST_CANCELLED` hata gövdesi ve HTTP kodu | Onay | 🟡 |
| 4 | 3DS sırasında iptalde tahsilat / iade garantisi | Onay | 🔴 |
| 5 | İş detayında `cancel_reason` | Geliştirme | 🟡 |

Cevaplarınıza göre frontend tiplerini ve eşleştirmeyi güncelleyeceğiz. Teşekkürler.

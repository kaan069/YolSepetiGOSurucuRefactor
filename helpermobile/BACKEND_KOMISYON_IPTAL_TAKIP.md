# Backend Takip: Komisyon Ödemesi İptal Kodları — Kalan Sorunlar

Selam Dalyarak Bey,

Cevaplarınız ve `09345bb` commit'i için teşekkürler (`feat(payment): iptal sebep kodlari, servis tipi ve admin iptali ortak servise`). Sürücü uygulaması yeni sözleşmeye göre güncellendi. Commit'i incelerken aşağıdaki noktaları gördük. Hiçbirinde para riski yok; mesaj tutarlılığı ve doküman doğruluğuyla ilgili.

Önceki doküman: `BACKEND_KOMISYON_ODEME_IPTAL.md`

---

## Frontend'de yapılanlar (bilginiz olsun)

- 5 sebep kodu (`REQUEST_CANCELLED`, `REQUEST_CLOSED`, `JOB_REASSIGNED`, `ALREADY_ACTIVE`, `PAYMENT_NOT_ACTIVE`) dört kanalda da işleniyor: 409 başlatma hatası, banka dönüşü `reason` / `error`, ödeme durumu `cancel_reason` / `cancel_message`, iş detayı `cancelReason` / `cancelMessage`.
- Önerdiğiniz gibi "Müşteri talebi iptal etti" popup'ı sadece `REQUEST_CANCELLED` için çıkıyor. Diğer kodlarda sizin gönderdiğiniz mesaj olduğu gibi gösteriliyor.
- WebSocket `job_cancelled` ve FCM iptallerinde `reason` okunuyor: `customer_cancelled` → müşteri iptali, diğerleri (`admin_cancelled`, `payment_timeout`, `expired`) → genel iptal mesajı.
- Yedek kontrolde `awaiting_approval` artık iptal sayılmıyor, karar detaydaki `cancelReason` ile veriliyor.
- Ödeme durumu tipi güncellendi (`refunded`, `cancelled`, `no_payment`, `payment_method: iyzico | stripe | manual | nfc`, `request_status`). `error_message` beklenmiyor.

---

## 1. Müşteri iptali kısa bir süre `REQUEST_CLOSED` görünüyor 🟠

**Yer:** `apps/request/views/tracking.py` → `CustomerCancelRequestView.delete` (satır ~562–576)

```python
vehicle_request, old_status = cancel_unpaid_request(vehicle_request.id)   # 562
...
CompletionAuditLog.objects.create(completed_by='customer', ...)           # ~572
```

- View `transaction.atomic` içinde değil ve projede `ATOMIC_REQUESTS` açık değil.
- `cancel_unpaid_request` kendi transaction'ını commit ediyor; `on_commit` ile WebSocket + FCM **hemen** gidiyor.
- `CompletionAuditLog(completed_by='customer')` ancak ondan **sonra** yazılıyor.
- `cancel_reason.cancelled_by_customer()` müşteri iptalini bu log'a bakarak tespit ediyor.

**Sonuç:** İptal ile log yazımı arasındaki pencerede banka dönüşü, `GET /payment/commission/<id>/status/` veya iş detayı gelirse `REQUEST_CANCELLED` yerine `REQUEST_CLOSED` döner. Sürücü "Müşteri talebi iptal etti" yerine "Talep iptal edildi" görür. Aynı anda WebSocket'ten `reason: customer_cancelled` geldiği için kanallar birbiriyle çelişir.

`CancelAcceptedOfferView` (`offers.py`) `@transaction.atomic` olduğu için bu sorun orada yok.

**Öneri (biri yeterli):**
- `CustomerCancelRequestView.delete` içindeki iptal + audit log bloğunu `transaction.atomic()` içine alın (`on_commit` dış commit'e kadar bekler), **veya**
- Audit log'u `cancel_unpaid_request` içinde, aynı transaction'da yazın (örn. `completed_by` parametresiyle), **veya**
- Sebebi audit log'dan çıkarmak yerine talep üzerinde saklayın (örn. `VehicleRequest.cancel_reason`). Böylece WebSocket'teki `reason` ile tek kaynaktan gelir.

## 2. Ödenmiş iş iptallerinde FCM payload'ı eksik 🟡

**Yer:** `apps/request/services/cancellation_service.py` → `_send_cancellation_fcm` (satır 318 ve 328)

```python
data={'type': 'request_cancelled', 'request_id': str(vehicle_request.id)}
```

Cevabınızda "iptal push bildirimleri artık servis tipini taşıyor" deniyordu. Bu doğru, ama sadece `unpaid_cancel.py` ve `tasks.py` için. `in_progress` işlerin iptalinde (iade akışı) giden `request_cancelled` bildiriminde `service_type`, `cancelled_by` ve `reason` yok.

Komisyon modalını etkilemiyor (ödenmiş işte modal açık olmaz). Ama bildirime dokunulunca uygulama bu tipte hâlâ 6 detay ucunu sırayla denemek zorunda kalıyor.

**İstek:** Aynı alanları buraya da ekleyin:
- `service_type` (`to_wire_service_type`)
- `cancelled_by`: `customer` / `driver` / `system`
- `reason`

## 3. Banka dönüşünde `reason` her durumda gelmiyor 🟡 (doküman)

**Yer:** `apps/payment/views_commission.py` satır ~243

Cevapta "banka dönüş adresine her durumda `reason=<KOD>` ve `error=<mesaj>` eklenir" deniyordu. Kodda `reason` sadece `error_code` 5 sebep kodundan biriyse ekleniyor. Normal kart hatalarında yalnızca `payment=failed&error=...` geliyor.

Frontend iki durumu da karşılıyor; değişiklik gerekmiyor. Sadece doküman / API sözleşmesi buna göre düzeltilsin.

## 4. Başlatma `awaiting_approval`'a izin veriyor, tamamlama reddediyor 🟡

- `InitiateCommissionPaymentView` (satır ~98): `status not in ['awaiting_approval', 'awaiting_payment']` → `awaiting_approval` durumunda ödeme **başlatılabiliyor**.
- `completion_blocker` → `payment_blocker_for_driver`: `awaiting_approval` → `JOB_REASSIGNED` → banka dönüşünde tahsilat **reddediliyor**. Sürücüye "Bu iş artık size atanmış değil" deniyor, oysa iş hâlâ ona atanmış olabilir.

Sürücü uygulaması ödeme kartını sadece `awaiting_payment` durumunda gösterdiği için bugün bizi etkilemiyor. Yine de iki uç birbiriyle tutarlı olsun: ya başlatma sadece `awaiting_payment` kabul etsin, ya da bu durum için ayrı bir kod dönsün.

## 5. İş sürücüden alınınca anlık olay yok — soru ❓

İş yöneticiden geri alındığında ya da başka sürücüye verildiğinde (`JOB_REASSIGNED`), ödeme ekranı açık olan sürücüye `job_cancelled` gibi bir WebSocket olayı gidiyor mu?

Şu an uygulama bunu ancak sürücü ödemeye bastığında (409) veya banka dönüşünde öğreniyor. Para güvende, ama sürücü kart bilgisi girip 3DS'e kadar ilerleyebiliyor.

**Öneri:** Eski sürücüye (`accepted_driver_id`) `job_cancelled` benzeri bir olay gönderilsin, ör. `reason: 'reassigned'`. Uygulama bunu da anında karşılar.

---

## Özet

| # | Konu | Tip | Öncelik |
|---|------|-----|---------|
| 1 | Müşteri iptalinde audit log commit sonrası yazılıyor → geçici `REQUEST_CLOSED` | Düzeltme | 🟠 |
| 2 | Ödenmiş iş iptali FCM'inde `service_type` / `reason` / `cancelled_by` yok | Geliştirme | 🟡 |
| 3 | Banka dönüşünde `reason` sadece 5 kodda geliyor | Doküman | 🟡 |
| 4 | `awaiting_approval`: başlatma izin veriyor, tamamlama reddediyor | Tutarlılık | 🟡 |
| 5 | İş sürücüden alınınca WebSocket olayı | Soru / öneri | ❓ |

Teşekkürler.

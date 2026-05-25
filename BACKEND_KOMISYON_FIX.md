# Backend Ekibine: Komisyon Ödeme Race Condition Fix

Selam ekip,

Komisyon ödeme akışında bir **race condition** var. Sürücüler komisyonu ödedikten sonra detay ekranında tekrar "ödeme yap" kartını görüyor (hem test hem production'dan feedback geldi).

## Sorun

`apps/payment/views_commission.py:162-213` içindeki `CommissionPaymentCallbackView` `@transaction.atomic` decorator'ü altında çalışıyor. İçeride çağrılan `apps/payment/services/commission_payment.py:235-272` `complete_3ds()` metodu, `vehicle_request.status = 'in_progress'` save ettikten **hemen sonra** (satır 265-268) şu çağrıları yapıyor:

- `broadcast_payment_completion(vehicle_request, old_status)` — `async_to_sync(channel_layer.group_send())` ile WebSocket event'ini **anında** atıyor.
- `notify_payment_completed(vehicle_request)` — müşteri grubuna WebSocket gönderiyor.

Bu çağrılar `@transaction.atomic` bloğu **henüz commit olmamışken** dış dünyaya çıkıyor. Mobile uygulama:

1. WebSocket `job_update` event'ini alıyor → screen refetch tetikliyor.
2. `GET /request/<id>/` çağrısı sunucuya, transaction commit'inden **ÖNCE** ulaşıyor.
3. DB hâlâ `status='awaiting_payment'` dönüyor.
4. Sürücü komisyon ödeme kartını tekrar görüyor.

## Fix

`apps/payment/services/commission_payment.py` içinde `complete_3ds` metodunda broadcast'leri `transaction.on_commit()` ile sarmak yeterli:

```python
from django.db import transaction

# Mevcut kod (satır 260-270 civarı):
old_status = vehicle_request.status
vehicle_request.status = 'in_progress'
vehicle_request.save()

# DEĞİŞTİR: broadcast'leri on_commit içine al
def _post_commit_notifications():
    broadcast_payment_completion(vehicle_request, old_status)
    try:
        from apps.request.signals import notify_payment_completed
        notify_payment_completed(vehicle_request)
    except Exception as e:
        logger.warning(f"Failed to notify payment completed: {e}")

transaction.on_commit(_post_commit_notifications)

return {'success': True, 'status': 'completed'}
```

### Neden bu yeterli

- HTTP response (`?payment=success` redirect URL) zaten view'un `@transaction.atomic` bloğu çıkışında commit oluyor (Django default: decorator exit → commit → response flush). Yani HTTP path'i tek başına güvenli.
- Asıl problem **WebSocket broadcast'inin anında** atılması — bu mobile'da paralel bir refetch tetikliyor ve commit'i yarışta yeniyor.
- `transaction.on_commit` ile broadcast da commit sonrasına ertelenince, mobile event'i aldığında DB kesinlikle güncel olur.

## Test Önerisi

```python
def test_commission_callback_broadcasts_after_commit():
    """broadcast SADECE transaction commit sonrası çağrılmalı"""
    with mock.patch('apps.payment.services.helpers.broadcast_payment_completion') as mock_broadcast:
        # callback'i çağır, transaction içinde olduğu kabul edilen state'i kur
        # complete_3ds sırasında broadcast HENÜZ çağrılmamış olmalı
        # transaction commit edildiğinde ise çağrılmış olmalı
        ...
```

## Mobile Tarafında Ne Yapıldı

Mobile'da geçici (ve kalıcı defansif) bir fix uygulandı: ödeme başarılı olduğunda modal "İş başlatılıyor..." yazısıyla bekler ve backend'in job status'unu gerçekten güncellediğini doğrulayana kadar `navigation.reset` yapmaz (her 2 saniyede polling). Bu sayede:

- Sizin fix deploy olana kadar sürücü bug'ı görmez (kısa bir bekleme yaşar, ama yanlış ekrana atılmaz).
- Sizin fix sonrası bu bekleme tipik olarak <1 saniye olur (WebSocket fire-and-forget hızında).
- Gelecekte başka bir nedenle WebSocket gecikirse defansif katman duruyor olur.

Mobile fix dosyaları:
- `helpermobile/src/components/payment/commission/useCommissionPayment.ts`
- `helpermobile/src/components/payment/CommissionPaymentModal.tsx`
- `helpermobile/src/components/payment/commission/PaymentResultScreens.tsx`
- `helpermobile/src/screens/{crane,transfer,nakliye}/...JobDetailScreen.tsx` ve `helpermobile/src/screens/RoadAssistanceJobDetailScreen.tsx`

Teşekkürler!

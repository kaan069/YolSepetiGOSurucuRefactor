# Backend Görev: Konum HTTP Fallback Endpoint

## Bağlam

Sürücü mobil uygulaması aktif iş süresince konumu **gerçek zamanlı** olarak backend'e göndermek için WebSocket kullanır:

```
wss://api.yolsepetigo.com/ws/location/{tracking_token}/?auth={jwt}
→ { "type": "location_update", "latitude": ..., "longitude": ... }
```

WebSocket'in çalışmadığı senaryolar (örn. uygulama killed-state'te headless background task çalışırken, internet kısa süre koptuğunda, iOS uygulama yeniden açıldığında birikmiş queue) için **HTTP fallback endpoint** gerekiyor. Mobil tarafta bu çağrı şu an mevcut ama backend'de tanımlı değil.

Bu endpoint olmadan:
- Android killed-state'te WebSocket kurulamadığında konum kaybolur.
- iOS killed-state'ten sonra uygulama açılınca biriken konumlar gönderilemez.

## Yapılacak

### 1. Endpoint

```
POST /vehicles/location/<tracking_token>/http-update/
```

- URL'deki `tracking_token` 32 karakterlik string (mevcut WebSocket URL'iyle aynı format).
- **Authentication**: `Authorization: Bearer <jwt>` (sürücünün access token'ı, mevcut JWT middleware'inin kabul ettiği format).
- **Content-Type**: `application/json`

### 2. Request Body — İki Format

**Tekli format** (background task her tick için, anlık konum):

```json
{
  "latitude": 41.0082,
  "longitude": 28.9784
}
```

**Batch format** (queue flush — biriken konumların toplu gönderimi):

```json
{
  "locations": [
    { "latitude": 41.0082, "longitude": 28.9784, "timestamp": "2026-05-24T10:00:00Z" },
    { "latitude": 41.0090, "longitude": 28.9790, "timestamp": "2026-05-24T10:00:05Z" },
    { "latitude": 41.0098, "longitude": 28.9796, "timestamp": "2026-05-24T10:00:10Z" }
  ]
}
```

Handler her iki formatı destek etmeli — `locations` array varsa batch işle, yoksa `latitude/longitude` field'larına bak.

### 3. Response

```
HTTP 200 OK
Content-Type: application/json

{ "status": "ok" }
```

Hata durumları:
- `401 Unauthorized` — JWT geçersiz/eksik.
- `403 Forbidden` — Bu sürücü bu `tracking_token`'a sahip değil (ownership check).
- `404 Not Found` — `tracking_token` mevcut değil (iş kapanmış olabilir).
- `400 Bad Request` — Payload formatı bozuk.

### 4. Domain Logic

Mevcut WebSocket `location_update` handler hangi işlemleri yapıyorsa (Vehicle modelindeki son konum güncelleme, müşteriye broadcast, geçmiş tablosuna kayıt, vs.) bu endpoint **aynı işlemleri** yapmalı. Tek fark: input kanalı HTTP.

İdeal yapı (Django Channels mimarisini varsayarak):

```python
# views.py
@api_view(['POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def location_http_update(request, tracking_token):
    # 1. Ownership check
    vehicle = get_object_or_404(
        Vehicle.objects.filter(tracking_token=tracking_token, driver=request.user)
    )

    # 2. Payload parse — iki format
    data = request.data
    if 'locations' in data:
        # Batch
        for loc in data['locations']:
            _apply_location(vehicle, loc['latitude'], loc['longitude'],
                            timestamp=loc.get('timestamp'))
    else:
        # Tekli
        _apply_location(vehicle, data['latitude'], data['longitude'])

    return Response({'status': 'ok'}, status=200)


def _apply_location(vehicle, lat, lng, timestamp=None):
    """WebSocket handler ile aynı logic — model update + broadcast."""
    vehicle.last_latitude = lat
    vehicle.last_longitude = lng
    vehicle.last_location_at = timestamp or timezone.now()
    vehicle.save(update_fields=['last_latitude', 'last_longitude', 'last_location_at'])

    # Müşteriye Channels üzerinden broadcast
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        f"tracking_{vehicle.tracking_token}",
        {'type': 'location.broadcast', 'latitude': lat, 'longitude': lng}
    )
```

### 5. URL Routing

```python
# urls.py (vehicles app)
urlpatterns = [
    # ... mevcut path'ler
    path('location/<str:tracking_token>/http-update/', views.location_http_update,
         name='location-http-update'),
]
```

### 6. Test Senaryoları

- **Tekli payload**: `curl -X POST -H "Authorization: Bearer $JWT" -H "Content-Type: application/json" -d '{"latitude":41.0,"longitude":28.9}' https://api.yolsepetigo.com/vehicles/location/TOKEN/http-update/` → 200, Vehicle modelinde son konum güncellenmiş olmalı.
- **Batch payload**: 50 nokta gönder → hepsi sırayla işlensin (en son nokta `last_location` olarak kalmalı).
- **Yanlış token**: 404 dönmeli.
- **Başka sürücünün token'ı**: 403 dönmeli.
- **JWT yok**: 401 dönmeli.

## Mobil Tarafından Tetiklenme Senaryoları

1. **Android background task** (`backgroundLocation.ts`): WebSocket bağlı değilse her location tick'inde tekli payload.
2. **App `active` olunca** (`App.tsx` AppState listener): Birikmiş queue varsa batch payload.
3. **WebSocket geri bağlanınca** (`useLocationWebSocket.ts` onConnected): Birikmiş queue varsa batch payload.

## Önemli Notlar

- **Rate limit**: Bir sürücü saniyede ~1 request gönderebilir (her 5 sn bir tick). Toplu batch için tek call. Throttling minimal kalmalı — aksi takdirde queue tekrar dolar.
- **Idempotency**: Aynı timestamp ile aynı konum tekrar gelirse (queue flush retry'ı) sessizce kabul edilmeli, hata dönmemeli.
- **Aktif iş yoksa**: tracking_token'a karşılık gelen iş `completed/cancelled` ise 404 veya 410 dönmek mantıklı — mobil 404'te queue'yu temizler.

## Referans Dosyalar (Mobil)

- HTTP çağrısının yapıldığı yer: [`helpermobile/src/tasks/backgroundLocation.ts:27`](src/tasks/backgroundLocation.ts#L27)
- Batch payload yapısı: [`helpermobile/src/tasks/backgroundLocation.ts:60-62`](src/tasks/backgroundLocation.ts#L60-L62)
- WebSocket eşdeğeri (aynı domain logic): mevcut `location_update` Channels consumer.

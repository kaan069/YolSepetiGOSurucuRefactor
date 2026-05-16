# Müşteri Web ve Mobil — `city` Alanı Entegrasyon Talimatı

Bu doküman, backend'in eklediği şehir bazlı talep filtresi için **müşteri mobil** (YolSepetiGoMusteri) ve **müşteri web** (YolSepetiGOWeb) projelerinde yapılması gereken değişiklikleri özetler. Sürücü uygulaması (YolSepetiGOSurucuRefactor) bu plan dışında ayrıca güncellendi.

> **Bu dokümanda kod yazılmadı.** İlgili oturumda bu talimat referans alınarak değişiklikler uygulanacak.

---

## Bağlam

Backend artık talepleri sürücülere şehre göre filtreliyor. Müşteri tarafında **her talep oluşturma payload'ına `city` alanı zorunlu** hale geldi. Eksikse `400 Bad Request` dönüyor. Eski mobil/web sürümler `city` gönderemediği için talep oluşturamazlar — backend deploy'undan ÖNCE bu değişikliklerin canlıya çıkması gerekir.

`city` değeri = pickup şehri (alış noktası). Şehirler arası taşımalarda da pickup şehri esastır.

---

## Etkilenen Projeler ve Konumlar

| Proje | Servis dosyaları konumu | Base URL |
|---|---|---|
| Müşteri Mobil | `/Users/furkankaansaka/Desktop/YolSepetiGoMusteri/YolSepetiMobile/src/api/services/` | `https://api.yolsepetigo.com` |
| Müşteri Web | `/Users/furkankaansaka/Desktop/YolSepetiGOWeb/YolSepetiWeb/src/api/services/` | `https://api.yolsepetigo.com` |

---

## Etkilenen Endpoint'ler

| Servis | Endpoint | Şehir kaynağı |
|---|---|---|
| Çekici | `POST /requests/create/tow-truck/` | Aracın çekileceği şehir (pickup) |
| Vinç | `POST /requests/create/crane/` | İşin yapılacağı konum şehri |
| Yol Yardım | `POST /requests/create/road-assistance/` | Arıza şehri |
| Evden Eve Nakliye | `POST /requests/create/home-moving/` | **Pickup** şehri |
| Şehirler Arası Nakliye | `POST /requests/create/city-moving/` | **Pickup** şehri (varış değil!) |
| Transfer | `POST /requests/create/transfer/` | **Pickup** şehri |

---

## Yapılacaklar (Adım Adım)

### 1. Payload'lara `city` alanı ekle

Tüm `createRequestWithVerification` / direkt POST çağrılarına body'de `city` alanı eklenmeli:

**Mobil — Müşteri (örnek):**
- [YolSepetiMobile/src/api/services/towTruckService.ts](../YolSepetiGoMusteri/YolSepetiMobile/src/api/services/towTruckService.ts)
- [YolSepetiMobile/src/api/services/craneService.ts](../YolSepetiGoMusteri/YolSepetiMobile/src/api/services/craneService.ts)
- [YolSepetiMobile/src/api/services/movingService.ts](../YolSepetiGoMusteri/YolSepetiMobile/src/api/services/movingService.ts) — hem home-moving hem city-moving
- [YolSepetiMobile/src/api/services/roadAssistanceService.ts](../YolSepetiGoMusteri/YolSepetiMobile/src/api/services/roadAssistanceService.ts)
- Transfer servisi (varsa)

**Web — Müşteri (örnek):**
- [YolSepetiWeb/src/api/services/transferService.ts](../YolSepetiGOWeb/YolSepetiWeb/src/api/services/transferService.ts)
- [YolSepetiWeb/src/api/services/movingService.ts](../YolSepetiGOWeb/YolSepetiWeb/src/api/services/movingService.ts)
- [YolSepetiWeb/src/api/services/roadAssistanceService.ts](../YolSepetiGOWeb/YolSepetiWeb/src/api/services/roadAssistanceService.ts)
- (Tow truck / crane servisleri varsa onlar da)

Type'lara da `city: string` alanını eklemeyi unutmayın (CreateXxxRequest interface'leri).

### 2. Google Places'tan şehir otomatik çıkar

Pickup adresi seçildiğinde, `address_components` içindeki `administrative_area_level_1` (il) bilgisini ayıklayıp `city` alanını otomatik doldurun. Kullanıcıdan manuel istemeyin.

```javascript
function extractCityFromPlace(place) {
  const adminArea = place.address_components.find(c =>
    c.types.includes('administrative_area_level_1')
  );
  return adminArea ? adminArea.long_name : '';
}

// Pickup seçildiğinde
const pickupCity = extractCityFromPlace(selectedPickupPlace);
// payload.city = pickupCity
```

**Fallback:** Google Places kullanılmayan formlarda 81 il dropdown'u gösterin (sürücü uygulamasındaki `helpermobile/src/data/turkeyLocations.ts` referans alınabilir).

### 3. Validasyon

Form gönderiminden önce `city` boş ise kullanıcıya hata gösterin:

```javascript
if (!city || !city.trim()) {
  showError('Talep oluşturmak için pickup şehri gerekli. Lütfen adres seçin.');
  return;
}
```

Backend hata yanıtları:
- `city` eksik → `400`: `{"city": ["This field is required."]}`
- `city` boş → `400`: `{"city": ["This field may not be blank."]}`

Bu mesajları kullanıcı dostu metne çevirip toast/banner ile gösterin.

### 4. Şehirler arası nakliye — ÖNEMLİ uyarı

Müşteri Ankara → İstanbul nakliye talebi oluşturuyorsa, `city` = **"Ankara"** olmalı. Çünkü:
- Eşyalar Ankara'dan alınır.
- Sadece **Ankara'daki** nakliye sürücüleri bu talebi görür.
- İstanbul'daki sürücüye gitmez.

UX katmanında kullanıcıya bilgi metni: "Talebiniz [pickup şehri] şehrindeki sürücülere iletilecek."

---

## Payload Örnekleri

Backend referans dokümanından çıkarılmış, kopyala-yapıştır kullanılabilir örnekler:

### Çekici

```json
{
  "requestedServiceType": "towTruck",
  "requestOwnerNameSurname": "Ali Veli",
  "requestOwnerPhone": "05551112233",
  "city": "İstanbul",
  "estimatedPrice": 0,
  "createdAt": "2026-04-30T14:30:00Z",
  "towTruckDetails": { "vehicleType": "binek", "issueType": "kazaSonrasi" },
  "pickupLocation": { "address": "...", "latitude": 41.04, "longitude": 28.98 },
  "dropoffLocation": { "address": "...", "latitude": 40.99, "longitude": 29.02 }
}
```

### Şehirler Arası Nakliye (önemli — pickup şehri)

```json
{
  "requestedServiceType": "cityToCity",
  "city": "Ankara",
  "pickupLocation": { "address": "Çankaya, Ankara", ... },
  "dropoffLocation": { "address": "Beşiktaş, İstanbul", ... }
}
```

Diğer servislerin tam payload örnekleri için backend ekibinin dokümanına bakın.

---

## Test Listesi

| # | Senaryo | Beklenen |
|---|---|---|
| 1 | Müşteri Antalya'da çekici talebi → `city: "Antalya"` payload'da | 201 Created |
| 2 | Payload'da `city` yok | 400, "city zorunlu" mesajı UI'da görünür |
| 3 | Payload'da `city: ""` | 400, "boş olamaz" mesajı UI'da görünür |
| 4 | Google Places'tan İstanbul Beyoğlu seçildi | `city` otomatik "İstanbul" olarak ekleniyor |
| 5 | Şehirler arası Ankara → İstanbul nakliye | `city: "Ankara"` (pickup şehri) |
| 6 | Kullanıcıya "Antalya'daki sürücülere iletilecek" bilgisi | Form'da görünür |

---

## Migrasyon Notu

- Eski mobil/web sürümleri (city göndermeyenler) backend deploy'undan sonra **404 ya da 400 alır**. Müşteri build'leri canlıya çıkmadan backend deploy'u yapılmamalı (veya geri uyumluluk şim'i eklemeli — bu backend ekibiyle koordine edilmeli).
- Mevcut tamamlanmamış (`pending`) talepler `city = ""` ile DB'de kaldı; sürücü tarafında listede görünmezler. Backend ekibi gerekirse one-shot backfill çalıştırabilir.

---

## SSS

**Şehir normalize'i:** Backend `"İstanbul"`, `"istanbul"`, `"ISTANBUL"` hepsini `"istanbul"` olarak kaydeder. Frontend istediği formatta gönderebilir — case/whitespace ile uğraşma.

**Tek şehir mi?:** Şu an evet, müşteri tek pickup şehri için talep oluşturuyor. Çoklu nokta toplama destekleniyorsa ana pickup şehri ile çakışmalı.

**API base değişiyor mu?:** Hayır, `https://api.yolsepetigo.com` aynı.

---

Bu talimat tamamlanırsa müşteri tarafı backend ile uyumlu hale gelir ve sürücüler dolu profille kendi şehirlerindeki talepleri sorunsuz alır.

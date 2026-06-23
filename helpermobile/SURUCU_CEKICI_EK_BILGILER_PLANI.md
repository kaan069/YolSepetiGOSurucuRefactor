# Sürücü App Planı: Çekici talebinde "Ek Bilgiler" (description) göster

## Context (Neden)

Müşteri tarafında (web + mobil) çekici (towTruck) talebi oluşturma akışına opsiyonel bir
**"Ek Bilgiler" (description)** serbest-metin alanı eklendi — müşteri aracı/durumu hakkında not
yazabiliyor. Backend bu `description` alanını talep verisine ekleyip sürücüye dönecek. Sürücü,
talebi gördüğü ekranda (teklif verme öncesi) bu notu **görmeli** ki ne çekeceğini bilsin.

## ÖN KOŞUL (önce backend)

Bu iş, **backend `description` alanını sürücüye dönen yanıta ekledikten sonra** çalışır.
Backend tarafı için ayrı plan: müşteri repo'sundaki `BACKEND_CEKICI_EK_BILGILER_PLANI.md`.
Özetle backend, sürücünün talebi çektiği yanıta `description` eklemeli:
- **Endpoint:** `GET /requests/tow-truck/details/{id}/` yanıtına `description` (string, boş olabilir).
- (Ve teklif listesi / `new_offer` WebSocket payload'ına da eklenirse erken gösterilebilir.)

> Backend alanı dönmeden bu UI **kırılmaz** — `description` boş/undefined ise bölüm hiç görünmez.

## Yapılacaklar (sürücü app)

### 1. Tip — `TowTruckRequestDetail`'e `description` ekle
Dosya: `src/api/types.ts` (`TowTruckRequestDetail` interface, ~satır 384-444)
```ts
export interface TowTruckRequestDetail {
    // ... mevcut alanlar ...
    description?: string;  // Müşterinin eklediği Ek Bilgiler / açıklama (opsiyonel)
}
```
(Veri zaten `getRequestDetail` → `useTowTruckRequest` ile geliyor; tip eklenince otomatik akar.)

### 2. Yeni bileşen — `DescriptionSection.tsx`
Dosya: `src/screens/towTruckOffer/components/DescriptionSection.tsx` (yeni)
- Mevcut bölüm kartı stiline uy (örn. `VehicleInfoSection` / `VehicleStatusSection` deseni:
  ikon + başlık header'ı + içerik).
- Başlık: **"Ek Bilgiler"**, ikon: `information-outline`.
- `description` boş/undefined ise `null` döndür (hiç gösterme).
- Tema: `useAppTheme` (isDarkMode/appColors/cardBg) — diğer section'larla aynı.

İskelet:
```tsx
interface DescriptionSectionProps { description?: string; }

export default function DescriptionSection({ description }: DescriptionSectionProps) {
  const { isDarkMode, appColors, cardBg } = useAppTheme();
  if (!description?.trim()) return null;
  // section kartı: header (information-outline + "Ek Bilgiler") + içerik (<Text>{description}</Text>)
}
```

### 3. Ekrana yerleştir — `TowTruckOfferScreen.tsx`
Dosya: `src/screens/towTruckOffer/TowTruckOfferScreen.tsx`
Render sırasında **`PhotosSection` (~satır 403) ile `VehicleInfoSection` (~satır 405) arasına** ekle:
```tsx
<PhotosSection photos={towTruckRequest.photos} />

{/* YENİ: müşteri notu — sadece doluysa görünür */}
<DescriptionSection description={towTruckRequest.description} />

<VehicleInfoSection vehicleType={towTruckRequest.vehicle_type} />
```
(Fotoğrafların hemen ardı mantıklı — müşterinin görsel + yazılı açıklaması bir arada görünür.)

### 4. i18n
Sürücü app'te i18n YOK; metinler hardcoded Türkçe. "Ek Bilgiler" etiketini de hardcoded ver
(mevcut "Araç Bilgileri", "Araç Durumu" gibi).

## Doğrulama
1. Backend `description` döndüğünde: dolu bir not yazılmış bir çekici talebini sürücü ekranında aç →
   fotoğrafların altında **"Ek Bilgiler"** kartında not görünmeli.
2. Müşteri boş bıraktıysa (`""`/undefined): bölüm **hiç görünmemeli** (boş kart yok).
3. Uzun metinde (≤500 karakter) düzgün sarmalı (wrap), taşma olmamalı.
4. Dark/light tema uyumlu.

## Etkilenen dosyalar
- `src/api/types.ts` — `TowTruckRequestDetail.description?` eklendi.
- `src/screens/towTruckOffer/components/DescriptionSection.tsx` — yeni bileşen.
- `src/screens/towTruckOffer/TowTruckOfferScreen.tsx` — PhotosSection ↔ VehicleInfoSection arasına render.

## Not
- Tek dayanak backend'in `description` döndürmesi. UI guard'lı (`if (!description) return null`) olduğu
  için backend gecikse/boş dönse bile sürücü ekranı normal çalışır; alan dolu geldiğinde görünür.
</content>

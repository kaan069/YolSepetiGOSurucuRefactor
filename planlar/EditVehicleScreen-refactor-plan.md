# EditVehicleScreen Refactor Plan

## Hedef
`src/screens/auth/EditVehicleScreen.tsx` (1261 satir) dosyasini arac tipine gore modulerize etmek, form/upload/validation logic'ini yeniden kullanilabilir hook ve componentlere bolmek.

## Mevcut Durum (analiz)
- 1261 satir
- 6 arac tipi: tow, crane, transport, homeMoving, roadAssistance, transfer
- Tek dosyada form state, photo upload (galeri/kamera/document), validation, submit orchestration, conditional rendering
- `vehiclePhoto` + `insurancePhoto` icin camera/gallery secici kodu iki yerde duplike (biri inline anonymous)
- Transfer icin ek interior photos + transfer documents gosterimi
- `isPdfFile` ve `buildFullUrl` inline tanimli; `buildFullUrl` baseURL'i hardcoded
- Her arac tipi icin ayri API cagrisi + store update + success alert

## Hedef Dosya Yapisi
```
src/screens/auth/
  EditVehicleScreen.tsx                      (~180 satir - orkestratör)
  editVehicle/
    types.ts                                 (~40 satir) - VehicleKind, form/config tipleri
    constants.ts                             (~45 satir) - MOVING_VEHICLE_TYPE_OPTIONS, platformTypes, vehicleTypes, transferVehicleClasses, transferDocumentLabels
    useEditVehicleForm.ts                    (~180 satir) - formData/errors, updateField, validateForm, vehicle selector
    useVehiclePhotos.ts                      (~170 satir) - vehiclePhoto, insurancePhoto, interiorPhotos, transferDocuments, loadVehiclePhoto, isLocalUri helpers
    useUpdateVehicle.ts                      (~180 satir) - submit orchestration (API + upload + store + alert + navigate)
    components/
      BasicInfoCard.tsx                      (~80 satir) - plate/brand/model/year
      VehiclePhotoCard.tsx                   (~110 satir) - generic photo+pdf card with camera/gallery/document
      InsuranceDocumentCard.tsx              (~80 satir) - wraps VehiclePhotoCard (veya ayni component insurance=true)
      TowTruckFieldsCard.tsx                 (~80 satir) - platformType menu + supportedVehicleTypes
      CraneFieldsCard.tsx                    (~40 satir) - maxHeight
      TransportFieldsCard.tsx                (~80 satir) - capacity/volume/length/width/height
      HomeMovingFieldsCard.tsx               (~30 satir) - movingVehicleType dropdown
      TransferFieldsCard.tsx                 (~75 satir) - transferType chip + passengerCapacity + vehicleClass
      TransferInteriorPhotosCard.tsx         (~55 satir) - 4-slot grid
      TransferDocumentsCard.tsx              (~55 satir) - read-only uploaded documents list
      VehicleNotFound.tsx                    (~25 satir)
    services/
      editVehicleService.ts                  (~150 satir) - type-safe per-type update + photo upload (API calls)
```

Ayrica paylasilabilir bir helper icin:
```
src/utils/
  fileHelpers.ts                             (~20 satir) - isPdfFile, buildFullUrl, isLocalUri (hardcoded URL temizleme; API_BASE_URL kullan)
```
Not: Bu helper diger yerlerde de duplike (`screens/nakliye/components/VehiclePhotoSection.tsx` vb.). Simdilik sadece `EditVehicleScreen` kullanim noktasini import edecek, digerlerini gelecek PR'a birakacagim (scope disi).

## Adim Plani (kucuk, geri alinabilir)

### Adim 1 — Utility/constants ayir
- `src/utils/fileHelpers.ts` olustur: `isPdfFile`, `buildFullUrl`, `isLocalUri`
- `src/screens/auth/editVehicle/constants.ts` olustur: MOVING_VEHICLE_TYPE_OPTIONS, platformTypes, vehicleTypes, transferVehicleClasses, transferDocumentLabels, insurance supported vehicle kinds
- EditVehicleScreen'de inline kullanimlari kaldirip import et
- Davranis degismez

### Adim 2 — Types
- `src/screens/auth/editVehicle/types.ts` olustur: `VehicleKind`, form union tipi, `EditVehicleFormData`

### Adim 3 — Form hook
- `useEditVehicleForm.ts`: `formData`, `errors`, `updateField`, `toggleVehicleType`, `validateForm`, `vehicle` lookup
- EditVehicleScreen state ve validateForm kodu bu hook'a tasinir

### Adim 4 — Photo hook
- `useVehiclePhotos.ts`: `vehiclePhoto`, `insurancePhoto`, `interiorPhotos`, `transferDocuments`, `loadingPhoto` + setter'lar + picker helpers + `loadVehiclePhoto`
- EditVehicleScreen photo state ve loader bu hook'a tasinir

### Adim 5 — Service layer (submit)
- `services/editVehicleService.ts`: Her arac tipi icin `updateXxx(vehicleId, formData, photos, storeActions)` async fonksiyon
- Tekrar eden "eger local URI ise upload" mantigi ortak helper `uploadPhotosIfChanged` ile azalir
- Console.log'lar temizlenir, sadece hata loglari kalir

### Adim 6 — Submit hook
- `useUpdateVehicle.ts`: Service'i cagirir, loading state, alert/navigation
- EditVehicleScreen handleSave kodu bu hook'a tasinir

### Adim 7 — UI component bolme
- `BasicInfoCard`, `VehiclePhotoCard`, `InsuranceDocumentCard`, `TowTruckFieldsCard`, `CraneFieldsCard`, `TransportFieldsCard`, `HomeMovingFieldsCard`, `TransferFieldsCard`, `TransferInteriorPhotosCard`, `TransferDocumentsCard`, `VehicleNotFound`
- EditVehicleScreen JSX conditional renderer haline gelir

### Adim 8 — Temizlik
- Kullanilmayan importlar, dead code, console.log temizligi
- EditVehicleScreen.tsx final satir sayisi ~180

## Koruma Noktalari (davranis degismez)
- Butun API cagri parametreleri ayni
- Butun success alert mesajlari ayni
- Insurance photo camera/gallery quality 0.3 ayni (inline anonymous async zaten quality 0.3)
- Validation kurallari ayni (year 1900-2025, crane maxHeight, transport capacity+volume)
- Photo fallback (sadece insurance degistiyse downloadToCache) ayni
- Interior photo toggle davranisi (dokununca sil) ayni
- Transfer document goruntuleme read-only

## Riskler
- 6 arac tipi + multi-field form: test yuzeyi genis. Manuel test onemli.
- `plate.toUpperCase()` behavior formData icinde yapilmiyor, save sirasinda yapiliyor — service icinde ayni sekilde korunmali
- Transfer formData icindeki `transferType`/`passengerCapacity`/`vehicleClass` `as any` cast ile okunuyor — tip netleshtirilirken olusturulan TransferFormData tipi ayni runtime davranisini vermelidir

## Out-of-Scope (gelecek PR)
- `buildFullUrl`/`isPdfFile` butun projede tekillestirme
- `vehiclesAPI` icindeki console.log temizligi
- `useVehicleStore` icinde arac tipi union + generic update helper

# fileHelpers Dedup Plan (Follow-up Refactor)

## Bağlam
EditVehicleScreen refactor'unda `helpermobile/src/utils/fileHelpers.ts` oluşturuldu.
Export'lar: `isPdfFile`, `buildFullUrl` (API_BASE_URL kullanır), `isLocalUri`.

Bu plan, projede hâlâ duplike olarak tanımlanan aynı helper'ları tekilleştirir.
Scope küçük: yalnızca inline helper tanımlarını silip merkezi versiyonu import etmek.

## Duplike Bulunan Dosyalar

### A. `isPdfFile` duplike lokasyonları
1. `helpermobile/src/screens/crane/components/VehiclePhotoSection.tsx` — satır 16-20
2. `helpermobile/src/screens/roadAssistance/components/VehiclePhotoSection.tsx` — satır 16-20
3. `helpermobile/src/screens/nakliye/components/VehiclePhotoSection.tsx` — satır 16-20
4. `helpermobile/src/screens/towTruck/components/TowTruckPhotoSection.tsx` — satır 15-19
5. `helpermobile/src/screens/profile/DocumentsScreen.tsx` — satır 19-24

Tüm inline imzalar: `(uri: string | null) => boolean` — merkezi helper `string | null | undefined` kabul ediyor, kullanım uyumlu (union daraltma).
Tüm implementasyonlar birebir aynı: `split('?')[0].split('#')[0].toLowerCase().endsWith('.pdf')`.
**Davranış farkı: YOK.**

### B. `buildFullUrl` duplike lokasyonu
1. `helpermobile/src/screens/profile/DocumentsScreen.tsx` — satır 26-32

Inline imza: `(url: string) => string`, implementasyon `https://api.yolsepetigo.com` **hardcoded**.
Merkezi helper ise `API_BASE_URL` import edip kullanıyor.
`helpermobile/src/api/axiosConfig.ts` içinde `API_BASE_URL = 'https://api.yolsepetigo.com'`.
**Davranış farkı: YOK** (aynı URL). Merkezileştirme aynı zamanda hardcoded URL kaldırır — net kazanç.

Ufak fark: Inline versiyon `if (!url)` kontrolü yapmıyor; merkezi versiyon yapıyor.
Çağrı noktaları zaten `if (response.x)` ile null-check yapıyor, merkezi versiyon daha güvenli (regression riski yok).

### C. `isLocalUri`
Yalnızca `editVehicleService.ts` merkezi versiyondan import ediyor. Duplike tanım yok. Atlanır.

## Plan

### Adım 1 — TowTruckPhotoSection.tsx
- Satır 15-19 inline `isPdfFile` tanımını sil
- import satırı ekle: `import { isPdfFile } from '../../../utils/fileHelpers';`

### Adım 2 — crane/components/VehiclePhotoSection.tsx
- Satır 16-20 inline `isPdfFile` tanımını sil
- import satırı ekle: `import { isPdfFile } from '../../../utils/fileHelpers';`

### Adım 3 — roadAssistance/components/VehiclePhotoSection.tsx
- Satır 16-20 inline `isPdfFile` tanımını sil
- import satırı ekle: `import { isPdfFile } from '../../../utils/fileHelpers';`

### Adım 4 — nakliye/components/VehiclePhotoSection.tsx
- Satır 16-20 inline `isPdfFile` tanımını sil
- import satırı ekle: `import { isPdfFile } from '../../../utils/fileHelpers';`

### Adım 5 — profile/DocumentsScreen.tsx
- Satır 19-24 inline `isPdfFile` tanımını sil
- Satır 26-32 inline `buildFullUrl` tanımını sil (hardcoded URL dahil)
- import satırı ekle: `import { isPdfFile, buildFullUrl } from '../../utils/fileHelpers';`

## Riskler
- Yok (davranış birebir aynı, hardcoded URL merkezi API_BASE_URL ile eşleşiyor).
- Import path'leri her dosyanın derinliğine göre ayrı ayrı doğrulanmalı.

## Doğrulama
- Silinen helper'lar grep ile kontrol edilir
- Import path'lerinin var olan konvansiyonla uyumu kontrol edilir
- `isPdfFile(uri)` ve `buildFullUrl(url)` çağrı yerleri değişmez

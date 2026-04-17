# Network Config Centralization Plan

## Scope
API ve WebSocket base URL'lerini tek bir merkezi dosyada topla. Hardcoded
`https://api.yolsepetigo.com` / `wss://api.yolsepetigo.com` stringlerini
runtime davranışını bozmadan merkezileştir.

## Dosya analizi

### Runtime hardcoded URL noktaları
| Dosya | Satır | Kullanım |
|---|---|---|
| `helpermobile/src/api/axiosConfig.ts` | 9 | `const API_BASE_URL = 'https://api.yolsepetigo.com'` — axios baseURL ve `fileHelpers.buildFullUrl` tarafından tüketiliyor |
| `helpermobile/src/services/jobsWebSocket.ts` | 137 | `wss://api.yolsepetigo.com/ws/jobs/${serviceType}/?auth=${token}` |
| `helpermobile/src/services/locationWebSocket.ts` | 144 | `wss://api.yolsepetigo.com/ws/location/${this.trackingToken}/` (sonra `?auth=${token}` eklenir) |

### Davranış dışı (dokunulmayacak)
- `helpermobile/src/constants/contracts.ts` — hukuki metinde marka adı (URL değil, domain stringi)
- `helpermobile/src/screens/profile/FeedbackScreen.tsx` — `info@yolsepetigo.com` e-posta, ayrı bir sabit konusu
- `helpermobile/src/screens/auth/LoginScreen.tsx` — `blog.yolsepetigo.com` farklı subdomain, ayrı
- `jobsWebSocket.ts` / `locationWebSocket.ts` / `useLocationWebSocket.ts` dosyalarının baş yorumları — bunları da merkezi yere işaret edecek şekilde güncelleyeceğiz (çünkü `yolsepetigo.com` string taraması temiz kalsın istiyoruz) — opsiyonel, ama temiz.

### Mevcut env konvansiyonu
**Yok.** Projede `process.env`, `EXPO_PUBLIC_`, `expo-constants` kullanan hiçbir dosya bulunamadı. Yeni bir konvansiyon kuruluyor: `EXPO_PUBLIC_API_URL`.

## Yeni dosya

**`helpermobile/src/constants/network.ts`** (~25 satır, side effect'siz sabitler)

Export edilenler:
- `API_BASE_URL: string` — `process.env.EXPO_PUBLIC_API_URL ?? 'https://api.yolsepetigo.com'`
- `httpToWs(url: string): string` — `https://` -> `wss://`, `http://` -> `ws://` dönüşümü yapan saf fonksiyon
- `WS_BASE_URL: string` — `httpToWs(API_BASE_URL)`

Overengineering yasak: singleton yok, getter yok, class yok.

## Değişiklik listesi

1. **Yeni dosya:** `helpermobile/src/constants/network.ts`
2. **`helpermobile/src/api/axiosConfig.ts`:**
   - `API_BASE_URL` yerel tanımı kaldır
   - `import { API_BASE_URL } from '../constants/network'`
   - `export { API_BASE_URL }` satırı (backwards-compat için korunur — `fileHelpers.ts` bunu import ediyor)
3. **`helpermobile/src/services/jobsWebSocket.ts`:**
   - `import { WS_BASE_URL } from '../constants/network'`
   - `wss://api.yolsepetigo.com/ws/jobs/...` -> `${WS_BASE_URL}/ws/jobs/...`
   - Baş yorum update (ws://api... yerine ws base URL açıklaması)
4. **`helpermobile/src/services/locationWebSocket.ts`:**
   - `import { WS_BASE_URL } from '../constants/network'`
   - `wss://api.yolsepetigo.com/ws/location/...` -> `${WS_BASE_URL}/ws/location/...`
   - Baş yorum update
5. **`helpermobile/src/hooks/useLocationWebSocket.ts`:**
   - Baş yorumdaki hardcoded URL'i kaldır (davranış değişikliği yok, sadece doc)
6. **`helpermobile/src/utils/fileHelpers.ts`:**
   - Import yolunu değiştirme (çünkü `axiosConfig.ts` hala `API_BASE_URL` re-export ediyor). Mevcut import korunuyor.
   - Minimum dokunuş prensibi.

## Backwards compat kararı

`axiosConfig.ts` `API_BASE_URL`'i re-export edecek. Neden:
- `fileHelpers.ts` zaten ondan import ediyor — 0 dokunuş
- Gelecek refactor'da `fileHelpers.ts`'in importu `../constants/network`'e çevrilebilir (bu PR'ın scope'unda değil)
- Tek seferde hem kaynağı taşı hem kullanım yerlerini yönlendir riski minimize et

## Risk analizi

1. **URL eşdeğerliği:** `httpToWs('https://api.yolsepetigo.com')` -> `'wss://api.yolsepetigo.com'` — birebir aynı string olmalı. Test: manuel console log karşılaştırması.
2. **Env okunamazsa:** `process.env.EXPO_PUBLIC_API_URL` tanımsızsa fallback production URL'ine düşer. Nullish coalescing (`??`) empty string'i de geçirir mi? — `''` falsy ama `??` sadece `null`/`undefined`'ı yakalar. Boş string verirse yanlış davranış olur. Expo'da tanımsız env `undefined` olarak gelir, boş string değil — risk düşük. Yine de `??` yerine boş kontrolü düşünmeye değer — ama overengineering sınırını aşmamak için `??` yeterli.
3. **Test ortamı:** Şu an hiç env kullanılmıyor, fallback her zaman devrede; davranış mevcut koda birebir eşit olacak.
4. **Metro bundler cache:** `process.env.EXPO_PUBLIC_*` değerleri build time'da inline edilir. Değişiklik sonrası dev server'ı restart etmek gerekebilir — bu refactor için değil, env'i gerçekten kullanan biri için geçerli.

## Doğrulama adımları

1. `grep -rn 'yolsepetigo.com' helpermobile/src` -> runtime kullanımı sadece `constants/network.ts`'de (doc yorumları da temizlendiyse hiç olmayacak)
2. TypeScript derleme hatası yok
3. `API_BASE_URL` import'ları hala çalışıyor (`fileHelpers.ts`, `axiosConfig.ts`)
4. Çalışan build'de axios `baseURL` değişmemeli
5. İki WebSocket bağlantısı aynı URL'i üretmeli (before/after eşit)

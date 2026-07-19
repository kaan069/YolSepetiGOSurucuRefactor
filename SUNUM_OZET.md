# YolSepetiGO Sürücü — Hızlı Kod Haritası (Sunum Özeti)

> "Nereye bakayım?" özeti. Detaylı rapor için bkz. `SUNUM_KOD_HARITASI.md`.

**Hatırlaması kolay kural:** Her servis için 3 ekran var → **Araç kaydı** (Details), **Teklif** (Offer), **İş detayı** (JobDetail).
Hepsi ortak `components/fk` + `store/` + `api/` katmanını paylaşır.

---

## 📍 Servis Modülleri (her biri kendi klasöründe)

### 🔧 Çekici → `src/screens/towTruck/` + `src/screens/towTruckOffer/`
- Araç kaydı: `screens/towTruck/TowTruckDetailsScreen.tsx`
- Teklif: `screens/towTruckOffer/TowTruckOfferScreen.tsx`
- API: `api/requests/towTruck.ts`

### 🏗️ Vinç → `src/screens/crane/`
- Araç kaydı: `screens/crane/CraneDetailsScreen.tsx`
- Teklif: `screens/crane/CraneOfferScreen.tsx`
- İş detayı: `screens/crane/CraneJobDetailScreen.tsx`
- API: `api/requests/crane.ts`

### 🚗 Yol Yardım → `src/screens/roadAssistance/`
- Teklif: `screens/roadAssistance/RoadAssistanceOfferScreen.tsx`
- İş detayı: `screens/RoadAssistanceJobDetailScreen.tsx`
- API: `api/requests/roadAssistance.ts`

### 📦 Nakliye (evden eve + şehirler arası) → `src/screens/nakliye/`
- Evden eve teklif: `screens/nakliye/HomeMovingOfferScreen.tsx`
- Şehirler arası teklif: `screens/nakliye/CityMovingOfferScreen.tsx`
- İş detayı: `screens/nakliye/NakliyeJobDetailScreen.tsx`
- API: `api/requests/nakliye.ts`

### 🚐 Transfer → `src/screens/transfer/`
- Araç kaydı: `screens/transfer/TransferVehicleScreen.tsx`
- Teklif: `screens/transfer/TransferOfferScreen.tsx`
- İş detayı: `screens/transfer/TransferJobDetailScreen.tsx` *(en büyük ekran, 1114 satır)*
- API: `api/requests/transfer.ts`

---

## 🧩 Ortak / Paylaşılan Componentler

| Ne | Nerede |
|---|---|
| Fk tasarım sistemi (buton, input, modal, select, tarih, upload) | `src/components/fk/` — hepsi tek yerden import |
| İş kartı (tüm servisler kullanır) | `src/components/OrderCard.tsx` |
| Çalışan seçici (teklife çalışan atama) | `src/components/common/EmployeeSelector.tsx` |
| Ödeme (kart + komisyon) | `src/components/payment/` (`CreditCardSection.tsx`, `CommissionPaymentModal.tsx`) |
| İptal akışı | `src/components/cancellation/CancelJobModal.tsx` |
| Tema / renkler | `src/theme/tokens.ts` |

---

## ⚙️ Ortak Altyapı (tüm servisler ortak kullanır)

| Ne | Nerede |
|---|---|
| Giriş / navigasyon | `src/navigation/index.tsx` |
| Uygulama girişi | `index.ts` → `src/App.tsx` |
| API tabanı (axios + token) | `src/api/axiosConfig.ts` |
| Tipler (merkezi sözlük) | `src/api/types.ts` (1256 satır) |
| State (19 store) | `src/store/` — kimlik: `authStore.ts`, aktif iş: `useActiveJobStore.ts`, araçlar: `useVehicleStore.ts` |
| Canlı konum + WebSocket | `src/services/` (`locationWebSocket.ts`, `jobsWebSocket.ts`, `backgroundLocationService.ts`) |
| Bildirim (FCM) + yönlendirme | `src/services/fcmService.ts` + `src/utils/notificationNavigation.ts` |

---

## 🎤 Sunumda "wow" 3 nokta

1. **Kesintisiz canlı konum** — uygulama kapalıyken bile 3 kademeli dayanıklılık (WebSocket → HTTP → yerel kuyruk), hiçbir konum kaybolmaz.
2. **B2B / filo yönetimi** — tek sürücüden ekip çalıştıran işletmeye; kurumsal segmenti açar. → `src/screens/employee/`
3. **5 gelir kanalı, tek kod tabanı** — yeni hizmet eklemek ortak deseni takip etmekle mümkün.

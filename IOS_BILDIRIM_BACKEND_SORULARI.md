# iOS Push Notification — Backend Soru-Cevap Dokümanı

> **Sorun özeti:** Android cihazlarda bildirimler tutarlı çalışıyor. **iOS'ta bazı bildirimler geliyor, bazıları gelmiyor.** Bu dokümanın amacı, sorunun kaynağını tespit etmek için backend ekibine sorulacak teknik soruları yapılandırmaktır.

---

## 1. Mevcut Frontend Durumu (Bilgi Notu)

Backend ekibinin context'i için bizim taraf:

### 1.1 Kurulum
- **Hybrid stack:** `@react-native-firebase/messaging` (v23.4.1) + `expo-notifications` (v0.32.12)
- **iOS:** APNs device token alınıyor → `Messaging.messaging().apnsToken = deviceToken` ile Firebase'e atanıyor → Firebase **FCM token** üretiyor → backend'e bu FCM token gönderiliyor
- **Bundle ID:** `com.devkaans.yolpaketi`
- **`GoogleService-Info.plist`** mevcut ve `BUNDLE_ID`'si app ile eşleşiyor
- **APNs entitlement:** `aps-environment: development` ([ios/YolSepetiGoSrc/YolSepetiGoSrc.entitlements](helpermobile/ios/YolSepetiGoSrc/YolSepetiGoSrc.entitlements)) — production build için `production` olması gerekiyor olabilir
- **`UIBackgroundModes`:** `["location", "fetch", "remote-notification"]` ✅

### 1.2 Token Kayıt Endpoint'i
```http
PUT /auth/notifications/update/
{
  "fcm_token": "<FCM token>",
  "device_id": "<cihaz UUID>",
  "device_type": "ios"
}
```

### 1.3 Handler'lar (frontend tarafı tamam)
| State | Handler | Durum |
|---|---|---|
| Foreground | `messaging().onMessage()` | ✅ |
| Background | `messaging().setBackgroundMessageHandler()` (index.ts'te erken kayıt) | ✅ |
| Bildirime tıklama (app açık) | `onNotificationOpenedApp()` | ✅ |
| Killed state'ten açma | `getInitialNotification()` | ✅ |
| Token yenileme | `onTokenRefresh()` | ✅ |

### 1.4 Parse edilen `data` alanları
```typescript
{
  type: "new_job" | "offer_accepted" | "job_assigned" | "request_completed" | "request_cancelled" | ...,
  request_id?: string,
  request_details_id?: string,
  service_type?: string,
  orderId?: string,
}
```

---

## 2. Backend Ekibine Sorular

### A. APNs Sertifika / Anahtar Konfigürasyonu

**A1.** Firebase Console > Project Settings > Cloud Messaging > Apple app configuration ekranında **APNs Authentication Key (P8)** mı yoksa **APNs Certificate (P12)** mı yüklü?
- _Tercih edilen: P8 key (Team ID + Key ID ile)_

**A2.** Eğer P12 sertifika kullanılıyorsa:
- Hem **APNs Development Certificate** hem **APNs Production Certificate** yüklü mü?
- **Sertifikaların geçerlilik tarihleri ne?** (1 yıl sonra expire olur — kontrol edilsin)

**A3.** Bundle ID: Firebase Console'daki iOS app config'inde `com.devkaans.yolpaketi` ile eşleşiyor mu? (frontend tarafında bu kullanılıyor)

**A4.** Firebase service account JSON (FCM HTTP v1 API kullanılıyorsa) **production** projesinin mi yoksa farklı bir Firebase projesinin mi? Yanlış projedeki key kullanılırsa bildirim sessizce başarısız olur.

---

### B. FCM API ve Gönderim Yöntemi

**B1.** Backend hangi FCM API'sini kullanıyor?
- ☐ **FCM HTTP v1 API** (önerilen, modern — `https://fcm.googleapis.com/v1/projects/<project_id>/messages:send`)
- ☐ Legacy HTTP API (deprecated, 2024'te kapatılıyor)
- ☐ Legacy XMPP

**B2.** HTTP v1 kullanılıyorsa: gönderim payload örneği paylaşılabilir mi? Özellikle `message.apns` block'unun içeriği önemli.

**B3.** **iOS için özel `apns` config block dolduruluyor mu** veya sadece generic `notification` / `data` mı gönderiliyor?

Beklenen iOS-aware payload örneği:
```json
{
  "message": {
    "token": "<FCM_TOKEN>",
    "notification": {
      "title": "Yeni iş geldi",
      "body": "Çekici talebi - Beyoğlu"
    },
    "data": {
      "type": "new_job",
      "request_id": "119"
    },
    "apns": {
      "headers": {
        "apns-priority": "10",
        "apns-push-type": "alert"
      },
      "payload": {
        "aps": {
          "sound": "default",
          "badge": 1,
          "content-available": 1,
          "mutable-content": 1
        }
      }
    },
    "android": {
      "priority": "high"
    }
  }
}
```

**B4.** Eğer **`apns.headers.apns-push-type`** ayarlı değilse — iOS 13+ bildirimi reddedebilir. Bu header dolu mu?

**B5.** **`apns-priority`** değeri ne?
- `10` (immediate) — interaktif bildirimler için
- `5` (conservative) — background-only

Yanlış priority iOS'ta bildirimi sessizce drop edebilir.

---

### C. Payload Türü: Notification vs Data-Only

**C1.** Bildirim gönderiminde `notification` field (`title`/`body`) **her zaman** dolduruluyor mu, yoksa sadece `data` field'i mi gönderiliyor?

- iOS'ta sadece `data` ile gönderim → cihaz **silent push** olarak algılar → kullanıcıya alert göstermez, sadece app uyandırılır.
- Görünür bildirim gerekiyorsa `notification` field'i veya `apns.payload.aps.alert` mutlaka olmalı.

**C2.** Hangi bildirim tipinde ne gönderiliyor — tablo halinde paylaşılabilir mi?

| Notification Type | `notification.title/body` var mı? | `data.type` değeri | Beklenen davranış |
|---|---|---|---|
| `new_job` | ? | `new_job` | Alert + sound + iş ekranına yönlendir |
| `offer_accepted` | ? | `offer_accepted` | Alert + iş ekranı |
| `request_completed` | ? | `request_completed` | Alert |
| `request_cancelled` | ? | `request_cancelled` | Alert |
| `job_assigned` | ? | `job_assigned` | Alert (sadece firma sahibinin elemanına) |

> **iOS'ta tutarsız gelen bildirimlerin hangi tip olduğunu öğrenmek bug'ı tespit etmenin anahtarı.**

**C3.** Background `content-available: 1` (silent push) kullanılıyor mu? Kullanılıyorsa iOS bunu daha aggresif throttle eder (saatte birkaç tane). Bu, "bazıları geliyor, bazıları gelmiyor" pattern'i ile uyumlu olabilir.

---

### D. APNs Environment Eşleşmesi (KRİTİK)

**D1.** Backend hangi APNs environment'a gönderim yapıyor?
- **Sandbox/Development** APNs → debug build (Xcode Run)
- **Production** APNs → TestFlight + App Store build

**D2.** Frontend'in mevcut entitlement'ı `aps-environment: development`. Bu development APNs'e bağlanır. Eğer backend yanlışlıkla production APNs key kullanıyorsa, development cihazlar bildirim almaz.

**Test senaryosu:**
- Local Xcode build (development) → cihaza yüklü → bildirim gelmiyorsa → backend production key kullanıyor olabilir.
- TestFlight build (production entitlement) → bildirim geliyorsa → development key eksik veya yanlış.

**D3.** Firebase Console'a hem development hem production APNs key'i yüklü mü? FCM otomatik olarak token'a göre doğru environment'a route eder ama key eksikse drop eder.

**D4.** TestFlight build'inde de aynı tutarsızlık var mı, yoksa sadece dev build'de mi? Kullanıcı bu testi yaptı mı?

---

### E. Token Yönetimi (Multi-Device + Stale Token)

**E1.** Backend, FCM'ye gönderim sırasında **`UNREGISTERED`** veya **`INVALID_REGISTRATION`** hatası alınca o token'ı DB'den siliyor mu? Yoksa stale token'lara gönderim yapmaya devam ediyor mu?

**E2.** Aynı kullanıcı **iki iOS cihazında** kayıtlıysa, backend her ikisine de gönderiyor mu? Yoksa "son cihaz" override mu yapıyor?
- Bizim register endpoint'imiz `device_id` ile multi-device destekliyor → backend de bu şekilde mi tutuyor?

**E3.** Aynı `device_id` ile farklı kullanıcılar giriş yaparsa (cihaz değişimi), eski user'a ait token siliniyor mu?

**E4.** Token kayıt başarılı olduğunda backend log'da hangi user/device için kaydedildiği yazıyor mu? Bug debug için log paylaşımı.

---

### F. Backend Tarafı Debug Bilgileri

**F1.** Bildirim gönderim log'ları nerede tutulur? Bir test bildirimini gönderirken log'larda:
- Hangi FCM token'a gönderildi?
- FCM cevabı ne döndü? (success / error code / message ID)
- Hangi platform'a hangi payload gitti?

**F2.** Son 24 saatte iOS user'larına atılan bildirimlerin **FCM cevap dağılımı:**
- `SUCCESS`: %?
- `UNREGISTERED` / `INVALID_REGISTRATION`: %?
- `QUOTA_EXCEEDED`: %?
- `INVALID_ARGUMENT`: %?
- Diğer error code'lar?

**F3.** Belirli bir bildirim çağrısının trace edilebileceği bir tool var mı? (CorrelationID gibi) Frontend'den "bu bildirimi almadım" raporu geldiğinde backend hangi gönderimin başarısız olduğunu nasıl bulabilir?

---

### G. Test Senaryoları (Doğrulama)

Backend ekibinin kontrol etmesi gereken pratik kontroller:

**G1.** Frontend'in register ettiği FCM token'ı al, Firebase Console > Cloud Messaging > Send test message ile manuel bildirim gönder. Cihazda geliyor mu?
- **Geliyor** → backend gönderim kodunda sorun.
- **Gelmiyor** → APNs config / Firebase key sorunu.

**G2.** Aynı iOS cihazda foreground/background/killed state'lerin hepsinde test:
- Bildirim foreground'da iken geliyor mu?
- Background'a alıp tekrar denerken?
- Kill edip beklerken?

**G3.** Sandbox vs production karşılaştırması — local Xcode build vs TestFlight build aynı user/aynı bildirim için test edildi mi?

---

## 3. Frontend Tarafında Yapılabilecek 3 İyileştirme

Backend cevabını beklerken frontend'de küçük doğrulama/iyileştirme noktaları:

**F-Frontend-1.** `messaging().registerDeviceForRemoteMessages()` çağrısı eksik — iOS'ta Firebase SDK'nın APNs'e kayıt olmasını manuel olarak tetikler. Token alma öncesi eklenmesi önerilir.

**F-Frontend-2.** İki ayrı izin akışı (`Notifications.requestPermissionsAsync` + `messaging().requestPermission`) var — biri yeterli. Tek bir yerden istemek, iOS izin diyaloğunun tutarsız çıkmasını engeller.

**F-Frontend-3.** APNs entitlement `development`'tan `production`'a çevrilince production build'lerde sorun çözülebilir. EAS build profile'larında bunu otomatikleştirmek için `aps-environment` config plugin'i kullanılmalı.

> Bunlar bu doküman dışında ayrıca planlanır. Backend cevapları geldikten sonra hangisinin gerekli olduğu netleşir.

---

## 4. Bu Dokümanı Kullanma Önerisi

1. Backend ekibine bu dokümanı **A → G** sırasıyla yanıtlamasını rica et.
2. Özellikle **D (APNs environment)** ve **C (payload yapısı)** soruları kritik — bu iki konu birbirinden bağımsız iOS bildirim sorunlarının %80'ini açıklar.
3. Backend tablosunu (C2) doldurttuktan sonra **hangi notification type'ı gelmiyor** sorusunu cevaplarsan eşleştirip kök nedeni hızla bulabiliriz.
4. **G1 testi mutlaka yapılsın** — Firebase Console manual test, FCM↔APNs path'ini izole eder.

---

## 5. Cevaplar Geldiğinde

Backend cevaplarını bu dokümana ekleyin (her sorunun altına). Sonra:
- "Bu cevaplara göre hangi fix gerekiyor?" diye sorabiliriz; frontend tarafında uygulamamız gereken değişiklikleri çıkarırız.
- Backend tarafında değişiklik gerekiyorsa ayrıca task açılır.

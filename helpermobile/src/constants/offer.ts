// Sürücünün teklif verebileceği minimum tutar (TL).
// Pazarı bozucu düşük tekliflerin önüne geçmek için tüm hizmet ekranlarında
// `validateOfferPrice` aracılığıyla zorunlu kılınır.
export const MIN_OFFER_PRICE = 1000;

// Profil ekranındaki logoya arka arkaya 10 tap ile açılan gizli geliştirici
// override'ında geçerli minimum (test/admin kullanımı için).
export const DEV_OVERRIDE_MIN_OFFER_PRICE = 1;

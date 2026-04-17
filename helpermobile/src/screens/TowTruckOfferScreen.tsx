/**
 * TowTruckOfferScreen - Re-export
 *
 * Bu dosya geriye dönük uyumluluk için tutulmuştur.
 * Asıl implementasyon: ./towTruckOffer/TowTruckOfferScreen.tsx
 *
 * Yeni yapı:
 * - /screens/towTruckOffer/
 *   - TowTruckOfferScreen.tsx (Ana ekran - ~300 satır)
 *   - components/
 *     - RequestHeader.tsx (Talep numarası)
 *     - CustomerInfoSection.tsx (Müşteri bilgileri)
 *     - TowTruckSelector.tsx (Çekici seçimi dropdown)
 *     - DistanceEarningsSection.tsx (Mesafe ve kazanç)
 *     - VehicleInfoSection.tsx (Araç bilgileri)
 *     - VehicleStatusSection.tsx (Araç durumu ve ek ücretler)
 *     - ExtraEquipmentSection.tsx (Ekstra ekipmanlar)
 *     - AcceptButton.tsx (Teklif gönder butonu)
 *     - LoadingOverlay.tsx (Tam ekran loading)
 *   - hooks/
 *     - useTowTruckRequest.ts (Talep verisi hook)
 *     - useCurrentLocation.ts (Konum hook)
 *     - useTowTrucks.ts (Çekici listesi hook)
 *     - usePricing.ts (Fiyat hesaplama hook)
 *   - utils.ts (Yardımcı fonksiyonlar)
 */

export { default } from './towTruckOffer';

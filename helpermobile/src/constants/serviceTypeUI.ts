/**
 * ServiceGroup UI presentation — label, icon, color, emoji.
 *
 * Bu dosya UI katmanı içindir. Canonical literal tanımı ve backend boundary
 * map'leri için bkz. `./serviceTypes.ts`.
 *
 * Değerler mevcut projede dağınık halde bulunan kaynaklardan türetilmiştir ve
 * UI davranışı korunmuştur:
 *   - SERVICE_LABEL        <- screens/earnings/constants.ts (SERVICE_TYPES + STAT_CARDS)
 *   - SERVICE_EMOJI        <- screens/earnings/constants.ts (SERVICE_TYPE_LABELS)
 *   - SERVICE_COLOR        <- screens/earnings/constants.ts (STAT_CARDS)
 *   - SERVICE_BG_COLOR     <- screens/earnings/constants.ts (STAT_CARDS)
 *   - SERVICE_ICON         <- components/payment/CommissionPaymentCard.tsx +
 *                             components/payment/PaymentConfirmationModal.tsx
 *                             (MaterialCommunityIcons isimleri)
 *
 * Usage (gelecekteki migration'larda):
 *   import { SERVICE_LABEL, SERVICE_ICON } from '@/constants/serviceTypeUI';
 *   <Text>{SERVICE_LABEL.towTruck}</Text>            // "Çekici"
 *   <MCIcon name={SERVICE_ICON.crane} />             // "crane"
 */

import type { ServiceGroup } from './serviceTypes';

/**
 * İnsan-okur Türkçe label — tab, kart başlığı, liste satırı.
 * UI group `nakliye` için "Nakliye" (atomik `homeToHomeMoving` -> "Evden Eve",
 * `cityToCity` -> "Şehirler Arası" şeklinde ayrışık kalır — mevcut davranış).
 */
export const SERVICE_LABEL: Record<ServiceGroup, string> = {
  towTruck: 'Çekici',
  crane: 'Vinç',
  roadAssistance: 'Yol Yardım',
  homeToHomeMoving: 'Evden Eve',
  cityToCity: 'Şehirler Arası',
  transfer: 'Transfer',
  nakliye: 'Nakliye',
};

/**
 * Emoji gösterimi — özellikle Earnings ekranındaki badge ve stat kartlarında
 * aktif kullanılıyor (screens/earnings/constants.ts:36-44, 68-72).
 * UI group `nakliye` mevcut STAT_CARDS davranışına uygun olarak 🚚 kullanır.
 */
export const SERVICE_EMOJI: Record<ServiceGroup, string> = {
  towTruck: '🚗',
  crane: '🏗️',
  roadAssistance: '🔧',
  homeToHomeMoving: '🏠',
  cityToCity: '🚚',
  transfer: '🚐',
  nakliye: '🚚',
};

/**
 * MaterialCommunityIcons icon adı (react-native-vector-icons).
 * Kaynak: CommissionPaymentCard.tsx (crane, nakliye=truck-cargo-container,
 * roadAssistance=car-wrench, transfer=car-estate) + PaymentConfirmationModal.tsx
 * (towTruck=tow-truck). UI group `nakliye` CommissionPaymentCard ile aynı
 * (truck-cargo-container) — davranış korundu.
 *
 * Evden Eve / Şehirler Arası atomik değerleri için ayrışık icon seçildi
 * (home-variant / city) — hâlihazırda atomik tipler CommissionPaymentCard
 * tarafından doğrudan render edilmiyor; gelecek migration'da detay ekranlar
 * atomik ayrımı isterse kullanılabilir. Birleşik kullanımda yine `nakliye`
 * key'i seçilmeli.
 */
export const SERVICE_ICON: Record<ServiceGroup, string> = {
  towTruck: 'tow-truck',
  crane: 'crane',
  roadAssistance: 'car-wrench',
  homeToHomeMoving: 'home-variant',
  cityToCity: 'city',
  transfer: 'car-estate',
  nakliye: 'truck-cargo-container',
};

/**
 * Birincil vurgu rengi — ikon, metin, border.
 * Kaynak: screens/earnings/constants.ts (SERVICE_TYPES + STAT_CARDS).
 */
export const SERVICE_COLOR: Record<ServiceGroup, string> = {
  towTruck: '#1976D2',
  crane: '#F57C00',
  roadAssistance: '#388E3C',
  homeToHomeMoving: '#7B1FA2',
  cityToCity: '#9C27B0',
  transfer: '#5C6BC0',
  nakliye: '#7B1FA2', // STAT_CARDS 'nakliye' card color
};

/**
 * Açık arka plan rengi — kart/tag background.
 * Kaynak: screens/earnings/constants.ts (SERVICE_TYPES + STAT_CARDS).
 */
export const SERVICE_BG_COLOR: Record<ServiceGroup, string> = {
  towTruck: '#E3F2FD',
  crane: '#FFF3E0',
  roadAssistance: '#E8F5E9',
  homeToHomeMoving: '#F3E5F5',
  cityToCity: '#F3E5F5',
  transfer: '#E8EAF6',
  nakliye: '#F3E5F5', // STAT_CARDS 'nakliye' card bgColor
};

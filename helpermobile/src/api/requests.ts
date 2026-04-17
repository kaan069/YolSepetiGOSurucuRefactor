/**
 * @deprecated Bu dosya artık sadece backward compatibility için var.
 * Yeni kodlar için import { towTruckAPI, craneAPI } from './requests' kullanın.
 *
 * Bu dosya modular API yapısına taşındı:
 * - requests/towTruck.ts - Çekici API'leri
 * - requests/crane.ts - Vinç API'leri
 * - requests/nakliye.ts - Nakliye API'leri (Evden Eve + Şehirler Arası)
 * - requests/roadAssistance.ts - Yol Yardım API'leri
 * - requests/common.ts - Ortak API'ler (earnings, customer operations)
 */

// Re-export everything from the modular structure
export * from './requests/index';
export { default } from './requests/index';

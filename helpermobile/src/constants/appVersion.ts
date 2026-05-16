/**
 * Uygulama Versiyon Sabitleri
 *
 * Backend her isteğe `X-App-Version`, `X-App-Platform`, `X-App-Client` header'larını
 * bekliyor. Versiyon min'den düşükse 426 Upgrade Required döner.
 *
 * RELEASE PROSEDÜRÜ: Yeni sürüm yayımlarken HEM app.json/package.json (version),
 * HEM de aşağıdaki APP_VERSION sabitini güncelle. Üçü senkron olmalı.
 */
import { Platform } from 'react-native';

// app.json ve package.json `version` alanı ile senkron tutulmalı.
export const APP_VERSION = '1.0.2';

// Bu uygulama sürücü tarafı — backend ayrı driver/customer min versiyonları tutuyor.
export const APP_CLIENT = 'driver' as const;

// 'ios' | 'android' | 'web' — backend yalnızca bu üç değeri tanır.
export const APP_PLATFORM = Platform.OS === 'web' ? 'web' : Platform.OS;

/**
 * Semver karşılaştırma — `a < b ? -1 : a > b ? 1 : 0`.
 * Patch eksikse 0 varsayılır ("1.4" → "1.4.0"). Pre-release / build metadata ignore.
 */
export function compareVersions(a: string, b: string): number {
  const parse = (v: string): number[] => {
    const clean = v.split(/[-+]/)[0]; // 1.4.2-beta+x → "1.4.2"
    const parts = clean.split('.').map(p => parseInt(p, 10));
    while (parts.length < 3) parts.push(0);
    return parts.map(n => (Number.isFinite(n) ? n : 0));
  };
  const av = parse(a);
  const bv = parse(b);
  for (let i = 0; i < 3; i++) {
    if (av[i] !== bv[i]) return av[i] < bv[i] ? -1 : 1;
  }
  return 0;
}

/**
 * Application Logger — env-aware, category-based wrapper around `console`.
 *
 * Amaç:
 * - Dev modunda mevcut debug çıktılarını korumak (grep-friendly prefix).
 * - Production'da bilgilendirme/debug log'larını susturmak, ama kritik
 *   `warn` / `error` akışlarını canlı tutmak (future crash reporter hook'u
 *   buraya bağlanır).
 *
 * Davranış:
 * - `__DEV__ === true`  → debug/info/warn/error hepsi console'a yazar.
 * - `__DEV__ === false` → debug/info noop; warn/error console'a yazar.
 *
 * Format:
 *   `[category] message` ( + opsiyonel extra )
 *   Örn: `[fcm] Notification received { type: 'offer' }`
 *
 * ---------------------------------------------------------------------------
 * SECURITY — BU LOGGER'A ASLA AŞAĞIDAKİLERİ YAZMAYIN:
 *   - Access / refresh / FCM token'ları
 *   - Şifre, OTP kodu, PIN
 *   - Tam API response/request payload'ları (PII: TC, telefon, adres, kart
 *     bilgisi, konum history)
 *   - Kullanıcı mail adresi + id birleşik dump'ı
 *
 * Minimal ve anonim context geçin. Örn: `{ userId, requestId }`.
 * Bilinmeyen objeleri tamamen dump etmek yerine önce sanitize edin.
 * ---------------------------------------------------------------------------
 *
 * İleride:
 * - `error` çağrılarını uzak servise (Sentry/Bugsnag) iletmek için burada
 *   `setRemoteReporter()` hook'u eklenecek (ayrı PR).
 */

export type LogCategory =
  | 'auth'
  | 'fcm'
  | 'network'
  | 'payment'
  | 'websocket'
  | 'location'
  | 'orders'
  | 'vehicles'
  | 'navigation'
  | 'general';

export type LogLevel = 'debug' | 'info' | 'warn' | 'error';

export interface Logger {
  debug(category: LogCategory, message: string, extra?: unknown): void;
  info(category: LogCategory, message: string, extra?: unknown): void;
  warn(category: LogCategory, message: string, extra?: unknown): void;
  error(category: LogCategory, message: string, extra?: Error | unknown): void;
}

const format = (category: LogCategory, message: string): string =>
  `[${category}] ${message}`;

const hasExtra = (extra: unknown): boolean => extra !== undefined;

export const logger: Logger = {
  debug(category, message, extra) {
    if (!__DEV__) return;
    if (hasExtra(extra)) console.log(format(category, message), extra);
    else console.log(format(category, message));
  },
  info(category, message, extra) {
    if (!__DEV__) return;
    if (hasExtra(extra)) console.log(format(category, message), extra);
    else console.log(format(category, message));
  },
  warn(category, message, extra) {
    if (hasExtra(extra)) console.warn(format(category, message), extra);
    else console.warn(format(category, message));
  },
  error(category, message, extra) {
    if (hasExtra(extra)) console.error(format(category, message), extra);
    else console.error(format(category, message));
  },
};

export default logger;

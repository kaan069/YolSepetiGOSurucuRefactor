/**
 * Merkezi network yapılandırması
 *
 * API (HTTP) ve WebSocket (WS) base URL'leri tek kaynaktan türer.
 * Runtime'da `EXPO_PUBLIC_API_URL` env değişkeni varsa onu, yoksa
 * production fallback URL'ini kullanır.
 *
 * NOT: `process.env.EXPO_PUBLIC_*` değerleri Expo/Metro tarafından build
 * zamanında inline edilir. Değişiklik sonrası dev server restart gerekebilir.
 */

const DEFAULT_API_BASE_URL = 'https://api.yolsepetigo.com';

/**
 * HTTP(S) base URL — axios `baseURL` ve tam URL oluşturma için kullanılır.
 */
export const API_BASE_URL: string =
  process.env.EXPO_PUBLIC_API_URL ?? DEFAULT_API_BASE_URL;

/**
 * `https://...` -> `wss://...`, `http://...` -> `ws://...` dönüşümü.
 * Başka şemalar olduğu gibi döner (davranışı bozmamak için).
 */
export const httpToWs = (url: string): string => {
  if (url.startsWith('https://')) return `wss://${url.slice('https://'.length)}`;
  if (url.startsWith('http://')) return `ws://${url.slice('http://'.length)}`;
  return url;
};

/**
 * WebSocket base URL — jobs / location WS servisleri tarafından tüketilir.
 */
export const WS_BASE_URL: string = httpToWs(API_BASE_URL);

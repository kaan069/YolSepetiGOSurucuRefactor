/**
 * Uygulama yapılandırma sabitleri
 */

/**
 * Arka plan konum izni kapısını etkinleştir/devre dışı bırak
 * true: Kullanıcı arka plan konum izni vermeden uygulamayı kullanamaz
 * false: Arka plan konum izni kontrolü atlanır
 */
export const REQUIRE_BACKGROUND_RUNNING_PERMISSION = true;

/**
 * Android pil optimizasyonu kontrolünü etkinleştir/devre dışı bırak
 * true: Kullanıcı pil optimizasyonunu kapatmadan uygulamayı kullanamaz (sadece Android)
 * false: Pil optimizasyonu kontrolü atlanır
 */
export const REQUIRE_BATTERY_OPTIMIZATION_CHECK = true;

/**
 * Hesap hazırlık kapısını etkinleştir/devre dışı bırak
 * true: Hesap onaylanana kadar kullanıcı uygulamayı kullanamaz
 * false: Hesap hazırlık kontrolü atlanır
 */
export const REQUIRE_ACCOUNT_READINESS = true;

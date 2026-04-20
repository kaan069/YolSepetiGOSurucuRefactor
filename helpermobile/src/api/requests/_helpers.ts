/**
 * Request API paylaşılan helper'ları.
 *
 * Amaç:
 * - Servis bazlı request API dosyalarında (towTruck, crane, nakliye, transfer,
 *   roadAssistance, employees, employeePanel, common) tekrar eden error log
 *   pattern'ini tek bir güvenli helper arkasında toplamak.
 *
 * GÜVENLİK:
 * - Backend error response body'si (error.response.data) ASLA loglanmaz.
 *   Bu gövdeler request_id, customer/driver/employee bilgileri, adres,
 *   fiyat payload'ı, tracking token gibi hassas alanlar içerebilir.
 * - Loglanan tek meta: HTTP status (varsa).
 * - `action` parametresi ÇAĞIRAN tarafça statik bir string olmalı.
 *   Dinamik/user input asla buraya sokulmamalı.
 * - Action naming konvansiyonu: `<servis>.<method>` (ör. `towTruck.acceptRequest`,
 *   `common.getTotalEarnings`). Logger sink'inde servis bazlı filtreleme
 *   yapabilmek için bu format korunmalı.
 */
import { logger } from '../../utils/logger';

export const logOrdersError = (action: string, error: any): void => {
  const status = error?.response?.status;
  logger.error('orders', `${action} failed`, status ? { status } : undefined);
};

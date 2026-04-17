/**
 * Payment Utility Functions
 *
 * Komisyon ödeme akışında kullanılan yardımcı fonksiyonlar.
 * CommissionPaymentModal ve ThreeDSWebView tarafından paylaşılır.
 */

/**
 * iyzico/banka hata kodlarını kullanıcı dostu mesajlara çevirir
 */
export const getReadablePaymentError = (errorMessage: string): string => {
  const errorMappings: Record<string, string> = {
    // Bakiye/Limit hataları
    '10051': 'Kartınızda yeterli bakiye bulunmuyor. Lütfen bakiyenizi kontrol edin veya başka bir kart deneyin.',
    'yetersiz bakiye': 'Kartınızda yeterli bakiye bulunmuyor. Lütfen bakiyenizi kontrol edin.',
    'kart limiti yetersiz': 'Kart limitiniz yetersiz. Lütfen bankanızla iletişime geçin veya başka bir kart deneyin.',
    // Kart hataları
    '5001': 'Kart numarası geçersiz. Lütfen kart bilgilerinizi kontrol edin.',
    'kart numarası geçersiz': 'Kart numarası geçersiz. Lütfen kart bilgilerinizi kontrol edin.',
    // İşlem reddedildi
    '10005': 'İşleminiz banka tarafından reddedildi. Lütfen bankanızla iletişime geçin.',
    'işleminiz reddedildi': 'İşleminiz banka tarafından reddedildi. Lütfen bankanızla iletişime geçin.',
    // Geçersiz işlem
    '10012': 'Geçersiz işlem. Lütfen tekrar deneyin.',
    'geçersiz işlem': 'Geçersiz işlem. Lütfen tekrar deneyin.',
    // Ek doğrulama
    '10084': 'Bankanız ek doğrulama istiyor. Lütfen bankanızla iletişime geçin.',
    'ek doğrulama': 'Bankanız ek doğrulama istiyor. Lütfen bankanızla iletişime geçin.',
    // 3DS hataları
    '3ds': '3D Secure doğrulaması başarısız. Lütfen tekrar deneyin.',
    // Sistem hataları
    'sistem hatası': 'Bir sistem hatası oluştu. Lütfen daha sonra tekrar deneyin.',
    'timeout': 'İşlem zaman aşımına uğradı. Lütfen tekrar deneyin.',
  };

  const lowerMessage = errorMessage.toLowerCase();
  for (const [key, value] of Object.entries(errorMappings)) {
    if (lowerMessage.includes(key.toLowerCase())) {
      return value;
    }
  }
  return errorMessage || 'Ödeme işlemi başarısız oldu. Lütfen tekrar deneyin.';
};

export const formatCurrency = (amount: number): string => {
  return amount.toLocaleString('tr-TR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
};

export const formatCardNumber = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  const limited = cleaned.slice(0, 16);
  const groups = limited.match(/.{1,4}/g);
  return groups ? groups.join(' ') : limited;
};

export const formatExpireDate = (value: string): string => {
  const cleaned = value.replace(/\D/g, '');
  if (cleaned.length >= 2) {
    const month = cleaned.slice(0, 2);
    const year = cleaned.slice(2, 4);
    const monthNum = parseInt(month);
    if (monthNum > 12) {
      return '12' + (year ? '/' + year : '');
    }
    return month + (year ? '/' + year : '');
  }
  return cleaned;
};

export type CardBrand = 'visa' | 'mastercard' | 'amex' | 'troy' | 'discover' | 'unknown';

export const getCardBrand = (number: string): CardBrand => {
  const cleaned = number.replace(/\D/g, '');
  if (!cleaned) return 'unknown';

  if (cleaned.startsWith('4')) return 'visa';
  if (/^5[1-5]/.test(cleaned) || /^2[2-7]/.test(cleaned)) return 'mastercard';
  if (/^3[47]/.test(cleaned)) return 'amex';
  if (cleaned.startsWith('9792')) return 'troy';
  if (/^6011|^65|^64[4-9]/.test(cleaned)) return 'discover';

  return 'unknown';
};

export const getCardBrandFromAssociation = (association: string): CardBrand => {
  switch (association) {
    case 'VISA': return 'visa';
    case 'MASTER_CARD': return 'mastercard';
    case 'AMERICAN_EXPRESS': return 'amex';
    case 'TROY': return 'troy';
    default: return 'unknown';
  }
};

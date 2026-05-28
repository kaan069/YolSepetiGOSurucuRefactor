export const SUPPORT_WHATSAPP_NUMBER = '905550103434';

export const buildSupportWhatsAppUrl = (message?: string): string => {
  const base = `https://wa.me/${SUPPORT_WHATSAPP_NUMBER}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
};

/**
 * Müşteriyi arama ve konuma yol tarifi — tek kaynak.
 * (Eskiden ekran/bileşen başına ayrı ayrı yazılmıştı: tel: 10, harita 8 kopya.)
 */
import { Alert, Linking, Platform } from 'react-native';
import { logger } from './logger';

/** Telefon uygulamasını numarayla açar; açılamazsa numarayı gösteren uyarı verir. */
export async function callPhone(phone?: string | null): Promise<void> {
  if (!phone) return;
  const cleanPhone = phone.replace(/[^0-9+]/g, '');
  const url = `tel:${cleanPhone}`;
  try {
    // iOS simülatörde tel: desteklenmez
    if (Platform.OS === 'ios') {
      const supported = await Linking.canOpenURL(url);
      if (!supported) {
        Alert.alert('Uyarı', `Bu cihazda telefon araması desteklenmiyor. Numara: ${phone}`);
        return;
      }
    }
    await Linking.openURL(url);
  } catch {
    logger.error('orders', 'contactActions.callPhone failure');
    Alert.alert('Hata', `Telefon uygulaması açılamadı. Lütfen numarayı manuel arayın: ${phone}`);
  }
}

/** Haritalar uygulamasını verilen koordinatta açar; uygulama yoksa Google Maps web'e düşer. */
export async function openMapsAt(
  latitude?: number | string | null,
  longitude?: number | string | null,
): Promise<void> {
  const lat = typeof latitude === 'string' ? parseFloat(latitude) : latitude;
  const lng = typeof longitude === 'string' ? parseFloat(longitude) : longitude;
  if (typeof lat !== 'number' || typeof lng !== 'number' || isNaN(lat) || isNaN(lng)) {
    Alert.alert('Hata', 'Konum bilgisi bulunamadı');
    return;
  }
  const scheme = Platform.select({ ios: 'maps:', android: 'geo:' });
  const url = `${scheme}${lat},${lng}?q=${lat},${lng}`;
  try {
    const supported = await Linking.canOpenURL(url);
    await Linking.openURL(
      supported ? url : `https://www.google.com/maps/search/?api=1&query=${lat},${lng}`,
    );
  } catch {
    Alert.alert('Hata', 'Harita açılırken bir hata oluştu');
  }
}

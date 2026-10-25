/**
 * Backend'in uygulama içi ekran açtırabildiği bağlantılar (pano detayındaki buton: cta_url).
 *
 * Biçim: `app://<anahtar>` (ör. `app://service-city`). Yalnızca bu listedeki anahtarlar açılır;
 * bilinmeyen anahtarda buton gösterilmez. Böylece yeni bir anahtar, onu tanımayan eski
 * sürümlerde kırık buton yerine hiç görünmez. Liste backend'deki ekran seçenekleriyle aynı tutulur.
 */
import type { NativeStackNavigationProp } from '@react-navigation/native-stack';
import type { RootStackParamList } from '../navigation';

type Navigation = NativeStackNavigationProp<RootStackParamList>;

const APP_LINKS: Record<string, (navigation: Navigation) => void> = {
  // Sekmeler
  orders: (n) => n.navigate('Tabs', { screen: 'OrdersTab' }), // İşler
  earnings: (n) => n.navigate('Tabs', { screen: 'EarningsTab' }), // Kazançlar
  profile: (n) => n.navigate('Tabs', { screen: 'ProfileTab' }), // Profil
  // Ekranlar
  'scheduled-jobs': (n) => n.navigate('ScheduledJobs'), // Randevulu İşlerim
  'service-city': (n) => n.navigate('ServiceCity'), // Hizmet Şehirleri
  documents: (n) => n.navigate('DocumentsScreen'), // Evraklarım
  vehicles: (n) => n.navigate('VehiclesScreen'), // Araçlarım
  'company-info': (n) => n.navigate('CompanyInfo'), // Şirket Bilgileri
  'payment-info': (n) => n.navigate('CreditCardInfo'), // Ödeme Bilgileri (kart)
  referral: (n) => n.navigate('ReferralCode'), // Davet Et
  ratings: (n) => n.navigate('RatingsAndReviews'), // Değerlendirmeler
  reports: (n) => n.navigate('ReportsAndHistory'), // Raporlar ve Geçmiş
  permissions: (n) => n.navigate('Permissions'), // İzinler
  feedback: (n) => n.navigate('Feedback'), // Geri Bildirim
};

/** `app://service-city` → ekranı açan fonksiyon; uygulama bağlantısı değilse ya da tanınmıyorsa null */
export function resolveAppLink(url: string): ((navigation: Navigation) => void) | null {
  const match = url.trim().match(/^app:\/\/([a-z0-9-]+)\/?$/i);
  if (!match) return null;
  return APP_LINKS[match[1].toLowerCase()] ?? null;
}

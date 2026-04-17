// Backend Sprint A ile uyumlu minimal tipler

export type OrderStatus = 'pending' | 'accepted' | 'awaiting_approval' | 'awaiting_payment' | 'in_progress' | 'completed' | 'cancelled';

// Represents a tow truck or other vehicle owned by the service provider.
// Hizmet sağlayıcısına ait bir çekiciyi veya başka bir aracı temsil eder.
export interface ProviderVehicle {
  id: string;
  plate: string;
  capacity: number; // Towing capacity in tons. // Ton cinsinden çekme kapasitesi.
  color: string;
  registrationDoc?: string; // URI for the document image. // Belge resmi için URI.
}

// Represents a crane owned by the service provider.
// Hizmet sağlayıcısına ait bir vinci temsil eder.
export interface ProviderCrane {
  id: string;
  maxReach: number; // Max reach in floors. // Kat cinsinden maksimum erişim.
  capacity: number; // Lifting capacity in tons. // Ton cinsinden kaldırma kapasitesi.
  hourlyRate: number; // Price per hour. // Saatlik ücret.
}

export type HelperRole = 'tow' | 'tire' | 'crane' | 'transport'; // 'çekici' | 'lastik tamircisi' | 'vinç operatörü' | 'nakliyeci'

export interface AuthUser {
  id: string;
  username: string;
  password: string; // mock için düz metin (gerçekte TUTMAYACAĞIZ)
  fullName: string;
  birthDate?: string;     // ISO yyyy-mm-dd
  phone_number?: string;
  nationalId?: string;    // T.C. kimlik
  workAddress?: string;
  role?: HelperRole;
  provider_type?: string;
  vehicles?: ProviderVehicle[]; // List of the provider's tow trucks. // Sağlayıcının çekicilerinin listesi.
  cranes?: ProviderCrane[]; // List of the provider's cranes. // Sağlayıcının vinçlerinin listesi.
}

export interface AuthState {
  isAuthenticated: boolean;
  currentUser?: AuthUser | null;
}

// --- Notification types ---
// Bildirim tipleri
export type NotificationType =
  | 'new_job'           // Yeni iş teklifi
  | 'job_accepted'      // İş kabul edildi
  | 'job_cancelled'     // İş iptal edildi
  | 'job_completed'     // İş tamamlandı
  | 'payment_received'  // Ödeme alındı
  | 'rating_received'   // Değerlendirme alındı
  | 'system';           // Sistem bildirimi

export interface NotificationDto {
  id: string;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: any;           // Bildirimle birlikte gelen ekstra data
  isRead: boolean;
  createdAt: string;
}

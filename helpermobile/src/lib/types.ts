// Backend Sprint A ile uyumlu minimal tipler

export type VehicleType = 'car' | 'motorcycle' | 'truck';
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
export interface LocationDto {
  id: string;
  address: string;
  latitude: number;
  longitude: number;
  title?: string;
}

export interface VehicleDto {
  id: string;
  type: VehicleType;
  model: string;
  plate: string;
  color: string;
  year: number;
}

export interface DriverDto {
  id: string;
  name: string;
  rating: number;
  vehicle: VehicleDto;
  isAvailable: boolean;
  currentLocation?: LocationDto | null;
  ratePerKm?: number; // Sprint A: client-store’da da tutacağız
}

export interface OrderDto {
  id: string;
  userId: string;
  pickupLocation: LocationDto;
  dropoffLocation: LocationDto;
  vehicle: VehicleDto; // pending iken "Requested" placeholder gelebilir
  status: OrderStatus;
  price: number;
  createdAt: string;
  updatedAt: string;
  driverId?: string | null;
  estimatedTime?: number | null;
  serviceType: 'tow' | 'crane' | 'transport'; // Type of service requested // Talep edilen hizmet türü
  trackingToken?: string; // ⚠️ YENİ: 32 karakterlik tracking token (WebSocket ve API authentication için)
}

// --- Offer tarafı ---
export type OfferStatus = 'pending' | 'accepted' | 'rejected';
export type PricingSource = 'auto' | 'manual';

export interface OfferDto {
  id: string;
  orderId: string;
  driverId: string;
  distanceKm: number;
  ratePerKm: number;
  autoAmount: number;
  customAmount?: number | null;
  finalAmount: number;
  etaMinutes?: number | null;
  status: OfferStatus;
  pricingSource: PricingSource;
  createdAt: string;
  updatedAt: string;
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

// Request Photo Type (Talep Fotoğrafı)
export interface RequestPhoto {
    id: number;
    image_url: string;
    uploaded_by: 'customer' | 'agent' | 'driver';
    order: number;
    created_at: string;
}

// Pagination Types
export interface PaginatedResponse<T> {
    count: number;
    next: string | null;
    previous: string | null;
    results: T[];
}

// Provider Type (Hizmet Saglayici Tipi)
export type ProviderType = 'individual' | 'company' | 'employee';

// Auth Types
export interface User {
    id: number;
    username: string;
    first_name: string;
    last_name: string;
    email: string;
    phone_number: string;
    tc_no: string;
    birth_date: string;
    business_address: string;
    business_address_il: string;
    business_address_ilce: string;
    user_type: string[];
    provider_type?: ProviderType;  // Sahis / Firma / Eleman
    is_active: boolean;
    created_at: string;
}

export interface Tokens {
    refresh: string;
    access: string;
}

export interface AuthResponse {
    message: string;
    user: User;
    tokens: Tokens;
}

export interface RegisterRequest {
    first_name: string;
    last_name: string;
    phone_number: string;
    tc_no: string;
    business_address: string;
    business_address_il: string;
    business_address_ilce: string;
    password: string;
    password_confirm: string;
    user_type?: string[];  // Kullanıcı tipleri listesi (örn: ['towTruck', 'crane'])
    provider_type?: ProviderType;  // Sahis / Firma (kayit sirasinda secilir)
    fcm_token?: string;    // Firebase Cloud Messaging token (push notifications için)
    verification_token: string;  // OTP doğrulama sonrası alınan JWT token
}

// OTP Types
export interface SendOTPRequest {
    phone_number: string;
}

export interface SendOTPResponse {
    message: string;
    expires_in?: number;  // OTP'nin geçerlilik süresi (saniye)
}

export interface VerifyOTPRequest {
    phone_number: string;
    otp_code: string;
}

export interface VerifyOTPResponse {
    message: string;
    verification_token: string;  // Register için kullanılacak JWT token
}

export interface LoginRequest {
    phone_number: string;
    password: string;
    device_type?: 'android' | 'ios' | 'web';
}

// Vehicle Types
export interface Crane {
    id?: number;
    user_id?: number;
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
    created_at?: string;
    max_height: number;
}

export interface CreateCraneRequest {
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
    max_height: number;
}

export interface UpdateCraneRequest {
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
    max_height: number;
}

// Tow Truck Types (Çekici)
export interface TowTruck {
    id?: number;
    user_id?: string;
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
    availibility_vehicles_types: string[];  // Çekebileceği araç tipleri (örn: ['car', 'tractor'])
    created_at?: string;
}

export interface CreateTowTruckRequest {
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
    availibility_vehicles_types: string[];
}

export interface UpdateTowTruckRequest {
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    color: string;
    availibility_vehicles_types: string[];
}

// Request ID Info (Both Tow Truck and Crane)
export interface RequestIdInfo {
    id: number;
    requested_service_type: string;
    request_owner_phone: string;
    request_owner_name_surname?: string;  // Müşteri isim soyisim (snake_case)
    requestOwnerNameSurname?: string;     // Müşteri isim soyisim (camelCase - backend format)
    estimated_price: string;
    status: string;  // pending, in_progress, completed, cancelled
    accepted_by_driver_id: number | null;
    created_at: string;
    updated_at: string;
}

// Request Types - Crane Request (Vinç Talebi)
export interface CraneRequest {
    id: number;
    request_id: RequestIdInfo;  // Backend'den object olarak geliyor
    requestOwnerNameSurname?: string;    // Müşteri adı soyadı (ana response'da)
    requestOwnerPhone?: string;          // Müşteri telefonu (ana response'da)
    trackingToken?: string;              // 32 karakterlik tracking token (müşteri takibi için)
    status?: string;                 // İş durumu (pending, in_progress, completed)
    my_offer?: DriverOffer;          // Sürücünün kendi teklifi (awaiting_approval/awaiting_payment durumunda)
    load_type: string;           // Yük tipi
    load_weight: string;         // Yük ağırlığı
    lift_height: string;         // Kaldırma yüksekliği
    floor: string;               // Kat bilgisi
    has_obstacles: boolean;      // Engel var mı
    obstacle_note: string;       // Engel notu
    address: string;             // Adres
    latitude: string;            // Enlem
    longitude: string;           // Boylam
    distance_to_location_km?: number;  // Vincin iş konumuna mesafesi (km)
    estimated_duration_hours?: number; // Tahmini iş süresi - snake_case (backend)
    estimatedDurationHours?: number;   // Tahmini iş süresi - camelCase (web)
    final_price?: number;            // Tamamlanan iş için nihai fiyat
    platform_commission?: string;    // Platform komisyonu
    completed_at?: string;           // İşin tamamlanma zamanı
    pricing?: InsurancePricingInfo;   // Sigortalı iş fiyatlandırma bilgisi
    photos?: RequestPhoto[];          // Müşterinin yüklediği fotoğraflar
    created_at: string;          // Oluşturulma zamanı
    updated_at: string;          // Güncellenme zamanı
}

// Crane List Types (Vinç Listesi)
export interface CraneListItem {
    id: number;
    brand: string;
    model: string;
    plate_number?: string;       // Plaka numarası (opsiyonel)
}

export interface CraneListResponse {
    count: number;
    cranes: CraneListItem[];
}

// Crane Price Calculation Types (Fiyat Hesaplama)
export interface CalculateCranePriceRequest {
    requestId: number;           // İş talebi ID'si
    vehicleId: number;           // Seçilen vinç ID'si
    distanceToLocationKm: number; // Otomatik hesaplanan mesafe
}

export interface CalculateCranePriceResponse {
    vehicle: {
        id: number;
        plate_number: string;
        brand: string;
        model: string;
    };
    pricing: {  // Backend 'pricing' gönderiyor, 'calculation' değil
        distance_km: number;
        distance_price: number;
        duration_hours: number;
        duration_price: number;
        total_price: number;
        breakdown: string;
    };
}

// Crane Accept Request Types (İş Kabul Etme)
export interface AcceptCraneRequest {
    vehicleId: number;
    distanceToLocationKm: number;
}

export interface AcceptCraneResponse {
    message: string;
    id?: number;                         // Job ID (ana seviyede)
    trackingToken?: string;              // Tracking token
    customerId?: string;                 // Müşteri ID
    pickupLocationId?: string;           // Pickup location ID
    dropoffLocationId?: string;          // Dropoff location ID
    vehicleId?: string;                  // Araç ID
    vehicleModel?: string;               // Araç modeli
    vehiclePlate?: string;               // Araç plakası
    vehicleColor?: string;               // Araç rengi
    vehicleYear?: number;                // Araç yılı
    data: {
        id: number;
        requested_service_type: string;
        request_owner_phone: string;
        estimated_price: string;
        status: string;
        accepted_by_driver_id: number;
        created_at: string;
        updated_at: string;
    };
    pricing_breakdown: {
        distance_km: number;
        distance_price: number;
        duration_hours: number;
        duration_price: number;
        total_price: number;
        vehicle: {
            id: number;
            plate_number: string;
        };
    };
}

// Request Types - Tow Truck Request (Çekici Talebi)
export interface TowTruckRequestSummary {
    id: number;
    requested_service_type: string;  // Talep edilen servis tipi (towTruck)
    request_owner_phone: string;     // Talep sahibinin telefonu
    estimated_price: string;         // Tahmini fiyat
    status: string;                  // Talep durumu (pending, accepted, etc.)
    created_at: string;              // Oluşturulma zamanı
    updated_at: string;              // Güncellenme zamanı
}

// Insurance Pricing Info (Sigortalı İş Fiyatlandırma)
export interface InsurancePricingInfo {
    estimated_price?: string;          // Tahmini fiyat (geriye uyumluluk)
    base_price: string;                // Temel fiyat
    platform_commission: string;       // Platform komisyonu
    insurance_commission: string;      // Sigorta komisyonu
    total_amount: string;              // KDV hariç toplam
    total_with_vat: string;            // KDV dahil toplam
    vat_rate: number;                  // KDV oranı
    currency: string;                  // Para birimi (TRY)
}

// Surcharge Type (Ek Ücret - Dinamik Soru/Cevap)
export interface Surcharge {
    question: string;              // Soru metni (örn: "Aracın vites kutusu takılı mı?")
    answer: string;                // Seçilen cevap (örn: "Evet")
    amount: number;                // Bu seçenek için ek ücret (TL)
}

// Pricing Breakdown Type (Fiyat Detayı)
export interface PricingBreakdown {
    base_price: number;            // Temel fiyat (katman + mesafe)
    distance_price: number;        // Mesafe ücreti
    total_surcharge: number;       // Toplam ek ücret (TL)
    surcharges: Surcharge[];       // Ek ücret detayları (dinamik sorular)
    tier_info?: {                  // Katman bilgisi (opsiyonel)
        tier_name: string;
        base_price: number;
        distance_limit_km: number;
        per_km_rate: number;
    };
    commission_info?: {            // Komisyon bilgisi (opsiyonel)
        commission_percent: number;
        commission_amount: number;
    };
    // Komisyon KDV bilgileri (backend pricing_breakdown içinde gönderiyor)
    platform_commission?: number;
    commission_vat_rate?: number;          // KDV oranı (örn: 20)
    commission_vat_amount?: number;        // KDV tutarı (örn: 60)
    commission_total_with_vat?: number;    // KDV dahil toplam komisyon (örn: 360)
}

// Driver Offer Type (Sürücü Teklifi)
export interface DriverOffer {
    id: number;
    vehicle_id: number;
    proposed_price?: string;        // Sürücünün girdiği fiyat
    estimated_price: string;       // Müşteri için toplam fiyat
    driver_earnings: string;        // Sürücü kazancı
    platform_commission: string;    // Platform komisyonu
    pricing_breakdown: PricingBreakdown;
    status: string;                // pending, accepted, rejected
    created_at: string;
}

// Dinamik Soru-Cevap Tipi (Backend'den gelen format)
export interface QuestionAnswer {
    question_id: number;
    option_ids: number[];
    questionText?: string;           // Backend'den zenginleştirilmiş olarak gelebilir
    question_text?: string;          // Alternatif format
    selectedOptionText?: string;     // Backend'den zenginleştirilmiş olarak gelebilir
    selected_option_text?: string;   // Alternatif format
}

// Nested TowTruck Details (Backend'den camelCase formatında)
export interface TowTruckDetails {
    vehicleType?: string;
    licensePlate?: string;
}

// Request Types - Tow Truck Request Detail (Çekici Talebi Detay)
export interface TowTruckRequestDetail {
    id: number;
    request_id: RequestIdInfo | number;  // Backend'den object veya number olarak gelebiliyor
    requestOwnerNameSurname?: string;    // Müşteri adı soyadı (ana response'da)
    requestOwnerPhone?: string;          // Müşteri telefonu (ana response'da)
    trackingToken?: string;              // 32 karakterlik tracking token (müşteri takibi için)
    status?: string;                 // İş durumu (pending, in_progress, completed)
    my_offer?: DriverOffer;          // Sürücünün kendi teklifi (awaiting_approval durumunda)
    customer_id?: string;            // Müşteri ID
    vehicle_type: string;            // Araç tipi (suv, car, truck, etc.)
    vehicle_model?: string;          // Araç modeli
    vehicle_plate?: string;          // Araç plakası
    vehicle_color?: string;          // Araç rengi
    vehicle_year?: number;           // Araç yılı
    license_plate?: string;          // Araç plakası (eski format)

    // Nested araç detayları (Backend camelCase formatında gönderebilir)
    towTruckDetails?: TowTruckDetails;

    // Dinamik soru-cevap sistemi (eski boolean alanların yerini aldı)
    question_answers?: QuestionAnswer[];

    // DEPRECATED: Eski boolean alanlar (artık question_answers ile değiştirildi)
    isOnRoad?: boolean;               // Araç yolda mı?
    onRoad_note?: string;             // Araç yolda olma durumu notu
    is_running?: boolean;            // Motor çalışıyor mu? (opsiyonel)
    running_note?: string;           // Motor durumu notu (opsiyonel)
    is_gear_stuck?: boolean;          // Vites kilitli mi?
    gear_note?: string;               // Vites durumu notu
    is_tire_locked?: boolean;        // Lastik kilitli mi? (opsiyonel)
    tire_note?: string;              // Lastik durumu notu (opsiyonel)
    is_stuck?: boolean;               // Araç sıkışmış mı?
    stuck_note?: string;              // Sıkışma durumu notu
    is_crashed?: boolean;            // Araç kaza yapmış mı? (opsiyonel)
    crashed_note?: string;           // Kaza durumu notu (opsiyonel)
    is_vehicle_operational?: boolean; // Araç yürür durumda mı?
    operational_note?: string;        // Araç durumu notu
    has_extra_attachments?: boolean;  // Ekstra ekipman var mı?
    attachment_types?: string[];      // Ekipman tipleri

    pickup_location_id?: string;     // Alınacak konum ID
    pickup_address: string;          // Alınacak konum adresi
    pickup_latitude: string;         // Alınacak konum enlemi
    pickup_longitude: string;        // Alınacak konum boylamı
    dropoff_location_id?: string;    // Bırakılacak konum ID
    dropoff_address: string;         // Bırakılacak konum adresi
    dropoff_latitude: string;        // Bırakılacak konum enlemi
    dropoff_longitude: string;       // Bırakılacak konum boylamı
    route_distance: string;          // Güzergah mesafesi
    route_duration: string;          // Güzergah süresi
    estimated_km: number;            // Tahmini kilometre
    final_price?: number;            // Tamamlanan iş için nihai fiyat
    completed_at?: string;           // İşin tamamlanma zamanı
    pricingBreakdown?: PricingBreakdown;  // Dinamik fiyat detayları (surcharges ile)
    pricing?: InsurancePricingInfo;       // Sigortalı iş fiyatlandırma bilgisi
    request_owner_phone?: string;    // DEPRECATED: Talep sahibinin telefon numarası (eski format)
    request_owner_name?: string;     // DEPRECATED: Talep sahibinin adı (eski format)
    photos?: RequestPhoto[];         // Müşterinin yüklediği fotoğraflar
    created_at: string;              // Oluşturulma zamanı
    updated_at: string;              // Güncellenme zamanı
}

// Tow Truck Accept Request Types (Çekici İş Kabul Etme)
export interface AcceptTowTruckResponse {
    message: string;
    id?: number;                         // Job ID (ana seviyede)
    trackingToken?: string;              // Tracking token
    trackingUrl?: string;                // Tracking URL
    customerId?: string;                 // Müşteri ID
    pickupLocationId?: string;           // Pickup location ID
    dropoffLocationId?: string;          // Dropoff location ID
    vehicleId?: string;                  // Araç ID
    vehicleModel?: string;               // Araç modeli
    vehiclePlate?: string;               // Araç plakası
    vehicleColor?: string;               // Araç rengi
    vehicleYear?: number;                // Araç yılı
    driverEarnings?: number;             // Sürücü kazancı
    customerTotalPrice?: number;         // Müşteri toplam ücreti
    data?: {
        id: number;
        status: string;
        created_at: string;
        updated_at: string;
    };
}

// Company Info Types (Şirket Bilgileri)
export interface CompanyInfo {
    id: number;
    company_name: string;            // Şirket adı
    tax_number: string;              // Vergi numarası
    created_at: string;
    updated_at: string;
}

export interface CreateCompanyInfoRequest {
    company_name: string;
    tax_number: string;
}

export interface UpdateCompanyInfoRequest {
    company_name: string;
    tax_number: string;
}

// Payment Method Types (Ödeme Yöntemi)
export interface PaymentMethod {
    id: number;
    account_holder_name: string;     // Hesap sahibi adı
    iban: string;                    // IBAN numarası
    created_at: string;
    updated_at: string;
}

export interface CreatePaymentMethodRequest {
    account_holder_name: string;
    iban: string;
}

export interface UpdatePaymentMethodRequest {
    account_holder_name: string;
    iban: string;
}

// Earnings Summary Types (Kazanç Özet)
export type EarningsPeriod = 'today' | 'week' | 'month' | 'year';

// Hizmet türüne göre kazanç detayı
export interface ServiceTypeEarnings {
    earnings: string;                  // Kazanç miktarı (TL)
    job_count: number;                 // İş sayısı
}

// Tüm hizmet türlerinin kazanç detayları
export interface ByServiceTypeEarnings {
    towTruck: ServiceTypeEarnings;          // Çekici
    crane: ServiceTypeEarnings;             // Vinç
    roadAssistance: ServiceTypeEarnings;    // Yol Yardım
    homeToHomeMoving: ServiceTypeEarnings;  // Evden Eve Nakliye
    cityToCity: ServiceTypeEarnings;        // Şehirler Arası Nakliye
}

export interface PeriodEarningsResponse {
    period: string;                    // Dönem açıklaması (Türkçe, örn: "Bugün", "Son 7 Gün")
    start_date: string;                // Dönem başlangıç tarihi (ISO 8601)
    end_date: string;                  // Dönem bitiş tarihi (ISO 8601)
    total_earnings: string;            // Toplam net kazanç (TL)
    total_jobs: number;                // Toplam tamamlanan iş sayısı
    by_service_type: ByServiceTypeEarnings;  // Hizmet türüne göre kazanç detayları
    currency: string;                  // Para birimi (her zaman "TRY")
}

// Toplam Kazanç Response (tüm zamanlar)
export interface TotalEarningsResponse {
    total_earnings: string;            // Toplam kazanç (TL)
    total_jobs: number;                // Toplam iş sayısı
    by_service_type: ByServiceTypeEarnings;  // Hizmet türüne göre kazanç detayları
    currency: string;                  // Para birimi
}

// Kazanç Listesi Item (Pagination için)
export type EarningsServiceType = 'towTruck' | 'crane' | 'roadAssistance' | 'homeToHomeMoving' | 'cityToCity' | 'transfer';

export interface EarningsListItem {
    id: number;
    driver: number;
    driver_name: string;
    request_id: number;
    service_type: EarningsServiceType;
    service_type_display: string;
    gross_amount: string;              // Brüt kazanç
    platform_commission: string;       // Platform komisyonu
    net_amount: string;                // Net kazanç
    earned_at: string;                 // Kazanç tarihi (ISO 8601)
    created_at: string;
}

export interface EarningsListResponse {
    count: number;                     // Toplam kayıt sayısı
    next: string | null;               // Sonraki sayfa URL'i
    previous: string | null;           // Önceki sayfa URL'i
    results: EarningsListItem[];       // Kazanç listesi
}

// Kazanç Listesi Request Params
export interface EarningsListParams {
    page?: number;
    page_size?: number;
    service_type?: string;             // Virgülle ayrılmış: "towTruck,crane"
    period?: EarningsPeriod;
    start_date?: string;               // YYYY-MM-DD
    end_date?: string;                 // YYYY-MM-DD
}

// Profile Completeness Types (Profil Tamamlama - Backend Gerçek Format)
export interface ProfileCompletenessField {
    field: 'driver_license' | 'tax_plate' | 'company_info' | 'payment_method';
    message: string;
    status?: 'pending' | 'approved' | 'rejected';
    company_name?: string;
    account_holder?: string;
    action?: string;
}

export interface ProfileCompletenessResponse {
    is_complete: boolean;                    // Tüm bilgiler tam mı?
    completion_percentage: number;           // Tamamlanma yüzdesi (0-100)
    missing_fields: ProfileCompletenessField[];     // Eksik alanlar
    completed_fields: ProfileCompletenessField[];   // Tamamlanmış alanlar
}

// ==================== HESAP HAZIRLIK DURUMU ====================

export interface AccountReadinessVehicle {
    vehicle_type: string;
    vehicle_label: string;
    plate_number: string;
    document_status: 'pending' | 'approved' | 'rejected';
}

export interface AccountReadinessResponse {
    is_ready: boolean;
    license_approved: boolean;
    license_status: 'pending' | 'approved' | 'rejected' | null;
    license_rejection_reason: string | null;
    company_info_complete: boolean;
    company_info_details: { company_name: boolean; tax_number: boolean };
    payment_info_complete: boolean;
    has_approved_vehicle: boolean;
    vehicles: AccountReadinessVehicle[];
}

// ==================== NAKLİYE ARAÇ TİPLERİ ====================
// Backend'deki NakliyeModel alanlarına göre

// Nakliye Araç Tipi - Moving Vehicle Type
export type MovingVehicleType =
    | 'closed_truck'      // Kapalı kasa kamyon
    | 'closed_pickup'     // Kapalı kasa kamyonet
    | 'elevator_truck'    // Asansörlü nakliye aracı
    | 'panelvan'          // Panelvan (kargo van)
    | 'open_truck'        // Açık kasa kamyon
    | 'open_pickup'       // Açık kasa kamyonet
    | 'refrigerated'      // Frigorifik (soğutuculu) araç
    | 'tir'               // Tır
    | 'lowbed'            // Lowbed
    | 'partial_load';     // Parsiyel yük aracı

// Nakliye Aracı
export interface NakliyeVehicle {
    id: number;
    user_id?: number;
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    vehicle_type?: MovingVehicleType;           // Nakliye araç tipi
    vehicle_type_display?: string;              // Nakliye araç tipi görüntüleme adı
    capacity_type: 'small' | 'medium' | 'large';  // Araç kapasitesi tipi
    max_volume: number;        // Maksimum hacim (m³)
    max_weight: number;        // Maksimum ağırlık (kg)
    has_helper: boolean;       // Yardımcı personel var mı?
    verification_status?: 'pending' | 'approved' | 'rejected';  // Onay durumu
    created_at?: string;
}

export interface CreateNakliyeVehicleRequest {
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    vehicle_type: MovingVehicleType;  // Zorunlu - Nakliye araç tipi
    capacity_type: 'small' | 'medium' | 'large';
    max_volume: number;
    max_weight: number;
    has_helper: boolean;
}

export interface UpdateNakliyeVehicleRequest extends CreateNakliyeVehicleRequest {}

// ==================== YOL YARDIM ARAÇ TİPLERİ ====================
// Backend'deki YolYardimModel alanlarına göre

// Yol Yardım Aracı
export interface RoadAssistanceVehicle {
    id: number;
    user_id?: number;
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    available_services?: string[];  // Opsiyonel - hizmet türleri kaldırıldı
    verification_status?: 'pending' | 'approved' | 'rejected';  // Onay durumu
    created_at?: string;
}

export interface CreateRoadAssistanceVehicleRequest {
    brand: string;
    model: string;
    year: number;
    plate_number: string;
    available_services?: string[];  // Opsiyonel - hizmet türleri kaldırıldı
}

export interface UpdateRoadAssistanceVehicleRequest extends CreateRoadAssistanceVehicleRequest {}

// ==================== İŞ SAYILARI (JOB COUNTS) ====================

export interface JobCountsResponse {
  pending: number;
  awaiting_approval: number;
  awaiting_payment: number;
  in_progress: number;
}

// ==================== İŞ İPTAL TİPLERİ (JOB CANCELLATION) ====================

/** GET /requests/<service>/<tracking_token>/can-cancel/ response */
export interface CanCancelResponse {
    can_cancel: boolean;
    reason: string | null;
    elapsed_minutes: number;
    within_grace_period: boolean;
    refund_info: {
        original_amount: string;
        refund_rate: number;
        refund_amount: string;
        deduction_amount: string;
    } | null;
}

/** POST /requests/<service>/<tracking_token>/cancel/ response */
export interface CancelJobResponse {
    message: string;
    data?: any;
    cancellation?: {
        id: number;
        refund_amount: string;
        deduction_amount: string;
        deduction_rate: string;
        refund_status: string;
        within_grace_period: boolean;
        elapsed_minutes: string;
    };
}

/** API URL path segment for cancel endpoints */
export type CancelServiceType = 'tow-truck' | 'crane' | 'road-assistance' | 'home-moving' | 'city-moving';

// ==================== ELEMAN (EMPLOYEE) TİPLERİ ====================
// Firma sahiplerinin eleman yönetimi için

export interface Employee {
    id: number;
    user_id?: number;
    first_name: string;
    last_name: string;
    phone_number: string;
    tc_no: string;
    is_active?: boolean;
    is_available?: boolean;
    user_is_online?: boolean;
    employer_name?: string;
    company_name?: string;
    created_at?: string;
    updated_at?: string;
}

export interface CreateEmployeeRequest {
    first_name: string;
    last_name: string;
    phone_number: string;
    password: string;
    tc_no?: string;
}

export interface UpdateEmployeeRequest {
    first_name?: string;
    last_name?: string;
    phone_number?: string;
    tc_no?: string;
    is_active?: boolean;
}

// ==================== ELEMAN PANELİ TİPLERİ ====================
// Eleman olarak giriş yapan kullanıcıların dashboard/iş görünümü için

export interface EmployeeDashboardInfo {
    id: number;
    name: string;
    phone: string;
    is_available?: boolean;
    employer_name: string;
    employer_phone: string;
    company_name: string;
}

export interface EmployeeActiveJob {
    request_id: number;
    service_type: string;
    status: string;
    created_at: string;
}

export interface EmployeeDashboardResponse {
    employee_info: EmployeeDashboardInfo;
    active_job: EmployeeActiveJob | null;
    stats: {
        total_completed: number;
        this_month: number;
    };
}

export interface EmployeeJob {
    request_id: number;
    service_type: string;
    status: string;
    created_at: string;
    updated_at: string;
    customer_info: { name: string; phone: string } | null;
}

// ==================== TRANSFER TYPES ====================

export type TransferType = 'organization' | 'vip';
export type VehiclePreference = 'sedan' | 'vip_car' | 'minibus' | 'midibus' | 'bus';

export interface TransferRequest {
  id: number;
  request_id: RequestIdInfo;
  requestOwnerNameSurname?: string;
  requestOwnerPhone?: string;
  trackingToken?: string;
  status?: string;
  my_offer?: DriverOffer;
  transfer_type: TransferType;
  passenger_count?: number;
  vehicle_preference?: VehiclePreference;
  scheduled_date: string;
  scheduled_time: string;
  is_round_trip: boolean;
  return_same_route?: boolean;
  additional_notes?: string;
  pickup_address: string;
  pickup_latitude: string;
  pickup_longitude: string;
  dropoff_address: string;
  dropoff_latitude: string;
  dropoff_longitude: string;
  return_pickup_location?: { address: string; latitude: string; longitude: string };
  return_dropoff_location?: { address: string; latitude: string; longitude: string };
  estimated_km?: number;
  route_distance?: string;
  distance_to_location_km?: number;
  estimated_duration_hours?: number;
  photos?: RequestPhoto[];
  pricing?: InsurancePricingInfo;
  final_price?: number;
  platform_commission?: string;
  completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface TransferListItem {
  id: number;
  brand: string;
  model: string;
  plate_number?: string;
  passenger_capacity?: number;
  vehicle_class?: VehiclePreference;
}

export interface TransferVehicleInfo {
  id: number;
  plate_number: string;
  brand: string;
  model: string;
  year: string;
  transfer_type: TransferType;
  passenger_capacity: number;
  vehicle_class: VehiclePreference;
  photo?: string;
}

export interface EmployeeJobsResponse {
    count: number;
    page: number;
    page_size: number;
    total_pages: number;
    results: EmployeeJob[];
}

export interface EmployeeJobLocationInfo {
    pickup_address?: string;
    dropoff_address?: string;
    address?: string;
    pickup_lat?: number;
    pickup_lng?: number;
    dropoff_lat?: number;
    dropoff_lng?: number;
    latitude?: number;
    longitude?: number;
}

export interface EmployeeServiceDetails {
    // Çekici
    vehicle_type?: string;
    estimated_km?: number;
    total_distance_km?: number;
    // Vinç
    load_type?: string;
    load_weight?: number;
    lift_height?: number;
    floor?: number;
    has_obstacles?: boolean;
    obstacle_note?: string;
    distance_to_location_km?: number;
    estimated_duration_hours?: number;
    // Yol Yardım
    problem_types?: string[];
    problem_description?: string;
    additional_notes?: string;
    // Ev Nakliye
    home_type?: string;
    floor_from?: number;
    floor_to?: number;
    has_elevator_from?: boolean;
    has_elevator_to?: boolean;
    has_large_items?: boolean;
    large_items_note?: string;
    has_fragile_items?: boolean;
    needs_packing?: boolean;
    needs_disassembly?: boolean;
    preferred_date?: string | null;
    preferred_time_slot?: string;
    // Şehirler Arası
    width?: number;
    length?: number;
    height?: number;
}

export interface EmployeeJobDetail {
    request_id: number;
    service_type: string;
    status: string;
    vehicle_plate: string | null;
    tracking_token: string | null;
    location_info: EmployeeJobLocationInfo;
    service_details?: EmployeeServiceDetails;
    photos?: RequestPhoto[];
    question_answers?: QuestionAnswer[];
    created_at: string;
    updated_at: string;
    customer_info: { name: string; phone: string } | null;
}


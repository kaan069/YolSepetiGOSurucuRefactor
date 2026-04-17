// Yol Yardım sabitleri ve yardımcı fonksiyonlar

// Problem tipi çevirisi - Backend'den gelen tüm olası değerler
export const PROBLEM_TYPE_LABELS: Record<string, string> = {
  // snake_case formatı
  'flat_tire': 'Lastik Patlaması',
  'battery': 'Akü Problemi',
  'battery_jump': 'Akü Takviyesi',
  'fuel': 'Yakıt Bitti',
  'locked_out': 'Araç Kilit Açma',
  'lockout': 'Araç Kilit Açma',
  'engine': 'Motor Arızası',
  'overheating': 'Motor Isınması',
  'brake': 'Fren Arızası',
  'transmission': 'Şanzıman Arızası',
  'electrical': 'Elektrik Arızası',
  'accident': 'Kaza',
  'towing': 'Çekici',
  'tire_change': 'Lastik Değişimi',
  'jump_start': 'Akü Takviyesi',
  'fuel_delivery': 'Yakıt İkmali',
  'locksmith': 'Çilingir',
  'winch': 'Vinç/Kurtarma',
  'key_locked': 'Anahtar Kilitli Kaldı',
  'dead_battery': 'Akü Bitti',
  'out_of_fuel': 'Yakıt Bitti',
  'engine_failure': 'Motor Arızası',
  'starter': 'Marş Arızası',
  'alternator': 'Şarj Dinamosu Arızası',
  'cooling': 'Soğutma Sistemi Arızası',
  'suspension': 'Süspansiyon Arızası',
  'steering': 'Direksiyon Arızası',
  'exhaust': 'Egzoz Arızası',
  'clutch': 'Debriyaj Arızası',
  'other': 'Diğer',
  // Büyük harfli veya farklı formatlar
  'FLAT_TIRE': 'Lastik Patlaması',
  'BATTERY': 'Akü Problemi',
  'FUEL': 'Yakıt Bitti',
  'LOCKED_OUT': 'Araç Kilit Açma',
  'LOCKOUT': 'Araç Kilit Açma',
  'ENGINE': 'Motor Arızası',
  'OVERHEATING': 'Motor Isınması',
  'BRAKE': 'Fren Arızası',
  'TRANSMISSION': 'Şanzıman Arızası',
  'ELECTRICAL': 'Elektrik Arızası',
  'OTHER': 'Diğer',
  // Display name formatı (İngilizce)
  'Flat Tire': 'Lastik Patlaması',
  'Battery': 'Akü Problemi',
  'Fuel': 'Yakıt Bitti',
  'Locked Out': 'Araç Kilit Açma',
  'Lockout': 'Araç Kilit Açma',
  'Engine': 'Motor Arızası',
  'Overheating': 'Motor Isınması',
  'Brake': 'Fren Arızası',
  'Transmission': 'Şanzıman Arızası',
  'Electrical': 'Elektrik Arızası',
  'Other': 'Diğer',
  'Dead Battery': 'Akü Bitti',
  'Out of Fuel': 'Yakıt Bitti',
  'Jump Start': 'Akü Takviyesi',
  'Tire Change': 'Lastik Değişimi',
  'Fuel Delivery': 'Yakıt İkmali',
  'Key Locked': 'Anahtar Kilitli Kaldı',
  'Locksmith': 'Çilingir',
  'Towing': 'Çekici',
  'Accident': 'Kaza',
};

// Araç tipi çevirisi
export const VEHICLE_TYPE_LABELS: Record<string, string> = {
  'car': 'Otomobil',
  'motorcycle': 'Motosiklet',
  'truck': 'Kamyon',
  'van': 'Minibüs',
  'suv': 'SUV',
  'pickup': 'Pikap',
  'bus': 'Otobüs',
  'minivan': 'Minivan',
  'other': 'Diğer',
  // Büyük harfli
  'CAR': 'Otomobil',
  'MOTORCYCLE': 'Motosiklet',
  'TRUCK': 'Kamyon',
  'VAN': 'Minibüs',
  'SUV': 'SUV',
  'PICKUP': 'Pikap',
  'BUS': 'Otobüs',
  'OTHER': 'Diğer',
  // Display name
  'Car': 'Otomobil',
  'Motorcycle': 'Motosiklet',
  'Truck': 'Kamyon',
  'Van': 'Minibüs',
  'Pickup': 'Pikap',
  'Bus': 'Otobüs',
  'Minivan': 'Minivan',
  'Other': 'Diğer',
};

// Hizmet tipi çevirisi
export const SERVICE_TYPE_LABELS: Record<string, string> = {
  'road_assistance': 'Yol Yardım',
  'towing': 'Çekici',
  'tire_service': 'Lastik Servisi',
  'battery_service': 'Akü Servisi',
  'fuel_delivery': 'Yakıt İkmali',
  'locksmith': 'Çilingir',
  'emergency': 'Acil Yardım',
  'other': 'Diğer',
  // Büyük harfli
  'ROAD_ASSISTANCE': 'Yol Yardım',
  'TOWING': 'Çekici',
  'TIRE_SERVICE': 'Lastik Servisi',
  'BATTERY_SERVICE': 'Akü Servisi',
  'FUEL_DELIVERY': 'Yakıt İkmali',
  'LOCKSMITH': 'Çilingir',
  'EMERGENCY': 'Acil Yardım',
  'OTHER': 'Diğer',
  // Display name
  'Road Assistance': 'Yol Yardım',
  'Towing': 'Çekici',
  'Tire Service': 'Lastik Servisi',
  'Battery Service': 'Akü Servisi',
  'Fuel Delivery': 'Yakıt İkmali',
  'Locksmith': 'Çilingir',
  'Emergency': 'Acil Yardım',
  'Other': 'Diğer',
};

// Problem tipi ikonları
export const PROBLEM_TYPE_ICONS: Record<string, string> = {
  'flat_tire': 'car-tire-alert',
  'battery': 'car-battery',
  'battery_jump': 'battery-charging',
  'fuel': 'gas-station',
  'locked_out': 'key',
  'engine': 'engine',
  'overheating': 'thermometer-alert',
  'brake': 'car-brake-alert',
  'transmission': 'cog',
  'electrical': 'flash',
  'accident': 'car-emergency',
  'towing': 'tow-truck',
  'tire_change': 'tire',
  'jump_start': 'battery-charging',
  'fuel_delivery': 'gas-station',
  'locksmith': 'key-variant',
  'winch': 'hook',
  'key_locked': 'key-remove',
  'dead_battery': 'battery-off',
  'out_of_fuel': 'gas-station-off',
  'other': 'wrench',
};

// Mesafe hesaplama (Haversine formula)
export const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return Math.round(R * c * 10) / 10;
};

// Sayı formatlama (binlik ayracı)
export const formatNumber = (num: number): string => {
  return num.toLocaleString('tr-TR', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
};

// Problem tipini label'a çevir
export const getProblemLabel = (type: string): string => {
  if (!type) return 'Belirtilmemiş';
  // Önce direkt eşleşme dene
  if (PROBLEM_TYPE_LABELS[type]) return PROBLEM_TYPE_LABELS[type];
  // Lowercase dene
  if (PROBLEM_TYPE_LABELS[type.toLowerCase()]) return PROBLEM_TYPE_LABELS[type.toLowerCase()];
  // Uppercase dene
  if (PROBLEM_TYPE_LABELS[type.toUpperCase()]) return PROBLEM_TYPE_LABELS[type.toUpperCase()];
  // Bulunamazsa orijinal değeri döndür
  return type;
};

// Problem tipinin ikonunu al
export const getProblemIcon = (type: string): string => {
  if (!type) return 'wrench';
  const lowerType = type.toLowerCase();
  return PROBLEM_TYPE_ICONS[lowerType] || PROBLEM_TYPE_ICONS[type] || 'wrench';
};

// Araç tipini label'a çevir
export const getVehicleTypeLabel = (type: string): string => {
  if (!type) return 'Belirtilmemiş';
  if (VEHICLE_TYPE_LABELS[type]) return VEHICLE_TYPE_LABELS[type];
  if (VEHICLE_TYPE_LABELS[type.toLowerCase()]) return VEHICLE_TYPE_LABELS[type.toLowerCase()];
  if (VEHICLE_TYPE_LABELS[type.toUpperCase()]) return VEHICLE_TYPE_LABELS[type.toUpperCase()];
  return type;
};

// Hizmet tipini label'a çevir
export const getServiceTypeLabel = (type: string): string => {
  if (!type) return 'Belirtilmemiş';
  if (SERVICE_TYPE_LABELS[type]) return SERVICE_TYPE_LABELS[type];
  if (SERVICE_TYPE_LABELS[type.toLowerCase()]) return SERVICE_TYPE_LABELS[type.toLowerCase()];
  if (SERVICE_TYPE_LABELS[type.toUpperCase()]) return SERVICE_TYPE_LABELS[type.toUpperCase()];
  return type;
};

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Yeni çekici araç bilgi yapısı - New tow truck info structure
export interface TowTruckInfo {
  id: string;

  // TEMEL BİLGİLER - Basic Information
  plate: string;               // Plaka - License plate
  brand: string;               // Marka - Brand
  model: string;               // Model - Model
  year: string;                // Yıl - Year
  color?: string;              // Renk - Color (backend'den geliyor; formda toplanmıyor, opsiyonel)

  // TEKNİK ÖZELLİKLER - Technical Specifications
  platformType: 'open' | 'closed' | 'flatbed'; // Platform türü - Platform type
  // 'open' = Açık Platform, 'closed' = Kapalı Kasa, 'flatbed' = Düz Platform

  // ÇEKEBİLECEĞİ ARAÇ TÜRLERİ - Supported Vehicle Types (multiple selection)
  supportedVehicleTypes: string[]; // Çoklu seçim: ['araba', 'motosiklet', 'arazi', 'ticari', 'minibus', 'tir', 'traktor']
}

// Yeni vinç araç bilgi yapısı - New crane info structure
export interface CraneInfo {
  id: string;

  // TEMEL BİLGİLER - Basic Information
  plate: string;               // Plaka - License plate
  brand: string;               // Marka - Brand
  model: string;               // Model - Model
  year: string;                // Yıl - Year
  color?: string;              // Renk - Color (backend'den geliyor; formda toplanmıyor, opsiyonel)

  // TEKNİK ÖZELLİKLER - Technical Specifications
  maxHeight: string;           // Maksimum yükseklik (m) - Maximum height in meters
}

// Nakliye araçları için interface - Transport vehicles interface (Legacy - backward compatibility)
export interface TransportInfo {
  id: string;
  plate: string; // Plaka
  brand: string; // Marka
  model: string; // Model
  year: string; // Yıl
  vehicleType: 'van' | 'small-truck' | 'truck' | 'large-truck'; // Araç tipi: kamyonet | küçük kamyon | kamyon | büyük kamyon
  capacity: string; // Yük kapasitesi (ton)
  volume: string; // Hacim kapasitesi (m³)
  length: string; // Kasa uzunluğu (m)
  width: string; // Kasa genişliği (m)
  height: string; // Kasa yüksekliği (m)
  maxWeight: string; // Maksimum yük ağırlığı (kg)
  hasLift: boolean; // Hidrolik lift var mı?
  hasRamp: boolean; // Rampa var mı?
  equipment: string[]; // Donanımlar: ['Ambalaj malzemesi', 'Koruma örtüsü', 'Taşıma askısı', vb.]
  services: string[]; // Hizmetler: ['Ev taşıma', 'Ofis taşıma', 'Paket gönderimi', 'Yük taşıma']
  pricePerKm: string; // Km başına ücret (TL)
  pricePerHour: string; // Saatlik ücret (TL)
  minPrice: string; // Minimum ücret (TL)
  hasHelper: boolean; // Yardımcı personel dahil mi?
  helperCount: string; // Yardımcı personel sayısı
  workingAreas: string[]; // Çalışma bölgeleri: ['Şehir içi', 'Şehirler arası', 'Avrupa', vb.]
}

// Yol Yardım hizmeti için interface - Road Assistance service interface
export interface RoadAssistanceInfo {
  id: string;
  // Araç bilgileri (Backend'den gelen)
  plate?: string; // Plaka
  brand?: string; // Marka
  model?: string; // Model
  year?: string; // Yıl
  // Hizmet türleri (çoklu seçim)
  services: string[]; // ['Lastik Tamiri', 'Akü Takviye', 'Yakıt İkmali', 'Çilingir', 'Yol Kenarı Arıza', 'Çekme Halatı']
  // Ücretlendirme
  pricePerService: string; // Ortalama hizmet ücreti (TL)
  pricePerKm: string; // Km başına ücret (müşteriye ulaşım) (TL)
  // Çalışma bilgileri
  workingAreas: string[]; // ['Şehir İçi', 'Şehirler Arası']
  is24Hours: boolean; // 7/24 hizmet mi?
  workingHoursStart?: string; // Çalışma başlangıç saati (7/24 değilse)
  workingHoursEnd?: string; // Çalışma bitiş saati (7/24 değilse)
}

// Nakliye Araç Tipi - Moving Vehicle Type (Backend enum)
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

// Evden Eve Nakliye için interface - Home to Home Moving interface
export interface HomeMovingInfo {
  id: string;
  // Araç bilgileri
  plate: string; // Plaka
  brand: string; // Marka
  model: string; // Model
  year: string; // Yıl
  vehicleType: 'van' | 'small-truck' | 'truck' | 'large-truck'; // Araç tipi (legacy - frontend için)
  movingVehicleType?: MovingVehicleType; // Nakliye araç tipi (backend enum)
  movingVehicleTypeDisplay?: string; // Nakliye araç tipi görüntüleme adı
  // Teknik özellikler
  capacity: string; // Yük kapasitesi (ton)
  volume: string; // Hacim kapasitesi (m³)
  length: string; // Kasa uzunluğu (m)
  width: string; // Kasa genişliği (m)
  height: string; // Kasa yüksekliği (m)
  // Özellikler
  hasLift: boolean; // Hidrolik lift var mı?
  hasRamp: boolean; // Rampa var mı?
  equipment: string[]; // Donanımlar
  // Personel
  hasHelper: boolean; // Yardımcı personel dahil mi?
  helperCount: string; // Yardımcı personel sayısı
  // Ücretlendirme (manuel teklif - referans değerler)
  pricePerKm: string; // Km başına referans ücret (TL)
  pricePerHour: string; // Saatlik referans ücret (TL)
  minPrice: string; // Minimum ücret (TL)
}

// Şehirden Şehire Nakliye için interface - City to City Moving interface
export interface CityToCityInfo {
  id: string;
  // Araç bilgileri
  plate: string; // Plaka
  brand: string; // Marka
  model: string; // Model
  year: string; // Yıl
  vehicleType: 'van' | 'small-truck' | 'truck' | 'large-truck'; // Araç tipi
  // Teknik özellikler
  capacity: string; // Yük kapasitesi (ton)
  volume: string; // Hacim kapasitesi (m³)
  length: string; // Kasa uzunluğu (m)
  width: string; // Kasa genişliği (m)
  height: string; // Kasa yüksekliği (m)
  // Özellikler
  hasLift: boolean; // Hidrolik lift var mı?
  hasRamp: boolean; // Rampa var mı?
  equipment: string[]; // Donanımlar
  // Güzergahlar
  routes: string[]; // Hizmet verilen güzergahlar: ['İstanbul-Ankara', 'İstanbul-İzmir', 'Tüm Türkiye']
  // Ücretlendirme (manuel teklif - referans değerler)
  pricePerKm: string; // Km başına referans ücret (TL)
  minPrice: string; // Minimum ücret (TL)
}

// Transfer araçları için interface
export interface TransferVehicleInfo {
  id: string;
  plate: string;
  brand: string;
  model: string;
  year: string;
  transferType: 'organization' | 'vip';
  passengerCapacity: number;
  vehicleClass: string;
}

interface VehicleStore {
  towTrucks: TowTruckInfo[];
  cranes: CraneInfo[];
  transports: TransportInfo[];
  roadAssistance: RoadAssistanceInfo[];
  homeMoving: HomeMovingInfo[];
  cityToCity: CityToCityInfo[];
  transfers: TransferVehicleInfo[];

  // Tow Truck Actions
  addTowTruck: (truck: Omit<TowTruckInfo, 'id'>) => void;
  updateTowTruck: (truck: TowTruckInfo) => void;
  removeTowTruck: (id: string) => void;

  // Crane Actions
  addCrane: (crane: Omit<CraneInfo, 'id'>) => void;
  updateCrane: (crane: CraneInfo) => void;
  removeCrane: (id: string) => void;

  // Transport Actions - Nakliye araç işlemleri (Legacy)
  addTransport: (transport: Omit<TransportInfo, 'id'>) => void;
  updateTransport: (transport: TransportInfo) => void;
  removeTransport: (id: string) => void;

  // Road Assistance Actions - Yol yardım hizmet işlemleri
  addRoadAssistance: (service: Omit<RoadAssistanceInfo, 'id'>) => void;
  updateRoadAssistance: (service: RoadAssistanceInfo) => void;
  removeRoadAssistance: (id: string) => void;

  // Home Moving Actions - Evden eve nakliye işlemleri
  addHomeMoving: (vehicle: Omit<HomeMovingInfo, 'id'>) => void;
  updateHomeMoving: (vehicle: HomeMovingInfo) => void;
  removeHomeMoving: (id: string) => void;

  // City to City Actions - Şehirden şehire nakliye işlemleri
  addCityToCity: (vehicle: Omit<CityToCityInfo, 'id'>) => void;
  updateCityToCity: (vehicle: CityToCityInfo) => void;
  removeCityToCity: (id: string) => void;

  // Transfer Actions
  addTransfer: (vehicle: TransferVehicleInfo) => void;
  updateTransfer: (vehicle: TransferVehicleInfo) => void;
  removeTransfer: (id: string) => void;

  // Utility
  clearAll: () => void;
  getAllVehicles: () => (TowTruckInfo | CraneInfo | TransportInfo | RoadAssistanceInfo | HomeMovingInfo | CityToCityInfo | TransferVehicleInfo)[];
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substr(2, 9);

export const useVehicleStore = create<VehicleStore>()(
  persist(
    (set, get) => ({
      towTrucks: [],
      cranes: [],
      transports: [], // Nakliye araçları listesi başlangıçta boş (Legacy)
      roadAssistance: [], // Yol yardım hizmetleri
      homeMoving: [], // Evden eve nakliye araçları
      cityToCity: [], // Şehirden şehire nakliye araçları

      addTowTruck: (truck) => set((state) => ({
        towTrucks: [...state.towTrucks, { ...truck, id: generateId() }]
      })),

      updateTowTruck: (truck) => set((state) => ({
        towTrucks: state.towTrucks.map((t) =>
          t.id === truck.id ? truck : t
        )
      })),

      removeTowTruck: (id) => set((state) => ({
        towTrucks: state.towTrucks.filter((truck) => truck.id !== id)
      })),

      addCrane: (crane) => set((state) => ({
        cranes: [...state.cranes, { ...crane, id: generateId() }]
      })),

      updateCrane: (crane) => set((state) => ({
        cranes: state.cranes.map((c) =>
          c.id === crane.id ? crane : c
        )
      })),

      removeCrane: (id) => set((state) => ({
        cranes: state.cranes.filter((crane) => crane.id !== id)
      })),

      // Nakliye araç işlemleri - Transport vehicle operations (Legacy)
      addTransport: (transport) => set((state) => ({
        transports: [...state.transports, { ...transport, id: generateId() }]
      })),

      updateTransport: (transport) => set((state) => ({
        transports: state.transports.map((t) =>
          t.id === transport.id ? transport : t
        )
      })),

      removeTransport: (id) => set((state) => ({
        transports: state.transports.filter((transport) => transport.id !== id)
      })),

      // Yol yardım hizmet işlemleri - Road Assistance operations
      addRoadAssistance: (service) => set((state) => ({
        roadAssistance: [...state.roadAssistance, { ...service, id: generateId() }]
      })),

      updateRoadAssistance: (service) => set((state) => ({
        roadAssistance: state.roadAssistance.map((s) =>
          s.id === service.id ? service : s
        )
      })),

      removeRoadAssistance: (id) => set((state) => ({
        roadAssistance: state.roadAssistance.filter((service) => service.id !== id)
      })),

      // Evden eve nakliye işlemleri - Home Moving operations
      addHomeMoving: (vehicle) => set((state) => ({
        homeMoving: [...state.homeMoving, { ...vehicle, id: generateId() }]
      })),

      updateHomeMoving: (vehicle) => set((state) => ({
        homeMoving: state.homeMoving.map((v) =>
          v.id === vehicle.id ? vehicle : v
        )
      })),

      removeHomeMoving: (id) => set((state) => ({
        homeMoving: state.homeMoving.filter((vehicle) => vehicle.id !== id)
      })),

      // Şehirden şehire nakliye işlemleri - City to City operations
      addCityToCity: (vehicle) => set((state) => ({
        cityToCity: [...state.cityToCity, { ...vehicle, id: generateId() }]
      })),

      updateCityToCity: (vehicle) => set((state) => ({
        cityToCity: state.cityToCity.map((v) =>
          v.id === vehicle.id ? vehicle : v
        )
      })),

      removeCityToCity: (id) => set((state) => ({
        cityToCity: state.cityToCity.filter((vehicle) => vehicle.id !== id)
      })),

      // Transfer işlemleri
      transfers: [],

      addTransfer: (vehicle) => set((state) => ({
        transfers: [...state.transfers, vehicle]
      })),

      updateTransfer: (vehicle) => set((state) => ({
        transfers: state.transfers.map((v) => v.id === vehicle.id ? vehicle : v)
      })),

      removeTransfer: (id) => set((state) => ({
        transfers: state.transfers.filter((v) => v.id !== id)
      })),

      clearAll: () => set({
        towTrucks: [],
        cranes: [],
        transports: [],
        roadAssistance: [],
        homeMoving: [],
        cityToCity: [],
        transfers: []
      }),

      getAllVehicles: () => {
        const { towTrucks, cranes, transports, roadAssistance, homeMoving, cityToCity, transfers } = get();
        return [...towTrucks, ...cranes, ...transports, ...roadAssistance, ...homeMoving, ...cityToCity, ...transfers];
      },
    }),
    {
      name: 'vehicle-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
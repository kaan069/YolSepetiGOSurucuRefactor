// Yol Yardım sabitleri ve yardımcı fonksiyonlar

import { roadProblemLabel, vehicleTypeLabel } from '../../constants/backendLabels';

// Problem tipi ikonları
export const PROBLEM_TYPE_ICONS: Record<string, string> = {
  'battery_boost': 'battery-charging',
  'minor_repair': 'wrench',
  'lockout': 'key',
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

// Problem tipini label'a çevir (çeviriler: constants/backendLabels)
export const getProblemLabel = (type: string): string => roadProblemLabel(type);

// Problem tipinin ikonunu al
export const getProblemIcon = (type: string): string => {
  if (!type) return 'wrench';
  const lowerType = type.toLowerCase();
  return PROBLEM_TYPE_ICONS[lowerType] || PROBLEM_TYPE_ICONS[type] || 'wrench';
};

// Araç tipini label'a çevir (çeviriler: constants/backendLabels)
export const getVehicleTypeLabel = (type: string): string => vehicleTypeLabel(type);

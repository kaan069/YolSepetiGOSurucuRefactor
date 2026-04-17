import { SelectOption } from '../../../components/common/SelectDropdown';
import { VehicleKind } from './types';

export const MOVING_VEHICLE_TYPE_OPTIONS: SelectOption[] = [
  { value: 'closed_truck', label: 'Kapalı Kasa Kamyon' },
  { value: 'closed_pickup', label: 'Kapalı Kasa Kamyonet' },
  { value: 'elevator_truck', label: 'Asansörlü Nakliye Aracı' },
  { value: 'panelvan', label: 'Panelvan (Kargo Van)' },
  { value: 'open_truck', label: 'Açık Kasa Kamyon' },
  { value: 'open_pickup', label: 'Açık Kasa Kamyonet' },
  { value: 'refrigerated', label: 'Frigorifik (Soğutuculu) Araç' },
  { value: 'tir', label: 'Tır' },
  { value: 'lowbed', label: 'Lowbed' },
  { value: 'partial_load', label: 'Parsiyel Yük Aracı' },
];

export const PLATFORM_TYPES = [
  { value: 'open', label: 'Açık Platform', icon: '🚛' },
  { value: 'closed', label: 'Kapalı Kasa', icon: '🚚' },
  { value: 'flatbed', label: 'Düz Platform', icon: '🛻' },
];

export const SUPPORTED_VEHICLE_TYPES = [
  { value: 'car', label: 'Araba', icon: '🚗' },
  { value: 'motorcycle', label: 'Motosiklet', icon: '🏍️' },
  { value: 'suv', label: 'Arazi Aracı', icon: '🚙' },
  { value: 'commercial', label: 'Ticari Araç', icon: '🚐' },
  { value: 'minibus', label: 'Minibüs', icon: '🚌' },
  { value: 'truck', label: 'Tır', icon: '🚚' },
  { value: 'tractor', label: 'Traktör', icon: '🚜' },
];

export const TRANSFER_VIP_VEHICLE_CLASSES: SelectOption[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Araç' },
];

export const TRANSFER_ORGANIZATION_VEHICLE_CLASSES: SelectOption[] = [
  { value: 'sedan', label: 'Sedan' },
  { value: 'vip_car', label: 'VIP Araç' },
  { value: 'minibus', label: 'Minibüs' },
  { value: 'midibus', label: 'Midibüs' },
  { value: 'bus', label: 'Otobüs' },
];

export const TRANSFER_DOCUMENT_LABELS: Record<string, string> = {
  license_photo: 'Ehliyet',
  traffic_insurance_photo: 'Trafik Sigortası',
  kasko_photo: 'Kasko',
  authority_certificate_photo: 'Yetki Belgesi',
  src_certificate_photo: 'SRC Belgesi',
  psychotechnic_report_photo: 'Psikoteknik Rapor',
  passenger_seat_insurance_photo: 'Yolcu Koltuk Sigortası',
  tourism_transport_certificate_photo: 'Turizm Taşımacılık Belgesi',
  s_plate_certificate_photo: 'S Plaka Belgesi',
  route_permit_photo: 'Güzergah İzin Belgesi',
};

export const TRANSFER_DOCUMENT_FIELDS = Object.keys(TRANSFER_DOCUMENT_LABELS);

export const VEHICLE_KINDS_WITH_PHOTO: VehicleKind[] = [
  'tow',
  'crane',
  'homeMoving',
  'roadAssistance',
  'transfer',
];

export const VEHICLE_KINDS_WITH_INSURANCE: VehicleKind[] = [
  'tow',
  'crane',
  'homeMoving',
  'roadAssistance',
];

export const VEHICLE_KIND_ICONS: Record<VehicleKind, string> = {
  tow: '🚛',
  crane: '🏗️',
  homeMoving: '🏠',
  roadAssistance: '🔧',
  transfer: '🚐',
  transport: '🚚',
};

export const VEHICLE_KIND_LABELS: Record<VehicleKind, string> = {
  tow: 'Çekici',
  crane: 'Vinç',
  homeMoving: 'Nakliye',
  roadAssistance: 'Yol Yardım',
  transfer: 'Transfer',
  transport: 'Nakliye',
};

export const PHOTO_PICKER_QUALITY = 0.3;
export const MAX_DOCUMENT_SIZE_BYTES = 5 * 1024 * 1024;
export const ALLOWED_DOCUMENT_EXTENSIONS = ['jpg', 'jpeg', 'png', 'pdf'];
export const INTERIOR_PHOTO_SLOT_COUNT = 4;

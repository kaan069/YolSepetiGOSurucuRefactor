/**
 * ARAÇ MARKA, MODEL VE YIL VERİLERİ
 *
 * Çekici, kamyon, kamyonet markaları ve modelleri
 * Register ve araç ekleme ekranlarında kullanılır
 *
 * NOT: Bu dosya kolayca güncellenebilir
 */

export interface VehicleBrand {
  value: string;
  label: string;
  models: string[];
}

/**
 * ÇEKİCİ VE KAMYON MARKALARI
 * Mercedes, MAN, Iveco, Ford Trucks, vb.
 */
export const TOW_TRUCK_BRANDS: VehicleBrand[] = [
  {
    value: 'mercedes',
    label: 'Mercedes-Benz',
    models: [
      'Actros',
      'Arocs',
      'Atego',
      'Axor',
      'Econic',
      'Sprinter',
      'Vario',
      'Zetros',
    ],
  },
  {
    value: 'man',
    label: 'MAN',
    models: [
      'TGE',
      'TGL',
      'TGM',
      'TGS',
      'TGX',
    ],
  },
  {
    value: 'iveco',
    label: 'Iveco',
    models: [
      
      'Daily',
      'Eurocargo',
      'Stralis',
      'Trakker',
      'S-Way',
    ],
  },
  {
    value: 'ford_trucks',
    label: 'Ford Trucks',
    models: [
      'Cargo',
      'F-MAX',
      'Transit',
    ],
  },
  {
    value: 'scania',
    label: 'Scania',
    models: [
      'P-Series',
      'G-Series',
      'R-Series',
      'S-Series',
    ],
  },
  {
    value: 'volvo',
    label: 'Volvo Trucks',
    models: [
      'FH',
      'FH16',
      'FM',
      'FMX',
      'FL',
    ],
  },
  {
    value: 'daf',
    label: 'DAF',
    models: [
      'LF',
      'CF',
      'XF',
    ],
  },
  {
    value: 'renault_trucks',
    label: 'Renault Trucks',
    models: [
      'Master',
      'D',
      'C',
      'K',
      'T',
    ],
  },
  {
    value: 'isuzu',
    label: 'Isuzu',
    models: [
      'NPR',
      'NQR',
      'FRR',
      'FTR',
      'FVR',
    ],
  },
  {
    value: 'mitsubishi_fuso',
    label: 'Mitsubishi Fuso',
    models: [
      'Canter',
      'Fighter',
      'Super Great',
    ],
  },
  {
    value: 'hyundai',
    label: 'Hyundai',
    models: [
      'HD35',
      'HD65',
      'HD72',
      'HD170',
      'Mighty',
      'Xcient',
    ],
  },
  {
    value: 'bmc',
    label: 'BMC',
    models: [
      'Levend',
      'Tugra',
      'Pro',
      'Fatih',
    ],
  },
  {
    value: 'temsa',
    label: 'Temsa',
    models: [
      'Maraton',
      'MD9',
      'MD7',
      'Avenue',
    ],
  },
  {
    value: 'other',
    label: 'Diğer',
    models: ['Diğer'],
  },
];

/**
 * MOBİL VİNÇ MARKALARI (Mobile Crane)
 * Liebherr, Tadano, Grove, Terex, XCMG, Zoomlion, Sany vb.
 */
export const CRANE_BRANDS: VehicleBrand[] = [
  {
    value: 'liebherr',
    label: 'Liebherr',
    models: [
      // LTM Serisi (All Terrain)
      'LTM 1030-2.1',
      'LTM 1040-2.1',
      'LTM 1050-3.1',
      'LTM 1055-3.2',
      'LTM 1060-3.1',
      'LTM 1070-4.2',
      'LTM 1090-4.2',
      'LTM 1100-4.2',
      'LTM 1110-5.1',
      'LTM 1120-4.1',
      'LTM 1130-5.1',
      'LTM 1150-5.3',
      'LTM 1160-5.2',
      'LTM 1200-5.1',
      'LTM 1220-5.2',
      'LTM 1230-5.1',
      'LTM 1250-5.1',
      'LTM 1300-6.2',
      'LTM 1350-6.1',
      'LTM 1450-8.1',
      'LTM 1500-8.1',
      'LTM 1650-8.1',
      'LTM 1750-9.1',
      'LTM 11200-9.1',
      // LTF Serisi (Mobil Teleskopik)
      'LTF 1030-4.1',
      'LTF 1035-3.1',
      'LTF 1045-4.1',
      // LTC Serisi (Compact)
      'LTC 1045-3.1',
      'LTC 1050-3.1',
      // MK Serisi (Mobil Kule)
      'MK 88',
      'MK 100',
      'MK 110',
      'MK 140',
    ],
  },
  {
    value: 'tadano',
    label: 'Tadano',
    models: [
      // ATF Serisi (All Terrain)
      'ATF 40G-2',
      'ATF 50G-3',
      'ATF 60G-3',
      'ATF 70G-4',
      'ATF 80G-4',
      'ATF 90G-4',
      'ATF 100G-4',
      'ATF 110G-5',
      'ATF 130G-5',
      'ATF 160G-5',
      'ATF 180G-5',
      'ATF 200G-5',
      'ATF 220G-5',
      'ATF 400G-6',
      'ATF 600G-8',
      // GR Serisi (Rough Terrain)
      'GR-150XL',
      'GR-200N',
      'GR-250N',
      'GR-300EX',
      'GR-350XL',
      'GR-500EX',
      'GR-600EX',
      'GR-800EX',
      'GR-1000EX',
      // GT Serisi (Truck Crane)
      'GT-300EL',
      'GT-350E',
      'GT-400E',
      'GT-500E',
      'GT-550E',
      'GT-600E',
      'GT-750EL',
      // TR Serisi (Rough Terrain)
      'TR-160M',
      'TR-200M',
      'TR-250M',
      'TR-300M',
    ],
  },
  {
    value: 'grove',
    label: 'Grove',
    models: [
      // GMK Serisi (All Terrain)
      'GMK 2035',
      'GMK 3050',
      'GMK 3055',
      'GMK 3060',
      'GMK 3060L',
      'GMK 4080-1',
      'GMK 4090',
      'GMK 4100L-1',
      'GMK 5095',
      'GMK 5110-1',
      'GMK 5120B',
      'GMK 5130-2',
      'GMK 5150-1',
      'GMK 5150L',
      'GMK 5180-1',
      'GMK 5200-1',
      'GMK 5220',
      'GMK 5250L',
      'GMK 5250XL-1',
      'GMK 5300L',
      'GMK 6300L',
      'GMK 6400',
      // GRT Serisi (Rough Terrain)
      'GRT 655',
      'GRT 765',
      'GRT 880',
      'GRT 8100',
      'GRT 9165',
      // TMS Serisi (Truck Mounted)
      'TMS 500E',
      'TMS 700E',
      'TMS 800E',
      'TMS 900E',
    ],
  },
  {
    value: 'terex',
    label: 'Terex',
    models: [
      // AC Serisi (All Terrain)
      'AC 40/2',
      'AC 55/1',
      'AC 60/3',
      'AC 80/2',
      'AC 100/4L',
      'AC 130-5',
      'AC 160-5',
      'AC 200-1',
      'AC 250-1',
      'AC 350-1',
      'AC 350/6',
      'AC 500-2',
      'AC 700',
      'AC 1000',
      // RT Serisi (Rough Terrain)
      'RT 35',
      'RT 45',
      'RT 55',
      'RT 100',
      'RT 130',
      // Explorer Serisi
      'Explorer 5500',
      'Explorer 5600',
      'Explorer 5800',
    ],
  },
  {
    value: 'xcmg',
    label: 'XCMG',
    models: [
      // QY Serisi (Truck Crane)
      'QY8',
      'QY12',
      'QY16',
      'QY20',
      'QY25K5',
      'QY30K5',
      'QY35K5',
      'QY50K',
      'QY55K',
      'QY70K',
      'QY80K',
      'QY100K',
      'QY130K',
      'QY160K',
      'QY200K',
      'QY250K',
      'QY300K',
      'QY350K',
      'QY400K',
      'QY500K',
      'QY650',
      'QY800',
      'QY1000',
      'QY1200',
      'QY1600',
      'QY2000',
      // XCA Serisi (All Terrain)
      'XCA60',
      'XCA100',
      'XCA130',
      'XCA220',
      'XCA300',
      'XCA450',
      'XCA550',
      'XCA1200',
      'XCA1600',
      'XCA2600',
      // RT Serisi (Rough Terrain)
      'RT25',
      'RT35',
      'RT50',
      'RT60',
      'RT80',
      'RT100',
    ],
  },
  {
    value: 'zoomlion',
    label: 'Zoomlion',
    models: [
      // QY Serisi (Truck Crane)
      'QY12',
      'QY16',
      'QY20',
      'QY25V',
      'QY30V',
      'QY35V',
      'QY50V',
      'QY55V',
      'QY70V',
      'QY80V',
      'QY100V',
      'QY130V',
      'QY160V',
      'QY200V',
      'QY260V',
      'QY300V',
      'QY350V',
      'QY400V',
      'QY500V',
      'QY650V',
      'QY800V',
      // ZAT Serisi (All Terrain)
      'ZAT600',
      'ZAT800',
      'ZAT1000',
      'ZAT1300',
      'ZAT1600',
      'ZAT2200',
      'ZAT2600',
      'ZAT3200',
      // ZRT Serisi (Rough Terrain)
      'ZRT25',
      'ZRT35',
      'ZRT50',
      'ZRT60',
      'ZRT80',
      'ZRT100',
    ],
  },
  {
    value: 'sany',
    label: 'Sany',
    models: [
      // STC Serisi (Truck Crane)
      'STC160',
      'STC200',
      'STC250',
      'STC300',
      'STC350',
      'STC400',
      'STC500',
      'STC550',
      'STC600',
      'STC750',
      'STC800',
      'STC1000',
      'STC1250',
      'STC1600',
      'STC2000',
      'STC2200',
      // SAC Serisi (All Terrain)
      'SAC600',
      'SAC800',
      'SAC1000',
      'SAC1100',
      'SAC1300',
      'SAC1600',
      'SAC2200',
      'SAC2600',
      'SAC3000',
      'SAC3500',
      // SRC Serisi (Rough Terrain)
      'SRC250',
      'SRC350',
      'SRC450',
      'SRC550',
      'SRC600',
      'SRC750',
      'SRC865',
    ],
  },
  {
    value: 'manitowoc',
    label: 'Manitowoc',
    models: [
      // Grove modelleri yukarda
      // Manitowoc Crawler
      '999',
      '2250',
      '8500-1',
      '11000-1',
      '12000',
      '14000',
      '16000',
      '18000',
      '21000',
      '31000',
      // MLC Serisi
      'MLC100',
      'MLC150',
      'MLC300',
      'MLC650',
    ],
  },
  {
    value: 'demag',
    label: 'Demag',
    models: [
      // AC Serisi (All Terrain)
      'AC 40-2',
      'AC 45 City',
      'AC 55-3',
      'AC 60-3',
      'AC 80-4',
      'AC 100-4',
      'AC 100-4L',
      'AC 130-5',
      'AC 160-5',
      'AC 220-5',
      'AC 250-5',
      'AC 300-6',
      'AC 350-6',
      'AC 500-1',
      'AC 500-2',
      'AC 700-9',
      'AC 1000-9',
      // CC Serisi (Crawler)
      'CC 1100',
      'CC 1400',
      'CC 1500',
      'CC 2000',
      'CC 2500',
      'CC 2800-1',
      'CC 3800',
      'CC 6800',
      'CC 8800',
    ],
  },
  {
    value: 'kobelco',
    label: 'Kobelco',
    models: [
      // CKE Serisi (Crawler)
      'CKE600',
      'CKE700',
      'CKE900',
      'CKE1100',
      'CKE1350',
      'CKE1500',
      'CKE1800',
      'CKE2000',
      'CKE2500',
      'CKE3000',
      'CKE4000',
      // SL Serisi
      'SL4500',
      'SL6000',
      'SL7000',
      'SL9000',
      'SL13000',
      'SL16000',
    ],
  },
  {
    value: 'link_belt',
    label: 'Link-Belt',
    models: [
      // ATC Serisi (All Terrain)
      'ATC-3200',
      'ATC-3250',
      // HTC Serisi (Hydraulic Truck Crane)
      'HTC-3140',
      'HTC-3150',
      'HTC-8650',
      'HTC-86100',
      'HTC-86110',
      // RTC Serisi (Rough Terrain)
      'RTC-8030',
      'RTC-8050',
      'RTC-8065',
      'RTC-8080',
      'RTC-80100',
      'RTC-80130',
      'RTC-80150',
      // TCC Serisi (Telescopic Crawler)
      'TCC-500',
      'TCC-750',
      'TCC-1000',
      'TCC-1100',
      'TCC-1400',
      'TCC-2500',
    ],
  },
  {
    value: 'kato',
    label: 'Kato',
    models: [
      // NK Serisi (Truck Crane)
      'NK-200H',
      'NK-250H',
      'NK-300H',
      'NK-350H',
      'NK-400H',
      'NK-500H',
      'NK-550VR',
      'NK-600',
      'NK-750',
      'NK-800',
      'NK-1000',
      'NK-1200',
      // CR Serisi (City Crane)
      'CR-100',
      'CR-130',
      'CR-200',
      'CR-250',
      // SR Serisi (Rough Terrain)
      'SR-250',
      'SR-300',
      'SR-500',
      'SR-700',
    ],
  },
  {
    value: 'palfinger',
    label: 'Palfinger',
    models: [
      // PK Serisi (Knuckle Boom)
      'PK 6500',
      'PK 8500',
      'PK 10500',
      'PK 12000',
      'PK 15500',
      'PK 18500',
      'PK 21000',
      'PK 23500',
      'PK 27000',
      'PK 32000',
      'PK 36000',
      'PK 42502',
      'PK 53002',
      'PK 65002',
      'PK 78002',
      'PK 88002',
      'PK 92002',
      'PK 100002',
      'PK 135002',
      'PK 150002',
      'PK 200002',
    ],
  },
  {
    value: 'hiab',
    label: 'Hiab',
    models: [
      // X-HiPro Serisi
      'X-HiPro 142',
      'X-HiPro 192',
      'X-HiPro 232',
      'X-HiPro 302',
      'X-HiPro 408',
      'X-HiPro 548',
      'X-HiPro 638',
      // XS Serisi
      'XS 099',
      'XS 111',
      'XS 122',
      'XS 144',
      'XS 166',
      'XS 211',
      'XS 244',
      'XS 288',
      'XS 322',
      'XS 377',
      'XS 422',
      'XS 477',
      'XS 622',
      'XS 800',
      'XS 1055',
    ],
  },
  {
    value: 'pm',
    label: 'PM',
    models: [
      // Serisi
      'PM 7',
      'PM 8',
      'PM 10',
      'PM 12',
      'PM 14',
      'PM 16',
      'PM 18',
      'PM 21',
      'PM 25',
      'PM 28',
      'PM 32',
      'PM 36',
      'PM 40',
      'PM 47',
      'PM 55',
      'PM 65',
      'PM 85',
      'PM 100',
    ],
  },
  {
    value: 'fassi',
    label: 'Fassi',
    models: [
      // F Serisi
      'F65A',
      'F85A',
      'F110A',
      'F130A',
      'F155A',
      'F175A',
      'F195A',
      'F215A',
      'F235A',
      'F275A',
      'F315A',
      'F365A',
      'F415A',
      'F485A',
      'F545A',
      'F660AXP',
      'F820AXP',
      'F990AXP',
      'F1150AXP',
      'F1300AXP',
      'F1500AXP',
    ],
  },
  {
    value: 'other',
    label: 'Diger',
    models: ['Diger'],
  },
];

/**
 * NAKLIYE ARAÇLARI (Kamyonet, Panelvan)
 */
export const TRANSPORT_VEHICLE_BRANDS: VehicleBrand[] = [
  {
    value: 'ford',
    label: 'Ford',
    models: [
      'Transit',
      'Transit Custom',
      'Transit Connect',
      'Ranger',
    ],
  },
  {
    value: 'mercedes',
    label: 'Mercedes-Benz',
    models: [
      'Sprinter',
      'Vito',
      'Citan',
      'X-Class',
    ],
  },
  {
    value: 'volkswagen',
    label: 'Volkswagen',
    models: [
      'Transporter',
      'Crafter',
      'Caddy',
      'Amarok',
    ],
  },
  {
    value: 'fiat',
    label: 'Fiat',
    models: [
      'Ducato',
      'Doblo',
      'Fiorino',
      'Talento',
    ],
  },
  {
    value: 'renault',
    label: 'Renault',
    models: [
      'Master',
      'Trafic',
      'Kangoo',
    ],
  },
  {
    value: 'peugeot',
    label: 'Peugeot',
    models: [
      'Boxer',
      'Expert',
      'Partner',
    ],
  },
  {
    value: 'citroen',
    label: 'Citroën',
    models: [
      'Jumper',
      'Jumpy',
      'Berlingo',
    ],
  },
  {
    value: 'toyota',
    label: 'Toyota',
    models: [
      'Hilux',
      'Proace',
      'Proace City',
    ],
  },
  {
    value: 'nissan',
    label: 'Nissan',
    models: [
      'Navara',
      'NV400',
      'NV300',
      'NV200',
    ],
  },
  {
    value: 'iveco',
    label: 'Iveco',
    models: [
      'Daily',
    ],
  },
  {
    value: 'hyundai',
    label: 'Hyundai',
    models: [
      'H350',
      'H100',
    ],
  },
  {
    value: 'mitsubishi',
    label: 'Mitsubishi',
    models: [
      'L200',
    ],
  },
  {
    value: 'isuzu',
    label: 'Isuzu',
    models: [
      'D-Max',
    ],
  },
  {
    value: 'other',
    label: 'Diğer',
    models: ['Diğer'],
  },
];

/**
 * YIL LİSTESİ (1980 - Şu anki yıl)
 * Dinamik olarak oluşturulur
 */
export const getVehicleYears = (): number[] => {
  const currentYear = new Date().getFullYear();
  const startYear = 1980;
  const years: number[] = [];

  // En yeni yıldan başlayarak 1980'e kadar
  for (let year = currentYear; year >= startYear; year--) {
    years.push(year);
  }

  return years;
};

/**
 * Helper: Marka value'suna göre modelleri getir
 */
export const getModelsByBrand = (brandValue: string, vehicleType: 'tow_truck' | 'crane' | 'transport'): string[] => {
  let brands: VehicleBrand[] = [];

  switch (vehicleType) {
    case 'tow_truck':
      brands = TOW_TRUCK_BRANDS;
      break;
    case 'crane':
      brands = CRANE_BRANDS;
      break;
    case 'transport':
      brands = TRANSPORT_VEHICLE_BRANDS;
      break;
  }

  const brand = brands.find(b => b.value === brandValue);
  return brand?.models || [];
};

import {
  CompletedJob,
  PeriodRange,
  PERIOD_LABELS,
  SERVICE_TYPE_LABELS_PLAIN,
  formatMoney,
  formatDate,
} from '../constants';
import { SERVICE_LABEL, SERVICE_EMOJI } from '../../../constants/serviceTypeUI';

// Rapor başlıkları — canonical label kaynağından türetilir.
// PLAIN map diakritik-siz olduğundan raporun ASCII-safe yapısını korur.
// Nakliye group için canonical `SERVICE_LABEL.nakliye` === 'Nakliye' (diakritiksiz) güvenle kullanılır.
const REPORT_SECTION_SUFFIX = ' Hizmetleri';

const REPORT_LABELS = {
  towTruck: SERVICE_TYPE_LABELS_PLAIN.towTruck,
  crane: SERVICE_TYPE_LABELS_PLAIN.crane,
  roadAssistance: SERVICE_TYPE_LABELS_PLAIN.roadAssistance,
  nakliye: SERVICE_LABEL.nakliye,
} as const;

const REPORT_SECTION_TITLES = {
  towTruck: `${REPORT_LABELS.towTruck}${REPORT_SECTION_SUFFIX}`,
  crane: `${REPORT_LABELS.crane}${REPORT_SECTION_SUFFIX}`,
  roadAssistance: `${REPORT_LABELS.roadAssistance}${REPORT_SECTION_SUFFIX}`,
  nakliye: `${REPORT_LABELS.nakliye}${REPORT_SECTION_SUFFIX}`,
} as const;

const REPORT_SECTION_EMOJIS = {
  towTruck: SERVICE_EMOJI.towTruck,
  crane: SERVICE_EMOJI.crane,
  roadAssistance: SERVICE_EMOJI.roadAssistance,
  nakliye: SERVICE_EMOJI.nakliye,
} as const;

// İşleri hizmet türüne göre grupla
function groupJobs(jobs: CompletedJob[]) {
  const towTruck = jobs.filter(j => j.serviceType === 'towTruck');
  const crane = jobs.filter(j => j.serviceType === 'crane');
  const roadAssistance = jobs.filter(j => j.serviceType === 'roadAssistance');
  const homeMoving = jobs.filter(j => j.serviceType === 'homeMoving' || j.serviceType === 'homeToHomeMoving');
  const cityMoving = jobs.filter(j => j.serviceType === 'cityMoving' || j.serviceType === 'cityToCity');
  const nakliye = [...homeMoving, ...cityMoving];

  const getTotal = (list: CompletedJob[]) => list.reduce((sum, j) => sum + j.amount, 0);

  return {
    towTruck, crane, roadAssistance, nakliye,
    towTruckTotal: getTotal(towTruck),
    craneTotal: getTotal(crane),
    roadAssistanceTotal: getTotal(roadAssistance),
    nakliyeTotal: getTotal(nakliye),
    totalAmount: getTotal(jobs),
  };
}

// Profesyonel rapor - çerçeveli format
export function generateTextReport(jobs: CompletedJob[], range: PeriodRange): string {
  const g = groupJobs(jobs);
  const reportDate = formatDate(new Date().toISOString());

  let r = '';

  // Header
  r += `╔════════════════════════════════════════════════════════╗\n`;
  r += `║                                        ╭───────────╮  ║\n`;
  r += `║      KAZANC RAPORU                     │ YOLYARDIM │  ║\n`;
  r += `║                                        ╰───────────╯  ║\n`;
  r += `╠════════════════════════════════════════════════════════╣\n`;
  r += `║  Rapor Tarihi: ${reportDate.padEnd(40)}║\n`;
  r += `║  Donem: ${PERIOD_LABELS[range].padEnd(47)}║\n`;
  r += `╚════════════════════════════════════════════════════════╝\n\n`;

  // Özet
  r += `┌──────────────────────────────────────────────────────────┐\n`;
  r += `│                      GENEL OZET                         │\n`;
  r += `├──────────────────────────────────────────────────────────┤\n`;
  r += `│  Toplam Kazanc:              ${formatMoney(g.totalAmount).padStart(15)} TL       │\n`;
  r += `│  Toplam Is Sayisi:           ${String(jobs.length).padStart(15)} adet     │\n`;
  if (jobs.length > 0) {
    r += `│  Ortalama Kazanc:            ${formatMoney(g.totalAmount / jobs.length).padStart(15)} TL       │\n`;
  }
  r += `└──────────────────────────────────────────────────────────┘\n\n`;

  // Hizmet bazlı özet
  r += `┌──────────────────────────────────────────────────────────┐\n`;
  r += `│                   HIZMET BAZLI OZET                      │\n`;
  r += `├──────────────────────────────────────────────────────────┤\n`;
  if (g.towTruck.length > 0) r += `│  ${(REPORT_LABELS.towTruck + ':').padEnd(15)} ${String(g.towTruck.length).padStart(3)} is    ${formatMoney(g.towTruckTotal).padStart(15)} TL       │\n`;
  if (g.crane.length > 0) r += `│  ${(REPORT_LABELS.crane + ':').padEnd(15)} ${String(g.crane.length).padStart(3)} is    ${formatMoney(g.craneTotal).padStart(15)} TL       │\n`;
  if (g.roadAssistance.length > 0) r += `│  ${(REPORT_LABELS.roadAssistance + ':').padEnd(15)} ${String(g.roadAssistance.length).padStart(3)} is    ${formatMoney(g.roadAssistanceTotal).padStart(15)} TL       │\n`;
  if (g.nakliye.length > 0) r += `│  ${(REPORT_LABELS.nakliye + ':').padEnd(15)} ${String(g.nakliye.length).padStart(3)} is    ${formatMoney(g.nakliyeTotal).padStart(15)} TL       │\n`;
  r += `└──────────────────────────────────────────────────────────┘\n\n`;

  // Detay bölümleri
  const addSection = (title: string, emoji: string, sectionJobs: CompletedJob[], total: number) => {
    if (sectionJobs.length === 0) return '';
    let s = '';
    s += `╔══════════════════════════════════════════════════════════╗\n`;
    s += `║  ${emoji} ${title.toUpperCase().padEnd(52)}║\n`;
    s += `╠══════════════════════════════════════════════════════════╣\n`;
    sectionJobs.forEach((job, i) => {
      s += `║  ${String(i + 1).padStart(2)}. Tarih: ${formatDate(job.finishedAt).padEnd(44)}║\n`;
      if (job.pickupAddress) {
        const addr = job.pickupAddress.length > 45 ? job.pickupAddress.substring(0, 42) + '...' : job.pickupAddress;
        s += `║      Alis: ${addr.padEnd(46)}║\n`;
      }
      if (job.dropoffAddress) {
        const addr = job.dropoffAddress.length > 45 ? job.dropoffAddress.substring(0, 42) + '...' : job.dropoffAddress;
        s += `║      Teslim: ${addr.padEnd(44)}║\n`;
      }
      if (job.distanceKm && job.distanceKm > 0) {
        s += `║      Mesafe: ${(job.distanceKm.toFixed(1) + ' km').padEnd(44)}║\n`;
      }
      s += `║      Kazanc: ${(formatMoney(job.amount) + ' TL').padEnd(44)}║\n`;
      if (i < sectionJobs.length - 1) s += `║  ─────────────────────────────────────────────────────   ║\n`;
    });
    s += `╠══════════════════════════════════════════════════════════╣\n`;
    s += `║  BOLUM TOPLAMI: ${(formatMoney(total) + ' TL').padEnd(41)}║\n`;
    s += `╚══════════════════════════════════════════════════════════╝\n\n`;
    return s;
  };

  r += addSection(REPORT_SECTION_TITLES.towTruck, REPORT_SECTION_EMOJIS.towTruck, g.towTruck, g.towTruckTotal);
  r += addSection(REPORT_SECTION_TITLES.crane, REPORT_SECTION_EMOJIS.crane, g.crane, g.craneTotal);
  r += addSection(REPORT_SECTION_TITLES.roadAssistance, REPORT_SECTION_EMOJIS.roadAssistance, g.roadAssistance, g.roadAssistanceTotal);
  r += addSection(REPORT_SECTION_TITLES.nakliye, REPORT_SECTION_EMOJIS.nakliye, g.nakliye, g.nakliyeTotal);

  // Footer
  r += `╔══════════════════════════════════════════════════════════╗\n`;
  r += `║                    GENEL TOPLAM                          ║\n`;
  r += `╠══════════════════════════════════════════════════════════╣\n`;
  r += `║         ${formatMoney(g.totalAmount)} TL                              ║\n`;
  r += `╚══════════════════════════════════════════════════════════╝\n\n`;
  r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;
  r += `  Bu rapor YolYardim uygulamasi tarafindan olusturulmustur.\n`;
  r += `  www.yolyardim.com | Destek: 0850 XXX XX XX\n`;
  r += `━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n`;

  return r;
}

// Tablo formatli rapor
export function generateDetailedReport(jobs: CompletedJob[], range: PeriodRange): string {
  const g = groupJobs(jobs);
  const reportDate = formatDate(new Date().toISOString());

  let r = '';

  r += `                                                    YOLYARDIM\n`;
  r += `                                                    ─────────\n\n`;
  r += `                         KAZANC RAPORU\n`;
  r += `═══════════════════════════════════════════════════════════════\n\n`;
  r += `Rapor Tarihi: ${reportDate}\nDonem: ${PERIOD_LABELS[range]}\n\n`;

  // Özet tablo
  r += `OZET BILGILER\n`;
  r += `───────────────────────────────────────────────────────────────\n`;
  r += `Hizmet Turu          Is Sayisi        Toplam Kazanc\n`;
  r += `───────────────────────────────────────────────────────────────\n`;
  if (g.towTruck.length > 0) r += `${REPORT_LABELS.towTruck.padEnd(21)}${String(g.towTruck.length).padStart(5)}            ${formatMoney(g.towTruckTotal).padStart(15)} TL\n`;
  if (g.crane.length > 0) r += `${REPORT_LABELS.crane.padEnd(21)}${String(g.crane.length).padStart(5)}            ${formatMoney(g.craneTotal).padStart(15)} TL\n`;
  if (g.roadAssistance.length > 0) r += `${REPORT_LABELS.roadAssistance.padEnd(21)}${String(g.roadAssistance.length).padStart(5)}            ${formatMoney(g.roadAssistanceTotal).padStart(15)} TL\n`;
  if (g.nakliye.length > 0) r += `${REPORT_LABELS.nakliye.padEnd(21)}${String(g.nakliye.length).padStart(5)}            ${formatMoney(g.nakliyeTotal).padStart(15)} TL\n`;
  r += `───────────────────────────────────────────────────────────────\n`;
  r += `TOPLAM               ${String(jobs.length).padStart(5)}            ${formatMoney(g.totalAmount).padStart(15)} TL\n`;
  r += `═══════════════════════════════════════════════════════════════\n\n`;

  // Detay tabloları
  const addTable = (title: string, sectionJobs: CompletedJob[]) => {
    if (sectionJobs.length === 0) return '';
    let s = `\n${title.toUpperCase()}\n`;
    s += `───────────────────────────────────────────────────────────────\n`;
    s += `No  Tarih              Mesafe      Kazanc\n`;
    s += `───────────────────────────────────────────────────────────────\n`;
    sectionJobs.forEach((job, i) => {
      const dateStr = formatDate(job.finishedAt).substring(0, 16);
      const distance = job.distanceKm ? `${job.distanceKm.toFixed(1)} km` : '-';
      s += `${String(i + 1).padStart(2)}  ${dateStr.padEnd(18)} ${distance.padStart(8)}  ${formatMoney(job.amount).padStart(12)} TL\n`;
    });
    const total = sectionJobs.reduce((sum, j) => sum + j.amount, 0);
    s += `───────────────────────────────────────────────────────────────\n`;
    s += `    Alt Toplam:                         ${formatMoney(total).padStart(12)} TL\n\n`;
    return s;
  };

  r += addTable(REPORT_SECTION_TITLES.towTruck, g.towTruck);
  r += addTable(REPORT_SECTION_TITLES.crane, g.crane);
  r += addTable(REPORT_SECTION_TITLES.roadAssistance, g.roadAssistance);
  r += addTable(REPORT_SECTION_TITLES.nakliye, g.nakliye);

  r += `\n═══════════════════════════════════════════════════════════════\n`;
  r += `                    GENEL TOPLAM: ${formatMoney(g.totalAmount)} TL\n`;
  r += `═══════════════════════════════════════════════════════════════\n\n`;
  r += `Bu rapor YolYardim uygulamasi tarafindan otomatik olusturulmustur.\nwww.yolyardim.com\n`;

  return r;
}

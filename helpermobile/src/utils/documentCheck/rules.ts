/**
 * Belge doğrulama kuralları (saf mantık, native bağımlılık yok).
 *
 * Seçilen dosyadan okunan yazıda belgeye özgü ifadeler aranır. Amaç kesin doğrulama
 * değil, bariz yanlışları yakalamak: ehliyet alanına araç fotoğrafı, sigorta alanına
 * vergi levhası gibi. Uyarı çıkan dosya yüklenmez; sürücü başka dosya seçer ya da
 * WhatsApp destek hattına yazar.
 */

export type DocumentKind =
  | 'driver_license'
  | 'tax_plate'
  | 'k_document'
  | 'vehicle_insurance'
  | 'traffic_insurance'
  | 'kasko'
  | 'authority_certificate'
  | 'src_certificate'
  | 'psychotechnic'
  | 'passenger_seat_insurance'
  | 'tourism_certificate'
  | 's_plate_certificate'
  | 'route_permit'
  | 'vehicle_photo';

export interface DocumentWarning {
  title: string;
  message: string;
}

type Keyword = string | RegExp;

interface Rule {
  /** Belgenin adı: "dosyanın ___ olduğunu doğrulayamadık" */
  name: string;
  /** "Bu alana ___ yüklemelisiniz" */
  expected: string;
  /** Bu belgeye özgü ifadeler (katlanmış: büyük harf, Türkçe karaktersiz) */
  keywords: Keyword[];
  /**
   * true: kendi ifadelerinden biri bulunmazsa uyarılır.
   * false: ifadeleri kesin bilinmeyen belgeler; sadece yazı yoksa ya da başka bir
   * belgeye benziyorsa uyarılır.
   */
  strict: boolean;
}

const RULES: Record<Exclude<DocumentKind, 'vehicle_photo'>, Rule> = {
  driver_license: {
    name: 'ehliyet', expected: 'ehliyetinizi',
    keywords: ['SURUCU BELGESI', 'DRIVING LICENCE', 'DRIVING LICENSE'],
    strict: true,
  },
  tax_plate: {
    name: 'vergi levhası', expected: 'vergi levhanızı',
    // "VERGİ KİMLİK NO" poliçelerde de geçtiği için ayırt edici değil
    keywords: ['VERGI LEVHASI', 'GELIR IDARESI'],
    strict: true,
  },
  k_document: { name: 'K belgesi', expected: 'K belgenizi', keywords: ['YETKI BELGESI'], strict: true },
  vehicle_insurance: {
    name: 'sigorta poliçesi', expected: 'sigorta poliçenizi',
    keywords: ['POLICE', 'SIGORTA', 'KASKO', 'TRAFIK'],
    strict: true,
  },
  traffic_insurance: {
    name: 'trafik sigortası poliçesi', expected: 'trafik sigortası poliçenizi',
    keywords: ['TRAFIK', 'ZORUNLU MALI SORUMLULUK'],
    strict: true,
  },
  kasko: { name: 'kasko poliçesi', expected: 'kasko poliçenizi', keywords: ['KASKO'], strict: true },
  authority_certificate: { name: 'yetki belgesi', expected: 'yetki belgenizi', keywords: ['YETKI BELGESI'], strict: true },
  src_certificate: {
    name: 'SRC belgesi', expected: 'SRC belgenizi',
    keywords: [/\bSRC ?[1-5]?\b/, 'MESLEKI YETERLILIK'],
    strict: true,
  },
  psychotechnic: { name: 'psikoteknik rapor', expected: 'psikoteknik raporunuzu', keywords: ['PSIKOTEKNIK'], strict: true },
  passenger_seat_insurance: {
    name: 'yolcu koltuk sigortası poliçesi', expected: 'yolcu koltuk sigortası poliçenizi',
    keywords: ['KOLTUK'],
    strict: true,
  },
  tourism_certificate: { name: 'turizm taşımacılık belgesi', expected: 'turizm taşımacılık belgenizi', keywords: ['TURIZM'], strict: false },
  s_plate_certificate: { name: 'S plaka belgesi', expected: 'S plaka belgenizi', keywords: [], strict: false },
  route_permit: { name: 'güzergah izin belgesi', expected: 'güzergah izin belgenizi', keywords: ['GUZERGAH'], strict: false },
};

/**
 * "Bu dosya ___ gibi görünüyor" için tanınan belgeler, öncelik sırasıyla.
 * Sadece ayırt edici ifadeleri olanlar (yanlış alarm vermesin diye).
 */
const RECOGNIZABLE: { label: string; keywords: Keyword[] }[] = [
  { label: 'ehliyet', keywords: RULES.driver_license.keywords },
  { label: 'vergi levhası', keywords: RULES.tax_plate.keywords },
  { label: 'yetki belgesi (K, D2 vb.)', keywords: ['YETKI BELGESI'] },
  { label: 'psikoteknik rapor', keywords: RULES.psychotechnic.keywords },
  { label: 'sigorta poliçesi', keywords: ['POLICE', 'SIGORTA', 'KASKO'] },
];

/** Bundan az yazı varsa görsel belge değil (araç fotoğrafı vb.) sayılır */
const MIN_DOCUMENT_TEXT_LENGTH = 15;

const TR_MAP: Record<string, string> = {
  ç: 'C', Ç: 'C', ğ: 'G', Ğ: 'G', ı: 'I', İ: 'I', ö: 'O', Ö: 'O', ş: 'S', Ş: 'S', ü: 'U', Ü: 'U',
  â: 'A', Â: 'A', î: 'I', Î: 'I', û: 'U', Û: 'U',
};

/** Büyük harf, Türkçe karaktersiz, sadece harf/rakam ve tek boşluk. OCR "SURUCU" okusa da eşleşir. */
export function foldText(text: string): string {
  return text
    .replace(/[çÇğĞıİöÖşŞüÜâÂîÎûÛ]/g, (ch) => TR_MAP[ch] ?? ch)
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, ' ')
    .trim();
}

function matches(folded: string, keyword: Keyword): boolean {
  if (keyword instanceof RegExp) return keyword.test(folded);
  return ` ${folded} `.includes(` ${foldText(keyword)} `);
}

function matchesAny(folded: string, keywords: Keyword[]): boolean {
  return keywords.some((k) => matches(folded, k));
}

function recognize(folded: string): string | null {
  return RECOGNIZABLE.find((r) => matchesAny(folded, r.keywords))?.label ?? null;
}

const WRONG_DOC_TAIL = 'Doğru belgeyi yükleyemiyorsanız WhatsApp destek hattımıza yazabilirsiniz.';

/** Belgenin adı (destek mesajı vb. için) */
export function getDocumentName(kind: DocumentKind): string {
  return kind === 'vehicle_photo' ? 'araç fotoğrafı' : RULES[kind].name;
}

/**
 * Okunan yazıya göre uyarı üretir; sorun yoksa null.
 * @param text OCR çıktısı (satırlar birleştirilmiş)
 */
export function evaluateDocumentText(text: string, kind: DocumentKind): DocumentWarning | null {
  const folded = foldText(text);

  // Araç fotoğrafı: ters kontrol — belge yazısı çıkarsa yanlış alan
  if (kind === 'vehicle_photo') {
    const looksLike = recognize(folded);
    if (!looksLike) return null;
    return {
      title: 'Yanlış Görsel Olabilir',
      message: `Bu alana aracın plakası görünür fotoğrafını yüklemelisiniz, ancak seçtiğiniz görsel ${looksLike} gibi görünüyor. ${WRONG_DOC_TAIL}`,
    };
  }

  const rule = RULES[kind];
  if (matchesAny(folded, rule.keywords)) return null;

  if (folded.replace(/ /g, '').length < MIN_DOCUMENT_TEXT_LENGTH) {
    return {
      title: 'Belge Okunamadı',
      message: `Seçtiğiniz dosyada yazı bulunamadı. Bu alana ${rule.expected} yüklemelisiniz; araç fotoğrafı ya da başka bir görsel seçmiş olabilirsiniz. Belge ise ışıklı ve düz bir açıyla yeniden çekin. ${WRONG_DOC_TAIL}`,
    };
  }

  const looksLike = recognize(folded);
  if (looksLike) {
    return {
      title: 'Yanlış Belge Olabilir',
      message: `Bu alana ${rule.expected} yüklemelisiniz, ancak seçtiğiniz dosya ${looksLike} gibi görünüyor. ${WRONG_DOC_TAIL}`,
    };
  }

  if (!rule.strict) return null;
  return {
    title: 'Belge Doğrulanamadı',
    message: `Seçtiğiniz dosyanın ${rule.name} olduğunu doğrulayamadık. Bu alana ${rule.expected} yüklediğinizden emin olun. ${WRONG_DOC_TAIL}`,
  };
}

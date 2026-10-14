/**
 * Tasarım token'ları — TEK KAYNAK (açık tema).
 *
 * Müşteri uygulamasının (YolSepetiMobile/src/theme/theme.ts) paletiyle birebir aynıdır;
 * o da web uygulamasının Tailwind paletiyle senkron. Sürücü uygulamasının yeni bileşenleri
 * ve ekranları renk/ölçüyü buradan okur; yeni kodda sabit hex yazılmaz.
 *
 * Karanlık mod henüz bu dosyaya taşınmadı: theme/theme.ts (darkTheme) ve
 * theme/tokens.ts (getTokens(true)) eski değerleri kullanmaya devam eder.
 */
import type { TextStyle, ViewStyle } from 'react-native';
import type { OrderStatus } from '../lib/types';

export const colors = {
  primary: {
    50: '#effbf9',
    100: '#cdf3ee',
    200: '#9ee6dd',
    300: '#66d0c4',
    400: '#4db6ac', // Marka/logo tonu
    500: '#159b8d', // Ana renk (buton/aksan)
    600: '#0f7d72', // Fiyat
    700: '#0f635b',
    800: '#114f49',
    900: '#0f413c',
  },
  secondary: {
    50: '#fef7ee',
    100: '#fdedd3',
    200: '#fed7aa',
    300: '#fdba74',
    400: '#fb923c',
    500: '#f97316',
    600: '#ea580c',
    700: '#c2410c',
    800: '#9a3412',
    900: '#7c2d12',
  },
  success: {
    50: '#f0fdf4',
    100: '#dcfce7',
    200: '#bbf7d0',
    300: '#86efac',
    400: '#4ade80',
    500: '#22c55e',
    600: '#16a34a',
    700: '#15803d',
    800: '#166534',
    900: '#14532d',
  },
  danger: {
    50: '#fef2f2',
    100: '#fee2e2',
    200: '#fecaca',
    300: '#fca5a5',
    400: '#f87171',
    500: '#ef4444',
    600: '#dc2626',
    700: '#b91c1c',
    800: '#991b1b',
    900: '#7f1d1d',
  },
  warning: {
    50: '#fffbeb',
    100: '#fef3c7',
    200: '#fde68a',
    300: '#fcd34d',
    400: '#fbbf24',
    500: '#f59e0b',
    600: '#d97706',
    700: '#b45309',
    800: '#92400e',
    900: '#78350f',
  },
  info: {
    50: '#eff6ff',
    100: '#dbeafe',
    200: '#bfdbfe',
    300: '#93c5fd',
    400: '#60a5fa',
    500: '#3b82f6',
    600: '#2563eb',
    700: '#1d4ed8',
    800: '#1e40af',
    900: '#1e3a8a',
  },
  neutral: {
    50: '#f0faf8', // Sayfa zemini (hafif turkuaz)
    100: '#f1f5f9',
    200: '#e2e8f0',
    300: '#cbd5e1',
    400: '#94a3b8',
    500: '#64748b',
    600: '#475569',
    700: '#334155',
    800: '#1e293b',
    900: '#0f172a',
  },
  white: '#ffffff',
  black: '#000000',
  overlay: 'rgba(0,0,0,0.5)',
} as const;

/** Renk ölçeği adları (tinted kutu / rozet kalıpları için). */
export type ColorScale = 'primary' | 'secondary' | 'success' | 'danger' | 'warning' | 'info' | 'neutral';

export const spacing = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
} as const;

export const radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  full: 9999,
} as const;

export const shadows = {
  sm: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  md: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  lg: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 5,
  },
} satisfies Record<string, ViewStyle>;

/**
 * Yazı önayarları — müşteri uygulamasında fiilen kullanılan ölçek (sistem fontu).
 * Renk dahil değildir; kullanan yer `color` verir (başlık neutral900, ikincil neutral500).
 */
export const text = {
  largeTitle: { fontSize: 26, fontWeight: '700' },   // Sekme kökü büyük başlık
  title: { fontSize: 24, fontWeight: '700' },        // Adım / ekran başlığı
  section: { fontSize: 20, fontWeight: '700' },      // Bölüm başlığı
  header: { fontSize: 18, fontWeight: '600' },       // Üst bar başlığı
  cardTitle: { fontSize: 16, fontWeight: '600' },    // Kart / form bölüm başlığı
  body: { fontSize: 14, fontWeight: '400' },
  bodyStrong: { fontSize: 14, fontWeight: '600' },
  label: { fontSize: 14, fontWeight: '500' },        // Input etiketi
  meta: { fontSize: 13, fontWeight: '400' },
  caption: { fontSize: 12, fontWeight: '400' },
  captionStrong: { fontSize: 12, fontWeight: '600' },
  groupLabel: { fontSize: 14, fontWeight: '600', textTransform: 'uppercase', letterSpacing: 0.5 },
  price: { fontSize: 18, fontWeight: '700' },
  priceLarge: { fontSize: 24, fontWeight: '700' },
} satisfies Record<string, TextStyle>;

/** Tinted kutu kalıbı: X[50] zemin, X[200] kenarlık, X[700] metin, X[500] ikon. */
export function tint(scale: ColorScale) {
  const c = colors[scale];
  return { bg: c[50], border: c[200], text: c[700], icon: c[500], solid: c[500] };
}

export interface StatusStyle {
  bg: string;
  text: string;
  icon: string;
}

/**
 * Sipariş durumu renkleri — tek eşleme. X[100] zemin, X[700] metin
 * (müşteri OrdersScreen'deki token tabanlı eşleme).
 */
export const statusColors: Record<OrderStatus, StatusStyle> = {
  pending: { bg: colors.warning[100], text: colors.warning[700], icon: 'clock-outline' },
  accepted: { bg: colors.success[100], text: colors.success[700], icon: 'check-circle-outline' },
  awaiting_approval: { bg: colors.info[100], text: colors.info[700], icon: 'account-clock-outline' },
  awaiting_payment: { bg: colors.secondary[100], text: colors.secondary[700], icon: 'credit-card-clock-outline' },
  in_progress: { bg: colors.primary[100], text: colors.primary[700], icon: 'progress-clock' },
  completed: { bg: colors.success[100], text: colors.success[700], icon: 'check-circle' },
  cancelled: { bg: colors.danger[100], text: colors.danger[700], icon: 'close-circle-outline' },
};

export const unknownStatusStyle: StatusStyle = {
  bg: colors.neutral[100],
  text: colors.neutral[600],
  icon: 'help-circle-outline',
};

export function getStatusStyle(status?: string | null): StatusStyle {
  return (status && statusColors[status as OrderStatus]) || unknownStatusStyle;
}

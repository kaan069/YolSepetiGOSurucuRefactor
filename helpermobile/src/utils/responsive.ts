import { Dimensions, Platform, StatusBar } from 'react-native';

// Ekran boyutlarını al
const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Temel tasarım referans boyutları (iPhone 11 Pro/X gibi orta boy telefon)
const BASE_WIDTH = 375;
const BASE_HEIGHT = 812;

/**
 * Genişliğe göre ölçekleme - yatay spacing ve boyutlar için
 */
export const scaleWidth = (size: number): number => {
  return (SCREEN_WIDTH / BASE_WIDTH) * size;
};

/**
 * Yüksekliğe göre ölçekleme - dikey spacing ve boyutlar için
 */
export const scaleHeight = (size: number): number => {
  return (SCREEN_HEIGHT / BASE_HEIGHT) * size;
};

/**
 * Ortalama ölçekleme - font boyutları için (çok fazla büyümesin/küçülmesin)
 */
export const scaleFont = (size: number): number => {
  const scale = Math.min(SCREEN_WIDTH / BASE_WIDTH, SCREEN_HEIGHT / BASE_HEIGHT);
  return Math.round(size * scale);
};

/**
 * Moderate ölçekleme - çok fazla değişmesin ama biraz adapte olsun
 */
export const moderateScale = (size: number, factor: number = 0.5): number => {
  return size + (scaleWidth(size) - size) * factor;
};

/**
 * Ekran boyutları
 */
export const SCREEN = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isSmallDevice: SCREEN_WIDTH < 375, // iPhone SE gibi
  isMediumDevice: SCREEN_WIDTH >= 375 && SCREEN_WIDTH < 414, // iPhone 11 Pro, X
  isLargeDevice: SCREEN_WIDTH >= 414, // iPhone 11 Pro Max, XS Max
};

/**
 * Status bar yüksekliği
 */
export const STATUS_BAR_HEIGHT = Platform.select({
  ios: 44, // iPhone X ve sonrası için default
  android: StatusBar.currentHeight || 24,
  default: 0,
});

/**
 * Safe area için padding değerleri
 */
export const SAFE_AREA_PADDING = {
  top: STATUS_BAR_HEIGHT,
  bottom: Platform.OS === 'ios' ? 34 : 16, // iPhone X home indicator için
  horizontal: scaleWidth(16),
};

/**
 * Standart spacing değerleri - responsive
 */
export const SPACING = {
  xs: scaleHeight(4),
  sm: scaleHeight(8),
  md: scaleHeight(16),
  lg: scaleHeight(24),
  xl: scaleHeight(32),
  xxl: scaleHeight(48),
};

/**
 * Font boyutları - responsive
 */
export const FONT_SIZE = {
  xs: scaleFont(10),
  sm: scaleFont(12),
  md: scaleFont(14),
  lg: scaleFont(16),
  xl: scaleFont(18),
  xxl: scaleFont(24),
  xxxl: scaleFont(32),
};

/**
 * Button boyutları - responsive
 */
export const BUTTON_SIZE = {
  height: scaleHeight(48),
  minHeight: 44, // Minimum dokunma alanı için
  borderRadius: moderateScale(8),
};

/**
 * Card boyutları - responsive
 */
export const CARD_SIZE = {
  borderRadius: moderateScale(12),
  padding: SPACING.md,
  margin: SPACING.sm,
};

/**
 * Header boyutları - responsive
 */
export const HEADER_SIZE = {
  height: scaleHeight(56) + SAFE_AREA_PADDING.top,
  paddingTop: SAFE_AREA_PADDING.top,
};

/**
 * Tab bar boyutları - responsive
 */
export const TAB_BAR_SIZE = {
  height: scaleHeight(60) + (Platform.OS === 'ios' ? 34 : 0),
  iconSize: moderateScale(24),
};

/**
 * Map için safe area - bottom tab bar'ı hesaba kat
 */
export const MAP_INSETS = {
  top: HEADER_SIZE.height,
  bottom: TAB_BAR_SIZE.height,
  left: 0,
  right: 0,
};

/**
 * Dinamik olarak ekran boyutunu dinle
 */
export const getDimensions = () => {
  const window = Dimensions.get('window');
  return {
    width: window.width,
    height: window.height,
    isSmall: window.width < 375,
    isMedium: window.width >= 375 && window.width < 414,
    isLarge: window.width >= 414,
  };
};

/**
 * Responsive değer seç - ekran boyutuna göre
 */
export const selectByScreenSize = <T,>(small: T, medium: T, large: T): T => {
  if (SCREEN.isSmallDevice) return small;
  if (SCREEN.isMediumDevice) return medium;
  return large;
};

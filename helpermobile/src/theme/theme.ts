import {
  MD3LightTheme as DefaultTheme,
  MD3DarkTheme as DarkDefaultTheme,
  configureFonts,
} from 'react-native-paper';
import { colors as d } from './design';

// Eski (karanlık mod) palet — karanlık mod yeniden tasarlanana kadar aynen korunur.
const legacy = {
  primary: {
    50: '#e0f2f1',
    100: '#b2dfdb',
    200: '#80cbc4',
    300: '#4db6ac',
    400: '#26a69a',
    500: '#00897b',
    600: '#00695c',
    700: '#004d40',
  },
  success: '#2E7D32',
  warning: '#F57C00',
  error: '#D32F2F',
  info: '#1976D2',
  gray: {
    50: '#fafafa',
    100: '#f5f5f5',
    200: '#eeeeee',
    300: '#e0e0e0',
    400: '#bdbdbd',
    500: '#9e9e9e',
    600: '#757575',
    700: '#616161',
    800: '#424242',
    900: '#212121',
  },
};

// Açık mod — eski şekil korunur, değerler yeni palete (design.ts) yönlendirilir.
// Index anlamı aynı: primary[400] = ana renk, primary[500] = koyu ton.
export const colors = {
  primary: {
    50: d.primary[50],
    100: d.primary[100],
    200: d.primary[200],
    300: d.primary[400],
    400: d.primary[500],   // Ana turkuaz
    500: d.primary[600],
    600: d.primary[700],
    700: d.primary[800],
  },

  success: d.success[600],
  warning: d.warning[600],
  error: d.danger[600],
  info: d.info[600],

  gray: {
    50: d.neutral[50],
    100: d.neutral[100],
    200: d.neutral[200],
    300: d.neutral[300],
    400: d.neutral[400],
    500: d.neutral[500],
    600: d.neutral[600],
    700: d.neutral[700],
    800: d.neutral[800],
    900: d.neutral[900],
  },

  text: {
    primary: d.neutral[900],
    secondary: d.neutral[500],
    disabled: d.neutral[400],
    hint: d.neutral[400],
    white: d.white,
  },

  background: {
    default: d.neutral[50],
    paper: d.white,
    disabled: d.neutral[100],
  },
};

// MD3 yazı ölçeği müşteri uygulamasının ölçeğine çekilir (sistem fontu).
const fonts = configureFonts({
  config: {
    headlineLarge: { fontSize: 32, lineHeight: 40, fontWeight: '700' },
    headlineMedium: { fontSize: 24, lineHeight: 30, fontWeight: '700' },
    headlineSmall: { fontSize: 22, lineHeight: 28, fontWeight: '700' },
    titleLarge: { fontSize: 20, lineHeight: 26, fontWeight: '700' },
    titleMedium: { fontSize: 16, lineHeight: 22, fontWeight: '600', letterSpacing: 0 },
    titleSmall: { fontSize: 14, lineHeight: 20, fontWeight: '600', letterSpacing: 0 },
    bodyLarge: { fontSize: 16, lineHeight: 24, letterSpacing: 0 },
    bodyMedium: { fontSize: 14, lineHeight: 20, letterSpacing: 0 },
    bodySmall: { fontSize: 13, lineHeight: 18, letterSpacing: 0 },
    labelLarge: { fontSize: 15, lineHeight: 20, fontWeight: '600', letterSpacing: 0 },
    labelMedium: { fontSize: 12, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2 },
    labelSmall: { fontSize: 11, lineHeight: 16, fontWeight: '500', letterSpacing: 0.2 },
  },
});

export const theme = {
  ...DefaultTheme,
  fonts,
  colors: {
    ...DefaultTheme.colors,
    primary: d.primary[500],
    onPrimary: d.white,
    primaryContainer: d.primary[100],
    onPrimaryContainer: d.primary[800],
    secondary: d.primary[700],
    onSecondary: d.white,
    secondaryContainer: d.primary[50],
    onSecondaryContainer: d.primary[800],
    tertiary: d.success[600],
    onTertiary: d.white,
    tertiaryContainer: d.success[50],
    onTertiaryContainer: d.success[800],
    error: d.danger[500],
    onError: d.white,
    errorContainer: d.danger[50],
    onErrorContainer: d.danger[700],
    background: d.neutral[50],
    onBackground: d.neutral[900],
    surface: d.white,
    onSurface: d.neutral[900],
    surfaceVariant: d.neutral[100],
    onSurfaceVariant: d.neutral[500],
    outline: d.neutral[200],
    outlineVariant: d.neutral[100],
    inverseSurface: d.neutral[800],
    inversePrimary: d.primary[300],
    elevation: {
      level0: 'transparent',
      level1: d.white,
      level2: d.white,
      level3: d.white,
      level4: d.white,
      level5: d.white,
    },
  },
  // Paper kartlarda 3x, chip'lerde 2x uygular: kart köşesi 16 px olur.
  roundness: 16 / 3,
};

// Karanlık Mod Renk Paleti
export const darkColors = {
  ...legacy,
  text: {
    primary: '#E0E0E0',
    secondary: '#9E9E9E',
    disabled: '#616161',
    hint: '#757575',
    white: '#ffffff',
  },
  background: {
    default: '#121212',
    paper: '#1E1E1E',
    disabled: '#2C2C2C',
  },
  gray: {
    ...legacy.gray,
    50: '#1E1E1E',
    100: '#2C2C2C',
    200: '#333333',
    300: '#444444',
    900: '#E0E0E0',
  },
};

export const darkTheme = {
  ...DarkDefaultTheme,
  colors: {
    ...DarkDefaultTheme.colors,
    primary: legacy.primary[300],           // Daha açık turkuaz (karanlık arka planda okunabilirlik)
    primaryContainer: legacy.primary[700],  // Koyu turkuaz container
    secondary: legacy.primary[400],         // Ana turkuaz
    secondaryContainer: legacy.primary[600],
    tertiary: '#4CAF50',                    // Daha açık yeşil
    error: '#EF5350',                       // Daha açık kırmızı
    errorContainer: '#442726',
    background: darkColors.background.default,
    surface: darkColors.background.paper,
    surfaceVariant: darkColors.gray[200],
    onPrimary: '#000000',
    onSecondary: '#000000',
    onBackground: darkColors.text.primary,
    onSurface: darkColors.text.primary,
    outline: darkColors.gray[300],
    elevation: {
      level0: 'transparent',
      level1: '#1E1E1E',
      level2: '#232323',
      level3: '#282828',
      level4: '#2C2C2C',
      level5: '#303030',
    },
  },
  roundness: 12,
};

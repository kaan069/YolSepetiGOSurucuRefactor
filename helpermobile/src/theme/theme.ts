import { MD3LightTheme as DefaultTheme, MD3DarkTheme as DarkDefaultTheme } from 'react-native-paper';

// Yol Sepeti Turkuaz Renk Paleti - Açık Mod
export const colors = {
  // Ana Turkuaz Tonları
  primary: {
    50: '#e0f2f1',   // Çok açık turkuaz
    100: '#b2dfdb',  // Açık turkuaz
    200: '#80cbc4',  // Orta açık turkuaz
    300: '#4db6ac',  // Orta turkuaz
    400: '#26a69a',  // Ana turkuaz (login gradient başlangıç)
    500: '#00897b',  // Koyu turkuaz (login gradient orta)
    600: '#00695c',  // Çok koyu turkuaz (login gradient bitiş)
    700: '#004d40',  // En koyu turkuaz
  },

  // Yardımcı Renkler
  success: '#2E7D32',    // Yeşil - kazanç rengi
  warning: '#F57C00',    // Turuncu - uyarı
  error: '#D32F2F',      // Kırmızı - hata
  info: '#1976D2',       // Mavi - bilgi

  // Gri Tonları
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

  // Metin Renkleri
  text: {
    primary: '#212121',
    secondary: '#666666',
    disabled: '#9e9e9e',
    hint: '#bdbdbd',
    white: '#ffffff',
  },

  // Arka Plan Renkleri
  background: {
    default: '#fafafa',
    paper: '#ffffff',
    disabled: '#f5f5f5',
  },
};

export const theme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    primary: colors.primary[400],           // Ana turkuaz
    primaryContainer: colors.primary[100],  // Açık turkuaz container
    secondary: colors.primary[500],         // Koyu turkuaz
    secondaryContainer: colors.primary[50], // Çok açık turkuaz
    tertiary: colors.success,               // Yeşil (kazanç)
    error: colors.error,                    // Kırmızı
    errorContainer: '#FFEBEE',
    background: colors.background.default,
    surface: colors.background.paper,
    surfaceVariant: colors.gray[100],
    onPrimary: colors.text.white,
    onSecondary: colors.text.white,
    onBackground: colors.text.primary,
    onSurface: colors.text.primary,
    outline: colors.gray[300],
    elevation: {
      level0: 'transparent',
      level1: colors.background.paper,
      level2: colors.background.paper,
      level3: colors.background.paper,
      level4: colors.background.paper,
      level5: colors.background.paper,
    },
  },
  roundness: 12, // Köşe yuvarlaklığı
};

// Karanlık Mod Renk Paleti
export const darkColors = {
  ...colors,
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
    ...colors.gray,
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
    primary: colors.primary[300],           // Daha açık turkuaz (karanlık arka planda okunabilirlik)
    primaryContainer: colors.primary[700],  // Koyu turkuaz container
    secondary: colors.primary[400],         // Ana turkuaz
    secondaryContainer: colors.primary[600],
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

// Aktif temaya göre renkleri döndüren helper
export const getColors = (isDark: boolean) => isDark ? darkColors : colors;

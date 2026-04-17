import { useState, useEffect } from 'react';
import { Dimensions, ScaledSize } from 'react-native';
import {
  SPACING,
  FONT_SIZE,
  BUTTON_SIZE,
  CARD_SIZE,
  HEADER_SIZE,
  TAB_BAR_SIZE,
  SAFE_AREA_PADDING,
  scaleWidth,
  scaleHeight,
  scaleFont,
  moderateScale,
} from '../utils/responsive';

/**
 * Responsive design için hook
 * Ekran boyutu değiştiğinde otomatik güncellenir
 */
export const useResponsive = () => {
  const [dimensions, setDimensions] = useState(() => {
    const window = Dimensions.get('window');
    return {
      width: window.width,
      height: window.height,
    };
  });

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({ window }: { window: ScaledSize }) => {
      setDimensions({
        width: window.width,
        height: window.height,
      });
    });

    return () => subscription?.remove();
  }, []);

  return {
    // Ekran boyutları
    width: dimensions.width,
    height: dimensions.height,
    isSmall: dimensions.width < 375,
    isMedium: dimensions.width >= 375 && dimensions.width < 414,
    isLarge: dimensions.width >= 414,

    // Spacing değerleri
    spacing: SPACING,

    // Font boyutları
    fontSize: FONT_SIZE,

    // Component boyutları
    button: BUTTON_SIZE,
    card: CARD_SIZE,
    header: HEADER_SIZE,
    tabBar: TAB_BAR_SIZE,
    safeArea: SAFE_AREA_PADDING,

    // Scaling fonksiyonları
    scaleWidth,
    scaleHeight,
    scaleFont,
    moderateScale,
  };
};

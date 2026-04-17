/**
 * Global Synced Blink Hook
 *
 * Tüm yanıp sönen animasyonların senkronize çalışmasını sağlar.
 * Singleton pattern ile tek bir Animated.Value kullanır.
 *
 * Kullanım:
 * const blinkAnim = useSyncedBlink(shouldBlink);
 * // blinkAnim 0.3 ile 1 arasında değişir (600ms döngü)
 */
import { useEffect } from 'react';
import { Animated } from 'react-native';

// Global animation state - singleton
let globalBlinkAnim: Animated.Value | null = null;
let globalAnimation: Animated.CompositeAnimation | null = null;
let activeSubscribers = 0;

const BLINK_DURATION = 600; // ms

function getGlobalBlinkAnim(): Animated.Value {
  if (!globalBlinkAnim) {
    globalBlinkAnim = new Animated.Value(1);
  }
  return globalBlinkAnim;
}

function startGlobalAnimation() {
  if (globalAnimation) return; // Zaten çalışıyor

  const anim = getGlobalBlinkAnim();
  globalAnimation = Animated.loop(
    Animated.sequence([
      Animated.timing(anim, {
        toValue: 0.3,
        duration: BLINK_DURATION,
        useNativeDriver: false,
      }),
      Animated.timing(anim, {
        toValue: 1,
        duration: BLINK_DURATION,
        useNativeDriver: false,
      }),
    ])
  );
  globalAnimation.start();
}

function stopGlobalAnimation() {
  if (globalAnimation) {
    globalAnimation.stop();
    globalAnimation = null;
    globalBlinkAnim?.setValue(1);
  }
}

/**
 * Senkronize yanıp sönme animasyonu hook'u
 * @param shouldBlink - Animasyon aktif olmalı mı?
 * @returns Animated.Value (0.3 - 1 arası)
 */
export function useSyncedBlink(shouldBlink: boolean): Animated.Value {
  useEffect(() => {
    if (shouldBlink) {
      activeSubscribers++;

      // İlk subscriber animasyonu başlatsın
      if (activeSubscribers === 1) {
        startGlobalAnimation();
      }

      return () => {
        activeSubscribers--;

        // Son subscriber ayrıldığında animasyonu durdur
        if (activeSubscribers === 0) {
          stopGlobalAnimation();
        }
      };
    }
  }, [shouldBlink]);

  return getGlobalBlinkAnim();
}

/**
 * Animasyon değerini al (hook kullanmadan)
 * Sadece interpolasyon için kullanılabilir
 */
export function getBlinkAnimValue(): Animated.Value {
  return getGlobalBlinkAnim();
}

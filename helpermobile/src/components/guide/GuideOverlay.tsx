import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Dimensions, TouchableWithoutFeedback } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useGuideStore } from '../../store/useGuideStore';
import { guideSteps } from './guideSteps';
import GuideTooltip from './GuideTooltip';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const TAB_BAR_CONTENT_HEIGHT = 60;
const SPOTLIGHT_SIZE = 70;

// Tab bar'daki her sekmenin merkez X koordinatini hesapla
function getTabCenterX(tabIndex: number): number {
  const tabWidth = SCREEN_WIDTH / 4;
  return tabIndex * tabWidth + tabWidth / 2;
}

// Her hedef icin spotlight pozisyonunu hesapla
function getTargetPosition(target: string, insets: { top: number; bottom: number }) {
  switch (target) {
    case 'toggle':
      return {
        x: SCREEN_WIDTH / 2,
        y: insets.top + 40,
        spotlightWidth: SCREEN_WIDTH - 32,
        spotlightHeight: 56,
      };
    case 'tab_orders':
      return {
        x: getTabCenterX(1),
        y: SCREEN_HEIGHT - insets.bottom - TAB_BAR_CONTENT_HEIGHT / 2,
        spotlightWidth: SPOTLIGHT_SIZE,
        spotlightHeight: SPOTLIGHT_SIZE,
      };
    case 'tab_earnings':
      return {
        x: getTabCenterX(2),
        y: SCREEN_HEIGHT - insets.bottom - TAB_BAR_CONTENT_HEIGHT / 2,
        spotlightWidth: SPOTLIGHT_SIZE,
        spotlightHeight: SPOTLIGHT_SIZE,
      };
    case 'tab_profile':
      return {
        x: getTabCenterX(3),
        y: SCREEN_HEIGHT - insets.bottom - TAB_BAR_CONTENT_HEIGHT / 2,
        spotlightWidth: SPOTLIGHT_SIZE,
        spotlightHeight: SPOTLIGHT_SIZE,
      };
    case 'location_button':
      return {
        x: SCREEN_WIDTH - 44,
        y: SCREEN_HEIGHT - insets.bottom - TAB_BAR_CONTENT_HEIGHT - 60,
        spotlightWidth: 64,
        spotlightHeight: 64,
      };
    default:
      return { x: SCREEN_WIDTH / 2, y: SCREEN_HEIGHT / 2, spotlightWidth: SPOTLIGHT_SIZE, spotlightHeight: SPOTLIGHT_SIZE };
  }
}

// Tooltip pozisyonunu hesapla
function getTooltipPosition(targetPos: { x: number; y: number }, arrowDirection: string) {
  switch (arrowDirection) {
    case 'up':
      // Tooltip hedefin altinda
      return { top: targetPos.y + 50, left: 20, right: 20 };
    case 'down':
      // Tooltip hedefin ustunde
      return { bottom: SCREEN_HEIGHT - targetPos.y + 50, left: 20, right: 20 };
    case 'left':
      // Tooltip hedefin solunda
      return { top: targetPos.y - 80, left: 20, right: 80 };
    case 'right':
      // Tooltip hedefin saginda
      return { top: targetPos.y - 80, left: 80, right: 20 };
    default:
      return { top: SCREEN_HEIGHT / 2 - 100, left: 20, right: 20 };
  }
}

export default function GuideOverlay() {
  const { isGuideActive, currentStep, nextStep, skipGuide } = useGuideStore();
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const stepAnim = useRef(new Animated.Value(0)).current;
  const insets = useSafeAreaInsets();

  // Overlay acilma animasyonu
  useEffect(() => {
    if (isGuideActive) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isGuideActive, fadeAnim]);

  // Adim gecis animasyonu
  useEffect(() => {
    stepAnim.setValue(0);
    Animated.timing(stepAnim, {
      toValue: 1,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [currentStep, stepAnim]);

  if (!isGuideActive) return null;

  const step = guideSteps[currentStep];
  if (!step) return null;

  const targetPos = getTargetPosition(step.target, insets);
  const tooltipPos = getTooltipPosition(targetPos, step.arrowDirection);

  // Spotlight alani: 4 parca overlay (ust, alt, sol, sag) ile ortadaki alani acik birak
  const spotlightLeft = targetPos.x - targetPos.spotlightWidth / 2;
  const spotlightTop = targetPos.y - targetPos.spotlightHeight / 2;
  const spotlightRight = spotlightLeft + targetPos.spotlightWidth;
  const spotlightBottom = spotlightTop + targetPos.spotlightHeight;

  return (
    <Animated.View style={[styles.overlay, { opacity: fadeAnim }]} pointerEvents="box-none">
      {/* Ust kisim overlay */}
      <TouchableWithoutFeedback>
        <View style={[styles.overlayPart, { top: 0, left: 0, right: 0, height: Math.max(0, spotlightTop) }]} />
      </TouchableWithoutFeedback>

      {/* Alt kisim overlay */}
      <TouchableWithoutFeedback>
        <View style={[styles.overlayPart, { top: spotlightBottom, left: 0, right: 0, bottom: 0 }]} />
      </TouchableWithoutFeedback>

      {/* Sol kisim overlay (spotlight yuksekliginde) */}
      <TouchableWithoutFeedback>
        <View style={[styles.overlayPart, { top: spotlightTop, left: 0, width: Math.max(0, spotlightLeft), height: targetPos.spotlightHeight }]} />
      </TouchableWithoutFeedback>

      {/* Sag kisim overlay (spotlight yuksekliginde) */}
      <TouchableWithoutFeedback>
        <View style={[styles.overlayPart, { top: spotlightTop, left: spotlightRight, right: 0, height: targetPos.spotlightHeight }]} />
      </TouchableWithoutFeedback>

      {/* Spotlight border - hedef alanin etrafindaki parlak cizgi */}
      <View style={[styles.spotlight, {
        left: spotlightLeft - 3,
        top: spotlightTop - 3,
        width: targetPos.spotlightWidth + 6,
        height: targetPos.spotlightHeight + 6,
        borderRadius: step.target === 'toggle' ? 16 : targetPos.spotlightWidth / 2 + 3,
      }]} />

      {/* Tooltip */}
      <Animated.View style={[
        styles.tooltipContainer,
        tooltipPos,
        { opacity: stepAnim, transform: [{ scale: stepAnim.interpolate({ inputRange: [0, 1], outputRange: [0.9, 1] }) }] },
      ]}>
        <GuideTooltip
          step={step}
          currentStep={currentStep}
          totalSteps={guideSteps.length}
          onNext={nextStep}
          onSkip={skipGuide}
          arrowDirection={step.arrowDirection}
        />
      </Animated.View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 9998,
  },
  overlayPart: {
    position: 'absolute',
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
  },
  spotlight: {
    position: 'absolute',
    borderWidth: 3,
    borderColor: 'rgba(38, 166, 154, 0.8)',
  },
  tooltipContainer: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

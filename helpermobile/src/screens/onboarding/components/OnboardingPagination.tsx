import React from 'react';
import { View, StyleSheet, TouchableOpacity, Animated, Dimensions } from 'react-native';
import { Text } from 'react-native-paper';
import { onboardingSlides } from '../data/onboardingSlides';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface Props {
  scrollX: Animated.Value;
  currentIndex: number;
  onNext: () => void;
  onSkip: () => void;
  onDone: () => void;
}

export default function OnboardingPagination({ scrollX, currentIndex, onNext, onSkip, onDone }: Props) {
  const isLastSlide = currentIndex === onboardingSlides.length - 1;

  return (
    <View style={styles.container}>
      {/* Atla butonu */}
      <TouchableOpacity
        style={styles.sideButton}
        onPress={onSkip}
        disabled={isLastSlide}
      >
        <Text style={[styles.sideButtonText, isLastSlide && styles.hidden]}>Atla</Text>
      </TouchableOpacity>

      {/* Dot indicators */}
      <View style={styles.dotsContainer}>
        {onboardingSlides.map((_, i) => {
          const dotWidth = scrollX.interpolate({
            inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
            outputRange: [8, 24, 8],
            extrapolate: 'clamp',
          });

          const dotOpacity = scrollX.interpolate({
            inputRange: [(i - 1) * SCREEN_WIDTH, i * SCREEN_WIDTH, (i + 1) * SCREEN_WIDTH],
            outputRange: [0.4, 1, 0.4],
            extrapolate: 'clamp',
          });

          return (
            <Animated.View
              key={i}
              style={[
                styles.dot,
                {
                  width: dotWidth,
                  opacity: dotOpacity,
                },
              ]}
            />
          );
        })}
      </View>

      {/* Ileri / Basla butonu */}
      <TouchableOpacity
        style={styles.sideButton}
        onPress={isLastSlide ? onDone : onNext}
      >
        <Text style={styles.sideButtonText}>
          {isLastSlide ? 'Basla' : 'Ileri'}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 20,
    position: 'absolute',
    bottom: 40,
    left: 0,
    right: 0,
  },
  sideButton: {
    width: 60,
    alignItems: 'center',
  },
  sideButtonText: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 16,
    fontWeight: '600',
  },
  hidden: {
    opacity: 0,
  },
  dotsContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: '#ffffff',
  },
});

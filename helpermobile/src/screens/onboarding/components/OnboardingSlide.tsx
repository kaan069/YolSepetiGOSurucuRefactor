import React from 'react';
import { View, StyleSheet, Dimensions, Image, Animated } from 'react-native';
import { Text } from 'react-native-paper';
import { LinearGradient } from 'expo-linear-gradient';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { OnboardingSlideData } from '../data/onboardingSlides';
import { useAppTheme } from '../../../hooks/useAppTheme';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

interface Props {
  slide: OnboardingSlideData;
  index: number;
  scrollX: Animated.Value;
}

export default function OnboardingSlide({ slide, index, scrollX }: Props) {
  const { isDarkMode } = useAppTheme();

  const opacity = scrollX.interpolate({
    inputRange: [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
    outputRange: [0, 1, 0],
    extrapolate: 'clamp',
  });

  const scale = scrollX.interpolate({
    inputRange: [(index - 0.5) * SCREEN_WIDTH, index * SCREEN_WIDTH, (index + 0.5) * SCREEN_WIDTH],
    outputRange: [0.8, 1, 0.8],
    extrapolate: 'clamp',
  });

  const gradientColors = isDarkMode
    ? ['#0d3d38', '#0a2f2b', '#071f1c'] as const
    : ['#26a69a', '#00897b', '#00695c'] as const;

  return (
    <View style={styles.slide}>
      <LinearGradient
        colors={gradientColors}
        style={styles.gradient}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
      >
        <View style={styles.content}>
          <Animated.View style={[styles.iconContainer, { opacity, transform: [{ scale }] }]}>
            {slide.isWelcome ? (
              <View style={styles.logoWrapper}>
                <Image
                  source={require('../../../../assets/yolyardimlogo.png')}
                  style={styles.logoImage}
                  resizeMode="contain"
                />
              </View>
            ) : (
              <View style={[styles.iconCircle, { backgroundColor: 'rgba(255, 255, 255, 0.15)' }]}>
                <MaterialCommunityIcons
                  name={slide.icon}
                  size={80}
                  color="#ffffff"
                />
              </View>
            )}
          </Animated.View>

          <Animated.View style={[styles.textContainer, { opacity }]}>
            <Text style={styles.title}>{slide.title}</Text>
            <Text style={styles.description}>{slide.description}</Text>
          </Animated.View>
        </View>
      </LinearGradient>
    </View>
  );
}

const styles = StyleSheet.create({
  slide: {
    width: SCREEN_WIDTH,
    height: '100%',
  },
  gradient: {
    flex: 1,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingBottom: 120,
  },
  iconContainer: {
    marginBottom: 48,
  },
  logoWrapper: {
    width: 120,
    height: 120,
    borderRadius: 60,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    borderWidth: 2,
    borderColor: 'rgba(255, 255, 255, 0.8)',
    overflow: 'hidden',
  },
  logoImage: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  iconCircle: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
  },
  textContainer: {
    alignItems: 'center',
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    color: '#ffffff',
    textAlign: 'center',
    marginBottom: 16,
  },
  description: {
    fontSize: 16,
    color: 'rgba(255, 255, 255, 0.85)',
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: 10,
  },
});

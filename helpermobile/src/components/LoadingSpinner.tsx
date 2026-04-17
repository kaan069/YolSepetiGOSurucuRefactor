import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, ViewStyle } from 'react-native';

interface LoadingSpinnerProps {
  size?: number;
  style?: ViewStyle;
}

export default function LoadingSpinner({ size = 60, style }: LoadingSpinnerProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Continuous rotation animation
    Animated.loop(
      Animated.timing(rotateAnim, {
        toValue: 1,
        duration: 2000, // 2 saniyede tam tur (daha hızlı loading için)
        useNativeDriver: true,
      })
    ).start();
  }, []);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  const logoSize = size * 0.78; // Container'ın %78'i kadar logo

  return (
    <View style={[styles.container, style]}>
      <Animated.View
        style={[
          styles.logoCircle,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            transform: [{ rotate: spin }],
          },
        ]}
      >
        <Animated.Image
          source={require('../../assets/yolyardimlogo.png')}
          style={[
            styles.logo,
            {
              width: logoSize,
              height: logoSize,
              borderRadius: logoSize / 2,
              transform: [{ rotate: spin }],
            },
          ]}
          resizeMode="contain"
        />
      </Animated.View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoCircle: {
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(38, 166, 154, 0.3)',
  },
  logo: {
    // Dinamik boyutlar inline olarak uygulanacak
  },
});

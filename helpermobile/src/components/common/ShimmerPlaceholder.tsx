/**
 * ShimmerPlaceholder Component
 *
 * Yükleme durumunda kullanılan parlama animasyonlu placeholder.
 * Skeleton loading efekti sağlar.
 */
import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet, ViewStyle } from 'react-native';

interface ShimmerPlaceholderProps {
  /** Placeholder genişliği */
  width?: number | string;
  /** Placeholder yüksekliği */
  height?: number;
  /** Border radius */
  borderRadius?: number;
  /** Ek stil */
  style?: ViewStyle;
  /** Animasyon aktif mi? */
  visible?: boolean;
}

export default function ShimmerPlaceholder({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
  visible = true,
}: ShimmerPlaceholderProps) {
  const animatedValue = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (!visible) return;

    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(animatedValue, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(animatedValue, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );

    animation.start();

    return () => animation.stop();
  }, [visible, animatedValue]);

  const opacity = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  if (!visible) return null;

  return (
    <Animated.View
      style={[
        styles.placeholder,
        {
          width: width as any,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
}

/**
 * Kazanç kartı için özel shimmer placeholder (tam kart)
 */
export function EarningsShimmer() {
  return (
    <View style={shimmerStyles.earningsContainer}>
      <ShimmerPlaceholder width={120} height={14} borderRadius={4} />
      <View style={shimmerStyles.earningsValueContainer}>
        <ShimmerPlaceholder width={180} height={48} borderRadius={8} />
      </View>
      <ShimmerPlaceholder width={100} height={12} borderRadius={4} />
    </View>
  );
}

/**
 * Sadece kazanç değeri için shimmer (mevcut container içinde kullanmak için)
 */
export function EarningsValueShimmer() {
  return (
    <View style={{ alignItems: 'center', paddingVertical: 8 }}>
      <ShimmerPlaceholder width={180} height={42} borderRadius={8} />
    </View>
  );
}

/**
 * Mesafe ve kazanç bölümü için shimmer
 */
export function DistanceEarningsShimmer() {
  return (
    <View style={shimmerStyles.distanceContainer}>
      {/* Mesafe grid */}
      <View style={shimmerStyles.distanceGrid}>
        <View style={shimmerStyles.distanceCard}>
          <ShimmerPlaceholder width={40} height={40} borderRadius={20} />
          <ShimmerPlaceholder width={60} height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <ShimmerPlaceholder width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
        <View style={shimmerStyles.distanceCard}>
          <ShimmerPlaceholder width={40} height={40} borderRadius={20} />
          <ShimmerPlaceholder width={60} height={24} borderRadius={4} style={{ marginTop: 8 }} />
          <ShimmerPlaceholder width={80} height={12} borderRadius={4} style={{ marginTop: 4 }} />
        </View>
      </View>

      {/* Kazanç kartı */}
      <View style={shimmerStyles.earningsCard}>
        <ShimmerPlaceholder width={40} height={40} borderRadius={20} />
        <ShimmerPlaceholder width={100} height={14} borderRadius={4} style={{ marginTop: 8 }} />
        <ShimmerPlaceholder width={140} height={36} borderRadius={6} style={{ marginTop: 8 }} />
      </View>
    </View>
  );
}

/**
 * İstatistik kartı için shimmer
 */
export function StatsShimmer() {
  return (
    <View style={shimmerStyles.statsContainer}>
      <View style={shimmerStyles.statsRow}>
        <ShimmerPlaceholder width={100} height={14} borderRadius={4} />
        <ShimmerPlaceholder width={80} height={18} borderRadius={4} />
      </View>
      <View style={shimmerStyles.statsRow}>
        <ShimmerPlaceholder width={80} height={14} borderRadius={4} />
        <ShimmerPlaceholder width={60} height={14} borderRadius={4} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  placeholder: {
    backgroundColor: '#E0E0E0',
  },
});

const shimmerStyles = StyleSheet.create({
  earningsContainer: {
    backgroundColor: '#E8F5E9',
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  earningsValueContainer: {
    marginVertical: 12,
  },
  distanceContainer: {
    paddingVertical: 16,
  },
  distanceGrid: {
    flexDirection: 'row',
    gap: 12,
    marginBottom: 16,
  },
  distanceCard: {
    flex: 1,
    backgroundColor: '#F5F5F5',
    borderRadius: 8,
    padding: 16,
    alignItems: 'center',
  },
  earningsCard: {
    backgroundColor: '#E8F5E9',
    borderRadius: 8,
    padding: 20,
    alignItems: 'center',
  },
  statsContainer: {
    backgroundColor: '#F5F5F5',
    padding: 12,
    borderRadius: 8,
    gap: 12,
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
});

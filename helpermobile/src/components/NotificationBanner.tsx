import React, { useEffect, useRef } from 'react';
import { Portal, Text, Card, Button, IconButton } from 'react-native-paper';
import { StyleSheet, Animated, View, Dimensions, TouchableWithoutFeedback } from 'react-native';

interface NotificationBannerProps {
  visible: boolean;
  title: string;
  body: string;
  onDismiss: () => void;
  onPress?: () => void;
  duration?: number;
}

/**
 * Modern In-app notification banner
 * Uygulama açıkken gelen bildirimleri ekranın ortasında modern bir card ile gösterir
 *
 * Özellikler:
 * - Ekran ortasında gösterilir
 * - Slide-in animasyonu
 * - Otomatik kapanma
 * - Tıklanabilir (onPress)
 * - Kaydırarak kapatma
 */
export default function NotificationBanner({
  visible,
  title,
  body,
  onDismiss,
  onPress,
  duration = 5000,
}: NotificationBannerProps) {
  const slideAnim = useRef(new Animated.Value(-300)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Slide in animation
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          tension: 65,
          friction: 8,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto dismiss after duration
      const timer = setTimeout(() => {
        handleDismiss();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      // Reset animations
      slideAnim.setValue(-300);
      opacityAnim.setValue(0);
    }
  }, [visible, duration]);

  const handleDismiss = () => {
    // Slide out animation
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -300,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss();
    });
  };

  const handlePress = () => {
    handleDismiss();
    if (onPress) {
      onPress();
    }
  };

  if (!visible) return null;

  return (
    <Portal>
      <TouchableWithoutFeedback onPress={handleDismiss}>
        <Animated.View style={[styles.overlay, { opacity: opacityAnim }]}>
          <TouchableWithoutFeedback>
            <Animated.View
              style={[
                styles.container,
                {
                  transform: [{ translateY: slideAnim }],
                },
              ]}
            >
              <Card style={styles.card} elevation={5}>
                <View style={styles.cardContent}>
                  {/* Icon ve Close Button */}
                  <View style={styles.header}>
                    <View style={styles.iconContainer}>
                      <Text style={styles.icon}>🔔</Text>
                    </View>
                    <IconButton
                      icon="close"
                      size={20}
                      iconColor="#666"
                      onPress={handleDismiss}
                      style={styles.closeButton}
                    />
                  </View>

                  {/* Title */}
                  {title && (
                    <Text variant="titleMedium" style={styles.title}>
                      {title}
                    </Text>
                  )}

                  {/* Body */}
                  <Text variant="bodyMedium" style={styles.body}>
                    {body}
                  </Text>

                  {/* Action Button - Her zaman göster */}
                  <Button
                    mode="contained"
                    onPress={handlePress}
                    style={styles.actionButton}
                    contentStyle={styles.actionButtonContent}
                  >
                    Görüntüle
                  </Button>
                </View>
              </Card>
            </Animated.View>
          </TouchableWithoutFeedback>
        </Animated.View>
      </TouchableWithoutFeedback>
    </Portal>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  container: {
    width: width * 0.9,
    maxWidth: 400,
    paddingHorizontal: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardContent: {
    padding: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#E3F2FD',
    justifyContent: 'center',
    alignItems: 'center',
  },
  icon: {
    fontSize: 24,
  },
  closeButton: {
    margin: -8,
  },
  title: {
    fontWeight: 'bold',
    color: '#1A1A1A',
    marginBottom: 8,
  },
  body: {
    color: '#666',
    lineHeight: 22,
    marginBottom: 16,
  },
  actionButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  actionButtonContent: {
    paddingVertical: 6,
  },
});

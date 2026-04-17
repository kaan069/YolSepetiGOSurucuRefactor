// Global Notification Banner Component
// Backend hatalarını ve başarı mesajlarını gösterir
import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, TouchableOpacity, Dimensions } from 'react-native';
import { Text, IconButton } from 'react-native-paper';
import { useNotificationStore, NotificationType } from '../store/useNotificationStore';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

const { width } = Dimensions.get('window');

interface NotificationConfig {
  icon: string;
  backgroundColor: string;
  textColor: string;
}

const notificationConfigs: Record<NotificationType, NotificationConfig> = {
  success: {
    icon: 'check-circle',
    backgroundColor: '#4CAF50',
    textColor: '#FFFFFF',
  },
  error: {
    icon: 'alert-circle',
    backgroundColor: '#F44336',
    textColor: '#FFFFFF',
  },
  warning: {
    icon: 'alert',
    backgroundColor: '#FF9800',
    textColor: '#FFFFFF',
  },
  info: {
    icon: 'information',
    backgroundColor: '#26a69a',
    textColor: '#FFFFFF',
  },
};

export default function GlobalNotification() {
  const { notifications, hideNotification } = useNotificationStore();
  const slideAnim = useRef(new Animated.Value(-100)).current;

  useEffect(() => {
    if (notifications.length > 0) {
      // Slide in
      Animated.spring(slideAnim, {
        toValue: 0,
        useNativeDriver: true,
        tension: 50,
        friction: 7,
      }).start();
    } else {
      // Slide out
      Animated.timing(slideAnim, {
        toValue: -100,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [notifications.length]);

  if (notifications.length === 0) return null;

  // En son eklenen bildirimi göster
  const notification = notifications[notifications.length - 1];
  const config = notificationConfigs[notification.type];

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateY: slideAnim }],
          backgroundColor: config.backgroundColor,
        },
      ]}
    >
      <TouchableOpacity
        style={styles.content}
        activeOpacity={0.9}
        onPress={() => hideNotification(notification.id)}
      >
        <View style={styles.iconContainer}>
          <MaterialCommunityIcons
            name={config.icon}
            size={24}
            color={config.textColor}
          />
        </View>
        <View style={styles.messageContainer}>
          <Text
            style={[styles.message, { color: config.textColor }]}
            numberOfLines={3}
          >
            {notification.message}
          </Text>
        </View>
        <IconButton
          icon="close"
          size={20}
          iconColor={config.textColor}
          onPress={() => hideNotification(notification.id)}
          style={styles.closeButton}
        />
      </TouchableOpacity>

      {/* Progress bar */}
      {notification.duration && notification.duration > 0 && (
        <ProgressBar duration={notification.duration} color={config.textColor} />
      )}
    </Animated.View>
  );
}

// Progress bar component
function ProgressBar({ duration, color }: { duration: number; color: string }) {
  const progressAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(progressAnim, {
      toValue: 1,
      duration: duration,
      useNativeDriver: false,
    }).start();
  }, []);

  const progressWidth = progressAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={styles.progressBarContainer}>
      <Animated.View
        style={[
          styles.progressBar,
          {
            width: progressWidth,
            backgroundColor: color,
          },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 9999,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    borderBottomLeftRadius: 12,
    borderBottomRightRadius: 12,
    overflow: 'hidden',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 50, // Status bar için boşluk
    paddingBottom: 16,
    paddingHorizontal: 16,
    minHeight: 80,
  },
  iconContainer: {
    marginRight: 12,
  },
  messageContainer: {
    flex: 1,
    marginRight: 8,
  },
  message: {
    fontSize: 14,
    lineHeight: 20,
    fontWeight: '500',
  },
  closeButton: {
    margin: 0,
  },
  progressBarContainer: {
    height: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
  },
  progressBar: {
    height: '100%',
    opacity: 0.5,
  },
});

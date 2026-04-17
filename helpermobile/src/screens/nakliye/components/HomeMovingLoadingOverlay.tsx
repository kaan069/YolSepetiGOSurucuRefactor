import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Modal, Animated } from 'react-native';
import { Text } from 'react-native-paper';

interface HomeMovingLoadingOverlayProps {
  visible: boolean;
  message?: string;
}

export default function HomeMovingLoadingOverlay({
  visible,
  message = 'Nakliye aracı ekleniyor...'
}: HomeMovingLoadingOverlayProps) {
  const rotateAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.loop(
        Animated.timing(rotateAnim, {
          toValue: 1,
          duration: 3000,
          useNativeDriver: true,
        })
      ).start();
    } else {
      rotateAnim.setValue(0);
    }
  }, [visible, rotateAnim]);

  const spin = rotateAnim.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  return (
    <Modal visible={visible} transparent={true} animationType="fade">
      <View style={styles.loadingOverlay}>
        <View style={styles.loadingContainer}>
          <Animated.View
            style={[
              styles.loadingLogoContainer,
              { transform: [{ rotate: spin }] },
            ]}
          >
            <Animated.Image
              source={require('../../../../assets/yolyardimlogo.png')}
              style={[
                styles.loadingLogo,
                { transform: [{ rotate: spin }] },
              ]}
              resizeMode="contain"
            />
          </Animated.View>
          <Text style={styles.loadingText}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingContainer: {
    backgroundColor: '#fff',
    borderRadius: 20,
    padding: 40,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  loadingLogoContainer: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#fff',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(21, 101, 192, 0.3)',
  },
  loadingLogo: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  loadingText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1565c0',
    textAlign: 'center',
  },
});

/**
 * NetworkStatusAlert Component
 *
 * Internet bağlantısını sürekli kontrol eder.
 * Bağlantı kesildiğinde modal alert gösterir.
 * Bağlantı geri gelene kadar alert kapanmaz.
 */
import React, { useState, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Modal,
  Animated,
  Easing,
} from 'react-native';
import { Text } from 'react-native-paper';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

export default function NetworkStatusAlert() {
  const [isConnected, setIsConnected] = useState<boolean | null>(true);
  const [spinValue] = useState(new Animated.Value(0));

  // Animasyon döngüsü
  useEffect(() => {
    if (!isConnected) {
      const spinAnimation = Animated.loop(
        Animated.timing(spinValue, {
          toValue: 1,
          duration: 2000,
          easing: Easing.linear,
          useNativeDriver: true,
        })
      );
      spinAnimation.start();

      return () => spinAnimation.stop();
    }
  }, [isConnected, spinValue]);

  // Network durumunu dinle
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setIsConnected(state.isConnected);
    });

    NetInfo.fetch().then((state) => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  const spin = spinValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });

  // Bağlantı varsa hiçbir şey gösterme
  if (isConnected !== false) {
    return null;
  }

  return (
    <Modal
      visible={true}
      transparent
      animationType="fade"
      statusBarTranslucent
    >
      <View style={styles.overlay}>
        <View style={styles.alertContainer}>
          {/* İkon ve animasyon */}
          <View style={styles.iconContainer}>
            <MaterialCommunityIcons
              name="wifi-off"
              size={48}
              color="#ef4444"
            />
          </View>

          {/* Başlık */}
          <Text style={styles.title}>
            İnternet Bağlantısı Yok
          </Text>

          {/* Açıklama */}
          <Text style={styles.description}>
            Lütfen internet bağlantınızı kontrol edin.{'\n'}
            Bağlantı sağlandığında otomatik olarak devam edeceksiniz.
          </Text>

          {/* Yükleniyor göstergesi */}
          <View style={styles.loadingContainer}>
            <Animated.View style={{ transform: [{ rotate: spin }] }}>
              <MaterialCommunityIcons
                name="loading"
                size={24}
                color="#6b7280"
              />
            </Animated.View>
            <Text style={styles.loadingText}>
              Bağlantı bekleniyor...
            </Text>
          </View>

          {/* İpuçları */}
          <View style={styles.tipsContainer}>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="wifi" size={16} color="#9ca3af" />
              <Text style={styles.tipText}>Wi-Fi bağlantınızı kontrol edin</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="signal-cellular-3" size={16} color="#9ca3af" />
              <Text style={styles.tipText}>Mobil veri açık mı kontrol edin</Text>
            </View>
            <View style={styles.tipRow}>
              <MaterialCommunityIcons name="airplane" size={16} color="#9ca3af" />
              <Text style={styles.tipText}>Uçak modu kapalı olmalı</Text>
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
  },
  alertContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 20,
    padding: 24,
    width: '100%',
    maxWidth: 340,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.25,
    shadowRadius: 20,
    elevation: 10,
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#fef2f2',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1f2937',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 14,
    color: '#6b7280',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 20,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#f3f4f6',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 20,
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 13,
    color: '#6b7280',
    fontWeight: '500',
  },
  tipsContainer: {
    width: '100%',
    backgroundColor: '#f9fafb',
    borderRadius: 12,
    padding: 12,
    gap: 8,
  },
  tipRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tipText: {
    fontSize: 12,
    color: '#9ca3af',
  },
});

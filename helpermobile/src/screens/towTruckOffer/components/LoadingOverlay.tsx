/**
 * LoadingOverlay Component
 *
 * Teklif gönderilirken tam ekran loading gösterir.
 * Karanlık arka plan üzerinde beyaz kart içinde spinner ve metin.
 */
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import LoadingSpinner from '../../../components/LoadingSpinner';

interface LoadingOverlayProps {
  /** Gösterilecek ana metin */
  title?: string;
  /** Gösterilecek alt metin */
  subtitle?: string;
}

export default function LoadingOverlay({
  title = 'Teklif gönderiliyor...',
  subtitle = 'Lütfen bekleyiniz',
}: LoadingOverlayProps) {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <LoadingSpinner size={100} />
        <Text style={styles.title}>{title}</Text>
        <Text style={styles.subtitle}>{subtitle}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
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
  title: {
    marginTop: 20,
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    textAlign: 'center',
  },
  subtitle: {
    marginTop: 8,
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

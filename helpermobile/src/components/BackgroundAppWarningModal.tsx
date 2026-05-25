// Aktif iş başladığında sürücüye "uygulamayı kapatmayın" uyarısı veren modal.
// Konum gönderimi background task ile sürer ama sürücü uygulamayı tamamen kill ederse durur.
import React from 'react';
import { Modal, View, StyleSheet, TouchableOpacity } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';

interface BackgroundAppWarningModalProps {
  visible: boolean;
  onDismiss: () => void;
}

export default function BackgroundAppWarningModal({
  visible,
  onDismiss,
}: BackgroundAppWarningModalProps) {
  return (
    <Modal
      visible={visible}
      animationType="fade"
      transparent
      statusBarTranslucent
      onRequestClose={() => {
        // Geri tuşuyla kapatılamasın; sürücü mutlaka "Anladım" butonuna basmalı
      }}
    >
      <View style={styles.overlay}>
        <View style={styles.card}>
          <View style={styles.iconCircle}>
            <MaterialCommunityIcons name="alert" size={48} color="#F57C00" />
          </View>

          <Text style={styles.title}>Önemli: Konum Paylaşımı</Text>

          <Text style={styles.description}>
            Müşterinize anlık konumunuzun ulaşması için{' '}
            <Text style={styles.bold}>uygulamayı tamamen kapatmayın</Text>.
          </Text>

          <Text style={styles.description}>
            Telefonunuzu kilitleyebilir veya başka uygulamalar kullanabilirsiniz. Ancak
            uygulamayı son kullanılanlardan{' '}
            <Text style={styles.bold}>kaydırarak kapatırsanız</Text> müşteri konumunuzu
            göremez.
          </Text>

          <TouchableOpacity style={styles.button} onPress={onDismiss} activeOpacity={0.85}>
            <Text style={styles.buttonText}>Anladım</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 20,
    alignItems: 'center',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  iconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#FFF3E0',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#333',
    textAlign: 'center',
    marginBottom: 12,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    color: '#555',
    textAlign: 'center',
    marginBottom: 12,
  },
  bold: {
    fontWeight: '700',
    color: '#E65100',
  },
  button: {
    width: '100%',
    backgroundColor: '#4CAF50',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginTop: 12,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#fff',
  },
});

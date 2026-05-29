import React from 'react';
import { Linking, Modal, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton } from '../../../components/fk';
import { buildSupportWhatsAppUrl } from '../../../constants/support';
import { logger } from '../../../utils/logger';

interface Props {
  visible: boolean;
  onDismiss: () => void;
  onLogin: () => void;
}

const WHATSAPP_PREFILL_MESSAGE =
  'Merhaba, sürücü olarak kayıt olmaya çalışıyorum ama numaram zaten kayıtlı görünüyor. Yardım rica ederim.';

export default function AlreadyRegisteredModal({ visible, onDismiss, onLogin }: Props) {
  const handleWhatsApp = async () => {
    try {
      await Linking.openURL(buildSupportWhatsAppUrl(WHATSAPP_PREFILL_MESSAGE));
    } catch (error) {
      logger.warn('auth', 'WhatsApp open failed', error);
    }
    onDismiss();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      onRequestClose={onDismiss}
    >
      <Pressable style={styles.backdrop} onPress={onDismiss}>
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          <ScrollView
            contentContainerStyle={styles.scrollContent}
            showsVerticalScrollIndicator={false}
            bounces={false}
          >
            <View style={styles.iconCircle}>
              <MaterialCommunityIcons name="account-check" size={40} color="#1976D2" />
            </View>

            <Text style={styles.title}>Bu numara zaten kayıtlı</Text>

            <Text style={styles.description}>
              Bu telefon numarası ile daha önce sürücü kaydı oluşturulmuş. Şifrenizle
              giriş yapabilir veya destek ekibimizden yardım alabilirsiniz.
            </Text>

            <View style={styles.buttonGroup}>
              <FkButton onPress={onLogin} fullWidth>
                Şifre ile Giriş Yap
              </FkButton>

              <FkButton
                variant="success"
                onPress={handleWhatsApp}
                fullWidth
                style={styles.buttonGap}
              >
                WhatsApp ile Yardım Al
              </FkButton>
            </View>
          </ScrollView>
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 64,
    paddingHorizontal: 24,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#fff',
    borderRadius: 20,
    overflow: 'hidden',
    elevation: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 12,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 28,
    paddingBottom: 24,
    alignItems: 'center',
  },
  iconCircle: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: '#E3F2FD',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1A1A',
    textAlign: 'center',
    marginBottom: 10,
  },
  description: {
    fontSize: 15,
    lineHeight: 21,
    color: '#555',
    textAlign: 'center',
    marginBottom: 22,
  },
  buttonGroup: {
    width: '100%',
  },
  buttonGap: {
    marginTop: 10,
  },
});

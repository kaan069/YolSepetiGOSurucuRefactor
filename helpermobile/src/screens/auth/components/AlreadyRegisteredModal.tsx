import React from 'react';
import { Linking, StyleSheet, View } from 'react-native';
import { Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { FkButton, FkModal } from '../../../components/fk';
import { useFkTokens } from '../../../hooks/useFkTokens';
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
  const { tokens } = useFkTokens();

  const handleWhatsApp = async () => {
    const url = buildSupportWhatsAppUrl(WHATSAPP_PREFILL_MESSAGE);
    try {
      await Linking.openURL(url);
    } catch (error) {
      logger.warn('auth', 'WhatsApp open failed', error);
    }
    onDismiss();
  };

  return (
    <FkModal
      visible={visible}
      onDismiss={onDismiss}
      variant="center"
      showHandle={false}
      contentStyle={{ padding: tokens.spacing.lg }}
    >
      <View style={styles.iconWrap}>
        <View style={[styles.iconCircle, { backgroundColor: '#E3F2FD' }]}>
          <MaterialCommunityIcons name="account-check" size={42} color="#1976D2" />
        </View>
      </View>

      <Text style={[styles.title, { color: tokens.colors.textPrimary }]}>
        Bu numara zaten kayıtlı
      </Text>

      <Text style={[styles.description, { color: tokens.colors.textSecondary }]}>
        Bu telefon numarası ile daha önce sürücü kaydı oluşturulmuş. Şifrenizle giriş
        yapabilir veya destek ekibimizden yardım alabilirsiniz.
      </Text>

      <View style={styles.buttonGroup}>
        <FkButton onPress={onLogin} fullWidth>
          Şifre ile Giriş Yap
        </FkButton>

        <FkButton variant="success" onPress={handleWhatsApp} fullWidth style={styles.buttonGap}>
          WhatsApp ile Yardım Al
        </FkButton>

        <FkButton variant="ghost" onPress={onDismiss} fullWidth style={styles.buttonGap}>
          Vazgeç
        </FkButton>
      </View>
    </FkModal>
  );
}

const styles = StyleSheet.create({
  iconWrap: {
    alignItems: 'center',
    marginBottom: 12,
  },
  iconCircle: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 8,
  },
  description: {
    fontSize: 15,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 20,
  },
  buttonGroup: {
    width: '100%',
  },
  buttonGap: {
    marginTop: 10,
  },
});

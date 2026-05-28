import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  Card,
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { authAPI } from '../../api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFkTokens } from '../../hooks/useFkTokens';
import { logger } from '../../utils/logger';
import { FkButton, FkOTPInput } from '../../components/fk';

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60;

export default function OTPVerificationScreen({ navigation }: Props) {
  const theme = useTheme();
  const { screenBg, cardBg, appColors } = useAppTheme();
  const { tokens } = useFkTokens();
  const { data, setVerificationToken } = useRegistrationDataStore();

  const [otp, setOtp] = useState('');
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);
  const lastSubmittedRef = useRef<string | null>(null);

  useEffect(() => {
    if (resendTimer > 0) {
      const t = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(t);
    }
    setCanResend(true);
  }, [resendTimer]);

  const handleVerify = async (code?: string) => {
    const otpCode = code ?? otp;
    if (otpCode.length !== OTP_LENGTH) {
      setError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }
    if (lastSubmittedRef.current === otpCode) return;
    lastSubmittedRef.current = otpCode;

    setLoading(true);
    setError('');

    try {
      const response = await authAPI.verifyOTP(data.phoneNumber, otpCode);
      const token = response.verification_token || (response as any).verificationToken;
      if (!token) {
        logger.error('auth', 'OTPVerification.verify - token missing in response');
        setError('Doğrulama başarısız. Lütfen tekrar deneyin.');
        return;
      }
      setVerificationToken(token);
      navigation.navigate('PersonalInfoNew', { verificationToken: token });
    } catch (error: any) {
      logger.error('auth', 'OTPVerification.verify failure', { status: error?.response?.status });

      let errorMessage = 'Doğrulama kodu hatalı. Lütfen tekrar deneyin.';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) {
          if (typeof errorData.error === 'object' && errorData.error !== null) {
            const messages = Object.values(errorData.error).flat();
            errorMessage = messages.join('\n');
          } else {
            errorMessage = String(errorData.error);
          }
        } else if (typeof errorData === 'string') errorMessage = errorData;
      }

      setError(errorMessage);
      setOtp('');
      lastSubmittedRef.current = null;
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;
    setResendLoading(true);
    setError('');
    try {
      await authAPI.sendOTP(data.phoneNumber);
      Alert.alert('Başarılı', 'Doğrulama kodu yeniden gönderildi.');
      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);
      setOtp('');
      lastSubmittedRef.current = null;
    } catch (error: any) {
      logger.error('auth', 'OTPVerification.resend failure', { status: error?.response?.status });
      let errorMessage = 'Kod gönderilemedi. Lütfen tekrar deneyin.';
      if (error?.response?.data?.message) errorMessage = error.response.data.message;
      Alert.alert('Hata', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  const maskedPhone = data.phoneNumber
    ? `${data.phoneNumber.slice(0, -4).replace(/./g, '*')}${data.phoneNumber.slice(-4)}`
    : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <View style={[styles.header, { backgroundColor: cardBg }]}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <ProgressBar progress={0.35} style={styles.progressBar} color={theme.colors.primary} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <View
              style={[
                styles.iconContainer,
                { backgroundColor: tokens.colors.successSoft },
              ]}
            >
              <MaterialCommunityIcons
                name="cellphone-message"
                size={48}
                color={tokens.colors.primary}
              />
            </View>

            <Text variant="headlineMedium" style={styles.title}>
              Doğrulama Kodu
            </Text>

            <Text variant="bodyMedium" style={styles.subtitle}>
              {maskedPhone} numarasına gönderilen 6 haneli kodu girin
            </Text>

            <FkOTPInput
              value={otp}
              onChange={(v) => {
                setOtp(v);
                if (error) setError('');
                if (v.length < OTP_LENGTH) lastSubmittedRef.current = null;
              }}
              onComplete={(v) => handleVerify(v)}
              length={OTP_LENGTH}
              error={error || undefined}
              containerStyle={{ marginBottom: 24 }}
            />

            <FkButton
              onPress={() => handleVerify()}
              loading={loading}
              disabled={loading || otp.length !== OTP_LENGTH}
              fullWidth
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </FkButton>

            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendLoading}
                  style={styles.resendButton}
                >
                  <Text style={[styles.resendText, { color: tokens.colors.primary }]}>
                    {resendLoading ? 'Gönderiliyor...' : 'Kodu Yeniden Gönder'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={[styles.timerText, { color: tokens.colors.textHint }]}>
                  Yeniden gönder: {resendTimer} saniye
                </Text>
              )}
            </View>

            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.changeNumberButton}
            >
              <MaterialCommunityIcons name="phone-outline" size={18} color={appColors.text.secondary} />
              <Text style={[styles.changeNumberText, { color: appColors.text.secondary }]}>
                Telefon numarasını değiştir
              </Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, elevation: 2 },
  backButton: { alignSelf: 'flex-start', marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2 },
  scrollView: { flex: 1 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { borderRadius: 16, elevation: 4 },
  cardContent: { padding: 24, alignItems: 'center' },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: { textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginBottom: 32, opacity: 0.7, lineHeight: 22 },
  resendContainer: { marginTop: 24, alignItems: 'center' },
  resendButton: { padding: 8 },
  resendText: { fontWeight: '600', fontSize: 14 },
  timerText: { fontSize: 14 },
  changeNumberButton: { flexDirection: 'row', alignItems: 'center', gap: 6, marginTop: 16, padding: 8 },
  changeNumberText: { fontSize: 14 },
});

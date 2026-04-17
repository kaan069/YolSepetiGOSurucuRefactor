import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  TextInput as RNTextInput,
  Alert,
  TouchableOpacity,
} from 'react-native';
import { Button, Card, Text, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { authAPI } from '../../api';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'OTPVerification'>;

const OTP_LENGTH = 6;
const RESEND_COOLDOWN = 60; // saniye

export default function OTPVerificationScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
  const { data, setVerificationToken } = useRegistrationDataStore();

  const [otpDigits, setOtpDigits] = useState<string[]>(Array(OTP_LENGTH).fill(''));
  const [loading, setLoading] = useState(false);
  const [resendLoading, setResendLoading] = useState(false);
  const [error, setError] = useState('');
  const [resendTimer, setResendTimer] = useState(RESEND_COOLDOWN);
  const [canResend, setCanResend] = useState(false);

  const inputRefs = useRef<(RNTextInput | null)[]>([]);

  // Geri sayım timer'ı
  useEffect(() => {
    if (resendTimer > 0) {
      const timer = setTimeout(() => setResendTimer(resendTimer - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      setCanResend(true);
    }
  }, [resendTimer]);

  const handleDigitChange = (index: number, value: string) => {
    // Rakam olmayan karakterleri temizle
    const cleanValue = value.replace(/\D/g, '');

    // Eğer birden fazla karakter varsa (paste veya auto-fill)
    if (cleanValue.length > 1) {
      // Tüm rakamları ilgili kutulara dağıt
      const digits = cleanValue.slice(0, OTP_LENGTH).split('');
      const newDigits = [...otpDigits];

      // index'ten itibaren doldur
      for (let i = 0; i < digits.length && (index + i) < OTP_LENGTH; i++) {
        newDigits[index + i] = digits[i];
      }

      setOtpDigits(newDigits);
      setError('');

      // Son dolu alana focus at
      const lastFilledIndex = Math.min(index + digits.length - 1, OTP_LENGTH - 1);
      inputRefs.current[lastFilledIndex]?.focus();

      // Eğer tüm haneler dolduysa otomatik doğrula
      const fullOtp = newDigits.join('');
      if (fullOtp.length === OTP_LENGTH && !newDigits.some(d => !d)) {
        handleVerify(fullOtp);
      }
      return;
    }

    // Tek karakter girişi - sadece rakam kabul et
    if (cleanValue && !/^\d$/.test(cleanValue)) return;

    const newDigits = [...otpDigits];
    newDigits[index] = cleanValue;
    setOtpDigits(newDigits);
    setError('');

    // Sonraki input'a geç
    if (cleanValue && index < OTP_LENGTH - 1) {
      inputRefs.current[index + 1]?.focus();
    }

    // Tüm haneler doluysa otomatik doğrula
    if (cleanValue && index === OTP_LENGTH - 1) {
      const fullOtp = newDigits.join('');
      if (fullOtp.length === OTP_LENGTH) {
        handleVerify(fullOtp);
      }
    }
  };

  const handleKeyPress = (index: number, key: string) => {
    if (key === 'Backspace' && !otpDigits[index] && index > 0) {
      inputRefs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (otp?: string) => {
    const otpCode = otp || otpDigits.join('');

    if (otpCode.length !== OTP_LENGTH) {
      setError('Lütfen 6 haneli doğrulama kodunu girin');
      return;
    }

    setLoading(true);
    setError('');

    try {
      console.log('🔐 OTP doğrulanıyor:', otpCode);

      const response = await authAPI.verifyOTP(data.phoneNumber, otpCode);

      console.log('✅ OTP doğrulandı, response:', JSON.stringify(response, null, 2));

      // Verification token'ı al (hem snake_case hem camelCase kontrol et)
      const token = response.verification_token || (response as any).verificationToken;

      if (!token) {
        console.error('❌ verification_token bulunamadı! Response:', response);
        setError('Doğrulama başarısız. Lütfen tekrar deneyin.');
        return;
      }

      console.log('✅ Verification token alındı:', token.substring(0, 20) + '...');

      // Verification token'ı store'a kaydet
      setVerificationToken(token);

      // Kişisel bilgiler ekranına git (token'ı param olarak da geç - store sync sorunu için yedek)
      navigation.navigate('PersonalInfoNew', { verificationToken: token });
    } catch (error: any) {
      console.error('❌ OTP doğrulama hatası:', error);

      let errorMessage = 'Doğrulama kodu hatalı. Lütfen tekrar deneyin.';

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          // error bir obje olabilir: {phoneNumber: ["mesaj1"], otpCode: ["mesaj2"]}
          if (typeof errorData.error === 'object' && errorData.error !== null) {
            const messages = Object.values(errorData.error).flat();
            errorMessage = messages.join('\n');
          } else {
            errorMessage = String(errorData.error);
          }
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      setError(errorMessage);
      // Input'ları temizle
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } finally {
      setLoading(false);
    }
  };

  const handleResend = async () => {
    if (!canResend || resendLoading) return;

    setResendLoading(true);
    setError('');

    try {
      console.log('📱 OTP yeniden gönderiliyor...');

      await authAPI.sendOTP(data.phoneNumber);

      Alert.alert('Başarılı', 'Doğrulama kodu yeniden gönderildi.');

      // Timer'ı sıfırla
      setResendTimer(RESEND_COOLDOWN);
      setCanResend(false);

      // Input'ları temizle
      setOtpDigits(Array(OTP_LENGTH).fill(''));
      inputRefs.current[0]?.focus();
    } catch (error: any) {
      console.error('❌ OTP yeniden gönderme hatası:', error);

      let errorMessage = 'Kod gönderilemedi. Lütfen tekrar deneyin.';

      if (error?.response?.data?.message) {
        errorMessage = error.response.data.message;
      }

      Alert.alert('Hata', errorMessage);
    } finally {
      setResendLoading(false);
    }
  };

  // Telefon numarasını maskele (son 4 hane görünsün)
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
        <ProgressBar
          progress={0.35}
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            {/* İkon */}
            <View style={styles.iconContainer}>
              <MaterialCommunityIcons name="cellphone-message" size={48} color="#26a69a" />
            </View>

            <Text variant="headlineMedium" style={styles.title}>
              Doğrulama Kodu
            </Text>

            <Text variant="bodyMedium" style={styles.subtitle}>
              {maskedPhone} numarasına gönderilen 6 haneli kodu girin
            </Text>

            {/* OTP Input */}
            <View style={styles.otpContainer}>
              {otpDigits.map((digit, index) => (
                <RNTextInput
                  key={index}
                  ref={(ref) => { inputRefs.current[index] = ref; }}
                  style={[
                    styles.otpInput,
                    digit ? styles.otpInputFilled : null,
                    error ? styles.otpInputError : null,
                  ]}
                  value={digit}
                  onChangeText={(value) => handleDigitChange(index, value)}
                  onKeyPress={({ nativeEvent }) => handleKeyPress(index, nativeEvent.key)}
                  keyboardType="number-pad"
                  maxLength={OTP_LENGTH}
                  selectTextOnFocus
                  autoFocus={index === 0}
                  textContentType="oneTimeCode"
                  autoComplete="sms-otp"
                />
              ))}
            </View>

            {error ? (
              <View style={styles.errorContainer}>
                <MaterialCommunityIcons name="alert-circle" size={16} color="#B00020" />
                <Text style={styles.errorText}>{error}</Text>
              </View>
            ) : null}

            {/* Doğrula Butonu */}
            <Button
              mode="contained"
              onPress={() => handleVerify()}
              loading={loading}
              disabled={loading || otpDigits.some((d) => !d)}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Doğrulanıyor...' : 'Doğrula'}
            </Button>

            {/* Yeniden Gönder */}
            <View style={styles.resendContainer}>
              {canResend ? (
                <TouchableOpacity
                  onPress={handleResend}
                  disabled={resendLoading}
                  style={styles.resendButton}
                >
                  <Text style={styles.resendText}>
                    {resendLoading ? 'Gönderiliyor...' : 'Kodu Yeniden Gönder'}
                  </Text>
                </TouchableOpacity>
              ) : (
                <Text style={styles.timerText}>
                  Yeniden gönder: {resendTimer} saniye
                </Text>
              )}
            </View>

            {/* Numara Değiştir */}
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={styles.changeNumberButton}
            >
              <MaterialCommunityIcons name="phone-outline" size={18} color={appColors.text.secondary} />
              <Text style={[styles.changeNumberText, { color: appColors.text.secondary }]}>Telefon numarasını değiştir</Text>
            </TouchableOpacity>
          </Card.Content>
        </Card>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    elevation: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 4,
  },
  cardContent: {
    padding: 24,
    alignItems: 'center',
  },
  iconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#e8f5e9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 32,
    opacity: 0.7,
    lineHeight: 22,
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    marginBottom: 24,
  },
  otpInput: {
    width: 45,
    height: 55,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderRadius: 12,
    textAlign: 'center',
    fontSize: 24,
    fontWeight: 'bold',
    backgroundColor: '#fafafa',
    color: '#1a1a1a',
  },
  otpInputFilled: {
    borderColor: '#26a69a',
    backgroundColor: '#e8f5e9',
  },
  otpInputError: {
    borderColor: '#B00020',
    backgroundColor: '#ffebee',
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 16,
  },
  errorText: {
    color: '#B00020',
    fontSize: 13,
  },
  button: {
    width: '100%',
    borderRadius: 12,
    marginTop: 8,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  resendContainer: {
    marginTop: 24,
    alignItems: 'center',
  },
  resendButton: {
    padding: 8,
  },
  resendText: {
    color: '#26a69a',
    fontWeight: '600',
    fontSize: 14,
  },
  timerText: {
    color: '#999',
    fontSize: 14,
  },
  changeNumberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 16,
    padding: 8,
  },
  changeNumberText: {
    fontSize: 14,
  },
});

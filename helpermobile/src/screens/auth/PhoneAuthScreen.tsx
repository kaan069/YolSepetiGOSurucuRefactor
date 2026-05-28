import React, { useState } from 'react';
import {
  Image,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  View,
} from 'react-native';
import { Card, ProgressBar, Text, useTheme } from 'react-native-paper';
import { SafeAreaView } from 'react-native-safe-area-context';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { IconButton } from 'react-native-paper';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore, ServiceType } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { authAPI, documentsAPI } from '../../api';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFkTokens } from '../../hooks/useFkTokens';
import { logger } from '../../utils/logger';
import {
  FkButton,
  FkFormError,
  FkModal,
  FkPasswordInput,
  FkPhoneInput,
  FkTextInput,
} from '../../components/fk';
import type { FkCountry } from '../../components/fk';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneAuth'>;

export default function PhoneAuthScreen({ navigation }: Props) {
  const theme = useTheme();
  const { screenBg, cardBg } = useAppTheme();
  const { tokens } = useFkTokens();

  const savePhoneNumber = useRegistrationDataStore((s) => s.setPhoneNumber);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<FkCountry>({
    code: 'TR',
    dialCode: '+90',
    flag: '🇹🇷',
    name: 'Türkiye',
  });
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  const handleLogin = async () => {
    if (phoneNumber.length < 10) {
      setError('Telefon numarası 10 haneli olmalıdır.');
      return;
    }
    if (phoneNumber.startsWith('0')) {
      setError('Telefon numarası 0 ile başlayamaz.');
      return;
    }
    if (!password.trim()) {
      setError('Lütfen şifrenizi girin.');
      return;
    }

    setIsLoading(true);
    setError('');

    try {
      const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;
      const response = await authAPI.login({
        phone_number: fullNumber,
        password,
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      });

      savePhoneNumber(phoneNumber);

      if (response && response.user) {
        const firstName = response.user.first_name || '';
        const lastName = response.user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Kullanıcı';

        setCurrentUser({
          id: String(response.user.id || '0'),
          username: response.user.phone_number || phoneNumber,
          password: '',
          fullName,
          phone_number: response.user.phone_number || fullNumber,
          birthDate: response.user.birth_date || '',
          nationalId: response.user.tc_no || '',
          workAddress: response.user.business_address || '',
          role: response.user.user_type as any,
          provider_type: response.user.provider_type || '',
          vehicles: [],
        });

        if (response.user.user_type && Array.isArray(response.user.user_type)) {
          const serviceTypes = response.user.user_type as ServiceType[];
          const { setSelectedServiceTypes } = useRegistrationDataStore.getState();
          setSelectedServiceTypes(serviceTypes);
        }
      }

      const userProviderType = response.user?.provider_type || '';
      if (userProviderType !== 'employee') {
        try {
          const completenessResponse = await documentsAPI.checkProfileCompleteness();
          if (!completenessResponse.is_complete) {
            await AsyncStorage.setItem('profile_incomplete', 'true');
            await AsyncStorage.setItem('profile_completion_percentage', String(completenessResponse.completion_percentage));
            await AsyncStorage.setItem('profile_missing_fields', JSON.stringify(completenessResponse.missing_fields));
          } else {
            await AsyncStorage.removeItem('profile_incomplete');
            await AsyncStorage.removeItem('profile_completion_percentage');
            await AsyncStorage.removeItem('profile_missing_fields');
          }
        } catch (err: any) {
          logger.error('auth', 'PhoneAuth.profileCompleteness failure', { status: err?.response?.status });
        }
      }

      setIsAuthenticated(true);
    } catch (e: any) {
      logger.error('auth', 'PhoneAuth.handleLogin failure', { status: e?.response?.status });
      if (!e.response && e.request) {
        setError('İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
      } else if (e.response?.status === 401 || e.response?.status === 400) {
        setError('Giriş başarısız. Telefon veya şifre hatalı.');
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    const cleanPhone = forgotPhone.replace(/\s/g, '');
    if (cleanPhone.length < 10) {
      setForgotError('Telefon numarası 10 haneli olmalıdır');
      return;
    }
    try {
      setForgotLoading(true);
      setForgotError('');
      await authAPI.forgotPassword(cleanPhone);
      setForgotSuccess(true);
    } catch (e: any) {
      logger.error('auth', 'PhoneAuth.forgotPassword failure', { status: e?.response?.status });
      if (!e.response && e.request) {
        setForgotError('İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.');
      } else if (e?.response?.status === 404) {
        setForgotError('Bu telefon numarasına kayıtlı kullanıcı bulunamadı');
      } else if (e?.response?.data?.error) {
        setForgotError(e.response.data.error);
      } else {
        setForgotError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  const closeForgotModal = () => {
    setForgotModalVisible(false);
    setForgotPhone('');
    setForgotError('');
    setForgotSuccess(false);
  };

  const submitDisabled = isLoading || phoneNumber.length < 10 || !password.trim();

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={[styles.container, { backgroundColor: screenBg }]}
      >
        <View style={[styles.header, { backgroundColor: cardBg }]}>
          <IconButton icon="arrow-left" size={24} onPress={() => navigation.goBack()} style={styles.backButton} />
          <ProgressBar progress={0.5} style={styles.progressBar} color={theme.colors.primary} />
        </View>

        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          <Card style={styles.card}>
            <Card.Content style={styles.cardContent}>
              <View style={[styles.logoContainer, { backgroundColor: cardBg }]}>
                <Image
                  source={require('../../../assets/yolyardimlogo.png')}
                  style={styles.logo}
                  resizeMode="contain"
                />
              </View>
              <Text variant="headlineMedium" style={styles.title}>
                Giriş Yap
              </Text>
              <Text variant="bodyMedium" style={styles.subtitle}>
                Telefon numaranız ve şifreniz ile giriş yapın
              </Text>

              <FkPhoneInput
                value={phoneNumber}
                onChange={(v) => {
                  setPhoneNumber(v);
                  setError('');
                }}
                onChangeCountry={(c) => setSelectedCountry(c)}
                label="Telefon Numarası"
              />

              <FkPasswordInput
                label="PIN Şifre"
                value={password}
                onChange={(text) => {
                  setPassword(text.replace(/[^0-9]/g, ''));
                  setError('');
                }}
                numericPin
                maxLength={6}
              />

              <TouchableOpacity
                onPress={() => setForgotModalVisible(true)}
                style={styles.forgotButton}
              >
                <Text style={[styles.forgotButtonText, { color: tokens.colors.primary }]}>
                  Şifremi Unuttum
                </Text>
              </TouchableOpacity>

              {error ? (
                <FkFormError error={error} withIcon style={{ justifyContent: 'center', marginLeft: 0, marginBottom: 8 }} />
              ) : null}

              <FkButton
                onPress={handleLogin}
                loading={isLoading}
                disabled={submitDisabled}
                fullWidth
                style={{ marginTop: 8 }}
              >
                Giriş Yap
              </FkButton>

              <FkButton variant="ghost" onPress={() => navigation.navigate('PhoneNumber')} disabled={isLoading} fullWidth>
                Hesabınız yok mu? Kayıt olun
              </FkButton>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      <FkModal
        visible={forgotModalVisible}
        onDismiss={closeForgotModal}
        title="Şifremi Unuttum"
        variant="center"
        maxHeightRatio={0.85}
        showHandle={false}
      >
        <View style={{ padding: 20 }}>
          {forgotSuccess ? (
            <View style={styles.successContainer}>
              <MaterialCommunityIcons name="check-circle" size={56} color={tokens.colors.success} />
              <Text style={[styles.successTitle, { color: tokens.colors.textPrimary }]}>Şifreniz Gönderildi!</Text>
              <Text style={[styles.successText, { color: tokens.colors.textSecondary }]}>
                Yeni şifreniz SMS olarak telefonunuza gönderildi. Bu şifre ile giriş yapabilirsiniz.
              </Text>
              <FkButton onPress={closeForgotModal} fullWidth>
                Giriş Yap
              </FkButton>
            </View>
          ) : (
            <View>
              <Text style={[styles.modalDescription, { color: tokens.colors.textSecondary }]}>
                Kayıtlı telefon numaranızı girin, yeni şifreniz SMS olarak gönderilecektir.
              </Text>

              <FkTextInput
                label="Telefon Numarası"
                value={forgotPhone}
                onChange={(text) => {
                  setForgotPhone(text.replace(/[^0-9]/g, ''));
                  setForgotError('');
                }}
                keyboardType="phone-pad"
                maxLength={11}
                leftIcon="phone"
                placeholder="5XX XXX XX XX"
                error={forgotError || undefined}
              />

              <FkButton
                onPress={handleForgotPassword}
                loading={forgotLoading}
                disabled={forgotLoading || forgotPhone.replace(/\s/g, '').length < 10}
                fullWidth
                style={{ marginTop: 8 }}
              >
                {forgotLoading ? 'Gönderiliyor...' : 'Şifremi Gönder'}
              </FkButton>

              <FkButton variant="ghost" onPress={closeForgotModal} fullWidth>
                İptal
              </FkButton>
            </View>
          )}
        </View>
      </FkModal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1 },
  container: { flex: 1 },
  header: {
    paddingTop: 16,
    paddingHorizontal: 16,
    paddingBottom: 16,
    elevation: 2,
  },
  backButton: { alignSelf: 'flex-start', marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2 },
  content: { flexGrow: 1, justifyContent: 'center', padding: 20 },
  card: { borderRadius: 16, elevation: 4 },
  cardContent: { padding: 24 },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 16,
    width: 90,
    height: 90,
    borderRadius: 45,
    justifyContent: 'center',
    alignSelf: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'rgba(38, 166, 154, 0.3)',
  },
  logo: { width: 70, height: 70, borderRadius: 35 },
  title: { textAlign: 'center', marginBottom: 8, fontWeight: 'bold' },
  subtitle: { textAlign: 'center', marginBottom: 24, opacity: 0.7 },
  forgotButton: { alignSelf: 'flex-end', marginBottom: 16, paddingVertical: 4 },
  forgotButtonText: { fontSize: 14, fontWeight: '500' },
  modalDescription: { fontSize: 14, lineHeight: 20, marginBottom: 16 },
  successContainer: { alignItems: 'center', paddingVertical: 10, gap: 12 },
  successTitle: { fontSize: 20, fontWeight: '700' },
  successText: { fontSize: 14, textAlign: 'center', lineHeight: 20 },
});

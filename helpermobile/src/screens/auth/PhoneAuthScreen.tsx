import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, ScrollView, Platform, Image, Modal, Pressable, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, TextInput, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import AsyncStorage from '@react-native-async-storage/async-storage';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore, ServiceType } from '../../store/useRegistrationDataStore';
import { useAuthStore } from '../../store/authStore';
import { authAPI, documentsAPI } from '../../api';
import PhoneInput from '../../components/PhoneInput';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';

// Navigation props type tanımı - Navigation props type definition
type Props = NativeStackScreenProps<RootStackParamList, 'PhoneAuth'>;

interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

// Telefon doğrulama ekranı - Phone authentication screen
export default function PhoneAuthScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();

  // Store hook'ları — selective selector (gereksiz re-render'ı engeller)
  const savePhoneNumber = useRegistrationDataStore((s) => s.setPhoneNumber);
  const setIsAuthenticated = useAuthStore((s) => s.setIsAuthenticated);
  const setCurrentUser = useAuthStore((s) => s.setCurrentUser);

  // Component state'leri
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'TR',
    dialCode: '+90',
    flag: '🇹🇷',
    name: 'Türkiye',
  });
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');
  const [showPassword, setShowPassword] = useState(false);

  // Şifremi unuttum modal state'leri
  const [forgotModalVisible, setForgotModalVisible] = useState(false);
  const [forgotPhone, setForgotPhone] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotError, setForgotError] = useState('');
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Giriş yap
  const handleLogin = async () => {
    try {
      // Validasyon: Türkiye için 10 haneli numara
      if (phoneNumber.length < 10) {
        setError('Telefon numarası 10 haneli olmalıdır.');
        return;
      }

      // Başında 0 kontrolü
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

      // API'ye login isteği gönder
      const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;

      const response = await authAPI.login({
        phone_number: fullNumber,
        password: password,
        device_type: Platform.OS === 'ios' ? 'ios' : 'android',
      });

      // Başarılı giriş - telefon kaydet
      savePhoneNumber(phoneNumber);

      // Backend'den gelen user bilgisini authStore'a kaydet
      if (response && response.user) {
        const firstName = response.user.first_name || '';
        const lastName = response.user.last_name || '';
        const fullName = `${firstName} ${lastName}`.trim() || 'Kullanıcı';

        const authUser = {
          id: String(response.user.id || '0'),
          username: response.user.phone_number || phoneNumber,
          password: '',
          fullName: fullName,
          phone_number: response.user.phone_number || fullNumber,
          birthDate: response.user.birth_date || '',
          nationalId: response.user.tc_no || '',
          workAddress: response.user.business_address || '',
          role: response.user.user_type as any,
          provider_type: response.user.provider_type || '',
          vehicles: [],
        };

        setCurrentUser(authUser);

        // Service types sync et
        if (response.user.user_type && Array.isArray(response.user.user_type)) {
          const serviceTypes = response.user.user_type as ServiceType[];
          const { setSelectedServiceTypes } = useRegistrationDataStore.getState();
          setSelectedServiceTypes(serviceTypes);
        }
      }

      // Profil tamamlama kontrolü (eleman hesapları için atla)
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

    } catch (error: any) {
      logger.error('auth', 'PhoneAuth.handleLogin failure', { status: error?.response?.status });

      // Network hatası kontrolü (internet yok veya sunucuya ulaşılamıyor)
      if (!error.response && error.request) {
        setError('İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
      } else if (error.response?.status === 401 || error.response?.status === 400) {
        setError('Giriş başarısız. Telefon veya şifre hatalı.');
      } else {
        setError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  // Şifremi unuttum
  const handleForgotPassword = async () => {
    // Validasyon
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
    } catch (error: any) {
      logger.error('auth', 'PhoneAuth.forgotPassword failure', { status: error?.response?.status });

      if (!error.response && error.request) {
        setForgotError('İnternet bağlantınız yok. Lütfen bağlantınızı kontrol edin.');
      } else if (error?.response?.status === 404) {
        setForgotError('Bu telefon numarasına kayıtlı kullanıcı bulunamadı');
      } else if (error?.response?.data?.error) {
        setForgotError(error.response.data.error);
      } else {
        setForgotError('Bir hata oluştu. Lütfen tekrar deneyin.');
      }
    } finally {
      setForgotLoading(false);
    }
  };

  // Modal'ı kapat ve sıfırla
  const closeForgotModal = () => {
    setForgotModalVisible(false);
    setForgotPhone('');
    setForgotError('');
    setForgotSuccess(false);
  };

  return (
    <SafeAreaView style={[styles.safeArea, { backgroundColor: screenBg }]}>
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
            progress={0.5}
            style={styles.progressBar}
            color={theme.colors.primary}
          />
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

              <PhoneInput
                value={phoneNumber}
                onChangeText={(text) => {
                  setPhoneNumber(text);
                  setError('');
                }}
                onChangeCountry={(country) => setSelectedCountry(country)}
                label="Telefon Numarası"
                error={!!error}
              />

              <TextInput
                label="PIN Şifre"
                value={password}
                onChangeText={(text) => {
                  const numeric = text.replace(/[^0-9]/g, '');
                  setPassword(numeric);
                  setError('');
                }}
                secureTextEntry={!showPassword}
                keyboardType="numeric"
                maxLength={6}
                style={styles.input}
                left={<TextInput.Icon icon="lock" />}
                right={
                  <TextInput.Icon
                    icon={showPassword ? "eye-off" : "eye"}
                    onPress={() => setShowPassword(!showPassword)}
                  />
                }
              />

              {/* Şifremi Unuttum Butonu */}
              <TouchableOpacity
                onPress={() => setForgotModalVisible(true)}
                style={styles.forgotButton}
              >
                <Text style={styles.forgotButtonText}>Şifremi Unuttum</Text>
              </TouchableOpacity>

              {error ? <Text style={styles.errorText}>{error}</Text> : null}

              <Button
                mode="contained"
                onPress={handleLogin}
                loading={isLoading}
                disabled={isLoading || phoneNumber.length < 10 || !password.trim()}
                style={styles.button}
                contentStyle={styles.buttonContent}
              >
                Giriş Yap
              </Button>

              <Button
                mode="text"
                onPress={() => navigation.navigate('PhoneNumber')}
                disabled={isLoading}
                style={styles.textButton}
              >
                Hesabınız yok mu? Kayıt olun
              </Button>
            </Card.Content>
          </Card>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Şifremi Unuttum Modal */}
      <Modal
        visible={forgotModalVisible}
        transparent
        animationType="fade"
        onRequestClose={closeForgotModal}
      >
        <Pressable style={styles.modalOverlay} onPress={closeForgotModal}>
          <Pressable style={[styles.modalContent, { backgroundColor: cardBg }]} onPress={(e) => e.stopPropagation()}>
            {/* Modal Header */}
            <View style={styles.modalHeader}>
              <View style={[styles.modalIconContainer, { backgroundColor: isDarkMode ? '#0d2137' : '#E8F5E9' }]}>
                <MaterialCommunityIcons name="lock-reset" size={32} color="#26a69a" />
              </View>
              <Text style={styles.modalTitle}>Şifremi Unuttum</Text>
              <TouchableOpacity onPress={closeForgotModal} style={styles.modalCloseButton}>
                <MaterialCommunityIcons name="close" size={24} color={appColors.text.secondary} />
              </TouchableOpacity>
            </View>

            {forgotSuccess ? (
              // Başarı Durumu
              <View style={styles.successContainer}>
                <View style={styles.successIconContainer}>
                  <MaterialCommunityIcons name="check-circle" size={60} color="#4CAF50" />
                </View>
                <Text style={styles.successTitle}>Şifreniz Gönderildi!</Text>
                <Text style={[styles.successText, { color: appColors.text.secondary }]}>
                  Yeni şifreniz SMS olarak telefonunuza gönderildi. Bu şifre ile giriş yapabilirsiniz.
                </Text>
                <Button
                  mode="contained"
                  onPress={closeForgotModal}
                  style={styles.successButton}
                  buttonColor="#26a69a"
                >
                  Giriş Yap
                </Button>
              </View>
            ) : (
              // Form Durumu
              <View style={styles.modalBody}>
                <Text style={[styles.modalDescription, { color: appColors.text.secondary }]}>
                  Kayıtlı telefon numaranızı girin, yeni şifreniz SMS olarak gönderilecektir.
                </Text>

                <TextInput
                  label="Telefon Numarası"
                  value={forgotPhone}
                  onChangeText={(text) => {
                    // Sadece rakam al
                    const cleaned = text.replace(/[^0-9]/g, '');
                    setForgotPhone(cleaned);
                    setForgotError('');
                  }}
                  keyboardType="phone-pad"
                  maxLength={11}
                  style={styles.modalInput}
                  left={<TextInput.Icon icon="phone" />}
                  placeholder="5XX XXX XX XX"
                  error={!!forgotError}
                />

                {forgotError ? (
                  <View style={styles.errorContainer}>
                    <MaterialCommunityIcons name="alert-circle" size={16} color="#B00020" />
                    <Text style={styles.modalErrorText}>{forgotError}</Text>
                  </View>
                ) : null}

                <Button
                  mode="contained"
                  onPress={handleForgotPassword}
                  loading={forgotLoading}
                  disabled={forgotLoading || forgotPhone.replace(/\s/g, '').length < 10}
                  style={styles.modalButton}
                  contentStyle={styles.modalButtonContent}
                  buttonColor="#26a69a"
                >
                  {forgotLoading ? 'Gönderiliyor...' : 'Şifremi Gönder'}
                </Button>

                <TouchableOpacity onPress={closeForgotModal} style={styles.cancelButton}>
                  <Text style={[styles.cancelButtonText, { color: appColors.text.secondary }]}>İptal</Text>
                </TouchableOpacity>
              </View>
            )}
          </Pressable>
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
  },
  container: {
    flex: 1,
  },
  header: {
    paddingTop: 16,
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
  },
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
  logo: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  title: {
    textAlign: 'center',
    marginBottom: 8,
    fontWeight: 'bold',
  },
  subtitle: {
    textAlign: 'center',
    marginBottom: 24,
    opacity: 0.7,
  },
  input: {
    marginBottom: 8,
  },
  forgotButton: {
    alignSelf: 'flex-end',
    marginBottom: 16,
    paddingVertical: 4,
  },
  forgotButtonText: {
    color: '#26a69a',
    fontSize: 14,
    fontWeight: '500',
  },
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
  },
  button: {
    marginTop: 8,
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  textButton: {
    marginTop: 16,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    borderRadius: 20,
    width: '100%',
    maxWidth: 400,
    overflow: 'hidden',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  modalTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  modalCloseButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalBody: {
    padding: 20,
  },
  modalDescription: {
    fontSize: 14,
    lineHeight: 20,
    marginBottom: 20,
  },
  modalInput: {
    marginBottom: 12,
  },
  errorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFEBEE',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  modalErrorText: {
    color: '#B00020',
    fontSize: 13,
    marginLeft: 8,
    flex: 1,
  },
  modalButton: {
    borderRadius: 12,
    marginTop: 8,
  },
  modalButtonContent: {
    paddingVertical: 8,
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  cancelButtonText: {
    fontSize: 14,
  },
  // Success State
  successContainer: {
    padding: 30,
    alignItems: 'center',
  },
  successIconContainer: {
    marginBottom: 20,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  successText: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 24,
  },
  successButton: {
    width: '100%',
    borderRadius: 12,
  },
});

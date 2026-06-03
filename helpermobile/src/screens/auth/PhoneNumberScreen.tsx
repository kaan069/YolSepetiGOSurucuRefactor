import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, TouchableOpacity, Keyboard } from 'react-native';
import { Card, Text, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore, ServiceType, TransferSubType } from '../../store/useRegistrationDataStore';
import { authAPI } from '../../api';
import { FkButton, FkFormError, FkPhoneInput, FkTextInput } from '../../components/fk';
import type { FkCountry } from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';
import AlreadyRegisteredModal from './components/AlreadyRegisteredModal';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneNumber'>;

// Hizmet tipleri - Service types (4 ana hizmet türü)
// Tüm hizmetler için aynı renk tonu kullanılıyor (tema primary rengi)
const SERVICE_COLOR = '#26a69a';  // Ana turkuaz
const SERVICE_BG_COLOR = '#e0f2f1';  // Açık turkuaz

const serviceTypes = [
  { value: 'towTruck', label: 'Çekici', icon: 'tow-truck', description: 'Araç çekme ve kurtarma' },
  { value: 'crane', label: 'Vinç', icon: 'crane', description: 'Vinç ve kaldırma hizmeti' },
  { value: 'roadAssistance', label: 'Yol Yardım', icon: 'car-wrench', description: 'Lastik, akü, yol yardımı' },
  { value: 'nakliye', label: 'Nakliye', icon: 'truck-delivery', description: 'Ev ve yük taşıma' },
  { value: 'servis', label: 'Servis', icon: 'bus-multiple', description: 'Personel / okul servisi' },
  { value: 'vip', label: 'VIP Taşıma', icon: 'car-estate', description: 'VIP / lüks transfer' },
];

export default function PhoneNumberScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
  // Selective selector — gereksiz re-render'ı engeller
  const savePhoneNumber = useRegistrationDataStore((s) => s.setPhoneNumber);
  const setSelectedVehicleTypes = useRegistrationDataStore((s) => s.setSelectedVehicleTypes);
  const setTransferSubTypes = useRegistrationDataStore((s) => s.setTransferSubTypes);
  const setReferralCode = useRegistrationDataStore((s) => s.setReferralCode);

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<FkCountry>({
    code: 'TR',
    dialCode: '+90',
    flag: '🇹🇷',
    name: 'Türkiye',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [loading, setLoading] = useState(false);
  const [registeredModalVisible, setRegisteredModalVisible] = useState(false);

  // Referans kodu (opsiyonel) — Crockford-tarzı [A-HJ-NP-Z2-9]{8}, case-insensitive
  // Backend register sırasında geçersiz kodu silent ignore eder; bu yüzden Uygula
  // sadece client-side format kontrolü + store'a yazma yapar (network çağrısı yok).
  const REFERRAL_CHARSET = /[A-HJ-NP-Z2-9]/g;
  const REFERRAL_FORMAT = /^[A-HJ-NP-Z2-9]{8}$/;
  const [referralInput, setReferralInput] = useState('');
  const [referralStatus, setReferralStatus] = useState<'idle' | 'applied' | 'error'>('idle');
  const [referralError, setReferralError] = useState('');

  const toggleService = (serviceValue: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
    setServiceError('');
  };

  const handleReferralChange = (raw: string) => {
    // Sadece izinli karakterler, büyük harf, max 8
    const cleaned = raw.toUpperCase().match(REFERRAL_CHARSET)?.join('').slice(0, 8) ?? '';
    setReferralInput(cleaned);
    // Düzenlemede önceki "uygulandı" / hata feedback'ini sıfırla ve store'dan da temizle
    if (referralStatus !== 'idle') {
      setReferralStatus('idle');
      setReferralError('');
      setReferralCode('');
    }
  };

  const handleApplyReferral = () => {
    if (!REFERRAL_FORMAT.test(referralInput)) {
      setReferralStatus('error');
      setReferralError('Geçersiz format. Referans kodu 8 karakter olmalı.');
      setReferralCode('');
      return;
    }
    setReferralStatus('applied');
    setReferralError('');
    setReferralCode(referralInput);
  };

  const handleContinue = async () => {
    // Klavye açıkken FkModal'ın kullanılabilir yüksekliği daraldığı için
    // pre-check modal'ı alttan kesiliyordu — devam etmeden klavyeyi kapat.
    Keyboard.dismiss();

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

    // Hizmet seçimi kontrolü
    if (selectedServices.length === 0) {
      setServiceError('En az bir hizmet seçmelisiniz.');
      return;
    }

    // Ülke kodlu formatı kaydet (örn: +905551234567)
    const fullNumber = `${selectedCountry.dialCode}${phoneNumber}`;
    savePhoneNumber(fullNumber);

    // Seçilen servisleri backend formatına çevir:
    // - 'nakliye' -> homeToHomeMoving + cityToCity
    // - 'servis'/'vip' -> tek bir 'transfer' ServiceType'ı (tekilleştirilmiş);
    //   seçilen alt tip(ler) ayrıca transferSubTypes olarak taşınır
    const vehicleTypesForStore: ServiceType[] = [];
    const transferSubTypes: TransferSubType[] = [];
    selectedServices.forEach(service => {
      if (service === 'nakliye') {
        vehicleTypesForStore.push('homeToHomeMoving');
        vehicleTypesForStore.push('cityToCity');
      } else if (service === 'servis' || service === 'vip') {
        transferSubTypes.push(service === 'servis' ? 'organization' : 'vip');
        if (!vehicleTypesForStore.includes('transfer')) {
          vehicleTypesForStore.push('transfer');
        }
      } else {
        vehicleTypesForStore.push(service as ServiceType);
      }
    });
    setSelectedVehicleTypes(vehicleTypesForStore);
    setTransferSubTypes(transferSubTypes);

    // OTP gönder
    setLoading(true);
    setError('');

    try {
      // Pre-check: telefon zaten sürücü olarak kayıtlıysa SMS göndermeden modal aç.
      // Network/4xx/5xx durumunda fail-open: kontrol başarısız olsa bile mevcut OTP akışı devam eder.
      try {
        const checkResult = await authAPI.checkPhoneRegistered(fullNumber);
        if (checkResult.has_driver_role) {
          setLoading(false);
          setRegisteredModalVisible(true);
          return;
        }
      } catch (checkError) {
        logger.warn('auth', 'checkPhoneRegistered failed, continuing with OTP send');
      }

      await authAPI.sendOTP(fullNumber);

      // OTP doğrulama ekranına git
      navigation.navigate('OTPVerification');
    } catch (error: any) {
      logger.error('auth', 'PhoneNumber.sendOTP failure', { status: error?.response?.status });

      let errorMessage = 'SMS gönderilemedi. Lütfen tekrar deneyin.';

      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          // error bir obje olabilir: {phoneNumber: ["mesaj1", "mesaj2"]}
          if (typeof errorData.error === 'object' && errorData.error !== null) {
            // Object.values ile tüm mesajları al ve birleştir
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
    } finally {
      setLoading(false);
    }
  };

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
          progress={0.2}
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.content}
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
              Telefon Numaranız
            </Text>
            <Text variant="bodyMedium" style={styles.subtitle}>
              Kayıt olmak için telefon numaranızı girin
            </Text>

            <FkPhoneInput
              value={phoneNumber}
              onChange={(text) => {
                setPhoneNumber(text);
                setError('');
              }}
              onChangeCountry={(country) => setSelectedCountry(country)}
              label="Telefon Numarası"
              required
            />

            {error ? (
              <FkFormError
                error={error}
                withIcon
                style={{ justifyContent: 'center', marginLeft: 0, marginBottom: 8 }}
              />
            ) : null}

            {/* Hizmet Seçimi - Service Selection */}
            <View style={styles.serviceSection}>
              <Text variant="titleMedium" style={styles.serviceTitle}>
                Hizmet Seçiniz *
              </Text>
              <Text variant="bodySmall" style={styles.serviceSubtitle}>
                Vermek istediğiniz hizmetleri seçin (Birden fazla seçebilirsiniz)
              </Text>

              <View style={styles.serviceGrid}>
                {serviceTypes.map((service) => {
                  const isSelected = selectedServices.includes(service.value);
                  return (
                    <TouchableOpacity
                      key={service.value}
                      style={[
                        styles.serviceCard,
                        {
                          backgroundColor: isSelected ? SERVICE_COLOR : SERVICE_BG_COLOR,
                          borderColor: isSelected ? SERVICE_COLOR : 'transparent',
                          borderWidth: 2,
                        },
                      ]}
                      onPress={() => toggleService(service.value)}
                      activeOpacity={0.7}
                    >
                      <View style={styles.serviceCardContent}>
                        <MaterialCommunityIcons
                          name={service.icon}
                          size={28}
                          color={isSelected ? '#fff' : SERVICE_COLOR}
                        />
                        <Text
                          style={[
                            styles.serviceCardLabel,
                            { color: isSelected ? '#fff' : '#333' },
                          ]}
                        >
                          {service.label}
                        </Text>
                        <Text
                          style={[
                            styles.serviceCardDescription,
                            { color: isSelected ? 'rgba(255,255,255,0.85)' : appColors.text.secondary },
                          ]}
                          numberOfLines={2}
                        >
                          {service.description}
                        </Text>
                      </View>
                      {isSelected && (
                        <View style={styles.checkmark}>
                          <MaterialCommunityIcons name="check-circle" size={20} color="#fff" />
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>

              {serviceError ? (
                <FkFormError
                  error={serviceError}
                  withIcon
                  style={{ justifyContent: 'center', marginLeft: 0, marginTop: 8 }}
                />
              ) : null}
            </View>

            {/* Referans Kodu - Opsiyonel, hizmet tipi seçiminin altında */}
            <View style={styles.referralSection}>
              <Text variant="titleMedium" style={styles.referralTitle}>
                Referans Kodun Var mı? (Opsiyonel)
              </Text>
              <Text variant="bodySmall" style={styles.referralSubtitle}>
                Seni davet eden sürücünün kodunu gir ve Uygula'ya bas
              </Text>
              <View style={styles.referralRow}>
                <View style={styles.referralInputWrapper}>
                  <FkTextInput
                    value={referralInput}
                    onChange={handleReferralChange}
                    label="Referans Kodu"
                    autoCapitalize="characters"
                    autoCorrect={false}
                    maxLength={8}
                    error={referralStatus === 'error' ? referralError : undefined}
                    helperText={referralStatus === 'applied' ? '✓ Kod uygulandı' : undefined}
                    helperColor={referralStatus === 'applied' ? '#26a69a' : undefined}
                  />
                </View>
                <FkButton
                  variant={referralStatus === 'applied' ? 'success' : 'secondary'}
                  onPress={handleApplyReferral}
                  disabled={referralInput.length === 0 || referralStatus === 'applied'}
                  size="md"
                  style={styles.referralButton}
                  contentStyle={styles.referralButtonContent}
                >
                  {referralStatus === 'applied' ? 'Uygulandı' : 'Uygula'}
                </FkButton>
              </View>
            </View>

            <FkButton
              onPress={handleContinue}
              disabled={phoneNumber.length < 10 || selectedServices.length === 0 || loading}
              loading={loading}
              fullWidth
              style={styles.button}
            >
              {loading ? 'Kod Gönderiliyor...' : 'Devam Et'}
            </FkButton>

            <FkButton variant="ghost" onPress={() => navigation.navigate('PhoneAuth')} fullWidth>
              Zaten hesabınız var mı? Giriş yapın
            </FkButton>
          </Card.Content>
        </Card>
      </ScrollView>

      <AlreadyRegisteredModal
        visible={registeredModalVisible}
        onDismiss={() => setRegisteredModalVisible(false)}
        onLogin={() => {
          setRegisteredModalVisible(false);
          navigation.navigate('PhoneAuth');
        }}
      />
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
    paddingBottom: 40,
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
  serviceSection: {
    marginTop: 16,
    marginBottom: 8,
  },
  serviceTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  serviceSubtitle: {
    opacity: 0.7,
    marginBottom: 12,
    fontSize: 12,
  },
  serviceGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  serviceCard: {
    width: '48%',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
    minHeight: 100,
    position: 'relative',
  },
  serviceCardContent: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  serviceCardLabel: {
    fontSize: 14,
    fontWeight: 'bold',
    marginTop: 8,
    textAlign: 'center',
  },
  serviceCardDescription: {
    fontSize: 11,
    marginTop: 4,
    textAlign: 'center',
    lineHeight: 14,
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  referralSection: {
    marginTop: 8,
    marginBottom: 8,
  },
  referralTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  referralSubtitle: {
    opacity: 0.7,
    marginBottom: 12,
    fontSize: 12,
  },
  referralRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  referralInputWrapper: {
    flex: 1,
  },
  referralButton: {
    minWidth: 96,
  },
  // Butonu input kutusuyla (MD3 flat = 56px) aynı yükseklikte tutar; satır
  // flex-start olduğu için üstten hizalanır ve label dikeyde ortalanır.
  referralButtonContent: {
    height: 56,
  },
});

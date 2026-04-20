import React, { useState } from 'react';
import { View, StyleSheet, KeyboardAvoidingView, Platform, ScrollView, Image, Alert, TouchableOpacity } from 'react-native';
import { Button, Card, Text, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore, ServiceType } from '../../store/useRegistrationDataStore';
import { authAPI } from '../../api';
import PhoneInput from '../../components/PhoneInput';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'PhoneNumber'>;

interface Country {
  code: string;
  dialCode: string;
  flag: string;
  name: string;
}

// Hizmet tipleri - Service types (4 ana hizmet türü)
// Tüm hizmetler için aynı renk tonu kullanılıyor (tema primary rengi)
const SERVICE_COLOR = '#26a69a';  // Ana turkuaz
const SERVICE_BG_COLOR = '#e0f2f1';  // Açık turkuaz

const serviceTypes = [
  { value: 'towTruck', label: 'Çekici', icon: 'tow-truck', description: 'Araç çekme ve kurtarma' },
  { value: 'crane', label: 'Vinç', icon: 'crane', description: 'Vinç ve kaldırma hizmeti' },
  { value: 'roadAssistance', label: 'Yol Yardım', icon: 'car-wrench', description: 'Lastik, akü, yol yardımı' },
  { value: 'nakliye', label: 'Nakliye', icon: 'truck-delivery', description: 'Ev ve yük taşıma' },
  { value: 'transfer', label: 'Transfer', icon: 'transfer', description: 'VIP ve servis araçları' },
];

export default function PhoneNumberScreen({ navigation }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
  const { setPhoneNumber: savePhoneNumber, setSelectedVehicleTypes } = useRegistrationDataStore();

  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState<Country>({
    code: 'TR',
    dialCode: '+90',
    flag: '🇹🇷',
    name: 'Türkiye',
  });
  const [selectedServices, setSelectedServices] = useState<string[]>([]);
  const [error, setError] = useState('');
  const [serviceError, setServiceError] = useState('');
  const [loading, setLoading] = useState(false);

  const toggleService = (serviceValue: string) => {
    setSelectedServices(prev =>
      prev.includes(serviceValue)
        ? prev.filter(s => s !== serviceValue)
        : [...prev, serviceValue]
    );
    setServiceError('');
  };

  const handleContinue = async () => {
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

    // Seçilen servisleri backend formatına çevir
    // 'nakliye' seçilmişse -> homeToHomeMoving ve cityToCity olarak kaydet
    const vehicleTypesForStore: ServiceType[] = [];
    selectedServices.forEach(service => {
      if (service === 'nakliye') {
        vehicleTypesForStore.push('homeToHomeMoving');
        vehicleTypesForStore.push('cityToCity');
      } else {
        vehicleTypesForStore.push(service as ServiceType);
      }
    });
    setSelectedVehicleTypes(vehicleTypesForStore);

    // OTP gönder
    setLoading(true);
    setError('');

    try {
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

            <PhoneInput
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text);
                setError('');
              }}
              onChangeCountry={(country) => setSelectedCountry(country)}
              label="Telefon Numarası *"
              //placeholder="555 123 45 67"
              error={!!error}
            />

            {error ? <Text style={styles.errorText}>{error}</Text> : null}

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
                        {service.icon === 'transfer' ? (
                          <View style={styles.transferIcons}>
                            <MaterialCommunityIcons
                              name="bus-side"
                              size={24}
                              color={isSelected ? '#fff' : SERVICE_COLOR}
                            />
                            <MaterialCommunityIcons
                              name="van-passenger"
                              size={24}
                              color={isSelected ? '#fff' : '#FFB300'}
                              style={{ marginLeft: 10 }}
                            />
                          </View>
                        ) : (
                          <MaterialCommunityIcons
                            name={service.icon}
                            size={28}
                            color={isSelected ? '#fff' : SERVICE_COLOR}
                          />
                        )}
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

              {serviceError ? <Text style={styles.errorText}>{serviceError}</Text> : null}
            </View>

            <Button
              mode="contained"
              onPress={handleContinue}
              disabled={phoneNumber.length < 10 || selectedServices.length === 0 || loading}
              loading={loading}
              style={styles.button}
              contentStyle={styles.buttonContent}
            >
              {loading ? 'Kod Gönderiliyor...' : 'Devam Et'}
            </Button>

            <Button
              mode="text"
              onPress={() => navigation.navigate('PhoneAuth')}
              style={styles.textButton}
            >
              Zaten hesabınız var mı? Giriş yapın
            </Button>
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
  errorText: {
    color: '#B00020',
    textAlign: 'center',
    marginTop: -8,
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
  transferIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
});

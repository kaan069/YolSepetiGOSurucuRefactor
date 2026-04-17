import React, { useState } from 'react';
import { View, StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, Modal, TouchableOpacity } from 'react-native';
import { Button, Card, Text, TextInput, useTheme, ProgressBar, IconButton, Searchbar } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { useAuthStore } from '../../store/authStore';
import { authAPI } from '../../api';
import { getCityNames, getDistrictsByCity } from '../../data/turkeyLocations';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { validateTCNumber } from '../../utils/tcValidation';
import { CONTRACTS, Contract } from '../../constants/contracts';
import ContractModal from '../../components/ContractModal';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalInfoNew'>;

interface PersonalInfo {
  firstName: string;
  lastName: string;
  tcNumber: string;
  address: string;
  city: string;
  district: string;
  password: string;
  passwordConfirm: string;
}

export default function PersonalInfoNewScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { isDarkMode, appColors, screenBg, cardBg } = useAppTheme();
  const { setPersonalInfo, data, setVerificationToken } = useRegistrationDataStore();

  // Route param'dan token al (store sync sorunu için yedek)
  const routeToken = route.params?.verificationToken;
  const { clearAll } = useVehicleStore(); // Clear vehicle store for new user
  const { setIsAuthenticated } = useAuthStore();
  const [formData, setFormData] = useState<PersonalInfo>({
    firstName: '',
    lastName: '',
    tcNumber: '',
    address: '',
    city: '',
    district: '',
    password: '',
    passwordConfirm: '',
  });
  const [errors, setErrors] = useState<Partial<PersonalInfo>>({});
  const [loading, setLoading] = useState(false);
  const [tcHelperText, setTcHelperText] = useState<string>('');
  const [tcHelperColor, setTcHelperColor] = useState<string>('#666');
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  // Modal states
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [districtModalVisible, setDistrictModalVisible] = useState(false);
  const [citySearch, setCitySearch] = useState('');
  const [districtSearch, setDistrictSearch] = useState('');

  // Contract states
  const [acceptedContracts, setAcceptedContracts] = useState<Record<string, boolean>>({});
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const contractsAccepted = CONTRACTS.every(c => acceptedContracts[c.id]);

  // Get data
  const allCities = getCityNames();
  const availableDistricts = formData.city ? getDistrictsByCity(formData.city) : [];

  // Filtered lists
  const filteredCities = citySearch
    ? allCities.filter(city => city.toLowerCase().includes(citySearch.toLowerCase()))
    : allCities;

  const filteredDistricts = districtSearch
    ? availableDistricts.filter(district => district.toLowerCase().includes(districtSearch.toLowerCase()))
    : availableDistricts;

  const updateField = (field: keyof PersonalInfo) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }
  };

  const handleTCNumberChange = (value: string) => {
    // Only allow digits
    const cleanedValue = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, tcNumber: cleanedValue }));

    // Clear error if exists
    if (errors.tcNumber) {
      setErrors(prev => ({ ...prev, tcNumber: undefined }));
    }

    // Real-time validation feedback
    if (cleanedValue.length === 0) {
      setTcHelperText('');
      setTcHelperColor('#666');
    } else if (cleanedValue.length < 11) {
      setTcHelperText(`${cleanedValue.length}/11 hane`);
      setTcHelperColor('#666');
    } else if (cleanedValue.length === 11) {
      const tcValidation = validateTCNumber(cleanedValue);
      if (tcValidation.isValid) {
        setTcHelperText('✓ Geçerli TC Kimlik No');
        setTcHelperColor('#4caf50');
      } else {
        setTcHelperText(tcValidation.error || 'Geçersiz TC Kimlik No');
        setTcHelperColor('#f44336');
      }
    }
  };

  const handleCitySelect = (city: string) => {
    setFormData(prev => ({ ...prev, city, district: '' })); // Reset district when city changes
    if (errors.city) {
      setErrors(prev => ({ ...prev, city: undefined }));
    }
    setCityModalVisible(false);
    setCitySearch('');
  };

  const handleDistrictSelect = (district: string) => {
    setFormData(prev => ({ ...prev, district }));
    if (errors.district) {
      setErrors(prev => ({ ...prev, district: undefined }));
    }
    setDistrictModalVisible(false);
    setDistrictSearch('');
  };

  const handleContractPress = (contract: Contract) => {
    setSelectedContract(contract);
    setContractModalVisible(true);
  };

  // Kayıt sonrası yönlendirme helper fonksiyonu
  // Her zaman VehicleTypeSelectionScreen'e yönlendir (provider_type seçimi için)
  const navigateAfterRegistration = () => {
    console.log('🎯 Kayıt başarılı, VehicleTypeSelection ekranına yönlendiriliyor...');
    navigation.reset({
      index: 0,
      routes: [{ name: 'VehicleTypeSelection' }],
    });
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<PersonalInfo> = {};

    if (!formData.firstName.trim()) newErrors.firstName = 'Ad gerekli';
    if (!formData.lastName.trim()) newErrors.lastName = 'Soyad gerekli';

    // TC Kimlik No validation with real algorithm
    if (!formData.tcNumber.trim()) {
      newErrors.tcNumber = 'TC Kimlik No gerekli';
    } else {
      const tcValidation = validateTCNumber(formData.tcNumber);
      if (!tcValidation.isValid) {
        newErrors.tcNumber = tcValidation.error || 'Geçersiz TC Kimlik No';
      }
    }

    if (!formData.city.trim()) newErrors.city = 'İl gerekli';
    if (!formData.district.trim()) newErrors.district = 'İlçe gerekli';
    if (!formData.address.trim()) newErrors.address = 'Adres gerekli';

    // Contract validation
    if (!contractsAccepted) {
      Alert.alert('Uyarı', 'Devam etmek için sözleşmeleri kabul etmelisiniz.');
      return false;
    }

    if (!formData.password.trim()) newErrors.password = 'PIN gerekli';
    else if (formData.password.length !== 6) newErrors.password = 'PIN 6 haneli olmalı';
    else if (!/^\d{6}$/.test(formData.password)) newErrors.password = 'PIN sadece rakam içermeli';
    if (!formData.passwordConfirm.trim()) newErrors.passwordConfirm = 'PIN onayı gerekli';
    else if (formData.password !== formData.passwordConfirm) newErrors.passwordConfirm = 'PIN\'ler eşleşmiyor';

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleContinue = async () => {
    if (!validateForm()) return;

    setLoading(true);

    try {
      // Token'ı al - önce store'dan, yoksa route param'dan
      const verificationToken = data.verificationToken || routeToken;

      // Debug log - tüm registration data'yı göster
      console.log('📋 Registration Data:', {
        phoneNumber: data.phoneNumber,
        storeToken: data.verificationToken ? data.verificationToken.substring(0, 30) + '...' : 'BOŞ/YOK',
        routeToken: routeToken ? routeToken.substring(0, 30) + '...' : 'BOŞ/YOK',
        usingToken: verificationToken ? verificationToken.substring(0, 30) + '...' : 'BOŞ/YOK',
        vehicleTypes: data.vehicleTypes,
        selectedVehicleTypes: data.selectedVehicleTypes,
      });

      // Verification token kontrolü
      if (!verificationToken) {
        console.error('❌ Verification token yok! store:', data.verificationToken, 'route:', routeToken);
        Alert.alert('Hata', 'Telefon doğrulaması yapılmamış. Lütfen kayıt işlemini baştan başlatın.');
        navigation.navigate('PhoneNumber');
        return;
      }

      // Eğer route'dan token aldıysak ve store'da yoksa, store'a da kaydet
      if (!data.verificationToken && routeToken) {
        console.log('📝 Token route param\'dan alındı, store\'a kaydediliyor...');
        setVerificationToken(routeToken);
      }

      console.log('✅ Verification token mevcut, kayıt işlemi başlıyor...');

      // API'ye kayıt isteği gönder (user_type liste olarak)
      // Not: birth_date ve contracts_accepted backend'de yok, email de yok
      const response = await authAPI.register({
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone_number: data.phoneNumber,
        tc_no: formData.tcNumber,
        business_address: formData.address,
        business_address_il: formData.city,
        business_address_ilce: formData.district,
        password: formData.password,
        password_confirm: formData.passwordConfirm,
        user_type: data.vehicleTypes || ['towTruck', 'crane'],  // Telefon ekranında seçilen hizmetler (backend format)
        provider_type: data.providerType || 'individual',  // Şahıs / Firma seçimi
        verification_token: verificationToken,  // OTP doğrulama sonrası alınan token (store veya route param'dan)
      });

      console.log('✅ Kayıt başarılı - user_type:', data.vehicleTypes);

      // Store'a kaydet
      setPersonalInfo({
        firstName: formData.firstName,
        lastName: formData.lastName,
        tcNumber: formData.tcNumber,
        address: formData.address,
        city: formData.city,
        district: formData.district,
        password: formData.password,
        passwordConfirm: formData.passwordConfirm,
      });

      // Eski kullanıcının araçlarını temizle
      clearAll();

      // Başarı mesajı ve araç kaydı - Kullanıcı araç eklemek zorunda
      // Seçilen hizmete göre yönlendirme (helper fonksiyonu kullan)
      navigateAfterRegistration();
    } catch (error: any) {
      console.error('Registration error:', error);

      // Timeout hatası kontrolü - kayıt başarılı olmuş olabilir
      // 504: Nginx gateway timeout, 502: Bad gateway, 408: Request timeout
      const isTimeoutError = error.code === 'ECONNABORTED' ||
                             error.message?.includes('timeout') ||
                             error.message?.includes('Timeout') ||
                             error.response?.status === 504 ||
                             error.response?.status === 502 ||
                             error.response?.status === 408;

      if (isTimeoutError) {
        console.log('⏱️ Timeout/Gateway hatası tespit edildi (status:', error.response?.status || 'N/A', '), kayıt durumu kontrol ediliyor...');

        // Kayıt başarılı olmuş olabilir, login deneyelim
        try {
          console.log('🔐 Login denemesi yapılıyor...');
          const loginResponse = await authAPI.login({
            phone_number: data.phoneNumber,
            password: formData.password,
          });

          if (loginResponse && loginResponse.user) {
            console.log('✅ Login başarılı - kayıt tamamlanmış, yönlendirme yapılıyor');

            // Store'a kaydet
            setPersonalInfo({
              firstName: formData.firstName,
              lastName: formData.lastName,
              tcNumber: formData.tcNumber,
              address: formData.address,
              city: formData.city,
              district: formData.district,
              password: formData.password,
              passwordConfirm: formData.passwordConfirm,
            });

            // Eski kullanıcının araçlarını temizle
            clearAll();

            // Yönlendirmeyi yap
            navigateAfterRegistration();
            return; // finally'den önce çık
          }
        } catch (loginError: any) {
          console.error('❌ Login denemesi başarısız:', loginError);
          // Login başarısız - gerçekten kayıt olmamış demek
        }

        // Login da başarısız olduysa timeout mesajı göster
        Alert.alert(
          'Bağlantı Sorunu',
          'Kayıt işlemi zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.'
        );
        return;
      }

      // Backend'den gelen hata mesajını parse et
      let errorMessage = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';

      if (error?.response?.data) {
        const errorData = error.response.data;

        // Eğer object ise (field bazlı hatalar)
        if (typeof errorData === 'object' && !errorData.message && !errorData.error) {
          // Her field için hata mesajlarını birleştir
          const errorMessages: string[] = [];
          Object.keys(errorData).forEach(field => {
            const fieldErrors = errorData[field];
            if (Array.isArray(fieldErrors)) {
              errorMessages.push(...fieldErrors);
            } else if (typeof fieldErrors === 'string') {
              errorMessages.push(fieldErrors);
            }
          });
          if (errorMessages.length > 0) {
            errorMessage = errorMessages.join('\n');
          }
        } else if (errorData.message) {
          errorMessage = errorData.message;
        } else if (errorData.error) {
          errorMessage = errorData.error;
        } else if (typeof errorData === 'string') {
          errorMessage = errorData;
        }
      }

      Alert.alert('Hata', errorMessage);
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
          progress={0.5}
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Kişisel Bilgiler
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Hizmet sağlamak için kişisel bilgilerinize ihtiyacımız var
          </Text>
        </View>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Temel Bilgiler
            </Text>

            <View style={styles.row}>
              <TextInput
                label="Ad *"
                value={formData.firstName}
                onChangeText={updateField('firstName')}
                style={[styles.halfInput, styles.inputLeft]}
                error={!!errors.firstName}
              />
              <TextInput
                label="Soyad *"
                value={formData.lastName}
                onChangeText={updateField('lastName')}
                style={[styles.halfInput, styles.inputRight]}
                error={!!errors.lastName}
              />
            </View>

            <TextInput
              label="TC Kimlik Numarası *"
              value={formData.tcNumber}
              onChangeText={handleTCNumberChange}
              keyboardType="numeric"
              maxLength={11}
              style={styles.input}
              error={!!errors.tcNumber}
              right={
                formData.tcNumber.length === 11 && tcHelperColor === '#4caf50' ? (
                  <TextInput.Icon icon="check-circle" color="#4caf50" />
                ) : undefined
              }
            />
            {errors.tcNumber ? (
              <Text style={styles.errorText}>{errors.tcNumber}</Text>
            ) : tcHelperText ? (
              <Text style={[styles.helperText, { color: tcHelperColor }]}>{tcHelperText}</Text>
            ) : null}
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Adres Bilgileri
            </Text>

            <View style={styles.row}>
              {/* İl Seçici */}
              <TouchableOpacity
                style={[styles.halfInput, styles.inputLeft]}
                onPress={() => setCityModalVisible(true)}
              >
                <View style={[styles.dropdownInput, errors.city && styles.dropdownInputError]}>
                  <Text style={[styles.dropdownLabel, formData.city && styles.dropdownLabelActive]}>
                    İl *
                  </Text>
                  <Text style={styles.dropdownValue}>
                    {formData.city || 'Seçiniz'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={appColors.text.secondary} style={styles.dropdownIcon} />
                </View>
              </TouchableOpacity>

              {/* İlçe Seçici */}
              <TouchableOpacity
                style={[styles.halfInput, styles.inputRight]}
                onPress={() => {
                  if (!formData.city) {
                    Alert.alert('Uyarı', 'Önce il seçiniz');
                  } else {
                    setDistrictModalVisible(true);
                  }
                }}
                disabled={!formData.city}
              >
                <View style={[
                  styles.dropdownInput,
                  errors.district && styles.dropdownInputError,
                  !formData.city && styles.dropdownInputDisabled
                ]}>
                  <Text style={[styles.dropdownLabel, formData.district && styles.dropdownLabelActive]}>
                    İlçe *
                  </Text>
                  <Text style={[styles.dropdownValue, !formData.city && styles.dropdownValueDisabled]}>
                    {formData.district || 'Seçiniz'}
                  </Text>
                  <MaterialCommunityIcons name="chevron-down" size={24} color={appColors.text.secondary} style={styles.dropdownIcon} />
                </View>
              </TouchableOpacity>
            </View>

            {errors.city && (
              <Text style={styles.errorText}>{errors.city}</Text>
            )}
            {errors.district && (
              <Text style={styles.errorText}>{errors.district}</Text>
            )}

            <TextInput
              label="Adres *"
              value={formData.address}
              onChangeText={updateField('address')}
              multiline
              numberOfLines={3}
              style={styles.input}
              error={!!errors.address}
            />
            {errors.address && (
              <Text style={styles.errorText}>{errors.address}</Text>
            )}
          </Card.Content>
        </Card>

        {/* Sözleşmeler - Contracts Section */}
        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              Sözleşmeler
            </Text>

            <Text variant="bodySmall" style={[styles.contractsDescription, { color: appColors.text.secondary }]}>
              Devam etmek için aşağıdaki sözleşmeleri okuyup en alta kaydırarak onaylamanız gerekmektedir.
            </Text>

            {/* Contract Cards */}
            <View style={styles.contractsList}>
              {CONTRACTS.map((contract) => (
                <TouchableOpacity
                  key={contract.id}
                  style={[
                    styles.contractCard,
                    acceptedContracts[contract.id] && styles.contractCardAccepted,
                  ]}
                  onPress={() => handleContractPress(contract)}
                  activeOpacity={0.7}
                >
                  <View style={styles.contractCardContent}>
                    <MaterialCommunityIcons
                      name={contract.icon as any}
                      size={24}
                      color={acceptedContracts[contract.id] ? '#4caf50' : '#26a69a'}
                      style={styles.contractIcon}
                    />
                    <View style={{ flex: 1 }}>
                      <Text variant="bodyMedium" style={styles.contractTitle} numberOfLines={2}>
                        {contract.title}
                      </Text>
                      <Text variant="bodySmall" style={{ color: acceptedContracts[contract.id] ? '#4caf50' : '#f44336', marginTop: 4 }}>
                        {acceptedContracts[contract.id] ? 'Onaylandı' : 'Onay bekleniyor'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={acceptedContracts[contract.id] ? 'check-circle' : 'chevron-right'}
                    size={24}
                    color={acceptedContracts[contract.id] ? '#4caf50' : appColors.text.secondary}
                  />
                </TouchableOpacity>
              ))}
            </View>
          </Card.Content>
        </Card>

        <Card style={styles.card}>
          <Card.Content style={styles.cardContent}>
            <Text variant="titleMedium" style={styles.sectionTitle}>
              PIN Oluştur
            </Text>

            <Text variant="bodySmall" style={[styles.pinDescription, { color: appColors.text.secondary }]}>
              Uygulamaya giriş için 6 haneli bir PIN belirleyin
            </Text>

            <TextInput
              label="PIN *"
              value={formData.password}
              onChangeText={updateField('password')}
              secureTextEntry={!showPassword}
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
              error={!!errors.password}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPassword ? "eye-off" : "eye"}
                  onPress={() => setShowPassword(!showPassword)}
                />
              }
            />
            {errors.password && (
              <Text style={styles.errorText}>{errors.password}</Text>
            )}

            <TextInput
              label="PIN Onayı *"
              value={formData.passwordConfirm}
              onChangeText={updateField('passwordConfirm')}
              secureTextEntry={!showPasswordConfirm}
              keyboardType="numeric"
              maxLength={6}
              style={styles.input}
              error={!!errors.passwordConfirm}
              left={<TextInput.Icon icon="lock" />}
              right={
                <TextInput.Icon
                  icon={showPasswordConfirm ? "eye-off" : "eye"}
                  onPress={() => setShowPasswordConfirm(!showPasswordConfirm)}
                />
              }
            />
            {errors.passwordConfirm && (
              <Text style={styles.errorText}>{errors.passwordConfirm}</Text>
            )}
          </Card.Content>
        </Card>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
          >
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol ve Devam Et'}
          </Button>
        </View>
      </ScrollView>

      {/* İl Seçim Modal */}
      <Modal
        visible={cityModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>İl Seçiniz</Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setCityModalVisible(false)}
              />
            </View>

            <Searchbar
              placeholder="İl ara..."
              onChangeText={setCitySearch}
              value={citySearch}
              style={styles.searchBar}
            />

            {filteredCities.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: appColors.text.secondary }}>İl bulunamadı</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {filteredCities.map((city, index) => (
                  <TouchableOpacity
                    key={`city-${index}-${city}`}
                    style={[
                      styles.modalItem,
                      formData.city === city && [styles.modalItemSelected, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]
                    ]}
                    onPress={() => handleCitySelect(city)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      formData.city === city && styles.modalItemTextSelected
                    ]}>
                      {city}
                    </Text>
                    {formData.city === city && (
                      <MaterialCommunityIcons name="check" size={24} color="#26a69a" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* İlçe Seçim Modal */}
      <Modal
        visible={districtModalVisible}
        transparent
        animationType="slide"
        onRequestClose={() => setDistrictModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
            <View style={styles.modalHeader}>
              <Text variant="titleLarge" style={styles.modalTitle}>
                İlçe Seçiniz - {formData.city}
              </Text>
              <IconButton
                icon="close"
                size={24}
                onPress={() => setDistrictModalVisible(false)}
              />
            </View>

            <Searchbar
              placeholder="İlçe ara..."
              onChangeText={setDistrictSearch}
              value={districtSearch}
              style={styles.searchBar}
            />

            {filteredDistricts.length === 0 ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: appColors.text.secondary }}>İlçe bulunamadı</Text>
              </View>
            ) : (
              <ScrollView style={styles.modalList}>
                {filteredDistricts.map((district, index) => (
                  <TouchableOpacity
                    key={`district-${index}-${district}`}
                    style={[
                      styles.modalItem,
                      formData.district === district && [styles.modalItemSelected, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]
                    ]}
                    onPress={() => handleDistrictSelect(district)}
                  >
                    <Text style={[
                      styles.modalItemText,
                      formData.district === district && styles.modalItemTextSelected
                    ]}>
                      {district}
                    </Text>
                    {formData.district === district && (
                      <MaterialCommunityIcons name="check" size={24} color="#26a69a" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
            )}
          </View>
        </View>
      </Modal>

      {/* Contract Modal */}
      <ContractModal
        visible={contractModalVisible}
        contract={selectedContract}
        onDismiss={() => setContractModalVisible(false)}
        showAcceptButton={!!(selectedContract && !acceptedContracts[selectedContract.id])}
        onAccept={() => {
          if (selectedContract) {
            setAcceptedContracts(prev => ({ ...prev, [selectedContract.id]: true }));
            setContractModalVisible(false);
          }
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
  content: {
    flex: 1,
    padding: 20,
  },
  titleContainer: {
    marginBottom: 24,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  card: {
    borderRadius: 16,
    elevation: 2,
    marginBottom: 16,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#26a69a',
  },
  row: {
    flexDirection: 'row',
    gap: 12,
  },
  input: {
    marginBottom: 16,
  },
  halfInput: {
    flex: 1,
    marginBottom: 16,
  },
  inputLeft: {
    marginRight: 6,
  },
  inputRight: {
    marginLeft: 6,
  },
  dropdownInput: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 4,
    padding: 12,
    minHeight: 56,
    justifyContent: 'center',
  },
  dropdownInputError: {
    borderColor: '#B00020',
  },
  dropdownInputDisabled: {
    backgroundColor: '#f5f5f5',
    opacity: 0.6,
  },
  dropdownLabel: {
    fontSize: 12,
    marginBottom: 4,
  },
  dropdownLabelActive: {
    color: '#26a69a',
  },
  dropdownValue: {
    fontSize: 16,
    color: '#000',
  },
  dropdownValueDisabled: {
    color: '#999',
  },
  dropdownIcon: {
    position: 'absolute',
    right: 12,
    top: '50%',
    marginTop: -12,
  },
  errorText: {
    color: '#B00020',
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
  },
  helperText: {
    fontSize: 12,
    marginTop: -12,
    marginBottom: 12,
    marginLeft: 4,
    fontWeight: '500',
  },
  buttonContainer: {
    paddingBottom: 20,
  },
  continueButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    height: '80%',
    paddingBottom: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
  modalTitle: {
    fontWeight: 'bold',
    color: '#26a69a',
  },
  searchBar: {
    margin: 16,
    elevation: 0,
  },
  modalList: {
    maxHeight: 500,
  },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemSelected: {
  },
  modalItemText: {
    fontSize: 16,
    color: '#000',
  },
  modalItemTextSelected: {
    fontWeight: 'bold',
    color: '#26a69a',
  },
  contractsDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  pinDescription: {
    marginBottom: 16,
    lineHeight: 20,
  },
  contractsList: {
    marginBottom: 16,
  },
  contractCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#f5f5f5',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: '#e0e0e0',
  },
  contractCardAccepted: {
    borderColor: '#4caf50',
    backgroundColor: '#f0faf0',
  },
  contractCardContent: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  contractIcon: {
    marginRight: 12,
  },
  contractTitle: {
    flex: 1,
    fontWeight: '500',
    color: '#333',
  },
});

// Profil Düzenleme Ekranı - Edit Profile Screen
// Bu ekran kullanıcının kişisel bilgilerini düzenlemesini sağlar
// This screen allows users to edit their personal information
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, KeyboardAvoidingView, Platform, Alert, ActivityIndicator, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, TextInput, useTheme } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import authAPI from '../../api/auth';
import { User } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import { validateTCNumber } from '../../utils/tcValidation';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

export default function EditProfileScreen({ navigation }: Props) {
  const theme = useTheme();
  const { screenBg, cardBg, isDarkMode, appColors } = useAppTheme();
  const { currentUser, updateUserProfile } = useAuthStore();

  // State'ler - States
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // Form state'leri - Form states
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    tcNo: '',
    businessAddress: '',
    businessAddressIl: '',
    businessAddressIlce: '',
  });

  // Validation error state'leri - Validation error states
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [tcHelperText, setTcHelperText] = useState<string>('');
  const [tcHelperColor, setTcHelperColor] = useState<string>('#666');

  // API'den kullanıcı profil bilgilerini yükle - Load user profile from API
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getProfile();
        setApiUser(response.user);

        // Form'u API'den gelen verilerle doldur - Fill form with API data
        setFormData({
          firstName: response.user.first_name || '',
          lastName: response.user.last_name || '',
          phoneNumber: response.user.phone_number || '',
          tcNo: response.user.tc_no || '',
          businessAddress: response.user.business_address || '',
          businessAddressIl: response.user.business_address_il || '',
          businessAddressIlce: response.user.business_address_ilce || '',
        });
      } catch (error) {
        logger.error('general', 'Error loading user profile');
        Alert.alert('Hata', 'Profil bilgileri yüklenirken bir hata oluştu.');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Alan güncelleme fonksiyonu - Field update function
  const updateField = (field: keyof typeof formData) => (value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Hata varsa temizle - Clear error if exists
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  // TC Kimlik No özel handler - TC Number special handler
  const handleTCNumberChange = (value: string) => {
    // Sadece rakamları al - Only allow digits
    const cleanedValue = value.replace(/\D/g, '');
    setFormData(prev => ({ ...prev, tcNo: cleanedValue }));

    // Hata varsa temizle - Clear error if exists
    if (errors.tcNo) {
      setErrors(prev => ({ ...prev, tcNo: '' }));
    }

    // Gerçek zamanlı doğrulama - Real-time validation
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

  // Form validasyon fonksiyonu - Form validation function
  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // İsim kontrolü - First name validation
    if (!formData.firstName.trim()) {
      newErrors.firstName = 'İsim gerekli';
    }

    // Soyisim kontrolü - Last name validation
    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Soyisim gerekli';
    }

    // Telefon numarası kontrolü - Phone number validation
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon numarası gerekli';
    } else if (formData.phoneNumber.replace(/\s/g, '').length < 10) {
      newErrors.phoneNumber = 'Geçerli bir telefon numarası girin';
    }

    // TC Kimlik No kontrolü (opsiyonel ama doldurulmuşsa geçerli olmalı) - TC Number validation (optional but must be valid if filled)
    if (formData.tcNo.trim()) {
      const tcValidation = validateTCNumber(formData.tcNo);
      if (!tcValidation.isValid) {
        newErrors.tcNo = tcValidation.error || 'Geçersiz TC Kimlik No';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Profil kaydetme fonksiyonu - Save profile function
  const handleSaveProfile = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setLoading(true);

      // API'ye güncelleme isteği gönder - Send update request to API
      await authAPI.updateProfile({
        first_name: formData.firstName.trim(),
        last_name: formData.lastName.trim(),
        phone_number: formData.phoneNumber.trim(),
        tc_no: formData.tcNo.trim(),
        business_address: formData.businessAddress.trim(),
        business_address_il: formData.businessAddressIl.trim(),
        business_address_ilce: formData.businessAddressIlce.trim(),
      });

      Alert.alert(
        'Başarılı',
        'Profil bilgileriniz başarıyla güncellendi.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (error: any) {
      logger.error('general', 'Profil gncelleme hatas');
      const errorMessage = error?.response?.data?.message ||
                          error?.response?.data?.error ||
                          'Profil güncellenirken bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Loading durumunda spinner göster - Show spinner on loading
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color="#26a69a" />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Profil bilgileri yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        {/* Ortak AppBar komponenti - Common AppBar component */}
        <AppBar title="Bilgileri Düzenle" />

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Kişisel bilgiler formu - Personal information form */}
          <Card style={[styles.formCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                👤 Kişisel Bilgiler
              </Text>
              <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: appColors.text.secondary }]}>
                Profilinizde görünecek bilgileri düzenleyin
              </Text>

              {apiUser?.provider_type && (
                <TextInput
                  label="Hizmet Sağlayıcı Tipi"
                  value={apiUser.provider_type === 'company' ? 'Firma' : apiUser.provider_type === 'employee' ? 'Eleman' : 'Şahıs'}
                  disabled
                  style={styles.input}
                  left={<TextInput.Icon icon="shield-account" />}
                />
              )}

              <TextInput
                label="İsim *"
                value={formData.firstName}
                onChangeText={updateField('firstName')}
                style={styles.input}
                error={!!errors.firstName}
                placeholder="İsminiz"
                autoCapitalize="words"
              />
              {errors.firstName && <Text style={styles.errorText}>{errors.firstName}</Text>}

              <TextInput
                label="Soyisim *"
                value={formData.lastName}
                onChangeText={updateField('lastName')}
                style={styles.input}
                error={!!errors.lastName}
                placeholder="Soyisminiz"
                autoCapitalize="words"
              />
              {errors.lastName && <Text style={styles.errorText}>{errors.lastName}</Text>}

              <TextInput
                label="Telefon Numarası *"
                value={formData.phoneNumber}
                onChangeText={updateField('phoneNumber')}
                style={styles.input}
                error={!!errors.phoneNumber}
                placeholder="05XX XXX XX XX"
                keyboardType="phone-pad"
                maxLength={15}
              />
              {errors.phoneNumber && <Text style={styles.errorText}>{errors.phoneNumber}</Text>}

              <TextInput
                label="TC Kimlik No"
                value={formData.tcNo}
                onChangeText={handleTCNumberChange}
                style={styles.input}
                placeholder="XXXXXXXXXXX"
                keyboardType="numeric"
                maxLength={11}
                error={!!errors.tcNo}
                right={
                  formData.tcNo.length === 11 && tcHelperColor === '#4caf50' ? (
                    <TextInput.Icon icon="check-circle" color="#4caf50" />
                  ) : undefined
                }
              />
              {errors.tcNo ? (
                <Text style={styles.errorText}>{errors.tcNo}</Text>
              ) : tcHelperText ? (
                <Text style={[styles.helperText, { color: tcHelperColor }]}>{tcHelperText}</Text>
              ) : null}

            </Card.Content>
          </Card>

          {/* İş adresi bilgileri - Business address information */}
          <Card style={[styles.formCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                🏢 İş Adresi Bilgileri
              </Text>

              <TextInput
                label="İl"
                value={formData.businessAddressIl}
                onChangeText={updateField('businessAddressIl')}
                style={styles.input}
                placeholder="İl"
              />

              <TextInput
                label="İlçe"
                value={formData.businessAddressIlce}
                onChangeText={updateField('businessAddressIlce')}
                style={styles.input}
                placeholder="İlçe"
              />

              <TextInput
                label="Adres"
                value={formData.businessAddress}
                onChangeText={updateField('businessAddress')}
                style={styles.input}
                placeholder="İş adresiniz"
                multiline
                numberOfLines={3}
              />
            </Card.Content>
          </Card>

          {/* Bilgi notu - Information note */}
          <Card style={[styles.infoCard, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.infoText}>
                ℹ️ Telefon numaranız ve adres bilgileriniz müşterilerle iletişim kurmak için kullanılır.
              </Text>
            </Card.Content>
          </Card>

          {/* Kaydet butonu - Save button */}
          <Button
            mode="contained"
            onPress={handleSaveProfile}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            icon="content-save"
            disabled={loading}
          >
            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </Button>
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  centerContent: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  formCard: {
    marginBottom: 16,
    borderRadius: 12,
    elevation: 2,
  },
  cardContent: {
    padding: 20,
  },
  sectionTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#26a69a',
  },
  sectionSubtitle: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 12,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
  },
  helperText: {
    fontSize: 12,
    marginTop: -8,
    marginBottom: 8,
    marginLeft: 12,
    fontWeight: '500',
  },
  infoCard: {
    marginBottom: 20,
    borderRadius: 12,
  },
  infoText: {
    color: '#1565c0',
    lineHeight: 20,
  },
  saveButton: {
    marginBottom: 20,
    borderRadius: 12,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});
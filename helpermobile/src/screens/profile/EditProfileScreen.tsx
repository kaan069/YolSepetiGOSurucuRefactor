import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import authAPI from '../../api/auth';
import { User } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import {
  FkButton,
  FkFormSection,
  FkTextInput,
} from '../../components/fk';
import { validateTCNumber } from '../../utils/tcValidation';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFkTokens } from '../../hooks/useFkTokens';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'EditProfile'>;

interface FormState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  tcNo: string;
  businessAddress: string;
  businessAddressIl: string;
  businessAddressIlce: string;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  tcNo: '',
  businessAddress: '',
  businessAddressIl: '',
  businessAddressIlce: '',
};

export default function EditProfileScreen({ navigation }: Props) {
  const { screenBg, isDarkMode, appColors } = useAppTheme();
  const { tokens } = useFkTokens();

  const [apiUser, setApiUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    (async () => {
      try {
        setLoading(true);
        const response = await authAPI.getProfile();
        setApiUser(response.user);
        setForm({
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
    })();
  }, []);

  const tcHelper = useMemo(() => {
    if (!form.tcNo) return { text: '', color: tokens.colors.textSecondary };
    if (form.tcNo.length < 11)
      return { text: `${form.tcNo.length}/11 hane`, color: tokens.colors.textSecondary };
    const v = validateTCNumber(form.tcNo);
    return v.isValid
      ? { text: '✓ Geçerli TC Kimlik No', color: tokens.colors.success }
      : { text: v.error || 'Geçersiz TC Kimlik No', color: tokens.colors.error };
  }, [form.tcNo, tokens]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = 'İsim gerekli';
    if (!form.lastName.trim()) next.lastName = 'Soyisim gerekli';
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Telefon numarası gerekli';
    else if (form.phoneNumber.replace(/\s/g, '').length < 10)
      next.phoneNumber = 'Geçerli bir telefon numarası girin';

    if (form.tcNo.trim()) {
      const v = validateTCNumber(form.tcNo);
      if (!v.isValid) next.tcNo = v.error || 'Geçersiz TC Kimlik No';
    }

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSaveProfile = async () => {
    if (!validateForm()) return;
    try {
      setLoading(true);
      await authAPI.updateProfile({
        first_name: form.firstName.trim(),
        last_name: form.lastName.trim(),
        phone_number: form.phoneNumber.trim(),
        tc_no: form.tcNo.trim(),
        business_address: form.businessAddress.trim(),
        business_address_il: form.businessAddressIl.trim(),
        business_address_ilce: form.businessAddressIlce.trim(),
      });
      Alert.alert('Başarılı', 'Profil bilgileriniz başarıyla güncellendi.', [
        { text: 'Tamam', onPress: () => navigation.goBack() },
      ]);
    } catch (error: any) {
      logger.error('general', 'Profil gncelleme hatas');
      const errorMessage =
        error?.response?.data?.message ||
        error?.response?.data?.error ||
        'Profil güncellenirken bir hata oluştu.';
      Alert.alert('Hata', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, styles.centerContent, { backgroundColor: screenBg }]}
        edges={['bottom']}
      >
        <ActivityIndicator size="large" color={tokens.colors.primary} />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>
          Profil bilgileri yükleniyor...
        </Text>
      </SafeAreaView>
    );
  }

  const providerLabel = apiUser?.provider_type
    ? apiUser.provider_type === 'company'
      ? 'Firma'
      : apiUser.provider_type === 'employee'
      ? 'Eleman'
      : 'Şahıs'
    : '';

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
        <AppBar title="Bilgileri Düzenle" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          <FkFormSection
            title="👤 Kişisel Bilgiler"
            description="Profilinizde görünecek bilgileri düzenleyin"
          >
            {providerLabel ? (
              <FkTextInput
                label="Hizmet Sağlayıcı Tipi"
                value={providerLabel}
                onChange={() => {}}
                leftIcon="shield-account"
                disabled
              />
            ) : null}

            <FkTextInput
              label="İsim"
              required
              value={form.firstName}
              onChange={(v) => setField('firstName', v)}
              autoCapitalize="words"
              placeholder="İsminiz"
              error={errors.firstName}
            />

            <FkTextInput
              label="Soyisim"
              required
              value={form.lastName}
              onChange={(v) => setField('lastName', v)}
              autoCapitalize="words"
              placeholder="Soyisminiz"
              error={errors.lastName}
            />

            <FkTextInput
              label="Telefon Numarası"
              required
              value={form.phoneNumber}
              onChange={(v) => setField('phoneNumber', v)}
              keyboardType="phone-pad"
              maxLength={15}
              placeholder="05XX XXX XX XX"
              error={errors.phoneNumber}
            />

            <FkTextInput
              label="TC Kimlik No"
              value={form.tcNo}
              onChange={(v) => setField('tcNo', v.replace(/\D/g, '').slice(0, 11))}
              keyboardType="numeric"
              maxLength={11}
              placeholder="XXXXXXXXXXX"
              error={errors.tcNo}
              helperText={!errors.tcNo ? tcHelper.text : undefined}
              helperColor={tcHelper.color}
            />
          </FkFormSection>

          <FkFormSection title="🏢 İş Adresi Bilgileri">
            <FkTextInput
              label="İl"
              value={form.businessAddressIl}
              onChange={(v) => setField('businessAddressIl', v)}
              placeholder="İl"
            />
            <FkTextInput
              label="İlçe"
              value={form.businessAddressIlce}
              onChange={(v) => setField('businessAddressIlce', v)}
              placeholder="İlçe"
            />
            <FkTextInput
              label="Adres"
              value={form.businessAddress}
              onChange={(v) => setField('businessAddress', v)}
              placeholder="İş adresiniz"
              multiline
              numberOfLines={3}
            />
          </FkFormSection>

          <Card
            style={[
              styles.infoCard,
              { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' },
            ]}
          >
            <Card.Content>
              <Text variant="bodySmall" style={[styles.infoText, { color: tokens.colors.info }]}>
                ℹ️ Telefon numaranız ve adres bilgileriniz müşterilerle iletişim kurmak için
                kullanılır.
              </Text>
            </Card.Content>
          </Card>

          <FkButton
            icon="content-save"
            onPress={handleSaveProfile}
            disabled={loading}
            fullWidth
          >
            {loading ? 'Kaydediliyor...' : 'Değişiklikleri Kaydet'}
          </FkButton>
          <View style={{ height: 20 }} />
        </ScrollView>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  content: { flex: 1, padding: 16 },
  scrollContent: { paddingBottom: 100 },
  infoCard: { marginBottom: 16, borderRadius: 12 },
  infoText: { lineHeight: 20 },
});

import React, { useMemo, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import {
  IconButton,
  ProgressBar,
  Text,
  useTheme,
} from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { authAPI } from '../../api';
import { validateTCNumber } from '../../utils/tcValidation';
import { CONTRACTS, Contract } from '../../constants/contracts';
import ContractModal from '../../components/ContractModal';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFkTokens } from '../../hooks/useFkTokens';
import { logger } from '../../utils/logger';
import {
  FkButton,
  FkFormSection,
  FkLocationInput,
  FkPasswordInput,
  FkTextInput,
} from '../../components/fk';

type Props = NativeStackScreenProps<RootStackParamList, 'PersonalInfoNew'>;

interface FormState {
  firstName: string;
  lastName: string;
  tcNumber: string;
  address: string;
  city: string;
  district: string;
  password: string;
  passwordConfirm: string;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  tcNumber: '',
  address: '',
  city: '',
  district: '',
  password: '',
  passwordConfirm: '',
};

type FieldErrors = Partial<Record<keyof FormState, string>>;

export default function PersonalInfoNewScreen({ navigation, route }: Props) {
  const theme = useTheme();
  const { screenBg, cardBg } = useAppTheme();
  const { tokens } = useFkTokens();
  const { setPersonalInfo, data, setVerificationToken } = useRegistrationDataStore();

  const routeToken = route.params?.verificationToken;
  const { clearAll } = useVehicleStore();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [loading, setLoading] = useState(false);

  const [acceptedContracts, setAcceptedContracts] = useState<Record<string, boolean>>({});
  const [selectedContract, setSelectedContract] = useState<Contract | null>(null);
  const [contractModalVisible, setContractModalVisible] = useState(false);
  const contractsAccepted = CONTRACTS.every((c) => acceptedContracts[c.id]);

  const tcHelper = useMemo(() => {
    if (!form.tcNumber) return { text: '', color: tokens.colors.textSecondary };
    if (form.tcNumber.length < 11) {
      return { text: `${form.tcNumber.length}/11 hane`, color: tokens.colors.textSecondary };
    }
    const v = validateTCNumber(form.tcNumber);
    return v.isValid
      ? { text: '✓ Geçerli TC Kimlik No', color: tokens.colors.success }
      : { text: v.error || 'Geçersiz TC Kimlik No', color: tokens.colors.error };
  }, [form.tcNumber, tokens]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const handleTcChange = (raw: string) => {
    setField('tcNumber', raw.replace(/\D/g, '').slice(0, 11));
  };

  const handleContractPress = (contract: Contract) => {
    setSelectedContract(contract);
    setContractModalVisible(true);
  };

  const validateForm = (): boolean => {
    const next: FieldErrors = {};
    if (!form.firstName.trim()) next.firstName = 'Ad gerekli';
    if (!form.lastName.trim()) next.lastName = 'Soyad gerekli';

    if (!form.tcNumber.trim()) {
      next.tcNumber = 'TC Kimlik No gerekli';
    } else {
      const v = validateTCNumber(form.tcNumber);
      if (!v.isValid) next.tcNumber = v.error || 'Geçersiz TC Kimlik No';
    }

    if (!form.city.trim()) next.city = 'İl gerekli';
    if (!form.district.trim()) next.district = 'İlçe gerekli';
    if (!form.address.trim()) next.address = 'Adres gerekli';

    if (!contractsAccepted) {
      Alert.alert('Uyarı', 'Devam etmek için sözleşmeleri kabul etmelisiniz.');
      return false;
    }

    if (!form.password.trim()) next.password = 'PIN gerekli';
    else if (form.password.length !== 6) next.password = 'PIN 6 haneli olmalı';
    else if (!/^\d{6}$/.test(form.password)) next.password = 'PIN sadece rakam içermeli';

    if (!form.passwordConfirm.trim()) next.passwordConfirm = 'PIN onayı gerekli';
    else if (form.password !== form.passwordConfirm) next.passwordConfirm = "PIN'ler eşleşmiyor";

    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const navigateAfterRegistration = () => {
    navigation.reset({ index: 0, routes: [{ name: 'VehicleTypeSelection' }] });
  };

  const handleContinue = async () => {
    if (!validateForm()) return;
    setLoading(true);

    try {
      const verificationToken = data.verificationToken || routeToken;
      if (!verificationToken) {
        logger.error('auth', 'PersonalInfoNew.handleContinue - verificationToken missing');
        Alert.alert(
          'Hata',
          'Telefon doğrulaması yapılmamış. Lütfen kayıt işlemini baştan başlatın.',
        );
        navigation.navigate('PhoneNumber');
        return;
      }
      if (!data.verificationToken && routeToken) setVerificationToken(routeToken);

      await authAPI.register({
        first_name: form.firstName,
        last_name: form.lastName,
        phone_number: data.phoneNumber,
        tc_no: form.tcNumber,
        business_address: form.address,
        business_address_il: form.city,
        business_address_ilce: form.district,
        password: form.password,
        password_confirm: form.passwordConfirm,
        user_type: data.vehicleTypes || ['towTruck', 'crane'],
        provider_type: data.providerType || 'individual',
        verification_token: verificationToken,
      });

      setPersonalInfo({ ...form });
      clearAll();
      navigateAfterRegistration();
    } catch (error: any) {
      logger.error('auth', 'PersonalInfoNew.register failure', {
        status: error?.response?.status,
      });

      const isTimeoutError =
        error.code === 'ECONNABORTED' ||
        error.message?.includes('timeout') ||
        error.message?.includes('Timeout') ||
        error.response?.status === 504 ||
        error.response?.status === 502 ||
        error.response?.status === 408;

      if (isTimeoutError) {
        logger.warn('auth', 'PersonalInfoNew.register timeout, trying login fallback', {
          status: error?.response?.status,
        });
        try {
          const loginResponse = await authAPI.login({
            phone_number: data.phoneNumber,
            password: form.password,
          });
          if (loginResponse && loginResponse.user) {
            setPersonalInfo({ ...form });
            clearAll();
            navigateAfterRegistration();
            return;
          }
        } catch (loginError: any) {
          logger.error('auth', 'PersonalInfoNew.login fallback failure', {
            status: loginError?.response?.status,
          });
        }

        Alert.alert(
          'Bağlantı Sorunu',
          'Kayıt işlemi zaman aşımına uğradı. Lütfen internet bağlantınızı kontrol edip tekrar deneyin.',
        );
        return;
      }

      let errorMessage = 'Kayıt sırasında bir hata oluştu. Lütfen tekrar deneyin.';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (typeof errorData === 'object' && !errorData.message && !errorData.error) {
          const errorMessages: string[] = [];
          Object.keys(errorData).forEach((field) => {
            const fieldErrors = errorData[field];
            if (Array.isArray(fieldErrors)) errorMessages.push(...fieldErrors);
            else if (typeof fieldErrors === 'string') errorMessages.push(fieldErrors);
          });
          if (errorMessages.length > 0) errorMessage = errorMessages.join('\n');
        } else if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
        else if (typeof errorData === 'string') errorMessage = errorData;
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
        <ProgressBar progress={0.5} style={styles.progressBar} color={theme.colors.primary} />
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

        <FkFormSection title="Temel Bilgiler">
          <View style={styles.row}>
            <View style={styles.col}>
              <FkTextInput
                label="Ad"
                required
                value={form.firstName}
                onChange={(v) => setField('firstName', v)}
                autoCapitalize="words"
                error={errors.firstName}
              />
            </View>
            <View style={styles.col}>
              <FkTextInput
                label="Soyad"
                required
                value={form.lastName}
                onChange={(v) => setField('lastName', v)}
                autoCapitalize="words"
                error={errors.lastName}
              />
            </View>
          </View>

          <FkTextInput
            label="TC Kimlik Numarası"
            required
            value={form.tcNumber}
            onChange={handleTcChange}
            keyboardType="numeric"
            maxLength={11}
            error={errors.tcNumber}
            helperText={!errors.tcNumber ? tcHelper.text : undefined}
            helperColor={tcHelper.color}
            rightIcon={
              form.tcNumber.length === 11 && tcHelper.color === tokens.colors.success
                ? undefined
                : undefined
            }
          />
        </FkFormSection>

        <FkFormSection title="Adres Bilgileri">
          <FkLocationInput
            value={{ city: form.city, district: form.district, address: form.address }}
            onChange={(next) => {
              setForm((prev) => ({
                ...prev,
                city: next.city,
                district: next.district,
                address: next.address,
              }));
              if (next.city !== form.city && errors.district) {
                setErrors((prev) => ({ ...prev, district: undefined }));
              }
              setErrors((prev) => ({
                ...prev,
                city: next.city ? undefined : prev.city,
                district: next.district ? undefined : prev.district,
                address: next.address ? undefined : prev.address,
              }));
            }}
            errors={{ city: errors.city, district: errors.district, address: errors.address }}
            required
          />
        </FkFormSection>

        <FkFormSection
          title="Sözleşmeler"
          description="Devam etmek için aşağıdaki sözleşmeleri okuyup en alta kaydırarak onaylamanız gerekmektedir."
        >
          <View style={{ gap: tokens.spacing.md }}>
            {CONTRACTS.map((contract) => {
              const accepted = !!acceptedContracts[contract.id];
              return (
                <Pressable
                  key={contract.id}
                  onPress={() => handleContractPress(contract)}
                  style={[
                    styles.contractCard,
                    {
                      backgroundColor: accepted
                        ? tokens.colors.successSoft
                        : tokens.colors.surfaceMuted,
                      borderColor: accepted ? tokens.colors.success : tokens.colors.border,
                      borderRadius: tokens.radius.lg,
                    },
                  ]}
                >
                  <View style={styles.contractContent}>
                    <MaterialCommunityIcons
                      name={contract.icon as any}
                      size={24}
                      color={accepted ? tokens.colors.success : tokens.colors.primary}
                      style={{ marginRight: 12 }}
                    />
                    <View style={{ flex: 1 }}>
                      <Text
                        style={[styles.contractTitle, { color: tokens.colors.textPrimary }]}
                        numberOfLines={2}
                      >
                        {contract.title}
                      </Text>
                      <Text
                        style={{
                          fontSize: 12,
                          color: accepted ? tokens.colors.success : tokens.colors.error,
                          marginTop: 4,
                        }}
                      >
                        {accepted ? 'Onaylandı' : 'Onay bekleniyor'}
                      </Text>
                    </View>
                  </View>
                  <MaterialCommunityIcons
                    name={accepted ? 'check-circle' : 'chevron-right'}
                    size={24}
                    color={accepted ? tokens.colors.success : tokens.colors.textSecondary}
                  />
                </Pressable>
              );
            })}
          </View>
        </FkFormSection>

        <FkFormSection
          title="PIN Oluştur"
          description="Uygulamaya giriş için 6 haneli bir PIN belirleyin"
        >
          <FkPasswordInput
            label="PIN"
            required
            value={form.password}
            onChange={(v) => setField('password', v.replace(/\D/g, '').slice(0, 6))}
            numericPin
            maxLength={6}
            error={errors.password}
          />
          <FkPasswordInput
            label="PIN Onayı"
            required
            value={form.passwordConfirm}
            onChange={(v) => setField('passwordConfirm', v.replace(/\D/g, '').slice(0, 6))}
            numericPin
            maxLength={6}
            error={errors.passwordConfirm}
          />
        </FkFormSection>

        <View style={{ paddingBottom: 20 }}>
          <FkButton onPress={handleContinue} loading={loading} disabled={loading} fullWidth>
            {loading ? 'Kayıt Yapılıyor...' : 'Kayıt Ol ve Devam Et'}
          </FkButton>
        </View>
      </ScrollView>

      <ContractModal
        visible={contractModalVisible}
        contract={selectedContract}
        onDismiss={() => setContractModalVisible(false)}
        showAcceptButton={!!(selectedContract && !acceptedContracts[selectedContract.id])}
        onAccept={() => {
          if (selectedContract) {
            setAcceptedContracts((prev) => ({ ...prev, [selectedContract.id]: true }));
            setContractModalVisible(false);
          }
        }}
      />
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: { paddingTop: 50, paddingHorizontal: 16, paddingBottom: 16, elevation: 2 },
  backButton: { alignSelf: 'flex-start', marginBottom: 8 },
  progressBar: { height: 4, borderRadius: 2 },
  content: { flex: 1, padding: 20 },
  titleContainer: { marginBottom: 24, alignItems: 'center' },
  title: { fontWeight: 'bold', textAlign: 'center', marginBottom: 8 },
  subtitle: { textAlign: 'center', opacity: 0.7, paddingHorizontal: 20 },
  row: { flexDirection: 'row', gap: 12 },
  col: { flex: 1 },
  contractCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 12,
    borderWidth: 1,
  },
  contractContent: { flex: 1, flexDirection: 'row', alignItems: 'center' },
  contractTitle: { flex: 1, fontSize: 14, fontWeight: '500' },
});

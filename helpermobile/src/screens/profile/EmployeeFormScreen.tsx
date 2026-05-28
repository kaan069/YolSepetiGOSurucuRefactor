import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { AppBar } from '../../components/common';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import {
  FkButton,
  FkPasswordInput,
  FkTextInput,
} from '../../components/fk';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeForm'>;

interface FormState {
  firstName: string;
  lastName: string;
  phoneNumber: string;
  pin: string;
  tcNumber: string;
}

const EMPTY_FORM: FormState = {
  firstName: '',
  lastName: '',
  phoneNumber: '',
  pin: '',
  tcNumber: '',
};

export default function EmployeeFormScreen({ navigation, route }: Props) {
  const employeeId = route.params?.employeeId;
  const isEditing = !!employeeId;

  const { employees, addEmployee, updateEmployee } = useEmployeeStore();
  const { screenBg, cardBg } = useAppTheme();
  const { spacing } = useResponsive();

  const [form, setForm] = useState<FormState>(EMPTY_FORM);
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Partial<Record<keyof FormState, string>>>({});

  useEffect(() => {
    if (!isEditing || !employeeId) return;
    const employee = employees.find((e) => e.id === employeeId);
    if (!employee) return;
    setForm({
      firstName: employee.first_name,
      lastName: employee.last_name,
      phoneNumber:
        (employee.phone_number || '').startsWith('+90')
          ? employee.phone_number.slice(3)
          : employee.phone_number || '',
      tcNumber: employee.tc_no,
      pin: '',
    });
  }, [employeeId, isEditing, employees]);

  const setField = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    if (errors[field]) setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = (): boolean => {
    const next: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) next.firstName = 'Ad zorunludur';
    if (!form.lastName.trim()) next.lastName = 'Soyad zorunludur';
    if (!form.phoneNumber.trim()) next.phoneNumber = 'Telefon numarası zorunludur';
    else if (form.phoneNumber.replace(/\D/g, '').length < 10)
      next.phoneNumber = 'Geçerli bir telefon numarası girin';
    if (!isEditing) {
      if (!form.pin.trim()) next.pin = 'PIN zorunludur';
      else if (form.pin.length < 4) next.pin = 'PIN en az 4 haneli olmalıdır';
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;
    setLoading(true);
    try {
      if (isEditing && employeeId) {
        await updateEmployee(employeeId, {
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone_number: `+90${form.phoneNumber.trim()}`,
          tc_no: form.tcNumber.trim(),
        });
        Alert.alert('Başarılı', 'Eleman bilgileri güncellendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addEmployee({
          first_name: form.firstName.trim(),
          last_name: form.lastName.trim(),
          phone_number: `+90${form.phoneNumber.trim()}`,
          password: form.pin,
          tc_no: form.tcNumber.trim(),
        });
        Alert.alert('Başarılı', 'Yeni eleman eklendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      const errorMsg =
        error?.response?.data?.detail ||
        error?.response?.data?.message ||
        'İşlem sırasında bir hata oluştu.';
      Alert.alert('Hata', errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={['bottom']}>
      <AppBar title={isEditing ? 'Eleman Düzenle' : 'Yeni Eleman Ekle'} />

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={{ padding: spacing.md }}
          showsVerticalScrollIndicator={false}
        >
          <View style={[styles.formCard, { backgroundColor: cardBg }]}>
            <FkTextInput
              label="Ad"
              required
              value={form.firstName}
              onChange={(v) => setField('firstName', v)}
              leftIcon="account"
              error={errors.firstName}
              mode="outlined"
            />
            <FkTextInput
              label="Soyad"
              required
              value={form.lastName}
              onChange={(v) => setField('lastName', v)}
              leftIcon="account"
              error={errors.lastName}
              mode="outlined"
            />
            <FkTextInput
              label="Telefon Numarası"
              required
              value={form.phoneNumber}
              onChange={(v) => setField('phoneNumber', v.replace(/\D/g, ''))}
              keyboardType="phone-pad"
              maxLength={10}
              leftAffix="+90"
              error={errors.phoneNumber}
              mode="outlined"
            />
            <FkTextInput
              label="TC Kimlik No"
              value={form.tcNumber}
              onChange={(v) => setField('tcNumber', v.replace(/\D/g, '').slice(0, 11))}
              keyboardType="number-pad"
              maxLength={11}
              leftIcon="card-account-details"
              mode="outlined"
            />

            {!isEditing && (
              <FkPasswordInput
                label="PIN (Giriş Şifresi)"
                required
                value={form.pin}
                onChange={(v) => setField('pin', v.replace(/\D/g, ''))}
                numericPin
                error={errors.pin}
                mode="outlined"
              />
            )}
          </View>

          <FkButton onPress={handleSave} loading={loading} disabled={loading} fullWidth>
            {isEditing ? 'Güncelle' : 'Eleman Ekle'}
          </FkButton>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  content: { flex: 1 },
  formCard: {
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
});

import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Alert, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { TextInput, Button, Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { AppBar } from '../../components/common';
import { useEmployeeStore } from '../../store/useEmployeeStore';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { validateTCNumber } from '../../utils/tcValidation';

type Props = NativeStackScreenProps<RootStackParamList, 'EmployeeForm'>;

export default function EmployeeFormScreen({ navigation, route }: Props) {
  const employeeId = route.params?.employeeId;
  const isEditing = !!employeeId;

  const { employees, addEmployee, updateEmployee } = useEmployeeStore();
  const { appColors, screenBg, cardBg, isDarkMode } = useAppTheme();
  const { spacing } = useResponsive();

  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [pin, setPin] = useState('');
  const [tcNumber, setTcNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Düzenleme modunda mevcut veriyi yükle
  useEffect(() => {
    if (isEditing && employeeId) {
      const employee = employees.find(e => e.id === employeeId);
      if (employee) {
        setFirstName(employee.first_name);
        setLastName(employee.last_name);
        const phone = employee.phone_number || '';
        setPhoneNumber(phone.startsWith('+90') ? phone.slice(3) : phone);
        setTcNumber(employee.tc_no);
      }
    }
  }, [employeeId, isEditing]);

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {};

    if (!firstName.trim()) {
      newErrors.firstName = 'Ad zorunludur';
    }
    if (!lastName.trim()) {
      newErrors.lastName = 'Soyad zorunludur';
    }
    if (!phoneNumber.trim()) {
      newErrors.phoneNumber = 'Telefon numarası zorunludur';
    } else if (phoneNumber.replace(/\D/g, '').length < 10) {
      newErrors.phoneNumber = 'Geçerli bir telefon numarası girin';
    }
    if (!isEditing) {
      if (!pin.trim()) {
        newErrors.pin = 'PIN zorunludur';
      } else if (pin.length < 4) {
        newErrors.pin = 'PIN en az 4 haneli olmalıdır';
      }
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validate()) return;

    setLoading(true);
    try {
      if (isEditing && employeeId) {
        await updateEmployee(employeeId, {
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: `+90${phoneNumber.trim()}`,
          tc_no: tcNumber.trim(),
        });
        Alert.alert('Başarılı', 'Eleman bilgileri güncellendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      } else {
        await addEmployee({
          first_name: firstName.trim(),
          last_name: lastName.trim(),
          phone_number: `+90${phoneNumber.trim()}`,
          password: pin,
          tc_no: tcNumber.trim(),
        });
        Alert.alert('Başarılı', 'Yeni eleman eklendi.', [
          { text: 'Tamam', onPress: () => navigation.goBack() },
        ]);
      }
    } catch (error: any) {
      const errorMsg = error?.response?.data?.detail
        || error?.response?.data?.message
        || 'İşlem sırasında bir hata oluştu.';
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
            <TextInput
              label="Ad"
              value={firstName}
              onChangeText={(text) => {
                setFirstName(text);
                if (errors.firstName) setErrors(prev => ({ ...prev, firstName: '' }));
              }}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              error={!!errors.firstName}
            />
            {errors.firstName ? (
              <Text style={styles.errorText}>{errors.firstName}</Text>
            ) : null}

            <TextInput
              label="Soyad"
              value={lastName}
              onChangeText={(text) => {
                setLastName(text);
                if (errors.lastName) setErrors(prev => ({ ...prev, lastName: '' }));
              }}
              mode="outlined"
              style={styles.input}
              left={<TextInput.Icon icon="account" />}
              error={!!errors.lastName}
            />
            {errors.lastName ? (
              <Text style={styles.errorText}>{errors.lastName}</Text>
            ) : null}

            <TextInput
              label="Telefon Numarası"
              value={phoneNumber}
              onChangeText={(text) => {
                setPhoneNumber(text.replace(/\D/g, ''));
                if (errors.phoneNumber) setErrors(prev => ({ ...prev, phoneNumber: '' }));
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="phone-pad"
              maxLength={10}
              left={<TextInput.Affix text="+90" />}
              error={!!errors.phoneNumber}
            />
            {errors.phoneNumber ? (
              <Text style={styles.errorText}>{errors.phoneNumber}</Text>
            ) : null}

            <TextInput
              label="TC Kimlik No"
              value={tcNumber}
              onChangeText={(text) => {
                setTcNumber(text.replace(/\D/g, '').substring(0, 11));
                if (errors.tcNumber) setErrors(prev => ({ ...prev, tcNumber: '' }));
              }}
              mode="outlined"
              style={styles.input}
              keyboardType="number-pad"
              maxLength={11}
              left={<TextInput.Icon icon="card-account-details" />}
              error={!!errors.tcNumber}
            />
            {errors.tcNumber ? (
              <Text style={styles.errorText}>{errors.tcNumber}</Text>
            ) : null}

            {!isEditing && (
              <>
                <TextInput
                  label="PIN (Giriş Şifresi)"
                  value={pin}
                  onChangeText={(text) => {
                    setPin(text.replace(/\D/g, ''));
                    if (errors.pin) setErrors(prev => ({ ...prev, pin: '' }));
                  }}
                  mode="outlined"
                  style={styles.input}
                  keyboardType="number-pad"
                  secureTextEntry
                  left={<TextInput.Icon icon="lock" />}
                  error={!!errors.pin}
                />
                {errors.pin ? (
                  <Text style={styles.errorText}>{errors.pin}</Text>
                ) : null}
              </>
            )}
          </View>

          <Button
            mode="contained"
            onPress={handleSave}
            loading={loading}
            disabled={loading}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
          >
            {isEditing ? 'Güncelle' : 'Eleman Ekle'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
  },
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
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#EF4444',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  saveButton: {
    borderRadius: 12,
    marginBottom: 20,
  },
  saveButtonContent: {
    paddingVertical: 8,
  },
});

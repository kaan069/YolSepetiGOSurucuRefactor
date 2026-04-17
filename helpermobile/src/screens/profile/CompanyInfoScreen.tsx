import React, { useEffect, useState } from 'react';
import { StyleSheet, ScrollView, View, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, TextInput, ActivityIndicator, Divider } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { RootStackParamList } from '../../navigation';
import { profileAPI, CompanyInfo, PaymentMethod, documentsAPI } from '../../api';
import { useNotificationStore } from '../../store/useNotificationStore';
import { useAuthStore } from '../../store/authStore';
import AppBar from '../../components/common/AppBar';
import CreditCardSection from '../../components/payment/CreditCardSection';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'CompanyInfo'>;

export default function CompanyInfoScreen({ navigation, route }: Props) {
  const { screenBg, cardBg, isDarkMode, appColors } = useAppTheme();
  const { showNotification } = useNotificationStore();
  const { setIsAuthenticated } = useAuthStore();

  // Kayıt akışından mı geliniyor?
  const fromRegistration = route.params?.fromRegistration || false;

  // Kredi kartı bölümü refresh trigger
  const [cardRefreshTrigger, setCardRefreshTrigger] = useState(0);

  // Loading states
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Company Info State
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo | null>(null);
  const [companyName, setCompanyName] = useState('');
  const [taxNumber, setTaxNumber] = useState('');

  // Payment Method State
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
  const [accountHolderName, setAccountHolderName] = useState('');
  const [iban, setIban] = useState('');

  // Validation errors
  const [companyErrors, setCompanyErrors] = useState<Record<string, string>>({});
  const [paymentErrors, setPaymentErrors] = useState<Record<string, string>>({});

  // Ekran her odaklandığında verileri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      loadData();
      setCardRefreshTrigger(prev => prev + 1);
    }, [])
  );

  const loadData = async () => {
    try {
      setLoading(true);

      // Load company info
      let companyData: CompanyInfo | null = null;
      try {
        companyData = await profileAPI.getCompanyInfo();
        if (companyData) {
          setCompanyInfo(companyData);
          setCompanyName(companyData.company_name);
          setTaxNumber(companyData.tax_number);
        }
      } catch (error: any) {
        // 404 durumunda bildirim göster
        if (error?.response?.status === 404) {
          const message = error?.response?.data?.error || 'Henüz şirket bilgilerinizi eklemediniz';
          showNotification('info', message, 4000);
        } else {
          throw error; // Diğer hataları yukarı fırlat
        }
      }

      // Load payment method
      let paymentData: PaymentMethod | null = null;
      try {
        paymentData = await profileAPI.getPaymentMethod();
        if (paymentData) {
          setPaymentMethod(paymentData);
          setAccountHolderName(paymentData.account_holder_name);
          setIban(paymentData.iban);
        }
      } catch (error: any) {
        // 404 durumunda bildirim göster
        if (error?.response?.status === 404) {
          const message = error?.response?.data?.error || 'Henüz ödeme yönteminizi eklemediniz';
          showNotification('info', message, 4000);
        } else {
          throw error; // Diğer hataları yukarı fırlat
        }
      }
    } catch (error: any) {
      console.error('Load data error:', error);
      const errorMessage = error?.response?.data?.error ||
                          error?.response?.data?.message ||
                          'Veriler yüklenirken bir hata oluştu';
      showNotification('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  // Profil durumunu kontrol et ve ana ekrana yönlendir
  const checkProfileAndNavigate = async () => {
    try {
      // Kayıt akışındaysa başarı mesajı göster
      if (fromRegistration) {
        Alert.alert(
          '🎉 Kayıt Başarılı',
          'Tebrikler! Kaydınız başarıyla tamamlandı.\n\nBelgeleriniz yönetici tarafından onaylandıktan sonra SMS ile bilgilendirileceksiniz.',
          [
            {
              text: 'Tamam',
              onPress: () => {
                // Ana ekrana yönlendir
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Tabs' }],
                });
              }
            }
          ]
        );
        return;
      }

      // Normal akış - ana ekrana yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'Tabs' }],
      });

      // Arka planda profil tamamlanma durumunu kontrol et
      setTimeout(async () => {
        try {
          const completenessResponse = await documentsAPI.checkProfileCompleteness();

          // Eğer hala eksik alanlar varsa bildir
          if (!completenessResponse.is_complete && completenessResponse.missing_fields.length > 0) {
            const missingMessages = completenessResponse.missing_fields
              .map(field => `• ${field.message}`)
              .join('\n');

            Alert.alert(
              '⚠️ Profil Tamamlama Gerekli',
              `Profiliniz %${completenessResponse.completion_percentage} tamamlanmış.\n\nKalan eksik bilgiler:\n${missingMessages}\n\nİşleri kabul edebilmek için lütfen tüm bilgilerinizi tamamlayın.`,
              [
                {
                  text: 'Daha Sonra',
                  style: 'cancel',
                },
                {
                  text: 'Tamamla',
                  onPress: () => {
                    navigation.navigate('MissingDocuments');
                  }
                }
              ]
            );
          }
        } catch (error) {
          // Profil durumu kontrol hatası - sessizce devam et
        }
      }, 1000); // Ana ekrana geçiş animasyonu için 1 saniye bekle
    } catch (error) {
      // Navigation hatası - sessizce devam et
    }
  };

  // Validate company info
  const validateCompanyInfo = (): boolean => {
    const errors: Record<string, string> = {};

    if (!companyName.trim()) {
      errors.companyName = 'Şirket adı gerekli';
    }

    if (!taxNumber.trim()) {
      errors.taxNumber = 'Vergi numarası gerekli';
    } else if (taxNumber.trim().length !== 10 && taxNumber.trim().length !== 11) {
      errors.taxNumber = 'Vergi numarası 10 veya 11 haneli olmalı';
    }

    setCompanyErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Validate payment method
  const validatePaymentMethod = (): boolean => {
    const errors: Record<string, string> = {};

    if (!accountHolderName.trim()) {
      errors.accountHolderName = 'Hesap sahibi adı gerekli';
    }

    if (!iban.trim()) {
      errors.iban = 'IBAN gerekli';
    } else {
      // IBAN validation (TR + 24 digits)
      const ibanClean = iban.replace(/\s/g, '').toUpperCase();
      if (!ibanClean.startsWith('TR')) {
        errors.iban = 'IBAN TR ile başlamalı';
      } else if (ibanClean.length !== 26) {
        errors.iban = 'IBAN 26 karakter olmalı (TR + 24 hane)';
      } else if (!/^TR\d{24}$/.test(ibanClean)) {
        errors.iban = 'Geçersiz IBAN formatı';
      }
    }

    setPaymentErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // Hem şirket bilgilerini hem de ödeme yöntemini kaydet
  const saveAllInfo = async () => {
    // Validasyonları kontrol et
    const isCompanyValid = validateCompanyInfo();
    const isPaymentValid = validatePaymentMethod();

    if (!isCompanyValid || !isPaymentValid) {
      showNotification('error', 'Lütfen tüm alanları doğru şekilde doldurun');
      return;
    }

    setSaving(true);
    let companySuccess = false;
    let paymentSuccess = false;

    try {
      // Şirket bilgilerini kaydet
      try {
        const companyData = {
          company_name: companyName.trim(),
          tax_number: taxNumber.trim(),
        };

        let companyResult: CompanyInfo;
        if (companyInfo) {
          companyResult = await profileAPI.updateCompanyInfo(companyData);
        } else {
          companyResult = await profileAPI.createCompanyInfo(companyData);
        }
        setCompanyInfo(companyResult);
        companySuccess = true;
      } catch (error: any) {
        console.error('Save company info error:', error);
        const errorMessage = error?.response?.data?.error ||
                            error?.response?.data?.message ||
                            'Şirket bilgileri kaydedilirken bir hata oluştu';
        throw new Error(errorMessage);
      }

      // Ödeme yöntemini kaydet
      try {
        const paymentData = {
          account_holder_name: accountHolderName.trim(),
          iban: iban.replace(/\s/g, '').toUpperCase(),
        };

        let paymentResult: PaymentMethod;
        if (paymentMethod) {
          paymentResult = await profileAPI.updatePaymentMethod(paymentData);
        } else {
          paymentResult = await profileAPI.createPaymentMethod(paymentData);
        }
        setPaymentMethod(paymentResult);
        paymentSuccess = true;
      } catch (error: any) {
        console.error('Save payment method error:', error);
        const errorMessage = error?.response?.data?.error ||
                            error?.response?.data?.message ||
                            'Ödeme yöntemi kaydedilirken bir hata oluştu';
        throw new Error(errorMessage);
      }

      // Her iki kayıt da başarılıysa
      if (companySuccess && paymentSuccess) {
        showNotification('success', 'Tüm bilgiler başarıyla kaydedildi');

        // Kayıt akışı DEĞİLSE otomatik yönlendir
        if (!fromRegistration) {
          setTimeout(() => {
            checkProfileAndNavigate();
          }, 1500);
        }
      }
    } catch (error: any) {
      showNotification('error', error.message || 'Bilgiler kaydedilirken bir hata oluştu', 6000);
    } finally {
      setSaving(false);
    }
  };

  // Loading screen
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Şirket Bilgileri" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" />
          <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>Veriler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Şirket Bilgileri" />

      <KeyboardAvoidingView
        behavior="padding"
        style={{ flex: 1 }}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <ScrollView
          style={styles.content}
          contentContainerStyle={styles.scrollContent}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
        {/* Şirket Bilgileri Card */}
        <Card style={styles.card}>
          <Card.Title
            title="🏢 Şirket Bilgileri"
            subtitle={companyInfo ? 'Bilgilerinizi güncelleyin' : 'Şirket bilgilerinizi ekleyin'}
          />
          <Card.Content>
            <TextInput
              label="Şirket Adı *"
              value={companyName}
              onChangeText={(text) => {
                setCompanyName(text);
                if (companyErrors.companyName) {
                  setCompanyErrors({ ...companyErrors, companyName: '' });
                }
              }}
              error={!!companyErrors.companyName}
              style={styles.input}
              placeholder="Örnek Nakliyat Ltd. Şti."
            />
            {companyErrors.companyName && (
              <Text style={styles.errorText}>{companyErrors.companyName}</Text>
            )}

            <TextInput
              label="Vergi Numarası *"
              value={taxNumber}
              onChangeText={(text) => {
                setTaxNumber(text);
                if (companyErrors.taxNumber) {
                  setCompanyErrors({ ...companyErrors, taxNumber: '' });
                }
              }}
              error={!!companyErrors.taxNumber}
              keyboardType="numeric"
              maxLength={11}
              style={styles.input}
              placeholder="1234567890"
            />
            {companyErrors.taxNumber && (
              <Text style={styles.errorText}>{companyErrors.taxNumber}</Text>
            )}

            {companyInfo && (
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
                <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>Son Güncelleme:</Text>
                <Text style={styles.infoValue}>
                  {new Date(companyInfo.updated_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Ödeme Yöntemi Card */}
        <Card style={styles.card}>
          <Card.Title
            title="💳 Ödeme Yöntemi"
            subtitle={paymentMethod ? 'IBAN bilgilerinizi güncelleyin' : 'Kazancınızın yatırılacağı hesabı ekleyin'}
          />
          <Card.Content>
            <Text variant="bodySmall" style={[styles.helperText, { color: appColors.text.secondary }]}>
              Kazançlarınız bu hesaba yatırılacaktır
            </Text>

            <TextInput
              label="Hesap Sahibi Adı *"
              value={accountHolderName}
              onChangeText={(text) => {
                setAccountHolderName(text);
                if (paymentErrors.accountHolderName) {
                  setPaymentErrors({ ...paymentErrors, accountHolderName: '' });
                }
              }}
              error={!!paymentErrors.accountHolderName}
              style={styles.input}
              placeholder="Ahmet Yılmaz"
            />
            {paymentErrors.accountHolderName && (
              <Text style={styles.errorText}>{paymentErrors.accountHolderName}</Text>
            )}

            <TextInput
              label="IBAN *"
              value={iban}
              onChangeText={(text) => {
                setIban(text);
                if (paymentErrors.iban) {
                  setPaymentErrors({ ...paymentErrors, iban: '' });
                }
              }}
              error={!!paymentErrors.iban}
              style={styles.input}
              placeholder="TR330006100519786457841326"
              autoCapitalize="characters"
              maxLength={32}
            />
            {paymentErrors.iban && (
              <Text style={styles.errorText}>{paymentErrors.iban}</Text>
            )}

            {paymentMethod && (
              <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
                <Text style={[styles.infoLabel, { color: appColors.text.secondary }]}>Son Güncelleme:</Text>
                <Text style={styles.infoValue}>
                  {new Date(paymentMethod.updated_at).toLocaleDateString('tr-TR')}
                </Text>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Tek Kaydet Butonu - Hem şirket hem ödeme bilgilerini kaydeder */}
        <Button
          mode="contained"
          onPress={saveAllInfo}
          loading={saving}
          disabled={saving}
          style={styles.mainSaveButton}
          icon="content-save"
        >
          {saving ? 'Kaydediliyor...' : (companyInfo && paymentMethod) ? 'Tüm Bilgileri Güncelle' : 'Tüm Bilgileri Kaydet'}
        </Button>

        {/* Kredi Kartı Bilgileri - Tüm kullanıcılar için */}
        <Card style={styles.card}>
          <Card.Title
            title="💳 Kredi Kartı Bilgileri"
            subtitle="Komisyon ödemeleri için kullanılacak"
          />
          <Card.Content>
            <CreditCardSection refreshTrigger={cardRefreshTrigger} />
          </Card.Content>
        </Card>

        <View style={styles.bottomSpace} />

        {/* Devam Et Butonu - Sadece kayıt akışında göster */}
        {fromRegistration && (
          <View style={styles.continueSection}>
            <Button
              mode="contained"
              icon="arrow-right"
              loading={saving}
              disabled={saving}
              onPress={async () => {
                // Önce bilgileri kaydet (saveAllInfo ile aynı validasyon ve kayıt işlemi)
                const isCompanyValid = validateCompanyInfo();
                const isPaymentValid = validatePaymentMethod();

                if (!isCompanyValid || !isPaymentValid) {
                  showNotification('error', 'Lütfen tüm alanları doğru şekilde doldurun');
                  return;
                }

                setSaving(true);

                try {
                  // Şirket bilgilerini kaydet
                  const companyData = {
                    company_name: companyName.trim(),
                    tax_number: taxNumber.trim(),
                  };

                  let companyResult: CompanyInfo;
                  if (companyInfo) {
                    companyResult = await profileAPI.updateCompanyInfo(companyData);
                  } else {
                    companyResult = await profileAPI.createCompanyInfo(companyData);
                  }
                  setCompanyInfo(companyResult);

                  // Ödeme yöntemini kaydet
                  const paymentData = {
                    account_holder_name: accountHolderName.trim(),
                    iban: iban.replace(/\s/g, '').toUpperCase(),
                  };

                  let paymentResult: PaymentMethod;
                  if (paymentMethod) {
                    paymentResult = await profileAPI.updatePaymentMethod(paymentData);
                  } else {
                    paymentResult = await profileAPI.createPaymentMethod(paymentData);
                  }
                  setPaymentMethod(paymentResult);

                  // Token'ı kontrol et ve auth durumunu güncelle
                  const token = await AsyncStorage.getItem('access_token');
                  if (token) {
                    setIsAuthenticated(true);
                  }

                  Alert.alert(
                    '🎉 Kayıt Başarılı',
                    'Tebrikler! Kaydınız başarıyla tamamlandı.\n\nBelgeleriniz yönetici tarafından onaylandıktan sonra SMS ile bilgilendirileceksiniz.',
                    [
                      {
                        text: 'Tamam',
                        onPress: () => {
                          // Navigation otomatik olarak AppStack'e geçer
                        }
                      }
                    ]
                  );
                } catch (error: any) {
                  console.error('Save error:', error);
                  const errorMessage = error?.response?.data?.error ||
                                      error?.response?.data?.message ||
                                      error?.message ||
                                      'Bilgiler kaydedilirken bir hata oluştu';
                  showNotification('error', errorMessage, 6000);
                } finally {
                  setSaving(false);
                }
              }}
              style={styles.continueButton}
              contentStyle={{ flexDirection: 'row-reverse' }}
            >
              {saving ? 'Kaydediliyor...' : 'Kaydı Tamamla'}
            </Button>
          </View>
        )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
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
    paddingBottom: 250,
  },
  header: {
    marginBottom: 24,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  card: {
    marginBottom: 20,
  },
  input: {
    marginBottom: 8,
  },
  errorText: {
    color: '#d32f2f',
    fontSize: 12,
    marginBottom: 8,
    marginLeft: 4,
  },
  helperText: {
    fontStyle: 'italic',
    marginBottom: 12,
  },
  saveButton: {
    marginTop: 8,
    borderRadius: 8,
  },
  mainSaveButton: {
    marginVertical: 16,
    borderRadius: 8,
    paddingVertical: 8,
    backgroundColor: '#26a69a',
  },
  infoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  infoLabel: {
    fontSize: 13,
    fontWeight: '500',
  },
  infoValue: {
    fontSize: 13,
    color: '#26a69a',
    fontWeight: 'bold',
  },
  bottomSpace: {
    height: 24,
  },
  continueSection: {
    marginBottom: 24,
    paddingHorizontal: 4,
  },
  continueButton: {
    paddingVertical: 12,
    borderRadius: 8,
    backgroundColor: '#4CAF50',
  },
});
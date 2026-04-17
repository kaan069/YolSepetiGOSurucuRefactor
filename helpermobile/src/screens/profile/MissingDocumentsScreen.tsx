import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, ActivityIndicator, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { documentsAPI } from '../../api';
import { ProfileCompletenessResponse } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';

type Props = NativeStackScreenProps<RootStackParamList, 'MissingDocuments'>;

export default function MissingDocumentsScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();
  const [loading, setLoading] = useState(true);
  const [completeness, setCompleteness] = useState<ProfileCompletenessResponse | null>(null);

  // Ekran her odaklandığında profil durumunu yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      loadProfileCompleteness();
    }, [])
  );

  // ✅ Profil tamamlama durumunu yükle (tek endpoint)
  const loadProfileCompleteness = async () => {
    setLoading(true);
    try {
      const response = await documentsAPI.checkProfileCompleteness();
      setCompleteness(response);
    } catch (error) {
      console.error('❌ Profil tamamlama durumu yüklenirken hata:', error);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Evraklarım buton durumu (driver_license + tax_plate)
  const getDocumentButtonStatus = (): 'missing' | 'pending' | 'approved' => {
    if (!completeness) return 'missing';

    // Eksik alanları kontrol et
    const hasDriverLicenseMissing = completeness.missing_fields.some(f => f.field === 'driver_license');
    const hasTaxPlateMissing = completeness.missing_fields.some(f => f.field === 'tax_plate');

    if (hasDriverLicenseMissing || hasTaxPlateMissing) {
      return 'missing';
    }

    // Tamamlanmış alanları kontrol et - status'lara bak
    const driverLicense = completeness.completed_fields.find(f => f.field === 'driver_license');
    const taxPlate = completeness.completed_fields.find(f => f.field === 'tax_plate');

    // Her iki belge de onaylandıysa
    if (driverLicense?.status === 'approved' && taxPlate?.status === 'approved') {
      return 'approved';
    }

    // En az biri pending ise
    if (driverLicense?.status === 'pending' || taxPlate?.status === 'pending') {
      return 'pending';
    }

    // Varsayılan olarak missing
    return 'missing';
  };

  // ✅ Şirket bilgileri buton durumu (company_info + payment_method)
  const getCompanyButtonStatus = (): 'missing' | 'saved' => {
    if (!completeness) return 'missing';

    // Eksik alanları kontrol et
    const hasCompanyInfoMissing = completeness.missing_fields.some(f => f.field === 'company_info');
    const hasPaymentMethodMissing = completeness.missing_fields.some(f => f.field === 'payment_method');

    if (hasCompanyInfoMissing || hasPaymentMethodMissing) {
      return 'missing';
    }

    // Her ikisi de tamamlanmışsa
    return 'saved';
  };

  // Evraklarım buton rengi
  const getDocumentButtonColor = () => {
    const status = getDocumentButtonStatus();
    switch (status) {
      case 'approved':
        return '#4CAF50'; // Yeşil
      case 'pending':
        return '#ff9800'; // Turuncu
      case 'missing':
      default:
        return '#f44336'; // Kırmızı
    }
  };

  // Evraklarım buton metni
  const getDocumentButtonText = () => {
    const status = getDocumentButtonStatus();
    switch (status) {
      case 'approved':
        return '✓ Evraklarım Onaylandı';
      case 'pending':
        return '⏳ Evraklarım (Onay Bekliyor)';
      case 'missing':
      default:
        return '✗ Evraklarım Eksik';
    }
  };

  // Şirket bilgileri buton rengi
  const getCompanyButtonColor = () => {
    return getCompanyButtonStatus() === 'saved' ? '#4CAF50' : '#f44336';
  };

  // Şirket bilgileri buton metni
  const getCompanyButtonText = () => {
    return getCompanyButtonStatus() === 'saved'
      ? '✓ Şirket Bilgileri Kayıtlı'
      : '✗ Şirket Bilgileri Eksik';
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Eksik Evraklar" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#26a69a" />
          <Text style={{ marginTop: 12, color: '#666' }}>Belge durumu yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Eksik Evraklar" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        {/* Tamamlanma Yüzdesi Card */}
        {completeness && (
          <Card style={[styles.progressCard, { backgroundColor: cardBg }]}>
            <Card.Content>
              <View style={styles.progressHeader}>
                <MaterialCommunityIcons name="chart-donut" size={24} color="#26a69a" />
                <Text variant="titleMedium" style={styles.progressTitle}>
                  Profil Tamamlama
                </Text>
              </View>
              <View style={styles.progressBarContainer}>
                <View style={styles.progressBarBg}>
                  <View style={[styles.progressBarFill, { width: `${completeness.completion_percentage}%` }]} />
                </View>
                <Text style={styles.progressText}>{completeness.completion_percentage}%</Text>
              </View>
              {!completeness.is_complete && (
                <View style={styles.missingFieldsContainer}>
                  <Text variant="bodySmall" style={styles.progressSubtext}>
                    {completeness.missing_fields.length} alan eksik:
                  </Text>
                  {completeness.missing_fields.map((field, index) => (
                    <Text key={index} variant="bodySmall" style={styles.missingFieldText}>
                      • {field.message}
                    </Text>
                  ))}
                </View>
              )}
            </Card.Content>
          </Card>
        )}

        {/* Bilgilendirme Card */}
        <Card style={styles.infoCard}>
          <Card.Content>
            <View style={styles.infoHeader}>
              <MaterialCommunityIcons name="information" size={24} color="#26a69a" />
              <Text variant="titleMedium" style={styles.infoTitle}>
                Hesap Tamamlama
              </Text>
            </View>
            <Text variant="bodyMedium" style={styles.infoText}>
              Lütfen aşağıdaki belgeleri ve bilgileri eksiksiz olarak tamamlayın. Bu bilgiler olmadan işleri kabul edemezsiniz.
            </Text>
          </Card.Content>
        </Card>

        {/* Evraklarım Butonu */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getDocumentButtonColor() }]}
          onPress={() => navigation.navigate('DocumentsScreen')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="file-document" size={32} color="#fff" />
              <View style={styles.buttonTextContainer}>
                <Text variant="titleMedium" style={styles.buttonTitle}>
                  {getDocumentButtonText()}
                </Text>
                <Text variant="bodySmall" style={styles.buttonSubtitle}>
                  Ehliyet ve Vergi Levhası
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Şirket Bilgileri Butonu */}
        <TouchableOpacity
          style={[styles.actionButton, { backgroundColor: getCompanyButtonColor() }]}
          onPress={() => navigation.navigate('CompanyInfo')}
          activeOpacity={0.8}
        >
          <View style={styles.buttonContent}>
            <View style={styles.buttonLeft}>
              <MaterialCommunityIcons name="office-building" size={32} color="#fff" />
              <View style={styles.buttonTextContainer}>
                <Text variant="titleMedium" style={styles.buttonTitle}>
                  {getCompanyButtonText()}
                </Text>
                <Text variant="bodySmall" style={styles.buttonSubtitle}>
                  Şirket ve Ödeme Bilgileri
                </Text>
              </View>
            </View>
            <MaterialCommunityIcons name="chevron-right" size={28} color="#fff" />
          </View>
        </TouchableOpacity>

        {/* Alt Bilgilendirme */}
        <View style={styles.footerInfo}>
          <MaterialCommunityIcons name="alert-circle-outline" size={20} color="#666" />
          <Text style={styles.footerText}>
            Tüm belgeleriniz onaylandıktan ve şirket bilgilerinizi kaydettikten sonra iş taleplerini kabul edebilirsiniz.
          </Text>
        </View>

      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  scrollContent: {
    paddingBottom: 40,
  },
  progressCard: {
    marginBottom: 16,
    elevation: 2,
  },
  progressHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  progressTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#26a69a',
  },
  progressBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  progressBarBg: {
    flex: 1,
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 6,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#26a69a',
    borderRadius: 6,
  },
  progressText: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#26a69a',
    minWidth: 45,
  },
  progressSubtext: {
    marginTop: 8,
    color: '#666',
    fontSize: 12,
    fontWeight: 'bold',
  },
  missingFieldsContainer: {
    marginTop: 4,
  },
  missingFieldText: {
    marginTop: 4,
    marginLeft: 8,
    color: '#f44336',
    fontSize: 12,
    lineHeight: 18,
  },
  infoCard: {
    marginBottom: 24,
    backgroundColor: '#e3f2fd',
    elevation: 2,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  infoTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#26a69a',
  },
  infoText: {
    color: '#333',
    lineHeight: 22,
  },
  actionButton: {
    borderRadius: 12,
    marginBottom: 16,
    padding: 20,
    elevation: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
  },
  buttonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  buttonLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  buttonTextContainer: {
    marginLeft: 16,
    flex: 1,
  },
  buttonTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  buttonSubtitle: {
    color: 'rgba(255, 255, 255, 0.9)',
    fontSize: 13,
  },
  footerInfo: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#fff3cd',
    padding: 16,
    borderRadius: 8,
    marginTop: 8,
  },
  footerText: {
    marginLeft: 12,
    color: '#856404',
    flex: 1,
    lineHeight: 20,
    fontSize: 14,
  },
});

import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import { documentsAPI } from '../../api';
import AppBar from '../../components/common/AppBar';
import {
  FkButton,
  FkDocumentUpload,
  FkFormSection,
} from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useFkTokens } from '../../hooks/useFkTokens';
import { buildFullUrl } from '../../utils/fileHelpers';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentsScreen'>;
type DocType = 'license' | 'tax' | 'k_document';

export default function DocumentsScreen({ navigation, route }: Props) {
  const { screenBg, isDarkMode, appColors } = useAppTheme();
  const { tokens } = useFkTokens();

  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [taxPlatePhoto, setTaxPlatePhoto] = useState<string | null>(null);
  const [kDocumentPhoto, setKDocumentPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<
    'pending' | 'approved' | 'rejected' | null
  >(null);

  const fromRegistration = route.params?.fromRegistration || false;
  const approved = verificationStatus === 'approved';

  useFocusEffect(
    React.useCallback(() => {
      loadDocuments();
    }, []),
  );

  useEffect(() => {
    if (!uploading) return;
    const unsubscribe = navigation.addListener('beforeRemove', (e) => {
      if (!uploading) return;
      e.preventDefault();
      Alert.alert(
        'Yükleme Devam Ediyor',
        'Belgeleriniz yükleniyor. Lütfen işlem tamamlanana kadar bekleyin.',
        [{ text: 'Tamam' }],
      );
    });
    return unsubscribe;
  }, [uploading, navigation]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentsAPI.getDocuments();
      if (response.license_photo) setLicensePhoto(buildFullUrl(response.license_photo));
      if (response.tax_plate_photo) setTaxPlatePhoto(buildFullUrl(response.tax_plate_photo));
      if (response.k_document_photo) setKDocumentPhoto(buildFullUrl(response.k_document_photo));
      setVerificationStatus(response.verification_status);
    } catch (error: any) {
      if (error?.response?.status !== 404) {
        logger.error('general', 'DocumentsScreen.loadDocuments failure', {
          status: error?.response?.status,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const guardApproved = () => {
    if (approved) {
      Alert.alert('Uyarı', 'Onaylanmış belgeler değiştirilemez.');
      return true;
    }
    return false;
  };

  const setDoc = (type: DocType, uri: string | null) => {
    if (guardApproved()) return;
    if (type === 'license') setLicensePhoto(uri);
    else if (type === 'tax') setTaxPlatePhoto(uri);
    else setKDocumentPhoto(uri);
  };

  const handleSubmit = async () => {
    if (guardApproved()) return;

    const missing: string[] = [];
    if (!licensePhoto) missing.push('• Ehliyet Fotoğrafı');
    if (!taxPlatePhoto) missing.push('• Vergi Levhası');
    if (!kDocumentPhoto) missing.push('• K Belgesi');
    if (missing.length > 0) {
      Alert.alert('Eksik Belge', `Aşağıdaki belgeler zorunludur:\n${missing.join('\n')}`);
      return;
    }

    const hasNewLicense = !!(licensePhoto && !licensePhoto.startsWith('http'));
    const hasNewTax = !!(taxPlatePhoto && !taxPlatePhoto.startsWith('http'));
    const hasNewK = !!(kDocumentPhoto && !kDocumentPhoto.startsWith('http'));

    if (!hasNewLicense && !hasNewTax && !hasNewK) {
      Alert.alert('Bilgi', 'Yüklenecek yeni belge bulunmuyor.');
      return;
    }

    setUploading(true);
    try {
      await documentsAPI.uploadDocuments(
        hasNewLicense ? licensePhoto : null,
        hasNewTax ? taxPlatePhoto : null,
        hasNewK ? kDocumentPhoto : null,
      );
      setVerificationStatus('pending');

      if (fromRegistration) return;

      Alert.alert(
        'Başarılı',
        'Belgeleriniz başarıyla yüklendi ve yönetici tarafından onay bekliyor.',
        [
          {
            text: 'Tamam',
            onPress: async () => {
              navigation.reset({ index: 0, routes: [{ name: 'Tabs' }] });
              setTimeout(async () => {
                try {
                  const completenessResponse = await documentsAPI.checkProfileCompleteness();
                  if (
                    !completenessResponse.is_complete &&
                    completenessResponse.missing_fields.length > 0
                  ) {
                    const missingMessages = completenessResponse.missing_fields
                      .map((field) => `• ${field.message}`)
                      .join('\n');
                    Alert.alert(
                      '⚠️ Profil Tamamlama Gerekli',
                      `Profiliniz %${completenessResponse.completion_percentage} tamamlanmış.\n\nKalan eksik bilgiler:\n${missingMessages}\n\nİşleri kabul edebilmek için lütfen tüm bilgilerinizi tamamlayın.`,
                      [
                        { text: 'Daha Sonra', style: 'cancel' },
                        {
                          text: 'Tamamla',
                          onPress: () => {
                            // @ts-ignore
                            navigation.navigate('MissingDocuments');
                          },
                        },
                      ],
                    );
                  }
                } catch (error: any) {
                  logger.error('general', 'DocumentsScreen.profileCompleteness failure', {
                    status: error?.response?.status,
                  });
                }
              }, 1000);
            },
          },
        ],
      );
    } catch (error: any) {
      logger.error('general', 'DocumentsScreen.uploadDocuments failure', {
        status: error?.response?.status,
      });
      let errorMessage = 'Belgeler yüklenirken bir hata oluştu.';
      if (error?.response?.data) {
        const errorData = error.response.data;
        if (errorData.license_photo && Array.isArray(errorData.license_photo))
          errorMessage = `Ehliyet fotoğrafı hatası: ${errorData.license_photo.join(', ')}`;
        else if (errorData.tax_plate_photo && Array.isArray(errorData.tax_plate_photo))
          errorMessage = `Vergi levhası hatası: ${errorData.tax_plate_photo.join(', ')}`;
        else if (errorData.message) errorMessage = errorData.message;
        else if (errorData.error) errorMessage = errorData.error;
      }
      Alert.alert(
        'Belge Yükleme Hatası',
        errorMessage +
          "\n\nLütfen fotoğrafın net ve okunaklı olduğundan, JPG veya PNG formatında olduğundan ve 5MB'dan küçük olduğundan emin olun.",
        [{ text: 'Tamam' }],
      );
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = () => {
    if (guardApproved()) return;
    Alert.alert(
      'Belgeleri Sil',
      'Tüm yüklü belgelerinizi silmek istediğinizden emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await documentsAPI.deleteDocuments();
              setLicensePhoto(null);
              setTaxPlatePhoto(null);
              setKDocumentPhoto(null);
              setVerificationStatus(null);
              Alert.alert('Başarılı', 'Belgeler başarıyla silindi.');
            } catch (error: any) {
              logger.error('general', 'DocumentsScreen.deleteDocuments failure', {
                status: error?.response?.status,
              });
              const errorMessage =
                error?.response?.data?.error || 'Belgeler silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setLoading(false);
            }
          },
        },
      ],
    );
  };

  const statusColor = (() => {
    switch (verificationStatus) {
      case 'approved':
        return tokens.colors.success;
      case 'rejected':
        return tokens.colors.error;
      case 'pending':
        return tokens.colors.warning;
      default:
        return tokens.colors.textSecondary;
    }
  })();

  const statusText = (() => {
    switch (verificationStatus) {
      case 'approved':
        return '✓ Onaylandı';
      case 'rejected':
        return '✗ Reddedildi';
      case 'pending':
        return '⏳ Yönetici Tarafından Onay Bekliyor';
      default:
        return '❌ Yüklenmedi';
    }
  })();

  if (loading) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: screenBg }]}
        edges={['bottom']}
      >
        <AppBar title="Evraklarım" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={tokens.colors.primary} />
          <Text style={{ marginTop: 12, color: appColors.text.secondary }}>
            Belgeler yükleniyor...
          </Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: screenBg }]}
      edges={['bottom']}
    >
      <AppBar title="Evraklarım" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        <Text
          variant="bodyMedium"
          style={[
            styles.infoText,
            { color: appColors.text.secondary, backgroundColor: tokens.colors.infoSoft },
          ]}
        >
          Ehliyet, vergi levhası ve K belgesi belgelerinizi yükleyin.
        </Text>

        {verificationStatus && (
          <Card style={[styles.statusCard, { borderColor: statusColor }]}>
            <Card.Content>
              <Text style={[styles.statusText, { color: statusColor }]}>{statusText}</Text>
            </Card.Content>
          </Card>
        )}

        <FkFormSection title="🪪 Ehliyet Fotoğrafı (Ön Yüz)" required>
          <FkDocumentUpload
            helperText="Ehliyetinizin ön yüzünü net bir şekilde çekin veya yükleyin."
            value={licensePhoto}
            onChange={(uri) => setDoc('license', uri)}
            disabled={approved}
            imageQuality={0.8}
          />
        </FkFormSection>

        <FkFormSection title="📋 Vergi Levhası" required>
          <FkDocumentUpload
            helperText="Vergi levhanızı net bir şekilde çekin veya yükleyin."
            value={taxPlatePhoto}
            onChange={(uri) => setDoc('tax', uri)}
            disabled={approved}
            imageQuality={0.8}
          />
        </FkFormSection>

        <FkFormSection title="📜 K Belgesi" required>
          <FkDocumentUpload
            helperText="K belgenizi fotoğraf çekerek, galeriden seçerek veya PDF olarak yükleyebilirsiniz."
            value={kDocumentPhoto}
            onChange={(uri) => setDoc('k_document', uri)}
            disabled={approved}
            imageQuality={0.8}
          />
        </FkFormSection>

        {!approved && (
          <View style={styles.submitSection}>
            <FkButton
              icon="upload"
              onPress={handleSubmit}
              loading={uploading}
              disabled={uploading || !licensePhoto || !taxPlatePhoto || !kDocumentPhoto}
              fullWidth
            >
              Belgeleri Gönder
            </FkButton>

            {(licensePhoto || taxPlatePhoto || kDocumentPhoto) && (
              <FkButton
                variant="danger"
                icon="delete"
                onPress={handleDelete}
                disabled={uploading}
                fullWidth
              >
                Tüm Belgeleri Sil
              </FkButton>
            )}
          </View>
        )}

        {approved && (
          <Card style={styles.approvedInfoCard}>
            <Card.Content>
              <View style={styles.approvedInfoContent}>
                <MaterialCommunityIcons name="check-circle" size={24} color={tokens.colors.success} />
                <Text style={styles.approvedInfoText}>
                  Belgeleriniz onaylanmıştır. Onaylanmış belgeler değiştirilemez veya silinemez.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {fromRegistration &&
          verificationStatus === 'pending' &&
          (licensePhoto || taxPlatePhoto) && (
            <View style={styles.continueSection}>
              <FkButton
                variant="success"
                icon="arrow-right"
                iconPosition="right"
                onPress={() =>
                  navigation.navigate('CompanyInfo', { fromRegistration: true })
                }
                fullWidth
              >
                Şirket Bilgilerine Devam Et
              </FkButton>
            </View>
          )}

        {!approved && (
          <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
            <MaterialCommunityIcons name="information" size={20} color={tokens.colors.primary} />
            <Text style={[styles.infoBoxText, { color: tokens.colors.primary }]}>
              • Belgeleriniz JPG, JPEG, PNG veya PDF formatında olmalıdır.{'\n'}
              • Maksimum dosya boyutu: 5MB{'\n'}
              • Belgeler net ve okunaklı olmalıdır.{'\n'}
              • Tüm belgeler zorunludur (Ehliyet, Vergi Levhası, K Belgesi).{'\n'}
              • Yüklenen belgeler admin tarafından onaylanacaktır.
            </Text>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  content: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },
  scrollContent: { paddingBottom: 100 },
  infoText: { marginBottom: 24, textAlign: 'center', padding: 12, borderRadius: 8 },
  statusCard: { marginBottom: 16, borderWidth: 2, borderRadius: 8 },
  statusText: { fontSize: 16, fontWeight: 'bold', textAlign: 'center' },
  submitSection: { marginVertical: 24, gap: 12 },
  approvedInfoCard: {
    marginVertical: 16,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  approvedInfoContent: { flexDirection: 'row', alignItems: 'center' },
  approvedInfoText: {
    marginLeft: 12,
    color: '#2e7d32',
    flex: 1,
    lineHeight: 20,
    fontSize: 14,
  },
  infoBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 16,
    borderRadius: 8,
    marginBottom: 24,
  },
  infoBoxText: { marginLeft: 12, flex: 1, lineHeight: 22 },
  continueSection: { marginVertical: 24 },
});

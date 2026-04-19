import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, View, Alert, Image, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, Button } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { RootStackParamList } from '../../navigation';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import * as Notifications from 'expo-notifications';
import { documentsAPI } from '../../api';
import { useAuthStore } from '../../store/authStore';
import AsyncStorage from '@react-native-async-storage/async-storage';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { isPdfFile, buildFullUrl } from '../../utils/fileHelpers';

type Props = NativeStackScreenProps<RootStackParamList, 'DocumentsScreen'>;

export default function DocumentsScreen({ navigation, route }: Props) {
  const { screenBg, cardBg, isDarkMode, appColors } = useAppTheme();
  const { setIsAuthenticated } = useAuthStore();
  const [licensePhoto, setLicensePhoto] = useState<string | null>(null);
  const [taxPlatePhoto, setTaxPlatePhoto] = useState<string | null>(null);
  const [kDocumentPhoto, setKDocumentPhoto] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [verificationStatus, setVerificationStatus] = useState<'pending' | 'approved' | 'rejected' | null>(null);

  // Kayıt akışından mı geliniyor?
  const fromRegistration = route.params?.fromRegistration || false;

  // Ekran her odaklandığında belgeleri yeniden yükle
  useFocusEffect(
    React.useCallback(() => {
      console.log('🔄 [DocumentsScreen] Ekran odaklandı, belgeler yükleniyor...');
      loadDocuments();
    }, [])
  );

  // Yükleme sırasında geri tuşunu engelle
  useEffect(() => {
    if (uploading) {
      console.log('🔒 [DocumentsScreen] Upload sırasında - geri dönüş engelleniyor');
      // Navigation listener ekle
      const unsubscribe = navigation.addListener('beforeRemove', (e) => {
        if (!uploading) {
          // Upload bitmişse, normal şekilde geri dön
          return;
        }

        // Upload devam ediyorsa, geri dönüşü engelle
        e.preventDefault();

        Alert.alert(
          'Yükleme Devam Ediyor',
          'Belgeleriniz yükleniyor. Lütfen işlem tamamlanana kadar bekleyin.',
          [{ text: 'Tamam' }]
        );
      });

      return unsubscribe;
    }
  }, [uploading, navigation]);

  const loadDocuments = async () => {
    setLoading(true);
    try {
      const response = await documentsAPI.getDocuments();

      // Backend'den gelen URL'leri tam URL'e çevir
      if (response.license_photo) {
        const fullUrl = buildFullUrl(response.license_photo);
        console.log('📷 Ehliyet URL:', fullUrl);
        setLicensePhoto(fullUrl);
      }
      if (response.tax_plate_photo) {
        const fullUrl = buildFullUrl(response.tax_plate_photo);
        console.log('📷 Vergi Levhası URL:', fullUrl);
        setTaxPlatePhoto(fullUrl);
      }
      if (response.k_document_photo) {
        const fullUrl = buildFullUrl(response.k_document_photo);
        console.log('📷 K Belgesi URL:', fullUrl);
        setKDocumentPhoto(fullUrl);
      }

      setVerificationStatus(response.verification_status);
    } catch (error: any) {
      // 404 hatası normaldir (belge yüklenmemişse)
      if (error?.response?.status !== 404) {
        console.error('❌ Belgeler yüklenirken hata:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Kameradan fotoğraf çek
  const pickImageFromCamera = async (documentType: 'license' | 'tax' | 'k_document') => {
    // Onaylanmış belgeler değiştirilemez
    if (verificationStatus === 'approved') {
      Alert.alert('Uyarı', 'Onaylanmış belgeler değiştirilemez.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Kamera erişimi için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (documentType === 'license') {
          setLicensePhoto(uri);
        } else if (documentType === 'tax') {
          setTaxPlatePhoto(uri);
        } else {
          setKDocumentPhoto(uri);
        }
      }
    } catch (error) {
      console.error('Kamera hatası:', error);
      Alert.alert('Hata', 'Fotoğraf çekilirken bir hata oluştu.');
    }
  };

  // Galeriden fotoğraf seç
  const pickImageFromGallery = async (documentType: 'license' | 'tax' | 'k_document') => {
    // Onaylanmış belgeler değiştirilemez
    if (verificationStatus === 'approved') {
      Alert.alert('Uyarı', 'Onaylanmış belgeler değiştirilemez.');
      return;
    }

    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (!permissionResult.granted) {
        Alert.alert('İzin Gerekli', 'Galeri erişimi için izin vermeniz gerekiyor.');
        return;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const uri = result.assets[0].uri;
        if (documentType === 'license') {
          setLicensePhoto(uri);
        } else if (documentType === 'tax') {
          setTaxPlatePhoto(uri);
        } else {
          setKDocumentPhoto(uri);
        }
      }
    } catch (error) {
      console.error('Galeri hatası:', error);
      Alert.alert('Hata', 'Galeri erişimi sırasında bir hata oluştu.');
    }
  };

  // PDF/dosya seç
  const pickDocumentFile = async (documentType: 'license' | 'tax' | 'k_document') => {
    if (verificationStatus === 'approved') {
      Alert.alert('Uyarı', 'Onaylanmış belgeler değiştirilemez.');
      return;
    }

    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ['application/pdf', 'image/jpeg', 'image/png'],
        copyToCacheDirectory: true,
      });

      if (!result.canceled && result.assets && result.assets.length > 0) {
        const file = result.assets[0];

        // Boyut kontrolü (5MB)
        if (file.size && file.size > 5 * 1024 * 1024) {
          Alert.alert('Hata', 'Dosya boyutu 5MB\'dan küçük olmalıdır.');
          return;
        }

        // Format kontrolü
        const ext = file.name?.toLowerCase().split('.').pop();
        if (!['jpg', 'jpeg', 'png', 'pdf'].includes(ext || '')) {
          Alert.alert('Hata', 'Sadece JPG, PNG ve PDF dosyaları kabul edilir.');
          return;
        }

        if (documentType === 'license') {
          setLicensePhoto(file.uri);
        } else if (documentType === 'tax') {
          setTaxPlatePhoto(file.uri);
        } else {
          setKDocumentPhoto(file.uri);
        }
      }
    } catch (error) {
      console.error('Dosya seçme hatası:', error);
      Alert.alert('Hata', 'Dosya seçilirken bir hata oluştu.');
    }
  };

  // Fotoğrafı/dosyayı sil
  const removePhoto = (documentType: 'license' | 'tax' | 'k_document') => {
    // Onaylanmış belgeler silinemez
    if (verificationStatus === 'approved') {
      Alert.alert('Uyarı', 'Onaylanmış belgeler silinemez.');
      return;
    }

    if (documentType === 'license') {
      setLicensePhoto(null);
    } else if (documentType === 'tax') {
      setTaxPlatePhoto(null);
    } else {
      setKDocumentPhoto(null);
    }
  };

  // Bildirim izni iste
  const requestNotificationPermission = async (): Promise<boolean> => {
    try {
      console.log('🔔 [DocumentsScreen] Bildirim izni isteniyor...');

      const { status: existingStatus } = await Notifications.getPermissionsAsync();

      if (existingStatus === 'granted') {
        console.log('✅ [DocumentsScreen] Bildirim izni zaten verilmiş');
        return true;
      }

      // İzin iste
      const { status } = await Notifications.requestPermissionsAsync();

      if (status === 'granted') {
        console.log('✅ [DocumentsScreen] Bildirim izni verildi');
        return true;
      } else {
        console.log('❌ [DocumentsScreen] Bildirim izni reddedildi');
        return false;
      }
    } catch (error) {
      console.error('❌ [DocumentsScreen] Bildirim izni hatası:', error);
      return false;
    }
  };

  // Bildirim izni reddedildiyse tekrar sor
  const showNotificationPermissionRetryDialog = () => {
    Alert.alert(
      'Bildirim İzni Gerekli',
      'İşleri görebilmeniz için bildirime izin vermeniz gerekmektedir. Bildirimler sayesinde yeni iş taleplerinden haberdar olabilirsiniz.',
      [
        {
          text: 'İptal',
          style: 'cancel',
          onPress: () => {
            console.log('⚠️ [DocumentsScreen] Kullanıcı bildirim iznini atladı');
          }
        },
        {
          text: 'İzin Ver',
          onPress: async () => {
            const granted = await requestNotificationPermission();
            if (!granted) {
              // Hala reddedildiyse, tekrar gösterme
              console.log('⚠️ [DocumentsScreen] Bildirim izni tekrar reddedildi');
            }
          }
        }
      ]
    );
  };

  // Belgeleri backend'e gönder
  const handleSubmit = async () => {
    // Onaylanmış belgeler değiştirilemez
    if (verificationStatus === 'approved') {
      Alert.alert('Uyarı', 'Onaylanmış belgeler değiştirilemez.');
      return;
    }

    // En az bir belge seçilmiş olmalı
    if (!licensePhoto && !taxPlatePhoto) {
      Alert.alert('Uyarı', 'Lütfen en az bir belge yükleyin.');
      return;
    }

    // Yeni yüklenen fotoğrafları kontrol et (http/https ile başlamıyorsa yeni - file:// veya content:// olabilir)
    const hasNewLicensePhoto = licensePhoto && !licensePhoto.startsWith('http');
    const hasNewTaxPhoto = taxPlatePhoto && !taxPlatePhoto.startsWith('http');
    const hasNewKDocumentPhoto = kDocumentPhoto && !kDocumentPhoto.startsWith('http');

    if (!hasNewLicensePhoto && !hasNewTaxPhoto && !hasNewKDocumentPhoto) {
      Alert.alert('Bilgi', 'Yüklenecek yeni belge bulunmuyor.');
      return;
    }

    console.log('📤 [DocumentsScreen] Belge yükleme başlıyor...');
    console.log('   • Ehliyet:', hasNewLicensePhoto ? 'Var' : 'Yok');
    console.log('   • Vergi Levhası:', hasNewTaxPhoto ? 'Var' : 'Yok');
    console.log('   • K Belgesi:', hasNewKDocumentPhoto ? 'Var' : 'Yok');

    setUploading(true);
    try {
      const response = await documentsAPI.uploadDocuments(
        hasNewLicensePhoto ? licensePhoto : null,
        hasNewTaxPhoto ? taxPlatePhoto : null,
        hasNewKDocumentPhoto ? kDocumentPhoto : null
      );

      console.log('✅ [DocumentsScreen] Belgeler başarıyla yüklendi:', response);

      // Belge durumunu güncelle
      setVerificationStatus('pending');

      // Kayıt akışındaysa Alert gösterme, local URI'leri koru
      if (fromRegistration) {
        console.log('✅ [DocumentsScreen] Kayıt akışı - belgeler yüklendi, local görseller korunuyor');
        // loadDocuments() çağrılmıyor: kullanıcı seçtiği görseli ekranda görsün
        // Backend URL'leri bir sonraki ekran açılışında useFocusEffect ile yüklenecek
      } else {
        // Normal akış - Alert göster ve ana ekrana yönlendir
        Alert.alert(
          'Başarılı',
          'Belgeleriniz başarıyla yüklendi ve yönetici tarafından onay bekliyor.',
          [
            {
              text: 'Tamam',
              onPress: async () => {
                console.log('✅ [DocumentsScreen] Ana ekrana yönlendiriliyor...');

                // Ana ekrana yönlendir (Tab Navigator)
                navigation.reset({
                  index: 0,
                  routes: [{ name: 'Tabs' }],
                });

                // Arka planda profil tamamlanma durumunu kontrol et
                setTimeout(async () => {
                  try {
                    console.log('🔍 [DocumentsScreen] Profil tamamlanma durumu kontrol ediliyor...');
                    const completenessResponse = await documentsAPI.checkProfileCompleteness();
                    console.log('📋 [DocumentsScreen] Profil durumu:', completenessResponse);

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
                              // @ts-ignore
                              navigation.navigate('MissingDocuments');
                            }
                          }
                        ]
                      );
                    } else {
                      console.log('✅ [DocumentsScreen] Profil tamamlandı!');
                    }
                  } catch (error) {
                    console.error('❌ [DocumentsScreen] Profil durumu kontrol hatası:', error);
                  }
                }, 1000); // Ana ekrana geçiş animasyonu için 1 saniye bekle
              }
            }
          ]
        );
      }
    } catch (error: any) {
      console.error('❌ [DocumentsScreen] Belge yükleme hatası:', error);
      console.error('   • Error response:', error?.response);
      console.error('   • Error data:', error?.response?.data);

      // Backend'den gelen detaylı hata mesajını göster
      let errorMessage = 'Belgeler yüklenirken bir hata oluştu.';

      if (error?.response?.data) {
        const errorData = error.response.data;

        // license_photo hatası varsa
        if (errorData.license_photo && Array.isArray(errorData.license_photo)) {
          errorMessage = `Ehliyet fotoğrafı hatası: ${errorData.license_photo.join(', ')}`;
        }
        // tax_plate_photo hatası varsa
        else if (errorData.tax_plate_photo && Array.isArray(errorData.tax_plate_photo)) {
          errorMessage = `Vergi levhası hatası: ${errorData.tax_plate_photo.join(', ')}`;
        }
        // Genel message varsa
        else if (errorData.message) {
          errorMessage = errorData.message;
        }
        // Genel error varsa
        else if (errorData.error) {
          errorMessage = errorData.error;
        }
      }

      Alert.alert(
        'Belge Yükleme Hatası',
        errorMessage + '\n\nLütfen fotoğrafın net ve okunaklı olduğundan, JPG veya PNG formatında olduğundan ve 5MB\'dan küçük olduğundan emin olun.',
        [{ text: 'Tamam' }]
      );
    } finally {
      console.log('🏁 [DocumentsScreen] Upload işlemi tamamlandı');
      setUploading(false);
    }
  };

  // Belgeleri sil
  const handleDelete = () => {
    // Onaylanmış belgeler silinemez
    if (verificationStatus === 'approved') {
      Alert.alert('Uyarı', 'Onaylanmış belgeler silinemez.');
      return;
    }

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
              console.error('❌ Belge silme hatası:', error);
              const errorMessage = error?.response?.data?.error || 'Belgeler silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setLoading(false);
            }
          }
        }
      ]
    );
  };

  const getStatusColor = () => {
    switch (verificationStatus) {
      case 'approved': return '#4CAF50';
      case 'rejected': return '#f44336';
      case 'pending': return '#ff9800';
      default: return '#666';
    }
  };

  const getStatusText = () => {
    switch (verificationStatus) {
      case 'approved': return '✓ Onaylandı';
      case 'rejected': return '✗ Reddedildi';
      case 'pending': return '⏳ Yönetici Tarafından Onay Bekliyor';
      default: return '❌ Yüklenmedi';
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Evraklarım" />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#26a69a" />
          <Text style={{ marginTop: 12, color: appColors.text.secondary }}>Belgeler yükleniyor...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Evraklarım" />
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>

        <Text variant="bodyMedium" style={[styles.infoText, { color: appColors.text.secondary, backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
          Ehliyet, vergi levhası ve K belgesi belgelerinizi yükleyin.
        </Text>

        {/* Onay Durumu */}
        {verificationStatus && (
          <Card style={[styles.statusCard, { borderColor: getStatusColor() }]}>
            <Card.Content>
              <Text style={[styles.statusText, { color: getStatusColor() }]}>
                {getStatusText()}
              </Text>
            </Card.Content>
          </Card>
        )}

        {/* Ehliyet Fotoğrafı */}
        <Card style={[styles.documentCard, { backgroundColor: cardBg }]}>
          <Card.Content>
            <View style={styles.documentHeader}>
              <MaterialCommunityIcons name="card-account-details" size={24} color="#26a69a" />
              <Text variant="titleMedium" style={styles.documentTitle}>
                Ehliyet Fotoğrafı (Ön Yüz)
              </Text>
            </View>

            <Text variant="bodySmall" style={[styles.documentSubtitle, { color: appColors.text.secondary }]}>
              Ehliyetinizin ön yüzünü net bir şekilde çekin veya yükleyin.
            </Text>

            {licensePhoto ? (
              <View style={styles.photoPreview}>
                {isPdfFile(licensePhoto) ? (
                  <View style={styles.pdfPreview}>
                    <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
                    <Text style={styles.pdfFileName} numberOfLines={1}>
                      {licensePhoto.split('/').pop()}
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: licensePhoto }} style={styles.previewImage} />
                )}
                {verificationStatus !== 'approved' && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto('license')}
                  >
                    <MaterialCommunityIcons name="close-circle" size={32} color="#f44336" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
                <Text style={styles.placeholderText}>Henüz dosya eklenmedi</Text>
              </View>
            )}

            {verificationStatus !== 'approved' && (
              <View style={styles.buttonColumn}>
                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    icon="camera"
                    onPress={() => pickImageFromCamera('license')}
                    style={[styles.actionButton, styles.cameraButton]}
                  >
                    Fotoğraf Çek
                  </Button>
                  <Button
                    mode="contained"
                    icon="image"
                    onPress={() => pickImageFromGallery('license')}
                    style={[styles.actionButton, styles.galleryButton]}
                  >
                    Galeriden Seç
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  icon="file-upload"
                  onPress={() => pickDocumentFile('license')}
                  style={styles.filePickerButton}
                >
                  Dosya Seç (PDF)
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Vergi Levhası */}
        <Card style={[styles.documentCard, { backgroundColor: cardBg }]}>
          <Card.Content>
            <View style={styles.documentHeader}>
              <MaterialCommunityIcons name="file-document" size={24} color="#26a69a" />
              <Text variant="titleMedium" style={styles.documentTitle}>
                Vergi Levhası
              </Text>
            </View>

            <Text variant="bodySmall" style={[styles.documentSubtitle, { color: appColors.text.secondary }]}>
              Vergi levhanızı net bir şekilde çekin veya yükleyin.
            </Text>

            {taxPlatePhoto ? (
              <View style={styles.photoPreview}>
                {isPdfFile(taxPlatePhoto) ? (
                  <View style={styles.pdfPreview}>
                    <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
                    <Text style={styles.pdfFileName} numberOfLines={1}>
                      {taxPlatePhoto.split('/').pop()}
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: taxPlatePhoto }} style={styles.previewImage} />
                )}
                {verificationStatus !== 'approved' && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto('tax')}
                  >
                    <MaterialCommunityIcons name="close-circle" size={32} color="#f44336" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="image-off" size={48} color="#ccc" />
                <Text style={styles.placeholderText}>Henüz dosya eklenmedi</Text>
              </View>
            )}

            {verificationStatus !== 'approved' && (
              <View style={styles.buttonColumn}>
                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    icon="camera"
                    onPress={() => pickImageFromCamera('tax')}
                    style={[styles.actionButton, styles.cameraButton]}
                  >
                    Fotoğraf Çek
                  </Button>
                  <Button
                    mode="contained"
                    icon="image"
                    onPress={() => pickImageFromGallery('tax')}
                    style={[styles.actionButton, styles.galleryButton]}
                  >
                    Galeriden Seç
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  icon="file-upload"
                  onPress={() => pickDocumentFile('tax')}
                  style={styles.filePickerButton}
                >
                  Dosya Seç (PDF)
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* K Belgesi (Opsiyonel) */}
        <Card style={[styles.documentCard, { backgroundColor: cardBg }]}>
          <Card.Content>
            <View style={styles.documentHeader}>
              <MaterialCommunityIcons name="file-certificate" size={24} color="#26a69a" />
              <Text variant="titleMedium" style={styles.documentTitle}>
                K Belgesi
              </Text>
              <View style={styles.optionalBadge}>
                <Text style={styles.optionalText}>Opsiyonel</Text>
              </View>
            </View>

            <Text variant="bodySmall" style={[styles.documentSubtitle, { color: appColors.text.secondary }]}>
              K belgenizi fotoğraf çekerek, galeriden seçerek veya PDF olarak yükleyebilirsiniz.
            </Text>

            {kDocumentPhoto ? (
              <View style={styles.photoPreview}>
                {isPdfFile(kDocumentPhoto) ? (
                  <View style={styles.pdfPreview}>
                    <MaterialCommunityIcons name="file-pdf-box" size={48} color="#f44336" />
                    <Text style={styles.pdfFileName} numberOfLines={1}>
                      {kDocumentPhoto.split('/').pop()}
                    </Text>
                  </View>
                ) : (
                  <Image source={{ uri: kDocumentPhoto }} style={styles.previewImage} />
                )}
                {verificationStatus !== 'approved' && (
                  <TouchableOpacity
                    style={styles.removeButton}
                    onPress={() => removePhoto('k_document')}
                  >
                    <MaterialCommunityIcons name="close-circle" size={32} color="#f44336" />
                  </TouchableOpacity>
                )}
              </View>
            ) : (
              <View style={styles.photoPlaceholder}>
                <MaterialCommunityIcons name="file-certificate-outline" size={48} color="#ccc" />
                <Text style={styles.placeholderText}>Henüz dosya eklenmedi</Text>
              </View>
            )}

            {verificationStatus !== 'approved' && (
              <View style={styles.buttonColumn}>
                <View style={styles.buttonRow}>
                  <Button
                    mode="contained"
                    icon="camera"
                    onPress={() => pickImageFromCamera('k_document')}
                    style={[styles.actionButton, styles.cameraButton]}
                  >
                    Fotoğraf Çek
                  </Button>
                  <Button
                    mode="contained"
                    icon="image"
                    onPress={() => pickImageFromGallery('k_document')}
                    style={[styles.actionButton, styles.galleryButton]}
                  >
                    Galeriden Seç
                  </Button>
                </View>
                <Button
                  mode="outlined"
                  icon="file-upload"
                  onPress={() => pickDocumentFile('k_document')}
                  style={styles.filePickerButton}
                >
                  Dosya Seç (PDF)
                </Button>
              </View>
            )}
          </Card.Content>
        </Card>

        {/* Gönder ve Sil Butonları */}
        {verificationStatus !== 'approved' && (
          <View style={styles.submitSection}>
            <Button
              mode="contained"
              icon="upload"
              onPress={handleSubmit}
              loading={uploading}
              disabled={uploading || (!licensePhoto && !taxPlatePhoto && !kDocumentPhoto)}
              style={styles.submitButton}
            >
              Belgeleri Gönder
            </Button>

            {(licensePhoto || taxPlatePhoto || kDocumentPhoto) && (
              <Button
                mode="outlined"
                icon="delete"
                onPress={handleDelete}
                disabled={uploading}
                style={styles.deleteButton}
                textColor="#f44336"
              >
                Tüm Belgeleri Sil
              </Button>
            )}
          </View>
        )}

        {/* Onaylanmış belgeler için bilgilendirme */}
        {verificationStatus === 'approved' && (
          <Card style={styles.approvedInfoCard}>
            <Card.Content>
              <View style={styles.approvedInfoContent}>
                <MaterialCommunityIcons name="check-circle" size={24} color="#4CAF50" />
                <Text style={styles.approvedInfoText}>
                  Belgeleriniz onaylanmıştır. Onaylanmış belgeler değiştirilemez veya silinemez.
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}



        {/* Devam Et Butonu - Sadece kayıt akışında ve belgeler yüklendiyse göster */}
        {fromRegistration && verificationStatus === 'pending' && (licensePhoto || taxPlatePhoto) && (
          <View style={styles.continueSection}>
            <Button
              mode="contained"
              icon="arrow-right"
              onPress={() => {
                console.log('✅ [DocumentsScreen] Kayıt akışı devam - Şirket bilgilerine yönlendiriliyor...');
                navigation.navigate('CompanyInfo', { fromRegistration: true });
              }}
              style={styles.continueButton}
              contentStyle={{ flexDirection: 'row-reverse' }}
            >
              Şirket Bilgilerine Devam Et
            </Button>
          </View>
        )}
        {/* Bilgi kutusu - Sadece belgeler onaylanmamışsa göster */}
        {verificationStatus !== 'approved' && (
          <View style={[styles.infoBox, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
            <MaterialCommunityIcons name="information" size={20} color="#26a69a" />
            <Text style={styles.infoBoxText}>
              • Belgeleriniz JPG, JPEG, PNG veya PDF formatında olmalıdır.{'\n'}
              • Maksimum dosya boyutu: 5MB{'\n'}
              • Belgeler net ve okunaklı olmalıdır.{'\n'}
              • K Belgesi opsiyoneldir.{'\n'}
              • Yüklenen belgeler admin tarafından onaylanacaktır.
            </Text>
          </View>
        )}
      </ScrollView>
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
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  infoText: {
    marginBottom: 24,
    textAlign: 'center',
    padding: 12,
    borderRadius: 8,
  },
  statusCard: {
    marginBottom: 16,
    borderWidth: 2,
    borderRadius: 8,
  },
  statusText: {
    fontSize: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  documentCard: {
    marginBottom: 20,
  },
  documentHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  documentTitle: {
    marginLeft: 8,
    fontWeight: 'bold',
    color: '#26a69a',
  },
  documentSubtitle: {
    marginBottom: 16,
  },
  photoPreview: {
    position: 'relative',
    marginBottom: 16,
    borderRadius: 8,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
    backgroundColor: '#000',
  },
  removeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 16,
  },
  photoPlaceholder: {
    height: 150,
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    borderWidth: 2,
    borderColor: '#e0e0e0',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  placeholderText: {
    marginTop: 8,
    color: '#999',
    fontSize: 14,
  },
  buttonColumn: {
    gap: 12,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
  },
  cameraButton: {
    backgroundColor: '#26a69a',
  },
  galleryButton: {
    backgroundColor: '#4CAF50',
  },
  filePickerButton: {
    borderColor: '#666',
  },
  pdfPreview: {
    height: 150,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  pdfFileName: {
    color: '#333',
    fontSize: 14,
    fontWeight: '600',
    maxWidth: '80%',
  },
  optionalBadge: {
    backgroundColor: '#e0e0e0',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 12,
    marginLeft: 8,
  },
  optionalText: {
    fontSize: 11,
    color: '#666',
    fontWeight: '600',
  },
  submitSection: {
    marginVertical: 24,
    gap: 12,
  },
  submitButton: {
    paddingVertical: 8,
    backgroundColor: '#26a69a',
  },
  deleteButton: {
    paddingVertical: 8,
    borderColor: '#f44336',
  },
  approvedInfoCard: {
    marginVertical: 16,
    backgroundColor: '#e8f5e9',
    borderWidth: 1,
    borderColor: '#4CAF50',
  },
  approvedInfoContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
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
  infoBoxText: {
    marginLeft: 12,
    color: '#26a69a',
    flex: 1,
    lineHeight: 22,
  },
  continueSection: {
    marginVertical: 24,
  },
  continueButton: {
    paddingVertical: 8,
    backgroundColor: '#4CAF50',
  },
});

/**
 * Hizmet Alanı (Service City) Ekranı
 *
 * Sürücünün iş aldığı şehri seçtiği/güncellediği ekran. Backend `service_city`
 * boşsa hiçbir talep listede görünmez ve FCM bildirimi gelmez — bu sebeple
 * profil menüsünde Evraklar'ın üstünde yer alır.
 */
import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  View,
  Modal,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, TextInput, IconButton, Searchbar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import authAPI from '../../api/auth';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getCityNames } from '../../data/turkeyLocations';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceCity'>;

export default function ServiceCityScreen({ navigation }: Props) {
  const { screenBg, cardBg, isDarkMode, appColors } = useAppTheme();
  const { setCurrentUser } = useAuthStore();

  const [serviceCity, setServiceCity] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Modal state
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const allCities = getCityNames();
  const filteredCities = search
    ? allCities.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : allCities;

  // Mevcut hizmet şehrini backend'den çek. Boşsa iş ilini default olarak öner.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await authAPI.getProfile();
        if (cancelled) return;
        const user: any = response.user;
        setServiceCity(user.service_city || user.business_address_il || '');
      } catch {
        if (cancelled) return;
        logger.error('general', 'ServiceCityScreen.loadProfile failed');
        Alert.alert('Hata', 'Profil bilgileri yüklenirken bir hata oluştu.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSelectCity = (city: string) => {
    setServiceCity(city);
    if (error) setError('');
    setSearch('');
    setModalVisible(false);
  };

  const handleSave = async () => {
    if (!serviceCity.trim()) {
      setError('Hizmet şehri seçimi zorunludur — iş bildirimleri için gerekli');
      return;
    }
    try {
      setSaving(true);
      const response = await authAPI.updateProfile({
        service_city: serviceCity.trim(),
      });
      if (response.user) {
        setCurrentUser(response.user);
      }
      Alert.alert(
        'Başarılı',
        'Hizmet şehriniz kaydedildi. Yalnızca bu şehirdeki iş talepleri size bildirilecek.',
        [{ text: 'Tamam', onPress: () => navigation.goBack() }]
      );
    } catch (err: any) {
      logger.error('general', 'ServiceCityScreen.save failed');
      const message =
        err?.response?.data?.message ||
        err?.response?.data?.error ||
        'Hizmet şehri kaydedilirken bir hata oluştu.';
      Alert.alert('Hata', message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color="#26a69a" />
        <Text style={[styles.loadingText, { color: appColors.text.secondary }]}>
          Yükleniyor...
        </Text>
      </SafeAreaView>
    );
  }

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Hizmet Alanı" />

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <Card style={[styles.formCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconHeader}>
                <MaterialCommunityIcons name="map-marker-radius" size={32} color="#26a69a" />
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Hizmet Şehri
              </Text>
              <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: appColors.text.secondary }]}>
                Yalnızca seçtiğiniz şehirden gelen yeni iş talepleri size bildirilir.
                Boş bırakırsanız hiçbir talep alamazsınız.
              </Text>

              <TouchableOpacity onPress={() => setModalVisible(true)} activeOpacity={0.7}>
                <View pointerEvents="none">
                  <TextInput
                    label="Hizmet Şehri *"
                    value={serviceCity}
                    editable={false}
                    placeholder="Şehir seçin"
                    style={styles.input}
                    error={!!error}
                    right={<TextInput.Icon icon="chevron-down" />}
                  />
                </View>
              </TouchableOpacity>
              {!!error && <Text style={styles.errorText}>{error}</Text>}
            </Card.Content>
          </Card>

          <Card style={[styles.infoCard, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.infoText}>
                ℹ️ Hizmet şehrinizi istediğiniz zaman değiştirebilirsiniz. Yeni şehre
                geçtiğinizde önceki şehirdeki bekleyen talepleri görmezsiniz.
              </Text>
            </Card.Content>
          </Card>

          <Button
            mode="contained"
            onPress={handleSave}
            style={styles.saveButton}
            contentStyle={styles.saveButtonContent}
            icon="content-save"
            disabled={saving}
          >
            {saving ? 'Kaydediliyor...' : 'Kaydet'}
          </Button>
        </ScrollView>

        {/* Şehir Seçim Modal */}
        <Modal
          visible={modalVisible}
          transparent
          animationType="slide"
          onRequestClose={() => setModalVisible(false)}
        >
          <View style={styles.modalOverlay}>
            <View style={[styles.modalContent, { backgroundColor: cardBg }]}>
              <View style={styles.modalHeader}>
                <Text variant="titleLarge" style={styles.modalTitle}>Hizmet Şehri Seçiniz</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => setModalVisible(false)}
                />
              </View>

              <Searchbar
                placeholder="İl ara..."
                onChangeText={setSearch}
                value={search}
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
                      key={`service-city-${index}-${city}`}
                      style={[
                        styles.modalItem,
                        serviceCity === city && { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }
                      ]}
                      onPress={() => handleSelectCity(city)}
                    >
                      <Text style={[
                        styles.modalItemText,
                        serviceCity === city && styles.modalItemTextSelected
                      ]}>
                        {city}
                      </Text>
                      {serviceCity === city && (
                        <MaterialCommunityIcons name="check" size={24} color="#26a69a" />
                      )}
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              )}
            </View>
          </View>
        </Modal>
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
  formCard: { marginBottom: 16, borderRadius: 12, elevation: 2 },
  cardContent: { padding: 20 },
  iconHeader: { alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontWeight: 'bold', marginBottom: 4, color: '#26a69a', textAlign: 'center' },
  sectionSubtitle: { marginBottom: 20, textAlign: 'center', lineHeight: 18 },
  input: { marginBottom: 4 },
  errorText: { color: '#d32f2f', fontSize: 12, marginTop: 4, marginLeft: 12 },
  infoCard: { marginBottom: 20, borderRadius: 12 },
  infoText: { color: '#1565c0', lineHeight: 20 },
  saveButton: { marginBottom: 20, borderRadius: 12 },
  saveButtonContent: { paddingVertical: 8 },
  // Modal
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
  modalTitle: { fontWeight: 'bold', color: '#26a69a' },
  searchBar: { margin: 16, elevation: 0 },
  modalList: { maxHeight: 500 },
  modalItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  modalItemText: { fontSize: 16, color: '#000' },
  modalItemTextSelected: { fontWeight: 'bold', color: '#26a69a' },
});

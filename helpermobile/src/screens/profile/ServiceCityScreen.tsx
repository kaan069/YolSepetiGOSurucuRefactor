/**
 * Hizmet Alanı (Service Cities) Ekranı
 *
 * Sürücünün iş aldığı şehirleri seçtiği/güncellediği ekran. Backend
 * `service_cities` boş listeyse hiçbir talep listede görünmez ve FCM
 * bildirimi gelmez. Çoklu seçim, limit yok (81 ile sınırlı).
 *
 * UI özellikleri:
 *  - Seçili şehirler kapatılabilir chip olarak gösterilir
 *  - Tüm Şehirleri Seç / Tümünü Temizle hızlı butonları
 *  - 7 coğrafi bölge chip'i (Marmara, Ege, Akdeniz, İç Anadolu, Karadeniz,
 *    Doğu Anadolu, Güneydoğu Anadolu) — tek dokunuşla bölgenin tamamını
 *    ekler/çıkarır
 *  - "Şehir Ekle" modal'ı ile teker teker seçim
 *
 * Kaydetme: Backend PATCH her seferinde TÜM listeyi alır — incremental yok.
 */
import React, { useState, useEffect, useMemo, useRef } from 'react';
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
import { Button, Card, Text, IconButton, Searchbar, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import authAPI from '../../api/auth';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { getCityNames, TURKEY_REGIONS } from '../../data/turkeyLocations';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceCity'>;

// İki liste aynı şehirleri içeriyor mu? (sıra önemsiz)
function arraysEqual(a: string[], b: string[]): boolean {
  if (a.length !== b.length) return false;
  const sa = new Set(a);
  for (const x of b) if (!sa.has(x)) return false;
  return true;
}

export default function ServiceCityScreen({ navigation }: Props) {
  const { screenBg, cardBg, isDarkMode, appColors } = useAppTheme();
  const { setCurrentUser } = useAuthStore();

  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');

  // Auto-save için ref'ler — debounce timer, ilk-yükleme bayrağı, son kaydedilen liste
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoadRef = useRef(true);
  const lastSavedRef = useRef<string[]>([]);
  // En güncel serviceCities'i ref'te de tut — unmount flush için
  const latestCitiesRef = useRef<string[]>([]);

  // Modal (şehir ekleme) state
  const [modalVisible, setModalVisible] = useState(false);
  const [search, setSearch] = useState('');
  const allCities = useMemo(() => getCityNames(), []);
  const totalCityCount = allCities.length;

  const filteredCities = search
    ? allCities.filter(c => c.toLowerCase().includes(search.toLowerCase()))
    : allCities;

  // Mevcut hizmet şehirlerini backend'den çek. Boşsa iş ilini default olarak öner.
  // İlk yüklemede backend'den dönen liste lastSavedRef'e yazılır — auto-save sadece
  // kullanıcı manuel bir değişiklik yaptığında çalışsın.
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        const response = await authAPI.getProfile();
        if (cancelled) return;
        const user: any = response.user;

        const existing: string[] = Array.isArray(user.service_cities) ? user.service_cities : [];
        let initial: string[];
        if (existing.length > 0) {
          initial = existing;
        } else if (user.business_address_il) {
          // İlk kez giriş — iş adresinin ilini başlangıç önerisi olarak ekle.
          // Backend'e de hemen yazılmış sayılır mı? HAYIR — bu sadece UI önerisi;
          // kullanıcı onaylayana (başka değişiklik yapana) kadar backend'de kayıtlı değil.
          // lastSavedRef boş listeyle başlasın ki bu öneri auto-save tetiklesin.
          initial = [user.business_address_il];
        } else {
          initial = [];
        }

        setServiceCities(initial);
        // lastSavedRef = backend'den ne döndüyse o
        lastSavedRef.current = existing;
        latestCitiesRef.current = initial;

        // İlk render'da gerçekten değişiklik varsa (default öneri) auto-save çalışsın.
        if (arraysEqual(initial, existing)) {
          // Hiçbir değişiklik yok — auto-save tetiklenmemeli
          isFirstLoadRef.current = true;
        } else {
          // Default öneri eklendi — auto-save akışına bırak
          isFirstLoadRef.current = false;
        }
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

  // Auto-save: kullanıcı her değişiklikte 600ms sonra backend'e PATCH gönderilir.
  // Hızlı ardışık tıklamalarda timer reset olur — yalnızca son state kaydedilir.
  useEffect(() => {
    latestCitiesRef.current = serviceCities;

    // İlk yükleme (backend'den geldiği gibi) durumunda save tetiklenmesin
    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    // Değişiklik yoksa save atma (aynı listenin gönderilmesi gereksiz API çağrısı)
    if (arraysEqual(serviceCities, lastSavedRef.current)) {
      return;
    }

    if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    saveTimeoutRef.current = setTimeout(() => {
      saveTimeoutRef.current = null;
      performSave(serviceCities);
    }, 600);

    return () => {
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
      }
    };
  }, [serviceCities]);

  // Unmount sırasında pending bir save varsa hemen gönder — kullanıcı geri tuşuna
  // 600ms içinde basarsa son değişiklik kaybolmasın.
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        const pending = latestCitiesRef.current;
        if (!arraysEqual(pending, lastSavedRef.current)) {
          // Fire and forget — promise sonucunu beklemiyoruz; ekran kapanıyor
          authAPI.updateProfile({ service_cities: pending }).catch(() => {
            logger.warn('general', 'ServiceCityScreen.flushOnUnmount failed');
          });
        }
      }
    };
  }, []);

  const performSave = async (cities: string[]) => {
    // Kaydedilen ile aynıysa atla (race condition önlemi)
    if (arraysEqual(cities, lastSavedRef.current)) return;
    try {
      setSaveStatus('saving');
      const response = await authAPI.updateProfile({
        service_cities: cities,
      });
      if (response.user) {
        setCurrentUser(response.user);
      }
      lastSavedRef.current = cities;
      setSaveStatus('saved');
      // 1.8s sonra "Kaydedildi" göstergesi sönsün
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (err: any) {
      logger.error('general', 'ServiceCityScreen.autoSave failed');
      setSaveStatus('error');
      // Local state'i son başarılı kayda geri al — UI ile backend tutarsız kalmasın
      setServiceCities(lastSavedRef.current);
      // Hata göstergesi 3s sonra söner; kullanıcı tekrar dener
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  const handleAddCity = (city: string) => {
    if (serviceCities.includes(city)) {
      setModalVisible(false);
      setSearch('');
      return;
    }
    setServiceCities(prev => [...prev, city]);
    setSearch('');
    setModalVisible(false);
  };

  const handleRemoveCity = (city: string) => {
    setServiceCities(prev => prev.filter(c => c !== city));
  };

  const handleSelectAll = () => {
    setServiceCities([...allCities]);
  };

  const handleClearAll = () => {
    if (serviceCities.length === 0) return;
    Alert.alert(
      'Tüm Şehirleri Temizle',
      'Tüm hizmet şehirleri silinecek. Liste boş kaldığı sürece hiçbir talep size bildirilmez. Devam edilsin mi?',
      [
        { text: 'Vazgeç', style: 'cancel' },
        { text: 'Temizle', style: 'destructive', onPress: () => setServiceCities([]) },
      ]
    );
  };

  // Bölgedeki tüm şehirler seçili mi?
  const getRegionStatus = (regionCities: string[]): 'all' | 'some' | 'none' => {
    const selected = regionCities.filter(c => serviceCities.includes(c)).length;
    if (selected === 0) return 'none';
    if (selected === regionCities.length) return 'all';
    return 'some';
  };

  // Bölge toggle: hepsi seçiliyse hepsini çıkar, değilse eksik olanları ekle.
  const handleRegionToggle = (regionCities: string[]) => {
    const status = getRegionStatus(regionCities);
    if (status === 'all') {
      // Bu bölgenin tüm şehirlerini çıkar
      setServiceCities(prev => prev.filter(c => !regionCities.includes(c)));
    } else {
      // Eksik olanları ekle (zaten seçili olanları koru)
      setServiceCities(prev => {
        const set = new Set(prev);
        regionCities.forEach(c => set.add(c));
        return Array.from(set);
      });
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

  const allSelected = serviceCities.length === totalCityCount;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Hizmet Alanı" />

        {/* Otomatik kaydetme durum göstergesi — değişiklik yaptığında 600ms sonra aktif olur */}
        {saveStatus !== 'idle' && (
          <View style={[
            styles.statusBanner,
            saveStatus === 'saving' && styles.statusBannerSaving,
            saveStatus === 'saved' && styles.statusBannerSaved,
            saveStatus === 'error' && styles.statusBannerError,
          ]}>
            {saveStatus === 'saving' && (
              <>
                <ActivityIndicator size="small" color="#1565c0" />
                <Text style={[styles.statusText, { color: '#1565c0' }]}>Kaydediliyor...</Text>
              </>
            )}
            {saveStatus === 'saved' && (
              <>
                <MaterialCommunityIcons name="check-circle" size={18} color="#2e7d32" />
                <Text style={[styles.statusText, { color: '#2e7d32' }]}>Kaydedildi</Text>
              </>
            )}
            {saveStatus === 'error' && (
              <>
                <MaterialCommunityIcons name="alert-circle" size={18} color="#c62828" />
                <Text style={[styles.statusText, { color: '#c62828' }]}>Kaydedilemedi — bağlantınızı kontrol edin</Text>
              </>
            )}
          </View>
        )}

        <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Ana kart - başlık ve mevcut seçim */}
          <Card style={[styles.formCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <View style={styles.iconHeader}>
                <MaterialCommunityIcons name="map-marker-radius" size={32} color="#26a69a" />
              </View>

              <Text variant="titleMedium" style={styles.sectionTitle}>
                Hizmet Şehirlerim
              </Text>
              <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: appColors.text.secondary }]}>
                Yalnızca bu listedeki şehirlerden gelen yeni iş talepleri size bildirilir.
                Liste boşsa hiçbir talep alamazsınız.
              </Text>

              {/* Hızlı eylemler */}
              <View style={styles.quickActions}>
                <Button
                  mode={allSelected ? 'contained' : 'outlined'}
                  icon={allSelected ? 'check-all' : 'select-all'}
                  onPress={handleSelectAll}
                  disabled={allSelected}
                  style={styles.quickActionButton}
                  compact
                >
                  Tüm Şehirleri Seç
                </Button>
                <Button
                  mode="outlined"
                  icon="close-circle-outline"
                  onPress={handleClearAll}
                  disabled={serviceCities.length === 0}
                  style={styles.quickActionButton}
                  textColor="#d32f2f"
                  compact
                >
                  Tümünü Temizle
                </Button>
              </View>

              <Text variant="bodySmall" style={[styles.counterText, { color: appColors.text.secondary }]}>
                {serviceCities.length} / {totalCityCount} şehir seçili
              </Text>
            </Card.Content>
          </Card>

          {/* Bölge kartı - 7 coğrafi bölge */}
          <Card style={[styles.formCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Bölge Seçimi
              </Text>
              <Text variant="bodySmall" style={[styles.sectionSubtitle, { color: appColors.text.secondary }]}>
                Bir bölgeye dokunarak içindeki tüm illeri tek seferde ekleyip çıkarabilirsiniz.
              </Text>

              <View style={styles.regionsContainer}>
                {TURKEY_REGIONS.map((region) => {
                  const status = getRegionStatus(region.cities);
                  const selectedCount = region.cities.filter(c => serviceCities.includes(c)).length;
                  return (
                    <Chip
                      key={region.name}
                      mode={status === 'all' ? 'flat' : 'outlined'}
                      selected={status === 'all'}
                      icon={
                        status === 'all' ? 'check-circle'
                        : status === 'some' ? 'circle-slice-4'
                        : undefined
                      }
                      onPress={() => handleRegionToggle(region.cities)}
                      style={[
                        styles.regionChip,
                        status === 'all' && styles.regionChipFull,
                        status === 'some' && styles.regionChipPartial,
                      ]}
                      textStyle={status === 'all' ? styles.regionChipTextFull : undefined}
                    >
                      {region.name} ({selectedCount}/{region.cities.length})
                    </Chip>
                  );
                })}
              </View>
            </Card.Content>
          </Card>

          {/* Seçili şehirler kartı */}
          <Card style={[styles.formCard, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.cardContent}>
              <Text variant="titleMedium" style={styles.sectionTitle}>
                Seçili Şehirler
              </Text>

              {serviceCities.length === 0 ? (
                <View style={[styles.emptyState, { borderColor: isDarkMode ? '#444' : '#e0e0e0' }]}>
                  <Text style={[styles.emptyStateText, { color: appColors.text.secondary }]}>
                    Henüz şehir seçmediniz
                  </Text>
                </View>
              ) : (
                <View style={styles.chipsContainer}>
                  {serviceCities.map((city) => (
                    <Chip
                      key={city}
                      style={styles.chip}
                      onClose={() => handleRemoveCity(city)}
                      closeIcon="close-circle"
                      mode="flat"
                    >
                      {city}
                    </Chip>
                  ))}
                </View>
              )}

              <Button
                mode="outlined"
                icon="plus"
                onPress={() => setModalVisible(true)}
                disabled={allSelected}
                style={styles.addButton}
              >
                {allSelected ? 'Tüm şehirler eklendi' : 'Tek Tek Şehir Ekle'}
              </Button>
            </Card.Content>
          </Card>

          <Card style={[styles.infoCard, { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }]}>
            <Card.Content>
              <Text variant="bodySmall" style={styles.infoText}>
                ℹ️ Şehir/bölge ekleyip çıkardığınızda değişiklikler otomatik olarak kaydedilir.
                Listeden bir şehri çıkardığınızda o şehirdeki bekleyen talepleri görmezsiniz.
              </Text>
            </Card.Content>
          </Card>
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
                <Text variant="titleLarge" style={styles.modalTitle}>Şehir Ekle</Text>
                <IconButton
                  icon="close"
                  size={24}
                  onPress={() => { setModalVisible(false); setSearch(''); }}
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
                  {filteredCities.map((city, index) => {
                    const alreadySelected = serviceCities.includes(city);
                    return (
                      <TouchableOpacity
                        key={`service-city-${index}-${city}`}
                        style={[
                          styles.modalItem,
                          alreadySelected && { backgroundColor: isDarkMode ? '#0d2137' : '#e3f2fd' }
                        ]}
                        onPress={() => alreadySelected ? null : handleAddCity(city)}
                        disabled={alreadySelected}
                        activeOpacity={alreadySelected ? 1 : 0.6}
                      >
                        <Text style={[
                          styles.modalItemText,
                          alreadySelected && styles.modalItemTextSelected
                        ]}>
                          {city}
                        </Text>
                        {alreadySelected && (
                          <View style={styles.modalItemRight}>
                            <Text style={styles.modalItemSelectedLabel}>Seçili</Text>
                            <MaterialCommunityIcons name="check" size={20} color="#26a69a" />
                          </View>
                        )}
                      </TouchableOpacity>
                    );
                  })}
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
  sectionSubtitle: { marginBottom: 16, textAlign: 'center', lineHeight: 18 },
  quickActions: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 12,
  },
  quickActionButton: {
    flex: 1,
  },
  regionsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  regionChip: {
    marginBottom: 4,
  },
  regionChipFull: {
    backgroundColor: '#26a69a',
  },
  regionChipPartial: {
    backgroundColor: '#e0f2f1',
    borderColor: '#26a69a',
  },
  regionChipTextFull: {
    color: '#fff',
    fontWeight: 'bold',
  },
  chipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 16,
  },
  chip: {
    backgroundColor: '#e0f2f1',
  },
  emptyState: {
    padding: 24,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  emptyStateText: { fontSize: 14, fontStyle: 'italic' },
  addButton: { marginTop: 4 },
  counterText: { textAlign: 'center', fontSize: 12, marginTop: 4 },
  infoCard: { marginBottom: 20, borderRadius: 12 },
  infoText: { color: '#1565c0', lineHeight: 20 },
  // Status banner
  statusBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  statusBannerSaving: { backgroundColor: '#e3f2fd' },
  statusBannerSaved: { backgroundColor: '#e8f5e9' },
  statusBannerError: { backgroundColor: '#ffebee' },
  statusText: { fontSize: 13, fontWeight: '500' },
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
  modalItemRight: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  modalItemSelectedLabel: { fontSize: 12, color: '#26a69a', fontStyle: 'italic' },
});

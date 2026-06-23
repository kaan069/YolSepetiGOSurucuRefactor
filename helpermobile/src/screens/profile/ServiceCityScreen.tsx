/**
 * Hizmet Alanı (Service Cities) Ekranı
 *
 * Sürücünün iş aldığı şehirleri seçtiği/güncellediği ekran. Backend
 * `service_cities` boş listeyse hiçbir talep listede görünmez ve FCM
 * bildirimi gelmez. Çoklu seçim, limit yok (81 ile sınırlı).
 *
 * Tasarım — tek ekranda bölge accordion + canlı arama:
 *  - Üstte sayaç + ilerleme çubuğu, "Tümünü Seç / Temizle" hızlı eylemleri
 *  - Canlı arama: yazınca eşleşen bölgeler otomatik açılır, diğerleri gizlenir
 *  - 7 coğrafi bölge aç-kapa (accordion); bölge başında "hepsini seç/kaldır",
 *    içinde şehirler tek tek işaretlenir (checkbox)
 *  - Altta sabit kaydetme çubuğu (seçili sayısı + auto-save durumu)
 *
 * Kaydetme: Backend PATCH her seferinde TÜM listeyi alır — incremental yok.
 * Şehir kimliği `foldTr` ile karşılaştırılır (backend Türkçe→ASCII normalize
 * ettiği için exact-string yerine folded key kullanılır).
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
  TouchableOpacity,
  LayoutAnimation,
  UIManager,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, Searchbar, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import authAPI from '../../api/auth';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useResponsive } from '../../hooks/useResponsive';
import { getCityNames, TURKEY_REGIONS } from '../../data/turkeyLocations';
import { logger } from '../../utils/logger';
import { foldTr, sameCitySet } from '../../utils/turkishText';

// Android'de LayoutAnimation'ı etkinleştir (bölge aç-kapa animasyonu için)
if (Platform.OS === 'android' && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

type Props = NativeStackScreenProps<RootStackParamList, 'ServiceCity'>;

export default function ServiceCityScreen({ navigation }: Props) {
  const { screenBg, cardBg, isDarkMode, appColors } = useAppTheme();
  const { spacing } = useResponsive();
  const { setCurrentUser } = useAuthStore();

  // Tema renk kısayolları — hardcode hex yerine token
  const primary = appColors.primary[400];
  const success = appColors.success;
  const warning = appColors.warning;
  const danger = appColors.error;
  const textSec = appColors.text.secondary;
  const textPri = appColors.text.primary;
  const divider = isDarkMode ? '#333' : '#eee';

  const [serviceCities, setServiceCities] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved' | 'error'>('idle');
  const [search, setSearch] = useState('');
  // Açık bölgeler (region.name) — başlangıçta hepsi kapalı
  const [expandedRegions, setExpandedRegions] = useState<Set<string>>(new Set());

  // Auto-save için ref'ler — debounce timer, ilk-yükleme bayrağı, son kaydedilen liste
  const saveTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const statusTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const isFirstLoadRef = useRef(true);
  const lastSavedRef = useRef<string[]>([]);
  // En güncel serviceCities'i ref'te de tut — unmount flush için
  const latestCitiesRef = useRef<string[]>([]);

  const allCities = useMemo(() => getCityNames(), []);
  const totalCityCount = allCities.length;

  // folded key → canonical görünen ad ("istanbul" → "İstanbul").
  const keyToDisplay = useMemo(() => {
    const m = new Map<string, string>();
    for (const c of allCities) m.set(foldTr(c), c);
    return m;
  }, [allCities]);

  // Seçili şehirlerin folded key seti — üyelik/bölge testleri O(1) ve biçimden
  // bağımsız (canonical "İstanbul" ile backend'in folded "istanbul"u eşleşir).
  const selectedKeys = useMemo(
    () => new Set(serviceCities.map(foldTr)),
    [serviceCities]
  );
  const selectedCount = selectedKeys.size;

  // Mevcut hizmet şehirlerini backend'den çek. Boşsa iş ilini default olarak öner.
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
          initial = [user.business_address_il];
        } else {
          initial = [];
        }

        setServiceCities(initial);
        lastSavedRef.current = existing;
        latestCitiesRef.current = initial;

        // sameCitySet: canonical öneri ("İstanbul") ile backend'in folded formu
        // ("istanbul") eşit sayılır → reload'da spurious save tetiklenmez.
        if (sameCitySet(initial, existing)) {
          isFirstLoadRef.current = true;
        } else {
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
  useEffect(() => {
    latestCitiesRef.current = serviceCities;

    if (isFirstLoadRef.current) {
      isFirstLoadRef.current = false;
      return;
    }

    // Değişiklik yoksa save atma. sameCitySet biçim-bağımsız.
    if (sameCitySet(serviceCities, lastSavedRef.current)) {
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

  // Unmount sırasında pending bir save varsa hemen gönder.
  useEffect(() => {
    return () => {
      if (statusTimeoutRef.current) {
        clearTimeout(statusTimeoutRef.current);
      }
      if (saveTimeoutRef.current) {
        clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = null;
        const pending = latestCitiesRef.current;
        if (!sameCitySet(pending, lastSavedRef.current)) {
          authAPI.updateProfile({ service_cities: pending }).catch(() => {
            logger.warn('general', 'ServiceCityScreen.flushOnUnmount failed');
          });
        }
      }
    };
  }, []);

  const performSave = async (cities: string[]) => {
    if (sameCitySet(cities, lastSavedRef.current)) return;
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
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 1800);
    } catch (err: any) {
      logger.error('general', 'ServiceCityScreen.autoSave failed');
      setSaveStatus('error');
      // Local state'i son başarılı kayda geri al — UI ile backend tutarsız kalmasın
      setServiceCities(lastSavedRef.current);
      if (statusTimeoutRef.current) clearTimeout(statusTimeoutRef.current);
      statusTimeoutRef.current = setTimeout(() => setSaveStatus('idle'), 3000);
    }
  };

  // Tek bir şehri aç/kapa — folded key ile üyelik testi.
  const handleToggleCity = (city: string) => {
    const key = foldTr(city);
    if (selectedKeys.has(key)) {
      setServiceCities(prev => prev.filter(c => foldTr(c) !== key));
    } else {
      // city allCities/TURKEY_REGIONS'tan (canonical) gelir → canonical eklenir.
      setServiceCities(prev => [...prev, city]);
    }
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

  // Bölgedeki tüm şehirler seçili mi? Folded key ile karşılaştırılır.
  const getRegionStatus = (regionCities: string[]): 'all' | 'some' | 'none' => {
    const selected = regionCities.filter(c => selectedKeys.has(foldTr(c))).length;
    if (selected === 0) return 'none';
    if (selected === regionCities.length) return 'all';
    return 'some';
  };

  // Bölge toggle: hepsi seçiliyse hepsini çıkar, değilse eksik olanları ekle.
  const handleRegionToggle = (regionCities: string[]) => {
    const status = getRegionStatus(regionCities);
    const regionKeys = new Set(regionCities.map(foldTr));
    if (status === 'all') {
      setServiceCities(prev => prev.filter(c => !regionKeys.has(foldTr(c))));
    } else {
      setServiceCities(prev => {
        const seen = new Set(prev.map(foldTr));
        const next = [...prev];
        for (const c of regionCities) {
          const k = foldTr(c);
          if (!seen.has(k)) {
            seen.add(k);
            next.push(c);
          }
        }
        return next;
      });
    }
  };

  // Bölge aç-kapa (animasyonlu)
  const toggleRegionExpand = (name: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setExpandedRegions(prev => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  if (loading) {
    return (
      <SafeAreaView style={[styles.container, styles.centerContent, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <ActivityIndicator size="large" color={primary} />
        <Text style={[styles.loadingText, { color: textSec }]}>Yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  const allSelected = selectedCount === totalCityCount;
  const progress = totalCityCount ? selectedCount / totalCityCount : 0;

  // Arama: folded query ile her bölgeyi filtrele
  const q = foldTr(search);
  const regionViews = TURKEY_REGIONS.map((region) => {
    const visibleCities = q ? region.cities.filter(c => foldTr(c).includes(q)) : region.cities;
    return { region, visibleCities };
  }).filter(rv => !q || rv.visibleCities.length > 0);
  const noResults = q.length > 0 && regionViews.length === 0;

  // Bölge durum rengi
  const statusColor = (status: 'all' | 'some' | 'none') =>
    status === 'all' ? primary : status === 'some' ? warning : textSec;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={[styles.container, { backgroundColor: screenBg }]}
    >
      <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
        <AppBar title="Hizmet Alanı" />

        <ScrollView
          style={styles.content}
          contentContainerStyle={{ padding: spacing.md, paddingBottom: spacing.xl }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Başlık + sayaç + ilerleme + hızlı eylemler */}
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            <Card.Content style={styles.headerCardContent}>
              <View style={styles.headerTop}>
                <View style={[styles.headerIconWrap, { backgroundColor: `${primary}1A` }]}>
                  <MaterialCommunityIcons name="map-marker-radius" size={26} color={primary} />
                </View>
                <View style={styles.headerTexts}>
                  <Text variant="titleMedium" style={[styles.headerTitle, { color: textPri }]}>
                    Hizmet Şehirlerim
                  </Text>
                  <Text variant="bodySmall" style={{ color: textSec, lineHeight: 17 }}>
                    Yalnızca bu şehirlerden gelen yeni talepler size bildirilir.
                  </Text>
                </View>
              </View>

              {/* Sayaç + ilerleme */}
              <View style={styles.counterRow}>
                <Text style={[styles.counterBig, { color: primary }]}>{selectedCount}</Text>
                <Text style={[styles.counterTotal, { color: textSec }]}> / {totalCityCount} şehir</Text>
              </View>
              <ProgressBar
                progress={progress}
                color={progress === 1 ? success : primary}
                style={styles.progressBar}
              />

              {/* Hızlı eylemler */}
              <View style={styles.quickActions}>
                <Button
                  mode={allSelected ? 'contained' : 'outlined'}
                  icon={allSelected ? 'check-all' : 'select-all'}
                  onPress={handleSelectAll}
                  disabled={allSelected}
                  style={styles.quickActionButton}
                  textColor={allSelected ? undefined : primary}
                  buttonColor={allSelected ? primary : undefined}
                  compact
                >
                  Tümünü Seç
                </Button>
                <Button
                  mode="outlined"
                  icon="close-circle-outline"
                  onPress={handleClearAll}
                  disabled={selectedCount === 0}
                  style={styles.quickActionButton}
                  textColor={danger}
                  compact
                >
                  Temizle
                </Button>
              </View>
            </Card.Content>
          </Card>

          {/* Canlı arama */}
          <Searchbar
            placeholder="Şehir ara..."
            onChangeText={setSearch}
            value={search}
            style={[styles.searchBar, { backgroundColor: cardBg }]}
            inputStyle={{ color: textPri, minHeight: 0 }}
            iconColor={textSec}
            placeholderTextColor={textSec}
            elevation={1}
          />

          {/* Bölge accordion listesi */}
          <Card style={[styles.card, { backgroundColor: cardBg }]}>
            {noResults ? (
              <View style={styles.noResults}>
                <MaterialCommunityIcons name="map-search-outline" size={32} color={textSec} />
                <Text style={{ color: textSec, marginTop: 8 }}>"{search}" için il bulunamadı</Text>
              </View>
            ) : (
              regionViews.map(({ region, visibleCities }, idx) => {
                const status = getRegionStatus(region.cities);
                const regSel = region.cities.filter(c => selectedKeys.has(foldTr(c))).length;
                const isOpen = q ? true : expandedRegions.has(region.name);
                const sc = statusColor(status);
                return (
                  <View key={region.name} style={idx > 0 ? { borderTopWidth: StyleSheet.hairlineWidth, borderTopColor: divider } : undefined}>
                    {/* Bölge başlığı */}
                    <View style={styles.regionHeader}>
                      <TouchableOpacity
                        style={styles.regionHeaderMain}
                        onPress={() => toggleRegionExpand(region.name)}
                        activeOpacity={0.6}
                        disabled={!!q}
                      >
                        <MaterialCommunityIcons
                          name={isOpen ? 'chevron-down' : 'chevron-right'}
                          size={24}
                          color={textSec}
                        />
                        <Text style={[styles.regionName, { color: textPri }]} numberOfLines={1}>
                          {region.name}
                        </Text>
                        <View style={[styles.regionBadge, { backgroundColor: `${sc}1A` }]}>
                          <Text style={[styles.regionBadgeText, { color: sc }]}>
                            {regSel}/{region.cities.length}
                          </Text>
                        </View>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => handleRegionToggle(region.cities)}
                        hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
                        style={styles.regionToggle}
                      >
                        <MaterialCommunityIcons
                          name={
                            status === 'all' ? 'check-circle'
                            : status === 'some' ? 'minus-circle'
                            : 'checkbox-blank-circle-outline'
                          }
                          size={26}
                          color={status === 'none' ? textSec : primary}
                        />
                      </TouchableOpacity>
                    </View>

                    {/* Açıkken şehirler */}
                    {isOpen && (
                      <View style={styles.cityList}>
                        {visibleCities.map((city) => {
                          const isSel = selectedKeys.has(foldTr(city));
                          const display = keyToDisplay.get(foldTr(city)) ?? city;
                          return (
                            <TouchableOpacity
                              key={foldTr(city)}
                              style={styles.cityRow}
                              onPress={() => handleToggleCity(city)}
                              activeOpacity={0.6}
                            >
                              <MaterialCommunityIcons
                                name={isSel ? 'checkbox-marked' : 'checkbox-blank-outline'}
                                size={22}
                                color={isSel ? primary : textSec}
                              />
                              <Text style={[styles.cityRowText, { color: isSel ? primary : textPri, fontWeight: isSel ? '600' : '400' }]}>
                                {display}
                              </Text>
                            </TouchableOpacity>
                          );
                        })}
                      </View>
                    )}
                  </View>
                );
              })
            )}
          </Card>
        </ScrollView>

        {/* Sabit alt çubuk — seçili sayısı + auto-save durumu */}
        <View style={[styles.footer, { backgroundColor: cardBg, borderTopColor: divider }]}>
          <View style={styles.footerLeft}>
            {selectedCount === 0 ? (
              <>
                <MaterialCommunityIcons name="alert-circle-outline" size={18} color={warning} />
                <Text style={[styles.footerText, { color: warning }]} numberOfLines={1}>
                  Şehir seçilmedi — iş alamazsınız
                </Text>
              </>
            ) : (
              <>
                <MaterialCommunityIcons name="map-marker-check" size={18} color={primary} />
                <Text style={[styles.footerText, { color: textPri }]}>
                  {selectedCount} şehir seçili
                </Text>
              </>
            )}
          </View>

          {/* Kaydetme durumu pill'i */}
          {saveStatus === 'saving' && (
            <View style={styles.savePill}>
              <ActivityIndicator size={14} color={appColors.info} />
              <Text style={[styles.savePillText, { color: appColors.info }]}>Kaydediliyor</Text>
            </View>
          )}
          {saveStatus === 'saved' && (
            <View style={styles.savePill}>
              <MaterialCommunityIcons name="check-circle" size={16} color={success} />
              <Text style={[styles.savePillText, { color: success }]}>Kaydedildi</Text>
            </View>
          )}
          {saveStatus === 'error' && (
            <View style={styles.savePill}>
              <MaterialCommunityIcons name="alert-circle" size={16} color={danger} />
              <Text style={[styles.savePillText, { color: danger }]}>Kaydedilemedi</Text>
            </View>
          )}
        </View>
      </SafeAreaView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  centerContent: { justifyContent: 'center', alignItems: 'center' },
  loadingText: { marginTop: 16, fontSize: 16 },
  content: { flex: 1 },
  card: { marginBottom: 12, borderRadius: 12, elevation: 2, overflow: 'hidden' },
  // Header card
  headerCardContent: { padding: 16 },
  headerTop: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  headerIconWrap: {
    width: 46, height: 46, borderRadius: 23,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTexts: { flex: 1 },
  headerTitle: { fontWeight: 'bold', marginBottom: 2 },
  counterRow: { flexDirection: 'row', alignItems: 'flex-end', marginTop: 16 },
  counterBig: { fontSize: 30, fontWeight: 'bold', lineHeight: 34 },
  counterTotal: { fontSize: 15, marginBottom: 4 },
  progressBar: { height: 8, borderRadius: 4, marginTop: 8 },
  quickActions: { flexDirection: 'row', gap: 8, marginTop: 16 },
  quickActionButton: { flex: 1, borderRadius: 8 },
  // Search
  searchBar: { marginBottom: 12, borderRadius: 12, height: 48 },
  // Region accordion
  regionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  regionHeaderMain: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 },
  regionName: { fontSize: 15, fontWeight: '600', flexShrink: 1 },
  regionBadge: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2, marginLeft: 6 },
  regionBadgeText: { fontSize: 12, fontWeight: '700' },
  regionToggle: { paddingLeft: 12 },
  cityList: { paddingBottom: 6 },
  cityRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 11,
    paddingLeft: 44,
    paddingRight: 16,
  },
  cityRowText: { fontSize: 15 },
  noResults: { alignItems: 'center', justifyContent: 'center', paddingVertical: 36 },
  // Footer (sticky save bar)
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: StyleSheet.hairlineWidth,
  },
  footerLeft: { flexDirection: 'row', alignItems: 'center', gap: 8, flex: 1 },
  footerText: { fontSize: 14, fontWeight: '600' },
  savePill: { flexDirection: 'row', alignItems: 'center', gap: 6, marginLeft: 12 },
  savePillText: { fontSize: 13, fontWeight: '600' },
});

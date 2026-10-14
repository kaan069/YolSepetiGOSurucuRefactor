import React, { useRef, useState } from 'react';
import { Alert, Animated, ScrollView, TouchableOpacity, View, Image, ActivityIndicator, StyleSheet } from 'react-native';
import { useDevOverrideStore } from '../../store/useDevOverrideStore';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, ProgressBar } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { BottomTabScreenProps } from '@react-navigation/bottom-tabs';
import { CompositeScreenProps, CommonActions } from '@react-navigation/native';
import { RootStackParamList, RootTabParamList, EmployeeTabParamList } from '../../navigation';
import { useAppTheme } from '../../hooks/useAppTheme';
import { useSyncedBlink } from '../../hooks/useSyncedBlink';
import { documentsAPI } from '../../api';
import { ProfileCompletenessResponse, ProviderType } from '../../api/types';
import { useFocusEffect } from '@react-navigation/native';
import { logger } from '../../utils/logger';
import AppBar from '../../components/common/AppBar';
import { FkCard, FkMenuGroup, FkMenuItem } from '../../components/fk';
import { colors, radius, shadows, spacing as ds, text } from '../../theme/design';

// ProfileMenuScreen hem normal kullanıcı hem Employee tab navigator'ında kullanılıyor.
// ProfileMenuScreen is used in both regular user and Employee tab navigators.
type Props = CompositeScreenProps<
  | BottomTabScreenProps<RootTabParamList, 'ProfileTab'>
  | BottomTabScreenProps<EmployeeTabParamList, 'EmployeeProfileTab'>,
  NativeStackScreenProps<RootStackParamList>
>;

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
  blinkAlert?: boolean;
}

// Eksik evrak satırı yanıp söner (dikkat çekmek için)
function BlinkingMenuItem({ blink, ...rest }: React.ComponentProps<typeof FkMenuItem> & { blink?: boolean }) {
  const blinkAnim = useSyncedBlink(!!blink);
  if (!blink) return <FkMenuItem {...rest} />;
  return (
    <Animated.View style={{ opacity: blinkAnim }}>
      <FkMenuItem {...rest} danger />
    </Animated.View>
  );
}

export default function ProfileMenuScreen({ navigation }: Props) {
  const { logout, currentUser } = useAuthStore();
  const { appColors, screenBg, cardBg, isDarkMode } = useAppTheme();
  const [completeness, setCompleteness] = useState<ProfileCompletenessResponse | null>(null);
  const [loadingCompleteness, setLoadingCompleteness] = useState(true);
  const [userProviderType, setUserProviderType] = useState<ProviderType | null>(null);
  const [invitedCount, setInvitedCount] = useState<number>(0);

  // Geliştirici modu (logoya arka arkaya tap → minimum teklif override) DEVRE DIŞI.
  // İstek üzerine yorum satırına alındı. Geri açmak için aşağıdaki bloğun yorumunu
  // kaldır ve logo <TouchableOpacity>'sindeki onPress={handleLogoPress}'i geri ekle.
  /*
  const tapCountRef = useRef(0);
  const lastTapRef = useRef(0);
  const toggleOverride = useDevOverrideStore((s) => s.toggleMinOfferOverride);
  const overrideActive = useDevOverrideStore((s) => s.minOfferOverride);

  const handleLogoPress = () => {
    const now = Date.now();
    if (now - lastTapRef.current > 3000) tapCountRef.current = 0;
    lastTapRef.current = now;
    tapCountRef.current += 1;
    if (tapCountRef.current >= 10) {
      tapCountRef.current = 0;
      toggleOverride();
      Alert.alert(
        'Geliştirici Modu',
        overrideActive
          ? 'Geliştirici modu kapatıldı. Minimum teklif 1.000 TL.'
          : 'Geliştirici modu açıldı. Minimum teklif 1 TL.'
      );
    }
  };
  */

  const loadProfileCompleteness = async () => {
    setLoadingCompleteness(true);
    try {
      const response = await documentsAPI.checkProfileCompleteness();
      setCompleteness(response);
    } catch (error) {
      logger.error('general', 'Profil tamamlama durumu yklenemedi');
    } finally {
      setLoadingCompleteness(false);
    }
  };

  // Her profil sekmesine girildiğinde profil durumunu ve provider type'ı yükle
  useFocusEffect(
    React.useCallback(() => {
      loadProfileCompleteness();
      // Provider type'ı AsyncStorage'dan oku
      AsyncStorage.getItem('user').then((userStr) => {
        if (userStr) {
          try {
            const user = JSON.parse(userStr);
            setUserProviderType(user.provider_type || null);
            setInvitedCount(typeof user.invited_count === 'number' ? user.invited_count : 0);
          } catch {}
        }
      });
    }, [])
  );

  const handleLogout = async () => {
    await logout();
    // Navigation stack'i tamamen temizle ve Login ekranına yönlendir
    // logout() isAuthenticated=false yapar ve RootNavigator AuthStack'e geçer; reset
    // action cross-navigator olduğu için CommonActions ile dispatch edilir.
    navigation.dispatch(
      CommonActions.reset({
        index: 0,
        routes: [{ name: 'Login' }],
      })
    );
  };

  // Menü öğeleri - Evrak durumuna göre dinamik başlık
  const getDocumentsMenuTitle = () => {
    if (!completeness) return 'Evraklar';
    return completeness.is_complete ? 'Evraklar' : 'Eksik Evraklar';
  };

  const getDocumentsMenuIcon = () => {
    if (!completeness) return 'file-document-outline';
    return completeness.is_complete ? 'file-document-outline' : 'file-alert';
  };

  const isEmployee = userProviderType === 'employee';
  const fullName = [(currentUser as any)?.first_name, (currentUser as any)?.last_name].filter(Boolean).join(' ')
    || (currentUser as any)?.fullName
    || 'Sürücü';
  const phone = (currentUser as any)?.phone_number || (currentUser as any)?.phone;

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <AppBar title="Profil" variant="large" showBackButton={false} />
      <ScrollView contentContainerStyle={styles.content}>
        {/* Kullanıcı başlığı */}
        <FkCard rounded="xl" padding={ds.lg} style={styles.userCard}>
          <View style={styles.userRow}>
            <TouchableOpacity
              activeOpacity={1}
              // onPress={handleLogoPress}  // Geliştirici modu devre dışı bırakıldı
              style={[styles.avatar, { backgroundColor: cardBg }]}
            >
              <Image source={require('../../../assets/yolyardimlogo.png')} style={styles.avatarImage} resizeMode="contain" />
            </TouchableOpacity>
            <View style={styles.userTexts}>
              <Text style={[styles.userName, { color: appColors.text.primary }]} numberOfLines={1}>{fullName}</Text>
              {phone ? <Text style={[styles.userPhone, { color: appColors.text.secondary }]}>{phone}</Text> : null}
              {userProviderType ? (
                <View style={styles.rolePill}>
                  <Text style={styles.rolePillText}>
                    {userProviderType === 'company' ? 'Kurumsal' : userProviderType === 'employee' ? 'Eleman' : 'Bireysel'}
                  </Text>
                </View>
              ) : null}
            </View>
          </View>
        </FkCard>

        {/* Profil Tamamlama Kartı - eleman kullanıcılara gösterilmez */}
        {!isEmployee && (loadingCompleteness ? (
          <FkCard style={styles.block}>
            <View style={styles.center}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
              <Text variant="bodySmall" style={{ marginTop: ds.xs, color: appColors.text.secondary }}>
                Profil durumu yükleniyor...
              </Text>
            </View>
          </FkCard>
        ) : completeness && !completeness.is_complete ? (
          <FkCard onPress={() => navigation.navigate('MissingDocuments')} style={[styles.block, styles.warningCard]}>
            <View style={styles.warningHeader}>
              <MaterialCommunityIcons name="alert-circle" size={22} color={colors.warning[500]} />
              <Text style={styles.warningTitle}>Profil Tamamlama</Text>
              <Text style={styles.warningPercent}>%{completeness.completion_percentage}</Text>
            </View>
            <ProgressBar
              progress={completeness.completion_percentage / 100}
              style={styles.progress}
              color={colors.primary[500]}
            />
            <Text style={styles.warningText}>
              {completeness.missing_fields.length} alan eksik. İşleri kabul edebilmek için profilinizi tamamlayın.
            </Text>
            <Text style={styles.warningNote}>
              Belgeleri yükledikten sonra yönetici onayına gönderilir. Onay sonrası işleri kabul edebilirsiniz.
            </Text>
          </FkCard>
        ) : null)}

        {!isEmployee && (
          <FkMenuGroup title="Hesap" style={styles.group}>
            <FkMenuItem
              icon="account-cog-outline"
              title="Hesap İşlemleri"
              subtitle="Kişisel bilgiler, şifre değiştirme"
              onPress={() => navigation.navigate('AccountManagement')}
            />
            <FkMenuItem
              icon="map-marker-radius-outline"
              title="Hizmet Alanı"
              subtitle="İş aldığınız şehirleri seçin"
              onPress={() => navigation.navigate('ServiceCity')}
            />
            <BlinkingMenuItem
              icon={getDocumentsMenuIcon()}
              title={getDocumentsMenuTitle()}
              subtitle="Evraklarım, şirket bilgilerim"
              onPress={() => navigation.navigate('MissingDocuments')}
              blink={!!(completeness && !completeness.is_complete)}
            />
            <FkMenuItem
              icon="office-building-outline"
              title="Şirket ve Ödeme Bilgileri"
              subtitle="Şirket detayları, vergi bilgileri"
              onPress={() => navigation.navigate('CompanyInfo')}
            />
            <FkMenuItem
              icon="gift-outline"
              title="Referans Kodum"
              subtitle={invitedCount > 0 ? `${invitedCount} sürücü davet ettin` : "Davet et, kazanç payı al"}
              onPress={() => navigation.navigate('ReferralCode')}
            />
          </FkMenuGroup>
        )}

        {!isEmployee && (
          <FkMenuGroup title="İş ve Araçlar" style={styles.group}>
            <FkMenuItem
              icon="truck-outline"
              title="Araç ve Hizmet Yönetimi"
              subtitle="Araçlarım, hizmet ayarları"
              onPress={() => navigation.navigate('VehicleAndServiceManagement')}
            />
            {userProviderType === 'company' ? (
              <FkMenuItem
                icon="account-group-outline"
                title="Eleman Yönetimi"
                subtitle="Elemanlarınızı yönetin, ekleyin, düzenleyin"
                onPress={() => navigation.navigate('EmployeeList')}
              />
            ) : null}
            <FkMenuItem
              icon="star-outline"
              title="Yorumlar ve Puan"
              subtitle="Müşteri yorumları, puanlama istatistikleri"
              onPress={() => navigation.navigate('RatingsAndReviews')}
            />
            <FkMenuItem
              icon="chart-line"
              title="Rapor ve İşlem Geçmişi"
              subtitle="Gelir raporları, geçmiş işlemler"
              onPress={() => navigation.navigate('ReportsAndHistory')}
            />
            <FkMenuItem
              icon="file-document-multiple-outline"
              title="Belgeler ve Sözleşmeler"
              subtitle="Ruhsat, sigorta, sözleşmeler"
              onPress={() => navigation.navigate('DocumentsAndContracts')}
            />
          </FkMenuGroup>
        )}

        <FkMenuGroup title="Uygulama" style={styles.group}>
          <FkMenuItem
            icon="cog-outline"
            title="Uygulama Ayarları"
            subtitle="Bildirimler, tema, dil ayarları"
            onPress={() => navigation.navigate('AppSettings')}
          />
          <FkMenuItem
            icon="shield-lock-outline"
            title="İzinler"
            subtitle="Konum ve bildirim izinleri"
            onPress={() => navigation.navigate('Permissions')}
          />
          <FkMenuItem
            icon="message-alert-outline"
            title="Şikayet ve Öneri"
            subtitle="Öneri ve şikayetlerinizi bizimle paylaşın"
            onPress={() => navigation.navigate('Feedback')}
          />
        </FkMenuGroup>

        {/* Çıkış */}
        <FkMenuGroup style={styles.logoutGroup}>
          <FkMenuItem
            icon="logout"
            title="Çıkış Yap"
            subtitle="Hesabınızdan güvenli çıkış yapın"
            onPress={handleLogout}
            danger
          />
        </FkMenuGroup>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: ds.md,
    paddingBottom: ds.xl,
  },
  block: {
    marginBottom: ds.md,
  },
  center: {
    alignItems: 'center',
  },
  userCard: {
    marginBottom: ds.md,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.md,
  },
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.primary[200],
    overflow: 'hidden',
    ...shadows.sm,
  },
  avatarImage: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  userTexts: {
    flex: 1,
  },
  userName: {
    fontSize: 20,
    fontWeight: '700',
  },
  userPhone: {
    ...text.body,
    marginTop: 2,
  },
  rolePill: {
    alignSelf: 'flex-start',
    marginTop: ds.sm,
    backgroundColor: colors.primary[50],
    borderRadius: radius.full,
    paddingHorizontal: 10,
    paddingVertical: 3,
  },
  rolePillText: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.primary[700],
  },
  warningCard: {
    backgroundColor: colors.warning[50],
    borderWidth: 1,
    borderColor: colors.warning[200],
  },
  warningHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ds.sm,
    marginBottom: ds.sm + 4,
  },
  warningTitle: {
    flex: 1,
    fontSize: 16,
    fontWeight: '700',
    color: colors.warning[800],
  },
  warningPercent: {
    fontSize: 15,
    fontWeight: '700',
    color: colors.primary[600],
  },
  progress: {
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.warning[100],
  },
  warningText: {
    fontSize: 13,
    lineHeight: 18,
    color: colors.warning[800],
    marginTop: ds.sm + 4,
  },
  warningNote: {
    fontSize: 12,
    lineHeight: 17,
    color: colors.warning[700],
    marginTop: ds.xs,
  },
  group: {
    marginBottom: ds.xs,
  },
  logoutGroup: {
    marginTop: ds.lg,
  },
});

import React, { useState } from 'react';
import { ScrollView, TouchableOpacity, View, Image, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text, ProgressBar, Chip } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useResponsive } from '../../hooks/useResponsive';
import { useAppTheme } from '../../hooks/useAppTheme';
import { documentsAPI } from '../../api';
import { ProfileCompletenessResponse, ProviderType } from '../../api/types';
import { useFocusEffect } from '@react-navigation/native';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileTab'>;

interface MenuItemProps {
  title: string;
  subtitle: string;
  icon: string;
  onPress: () => void;
}

export default function ProfileMenuScreen({ navigation }: Props) {
  const { logout } = useAuthStore();
  const { spacing, moderateScale } = useResponsive();
  const { appColors, screenBg, cardBg, isDarkMode } = useAppTheme();
  const [completeness, setCompleteness] = useState<ProfileCompletenessResponse | null>(null);
  const [loadingCompleteness, setLoadingCompleteness] = useState(true);
  const [userProviderType, setUserProviderType] = useState<ProviderType | null>(null);

  const loadProfileCompleteness = async () => {
    setLoadingCompleteness(true);
    try {
      const response = await documentsAPI.checkProfileCompleteness();
      setCompleteness(response);
    } catch (error) {
      console.error('❌ Profil tamamlama durumu yüklenemedi:', error);
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
          } catch {}
        }
      });
    }, [])
  );

  const handleLogout = async () => {
    await logout();
    // Navigation stack'i tamamen temizle ve Login ekranına yönlendir
    navigation.reset({
      index: 0,
      routes: [{ name: 'Login' }],
    });
  };

  // MenuItem component - responsive styles ile
  const MenuItem = ({ title, subtitle, icon, onPress }: MenuItemProps) => (
    <TouchableOpacity onPress={onPress} style={{ marginBottom: spacing.sm }}>
      <Card mode="outlined" style={{ backgroundColor: cardBg }}>
        <Card.Content style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs }}>
          <MaterialCommunityIcons name={icon} size={moderateScale(24)} color={appColors.primary[400]} style={{ marginRight: spacing.md }} />
          <View style={{ flex: 1 }}>
            <Text variant="titleMedium" style={{ fontWeight: '600', marginBottom: 2 }}>{title}</Text>
            <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>{subtitle}</Text>
          </View>
          <MaterialCommunityIcons name="chevron-right" size={moderateScale(20)} color={appColors.text.secondary} />
        </Card.Content>
      </Card>
    </TouchableOpacity>
  );

  // Menü öğeleri - Evrak durumuna göre dinamik başlık
  const getDocumentsMenuTitle = () => {
    if (!completeness) return 'Evraklar';
    return completeness.is_complete ? 'Evraklar' : 'Eksik Evraklar';
  };

  const getDocumentsMenuIcon = () => {
    if (!completeness) return 'file-document-outline';
    return completeness.is_complete ? 'file-document-outline' : 'file-alert';
  };

  const menuItems = [
    // Hesap İşlemleri - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: 'Hesap İşlemleri',
      subtitle: 'Kişisel bilgiler, şifre değiştirme',
      icon: 'account-cog',
      onPress: () => navigation.navigate('AccountManagement'),
    }] : []),
    // Belgeler - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: getDocumentsMenuTitle(),
      subtitle: 'Evraklarım, şirket bilgilerim',
      icon: getDocumentsMenuIcon(),
      onPress: () => navigation.navigate('MissingDocuments'),
    }] : []),
    // Yorumlar ve Puan - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: 'Yorumlar ve Puan',
      subtitle: 'Müşteri yorumları, puanlama istatistikleri',
      icon: 'star',
      onPress: () => navigation.navigate('RatingsAndReviews'),
    }] : []),
    // Rapor ve İşlem Geçmişi - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: 'Rapor ve İşlem Geçmişi',
      subtitle: 'Gelir raporları, geçmiş işlemler',
      icon: 'chart-line',
      onPress: () => navigation.navigate('ReportsAndHistory'),
    }] : []),
    // Araç Ve Hizmet Yönetimi - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: 'Araç Ve Hizmet Yönetimi',
      subtitle: 'Araçlarım, hizmet ayarları',
      icon: 'truck',
      onPress: () => navigation.navigate('VehicleAndServiceManagement'),
    }] : []),
    // Eleman Yönetimi - sadece firma sahiplerine gösterilir
    ...(userProviderType === 'company' ? [{
      title: 'Eleman Yönetimi',
      subtitle: 'Elemanlarınızı yönetin, ekleyin, düzenleyin',
      icon: 'account-group',
      onPress: () => navigation.navigate('EmployeeList'),
    }] : []),
    // Belgeler Ve Sözleşmeler - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: 'Belgeler Ve Sözleşmeler',
      subtitle: 'Ruhsat, sigorta, sözleşmeler',
      icon: 'file-document-multiple',
      onPress: () => navigation.navigate('DocumentsAndContracts'),
    }] : []),
    // Şirket ve Ödeme Bilgileri - eleman kullanıcılara gösterilmez
    ...(userProviderType !== 'employee' ? [{
      title: 'Şirket ve Ödeme Bilgileri',
      subtitle: 'Şirket detayları, vergi bilgileri',
      icon: 'office-building',
      onPress: () => navigation.navigate('CompanyInfo'),
    }] : []),
    {
      title: 'Uygulama Ayarları',
      subtitle: 'Bildirimler, tema, dil ayarları',
      icon: 'cog',
      onPress: () => navigation.navigate('AppSettings'),
    },
    {
      title: 'İzinler',
      subtitle: 'Konum ve bildirim izinleri',
      icon: 'shield-lock-outline',
      onPress: () => navigation.navigate('Permissions'),
    },
    {
      title: 'Şikayet ve Öneri',
      subtitle: 'Öneri ve şikayetlerinizi bizimle paylaşın',
      icon: 'message-alert-outline',
      onPress: () => navigation.navigate('Feedback'),
    },
  ];

  // Warning card renkleri (dark mode uyumlu)
  const warningBg = isDarkMode ? '#3e2e00' : '#fff3cd';
  const warningBorder = isDarkMode ? '#ff9800' : '#ff9800';
  const warningText = isDarkMode ? '#ffcc80' : '#856404';

  // Responsive dynamic styles
  const dynamicStyles = {
    container: {
      flex: 1,
      backgroundColor: screenBg,
    },
    content: {
      flex: 1,
      padding: spacing.md,
    },
    header: {
      marginBottom: spacing.sm,
      fontWeight: 'bold' as const,
      textAlign: 'center' as const,
    },
  };

  return (
    <SafeAreaView style={dynamicStyles.container} edges={["bottom"]}>
      <ScrollView style={dynamicStyles.content}>
        <View style={{ alignItems: 'center', marginBottom: spacing.md, marginTop: spacing.xl }}>
          <View style={{
            width: moderateScale(70),
            height: moderateScale(70),
            borderRadius: moderateScale(35),
            backgroundColor: cardBg,
            justifyContent: 'center',
            alignItems: 'center',
            shadowColor: '#000',
            shadowOffset: { width: 0, height: 2 },
            shadowOpacity: 0.2,
            shadowRadius: 4,
            elevation: 5,
            overflow: 'hidden',
            borderWidth: 2,
            borderColor: 'rgba(38, 166, 154, 0.3)',
            marginBottom: spacing.xs
          }}>
            <Image
              source={require('../../../assets/yolyardimlogo.png')}
              style={{ width: moderateScale(55), height: moderateScale(55), borderRadius: moderateScale(27.5) }}
              resizeMode="contain"
            />
          </View>
        </View>
        <Text variant="headlineSmall" style={dynamicStyles.header}>
          Profil
        </Text>

        {/* ✅ SENARYO 4: Profil Tamamlama Kartı - eleman kullanıcılara gösterilmez */}
        {userProviderType !== 'employee' && (loadingCompleteness ? (
          <Card mode="outlined" style={{ marginBottom: spacing.md, backgroundColor: cardBg }}>
            <Card.Content style={{ alignItems: 'center', paddingVertical: spacing.md }}>
              <ActivityIndicator size="small" color={appColors.primary[400]} />
              <Text variant="bodySmall" style={{ marginTop: spacing.xs, color: appColors.text.secondary }}>
                Profil durumu yükleniyor...
              </Text>
            </Card.Content>
          </Card>
        ) : completeness && !completeness.is_complete ? (
          <TouchableOpacity
            onPress={() => navigation.navigate('MissingDocuments')}
            style={{ marginBottom: spacing.md }}
          >
            <Card mode="outlined" style={{ backgroundColor: warningBg, borderColor: warningBorder, borderWidth: 1.5 }}>
              <Card.Content>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.sm }}>
                  <MaterialCommunityIcons name="alert-circle" size={24} color="#ff9800" />
                  <Text variant="titleMedium" style={{ marginLeft: spacing.sm, fontWeight: 'bold', color: warningText }}>
                    Profil Tamamlama
                  </Text>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing.xs }}>
                  <ProgressBar
                    progress={completeness.completion_percentage / 100}
                    style={{ flex: 1, height: 8, borderRadius: 4 }}
                    color="#26a69a"
                  />
                  <Text variant="titleSmall" style={{ marginLeft: spacing.sm, fontWeight: 'bold', color: '#26a69a' }}>
                    %{completeness.completion_percentage}
                  </Text>
                </View>
                <Text variant="bodySmall" style={{ color: warningText, lineHeight: 18, marginBottom: spacing.xs }}>
                  {completeness.missing_fields.length} alan eksik. İşleri kabul edebilmek için profilinizi tamamlayın.
                </Text>
                <View style={{ flexDirection: 'row', alignItems: 'flex-start', marginTop: spacing.xs, paddingTop: spacing.xs, borderTopWidth: 1, borderTopColor: isDarkMode ? 'rgba(255, 204, 128, 0.2)' : 'rgba(133, 100, 4, 0.2)' }}>
                  <MaterialCommunityIcons name="information-outline" size={16} color={warningText} style={{ marginTop: 2, marginRight: spacing.xs }} />
                  <Text variant="bodySmall" style={{ color: warningText, lineHeight: 16, fontSize: 11, flex: 1 }}>
                    Belgeleri yükledikten sonra yönetici onayına gönderilir. Onay sonrası işleri kabul edebilirsiniz.
                  </Text>
                </View>
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ) : null)}

        {menuItems.map((item, index) => (
          <MenuItem
            key={index}
            title={item.title}
            subtitle={item.subtitle}
            icon={item.icon}
            onPress={item.onPress}
          />
        ))}

        {/* Çıkış Yap Butonu */}
        <TouchableOpacity onPress={handleLogout} style={{ marginTop: spacing.sm, marginBottom: spacing.xl }}>
          <Card mode="outlined" style={{ backgroundColor: cardBg, borderColor: isDarkMode ? '#442726' : '#ffebee' }}>
            <Card.Content style={{ flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.sm }}>
              <MaterialCommunityIcons name="logout" size={moderateScale(24)} color={appColors.error || '#D32F2F'} style={{ marginRight: spacing.md }} />
              <View style={{ flex: 1 }}>
                <Text variant="titleMedium" style={{ fontWeight: '600', color: appColors.error || '#D32F2F' }}>Çıkış Yap</Text>
                <Text variant="bodySmall" style={{ color: appColors.text.secondary }}>Hesabınızdan güvenli çıkış yapın</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={moderateScale(20)} color={appColors.error || '#D32F2F'} />
            </Card.Content>
          </Card>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
}

// No more static styles needed - all responsive!

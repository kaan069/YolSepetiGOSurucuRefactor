// Hesap İşlemleri Ana Menü Ekranı - Account Management Main Menu Screen
// Bu ekran kullanıcının hesap işlemlerini yönetmek için ana menüyü gösterir
// This screen shows the main menu for managing user account operations
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text } from 'react-native-paper';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { User } from '../../api/types';
import authAPI from '../../api/auth';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';
import { FkCard, FkIconChip, FkMenuGroup, FkMenuItem } from '../../components/fk';
import { spacing, text } from '../../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountManagement'>;

export default function AccountManagementScreen({ navigation }: Props) {
  const { screenBg, appColors } = useAppTheme();
  const { currentUser, logout } = useAuthStore();
  const [apiUser, setApiUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  // API'den kullanıcı profil bilgilerini yükle - Load user profile from API
  useEffect(() => {
    const loadUserProfile = async () => {
      try {
        setLoading(true);
        const response = await authAPI.getProfile();
        setApiUser(response.user);
      } catch (error) {
        logger.error('general', 'Error loading user profile');
      } finally {
        setLoading(false);
      }
    };

    loadUserProfile();
  }, []);

  // Hesabı silme fonksiyonu - Delete account function
  const handleDeleteAccount = () => {
    Alert.alert(
      'Hesabı Sil',
      'Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Hesabı Sil',
          style: 'destructive',
          onPress: async () => {
            // Kullanıcı çıkışı yap - Log out user
            await logout();
            Alert.alert('Başarılı', 'Hesabınız başarıyla silindi.');
          }
        }
      ]
    );
  };

  const displayName = apiUser
    ? `${apiUser.first_name} ${apiUser.last_name}`
    : currentUser?.fullName || 'Kullanıcı';
  const displayPhone = apiUser?.phone_number || currentUser?.phone_number || 'Telefon belirtilmemiş';

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      {/* Ortak AppBar komponenti - Common AppBar component */}
      <AppBar title="Hesap İşlemleri" />

      <ScrollView contentContainerStyle={styles.content}>
        {/* Kullanıcı bilgi kartı - User info card */}
        <FkCard rounded="xl" style={styles.userCard}>
          <View style={styles.userInfo}>
            <FkIconChip icon="account" size={56} shape="circle" />
            <View style={styles.userDetails}>
              <Text style={[styles.userName, { color: appColors.text.primary }]} numberOfLines={1}>{displayName}</Text>
              <Text style={[styles.userPhone, { color: appColors.text.secondary }]}>{displayPhone}</Text>
            </View>
          </View>
        </FkCard>

        <FkMenuGroup>
          <FkMenuItem
            icon="account-edit-outline"
            title="Bilgileri Düzenle"
            subtitle="Ad, soyad, telefon numarası güncelle"
            onPress={() => navigation.navigate('EditProfile')}
          />
          <FkMenuItem
            icon="chart-line"
            title="Rapor ve İşlem Geçmişi"
            subtitle="Gelir raporu ve işlem detayları"
            onPress={() => navigation.navigate('ReportsAndHistory')}
          />
          <FkMenuItem
            icon="star-outline"
            title="Yorumlar ve Puan"
            subtitle="Müşteri değerlendirmeleri ve puanlarınız"
            onPress={() => navigation.navigate('RatingsAndReviews')}
          />
        </FkMenuGroup>

        <FkMenuGroup style={styles.dangerGroup}>
          <FkMenuItem
            icon="account-remove-outline"
            title="Hesabımı Sil"
            subtitle="Hesabı kalıcı olarak sil"
            onPress={handleDeleteAccount}
            danger
          />
        </FkMenuGroup>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: spacing.md,
  },
  userCard: {
    marginBottom: spacing.md,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  userDetails: {
    flex: 1,
  },
  userName: {
    ...text.cardTitle,
    fontSize: 18,
  },
  userPhone: {
    ...text.body,
    marginTop: 2,
  },
  dangerGroup: {
    marginTop: spacing.lg,
  },
});

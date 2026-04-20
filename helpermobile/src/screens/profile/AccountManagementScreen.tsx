// Hesap İşlemleri Ana Menü Ekranı - Account Management Main Menu Screen
// Bu ekran kullanıcının hesap işlemlerini yönetmek için ana menüyü gösterir
// This screen shows the main menu for managing user account operations
import React, { useState, useEffect } from 'react';
import { StyleSheet, ScrollView, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Card, Text } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useAuthStore } from '../../store/authStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { User } from '../../api/types';
import authAPI from '../../api/auth';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'AccountManagement'>;

export default function AccountManagementScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();
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

  // Menü öğeleri - Menu items
  const menuItems = [
    {
      title: 'Bilgileri Düzenle',
      subtitle: 'Ad, soyad, telefon numarası güncelle',
      icon: 'account-edit-outline',
      onPress: () => navigation.navigate('EditProfile'),
    },
    {
      title: 'Rapor Ve İşlem Geçmişi',
      subtitle: 'Gelir raporu ve işlem detayları',
      icon: 'chart-line',
      onPress: () => navigation.navigate('ReportsAndHistory'),
    },
    {
      title: 'Yorumlar ve Puan',
      subtitle: 'Müşteri değerlendirmeleri ve puanlarınız',
      icon: 'star-outline',
      onPress: () => navigation.navigate('RatingsAndReviews'),
    },
    {
      title: 'Hesabımı Sil',
      subtitle: 'Hesabı kalıcı olarak sil',
      icon: 'account-remove-outline',
      iconColor: '#d32f2f',
      onPress: handleDeleteAccount,
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      {/* Ortak AppBar komponenti - Common AppBar component */}
      <AppBar title="Hesap İşlemleri" />

      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Kullanıcı bilgi kartı - User info card */}
        <Card style={[styles.userCard, { backgroundColor: cardBg }]}>
          <Card.Content>
            <View style={styles.userInfo}>
              <MaterialCommunityIcons name="account-circle" size={48} color="#26a69a" />
              <View style={styles.userDetails}>
                <Text variant="titleMedium" style={styles.userName}>
                  {apiUser
                    ? `${apiUser.first_name} ${apiUser.last_name}`
                    : currentUser?.fullName || 'Kullanıcı'}
                </Text>
                <Text variant="bodyMedium" style={styles.userPhone}>
                  {apiUser?.phone_number || currentUser?.phone_number || 'Telefon belirtilmemiş'}
                </Text>
              </View>
            </View>
          </Card.Content>
        </Card>

        {/* Menü öğeleri - Menu items */}
        {menuItems.map((item, index) => (
          <TouchableOpacity key={index} onPress={item.onPress} style={styles.menuItem}>
            <Card mode="outlined" style={[styles.menuCard, { backgroundColor: cardBg }]}>
              <Card.Content style={styles.menuContent}>
                <MaterialCommunityIcons name={item.icon} size={24} color={item.iconColor || "#26a69a"} style={styles.menuIcon} />
                <View style={styles.menuTextContainer}>
                  <Text variant="titleMedium" style={styles.menuTitle}>{item.title}</Text>
                  <Text variant="bodySmall" style={styles.menuSubtitle}>{item.subtitle}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color="#666" />
              </Card.Content>
            </Card>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    marginBottom: 16,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  userCard: {
    marginBottom: 20,
    backgroundColor: '#fff',
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  userDetails: {
    marginLeft: 16,
    flex: 1,
  },
  userName: {
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userPhone: {
    color: '#666',
  },
  menuItem: {
    marginBottom: 12,
  },
  menuCard: {
    backgroundColor: '#fff',
  },
  menuContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  menuIcon: {
    marginRight: 16,
  },
  menuTextContainer: {
    flex: 1,
  },
  menuTitle: {
    fontWeight: '600',
    marginBottom: 2,
  },
  menuSubtitle: {
    color: '#666',
  },
});
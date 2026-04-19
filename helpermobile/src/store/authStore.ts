import { create } from 'zustand';
import { AuthUser, AuthState, HelperRole, ProviderVehicle } from '../lib/types';
import { nanoid } from 'nanoid/non-secure';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axiosInstance, { setLoggingOut } from '../api/axiosConfig';
import fcmService from '../services/fcmService';
import { useActiveJobStore } from './useActiveJobStore';
import { useNakliyeLocationStore } from './useNakliyeLocationStore';
import { useNotificationStore } from './useNotificationStore';
import { useEmployeeStore } from './useEmployeeStore';
import { useEmployeePanelStore } from './useEmployeePanelStore';
import { backgroundLocationService } from '../services/backgroundLocationService';

// Type definition for the store's actions.
// Store eylemleri için tip tanımı.
// Store eylemleri için tip tanımı - Type definition for store actions
type Actions = {
  login: (username: string, password: string) => boolean; // Kullanıcı adı ve şifre ile giriş - Login with username and password
  loginWithPhone: (phoneNumber: string, password: string) => boolean; // Telefon numarası ve şifre ile giriş - Login with phone and password
  checkUserExistsByPhone: (phoneNumber: string) => boolean; // Telefon numarasına göre kullanıcı kontrolü - Check if user exists by phone
  logout: () => void; // Çıkış yap - Logout
  register: (u: Omit<AuthUser, 'id' | 'role' | 'vehicles'>) => AuthUser; // Yeni kullanıcı kaydı - Register new user
  setRole: (role: HelperRole) => void; // Kullanıcı rolü ayarla - Set user role
  completeLogin: (vehicles: ProviderVehicle[]) => void; // Girişi tamamlarken araçları aktar - Complete login with vehicles
  updateVehicle: (vehicle: ProviderVehicle) => void; // Aracı güncelleme eylemi - Update vehicle action
  setIsAuthenticated: (isAuthenticated: boolean) => void; // Kimlik doğrulama durumunu ayarla - Set authentication state
  updateUserProfile: (profileData: { fullName: string; phone_number: string }) => void; // Kullanıcı profil güncelleme - Update user profile
  setCurrentUser: (user: any) => void; // Backend'den gelen kullanıcıyı set et - Set user from backend
};

// Test için başlangıç kullanıcı verileri - Initial seed users for testing
const seedUsers: AuthUser[] = [
  {
    id: 'seed-1',
    username: 'test',
    password: 'test',
    fullName: 'Test Kullanıcı',
    phone_number: '+90 555 000 00 00',
    vehicles: [
      { id: 'v1', plate: '34 ABC 123', capacity: 5, color: 'Kırmızı' },
    ]
  },
  {
    id: 'demo-user',
    username: '5551234567',
    password: 'demo123',
    fullName: 'Demo Kullanıcı',
    phone_number: '+90 555 123 45 67',
    vehicles: [
      { id: 'demo-v1', plate: '34 DEMO 01', capacity: 10, color: 'Mavi' },
      { id: 'demo-v2', plate: '06 DEMO 02', capacity: 7, color: 'Beyaz' },
    ]
  },
  {
    id: 'user-2',
    username: '5551111111',
    password: '123456',
    fullName: 'Ahmet Yılmaz',
    phone_number: '+90 555 111 11 11',
    vehicles: [
      { id: 'u2-v1', plate: '35 AY 001', capacity: 8, color: 'Siyah' },
    ]
  },
  {
    id: 'user-3',
    username: '5552222222',
    password: 'abc123',
    fullName: 'Fatma Demir',
    phone_number: '+90 555 222 22 22',
    vehicles: [
      { id: 'u3-v1', plate: '16 FD 002', capacity: 12, color: 'Kırmızı' },
      { id: 'u3-v2', plate: '16 FD 003', capacity: 5, color: 'Yeşil' },
    ]
  }
];

type Store = AuthState & {
  users: AuthUser[];
} & Actions;

export const useAuthStore = create<Store>((set, get) => ({
  isAuthenticated: false, // Kimlik doğrulama durumu - Authentication status
  currentUser: null, // Şu anki giriş yapmış kullanıcı - Currently logged in user
  users: seedUsers, // Tüm kayıtlı kullanıcılar - All registered users

  // Kullanıcı adı ve şifre ile giriş - Login with username and password
  login: (username, password) => {
    const u = get().users.find(
      (x) => x.username.trim().toLowerCase() === username.trim().toLowerCase() && x.password === password
    );
    if (!u) return false;
    set({ isAuthenticated: true, currentUser: u });
    return true;
  },

  // Telefon numarası ve şifre ile giriş - Login with phone number and password
  loginWithPhone: (phoneNumber, password) => {
    // Telefon numarasını temizle (0 varsa kaldır, boşlukları sil) - Clean phone number
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/^0/, '');

    const u = get().users.find(
      (x) => {
        // Kullanıcı adını telefon numarası olarak kontrol et - Check username as phone number
        const cleanUsername = x.username.replace(/\s/g, '').replace(/^0/, '');
        return cleanUsername === cleanPhone && x.password === password;
      }
    );

    if (!u) return false;
    set({ isAuthenticated: true, currentUser: u });
    return true;
  },

  // Telefon numarasına göre kullanıcı var mı kontrol et - Check if user exists by phone number
  checkUserExistsByPhone: (phoneNumber) => {
    const cleanPhone = phoneNumber.replace(/\s/g, '').replace(/^0/, '');

    return get().users.some((x) => {
      const cleanUsername = x.username.replace(/\s/g, '').replace(/^0/, '');
      return cleanUsername === cleanPhone;
    });
  },

  // Çıkış yap - Logout user
  logout: async () => {
    console.log('🚪 Logout başlatılıyor...');

    // Logout bayrağını set et - 401 bildirimleri gösterilmeyecek
    setLoggingOut(true);

    try {
      // 1. Backend'e refresh token'ı blacklist et
      try {
        let refreshToken = await AsyncStorage.getItem('refresh_token');

        // Token'ı temizle (whitespace varsa)
        if (refreshToken) {
          refreshToken = refreshToken.trim();
        }

        if (refreshToken && refreshToken.length > 0) {
          await axiosInstance.post('/auth/logout/', {
            refresh_token: refreshToken
          });
        }
      } catch (logoutError: any) {
        // Token geçersiz veya zaten blacklist'te olabilir - önemli değil, devam et
        console.warn('⚠️ Token blacklist edilemedi (göz ardı ediliyor)');

        if (logoutError?.response?.status === 400) {
          console.warn('   → Token zaten blacklist\'te veya geçersiz olabilir');
        }
      }

      // 2. Backend'den FCM token'ı sil
      try {
        const deviceId = await AsyncStorage.getItem('device_id');

        if (deviceId && deviceId.trim().length > 0) {
          await axiosInstance.delete('/auth/notifications/logout/', {
            data: { device_id: deviceId.trim() }
          });
        }
      } catch (fcmError: any) {
        // 404 = Token bulunamadı (normal), 400+ = Başka hata
        if (fcmError?.response?.status === 404) {
          console.log('⏭️  FCM token zaten yok (404)');
        } else {
          console.warn('⚠️ FCM token silinemedi (göz ardı ediliyor)');
        }
      }

      // 3. Tüm local storage'ı temizle - Make account "bakire" (clean/fresh)
      console.log('🧹 Local storage temizleniyor...');
      await AsyncStorage.multiRemove([
        'registration-storage',  // useRegistrationDataStore
        'vehicle-storage',       // useVehicleStore
        'access_token',          // API access token
        'refresh_token',         // API refresh token
        'user',                  // User data
        'fcm_token',             // FCM token (local)
        'device_id'             // Device ID
      ]);
      console.log('✅ AsyncStorage temizlendi - Hesap bakire durumda');

      // 4. Zustand store'ları temizle - Bellekteki verileri sıfırla
      console.log('🧹 Zustand store\'ları temizleniyor...');

      // Aktif iş store - WebSocket konum paylaşımı için
      useActiveJobStore.getState().clearActiveJob();
      console.log('   ✅ useActiveJobStore temizlendi');

      // Nakliye konum paylaşımı store
      useNakliyeLocationStore.getState().stopLocationSharing();
      console.log('   ✅ useNakliyeLocationStore temizlendi');

      // Notification store
      useNotificationStore.getState().clearAll();
      console.log('   ✅ useNotificationStore temizlendi');

      // Employee store
      useEmployeeStore.getState().clearEmployees();
      console.log('   ✅ useEmployeeStore temizlendi');

      // Employee panel store
      useEmployeePanelStore.getState().clearAll();
      console.log('   ✅ useEmployeePanelStore temizlendi');

      // Arka plan konum takibini durdur
      await backgroundLocationService.forceStop();
      console.log('   ✅ Background konum takibi durduruldu');

      console.log('✅ Tüm Zustand store\'ları temizlendi');

    } catch (error: any) {
      console.error('❌ Logout sırasında genel hata:', error?.message || error);
      // Hata olsa bile storage'ı ve store'ları temizle ve çıkış yap
      try {
        await AsyncStorage.multiRemove([
          'registration-storage',
          'vehicle-storage',
          'access_token',
          'refresh_token',
          'user',
          'fcm_token',
          'device_id'
        ]);

        // Zustand store'ları da temizle
        useActiveJobStore.getState().clearActiveJob();
        useNakliyeLocationStore.getState().stopLocationSharing();
        useNotificationStore.getState().clearAll();
        useEmployeeStore.getState().clearEmployees();
        useEmployeePanelStore.getState().clearAll();
        await backgroundLocationService.forceStop();
      } catch (cleanupError) {
        console.error('❌ Storage/Store temizleme hatası:', cleanupError);
      }
    }

    // 5. Auth state'i sıfırla
    set({ isAuthenticated: false, currentUser: null });

    // Logout bayrağını sıfırla
    setLoggingOut(false);

    console.log('✅ Logout tamamlandı - Kullanıcı çıkış yaptı');
  },

  // Yeni kullanıcı kaydı - Register new user
  register: (u) => {
    if (!u.username || !u.password || !u.fullName) {
      throw new Error('Kullanıcı adı, şifre ve ad-soyad zorunlu.');
    }
    const exists = get().users.some(
      (x) => x.username.trim().toLowerCase() === u.username.trim().toLowerCase()
    );
    if (exists) throw new Error('Bu kullanıcı adı zaten kayıtlı.');

    const nu: AuthUser = { id: nanoid(), ...u, vehicles: [] };
    set({ users: [...get().users, nu], currentUser: nu, isAuthenticated: false });
    return nu;
  },

  // Kullanıcı rolü ayarla - Set user role
  setRole: (role) => {
    const cu = get().currentUser;
    if (!cu) return;
    const updated = { ...cu, role };
    set({
      currentUser: updated,
      users: get().users.map((x) => (x.id === cu.id ? updated : x)),
    });
  },

  // Girişi tamamla ve araçları aktar - Complete login with vehicles
  completeLogin: (vehicles) => {
    const cu = get().currentUser;
    if (!cu) return;
    const updatedUser = { ...cu, vehicles };
    set({
      isAuthenticated: true,
      currentUser: updatedUser,
      users: get().users.map((u) => (u.id === cu.id ? updatedUser : u)),
    });
  },

  // Araç bilgilerini güncelle - Update vehicle information
  updateVehicle: (vehicle) => {
    const cu = get().currentUser;
    if (!cu || !cu.vehicles) return;
    const updatedVehicles = cu.vehicles.map((v) => (v.id === vehicle.id ? vehicle : v));
    const updatedUser = { ...cu, vehicles: updatedVehicles };
    set({
      currentUser: updatedUser,
      users: get().users.map((u) => (u.id === cu.id ? updatedUser : u)),
    });
  },

  // Kimlik doğrulama durumunu ayarla - Set authentication state
  setIsAuthenticated: (isAuthenticated) => {
    set({ isAuthenticated });
  },

  // Kullanıcı profil güncelleme - Update user profile
  updateUserProfile: (profileData) => {
    const cu = get().currentUser;
    if (!cu) return;

    const updatedUser = {
      ...cu,
      fullName: profileData.fullName,
      phone_number: profileData.phone_number
    };

    set({
      currentUser: updatedUser,
      users: get().users.map((u) => (u.id === cu.id ? updatedUser : u)),
    });
  },

  // Backend'den gelen kullanıcıyı set et - Set user from backend
  setCurrentUser: (user) => {
    set({ currentUser: user });
  },
}));

// Zustand store (state management) for driver-specific data.
// Sürücüye özel verileri yönetmek için Zustand store'u.
import { create } from 'zustand';
import { LocationObject } from 'expo-location';
import authAPI from '../api/auth';
import { logger } from '../utils/logger';

// Type definition for the driver's state.
// Sürücü state'i için tip tanımı.
type DriverState = {
  driverId: string;
  isAvailable: boolean;
  currentLocation: LocationObject | null;
  isLoadingStatus: boolean;
  setAvailable: (v: boolean) => void;
  setDriverId: (id: string) => void;
  setCurrentLocation: (location: LocationObject) => void;
  loadOnlineStatus: () => Promise<void>;
  updateOnlineStatus: (isOnline: boolean) => Promise<void>;
};

// Create the store with initial state and actions.
// Store'u başlangıç state'i ve eylemlerle oluştur.
export const useDriverStore = create<DriverState>((set, get) => ({
  driverId: 'PUT-YOUR-DRIVER-ID',
  isAvailable: false,
  currentLocation: null,
  isLoadingStatus: false,

  setAvailable: (v) => set({ isAvailable: v }),
  setDriverId: (id) => set({ driverId: id }),
  setCurrentLocation: (location) => set({ currentLocation: location }),

  loadOnlineStatus: async () => {
    try {
      set({ isLoadingStatus: true });
      const response = await authAPI.getOnlineStatus();
      set({ isAvailable: response.user_is_online });
    } catch (error: any) {
      logger.error('auth', 'driverStore.loadOnlineStatus failure', { status: error?.response?.status });
    } finally {
      set({ isLoadingStatus: false });
    }
  },

  updateOnlineStatus: async (isOnline: boolean) => {
    try {
      const response = await authAPI.updateOnlineStatus(isOnline);
      set({ isAvailable: response.user_is_online });
    } catch (error: any) {
      logger.error('auth', 'driverStore.updateOnlineStatus failure', { status: error?.response?.status });
      set({ isAvailable: !isOnline });
    }
  },
}));

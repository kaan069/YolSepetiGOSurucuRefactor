// Nakliye konum paylaşımı için global store
// Bu store sayesinde kullanıcı hangi ekranda olursa olsun konum paylaşımı devam eder
import { create } from 'zustand';

interface NakliyeLocationState {
  // Aktif konum paylaşımı bilgileri
  isLocationSharing: boolean;
  trackingToken: string | null;
  jobId: string | null;
  movingType: 'home' | 'city' | null;

  // Actions
  startLocationSharing: (trackingToken: string, jobId: string, movingType: 'home' | 'city') => void;
  stopLocationSharing: () => void;
}

export const useNakliyeLocationStore = create<NakliyeLocationState>((set) => ({
  isLocationSharing: false,
  trackingToken: null,
  jobId: null,
  movingType: null,

  startLocationSharing: (trackingToken, jobId, movingType) => {
    set({
      isLocationSharing: true,
      trackingToken,
      jobId,
      movingType,
    });
  },

  stopLocationSharing: () => {
    set({
      isLocationSharing: false,
      trackingToken: null,
      jobId: null,
      movingType: null,
    });
  },
}));

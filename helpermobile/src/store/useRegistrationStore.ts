// Zustand store to manage state during the multi-step registration process.
// Çok adımlı kayıt süreci boyunca state'i yönetmek için Zustand store'u.
import { create } from 'zustand';
import { AuthUser, ProviderVehicle, ProviderCrane } from '../lib/types';

// Define the shape of the data collected during registration.
// Kayıt sırasında toplanan verinin şeklini tanımla.
interface RegistrationData {
  personalInfo?: Partial<AuthUser>;
  vehicles: ProviderVehicle[];
  cranes: ProviderCrane[];
}

// Define the state and actions for the store.
// Store için state ve eylemleri tanımla.
type RegistrationState = {
  data: RegistrationData;
  setPersonalInfo: (info: Partial<AuthUser>) => void;
  addVehicle: (vehicle: Omit<ProviderVehicle, 'id'>) => void;
  addCrane: (crane: Omit<ProviderCrane, 'id'>) => void;
  reset: () => void;
};

const initialState: RegistrationData = {
  vehicles: [],
  cranes: [],
};

export const useRegistrationStore = create<RegistrationState>((set) => ({
  data: initialState,

  setPersonalInfo: (info) =>
    set((state) => ({ data: { ...state.data, personalInfo: { ...state.data.personalInfo, ...info } } })),

  addVehicle: (vehicle) =>
    set((state) => ({
      data: {
        ...state.data,
        vehicles: [...state.data.vehicles, { id: `v${Date.now()}`, ...vehicle }],
      },
    })),

  addCrane: (crane) =>
    set((state) => ({
      data: {
        ...state.data,
        cranes: [...state.data.cranes, { id: `c${Date.now()}`, ...crane }],
      },
    })),

  // Reset the store to its initial state after registration is complete or cancelled.
  // Kayıt tamamlandıktan veya iptal edildikten sonra store'u başlangıç durumuna sıfırla.
  reset: () => set({ data: initialState }),
}));

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Service type definitions
export type ServiceType = 'towTruck' | 'crane' | 'roadAssistance' | 'homeToHomeMoving' | 'cityToCity' | 'transfer';

// Provider type for registration
export type RegistrationProviderType = 'individual' | 'company';

// All registration data collected during signup
export interface RegistrationData {
  // Phone Auth
  phoneNumber: string;

  // OTP Verification Token (JWT)
  verificationToken: string;

  // Provider Type (Sahis / Firma)
  providerType: RegistrationProviderType;

  // Service Type
  selectedServiceTypes: ServiceType[];

  // Personal Info
  personalInfo: {
    firstName: string;
    lastName: string;
    tcNumber: string;
    birthDate: string;
    address: string;
    city: string;
    district: string;
    password: string;
    passwordConfirm: string;
  };

  // Vehicle Types Selected (stored for backend - these are same as selectedServiceTypes)
  vehicleTypes: string[];  // Backend format: ['towTruck', 'crane', 'roadAssistance', 'homeToHomeMoving', 'cityToCity']
  selectedVehicleTypes: ServiceType[];

  // Vehicle Registration Progress
  vehicleRegistrationProgress: {
    currentStep: number;
    completedTypes: ServiceType[];
    remainingTypes: ServiceType[];
  };

  // Timestamps
  registrationStartedAt: string;
  registrationCompletedAt?: string;
}

interface RegistrationDataStore {
  data: RegistrationData;

  // Phone Auth Actions
  setPhoneNumber: (phoneNumber: string) => void;

  // OTP Verification Token Actions
  setVerificationToken: (token: string) => void;

  // Provider Type Actions
  setProviderType: (type: RegistrationProviderType) => void;

  // Service Type Actions
  setSelectedServiceTypes: (types: ServiceType[]) => void;

  // Personal Info Actions
  setPersonalInfo: (info: Partial<RegistrationData['personalInfo']>) => void;

  // Vehicle Type Actions
  setSelectedVehicleTypes: (types: ServiceType[]) => void;
  completeVehicleType: (type: ServiceType) => void;
  getNextVehicleType: () => ServiceType | null;

  // Complete Registration
  completeRegistration: () => void;

  // Debug & Utility
  getAllData: () => RegistrationData;
  clearAll: () => void;
  logAllData: () => void;

  // Helper functions
  getUserServiceTypes: () => ServiceType[];
  hasServiceType: (type: ServiceType) => boolean;
}

const initialData: RegistrationData = {
  phoneNumber: '',
  verificationToken: '',
  providerType: 'individual',
  selectedServiceTypes: [],
  personalInfo: {
    firstName: '',
    lastName: '',
    tcNumber: '',
    birthDate: '',
    address: '',
    city: '',
    district: '',
    password: '',
    passwordConfirm: '',
  },
  vehicleTypes: [],
  selectedVehicleTypes: [],
  vehicleRegistrationProgress: {
    currentStep: 0,
    completedTypes: [],
    remainingTypes: [],
  },
  registrationStartedAt: new Date().toISOString(),
};

export const useRegistrationDataStore = create<RegistrationDataStore>()(
  persist(
    (set, get) => ({
      data: initialData,
      
      setPhoneNumber: (phoneNumber) => set((state) => ({
        data: { ...state.data, phoneNumber }
      })),

      setVerificationToken: (verificationToken) => set((state) => ({
        data: { ...state.data, verificationToken }
      })),

      setProviderType: (providerType) => set((state) => ({
        data: { ...state.data, providerType }
      })),

      setSelectedServiceTypes: (selectedServiceTypes) => set((state) => ({
        data: { ...state.data, selectedServiceTypes }
      })),
      
      setPersonalInfo: (info) => set((state) => ({
        data: { 
          ...state.data, 
          personalInfo: { ...state.data.personalInfo, ...info } 
        }
      })),
      
      setSelectedVehicleTypes: (selectedVehicleTypes) => set((state) => {
        // Backend formatına direkt geçir - artık aynı format kullanılıyor
        const vehicleTypes = [...selectedVehicleTypes];

        return {
          data: {
            ...state.data,
            selectedVehicleTypes,
            vehicleTypes, // Backend format
            vehicleRegistrationProgress: {
              currentStep: 0,
              completedTypes: [],
              remainingTypes: [...selectedVehicleTypes],
            }
          }
        };
      }),
      
      completeVehicleType: (type) => set((state) => {
        const progress = state.data.vehicleRegistrationProgress;
        const completedTypes = [...progress.completedTypes, type];
        const remainingTypes = progress.remainingTypes.filter(t => t !== type);
        
        return {
          data: {
            ...state.data,
            vehicleRegistrationProgress: {
              currentStep: progress.currentStep + 1,
              completedTypes,
              remainingTypes,
            }
          }
        };
      }),
      
      getNextVehicleType: () => {
        const state = get();
        const remaining = state.data.vehicleRegistrationProgress.remainingTypes;
        return remaining.length > 0 ? remaining[0] : null;
      },
      
      completeRegistration: () => set((state) => ({
        data: { 
          ...state.data, 
          registrationCompletedAt: new Date().toISOString() 
        }
      })),
      
      getAllData: () => get().data,
      
      clearAll: () => set({ data: {
        ...initialData,
        verificationToken: '',
        providerType: 'individual',
        registrationStartedAt: new Date().toISOString(),
        vehicleTypes: [],
        vehicleRegistrationProgress: {
          currentStep: 0,
          completedTypes: [],
          remainingTypes: [],
        }
      } }),
      
      logAllData: () => {
        const data = get().data;
        console.log('=== REGISTRATION DATA DEBUG ===');
        console.log('Phone Number:', data.phoneNumber);
        console.log('Selected Service Types:', data.selectedServiceTypes);
        console.log('Personal Info:', {
          firstName: data.personalInfo.firstName,
          lastName: data.personalInfo.lastName,
          tcNumber: data.personalInfo.tcNumber,
          birthDate: data.personalInfo.birthDate,
          address: data.personalInfo.address,
          city: data.personalInfo.city,
          district: data.personalInfo.district,
          password: data.personalInfo.password ? '***' : '',
          passwordConfirm: data.personalInfo.passwordConfirm ? '***' : '',
        });
        console.log('Selected Vehicle Types:', data.selectedVehicleTypes);
        console.log('Registration Started At:', data.registrationStartedAt);
        console.log('Registration Completed At:', data.registrationCompletedAt);
        console.log('=== END REGISTRATION DATA ===');
      },
      
      getUserServiceTypes: () => {
        const data = get().data;
        return data.selectedServiceTypes || [];
      },
      
      hasServiceType: (type: ServiceType) => {
        const data = get().data;
        return data.selectedServiceTypes?.includes(type) || false;
      },
    }),
    {
      name: 'registration-data-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar, Animated, View, StyleSheet } from 'react-native';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { useJobCountsStore } from '../store/useJobCountsStore';
import { useSyncedBlink } from '../hooks/useSyncedBlink';

// Import all screens
// Tüm ekranları import et
import HomeScreen from '../screens/HomeScreen';
import OrdersScreen from '../screens/orders';
import OfferScreen from '../screens/OfferScreen';
import { CraneOfferScreen, CraneDetailsScreen } from '../screens/crane';
import { TransferOfferScreen, TransferJobDetailScreen, TransferVehicleScreen } from '../screens/transfer';
import TowTruckOfferScreen from '../screens/TowTruckOfferScreen';
import ProfileMenuScreen from '../screens/profile/ProfileMenuScreen';
import VehicleAndServiceManagementScreen from '../screens/profile/VehicleAndServiceManagementScreen';
import VehiclesScreen from '../screens/profile/VehiclesScreen';
import AccountManagementScreen from '../screens/profile/AccountManagementScreen';
import DocumentsAndContractsScreen from '../screens/profile/DocumentsAndContractsScreen';
import DocumentsScreen from '../screens/profile/DocumentsScreen';
import CompanyInfoScreen from '../screens/profile/CompanyInfoScreen';
import CreditCardInfoScreen from '../screens/profile/CreditCardInfoScreen';
import AppSettingsScreen from '../screens/profile/AppSettingsScreen';
import EditProfileScreen from '../screens/profile/EditProfileScreen';
import ReportsAndHistoryScreen from '../screens/profile/ReportsAndHistoryScreen';
import RatingsAndReviewsScreen from '../screens/profile/RatingsAndReviewsScreen';
import MissingDocumentsScreen from '../screens/profile/MissingDocumentsScreen';
import FeedbackScreen from '../screens/profile/FeedbackScreen';
import PermissionsScreen from '../screens/profile/PermissionsScreen';
import EmployeeListScreen from '../screens/profile/EmployeeListScreen';
import EmployeeFormScreen from '../screens/profile/EmployeeFormScreen';
import ContractsListScreen from '../screens/ContractsListScreen';
import EarningsScreen from '../screens/EarningsScreen';
import JobDetailScreen from '../screens/JobDetailScreen';
import { CraneJobDetailScreen } from '../screens/crane';
import LoginScreen from '../screens/auth/LoginScreen';
import PhoneAuthScreen from '../screens/auth/PhoneAuthScreen';
import PhoneNumberScreen from '../screens/auth/PhoneNumberScreen';
import OTPVerificationScreen from '../screens/auth/OTPVerificationScreen';
// import ServiceTypeSelectionScreen from '../screens/auth/ServiceTypeSelectionScreen'; // Kaldırıldı
import PersonalInfoNewScreen from '../screens/auth/PersonalInfoNewScreen';
import VehicleTypeSelectionScreen from '../screens/auth/VehicleTypeSelectionScreen';
import { TowTruckDetailsScreen } from '../screens/towTruck';
import { TransportDetailsScreen, HomeMovingDetailsScreen } from '../screens/nakliye';
import CityToCityDetailsScreen from '../screens/auth/CityToCityDetailsScreen';
import EditVehicleScreen from '../screens/auth/EditVehicleScreen';
import { CityMovingOfferScreen, HomeMovingOfferScreen, NakliyeJobDetailScreen } from '../screens/nakliye';
import { RoadAssistanceOfferScreen, RoadAssistanceDetailsScreen } from '../screens/roadAssistance';
import RoadAssistanceJobDetailScreen from '../screens/RoadAssistanceJobDetailScreen';
import { EmployeeJobsScreen, EmployeeJobDetailScreen } from '../screens/employee';

import { useAuthStore } from '../store/authStore';
import { useThemeStore } from '../store/useThemeStore';
import { useOnboardingStore } from '../store/useOnboardingStore';
import OnboardingScreen from '../screens/onboarding/OnboardingScreen';

// Define the parameter list for each screen in the stack navigator.
// Stack navigator'daki her ekran için parametre listesini tanımla.
export type RootStackParamList = {
  // Auth Flow Screens
  // Kimlik Doğrulama Akışı Ekranları
  Login: undefined;
  PhoneAuth: undefined;
  PhoneNumber: undefined;
  OTPVerification: undefined;
  // ServiceTypeSelection: undefined; // Kaldırıldı
  PersonalInfoNew: { verificationToken?: string } | undefined;
  VehicleTypeSelection: undefined;
  TowTruckDetails: { fromRegistration?: boolean } | undefined;
  CraneDetails: { fromRegistration?: boolean } | undefined;
  TransportDetails: { fromRegistration?: boolean } | undefined;
  RoadAssistanceDetails: { fromRegistration?: boolean } | undefined;
  HomeMovingDetails: { fromRegistration?: boolean } | undefined;
  CityToCityDetails: { fromRegistration?: boolean } | undefined;
  TransferVehicleDetails: { fromRegistration?: boolean } | undefined;

  // Main App Screens
  // Ana Uygulama Ekranları
  Tabs: { screen?: string; params?: any } | undefined;
  Orders: { serviceFilter?: 'tow' | 'crane' | 'transport' | 'home_moving' | 'city_moving' | 'road_assistance'; filter?: 'pending' | 'in_progress' | 'completed' | 'awaiting_approval' | 'awaiting_payment'; timestamp?: number } | undefined;
  OrdersTab: { serviceFilter?: 'tow' | 'crane' | 'transport' | 'home_moving' | 'city_moving' | 'road_assistance'; filter?: 'pending' | 'in_progress' | 'completed' | 'awaiting_approval' | 'awaiting_payment'; timestamp?: number } | undefined;
  Offer: { orderId: string };
  CraneOffer: { orderId: string };
  TowTruckOffer: { orderId: string };
  HomeMovingOffer: { orderId: string };
  CityMovingOffer: { orderId: string };
  RoadAssistanceOffer: { orderId: string };
  TransferOffer: { orderId: string };
  JobDetail: { jobId: string; fromScreen?: 'Earnings' };
  CraneJobDetail: { jobId: string };
  HomeMovingJobDetail: { jobId: string };
  CityMovingJobDetail: { jobId: string };
  RoadAssistanceJobDetail: { jobId: string };
  TransferJobDetail: { jobId: string };
  NakliyeJobDetail: { jobId: string; movingType: 'home' | 'city' };
  EditVehicle: { vehicleId: string; vehicleType: 'tow' | 'crane' | 'transport' | 'homeMoving' | 'roadAssistance' | 'transfer' };

  // Profile Screens
  // Profil Ekranları
  ProfileTab: undefined;
  VehicleAndServiceManagement: undefined;
  VehiclesScreen: undefined;
  AccountManagement: undefined;
  EditProfile: undefined;
  ReportsAndHistory: undefined;
  RatingsAndReviews: undefined;
  DocumentsAndContracts: undefined;
  DocumentsScreen: { fromRegistration?: boolean } | undefined;
  ContractsScreen: undefined;
  CompanyInfo: { fromRegistration?: boolean } | undefined;
  CreditCardInfo: undefined;
  AppSettings: undefined;
  MissingDocuments: undefined;
  Feedback: undefined;
  Permissions: undefined;
  EmployeeList: undefined;
  EmployeeForm: { employeeId?: number } | undefined;
  EmployeeJobDetail: { requestId: number };
  Onboarding: { isModal?: boolean } | undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const Tab = createBottomTabNavigator();
const EmployeeTab = createBottomTabNavigator();

// Yanıp sönen tab ikonu komponenti
// Blinking tab icon component for active jobs - uses global synced animation
interface BlinkingTabIconProps {
  name: string;
  color: string;
  size: number;
  shouldBlink: boolean;
}

function BlinkingTabIcon({ name, color, size, shouldBlink }: BlinkingTabIconProps) {
  // Global senkronize animasyon kullan
  const blinkAnim = useSyncedBlink(shouldBlink);

  if (shouldBlink) {
    return (
      <View style={blinkStyles.container}>
        <Animated.View
          style={[
            blinkStyles.blinkBackground,
            { opacity: blinkAnim },
          ]}
        />
        <MaterialCommunityIcons name={name} color="#FFFFFF" size={size} />
      </View>
    );
  }

  return <MaterialCommunityIcons name={name} color={color} size={size} />;
}

const blinkStyles = StyleSheet.create({
  container: {
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
    width: 40,
    height: 40,
  },
  blinkBackground: {
    position: 'absolute',
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#EF4444', // Kırmızı renk
  },
});

// This component defines the bottom tab navigator.
// Bu component, alt tab navigator'ünü tanımlar.
function Tabs() {
  // Global job counts - İşler sekmesi yanıp sönmesi için
  // awaiting_approval + awaiting_payment + in_progress > 0 ise yanıp sönsün
  const hasActiveJobs = useJobCountsStore((state) => {
    const { serviceCounts } = state;
    const services = Object.values(serviceCounts);

    for (const counts of services) {
      const activeCount = counts.awaiting_approval + counts.awaiting_payment + counts.in_progress;
      if (activeCount > 0) {
        return true;
      }
    }
    return false;
  });

  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <Tab.Navigator
      initialRouteName="HomeTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
          borderTopColor: isDarkMode ? '#333333' : '#e0e0e0',
        },
        tabBarActiveTintColor: '#26a69a',
        tabBarInactiveTintColor: isDarkMode ? '#9E9E9E' : '#757575',
      }}
    >
      <Tab.Screen
        name="HomeTab"
        component={HomeScreen}
        options={{
          title: 'Ana',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="home-outline" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="OrdersTab"
        component={OrdersScreen}
        options={{
          title: 'İşler',
          tabBarIcon: ({ color, size }) => (
            <BlinkingTabIcon
              name="clipboard-text-outline"
              color={color}
              size={size}
              shouldBlink={hasActiveJobs}
            />
          ),
        }}
      />
      <Tab.Screen
        name="EarningsTab"
        component={EarningsScreen}
        options={{
          title: 'Kazanç',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="cash-multiple" color={color} size={size} />
          ),
        }}
      />
      <Tab.Screen
        name="ProfileTab"
        component={ProfileMenuScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-cog-outline" color={color} size={size} />
          ),
        }}
      />
    </Tab.Navigator>
  );
}

// Employee (Eleman) kullanıcıları için 2 tab'lı navigator
function EmployeeTabs() {
  const isDarkMode = useThemeStore((s) => s.isDarkMode);

  return (
    <EmployeeTab.Navigator
      initialRouteName="EmployeeJobsTab"
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: isDarkMode ? '#1E1E1E' : '#ffffff',
          borderTopColor: isDarkMode ? '#333333' : '#e0e0e0',
        },
        tabBarActiveTintColor: '#26a69a',
        tabBarInactiveTintColor: isDarkMode ? '#9E9E9E' : '#757575',
      }}
    >
      <EmployeeTab.Screen
        name="EmployeeJobsTab"
        component={EmployeeJobsScreen}
        options={{
          title: 'İşlerim',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="clipboard-text-outline" color={color} size={size} />
          ),
        }}
      />
      <EmployeeTab.Screen
        name="EmployeeProfileTab"
        component={ProfileMenuScreen}
        options={{
          title: 'Profil',
          tabBarIcon: ({ color, size }) => (
            <MaterialCommunityIcons name="account-cog-outline" color={color} size={size} />
          ),
        }}
      />
    </EmployeeTab.Navigator>
  );
}

// Employee kullanıcıları için stack navigator
function EmployeeAppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={EmployeeTabs} />
      <Stack.Screen name="EmployeeJobDetail" component={EmployeeJobDetailScreen} />

      {/* Employee erişebileceği profil ekranları */}
      <Stack.Screen name="AccountManagement" component={AccountManagementScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="DocumentsAndContracts" component={DocumentsAndContractsScreen} />
      <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <Stack.Screen name="MissingDocuments" component={MissingDocumentsScreen} />
      <Stack.Screen name="RatingsAndReviews" component={RatingsAndReviewsScreen} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

// This stack contains the main application screens, accessible after login.
// Bu stack, giriş yaptıktan sonra erişilebilen ana uygulama ekranlarını içerir.
function AppStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="Tabs" component={Tabs} />
      <Stack.Screen name="Offer" component={OfferScreen} />
      <Stack.Screen name="CraneOffer" component={CraneOfferScreen} />
      <Stack.Screen name="TowTruckOffer" component={TowTruckOfferScreen} />
      <Stack.Screen name="HomeMovingOffer" component={HomeMovingOfferScreen} />
      <Stack.Screen name="CityMovingOffer" component={CityMovingOfferScreen} />
      <Stack.Screen name="RoadAssistanceOffer" component={RoadAssistanceOfferScreen} />
      <Stack.Screen name="TransferOffer" component={TransferOfferScreen} />
      <Stack.Screen name="JobDetail" component={JobDetailScreen} />
      <Stack.Screen name="CraneJobDetail" component={CraneJobDetailScreen} />
      <Stack.Screen name="RoadAssistanceJobDetail" component={RoadAssistanceJobDetailScreen} />
      <Stack.Screen name="NakliyeJobDetail" component={NakliyeJobDetailScreen} />
      <Stack.Screen name="TransferJobDetail" component={TransferJobDetailScreen} />
      <Stack.Screen name="EditVehicle" component={EditVehicleScreen} />

      {/* Vehicle Addition Screens - Araç Ekleme Ekranları */}
      <Stack.Screen name="TowTruckDetails" component={TowTruckDetailsScreen} />
      <Stack.Screen name="CraneDetails" component={CraneDetailsScreen} />
      <Stack.Screen name="TransportDetails" component={TransportDetailsScreen} />
      <Stack.Screen name="RoadAssistanceDetails" component={RoadAssistanceDetailsScreen} />
      <Stack.Screen name="HomeMovingDetails" component={HomeMovingDetailsScreen} />
      <Stack.Screen name="CityToCityDetails" component={CityToCityDetailsScreen} />
      <Stack.Screen name="TransferVehicleDetails" component={TransferVehicleScreen} />

      {/* Profile Screens - Profil Ekranları */}
      <Stack.Screen name="VehicleAndServiceManagement" component={VehicleAndServiceManagementScreen} />
      <Stack.Screen name="VehiclesScreen" component={VehiclesScreen} />
      <Stack.Screen name="AccountManagement" component={AccountManagementScreen} />
      <Stack.Screen name="EditProfile" component={EditProfileScreen} />
      <Stack.Screen name="ReportsAndHistory" component={ReportsAndHistoryScreen} />
      <Stack.Screen name="RatingsAndReviews" component={RatingsAndReviewsScreen} />
      <Stack.Screen name="DocumentsAndContracts" component={DocumentsAndContractsScreen} />
      <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <Stack.Screen name="CompanyInfo" component={CompanyInfoScreen} />
      <Stack.Screen name="CreditCardInfo" component={CreditCardInfoScreen} />
      <Stack.Screen name="AppSettings" component={AppSettingsScreen} />
      <Stack.Screen name="MissingDocuments" component={MissingDocumentsScreen} />
      <Stack.Screen name="Feedback" component={FeedbackScreen} />
      <Stack.Screen name="Permissions" component={PermissionsScreen} />
      <Stack.Screen name="EmployeeList" component={EmployeeListScreen} />
      <Stack.Screen name="EmployeeForm" component={EmployeeFormScreen} />
      <Stack.Screen name="EmployeeJobDetail" component={EmployeeJobDetailScreen} />
      <Stack.Screen name="ContractsScreen" component={ContractsListScreen} />
      <Stack.Screen
        name="Onboarding"
        component={OnboardingScreen}
        options={{ presentation: 'fullScreenModal', animation: 'slide_from_bottom' }}
      />
    </Stack.Navigator>
  );
}

// This stack contains the authentication and registration screens.
// Bu stack, kimlik doğrulama ve kayıt ekranlarını içerir.
function AuthStack() {
  return (
    <Stack.Navigator screenOptions={{ headerBackTitle: 'Geri', headerShown: false }}>
      <Stack.Screen name="Login" component={LoginScreen} />
      <Stack.Screen name="PhoneAuth" component={PhoneAuthScreen} />
      <Stack.Screen name="PhoneNumber" component={PhoneNumberScreen} />
      <Stack.Screen name="OTPVerification" component={OTPVerificationScreen} />
      {/* <Stack.Screen name="ServiceTypeSelection" component={ServiceTypeSelectionScreen} /> */}
      <Stack.Screen name="PersonalInfoNew" component={PersonalInfoNewScreen} />
      <Stack.Screen name="VehicleTypeSelection" component={VehicleTypeSelectionScreen} />
      <Stack.Screen name="VehiclesScreen" component={VehiclesScreen} />
      <Stack.Screen name="TowTruckDetails" component={TowTruckDetailsScreen} />
      <Stack.Screen name="CraneDetails" component={CraneDetailsScreen} />
      <Stack.Screen name="TransportDetails" component={TransportDetailsScreen} />
      <Stack.Screen name="RoadAssistanceDetails" component={RoadAssistanceDetailsScreen} />
      <Stack.Screen name="HomeMovingDetails" component={HomeMovingDetailsScreen} />
      <Stack.Screen name="CityToCityDetails" component={CityToCityDetailsScreen} />
      <Stack.Screen name="TransferVehicleDetails" component={TransferVehicleScreen} />
      <Stack.Screen name="DocumentsScreen" component={DocumentsScreen} />
      <Stack.Screen name="CompanyInfo" component={CompanyInfoScreen} />
      <Stack.Screen name="CreditCardInfo" component={CreditCardInfoScreen} />
    </Stack.Navigator>
  );
}

// The root navigator conditionally renders the Auth or App stack based on authentication state.
// Kök navigator, kimlik doğrulama durumuna göre Auth veya App stack'ini koşullu olarak render eder.
export default function RootNavigator({ navigationRef }: { navigationRef?: any }) {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  const currentUser = useAuthStore((s) => s.currentUser);
  const isDarkMode = useThemeStore((s) => s.isDarkMode);
  const hasSeenOnboarding = useOnboardingStore((s) => s.hasSeenOnboarding);

  // Employee kullanıcı mı kontrol et
  const isEmployee = (currentUser as any)?.provider_type === 'employee';

  // Dört yollu render: Auth / Onboarding / EmployeeApp / App
  const navKey = !isAuthenticated ? 'auth' : !hasSeenOnboarding ? 'onboarding' : isEmployee ? 'employee' : 'app';

  return (
    <>
      <StatusBar barStyle={isDarkMode ? 'light-content' : 'dark-content'} backgroundColor={isDarkMode ? '#121212' : '#ffffff'} />
      <NavigationContainer ref={navigationRef} key={navKey}>
        {!isAuthenticated ? (
          <AuthStack />
        ) : !hasSeenOnboarding ? (
          <OnboardingScreen />
        ) : isEmployee ? (
          <EmployeeAppStack />
        ) : (
          <AppStack />
        )}
      </NavigationContainer>
    </>
  );
}

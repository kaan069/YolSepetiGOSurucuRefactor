// This screen displays legal agreements for the user to accept to finalize registration.
// Bu ekran, kaydı tamamlamak için kullanıcının kabul etmesi gereken yasal sözleşmeleri görüntüler.
import React, { useState, useCallback } from 'react';
import { ScrollView, StyleSheet, View, Alert, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { Button, Text, Card, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useAuthStore } from '../../store/authStore';
import { useRegistrationDataStore } from '../../store/useRegistrationDataStore';
import { useVehicleStore } from '../../store/useVehicleStore';
import { vehiclesAPI } from '../../api';
import { CONTRACTS } from '../../constants/contracts';

type Props = NativeStackScreenProps<RootStackParamList, 'Legal'>;

export default function LegalScreen({ navigation }: Props) {
  const { setIsAuthenticated, setCurrentUser } = useAuthStore();
  const { completeRegistration, logAllData } = useRegistrationDataStore();
  const { towTrucks, cranes } = useVehicleStore();
  const [loading, setLoading] = useState(false);
  const [scrolledToBottom, setScrolledToBottom] = useState(false);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const { contentOffset, layoutMeasurement, contentSize } = event.nativeEvent;
    const isAtBottom = contentOffset.y + layoutMeasurement.height >= contentSize.height - 50;
    if (isAtBottom && !scrolledToBottom) {
      setScrolledToBottom(true);
    }
  }, [scrolledToBottom]);

  const handleAccept = async () => {
    setLoading(true);

    try {
      // Complete registration data
      completeRegistration();

      // Log all data for backend development
      console.log('=== COMPLETE REGISTRATION DATA FOR BACKEND ===');
      logAllData();
      console.log('Vehicle Data:', {
        towTrucks: towTrucks,
        cranes: cranes,
        totalVehicles: towTrucks.length + cranes.length
      });
      console.log('=== END COMPLETE DATA ===');

      // Kullanıcının araçlarını backend'den yükle
      await vehiclesAPI.loadUserVehicles();

      // Backend'den user bilgisini al ve authStore'a kaydet
      try {
        const { authAPI } = require('../../api');
        const profileData = await authAPI.getProfile();

        if (profileData.user) {
          const authUser = {
            id: profileData.user.id.toString(),
            username: profileData.user.phone_number || '',
            password: '',
            fullName: `${profileData.user.first_name} ${profileData.user.last_name}`.trim(),
            phone_number: profileData.user.phone_number,
            birthDate: profileData.user.birth_date,
            nationalId: profileData.user.tc_no,
            workAddress: profileData.user.business_address,
            role: profileData.user.driver_type as any,
            vehicles: [],
          };
          setCurrentUser(authUser);
          console.log('✅ User bilgisi authStore\'a kaydedildi:', authUser.id);
        }
      } catch (error) {
        console.error('❌ User bilgisi alınamadı:', error);
      }

      // Kullanıcı zaten API'ye kayıtlı, sadece authenticated yap
      console.log('Setting isAuthenticated to true...');
      setIsAuthenticated(true);
      console.log('Authentication set successfully');

      Alert.alert('Başarılı', 'Kayıt başarıyla tamamlandı! 🎉');

    } catch (error) {
      console.error('Registration completion error:', error);
      Alert.alert('Hata', 'Kayıt tamamlanırken bir hata oluştu. Lütfen tekrar deneyin.');
    } finally {
      setLoading(false);
    }
  };

  // Combine all contract texts
  const allContractText = CONTRACTS.map(c => c.content).join('\n\n─────────────────────────────\n\n');

  return (
    <View style={styles.container}>
      <Text variant="headlineLarge" style={styles.title}>
        Sözleşmeler
      </Text>
      <Card style={styles.card}>
        <ScrollView
          style={styles.scrollView}
          onScroll={handleScroll}
          scrollEventThrottle={16}
        >
          <Text style={styles.contractText}>{allContractText}</Text>
        </ScrollView>
      </Card>
      <Button
        mode="contained"
        onPress={handleAccept}
        loading={loading}
        disabled={loading || !scrolledToBottom}
        style={[styles.button, !scrolledToBottom && styles.disabledButton]}
      >
        {loading ? 'Tamamlanıyor...' : scrolledToBottom ? 'Okudum, Anladım, Kabul Ediyorum' : 'Sözleşmeyi okumak için aşağı kaydırın'}
      </Button>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 16,
  },
  card: {
    flex: 1,
  },
  scrollView: {
    padding: 16,
  },
  contractText: {
    fontSize: 13,
    lineHeight: 20,
    color: '#333',
    textAlign: 'justify',
  },
  button: {
    marginTop: 20,
    paddingVertical: 8,
    borderRadius: 12,
  },
  disabledButton: {
    opacity: 0.6,
  },
});

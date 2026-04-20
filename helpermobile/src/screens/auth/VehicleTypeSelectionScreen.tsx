import React, { useState } from 'react';
import { View, StyleSheet, TouchableOpacity } from 'react-native';
import { Button, Text, useTheme, ProgressBar, IconButton } from 'react-native-paper';
import MaterialCommunityIcons from 'react-native-vector-icons/MaterialCommunityIcons';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore, RegistrationProviderType } from '../../store/useRegistrationDataStore';
import { authAPI } from '../../api';
import { logger } from '../../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleTypeSelection'>;

export default function VehicleTypeSelectionScreen({ navigation }: Props) {
  const theme = useTheme();
  const { setProviderType, data } = useRegistrationDataStore();
  const [providerType, setProviderTypeLocal] = useState<RegistrationProviderType>(data.providerType || 'individual');
  const [loading, setLoading] = useState(false);

  const selectedTypes = data.selectedVehicleTypes || [];

  const handleContinue = async () => {
    setLoading(true);
    try {
      // Backend'e provider_type'ı PATCH ile gönder
      await authAPI.updateProfile({ provider_type: providerType } as any);
      logger.debug('auth', 'Provider type gncellendi');
    } catch (error) {
      logger.error('auth', 'Provider type gncellenemedi');
    }
    setLoading(false);

    // Store provider type (Bireysel / Şirket)
    setProviderType(providerType);

    // Araç gerektiren hizmetler
    const vehicleRequiredServices = ['towTruck', 'crane', 'roadAssistance', 'transfer'];
    const hasVehicleRequiredService = selectedTypes.some(
      (type) => vehicleRequiredServices.includes(type)
    );

    if (!hasVehicleRequiredService) {
      // Sadece nakliye hizmeti seçilmişse, belgelere yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'DocumentsScreen', params: { fromRegistration: true } }],
      });
      return;
    }

    // İlk araç gerektiren hizmet türüne yönlendir
    const firstType = selectedTypes.find((t) => vehicleRequiredServices.includes(t)) || selectedTypes[0];
    if (firstType === 'towTruck') {
      navigation.navigate('TowTruckDetails');
    } else if (firstType === 'crane') {
      navigation.navigate('CraneDetails');
    } else if (firstType === 'roadAssistance') {
      navigation.navigate('RoadAssistanceDetails');
    } else if (firstType === 'transfer') {
      navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
    } else if (firstType === 'homeToHomeMoving' || firstType === 'cityToCity') {
      navigation.navigate('HomeMovingDetails');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <IconButton
          icon="arrow-left"
          size={24}
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        />
        <ProgressBar
          progress={0.7}
          style={styles.progressBar}
          color={theme.colors.primary}
        />
      </View>

      <View style={styles.content}>
        <View style={styles.titleContainer}>
          <Text variant="headlineMedium" style={styles.title}>
            Hizmet Sağlayıcı Tipi
          </Text>
          <Text variant="bodyMedium" style={styles.subtitle}>
            Şahıs olarak mı yoksa firma olarak mı hizmet vereceksiniz?
          </Text>
        </View>

        <View style={styles.providerTypeContainer}>
          <TouchableOpacity
            style={[
              styles.providerTypeCard,
              providerType === 'individual' && {
                borderColor: theme.colors.primary,
                borderWidth: 2,
                backgroundColor: theme.colors.primaryContainer,
              }
            ]}
            onPress={() => setProviderTypeLocal('individual')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="account"
              size={32}
              color={providerType === 'individual' ? theme.colors.primary : '#757575'}
            />
            <Text style={[
              styles.providerTypeTitle,
              providerType === 'individual' && { color: theme.colors.primary }
            ]}>
              Bireysel
            </Text>
            <Text style={styles.providerTypeDesc}>Tek aracımla hizmet vereceğim</Text>
            {providerType === 'individual' && (
              <View style={[styles.providerCheck, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.providerTypeCard,
              providerType === 'company' && {
                borderColor: theme.colors.primary,
                borderWidth: 2,
                backgroundColor: theme.colors.primaryContainer,
              }
            ]}
            onPress={() => setProviderTypeLocal('company')}
            activeOpacity={0.7}
          >
            <MaterialCommunityIcons
              name="office-building"
              size={32}
              color={providerType === 'company' ? theme.colors.primary : '#757575'}
            />
            <Text style={[
              styles.providerTypeTitle,
              providerType === 'company' && { color: theme.colors.primary }
            ]}>
              Şirket
            </Text>
            <Text style={styles.providerTypeDesc}>Birden fazla araç ve elemanla hizmet vereceğim</Text>
            {providerType === 'company' && (
              <View style={[styles.providerCheck, { backgroundColor: theme.colors.primary }]}>
                <Text style={styles.checkmark}>✓</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.buttonContainer}>
          <Button
            mode="contained"
            onPress={handleContinue}
            loading={loading}
            disabled={loading}
            style={styles.continueButton}
            contentStyle={styles.buttonContent}
          >
            Devam Et
          </Button>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    paddingTop: 50,
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: 'white',
    elevation: 2,
  },
  backButton: {
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  progressBar: {
    height: 4,
    borderRadius: 2,
  },
  content: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  titleContainer: {
    marginBottom: 20,
    alignItems: 'center',
  },
  title: {
    fontWeight: 'bold',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    textAlign: 'center',
    opacity: 0.7,
    paddingHorizontal: 20,
  },
  buttonContainer: {
    paddingTop: 32,
  },
  continueButton: {
    borderRadius: 12,
  },
  buttonContent: {
    paddingVertical: 8,
  },
  providerTypeContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  providerTypeCard: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#e0e0e0',
    backgroundColor: 'white',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    position: 'relative',
  },
  providerTypeTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginTop: 8,
    color: '#333',
  },
  providerTypeDesc: {
    fontSize: 12,
    color: '#757575',
    marginTop: 4,
    textAlign: 'center',
  },
  providerCheck: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 22,
    height: 22,
    borderRadius: 11,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkmark: {
    color: 'white',
    fontSize: 14,
    fontWeight: 'bold',
  },
});

import React, { useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { Text } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { useRegistrationDataStore, RegistrationProviderType } from '../../store/useRegistrationDataStore';
import { authAPI } from '../../api';
import { logger } from '../../utils/logger';
import { FkButton, FkSelectableTile, FkStepHeader, FkStickyFooter } from '../../components/fk';
import { useAppTheme } from '../../hooks/useAppTheme';
import { spacing, text } from '../../theme/design';

type Props = NativeStackScreenProps<RootStackParamList, 'VehicleTypeSelection'>;

export default function VehicleTypeSelectionScreen({ navigation }: Props) {
  const { screenBg, appColors } = useAppTheme();
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

    // Araç gerektiren hizmetler (tüm hizmet tipleri araç/detay adımı ister — nakliye dahil)
    const vehicleRequiredServices = ['towTruck', 'crane', 'roadAssistance', 'transfer', 'homeToHomeMoving', 'cityToCity'];
    const hasVehicleRequiredService = selectedTypes.some(
      (type) => vehicleRequiredServices.includes(type)
    );

    if (!hasVehicleRequiredService) {
      // Hiç araç gerektiren tip seçilmemişse (uç durum), belgelere yönlendir
      navigation.reset({
        index: 0,
        routes: [{ name: 'DocumentsScreen', params: { fromRegistration: true } }],
      });
      return;
    }

    // İlk araç gerektiren hizmet türüne yönlendir
    const firstType = selectedTypes.find((t) => vehicleRequiredServices.includes(t)) || selectedTypes[0];
    if (firstType === 'towTruck') {
      navigation.navigate('TowTruckDetails', { fromRegistration: true });
    } else if (firstType === 'crane') {
      navigation.navigate('CraneDetails', { fromRegistration: true });
    } else if (firstType === 'roadAssistance') {
      navigation.navigate('RoadAssistanceDetails', { fromRegistration: true });
    } else if (firstType === 'transfer') {
      navigation.navigate('TransferVehicleDetails', { fromRegistration: true });
    } else if (firstType === 'homeToHomeMoving' || firstType === 'cityToCity') {
      navigation.navigate('HomeMovingDetails', { fromRegistration: true });
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: screenBg }]}>
      <FkStepHeader title="Hizmet Sağlayıcı Tipi" progress={0.7} onBack={() => navigation.goBack()} />

      <View style={styles.content}>
        <Text style={[styles.title, { color: appColors.text.primary }]}>Nasıl hizmet vereceksiniz?</Text>
        <Text style={[styles.subtitle, { color: appColors.text.secondary }]}>
          Şahıs olarak mı yoksa firma olarak mı hizmet vereceksiniz?
        </Text>

        <View style={styles.options}>
          <FkSelectableTile
            icon="account-outline"
            title="Bireysel"
            description="Tek aracımla hizmet vereceğim"
            selected={providerType === 'individual'}
            onPress={() => setProviderTypeLocal('individual')}
          />
          <FkSelectableTile
            icon="office-building-outline"
            title="Şirket"
            description="Birden fazla araç ve elemanla hizmet vereceğim"
            selected={providerType === 'company'}
            onPress={() => setProviderTypeLocal('company')}
          />
        </View>
      </View>

      <FkStickyFooter>
        <FkButton onPress={handleContinue} loading={loading} disabled={loading} size="lg" fullWidth>
          Devam Et
        </FkButton>
      </FkStickyFooter>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: spacing.md,
  },
  title: {
    ...text.title,
    marginTop: spacing.sm,
  },
  subtitle: {
    fontSize: 16,
    marginTop: spacing.xs,
    marginBottom: spacing.lg,
  },
  options: {
    gap: spacing.sm + 4,
  },
});

import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Text, IconButton, Chip } from 'react-native-paper';
import { useVehicleStore } from '../../store/useVehicleStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { vehiclesAPI } from '../../api';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import VehicleStatusChip from '../../components/common/VehicleStatusChip';
import { useAppTheme } from '../../hooks/useAppTheme';
import { logger } from '../../utils/logger';
import { colors } from '../../theme/design';
import { FkCard, FkButton } from '../../components/fk';
import { JobSection } from '../../components/job';

type Props = NativeStackScreenProps<RootStackParamList, 'VehiclesScreen'>;

export default function VehiclesScreen({ navigation }: Props) {
  const { screenBg, cardBg } = useAppTheme();
  const {
    towTrucks = [],
    cranes = [],
    transports = [],
    homeMoving = [],
    roadAssistance = [],
    transfers = [],
    removeTowTruck,
    removeCrane,
    removeTransport,
    removeHomeMoving,
    removeRoadAssistance,
    removeTransfer
  } = useVehicleStore();
  const [deletingVehicleId, setDeletingVehicleId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [userServiceTypes, setUserServiceTypes] = useState<string[]>([]);

  // Gerçek araç verilerine göre servis tipini kontrol et
  // user_type boş olabilir, bu yüzden gerçek araç sayısına bakıyoruz
  const hasServiceType = (type: 'tow' | 'crane' | 'transport' | 'nakliye' | 'roadAssistance' | 'transfer'): boolean => {
    // Önce gerçek araç verilerine bak
    switch (type) {
      case 'tow':
        if (towTrucks && towTrucks.length > 0) return true;
        break;
      case 'crane':
        if (cranes && cranes.length > 0) return true;
        break;
      case 'transport':
        if (transports && transports.length > 0) return true;
        break;
      case 'nakliye':
        if (homeMoving && homeMoving.length > 0) return true;
        break;
      case 'roadAssistance':
        if (roadAssistance && roadAssistance.length > 0) return true;
        break;
      case 'transfer':
        if (transfers && transfers.length > 0) return true;
        break;
    }

    // Araç yoksa user_type'a bak (yeni araç ekleyebilmek için)
    const typeMapping: { [key: string]: string[] } = {
      'tow': ['towTruck'],
      'crane': ['crane'],
      'transport': ['transport'],
      'nakliye': ['homeToHomeMoving', 'cityToCity', 'nakliye'],
      'roadAssistance': ['roadAssistance'],
      'transfer': ['transfer'],
    };

    const allowedTypes = typeMapping[type] || [];
    return allowedTypes.some(t => userServiceTypes.includes(t));
  };

  // Load vehicles from backend when screen comes into focus
  // Ekran focus olduğunda backend'den araçları yükle
  useFocusEffect(
    useCallback(() => {
      const loadVehicles = async () => {
        try {
          setLoading(true);

          // Token kontrolü - eğer token yoksa loading'i durdur (logout sonrası olabilir)
          const accessToken = await AsyncStorage.getItem('access_token');
          if (!accessToken) {
            setLoading(false);
            return;
          }

          // AsyncStorage'dan kullanıcı bilgisini yükle
          const userJson = await AsyncStorage.getItem('user');
          if (userJson) {
            const user: User = JSON.parse(userJson);
            setUserServiceTypes(user.user_type || []);
          }

          await vehiclesAPI.loadUserVehicles();
        } catch (error: any) {
          logger.error('vehicles', 'VehiclesScreen.loadVehicles failure', { status: error?.response?.status });

          // Sadece authentication hatası değilse kullanıcıya göster
          if (error?.response?.status !== 401) {
            Alert.alert(
              'Hata',
              'Araçlar yüklenirken bir hata oluştu. Lütfen tekrar deneyin.'
            );
          }
        } finally {
          setLoading(false);
        }
      };

      loadVehicles();
    }, [])
  );

  const handleDeleteTowTruck = async (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı çekici aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingVehicleId(vehicleId);
            try {
              // API'den sil
              await vehiclesAPI.deleteTowTruck(parseInt(vehicleId));

              // Local store'dan sil
              removeTowTruck(vehicleId);

              Alert.alert('Başarılı', 'Çekici aracı başarıyla silindi.');
            } catch (error: any) {
              logger.error('vehicles', 'VehiclesScreen.deleteTowTruck failure', { status: error?.response?.status });
              const errorMessage = error?.response?.data?.message ||
                                  error?.response?.data?.error ||
                                  'Çekici silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setDeletingVehicleId(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteCrane = async (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı vinç aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingVehicleId(vehicleId);
            try {
              // API'den sil
              await vehiclesAPI.deleteCrane(parseInt(vehicleId));

              // Local store'dan sil
              removeCrane(vehicleId);

              Alert.alert('Başarılı', 'Vinç aracı başarıyla silindi.');
            } catch (error: any) {
              logger.error('vehicles', 'VehiclesScreen.deleteCrane failure', { status: error?.response?.status });
              const errorMessage = error?.response?.data?.message ||
                                  error?.response?.data?.error ||
                                  'Vinç silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setDeletingVehicleId(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteTransport = (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı nakliye aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: () => {
            removeTransport(vehicleId);
            alert('Nakliye aracı başarıyla silindi.');
          }
        }
      ]
    );
  };

  const handleDeleteHomeMoving = async (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı nakliye aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingVehicleId(vehicleId);
            try {
              await vehiclesAPI.deleteNakliyeVehicle(parseInt(vehicleId));
              removeHomeMoving(vehicleId);
              Alert.alert('Başarılı', 'Nakliye aracı başarıyla silindi.');
            } catch (error: any) {
              logger.error('vehicles', 'VehiclesScreen.deleteHomeMoving failure', { status: error?.response?.status });
              const errorMessage = error?.response?.data?.message ||
                                  error?.response?.data?.error ||
                                  'Nakliye aracı silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setDeletingVehicleId(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteRoadAssistance = async (vehicleId: string) => {
    Alert.alert(
      'Hizmeti Sil',
      'Yol yardım hizmetini silmek istediğinize emin misiniz?',
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingVehicleId(vehicleId);
            try {
              await vehiclesAPI.deleteRoadAssistanceVehicle(parseInt(vehicleId));
              removeRoadAssistance(vehicleId);
              Alert.alert('Başarılı', 'Yol yardım hizmeti başarıyla silindi.');
            } catch (error: any) {
              logger.error('vehicles', 'VehiclesScreen.deleteRoadAssistance failure', { status: error?.response?.status });
              const errorMessage = error?.response?.data?.message ||
                                  error?.response?.data?.error ||
                                  'Yol yardım hizmeti silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setDeletingVehicleId(null);
            }
          }
        }
      ]
    );
  };

  const handleDeleteTransfer = async (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı transfer aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        {
          text: 'Sil',
          style: 'destructive',
          onPress: async () => {
            setDeletingVehicleId(vehicleId);
            try {
              await vehiclesAPI.deleteTransferVehicle(parseInt(vehicleId));
              removeTransfer(vehicleId);
              Alert.alert('Başarılı', 'Transfer aracı başarıyla silindi.');
            } catch (error: any) {
              logger.error('vehicles', 'VehiclesScreen.deleteTransfer failure', { status: error?.response?.status });
              const errorMessage = error?.response?.data?.message ||
                                  error?.response?.data?.error ||
                                  'Transfer aracı silinirken bir hata oluştu.';
              Alert.alert('Hata', errorMessage);
            } finally {
              setDeletingVehicleId(null);
            }
          }
        }
      ]
    );
  };

  const getVehicleTypeName = (vehicleType: string) => {
    switch (vehicleType) {
      case 'van': return 'Kamyonet';
      case 'small-truck': return 'Küçük Kamyon';
      case 'truck': return 'Kamyon';
      case 'large-truck': return 'Büyük Kamyon';
      default: return vehicleType;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: screenBg }]} edges={["bottom"]}>
      <AppBar title="Araçlarım" />

      {loading && (
        <View style={styles.loadingOverlay}>
          <LoadingSpinner size={80} />
          <Text style={{ marginTop: 12, color: colors.neutral[500] }}>Araçlar yükleniyor...</Text>
        </View>
      )}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Tow Trucks Card - Only show if user registered for tow service */}
        {hasServiceType('tow') && (
          <JobSection title={`Çekici Araçlarım (${towTrucks?.length || 0})`} icon="tow-truck" style={styles.card}>
            {towTrucks && towTrucks.length > 0 ? (
              towTrucks.map((truck) => (
                <FkCard key={truck.id} variant="outlined" style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {truck.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {truck.brand} {truck.model} - {truck.year}
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          {truck.platformType === 'open' && 'Açık Platform'}
                          {truck.platformType === 'closed' && 'Kapalı Kasa'}
                          {truck.platformType === 'flatbed' && 'Düz Platform'}
                        </Text>
                        <VehicleStatusChip
                          status={truck.verificationStatus}
                          rejectionReason={truck.verificationRejectionReason}
                        />
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        {truck.verificationStatus !== 'approved' && (
                          <FkButton variant="ghost" icon="pencil" size="sm" onPress={() => navigation.navigate('EditVehicle', { vehicleId: truck.id, vehicleType: 'tow' })}>
                            Düzenle
                          </FkButton>
                        )}
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.danger[600]}
                          onPress={() => handleDeleteTowTruck(truck.id, truck.plate)}
                          disabled={deletingVehicleId === truck.id}
                        />
                      </View>
                    </View>
                  
                </FkCard>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı çekici aracınız bulunmuyor.</Text>
            )}
            </JobSection>
        )}

        {/* Cranes Card - Only show if user registered for crane service */}
        {hasServiceType('crane') && (
          <JobSection title={`Vinç Araçlarım (${cranes?.length || 0})`} icon="crane" style={styles.card}>
            {cranes && cranes.length > 0 ? (
              cranes.map((crane) => (
                <FkCard key={crane.id} variant="outlined" style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {crane.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {crane.brand} {crane.model} - {crane.year}
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          Max: {crane.maxHeight}m yukseklik
                        </Text>
                        <VehicleStatusChip
                          status={crane.verificationStatus}
                          rejectionReason={crane.verificationRejectionReason}
                        />
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        {crane.verificationStatus !== 'approved' && (
                          <FkButton variant="ghost" icon="pencil" size="sm" onPress={() => navigation.navigate('EditVehicle', { vehicleId: crane.id, vehicleType: 'crane' })}>
                            Düzenle
                          </FkButton>
                        )}
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.danger[600]}
                          onPress={() => handleDeleteCrane(crane.id, crane.plate)}
                          disabled={deletingVehicleId === crane.id}
                        />
                      </View>
                    </View>

                  
                </FkCard>
              ))
              
            ) : (
              <Text style={styles.emptyText}>Kayıtlı vinç aracınız bulunmuyor.</Text>
            )}
          </JobSection>
        )}

        {/* Transport Vehicles Card - Only show if user registered for transport service */}
        {hasServiceType('transport') && (
          <JobSection title={`Nakliye Araçlarım (${transports?.length || 0})`} icon="truck-delivery" style={styles.card}>
            {transports && transports.length > 0 ? (
              transports.map((transport) => (
                <FkCard key={transport.id} variant="outlined" style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {transport.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {transport.brand} {transport.model} • {transport.capacity} ton
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          {transport.volume}m³ • {getVehicleTypeName(transport.vehicleType)}
                          {transport.hasLift && ' • Lift'}{transport.hasRamp && ' • Rampa'}
                        </Text>
                        <Text variant="bodySmall" style={styles.priceText}>
                          {transport.pricePerKm} TL/km{transport.pricePerHour && ` • ${transport.pricePerHour} TL/saat`}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <FkButton variant="ghost" icon="pencil" size="sm" onPress={() => navigation.navigate('EditVehicle', { vehicleId: transport.id, vehicleType: 'transport' })}>
                          Düzenle
                        </FkButton>
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.danger[600]}
                          onPress={() => handleDeleteTransport(transport.id, transport.plate)}
                        />
                      </View>
                    </View>

                    {transport.services.length > 0 && (
                      <View style={styles.equipmentSection}>
                        <Text variant="bodySmall" style={styles.equipmentLabel}>
                          Hizmetler:
                        </Text>
                        <View style={styles.equipmentTags}>
                          {transport.services.slice(0, 3).map((service, index) => (
                            <Chip key={index} compact style={styles.equipmentChip}>
                              {service}
                            </Chip>
                          ))}
                          {transport.services.length > 3 && (
                            <Text variant="bodySmall" style={styles.moreText}>
                              +{transport.services.length - 3} daha
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  
                </FkCard>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı nakliye aracınız bulunmuyor.</Text>
            )}
            </JobSection>
        )}

        {/* Nakliye (Evden Eve) Vehicles Card */}
        {hasServiceType('nakliye') && (
          <JobSection title={`Evden Eve Nakliye (${homeMoving?.length || 0})`} icon="home-variant-outline" style={styles.card}>
            {homeMoving && homeMoving.length > 0 ? (
              homeMoving.map((vehicle) => (
                <FkCard key={vehicle.id} variant="outlined" style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {vehicle.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {vehicle.brand} {vehicle.model} - {vehicle.capacity} ton
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          {vehicle.volume}m3 - {getVehicleTypeName(vehicle.vehicleType)}
                          {vehicle.hasLift && ' - Lift'}{vehicle.hasRamp && ' - Rampa'}
                        </Text>
                        <Text variant="bodySmall" style={styles.priceText}>
                          {vehicle.pricePerKm} TL/km{vehicle.pricePerHour && ` - ${vehicle.pricePerHour} TL/saat`}
                        </Text>
                        <VehicleStatusChip
                          status={vehicle.verificationStatus}
                          rejectionReason={vehicle.verificationRejectionReason}
                        />
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        {vehicle.verificationStatus !== 'approved' && (
                          <FkButton variant="ghost" icon="pencil" size="sm" onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle.id, vehicleType: 'homeMoving' })}>
                            Düzenle
                          </FkButton>
                        )}
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.danger[600]}
                          onPress={() => handleDeleteHomeMoving(vehicle.id, vehicle.plate)}
                          disabled={deletingVehicleId === vehicle.id}
                        />
                      </View>
                    </View>

                    {vehicle.equipment && vehicle.equipment.length > 0 && (
                      <View style={styles.equipmentSection}>
                        <Text variant="bodySmall" style={styles.equipmentLabel}>
                          Donanımlar:
                        </Text>
                        <View style={styles.equipmentTags}>
                          {vehicle.equipment.slice(0, 3).map((eq, index) => (
                            <Chip key={index} compact style={styles.equipmentChip}>
                              {eq}
                            </Chip>
                          ))}
                          {vehicle.equipment.length > 3 && (
                            <Text variant="bodySmall" style={styles.moreText}>
                              +{vehicle.equipment.length - 3} daha
                            </Text>
                          )}
                        </View>
                      </View>
                    )}
                  
                </FkCard>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı nakliye aracınız bulunmuyor.</Text>
            )}
            </JobSection>
        )}

        {/* Road Assistance Card */}
        {hasServiceType('roadAssistance') && (
          <JobSection title={`Yol Yardım Hizmetleri (${roadAssistance?.length || 0})`} icon="car-wrench" style={styles.card}>
            {roadAssistance && roadAssistance.length > 0 ? (
              roadAssistance.map((service) => (
                <FkCard key={service.id} variant="outlined" style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {service.plate || 'Yol Yardım Hizmeti'}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {service.brand} {service.model} {service.year ? `- ${service.year}` : ''}
                        </Text>
                        <VehicleStatusChip
                          status={service.verificationStatus}
                          rejectionReason={service.verificationRejectionReason}
                        />
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        {service.verificationStatus !== 'approved' && (
                          <FkButton variant="ghost" icon="pencil" size="sm" onPress={() => navigation.navigate('EditVehicle', { vehicleId: service.id, vehicleType: 'roadAssistance' })}>
                            Düzenle
                          </FkButton>
                        )}
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.danger[600]}
                          onPress={() => handleDeleteRoadAssistance(service.id)}
                          disabled={deletingVehicleId === service.id}
                        />
                      </View>
                    </View>

                  
                </FkCard>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı yol yardım hizmetiniz bulunmuyor.</Text>
            )}
            </JobSection>
        )}

        {/* Transfer Araçlarım */}
        {hasServiceType('transfer') && (
          <JobSection title={`Transfer Araçlarım (${transfers?.length || 0})`} icon="bus" style={styles.card}>
            {transfers && transfers.length > 0 ? (
              transfers.map((vehicle) => (
                <FkCard key={vehicle.id} variant="outlined" style={styles.vehicleCard}>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {vehicle.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {vehicle.brand} {vehicle.model} - {vehicle.year}
                        </Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 4 }}>
                          <Chip
                            compact
                            style={{ backgroundColor: vehicle.transferType === 'vip' ? colors.warning[50] : colors.success[50] }}
                            textStyle={{ color: vehicle.transferType === 'vip' ? colors.warning[700] : colors.success[700], fontSize: 11 }}
                          >
                            {vehicle.transferType === 'vip' ? 'VIP' : 'Servis'}
                          </Chip>
                          <Text variant="bodySmall" style={styles.vehicleSpecs}>
                            {vehicle.passengerCapacity} kişilik
                          </Text>
                        </View>
                        <VehicleStatusChip
                          status={vehicle.verificationStatus}
                          rejectionReason={vehicle.verificationRejectionReason}
                        />
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        {vehicle.verificationStatus !== 'approved' && (
                          <FkButton variant="ghost" icon="pencil" size="sm" onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle.id, vehicleType: 'transfer' })}>
                            Düzenle
                          </FkButton>
                        )}
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor={colors.danger[600]}
                          onPress={() => handleDeleteTransfer(vehicle.id, vehicle.plate)}
                          disabled={deletingVehicleId === vehicle.id}
                        />
                      </View>
                    </View>
                  
                </FkCard>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı transfer aracınız bulunmuyor.</Text>
            )}
            </JobSection>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral[100],
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 1000,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  card: {
    marginBottom: 20,
  },
  vehicleCard: {
    marginBottom: 12,
  },
  vehicleHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  vehicleInfo: {
    flex: 1,
  },
  vehiclePlate: {
    fontWeight: 'bold',
    fontSize: 16,
  },
  vehicleDetails: {
    color: colors.neutral[500],
    marginTop: 4,
  },
  vehicleSpecs: {
    color: colors.neutral[500],
    marginTop: 2,
    fontSize: 12,
  },
  priceText: {
    color: colors.primary[500],
    fontWeight: 'bold',
    marginTop: 4,
    fontSize: 12,
  },
  equipmentSection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: colors.neutral[200],
  },
  equipmentLabel: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: colors.neutral[500],
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  equipmentChip: {
    backgroundColor: colors.info[50],
    marginBottom: 4,
  },
  moreText: {
    color: colors.neutral[500],
    fontStyle: 'italic',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: colors.neutral[500],
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
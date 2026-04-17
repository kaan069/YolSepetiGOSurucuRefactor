import React, { useState, useCallback } from 'react';
import { StyleSheet, ScrollView, View, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, IconButton, Chip } from 'react-native-paper';
import { useVehicleStore } from '../../store/useVehicleStore';
import LoadingSpinner from '../../components/LoadingSpinner';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation';
import { vehiclesAPI } from '../../api';
import { useFocusEffect } from '@react-navigation/native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../../api/types';
import AppBar from '../../components/common/AppBar';
import { useAppTheme } from '../../hooks/useAppTheme';

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
          console.log('');
          console.log('═══════════════════════════════════════════════');
          console.log('🚗 [VehiclesScreen] ARAÇ YÜKLEME BAŞLIYOR');
          console.log('═══════════════════════════════════════════════');

          // Token kontrolü - eğer token yoksa loading'i durdur (logout sonrası olabilir)
          const accessToken = await AsyncStorage.getItem('access_token');
          if (!accessToken) {
            console.log('⚠️ [VehiclesScreen] Token yok, araç yükleme atlanıyor (logout sonrası olabilir)');
            setLoading(false);
            return;
          }

          // AsyncStorage'dan kullanıcı bilgisini yükle
          const userJson = await AsyncStorage.getItem('user');
          let loadedUserTypes: string[] = [];
          if (userJson) {
            const user: User = JSON.parse(userJson);
            loadedUserTypes = user.user_type || [];
            setUserServiceTypes(loadedUserTypes);
            console.log('👤 [VehiclesScreen] Kullanıcı servisleri:', user.user_type);
          }

          // Service types'ı kontrol et (yüklenen değerler ile)
          console.log('🔍 [VehiclesScreen] Service types kontrolü:');
          console.log('   • Tow (towTruck):', loadedUserTypes.includes('towTruck'));
          console.log('   • Crane:', loadedUserTypes.includes('crane'));
          console.log('   • Transport:', loadedUserTypes.includes('transport'));
          console.log('   • Nakliye:', loadedUserTypes.includes('nakliye'));
          console.log('   • RoadAssistance:', loadedUserTypes.includes('roadAssistance'));

          // Mevcut araçları logla
          console.log('📦 [VehiclesScreen] Mevcut araçlar (store):');
          console.log('   • Tow trucks:', towTrucks?.length || 0);
          console.log('   • Cranes:', cranes?.length || 0);
          console.log('   • Transports:', transports?.length || 0);
          console.log('   • HomeMoving:', homeMoving?.length || 0);
          console.log('   • RoadAssistance:', roadAssistance?.length || 0);

          console.log("🌐 [VehiclesScreen] Backend\\'den araçlar yükleniyor...");
          await vehiclesAPI.loadUserVehicles();
          console.log('✅ [VehiclesScreen] Backend yükleme başarılı');

          // Yükleme sonrası araçları logla
          const state = useVehicleStore.getState();
          console.log('📦 [VehiclesScreen] Yükleme sonrası araçlar:');
          console.log('   • Tow trucks:', state.towTrucks?.length || 0);
          console.log('   • Cranes:', state.cranes?.length || 0);
          console.log('   • Transports:', state.transports?.length || 0);
          console.log('   • HomeMoving:', state.homeMoving?.length || 0);
          console.log('   • RoadAssistance:', state.roadAssistance?.length || 0);

          console.log('═══════════════════════════════════════════════');
          console.log('');
        } catch (error: any) {
          console.error('');
          console.error('═══════════════════════════════════════════════');
          console.error('❌ [VehiclesScreen] ARAÇ YÜKLEME HATASI');
          console.error('═══════════════════════════════════════════════');
          console.error('   • Error:', error);
          console.error('   • Message:', error?.message);
          console.error('   • Response status:', error?.response?.status);
          console.error('   • Response data:', error?.response?.data);
          console.error('═══════════════════════════════════════════════');
          console.error('');

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
              console.error('Delete tow truck error:', error);
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
              console.error('Delete crane error:', error);
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
              console.error('Delete nakliye vehicle error:', error);
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
              console.error('Delete road assistance error:', error);
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
              console.error('Delete transfer error:', error);
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
          <Text style={{ marginTop: 12, color: '#666' }}>Araçlar yükleniyor...</Text>
        </View>
      )}
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent}>
        {/* Tow Trucks Card - Only show if user registered for tow service */}
        {hasServiceType('tow') && (
          <Card style={styles.card}>
            <Card.Title
              title={`🚛 Çekici Araçlarım (${towTrucks?.length || 0})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('TowTruckDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {towTrucks && towTrucks.length > 0 ? (
              towTrucks.map((truck) => (
                <Card key={truck.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {truck.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {truck.brand} {truck.model} - {truck.year}
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          {truck.platformType === 'open' && '🚛 Açık Platform'}
                          {truck.platformType === 'closed' && '🚚 Kapalı Kasa'}
                          {truck.platformType === 'flatbed' && '🛻 Düz Platform'}
                        </Text>

                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => navigation.navigate('EditVehicle', { vehicleId: truck.id, vehicleType: 'tow' })}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#d32f2f"
                          onPress={() => handleDeleteTowTruck(truck.id, truck.plate)}
                          disabled={deletingVehicleId === truck.id}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı çekici aracınız bulunmuyor.</Text>
            )}
            </Card.Content>
          </Card>
        )}

        {/* Cranes Card - Only show if user registered for crane service */}
        {hasServiceType('crane') && (
          <Card style={styles.card}>
          <Card.Title
            title={`🏗️ Vinç Araçlarım (${cranes?.length || 0})`}
            right={(props) => <Button {...props} onPress={() => navigation.navigate('CraneDetails')}>Yeni Ekle</Button>}
          />
          <Card.Content>
            {cranes && cranes.length > 0 ? (
              cranes.map((crane) => (
                <Card key={crane.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
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
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => navigation.navigate('EditVehicle', { vehicleId: crane.id, vehicleType: 'crane' })}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#d32f2f"
                          onPress={() => handleDeleteCrane(crane.id, crane.plate)}
                          disabled={deletingVehicleId === crane.id}
                        />
                      </View>
                    </View>

                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı vinç aracınız bulunmuyor.</Text>
            )}
          </Card.Content>
        </Card>
        )}

        {/* Transport Vehicles Card - Only show if user registered for transport service */}
        {hasServiceType('transport') && (
          <Card style={styles.card}>
            <Card.Title
              title={`🚚 Nakliye Araçlarım (${transports?.length || 0})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('TransportDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {transports && transports.length > 0 ? (
              transports.map((transport) => (
                <Card key={transport.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
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
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => navigation.navigate('EditVehicle', { vehicleId: transport.id, vehicleType: 'transport' })}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#d32f2f"
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
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı nakliye aracınız bulunmuyor.</Text>
            )}
            </Card.Content>
          </Card>
        )}

        {/* Nakliye (Evden Eve) Vehicles Card */}
        {hasServiceType('nakliye') && (
          <Card style={styles.card}>
            <Card.Title
              title={`🏠 Evden Eve Nakliye (${homeMoving?.length || 0})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('HomeMovingDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {homeMoving && homeMoving.length > 0 ? (
              homeMoving.map((vehicle) => (
                <Card key={vehicle.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
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
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle.id, vehicleType: 'homeMoving' })}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#d32f2f"
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
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı nakliye aracınız bulunmuyor.</Text>
            )}
            </Card.Content>
          </Card>
        )}

        {/* Road Assistance Card */}
        {hasServiceType('roadAssistance') && (
          <Card style={styles.card}>
            <Card.Title
              title={`🔧 Yol Yardım Hizmetleri (${roadAssistance?.length || 0})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('RoadAssistanceDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {roadAssistance && roadAssistance.length > 0 ? (
              roadAssistance.map((service) => (
                <Card key={service.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {service.plate || 'Yol Yardım Hizmeti'}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {service.brand} {service.model} {service.year ? `- ${service.year}` : ''}
                        </Text>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => navigation.navigate('EditVehicle', { vehicleId: service.id, vehicleType: 'roadAssistance' })}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#d32f2f"
                          onPress={() => handleDeleteRoadAssistance(service.id)}
                          disabled={deletingVehicleId === service.id}
                        />
                      </View>
                    </View>

                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı yol yardım hizmetiniz bulunmuyor.</Text>
            )}
            </Card.Content>
          </Card>
        )}

        {/* Transfer Araçlarım */}
        {hasServiceType('transfer') && (
          <Card style={styles.card}>
            <Card.Title
              title={`🚐 Transfer Araçlarım (${transfers?.length || 0})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('TransferVehicleDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {transfers && transfers.length > 0 ? (
              transfers.map((vehicle) => (
                <Card key={vehicle.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
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
                            style={{ backgroundColor: vehicle.transferType === 'vip' ? '#FFF3E0' : '#E8F5E9' }}
                            textStyle={{ color: vehicle.transferType === 'vip' ? '#E65100' : '#2E7D32', fontSize: 11 }}
                          >
                            {vehicle.transferType === 'vip' ? '⭐ VIP' : '🚌 Servis'}
                          </Chip>
                          <Text variant="bodySmall" style={styles.vehicleSpecs}>
                            {vehicle.passengerCapacity} kişilik
                          </Text>
                        </View>
                      </View>
                      <View style={{ flexDirection: 'row' }}>
                        <IconButton
                          icon="pencil"
                          size={20}
                          onPress={() => navigation.navigate('EditVehicle', { vehicleId: vehicle.id, vehicleType: 'transfer' })}
                        />
                        <IconButton
                          icon="delete"
                          size={20}
                          iconColor="#d32f2f"
                          onPress={() => handleDeleteTransfer(vehicle.id, vehicle.plate)}
                          disabled={deletingVehicleId === vehicle.id}
                        />
                      </View>
                    </View>
                  </Card.Content>
                </Card>
              ))
            ) : (
              <Text style={styles.emptyText}>Kayıtlı transfer aracınız bulunmuyor.</Text>
            )}
            </Card.Content>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
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
    color: '#666',
    marginTop: 4,
  },
  vehicleSpecs: {
    color: '#666',
    marginTop: 2,
    fontSize: 12,
  },
  priceText: {
    color: '#26a69a',
    fontWeight: 'bold',
    marginTop: 4,
    fontSize: 12,
  },
  equipmentSection: {
    marginTop: 12,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
  },
  equipmentLabel: {
    fontWeight: 'bold',
    marginBottom: 6,
    color: '#666',
  },
  equipmentTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 4,
    alignItems: 'center',
  },
  equipmentChip: {
    backgroundColor: '#e3f2fd',
    marginBottom: 4,
  },
  moreText: {
    color: '#666',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  emptyText: {
    textAlign: 'center',
    color: '#666',
    fontStyle: 'italic',
    paddingVertical: 20,
  },
});
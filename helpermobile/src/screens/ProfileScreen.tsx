import React from 'react';
import { StyleSheet, ScrollView, View, FlatList, Alert, Clipboard } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, TextInput, IconButton, Chip, Divider } from 'react-native-paper';
import { useAuthStore } from '../store/authStore';
import { useVehicleStore } from '../store/useVehicleStore';
import { useRegistrationDataStore } from '../store/useRegistrationDataStore';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { RootStackParamList } from '../navigation';
import { useNotificationStore } from '../store/notificationStore';
import { scheduleLocalNotification } from '../lib/notifications';
import * as Notifications from 'expo-notifications';
import { logger } from '../utils/logger';

type Props = NativeStackScreenProps<RootStackParamList, 'ProfileTab'>;

export default function ProfileScreen({ navigation }: Props) {
  const { currentUser, logout } = useAuthStore();
  const { towTrucks, cranes, transports, removeTowTruck, removeCrane, removeTransport } = useVehicleStore();
  const { logAllData, hasServiceType } = useRegistrationDataStore();
  const { fcmToken } = useNotificationStore();

  // State for the personal info form.
  // Kişisel bilgi formu için state.
  const [fullName, setFullName] = React.useState(currentUser?.fullName ?? '');
  const [phoneNumber, setPhoneNumber] = React.useState(currentUser?.phone_number ?? '');

  const saveProfile = () => {
    // In a real app, this would call a PATCH /users/me endpoint.
    // Gerçek bir uygulamada, bu bir PATCH /users/me endpoint'ini çağırırdı.
    alert('Profil kaydedildi (mock).');
  };

  const handleDebugData = () => {
    // Sanitized dev-only snapshot — PII dump etmez.
    logAllData();
    logger.debug('general', 'ProfileScreen.debugSnapshot', {
      vehicleCounts: {
        towTrucks: towTrucks.length,
        cranes: cranes.length,
      },
      hasCurrentUser: !!currentUser,
    });
    alert('Geliştirme modunda log çıktısı yazıldı.');
  };

  // Local bildirim gönder (uygulama içi)
  const handleSendLocalNotification = async () => {
    try {
      await scheduleLocalNotification(
        '🚗 Yeni İş Teklifi!',
        'Yakınınızda bir çekici talebi var. Teklif göndermek ister misiniz?',
        { screen: 'Home', jobId: 'test-123' },
        2 // 2 saniye sonra
      );
      Alert.alert('Başarılı', 'Local bildirim 2 saniye içinde gelecek!');
    } catch (error) {
      logger.error('fcm', 'ProfileScreen.localNotification failure');
      Alert.alert('Hata', 'Local bildirim gönderilemedi.');
    }
  };

  // Push bildirim test (sadece UI test için)
  const handleSendPushNotification = async () => {
    try {
      // Simüle edilmiş push notification
      await Notifications.scheduleNotificationAsync({
        content: {
          title: '💰 Ödeme Alındı',
          body: '500 TL ödemeniz hesabınıza aktarıldı.',
          data: { screen: 'Earnings', amount: 500 },
          sound: true,
        },
        trigger: {
          type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL,
          seconds: 2,
          repeats: false,
        },
      });
      Alert.alert('Başarılı', 'Push notification simülasyonu 2 saniye içinde gelecek!');
    } catch (error) {
      logger.error('fcm', 'ProfileScreen.pushSimulation failure');
      Alert.alert('Hata', 'Push notification simülasyonu gönderilemedi.');
    }
  };

  // FCM token'ı kopyala
  const handleCopyToken = () => {
    if (fcmToken) {
      Clipboard.setString(fcmToken);
      Alert.alert('Kopyalandı', 'FCM Token panoya kopyalandı!');
    } else {
      Alert.alert('Uyarı', 'FCM Token henüz alınmadı. Production build\'de görünecek.');
    }
  };

  const handleDeleteTowTruck = (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı çekici aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            removeTowTruck(vehicleId);
            alert('Çekici araç başarıyla silindi.');
          }
        }
      ]
    );
  };

  const handleDeleteCrane = (vehicleId: string, plate: string) => {
    Alert.alert(
      'Aracı Sil',
      `${plate} plakalı vinç aracını silmek istediğinize emin misiniz?`,
      [
        { text: 'İptal', style: 'cancel' },
        { 
          text: 'Sil', 
          style: 'destructive',
          onPress: () => {
            removeCrane(vehicleId);
            alert('Vinç araç başarıyla silindi.');
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

  // Helper function to get vehicle type name in Turkish
  // Araç türü adını Türkçe olarak döndüren yardımcı fonksiyon
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      <ScrollView style={styles.content}>
        {/* Personal Info Card */}
        {/* Kişisel Bilgiler Kartı */}
        <Card style={styles.card}>
          <Card.Title title="Profil Ayarları" />
          <Card.Content>
            <TextInput label="Ad Soyad" value={fullName} onChangeText={setFullName} />
            <TextInput
              label="Telefon"
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              style={{ marginTop: 8 }}
            />
            <Button mode="contained" onPress={saveProfile} style={{ marginTop: 12 }}>
              Bilgileri Kaydet
            </Button>
          </Card.Content>
        </Card>

        {/* Tow Trucks Card - Only show if user registered for tow service */}
        {/* Çekici Araçları Kartı - Sadece çekici servisi için kayıt olmuş kullanıcılara göster */}
        {hasServiceType('towTruck') && (
          <Card style={styles.card}>
            <Card.Title
              title={`🚛 Çekici Araçlarım (${towTrucks.length})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('TowTruckDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {towTrucks.length > 0 ? (
              towTrucks.map((truck) => (
                <Card key={truck.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {truck.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {truck.brand} {truck.model}
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          {truck.year && `${truck.year} • `}
                          {truck.color && `${truck.color} • `}
                          {truck.platformType === 'open' && 'Açık Platform'}
                          {truck.platformType === 'closed' && 'Kapalı Kasa'}
                          {truck.platformType === 'flatbed' && 'Düz Platform'}
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
        {/* Vinç Araçları Kartı - Sadece vinç servisi için kayıt olmuş kullanıcılara göster */}
        {hasServiceType('crane') && (
          <Card style={styles.card}>
          <Card.Title
            title={`🏗️ Vinç Araçlarım (${cranes.length})`}
            right={(props) => <Button {...props} onPress={() => navigation.navigate('CraneDetails')}>Yeni Ekle</Button>}
          />
          <Card.Content>
            {cranes.length > 0 ? (
              cranes.map((crane) => (
                <Card key={crane.id} mode="outlined" style={styles.vehicleCard}>
                  <Card.Content>
                    <View style={styles.vehicleHeader}>
                      <View style={styles.vehicleInfo}>
                        <Text variant="titleMedium" style={styles.vehiclePlate}>
                          {crane.plate}
                        </Text>
                        <Text variant="bodyMedium" style={styles.vehicleDetails}>
                          {crane.brand} {crane.model}
                        </Text>
                        <Text variant="bodySmall" style={styles.vehicleSpecs}>
                          {crane.year && `${crane.year} • `}
                          {crane.color && `${crane.color} • `}
                          Max: {crane.maxHeight}m yükseklik
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
        {/* Nakliye Araçları Kartı - Sadece nakliye servisi için kayıt olmuş kullanıcılara göster */}
        {(hasServiceType('homeToHomeMoving') || hasServiceType('cityToCity')) && (
          <Card style={styles.card}>
            <Card.Title
              title={`🚚 Nakliye Araçlarım (${transports.length})`}
              right={(props) => <Button {...props} onPress={() => navigation.navigate('TransportDetails')}>Yeni Ekle</Button>}
            />
            <Card.Content>
            {transports.length > 0 ? (
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

        {/* Notification Test Section - Development Only */}
        {/* Bildirim Test Bölümü - Sadece Geliştirme */}
        <Card style={styles.card}>
          <Card.Title title="🔔 Bildirim Test Araçları" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.sectionDescription}>
              Bildirim sistemini test etmek için aşağıdaki butonları kullanın
            </Text>

            <Divider style={styles.divider} />

            {/* Local Notification Test */}
            <View style={styles.testSection}>
              <Text variant="titleSmall" style={styles.testTitle}>
                📱 Uygulama İçi Bildirim (Local)
              </Text>
              <Text variant="bodySmall" style={styles.testDescription}>
                Uygulama içinde banner olarak gösterilir
              </Text>
              <Button
                mode="contained"
                onPress={handleSendLocalNotification}
                icon="bell-outline"
                style={styles.testButton}
              >
                Local Bildirim Gönder
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* Push Notification Test */}
            <View style={styles.testSection}>
              <Text variant="titleSmall" style={styles.testTitle}>
                📲 Üstten Bildirim (Push)
              </Text>
              <Text variant="bodySmall" style={styles.testDescription}>
                Sistem bildirimi olarak üstten gelir
              </Text>
              <Button
                mode="contained"
                onPress={handleSendPushNotification}
                icon="bell-ring-outline"
                style={styles.testButton}
                buttonColor="#f97316"
              >
                Push Bildirim Gönder
              </Button>
            </View>

            <Divider style={styles.divider} />

            {/* FCM Token Display */}
            <View style={styles.testSection}>
              <Text variant="titleSmall" style={styles.testTitle}>
                🔑 FCM Token
              </Text>
              <Text variant="bodySmall" style={styles.testDescription}>
                Production build'de Firebase'den bildirim göndermek için kullanın
              </Text>

              <Card mode="outlined" style={styles.tokenCard}>
                <Card.Content>
                  {fcmToken ? (
                    <>
                      <Text variant="bodySmall" style={styles.tokenLabel}>
                        Token:
                      </Text>
                      <Text variant="bodySmall" style={styles.tokenText} selectable>
                        {fcmToken}
                      </Text>
                      <Button
                        mode="outlined"
                        onPress={handleCopyToken}
                        icon="content-copy"
                        style={styles.copyButton}
                        compact
                      >
                        Kopyala
                      </Button>
                    </>
                  ) : (
                    <View style={styles.noTokenContainer}>
                      <Text variant="bodyMedium" style={styles.noTokenText}>
                        ⚠️ Token henüz alınmadı
                      </Text>
                      <Text variant="bodySmall" style={styles.noTokenSubtext}>
                        Expo Go'da FCM token alınamaz. Production build yapın.
                      </Text>
                    </View>
                  )}
                </Card.Content>
              </Card>
            </View>
          </Card.Content>
        </Card>

        {/* Debug Section - Only for Development */}
        <Card style={styles.card}>
          <Card.Title title="🐛 Geliştirici Araçları" />
          <Card.Content>
            <Text variant="bodyMedium" style={styles.debugText}>
              Backend entegrasyonu için tüm kayıt verilerini konsola yazdır
            </Text>
            <Button
              mode="contained-tonal"
              onPress={handleDebugData}
              style={styles.debugButton}
              icon="console"
            >
              Tüm Verileri Console'a Yazdır
            </Button>
          </Card.Content>
        </Card>

        <Button mode="text" onPress={logout} style={{ marginTop: 24, marginBottom: 24 }}>
          Çıkış Yap
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    flex: 1,
    padding: 16,
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
  debugText: {
    color: '#666',
    marginBottom: 12,
    textAlign: 'center',
  },
  debugButton: {
    backgroundColor: '#fff3e0',
  },
  sectionDescription: {
    color: '#666',
    marginBottom: 8,
    textAlign: 'center',
  },
  divider: {
    marginVertical: 16,
  },
  testSection: {
    marginBottom: 8,
  },
  testTitle: {
    fontWeight: 'bold',
    marginBottom: 4,
    color: '#333',
  },
  testDescription: {
    color: '#666',
    marginBottom: 12,
    fontSize: 12,
  },
  testButton: {
    marginTop: 8,
  },
  tokenCard: {
    marginTop: 12,
    backgroundColor: '#f5f5f5',
  },
  tokenLabel: {
    fontWeight: 'bold',
    color: '#666',
    marginBottom: 8,
  },
  tokenText: {
    fontFamily: 'monospace',
    fontSize: 11,
    color: '#333',
    backgroundColor: '#fff',
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  copyButton: {
    alignSelf: 'flex-start',
  },
  noTokenContainer: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  noTokenText: {
    color: '#ff9800',
    fontWeight: 'bold',
    marginBottom: 4,
  },
  noTokenSubtext: {
    color: '#666',
    textAlign: 'center',
    fontSize: 12,
  },
});

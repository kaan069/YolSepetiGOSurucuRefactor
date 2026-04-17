// This screen shows the details of a pending job and allows the driver to accept it.
// Bu ekran, bekleyen bir işin detaylarını gösterir ve sürücünün işi kabul etmesine olanak tanır.
// NOT: Bu ekran eski bir ekrandır. Modern versiyonlar TowTruckOfferScreen, CraneOfferScreen vb. kullanılır.
import React, { useState, useEffect } from 'react';
import { View, StyleSheet, ScrollView, Linking, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Button, Card, Text, Divider, ActivityIndicator } from 'react-native-paper';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as Location from 'expo-location';
import { ensureForegroundPermission } from '../utils/locationPermission';
import { RootStackParamList } from '../navigation';
import { requestsAPI, CraneRequest, TowTruckRequestDetail } from '../api';
import AppBar from '../components/common/AppBar';
import DistanceMetrics from '../components/offer/DistanceMetrics';
import VehicleStatusGrid from '../components/offer/VehicleStatusGrid';
import LocationAddresses from '../components/offer/LocationAddresses';
import MapWithRoute from '../components/offer/MapWithRoute';

type Props = NativeStackScreenProps<RootStackParamList, 'Offer'>;

// Utility function to calculate distance between two coordinates
const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number): number => {
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c;
  return Math.round(distance * 10) / 10;
};

// Function to get address details from coordinates using reverse geocoding
const getAddressDetails = async (latitude: number, longitude: number) => {
  try {
    const results = await Location.reverseGeocodeAsync({ latitude, longitude });
    if (results.length > 0) {
      const address = results[0];
      return {
        district: address.district || address.subregion || '',
        neighborhood: address.street || address.name || '',
      };
    }
  } catch (error) {
    console.error('Reverse geocoding error:', error);
  }
  return { district: '', neighborhood: '' };
};

export default function OfferScreen({ route, navigation }: Props) {
  const { orderId } = route.params;

  const [currentLocation, setCurrentLocation] = useState<{latitude: number, longitude: number} | null>(null);
  const [addressDetails, setAddressDetails] = useState<{district: string, neighborhood: string}>({district: '', neighborhood: ''});
  const [distance, setDistance] = useState<number | null>(null);
  const [craneRequest, setCraneRequest] = useState<CraneRequest | null>(null);
  const [towTruckRequest, setTowTruckRequest] = useState<TowTruckRequestDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [isCraneRequest, setIsCraneRequest] = useState(false);
  const [isTowTruckRequest, setIsTowTruckRequest] = useState(false);

  // Fetch request from backend
  useEffect(() => {
    const fetchRequest = async () => {
      try {
        setLoading(true);
        // Try to fetch as crane request first
        try {
          const craneReq = await requestsAPI.getCraneRequestDetail(parseInt(orderId));
          setCraneRequest(craneReq);
          setIsCraneRequest(true);
          console.log('Fetched crane request detail:', craneReq);
        } catch (craneError) {
          // If crane request fails, try tow truck request
          try {
            const towReq = await requestsAPI.getTowTruckRequestDetail(parseInt(orderId));
            setTowTruckRequest(towReq);
            setIsTowTruckRequest(true);
            console.log('Fetched tow truck request detail:', towReq);
          } catch (towError) {
            console.error('Failed to fetch both crane and tow truck request:', { craneError, towError });
          }
        }
      } finally {
        setLoading(false);
      }
    };

    fetchRequest();
  }, [orderId]);

  // Get current location
  useEffect(() => {
    const getCurrentLocation = async () => {
      try {
        const granted = await ensureForegroundPermission();
        if (!granted) {
          console.log('Location permission not granted');
          return;
        }

        const location = await Location.getCurrentPositionAsync({});
        setCurrentLocation({
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      } catch (error) {
        console.error('Error getting location:', error);
      }
    };

    getCurrentLocation();
  }, []);

  // Get address details and calculate distance
  useEffect(() => {
    if (currentLocation) {
      if (craneRequest) {
        const lat = parseFloat(craneRequest.latitude);
        const lng = parseFloat(craneRequest.longitude);

        getAddressDetails(lat, lng)
          .then(details => setAddressDetails(details));

        const dist = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          lat,
          lng
        );
        setDistance(dist);
      } else if (towTruckRequest) {
        const lat = parseFloat(towTruckRequest.pickup_latitude);
        const lng = parseFloat(towTruckRequest.pickup_longitude);

        getAddressDetails(lat, lng)
          .then(details => setAddressDetails(details));

        const dist = calculateDistance(
          currentLocation.latitude,
          currentLocation.longitude,
          lat,
          lng
        );
        setDistance(dist);
      }
    }
  }, [craneRequest, towTruckRequest, currentLocation]);

  // Handle job acceptance - redirect to proper offer screen
  const handleAccept = () => {
    if (isCraneRequest) {
      navigation.replace('CraneOffer', { orderId });
    } else if (isTowTruckRequest) {
      navigation.replace('TowTruckOffer', { orderId });
    } else {
      Alert.alert('Hata', 'Teklif ekranı bulunamadı');
    }
  };

  // Open location in Google Maps
  const openInGoogleMaps = (locationType: 'pickup' | 'dropoff' = 'pickup') => {
    let latitude: number;
    let longitude: number;

    if (craneRequest) {
      latitude = parseFloat(craneRequest.latitude);
      longitude = parseFloat(craneRequest.longitude);
    } else if (towTruckRequest) {
      if (locationType === 'pickup') {
        latitude = parseFloat(towTruckRequest.pickup_latitude);
        longitude = parseFloat(towTruckRequest.pickup_longitude);
      } else {
        latitude = parseFloat(towTruckRequest.dropoff_latitude);
        longitude = parseFloat(towTruckRequest.dropoff_longitude);
      }
    } else {
      Alert.alert('Hata', 'Konum bilgisi bulunamadı');
      return;
    }

    const scheme = Platform.select({
      ios: 'maps:',
      android: 'geo:',
    });
    const url = Platform.select({
      ios: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
      android: `${scheme}${latitude},${longitude}?q=${latitude},${longitude}`,
    });

    if (url) {
      Linking.canOpenURL(url).then((supported) => {
        if (supported) {
          Linking.openURL(url);
        } else {
          const webUrl = `https://www.google.com/maps/search/?api=1&query=${latitude},${longitude}`;
          Linking.openURL(webUrl);
        }
      }).catch((err) => {
        console.error('Error opening maps:', err);
        Alert.alert('Hata', 'Harita açılırken bir hata oluştu');
      });
    }
  };

  // Show loading state
  if (loading) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={["bottom"]}>
        <AppBar title="Teklif" />
        <ActivityIndicator size="large" />
        <Text style={{ marginTop: 16 }}>Talep detayları yükleniyor...</Text>
      </SafeAreaView>
    );
  }

  // If no request found, show error
  if (!craneRequest && !towTruckRequest) {
    return (
      <SafeAreaView style={[styles.container, { justifyContent: 'center', alignItems: 'center' }]} edges={["bottom"]}>
        <AppBar title="Teklif" />
        <Text>Talep bulunamadı.</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["bottom"]}>
      <AppBar title="Teklif" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
      {/* Map and Location Information */}
      {towTruckRequest ? (
        <>
          <MapWithRoute
            pickupLatitude={towTruckRequest.pickup_latitude}
            pickupLongitude={towTruckRequest.pickup_longitude}
            pickupAddress={towTruckRequest.pickup_address}
            dropoffLatitude={towTruckRequest.dropoff_latitude}
            dropoffLongitude={towTruckRequest.dropoff_longitude}
            dropoffAddress={towTruckRequest.dropoff_address}
            title="Güzergah"
          />

          <Card style={styles.mapCard}>
            <Card.Content>
              <DistanceMetrics
                distanceToCustomer={distance}
                routeDistance={towTruckRequest.route_distance}
                routeDuration={towTruckRequest.route_duration}
              />

              <LocationAddresses
                pickupAddress={towTruckRequest.pickup_address}
                dropoffAddress={towTruckRequest.dropoff_address}
              />

              <Button
                icon="map-marker"
                mode="contained"
                style={{ marginTop: 10 }}
                onPress={() => openInGoogleMaps('pickup')}
              >
                Alınacak Konuma Git
              </Button>
              <Button
                icon="map-marker-check"
                mode="contained-tonal"
                style={{ marginTop: 8 }}
                onPress={() => openInGoogleMaps('dropoff')}
              >
                Bırakılacak Konuma Git
              </Button>
            </Card.Content>
          </Card>
        </>
      ) : (
        <Card style={styles.mapCard}>
          <Card.Title title={isCraneRequest ? "Vinç Talebi Konumu" : "Müşteri Konumu"} />
          <Card.Content>
            <View style={styles.locationInfo}>
              {addressDetails.district && (
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>İlçe:</Text>
                  <Text style={styles.addressValue}>{addressDetails.district}</Text>
                </View>
              )}
              {addressDetails.neighborhood && (
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Mahalle:</Text>
                  <Text style={styles.addressValue}>{addressDetails.neighborhood}</Text>
                </View>
              )}
              {distance && (
                <View style={styles.addressRow}>
                  <Text style={styles.addressLabel}>Uzaklık:</Text>
                  <Text style={[styles.addressValue, styles.distanceText]}>{distance} km</Text>
                </View>
              )}
            </View>
            <Button
              icon="directions"
              mode="contained"
              style={{ marginTop: 10 }}
              onPress={() => openInGoogleMaps('pickup')}
            >
              Yol Tarifi Al
            </Button>
          </Card.Content>
        </Card>
      )}

      {/* Request Details Card */}
      <Card>
        <Card.Title
          title={isCraneRequest ? "Vinç Talebi Detayları" : isTowTruckRequest ? "Çekici Talebi Detayları" : "Talep Detayları"}
          subtitle={`Talep #${orderId.slice(0, 6)}`}
        />
        <Card.Content>
          {isTowTruckRequest && towTruckRequest ? (
            <>
              <Text style={styles.label}>Alınacak Konum:</Text>
              <Text>{towTruckRequest.pickup_address}</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Bırakılacak Konum:</Text>
              <Text>{towTruckRequest.dropoff_address}</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Araç Tipi:</Text>
              <Text>{towTruckRequest.vehicle_type}</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Mesafe & Süre:</Text>
              <Text>{towTruckRequest.route_distance} • {towTruckRequest.route_duration}</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Araç Durumu:</Text>
              <VehicleStatusGrid
                isRunning={towTruckRequest.is_running ?? false}
                runningNote={towTruckRequest.running_note}
                isGearStuck={towTruckRequest.is_gear_stuck ?? false}
                gearNote={towTruckRequest.gear_note}
                isTireLocked={towTruckRequest.is_tire_locked ?? false}
                tireNote={towTruckRequest.tire_note}
                isStuck={towTruckRequest.is_stuck ?? false}
                stuckNote={towTruckRequest.stuck_note}
                isCrashed={towTruckRequest.is_crashed ?? false}
                crashedNote={towTruckRequest.crashed_note}
              />

              {towTruckRequest.has_extra_attachments && (
                <>
                  <Divider style={styles.divider} />
                  <Text style={styles.label}>Ekstra Ekipmanlar:</Text>
                  {towTruckRequest.attachment_types && towTruckRequest.attachment_types.length > 0 ? (
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6, marginTop: 4 }}>
                      {towTruckRequest.attachment_types.map((attachment, index) => (
                        <View key={index} style={styles.chip}>
                          <Text style={styles.chipText}>{attachment}</Text>
                        </View>
                      ))}
                    </View>
                  ) : (
                    <Text>Belirtilmemiş</Text>
                  )}
                </>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>Tahmini Kazanç:</Text>
              <Text style={styles.price}>Teklif Verilecek</Text>
            </>
          ) : isCraneRequest && craneRequest ? (
            <>
              <Text style={styles.label}>Konum:</Text>
              <Text>{craneRequest.address}</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Yük Tipi:</Text>
              <Text>{craneRequest.load_type}</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Yük Ağırlığı:</Text>
              <Text>{craneRequest.load_weight} kg</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Kaldırma Yüksekliği:</Text>
              <Text>{craneRequest.lift_height} m</Text>
              <Divider style={styles.divider} />

              <Text style={styles.label}>Kat Bilgisi:</Text>
              <Text>{craneRequest.floor}</Text>
              <Divider style={styles.divider} />

              {craneRequest.has_obstacles && (
                <>
                  <Text style={styles.label}>Engeller:</Text>
                  <Text style={{ color: '#ff9800', fontWeight: 'bold' }}>⚠️ Engel var</Text>
                  {craneRequest.obstacle_note && <Text style={{ fontSize: 12, color: '#666', marginTop: 4 }}>{craneRequest.obstacle_note}</Text>}
                  <Divider style={styles.divider} />
                </>
              )}

              <Text style={[styles.label, { marginTop: 16 }]}>Tahmini Kazanç:</Text>
              <Text style={styles.price}>Teklif Verilecek</Text>
            </>
          ) : null}
        </Card.Content>
        <Card.Actions>
          <Button mode="contained" onPress={handleAccept} style={styles.button}>
            {isCraneRequest || isTowTruckRequest ? 'Teklif Ver' : 'Teklif Ver'}
          </Button>
        </Card.Actions>
      </Card>
    </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 100,
  },
  mapCard: {
    marginBottom: 16,
  },
  locationInfo: {
    marginTop: 10,
    marginBottom: 10,
    padding: 10,
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
  },
  addressRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  addressLabel: {
    fontWeight: 'bold',
    color: '#666',
    fontSize: 14,
  },
  addressValue: {
    color: '#333',
    fontSize: 14,
  },
  distanceText: {
    fontWeight: 'bold',
    color: '#26a69a',
  },
  label: {
    fontWeight: 'bold',
    fontSize: 16,
    marginBottom: 4,
  },
  price: {
    fontWeight: 'bold',
    fontSize: 24,
    color: 'green',
    textAlign: 'center',
    marginVertical: 16,
  },
  divider: {
    marginVertical: 8,
  },
  button: {
    flex: 1,
    margin: 8,
  },
  chip: {
    backgroundColor: '#e3f2fd',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#26a69a',
  },
  chipText: {
    color: '#26a69a',
    fontSize: 12,
    fontWeight: '600',
  },
});
